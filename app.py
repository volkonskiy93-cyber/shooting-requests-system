"""
Flask приложение для системы заявок на видеосъемку
Программа "Доброе утро"
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import os
import json
from dotenv import load_dotenv
from models import db, User, Application
from utils.excel_generator import create_excel_document
from utils.word_generator import create_word_document
from utils.email_sender import send_email_with_attachment
import re
import tempfile
from flask import after_this_request
from datetime import date, datetime

# Загрузка переменных окружения из .env
load_dotenv()

# В production ключ должен приходить из переменных окружения.
# Никаких жестко зашитых ключей в коде.

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///shooting_requests.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация расширений
db.init_app(app)
bcrypt = Bcrypt(app)

# Email настройки (получатель всех заявок)
EMAIL_RECIPIENT = os.environ.get('EMAIL_RECIPIENT', 'volkonskiyser@yandex.com')


# Создание таблиц базы данных при первом запуске
with app.app_context():
    db.create_all()


# ==================== РОУТЫ ====================

@app.route('/')
def index():
    """Главная страница - авторизация и выбор роли"""
    if 'user_id' in session:
        return render_template('index.html', user=session.get('user_email'))
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, password):
        session['user_id'] = user.id
        session['user_email'] = user.email
        return jsonify({'success': True, 'user': {'email': user.email}})
    
    return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401


@app.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    
    if len(password) < 4:
        return jsonify({'success': False, 'message': 'Пароль должен быть не менее 4 символов'}), 400
    
    if password != password_confirm:
        return jsonify({'success': False, 'message': 'Пароли не совпадают'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Пользователь с таким email уже зарегистрирован'}), 400
    
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Регистрация успешна'})


@app.route('/logout', methods=['POST'])
def logout():
    """Выход из системы"""
    session.clear()
    return jsonify({'success': True})


@app.route('/forms')
def forms():
    """Страница корреспондента с формами заявок"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('forms.html')


@app.route('/admin')
def admin():
    """Страница администратора-координатора"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('admin.html')


@app.route('/archive')
def archive():
    """Страница архива заявок для корреспондента"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('archive.html')


# ==================== API ENDPOINTS ====================

@app.route('/api/my-applications', methods=['GET'])
def get_my_applications():
    """Получить заявки текущего пользователя за последние 2 месяца"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Фильтр: 2 месяца назад
    two_months_ago = datetime.now() - timedelta(days=60)
    
    applications = Application.query.filter(
        Application.user_id == session['user_id'],
        Application.created_at >= two_months_ago
    ).order_by(Application.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })

@app.route('/api/applications', methods=['GET'])
def get_applications():
    """Получить все заявки с фильтрами"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Параметры фильтрации
    status = request.args.get('status')
    contractor = request.args.get('contractor')
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Application.query
    
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
    
    # Сортировка по дате создания (новые сверху)
    applications = query.order_by(Application.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


@app.route('/api/applications', methods=['POST'])
def create_application():
    """Создать новую заявку"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    # Создание заявки
    application_date = _parse_date_yyyy_mm_dd(data.get('applicationDate'))
    shooting_date = _parse_date_yyyy_mm_dd(data.get('shootingDate'))
    broadcast_date = _parse_date_yyyy_mm_dd(data.get('broadcastDate'))

    application = Application(
        user_id=session.get('user_id'),
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
                send_email_with_attachment(
                    EMAIL_RECIPIENT,
                    f"Заявка {'ФИГАРО' if data.get('contractor') == 'figaro' else 'ТТК'}: {data.get('storyTitle', '')}",
                    excel_file,
                    f"Заявка_{'ФИГАРО' if data.get('contractor') == 'figaro' else 'ТТК'}_{application.id}.xlsx",
                    sender_display_email=session.get('user_email')
                )
        elif data.get('contractor') == 'producer':
            # Генерация Word файла
            word_file = create_word_document(data, application.id)
            if word_file:
                send_email_with_attachment(
                    EMAIL_RECIPIENT,
                    f"Заявка продюсерам: {data.get('storyTitle', '')}",
                    word_file,
                    f"Заявка_продюсерам_{application.id}.doc",
                    sender_display_email=session.get('user_email')
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
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    return jsonify({
        'success': True,
        'application': application.to_dict()
    })


@app.route('/api/applications/<int:app_id>/status', methods=['PUT'])
def update_application_status(app_id):
    """Изменить статус заявки"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
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
            'author': session.get('user_email', 'Администратор'),
            'date': datetime.now().isoformat()
        })
        application.comments = json.dumps(comments)
    
    application.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'application': application.to_dict()
    })


@app.route('/api/applications/<int:app_id>/export/doc', methods=['GET'])
def export_application_doc(app_id):
    """Экспорт заявки в формате DOC"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    form_data = json.loads(application.form_data)
    
    word_file = create_word_document(form_data, application.id)
    if word_file:
        return send_file(
            word_file,
            mimetype='application/msword',
            as_attachment=True,
            download_name=f"Заявка_{application.id}.doc"
        )
    
    return jsonify({'error': 'Failed to generate document'}), 500


@app.route('/api/applications/<int:app_id>/export/excel', methods=['GET'])
def export_application_excel(app_id):
    """Экспорт существующей заявки в формате XLSX"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    
    # Проверка прав (только автор или админ)
    # Здесь упрощенно - автор или кто угодно авторизованный (если это архив корреспондента)
    if application.user_id != session['user_id']:
        # Можно добавить проверку на админа
        pass

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

    # Имя файла
    date_part = form_data.get('shootingDate') or form_data.get('applicationDate') or ''
    title_part = _safe_filename(form_data.get('storyTitle', ''))
    contractor = form_data.get('contractor')
    prefix = 'Заявка_ФИГАРО' if contractor == 'figaro' else 'Заявка_ТТК'
    filename = f"{prefix}_{date_part}_{title_part}.xlsx"

    return send_file(
        tmp_path,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Получить статистику по заявкам"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    total = Application.query.count()
    new = Application.query.filter_by(status='new').count()
    in_progress = Application.query.filter_by(status='in_progress').count()
    approved = Application.query.filter_by(status='approved').count()
    rejected = Application.query.filter_by(status='rejected').count()
    figaro = Application.query.filter_by(contractor='figaro').count()
    ttk = Application.query.filter_by(contractor='ttk').count()
    
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
            }
        }
    })


def _safe_filename(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[<>:\"/\\\\|?*]+", "_", s)
    s = re.sub(r"\\s+", " ", s).strip()
    return s[:80] if s else "Заявка"


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
    if 'user_id' not in session:
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

    # Имя файла
    date_part = data.get('shootingDate') or data.get('applicationDate') or ''
    title_part = _safe_filename(data.get('storyTitle', ''))
    prefix = 'Заявка_ФИГАРО' if contractor == 'figaro' else 'Заявка_ТТК'
    filename = f"{prefix}_{date_part}_{title_part}.xlsx" if date_part else f"{prefix}_{title_part}.xlsx"

    return send_file(
        tmp_path,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
