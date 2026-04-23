"""
Flask приложение для системы заявок на видеосъемку
Программа "Доброе утро"
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime, timedelta
import os
import json
import secrets
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


def _resolve_database_url() -> str:
    database_url = (os.environ.get('DATABASE_URL') or '').strip()
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        if database_url.startswith('postgresql://') and '+pg8000://' not in database_url:
            return database_url.replace('postgresql://', 'postgresql+pg8000://', 1)
        return database_url

    # Используем постоянный том только если путь существует реально
    # или задан явно через переменную окружения.
    sqlite_data_dir = (os.environ.get('SQLITE_DATA_DIR') or '/data').strip()
    if sqlite_data_dir and os.path.isdir(sqlite_data_dir):
        sqlite_path = os.path.join(sqlite_data_dir, 'shooting_requests.db').replace('\\', '/')
        return f"sqlite:///{sqlite_path}"

    return 'sqlite:///shooting_requests.db'


database_url = _resolve_database_url()
secret_key = (os.environ.get('SECRET_KEY') or '').strip()
if not secret_key:
    secret_key = secrets.token_hex(32)
    print("⚠️ SECRET_KEY не задан. Используется временный ключ только для текущего запуска.")

app.config['SECRET_KEY'] = secret_key
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', '0') == '1'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(
    days=int(os.environ.get('SESSION_LIFETIME_DAYS', '30'))
)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['RATELIMIT_STORAGE_URI'] = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
app.config['RATELIMIT_HEADERS_ENABLED'] = True
# Защита от перегрузки большим JSON (заявки — текст, не вложения)
app.config['MAX_CONTENT_LENGTH'] = int(
    os.environ.get('MAX_CONTENT_LENGTH', str(5 * 1024 * 1024))
)

# Инициализация расширений
db.init_app(app)
bcrypt = Bcrypt(app)


def _rate_limit_key() -> str:
    forwarded_for = (request.headers.get('X-Forwarded-For') or '').split(',')[0].strip()
    return forwarded_for or get_remote_address()


def _rate_limit_key_user() -> str:
    """
    Для маршрутов, где важен лимит с пользователем (создание заявок, выгрузки).
    """
    user_id = session.get('user_id')
    if user_id is not None:
        return f"u:{user_id}"
    return f"ip:{_rate_limit_key()}"


limiter = Limiter(
    key_func=_rate_limit_key,
    app=app,
    default_limits=[],
)

# За балансировщиком (Railway, Render и т.д.): корректные схема/клиент для rate limit и куков Secure.
# Включайте в окружении: TRUST_PROXY=1
if str(os.environ.get('TRUST_PROXY', '')).strip().lower() in ('1', 'true', 'yes', 'on'):
    app.wsgi_app = ProxyFix(
        app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=0, x_prefix=1
    )

# Email настройки (получатели заявок)
DEFAULT_EMAIL_RECIPIENT = (
    os.environ.get('EMAIL_RECIPIENT')
    or 'volkonskiyser@yandex.com'
).strip()
EMAIL_RECIPIENT_SHOOTING = (
    os.environ.get('EMAIL_RECIPIENT_SHOOTING')
    or DEFAULT_EMAIL_RECIPIENT
).strip()
EMAIL_RECIPIENT_PRODUCER = (
    os.environ.get('EMAIL_RECIPIENT_PRODUCER')
    or DEFAULT_EMAIL_RECIPIENT
).strip()

APPROVAL_PENDING = 'pending'
APPROVAL_APPROVED = 'approved'
APPROVAL_REJECTED = 'rejected'
ALLOWED_CONTRACTORS = {'figaro', 'ttk', 'producer'}
MIN_PASSWORD_LENGTH = 8
MAX_NAME_LEN = 80
# Адреса вроде user@, без полноценного домена
_EMAIL_OK = re.compile(
    r'^[a-z0-9._%+\-]{1,64}@'
    r'[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?'
    r'(?:\.[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)+$',
    re.IGNORECASE,
)
_LATIN_VOWELS = set('aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯ')


def _is_valid_registration_email(email: str) -> bool:
    e = (email or '').strip()
    if not e or len(e) > 254 or e.count('@') != 1:
        return False
    local, _, domain = e.rpartition('@')
    if '..' in local or local.startswith(('.', '-')) or local.endswith(('.', '-')):
        return False
    if '..' in domain or domain.startswith('-') or domain.endswith('-'):
        return False
    return bool(_EMAIL_OK.match(e))


def _registration_name_ok(first: str, last: str) -> tuple[bool, str]:
    """
    Снижение спама: осмысленные ФИО. Кириллица, либо латиница (полное имя с гласной в каждой части), без цифр.
    """
    a = (first or '').strip()
    b = (last or '').strip()
    if len(a) < 2 or len(b) < 2:
        return False, 'Укажите имя и фамилию (не менее 2 символов в каждом поле).'
    if len(a) > MAX_NAME_LEN or len(b) > MAX_NAME_LEN:
        return False, 'Слишком длинные имя или фамилия.'

    combined = f'{a} {b}'
    if re.search(r'\d', combined):
        return False, 'В имени и фамилии нельзя использовать цифры.'

    if re.search(r'[—–/\\@#$%^&*()[\]{}|<>+~=]', combined):
        return False, 'Используйте только буквы, дефис и пробел в имени и фамилии.'

    if re.search(r'[А-Яа-яЁё]', combined):
        if re.fullmatch(r'[А-Яа-яЁё\- ]+', combined):
            return True, ''
        return False, 'В имени и фамилии используйте только кириллицу (или латиницу по шаблону John Smith).'

    latin_block = re.compile(r"^[A-Za-z' \-]{2,100}$")
    if latin_block.match(a) and latin_block.match(b):
        if any(c in _LATIN_VOWELS for c in a) and any(c in _LATIN_VOWELS for c in b):
            return True, ''
    return (
        False,
        'Укажите фамилию и имя кириллицей, либо латиницей полными словами (например, Иванов Иван или John Smith).',
    )


def _role_redirect_url(role: str) -> str:
    return url_for('dashboard') if role == 'admin' else url_for('forms')


def _is_local_development() -> bool:
    return (
        os.environ.get('FLASK_ENV') == 'development'
        or os.environ.get('FLASK_DEBUG') == '1'
    )


def _refresh_registration_captcha(exclude_prompt: Optional[str] = None) -> str:
    """
    Генерирует новый простой пример и сохраняет ответ в сессии.
    """
    prompt = ''
    answer = 0

    for _ in range(12):
        left = secrets.randbelow(8) + 2
        right = secrets.randbelow(8) + 1
        if secrets.randbelow(2) == 0:
            prompt = f'{left} + {right}'
            answer = left + right
        else:
            if right > left:
                left, right = right, left
            prompt = f'{left} - {right}'
            answer = left - right
        if not exclude_prompt or prompt != exclude_prompt:
            break

    session['registration_captcha_prompt'] = prompt
    session['registration_captcha_answer'] = str(answer)
    return prompt


def _current_registration_captcha() -> str:
    prompt = (session.get('registration_captcha_prompt') or '').strip()
    answer = (session.get('registration_captcha_answer') or '').strip()
    if prompt and answer:
        return prompt
    return _refresh_registration_captcha()


def _check_registration_captcha(user_answer: str) -> bool:
    current_prompt = (session.get('registration_captcha_prompt') or '').strip()
    expected = (session.get('registration_captcha_answer') or '').strip()
    provided = (user_answer or '').strip()
    is_valid = bool(expected and provided and secrets.compare_digest(expected, provided))
    _refresh_registration_captcha(current_prompt)
    return is_valid


def _ensure_csrf_token() -> str:
    token = session.get('csrf_token')
    if not token:
        token = secrets.token_urlsafe(32)
        session['csrf_token'] = token
    return token


def _csrf_token_from_request() -> str:
    header_token = (request.headers.get('X-CSRF-Token') or '').strip()
    if header_token:
        return header_token

    form_token = (request.form.get('csrf_token') or '').strip()
    if form_token:
        return form_token

    if request.is_json:
        payload = request.get_json(silent=True) or {}
        return str(payload.get('csrf_token') or '').strip()

    return ''


@app.context_processor
def inject_security_context():
    return {'csrf_token': _ensure_csrf_token()}


@app.before_request
def protect_against_csrf():
    if request.method in ('GET', 'HEAD', 'OPTIONS'):
        return None

    if request.endpoint == 'static':
        return None

    session_token = session.get('csrf_token')
    request_token = _csrf_token_from_request()
    if not session_token or not request_token or not secrets.compare_digest(session_token, request_token):
        message = {'success': False, 'message': 'Сессия устарела. Обновите страницу и повторите действие.'}
        return jsonify(message), 400

    return None


@app.errorhandler(429)
def handle_rate_limit_error(error):
    response = {
        'success': False,
        'message': 'Слишком много попыток. Подождите немного и повторите действие.',
    }
    return jsonify(response), 429


@app.errorhandler(413)
def _handle_request_too_large(_error):
    return jsonify({
        'success': False,
        'message': 'Слишком большой запрос. Уменьшите данные и повторите.',
    }), 413


def _is_https_request() -> bool:
    if getattr(request, 'is_secure', False):
        return True
    return (request.headers.get('X-Forwarded-Proto') or '').lower() == 'https'


@app.after_request
def _apply_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    if str(os.environ.get('HSTS', '0')).strip() == '1' and _is_https_request():
        response.headers['Strict-Transport-Security'] = 'max-age=15552000; includeSubDomains'
    return response


def _sync_session_user(user: Optional[User]):
    if not user:
        return
    session.permanent = True
    session['user_id'] = user.id
    session['user_email'] = user.email
    session['user_role'] = user.role or 'correspondent'
    session['user_full_name'] = user.full_name or ''
    _ensure_csrf_token()


def _clear_session():
    csrf_token = session.get('csrf_token')
    session.clear()
    if csrf_token:
        session['csrf_token'] = csrf_token


def _get_current_user() -> Optional[User]:
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)


def _verify_and_upgrade_password(user: Optional[User], password: str) -> bool:
    if not user or not password:
        return False

    stored_hash = (user.password_hash or '').strip()
    if not stored_hash:
        return False

    try:
        if bcrypt.check_password_hash(stored_hash, password):
            return True
    except ValueError:
        pass

    allow_legacy_plaintext = os.environ.get('ALLOW_LEGACY_PLAINTEXT_PASSWORDS') == '1'
    if allow_legacy_plaintext and stored_hash == password:
        user.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        db.session.commit()
        return True

    return False


def _ensure_admin_user():
    admin_email = (os.environ.get('ADMIN_EMAIL') or 'admin@dobroeyutro.ru').strip().lower()
    admin_password = (os.environ.get('ADMIN_PASSWORD') or '').strip()
    admin_full_name = (os.environ.get('ADMIN_FULL_NAME') or 'Администратор').strip()

    if not admin_email:
        return

    if not admin_password and _is_local_development():
        admin_password = 'admin123'

    if not admin_password:
        print("⚠️ ADMIN_PASSWORD не задан. Автоматическое создание администратора пропущено.")
        return

    admin_user = User.query.filter_by(email=admin_email).first()
    admin_password_hash = bcrypt.generate_password_hash(admin_password).decode('utf-8')
    if admin_user:
        updated = False
        if admin_user.role != 'admin':
            admin_user.role = 'admin'
            updated = True
        if admin_user.approval_status != APPROVAL_APPROVED:
            admin_user.approval_status = APPROVAL_APPROVED
            updated = True
        if not admin_user.approved_at:
            admin_user.approved_at = datetime.now()
            updated = True
        if not admin_user.full_name:
            admin_user.full_name = admin_full_name
            updated = True
        try:
            password_matches = bcrypt.check_password_hash((admin_user.password_hash or '').strip(), admin_password)
        except ValueError:
            password_matches = False
        if not password_matches:
            admin_user.password_hash = admin_password_hash
            updated = True
        if updated:
            db.session.commit()
        return

    admin_user = User(
        email=admin_email,
        full_name=admin_full_name,
        password_hash=admin_password_hash,
        role='admin',
        approval_status=APPROVAL_APPROVED,
        approved_at=datetime.now()
    )
    db.session.add(admin_user)
    db.session.commit()


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


def _application_form_payload(application: Application) -> dict:
    payload = application.to_dict()
    raw_form_data = (application.form_data or '').strip()
    if not raw_form_data:
        return payload

    try:
        parsed = json.loads(raw_form_data)
        if isinstance(parsed, dict):
            payload.update(parsed)
    except (TypeError, ValueError, json.JSONDecodeError):
        print(f"⚠️ Не удалось разобрать form_data для заявки {application.id}, используем данные из базы.")

    return payload


# Создание таблиц базы данных и недостающих колонок при запуске
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
    _ensure_admin_user()


# ==================== РОУТЫ ====================

@app.route('/')
def index():
    """Главная страница - авторизация и выбор роли"""
    user = _get_active_user()
    captcha_prompt = _current_registration_captcha()
    if user:
        return render_template(
            'index.html',
            user=user.email,
            user_role=user.role,
            user_name=user.full_name,
            approval_status=user.approval_status,
            registration_captcha_prompt=captcha_prompt,
        )
    return render_template(
        'index.html',
        user=None,
        user_role=None,
        user_name=None,
        approval_status=None,
        registration_captcha_prompt=captcha_prompt,
    )


@app.route('/api/register/captcha', methods=['GET'])
def register_captcha():
    current_prompt = (session.get('registration_captcha_prompt') or '').strip()
    return jsonify({
        'success': True,
        'question': _refresh_registration_captcha(current_prompt),
    })


@app.route('/login', methods=['POST'])
@limiter.limit("5 per 10 minutes")
def login():
    """Авторизация пользователя"""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if _verify_and_upgrade_password(user, password):
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
@limiter.limit("3 per 30 minutes")
def register():
    """Регистрация нового пользователя"""
    data = request.get_json() or {}
    # Honeypot: заполняют боты; для людей поле пустое и не отправляется
    if (str(data.get('hp_website') or data.get('company_url') or '')).strip():
        return jsonify({'success': False, 'message': 'Проверьте корректность данных и повторите попытку.'}), 400
    email = data.get('email', '').strip().lower()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    full_name = data.get('full_name', '').strip() or f"{first_name} {last_name}".strip()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')
    captcha_answer = str(data.get('captcha_answer') or '').strip()

    if not first_name or not last_name:
        full_name = (full_name or '').strip()
        if full_name and ' ' in full_name:
            part_a, part_b = full_name.split(None, 1)
            if part_a and part_b:
                first_name, last_name = part_a.strip(), part_b.strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Заполните все поля'}), 400
    if not first_name or not last_name:
        return jsonify({'success': False, 'message': 'Укажите имя и фамилию.'}), 400
    full_name = f"{first_name} {last_name}".strip()

    if not _is_valid_registration_email(email):
        return jsonify({
            'success': False,
            'message': 'Введите корректный email-адрес (например, name@yandex.ru).',
        }), 400

    ok, name_error = _registration_name_ok(first_name, last_name)
    if not ok:
        return jsonify({'success': False, 'message': name_error}), 400
    
    if len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({'success': False, 'message': f'Пароль должен быть не менее {MIN_PASSWORD_LENGTH} символов'}), 400
    
    if password != password_confirm:
        return jsonify({'success': False, 'message': 'Пароли не совпадают'}), 400

    if not _check_registration_captcha(captcha_answer):
        return jsonify({
            'success': False,
            'message': 'Неверный ответ на проверочный вопрос.',
            'captchaQuestion': _current_registration_captcha(),
        }), 400

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


@app.route('/api/session/csrf', methods=['GET'])
def session_csrf():
    """Выдать актуальный CSRF-токен для открытой страницы."""
    return jsonify({
        'success': True,
        'csrfToken': _ensure_csrf_token(),
        'authenticated': bool(_get_active_user()),
    })


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
    return render_template('admin.html', current_admin_id=user.id)


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
@limiter.limit('40 per hour', key_func=_rate_limit_key_user)
def create_application():
    """Создать новую заявку"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    contractor = str(data.get('contractor') or '').strip().lower()
    if contractor not in ALLOWED_CONTRACTORS:
        return jsonify({'success': False, 'message': 'Некорректный тип заявки'}), 400
    data['contractor'] = contractor
    data['senderFullName'] = user.full_name or ''
    
    # Создание заявки
    application_date = _parse_date_yyyy_mm_dd(data.get('applicationDate'))
    shooting_date = _parse_date_yyyy_mm_dd(data.get('shootingDate'))
    broadcast_date = _parse_date_yyyy_mm_dd(data.get('broadcastDate'))

    application = Application(
        user_id=user.id,
        contractor=contractor,
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
    if contractor == 'ttk':
        application.clarifications = data.get('clarifications', '')
        application.extension = data.get('extension', '')
        application.car_number = data.get('carNumber', '')
        application.submission_date = _parse_datetime_local_to_date(data.get('submissionDate'))
    
    # Дополнительные поля для Producer
    if contractor == 'producer':
        application.summary = data.get('summary', '')
        application.heroes = data.get('heroes', '')
        application.correspondent_contacts = data.get('correspondentContacts', '')
    
    db.session.add(application)
    db.session.commit()
    
    # Генерация и отправка документов
    email_status = {
        'sent': False,
        'error': None,
        'providerId': None,
    }
    try:
        if data.get('contractor') in ['figaro', 'ttk']:
            # Генерация Excel файла
            excel_file = create_excel_document(data, application.id)
            if excel_file:
                excel_filename = _build_excel_filename(data)
                email_result = send_email_with_attachment(
                    _email_recipient_for_contractor(data.get('contractor')),
                    f"Заявка {'ТМК' if data.get('contractor') == 'figaro' else 'ТТК'}: {data.get('storyTitle', '')}",
                    excel_file,
                    excel_filename,
                    sender_display_email=user.email,
                    sender_display_name=user.full_name
                )
                email_status = {
                    'sent': bool(email_result.get('success')),
                    'error': email_result.get('error'),
                    'providerId': email_result.get('provider_id'),
                }
            else:
                email_status['error'] = 'Не удалось сформировать Excel-файл для отправки'
        elif data.get('contractor') == 'producer':
            # Генерация Word файла
            word_file = create_word_document(data, application.id)
            if word_file:
                email_result = send_email_with_attachment(
                    _email_recipient_for_contractor(data.get('contractor')),
                    f"Заявка продюсерам: {data.get('storyTitle', '')}",
                    word_file,
                    f"Заявка_продюсерам_{application.id}.docx",
                    sender_display_email=user.email,
                    sender_display_name=user.full_name
                )
                email_status = {
                    'sent': bool(email_result.get('success')),
                    'error': email_result.get('error'),
                    'providerId': email_result.get('provider_id'),
                }
            else:
                email_status['error'] = 'Не удалось сформировать Word-файл для отправки'
    except Exception as e:
        print(f"Ошибка при отправке email: {e}")
        email_status['error'] = str(e)
    
    return jsonify({
        'success': True,
        'application': application.to_dict(),
        'emailSent': email_status['sent'],
        'emailError': email_status['error'],
        'emailProviderId': email_status['providerId'],
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
        'application': _application_form_payload(application)
    })


@app.route('/api/applications/<int:app_id>/status', methods=['PUT'])
@limiter.limit('200 per hour', key_func=_rate_limit_key_user)
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


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Получить список всех зарегистрированных пользователей"""
    admin_user = _get_active_user()
    if not admin_user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(admin_user):
        return jsonify({'error': 'Forbidden'}), 403

    users = User.query.order_by(User.created_at.desc(), User.email.asc()).all()
    return jsonify({
        'success': True,
        'users': [listed_user.to_dict() for listed_user in users]
    })


@app.route('/api/admin/users/<int:user_id>/approve', methods=['POST'])
@limiter.limit('120 per hour', key_func=_rate_limit_key_user)
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
@limiter.limit('120 per hour', key_func=_rate_limit_key_user)
def reject_user(user_id):
    """Отклонить доступ пользователя"""
    admin_user = _get_active_user()
    if not admin_user:
        return jsonify({'error': 'Unauthorized'}), 401
    if not _is_admin(admin_user):
        return jsonify({'error': 'Forbidden'}), 403

    user = User.query.get_or_404(user_id)
    if user.id == admin_user.id:
        return jsonify({'error': 'Нельзя ограничить доступ текущему администратору'}), 400
    if user.role == 'admin':
        return jsonify({'error': 'Нельзя ограничить доступ другому администратору'}), 400

    user.approval_status = APPROVAL_REJECTED
    user.approved_at = None
    user.approved_by_email = None
    user.role = 'correspondent'
    db.session.commit()

    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/admin/users/<int:user_id>/delete', methods=['POST'])
@limiter.limit('60 per hour', key_func=_rate_limit_key_user)
def delete_user(user_id: int):
    """Удалить учётную запись (кроме администраторов и самого себя). Заявки остаются в системе без привязки к пользователю."""
    admin_user = _get_active_user()
    if not admin_user:
        return jsonify({'success': False, 'message': 'Требуется вход'}), 401
    if not _is_admin(admin_user):
        return jsonify({'success': False, 'message': 'Недостаточно прав'}), 403

    user = User.query.get(user_id)
    if user is None:
        return jsonify({'success': False, 'message': 'Пользователь не найден'}), 404

    if user.id == admin_user.id:
        return jsonify({'success': False, 'message': 'Нельзя удалить собственный аккаунт'}), 400
    if user.role == 'admin':
        return jsonify({'success': False, 'message': 'Нельзя удалить учётную запись администратора'}), 400

    for app_row in Application.query.filter_by(user_id=user.id).all():
        app_row.user_id = None
    db.session.delete(user)
    db.session.commit()

    return jsonify({'success': True})


@app.route('/api/applications/<int:app_id>/export/doc', methods=['GET'])
@limiter.limit('80 per hour', key_func=_rate_limit_key_user)
def export_application_doc(app_id):
    """Экспорт заявки в формате DOCX"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    if not _user_can_access_application(user, application):
        return jsonify({'error': 'Forbidden'}), 403
    form_data = _application_form_payload(application)
    
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
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=f"Заявка_{application.id}.docx"
        )
        return _set_download_headers(response, f"Заявка_{application.id}.docx")
    
    return jsonify({'error': 'Failed to generate document'}), 500


