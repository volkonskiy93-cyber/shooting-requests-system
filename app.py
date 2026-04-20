"""
Flask приложение для системы заявок на видеосъемку
Программа "Доброе утро"
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import os
import json
from typing import Optional
from urllib.parse import quote
from dotenv import load_dotenv
from models import db, User, Application
from utils.excel_generator import create_excel_document
from utils.word_generator import create_word_document
from utils.email_sender import send_email_with_attachment
import re
import tempfile
from flask import after_this_request
from datetime import date, datetime
from sqlalchemy import inspect, text

# Загрузка переменных окружения из .env
load_dotenv()

# В production ключ должен приходить из переменных окружения.
# Никаких жестко зашитых ключей в коде.

app = Flask(__name__)
database_url = os.environ.get('DATABASE_URL', 'sqlite:///shooting_requests.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация расширений
db.init_app(app)
bcrypt = Bcrypt(app)

# Email настройки (получатели заявок)
DEFAULT_EMAIL_RECIPIENT = os.environ.get('EMAIL_RECIPIENT', 's_volkonskiy@utro.1tv.ru')
EMAIL_RECIPIENT_SHOOTING = os.environ.get('EMAIL_RECIPIENT_SHOOTING', DEFAULT_EMAIL_RECIPIENT)
EMAIL_RECIPIENT_PRODUCER = os.environ.get('EMAIL_RECIPIENT_PRODUCER', DEFAULT_EMAIL_RECIPIENT)

APPROVAL_PENDING = 'pending'
APPROVAL_APPROVED = 'approved'
APPROVAL_REJECTED = 'rejected'


# Создание таблиц базы данных при первом запуске
with app.app_context():
    db.create_all()
    inspector = inspect(db.engine)
    approved_at_column_type = 'TIMESTAMP' if db.engine.dialect.name == 'postgresql' else 'DATETIME'
    user_columns = {column['name'] for column in inspector.get_columns('users')}
    if 'role' not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'correspondent'"))
        db.session.commit()
    if 'full_name' not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
        db.session.commit()
    if 'approval_status' not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved'"))
        db.session.commit()
    if 'approved_at' not in user_columns:
        db.session.execute(text(f"ALTER TABLE users ADD COLUMN approved_at {approved_at_column_type}"))
        db.session.commit()
    if 'approved_by_email' not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN approved_by_email VARCHAR(255)"))
        db.session.commit()
    db.session.execute(text("UPDATE users SET role = 'correspondent' WHERE role IS NULL OR role = ''"))
    db.session.execute(text(
        "UPDATE users SET approval_status = 'approved' "
        "WHERE approval_status IS NULL OR approval_status = ''"
    ))
    db.session.execute(text(
        "UPDATE users SET approved_at = created_at "
        "WHERE approval_status = 'approved' AND approved_at IS NULL"
    ))
    db.session.commit()


def _role_redirect_url(role: str) -> str:
    return url_for('dashboard') if role == 'admin' else url_for('forms')


def _sync_session_user(user: Optional[User]):
    if not user:
        return
    session['user_id'] = user.id
    session['user_email'] = user.email
    session['user_role'] = user.role or 'correspondent'
    session['user_full_name'] = user.full_name or ''


def _clear_session():
    session.clear()


def _get_current_user() -> Optional[User]:
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)


def _get_active_user() -> Optional[User]:
    user = _get_current_user()
    if not user or user.approval_status != APPROVAL_APPROVED:
        if user is None or 'user_id' in session:
            _clear_session()
        return None
    _sync_session_user(user)
    return user


def _is_admin(user: Optional[User]) -> bool:
    return bool(user and user.role == 'admin')


def _user_can_access_application(user: Optional[User], application: Application) -> bool:
    return bool(user and (_is_admin(user) or application.user_id == user.id))


def _email_recipient_for_contractor(contractor: str) -> str:
    return EMAIL_RECIPIENT_PRODUCER if contractor == 'producer' else EMAIL_RECIPIENT_SHOOTING


def _get_session_user_role() -> str:
    user = _get_active_user()
    if not user:
        return 'correspondent'
    return user.role or 'correspondent'


# ==================== РОУТЫ ====================

@app.route('/')
def index():
    """Главная страница - авторизация и выбор роли"""
    user = _get_active_user()
    if user:
        return render_template(
            'index.html',
            user=user.email,
            user_role=user.role,
            user_name=user.full_name,
            approval_status=user.approval_status
        )
    return render_template('index.html', user=None, user_role=None, user_name=None, approval_status=None)


@app.route('/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, password):
        if user.approval_status == APPROVAL_PENDING:
            return jsonify({
                'success': False,
                'message': 'Ваш аккаунт еще не одобрен администратором.'
            }), 403
        if user.approval_status == APPROVAL_REJECTED:
            return jsonify({
                'success': False,
                'message': 'Доступ для этого аккаунта отклонен. Зарегистрируйтесь повторно или обратитесь к администратору.'
            }), 403

        _sync_session_user(user)
        return jsonify({
            'success': True,
            'user': {'email': user.email, 'role': user.role, 'fullName': user.full_name},
            'redirectUrl': _role_redirect_url(user.role or 'correspondent')
        })
    
    return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401


@app.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    full_name = data.get('full_name', '').strip() or f"{first_name} {last_name}".strip()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')
    
    if not email or not password or not full_name:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    
    if len(password) < 4:
        return jsonify({'success': False, 'message': 'Пароль должен быть не менее 4 символов'}), 400
    
    if password != password_confirm:
        return jsonify({'success': False, 'message': 'Пароли не совпадают'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        if existing_user.approval_status == APPROVAL_REJECTED:
            existing_user.full_name = full_name
            existing_user.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            existing_user.role = 'correspondent'
            existing_user.approval_status = APPROVAL_PENDING
            existing_user.approved_at = None
            existing_user.approved_by_email = None
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Заявка на доступ отправлена повторно. Дождитесь одобрения администратора.',
                'pendingApproval': True
            })
        return jsonify({'success': False, 'message': 'Пользователь с таким email уже зарегистрирован'}), 400
    
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        email=email,
        full_name=full_name,
        password_hash=password_hash,
        role='correspondent',
        approval_status=APPROVAL_PENDING
    )
    db.session.add(user)
    db.session.commit()
    _clear_session()
    return jsonify({
        'success': True,
        'message': 'Заявка на доступ отправлена. После одобрения администратором вы сможете войти в систему.',
        'pendingApproval': True,
        'user': {'email': user.email, 'fullName': user.full_name}
    })


@app.route('/logout', methods=['POST'])
def logout():
    """Выход из системы"""
    session.clear()
    return jsonify({'success': True})


@app.route('/forms')
def forms():
    """Страница корреспондента с формами заявок"""
    user = _get_active_user()
    if not user:
        return redirect(url_for('index'))
    return render_template('forms.html', user_profile=user.to_dict())


@app.route('/dashboard')
def dashboard():
    """Промежуточная панель доступа для администратора"""
    user = _get_active_user()
    if not user:
        return redirect(url_for('index'))
    if not _is_admin(user):
        return redirect(url_for('forms'))
    return render_template('dashboard.html', user_email=user.email)


@app.route('/admin')
def admin():
    """Страница администратора-координатора"""
    user = _get_active_user()
    if not user:
        return redirect(url_for('index'))
    if not _is_admin(user):
        return redirect(url_for('forms'))
    return render_template('admin.html')


@app.route('/archive')
def archive():
    """Страница архива заявок для корреспондента"""
    user = _get_active_user()
    if not user:
        return redirect(url_for('index'))
    return render_template('archive.html')


# ==================== API ENDPOINTS ====================

@app.route('/api/my-applications', methods=['GET'])
def get_my_applications():
    """Получить заявки текущего пользователя за последние 2 месяца"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Фильтр: 2 месяца назад
    two_months_ago = datetime.now() - timedelta(days=60)
    
    applications = Application.query.filter(
        Application.user_id == user.id,
        Application.created_at >= two_months_ago
    ).order_by(Application.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })

