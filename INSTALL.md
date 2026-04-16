# Инструкция по установке Python версии

## Шаг 1: Установка Python

1. Скачайте Python 3.8+ с https://www.python.org/downloads/
2. При установке отметьте "Add Python to PATH"
3. Проверьте установку:
```bash
python --version
```

## Шаг 2: Установка зависимостей

Откройте терминал в папке проекта и выполните:

```bash
pip install -r requirements.txt
```

Если возникают ошибки, попробуйте:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
SECRET_KEY=ваш-секретный-ключ-здесь
DATABASE_URL=sqlite:///shooting_requests.db
EMAIL_RECIPIENT=pendeho098rus@yandex.ru
SMTP_SERVER=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=Volkonskiyser@yandex.ru
SMTP_PASSWORD=ваш-пароль-здесь
```

**Важно:** Не коммитьте файл `.env` в Git! Он содержит секретные данные.

## Шаг 4: Запуск приложения

### Вариант 1: Через run.py
```bash
python run.py
```

### Вариант 2: Напрямую через Flask
```bash
python app.py
```

### Вариант 3: С Gunicorn (для продакшена)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Шаг 5: Откройте в браузере

Перейдите по адресу: http://localhost:5000

## Структура проекта

```
.
├── app.py                 # Основное Flask приложение
├── models.py              # Модели базы данных
├── run.py                 # Скрипт запуска
├── requirements.txt       # Зависимости Python
├── .env                   # Переменные окружения (создайте сами)
├── utils/                 # Утилиты
│   ├── excel_generator.py
│   ├── word_generator.py
│   └── email_sender.py
├── templates/             # HTML шаблоны
│   ├── base.html
│   ├── index.html
│   ├── forms.html
│   └── admin.html
└── static/                # Статические файлы
    ├── forms.js
    └── admin.js
```

## Решение проблем

### Ошибка "Module not found"
Убедитесь, что все зависимости установлены:
```bash
pip install -r requirements.txt
```

### Ошибка подключения к базе данных
Убедитесь, что файл базы данных создан. При первом запуске он создается автоматически.

### Email не отправляется
Проверьте настройки SMTP в файле `.env`. Для Yandex:
- SMTP_SERVER: smtp.yandex.ru
- SMTP_PORT: 465
- Используйте пароль приложения, а не основной пароль аккаунта

### Порт 5000 занят
Измените порт в `run.py` или `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

## Миграция с JavaScript версии

Данные из localStorage не переносятся автоматически. Для переноса данных создайте скрипт импорта или используйте API для создания заявок.

## Развертывание на сервере

### Heroku
1. Создайте `Procfile`:
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

2. Разверните:
```bash
heroku create
git push heroku main
```

### VPS сервер
1. Установите Nginx как reverse proxy
2. Используйте Gunicorn для запуска приложения
3. Настройте SSL сертификат (Let's Encrypt)

## Поддержка

При возникновении проблем проверьте логи приложения и убедитесь, что все зависимости установлены правильно.