@app.route('/api/export/doc', methods=['POST'])
@limiter.limit('80 per hour', key_func=_rate_limit_key_user)
def export_doc_from_form():
    """Экспорт DOCX по данным формы продюсерской заявки без сохранения в БД."""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    contractor = str(data.get('contractor') or '').strip().lower()
    if contractor != 'producer':
        return jsonify({'error': 'Invalid contractor'}), 400

    data['contractor'] = contractor
    word_file = create_word_document(data, application_id=0)
    if not word_file:
        return jsonify({'error': 'Failed to generate document'}), 500

    @after_this_request
    def _cleanup_doc(resp):
        try:
            os.remove(word_file)
        except Exception:
            pass
        return resp

    filename = f"Заявка_продюсерам_{_filename_date_part(data.get('shootingDate'))}.docx"
    response = send_file(
        word_file,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name=filename
    )
    return _set_download_headers(response, filename)


@app.route('/api/applications/<int:app_id>/export/excel', methods=['GET'])
@limiter.limit('80 per hour', key_func=_rate_limit_key_user)
def export_application_excel(app_id):
    """Экспорт существующей заявки в формате XLSX"""
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    application = Application.query.get_or_404(app_id)
    if not _user_can_access_application(user, application):
        return jsonify({'error': 'Forbidden'}), 403

    form_data = _application_form_payload(application)
    
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
    response.headers['X-Download-Filename'] = quote(filename)
    return response