@app.route('/api/applications', methods=['GET'])
def get_applications():
    """Получить все заявки с фильтрами"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Параметры фильтрации
    status = request.args.get('status')
    contractor = request.args.get('contractor')
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_dir = request.args.get('sort_dir', 'desc').lower()
    
    query = Application.query if _is_admin(user) else Application.query.filter_by(user_id=user.id)
    
    if status:
        query = query.filter(Application.status == status)
    if contractor:
        query = query.filter(Application.contractor == contractor)
    if search:
        query = query.filter(
            Application.story_title.contains(search) |
            Application.annotation.contains(search) |
            Application.correspondent.contains(search)
        )
    if date_from:
        query = query.filter(Application.shooting_date >= date_from)
    if date_to:
        query = query.filter(Application.shooting_date <= date_to)
    
    sortable_columns = {
        'created_at': Application.created_at,
        'shooting_date': Application.shooting_date,
        'contractor': Application.contractor,
        'story_title': Application.story_title,
        'status': Application.status,
        'correspondent': Application.correspondent,
    }
    sort_column = sortable_columns.get(sort_by, Application.created_at)
    sort_expression = sort_column.asc() if sort_dir == 'asc' else sort_column.desc()

    applications = query.order_by(sort_expression, Application.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


@app.route('/api/applications', methods=['POST'])
def create_application():
    """Создать новую заявку"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    
    # Создание заявки
    application_date = _parse_date_yyyy_mm_dd(data.get('applicationDate'))
    shooting_date = _parse_date_yyyy_mm_dd(data.get('shootingDate'))
    broadcast_date = _parse_date_yyyy_mm_dd(data.get('broadcastDate'))

    application = Application(
        user_id=user.id,
        contractor=data.get('contractor'),
        story_title=data.get('storyTitle', ''),
        annotation=data.get('annotation', ''),
        notes=data.get('notes', ''),
        accreditation=data.get('accreditation', 'no'),
        director=data.get('director', ''),
        correspondent=data.get('correspondent', ''),
        producer=data.get('producer', ''),
        operator=data.get('operator', ''),
        video_engineer=data.get('videoEngineer', ''),
        application_date=application_date,
        shooting_date=shooting_date,
        start_time=data.get('startTime', ''),
        end_time=data.get('endTime', ''),
        broadcast_date=broadcast_date,
        equipment=json.dumps(data.get('equipment', [])),
        form_data=json.dumps(data)  # Сохраняем все данные формы
    )
    
    # Дополнительные поля для TTK
    if data.get('contractor') == 'ttk':
        application.clarifications = data.get('clarifications', '')
        application.extension = data.get('extension', '')
        application.car_number = data.get('carNumber', '')
        application.submission_date = _parse_datetime_local_to_date(data.get('submissionDate'))
    
    # Дополнительные поля для Producer
    if data.get('contractor') == 'producer':
        application.summary = data.get('summary', '')
        application.heroes = data.get('heroes', '')
        application.correspondent_contacts = data.get('correspondentContacts', '')
    
    db.session.add(application)
    db.session.commit()
    
    # Генерация и отправка документов
    try:
        if data.get('contractor') in ['figaro', 'ttk']:
            # Генерация Excel файла
            excel_file = create_excel_document(data, application.id)
            if excel_file:
                excel_filename = _build_excel_filename(data)
                send_email_with_attachment(
                    _email_recipient_for_contractor(data.get('contractor')),
                    f"Заявка {'ФИГАРО' if data.get('contractor') == 'figaro' else 'ТТК'}: {data.get('storyTitle', '')}",
                    excel_file,
                    excel_filename,
                    sender_display_email=user.email,
                    sender_display_name=user.full_name
                )
        elif data.get('contractor') == 'producer':
            # Генерация Word файла
            word_file = create_word_document(data, application.id)
            if word_file:
                send_email_with_attachment(
                    _email_recipient_for_contractor(data.get('contractor')),
                    f"Заявка продюсерам: {data.get('storyTitle', '')}",
                    word_file,
                    f"Заявка_продюсерам_{application.id}.doc",
                    sender_display_email=user.email,
                    sender_display_name=user.full_name
                )
    except Exception as e:
        print(f"Ошибка при отправке email: {e}")
        # Не прерываем создание заявки, если email не отправился
    
    return jsonify({
        'success': True,
        'application': application.to_dict()
    }), 201


