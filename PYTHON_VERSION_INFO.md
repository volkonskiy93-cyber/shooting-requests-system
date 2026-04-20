# Python версия системы заявок на видеосъемку

## ✅ Что сделано

### Backend (Flask)
- ✅ Полностью переписан на Python с использованием Flask
- ✅ База данных SQLite (легко заменить на PostgreSQL)
- ✅ Авторизация через Flask-Bcrypt
- ✅ RESTful API для работы с заявками
- ✅ Генерация Excel файлов (openpyxl)
- ✅ Генерация Word документов (python-docx)
- ✅ Отправка email с вложениями (SMTP)

### Frontend
- ✅ HTML шаблоны на Jinja2
- ✅ Адаптированный iOS 26 стиль
- ✅ Адаптивный дизайн для мобильных и ПК
- ✅ JavaScript для работы с API

### Функционал
- ✅ Регистрация и авторизация пользователей
- ✅ Создание заявок (ФИГАРО, ТТК, Продюсерам)
- ✅ Автоматическая генерация и отправка документов
- ✅ Панель администратора с фильтрами
- ✅ Статистика по заявкам
- ✅ Экспорт заявок в DOC формат

## 📁 Структура проекта

```
.
├── app.py                 # Основное Flask приложение
├── models.py              # Модели базы данных (SQLAlchemy)
├── run.py                 # Скрипт запуска
├── requirements.txt       # Зависимости Python
├── README.md              # Основная документация
├── INSTALL.md             # Инструкция по установке
├── .env.example           # Пример файла с переменными окружения
├── .gitignore             # Игнорируемые файлы для Git
│
├── utils/                 # Утилиты
│   ├── __init__.py
│   ├── excel_generator.py # Генерация Excel (ФИГАРО, ТТК)
│   ├── word_generator.py  # Генерация Word (Продюсерам)
│   └── email_sender.py    # Отправка email через SMTP
│
├── templates/             # HTML шаблоны (Jinja2)
│   ├── base.html          # Базовый шаблон
│   ├── index.html         # Главная страница (авторизация)
│   ├── forms.html         # Страница форм корреспондента
│   └── admin.html         # Панель администратора
│
└── static/                # Статические файлы
    ├── forms.js           # JavaScript для форм
    └── admin.js           # JavaScript для админки
```

## 🚀 Быстрый старт

1. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

2. **Создайте файл `.env`:**
```env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///shooting_requests.db
EMAIL_RECIPIENT=pendeho098rus@yandex.ru
SMTP_SERVER=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=Volkonskiyser@yandex.ru
SMTP_PASSWORD=your-password
```

3. **Запустите приложение:**
```bash
python run.py
```

4. **Откройте в браузере:**
http://localhost:5000

## 🔄 Отличия от JavaScript версии

### Преимущества Python версии:
- ✅ Данные хранятся в базе данных (надежнее localStorage)
- ✅ Серверная валидация данных
- ✅ Безопасное хранение паролей (bcrypt)
- ✅ Легче масштабировать
- ✅ Можно добавить дополнительные функции (отчеты, аналитика)

### Что нужно настроить:
- ⚙️ SMTP настройки для отправки email
- ⚙️ База данных (SQLite по умолчанию, можно заменить на PostgreSQL)
- ⚙️ Переменные окружения в `.env`

## 📝 API Endpoints

- `GET /` - Главная страница
- `POST /login` - Авторизация
- `POST /register` - Регистрация
- `POST /logout` - Выход
- `GET /forms` - Страница форм корреспондента
- `GET /admin` - Панель администратора
- `GET /api/applications` - Получить заявки (с фильтрами)
- `POST /api/applications` - Создать заявку
- `GET /api/applications/<id>` - Получить заявку по ID
- `PUT /api/applications/<id>/status` - Изменить статус заявки
- `GET /api/applications/<id>/export/doc` - Экспорт в DOC
- `GET /api/statistics` - Статистика

## 🔧 Технологии

- **Flask 2.3.3** - веб-фреймворк
- **SQLAlchemy** - ORM для работы с БД
- **Flask-Bcrypt** - хеширование паролей
- **openpyxl** - генерация Excel файлов
- **python-docx** - генерация Word документов
- **python-dotenv** - загрузка переменных окружения

## 📦 Развертывание

### Локально:
```bash
python run.py
```

### На сервере (Gunicorn):
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Heroku:
Создайте `Procfile`:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

## ⚠️ Важные замечания

1. **Безопасность:** В продакшене обязательно измените `SECRET_KEY` в `.env`
2. **База данных:** SQLite подходит для небольших проектов. Для больших нагрузок используйте PostgreSQL
3. **Email:** Для Yandex используйте пароль приложения, а не основной пароль аккаунта
4. **Порты:** По умолчанию используется порт 5000. Измените при необходимости

## 📚 Дополнительная документация

- `README.md` - основная документация
- `INSTALL.md` - подробная инструкция по установке
- `.env.example` - пример файла с переменными окружения
