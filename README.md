# Система заявок на видеосъемку - Python версия

Веб-приложение для управления заявками на видеосъемку программы "Доброе утро".

## Технологии

- **Backend**: Flask (Python)
- **База данных**: SQLite (можно заменить на PostgreSQL)
- **Генерация документов**: openpyxl (Excel), python-docx (Word)
- **Авторизация**: Flask-Bcrypt

## Установка

### 1. Установите Python 3.8+

### 2. Установите зависимости

```bash
pip install -r requirements.txt
```

### 3. Настройте переменные окружения

Создайте файл `.env`:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///shooting_requests.db
EMAIL_RECIPIENT=pendeho098rus@yandex.ru
SMTP_SERVER=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=Volkonskiyser@yandex.ru
SMTP_PASSWORD=your-password-here
```

### 4. Запустите приложение

```bash
python app.py
```

Приложение будет доступно по адресу: http://localhost:5000

## Структура проекта

```
.
├── app.py                 # Основное Flask приложение
├── models.py              # Модели базы данных
├── requirements.txt       # Зависимости Python
├── utils/                 # Утилиты
│   ├── excel_generator.py # Генерация Excel файлов
│   ├── word_generator.py  # Генерация Word документов
│   └── email_sender.py    # Отправка email
├── templates/             # HTML шаблоны
│   ├── index.html
│   ├── forms.html
│   └── admin.html
└── static/                # Статические файлы (CSS, JS)
```

## Функционал

### Для корреспондентов:
- Авторизация по email/паролю
- Создание заявок на видеосъемку:
  - ФИГАРО (с генерацией Excel)
  - ТТК (с генерацией Excel)
  - Продюсерам (с генерацией Word)
- Автоматическая отправка документов на email

### Для администраторов-координаторов:
- Просмотр всех заявок
- Фильтрация по статусу, подрядчику, дате
- Изменение статуса заявок
- Экспорт заявок в DOC формат
- Статистика по заявкам

## API Endpoints

- `GET /` - Главная страница
- `POST /login` - Авторизация
- `POST /register` - Регистрация
- `POST /logout` - Выход
- `GET /forms` - Страница форм корреспондента
- `GET /admin` - Страница администратора
- `GET /api/applications` - Получить заявки (с фильтрами)
- `POST /api/applications` - Создать заявку
- `GET /api/applications/<id>` - Получить заявку по ID
- `PUT /api/applications/<id>/status` - Изменить статус заявки
- `GET /api/applications/<id>/export/doc` - Экспорт в DOC
- `GET /api/statistics` - Статистика

## Развертывание

### Локально:
```bash
python app.py
```

### На сервере (с Gunicorn):
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### На Heroku:
1. Создайте `Procfile`:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

2. Разверните:
```bash
heroku create
git push heroku main
```

## Миграция с JavaScript версии

Данные из localStorage не переносятся автоматически. Для миграции создайте скрипт импорта или используйте API для создания заявок.

## Лицензия

Внутренний проект для программы "Доброе утро"