def _extract_correspondent_surname(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return "Без_корреспондента"

    first_part = value.split()[0].strip(".,;:()[]{}")
    return _safe_filename(first_part) or "Без_корреспондента"


def _extract_sender_surname(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""

    parts = [part.strip(".,;:()[]{}") for part in value.split() if part.strip(".,;:()[]{}")]
    if not parts:
        return ""
    return _safe_filename(parts[-1]) or ""


def _filename_date_part(value) -> str:
    parsed = _parse_date_yyyy_mm_dd(value)
    if parsed:
        return parsed.strftime("%d.%m.%Y")
    return _safe_filename(str(value or "")) or "Без_даты"


def _build_excel_filename(form_data: dict) -> str:
    contractor = form_data.get('contractor')
    contractor_part = 'ТТК' if contractor == 'ttk' else 'ТМК'
    sender_surname = _extract_sender_surname(form_data.get('senderFullName', ''))
    surname_part = sender_surname or _extract_correspondent_surname(form_data.get('correspondent', ''))
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
@limiter.limit('80 per hour', key_func=_rate_limit_key_user)
def export_excel_from_form():
    """
    Экспорт Excel (XLSX) по шаблону из данных формы, без обязательного сохранения в БД.
    Стили/границы/шрифты берутся из excel_templates/*_template.xlsx.
    """
    user = _get_active_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    contractor = str(data.get('contractor') or '').strip().lower()
    if contractor not in {'figaro', 'ttk'}:
        return jsonify({'error': 'Invalid contractor'}), 400
    data['contractor'] = contractor

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
    app.run(
        debug=_is_local_development(),
        host=os.environ.get('FLASK_HOST', '127.0.0.1'),
        port=int(os.environ.get('PORT', '5000'))
    )