@app.route('/api/applications/<int:app_id>', methods=['GET'])
def get_application(app_id):
    """Получить заявку по ID"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    if not _user_can_access_application(user, application):
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify({
        'success': True,
        'application': application.to_dict()
    })


@app.route('/api/applications/<int:app_id>/status', methods=['PUT'])
def update_application_status(app_id):
    """Изменить статус заявки"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(user):
        return jsonify({'error': 'Forbidden'}), 403
    
    data = request.get_json() or {}
    status = data.get('status')
    comment = data.get('comment', '')
    
    if status not in ['new', 'in_progress', 'approved', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    application = Application.query.get_or_404(app_id)
    application.status = status
    
    if comment:
        comments = json.loads(application.comments or '[]')
        comments.append({
            'text': comment,
            'author': user.email,
            'date': datetime.now().isoformat()
        })
        application.comments = json.dumps(comments)
    
    application.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'application': application.to_dict()
    })


@app.route('/api/admin/pending-users', methods=['GET'])
def get_pending_users():
    """Получить список ожидающих одобрения пользователей"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(user):
        return jsonify({'error': 'Forbidden'}), 403

    pending_users = User.query.filter_by(approval_status=APPROVAL_PENDING).order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'users': [pending_user.to_dict() for pending_user in pending_users]
    })


@app.route('/api/admin/users/<int:user_id>/approve', methods=['POST'])
def approve_user(user_id):
    """Одобрить доступ пользователя"""
    admin_user = _get_active_user()
    if not admin_user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(admin_user):
        return jsonify({'error': 'Forbidden'}), 403

    user = User.query.get_or_404(user_id)
    user.approval_status = APPROVAL_APPROVED
    user.approved_at = datetime.now()
    user.approved_by_email = admin_user.email
    if user.role not in ['correspondent', 'admin']:
        user.role = 'correspondent'
    db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/admin/users/<int:user_id>/reject', methods=['POST'])
def reject_user(user_id):
    """Отклонить доступ пользователя"""
    admin_user = _get_active_user()
    if not admin_user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(admin_user):
        return jsonify({'error': 'Forbidden'}), 403

    user = User.query.get_or_404(user_id)
    user.approval_status = APPROVAL_REJECTED
    user.approved_at = None
    user.approved_by_email = None
    user.role = 'correspondent'
    db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/applications/<int:app_id>/export/doc', methods=['GET'])
def export_application_doc(app_id):
    """Экспорт заявки в формате DOC"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    if not _user_can_access_application(user, application):
        return jsonify({'error': 'Forbidden'}), 403
    form_data = json.loads(application.form_data)
    
    word_file = create_word_document(form_data, application.id)
    if word_file:
        @after_this_request
        def _cleanup_doc(resp):
            try:
                os.remove(word_file)
            except Exception:
                pass
            return resp

        response = send_file(
            word_file,
            mimetype='application/msword',
            as_attachment=True,
            download_name=f"Заявка_{application.id}.doc"
        )
        return _set_download_headers(response, f"Заявка_{application.id}.doc")
    
    return jsonify({'error': 'Failed to generate document'}), 500


@app.route('/api/applications/<int:app_id>/export/excel', methods=['GET'])
def export_application_excel(app_id):
    """Экспорт существующей заявки в формате XLSX"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    if not _user_can_access_application(user, application):
        return jsonify({'error': 'Forbidden'}), 403

    form_data = json.loads(application.form_data)
    
    tmp_path = create_excel_document(form_data, application.id)
    if not tmp_path:
        return jsonify({'error': 'Failed to generate excel'}), 500

    @after_this_request
    def _cleanup(resp):
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        return resp

    filename = _build_excel_filename(form_data)

    response = send_file(
        tmp_path,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )
    return _set_download_headers(response, filename)


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Получить статистику по заявкам"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(user):
        return jsonify({'error': 'Forbidden'}), 403
    
    total = Application.query.count()
    new = Application.query.filter_by(status='new').count()
    in_progress = Application.query.filter_by(status='in_progress').count()
    approved = Application.query.filter_by(status='approved').count()
    rejected = Application.query.filter_by(status='rejected').count()
    figaro = Application.query.filter_by(contractor='figaro').count()
    ttk = Application.query.filter_by(contractor='ttk').count()
    pending_users = User.query.filter_by(approval_status=APPROVAL_PENDING).count()
    
    return jsonify({
        'success': True,
        'statistics': {
            'total': total,
            'new': new,
            'in_progress': in_progress,
            'approved': approved,
            'rejected': rejected,
            'byContractor': {
                'figaro': figaro,
                'ttk': ttk
            },
            'pendingUsers': pending_users
        }
    })


def _safe_filename(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[<>:\"/\\\\|?*]+", "_", s)
    s = re.sub(r"\\s+", " ", s).strip()
    return s[:80] if s else "Заявка"


def _ascii_download_fallback(filename: str) -> str:
    translit_map = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
        'Я': 'Ya', 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh',
        'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
        'ю': 'yu', 'я': 'ya',
    }
    transliterated = ''.join(translit_map.get(char, char) for char in (filename or ''))
    transliterated = re.sub(r'[^A-Za-z0-9._ -]+', '_', transliterated)
    transliterated = re.sub(r'\s+', '_', transliterated).strip('._ ')
    return transliterated or 'download.xlsx'


def _set_download_headers(response, filename: str):
    filename = filename or 'download.xlsx'
    ascii_fallback = _ascii_download_fallback(filename)
    response.headers['Content-Disposition'] = (
        f'attachment; filename="{ascii_fallback}"; filename*=UTF-8\'\'{quote(filename)}'
    )
    response.headers['X-Download-Filename'] = filename
    return response


def _extract_correspondent_surname(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return "Без_корреспондента"

    first_part = value.split()[0].strip(".,;:()[]{}")
    return _safe_filename(first_part) or "Без_корреспондента"


def _filename_date_part(value) -> str:
    parsed = _parse_date_yyyy_mm_dd(value)
    if parsed:
        return parsed.strftime("%d.%m.%Y")
    return _safe_filename(str(value or "")) or "Без_даты"


def _build_excel_filename(form_data: dict) -> str:
    contractor = form_data.get('contractor')
    contractor_part = 'ТТК' if contractor == 'ttk' else 'Фигаро'
    surname_part = _extract_correspondent_surname(form_data.get('correspondent', ''))
    date_part = _filename_date_part(form_data.get('shootingDate') or form_data.get('applicationDate'))

    filename_parts = [contractor_part, surname_part, date_part]
    if form_data.get('accreditation') == 'yes':
        filename_parts.append('аккредитация')

    return f"{'_'.join(filename_parts)}.xlsx"


def _parse_date_yyyy_mm_dd(value):
    """Parse 'YYYY-MM-DD' into datetime.date for SQLAlchemy Date columns."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except Exception:
        return None


def _parse_datetime_local_to_date(value):
    """Parse 'YYYY-MM-DDTHH:MM' and return date() part (we store submission_date as Date)."""
    if not value:
        return None
    try:
        dt = datetime.strptime(str(value), "%Y-%m-%dT%H:%M")
        return dt.date()
    except Exception:
        # Sometimes we may already get YYYY-MM-DD
        return _parse_date_yyyy_mm_dd(value)


@app.route('/api/export/excel', methods=['POST'])
def export_excel_from_form():
    """
    Экспорт Excel (XLSX) по шаблону из данных формы, без обязательного сохранения в БД.
    Стили/границы/шрифты берутся из excel_templates/*_template.xlsx.
    """
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    contractor = data.get('contractor')
    if contractor not in ['figaro', 'ttk']:
        return jsonify({'error': 'Invalid contractor'}), 400

    # Генерируем XLSX во временный файл
    tmp_path = create_excel_document(data, application_id=0)
    if not tmp_path:
        return jsonify({'error': 'Failed to generate excel'}), 500

    @after_this_request
    def _cleanup(resp):
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        return resp

    filename = _build_excel_filename(data)

    response = send_file(
        tmp_path,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )
    return _set_download_headers(response, filename)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
