"""Диагностика и запуск Flask приложения"""
import sys
import os

print("=" * 60)
print("  ДИАГНОСТИКА И ЗАПУСК FLASK ПРИЛОЖЕНИЯ")
print("=" * 60)
print()

# Добавляем текущую директорию в путь
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
os.chdir(current_dir)

print(f"Рабочая директория: {current_dir}")
print()

# Проверка файлов
files_to_check = ['app.py', 'models.py', 'run.py', 'requirements.txt']
print("Проверка файлов:")
for file in files_to_check:
    exists = os.path.exists(file)
    status = "✅" if exists else "❌"
    print(f"  {status} {file}")
print()

# Проверка зависимостей
print("Проверка зависимостей:")
try:
    import flask
    print(f"  ✅ Flask {flask.__version__}")
except ImportError:
    print("  ❌ Flask не установлен")
    sys.exit(1)

try:
    import flask_sqlalchemy
    print(f"  ✅ Flask-SQLAlchemy")
except ImportError:
    print("  ❌ Flask-SQLAlchemy не установлен")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    print(f"  ✅ python-dotenv")
except ImportError:
    print("  ❌ python-dotenv не установлен")
    sys.exit(1)

print()

# Импорт приложения
print("Импорт приложения...")
try:
    from app import app, db
    print("  ✅ Приложение импортировано успешно")
except Exception as e:
    print(f"  ❌ Ошибка импорта: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("=" * 60)
print("  ЗАПУСК СЕРВЕРА")
print("=" * 60)
print()
print("🌐 Сервер будет доступен по адресу: http://localhost:5000")
print()
print("Нажмите Ctrl+C для остановки сервера")
print()
print("-" * 60)
print()

# Инициализация базы данных
with app.app_context():
    try:
        db.create_all()
        print("✅ База данных инициализирована")
    except Exception as e:
        print(f"⚠️ Предупреждение при создании БД: {e}")

# Запуск сервера
try:
    app.run(debug=True, host='0.0.0.0', port=5000)
except KeyboardInterrupt:
    print()
    print("Сервер остановлен")
except Exception as e:
    print(f"❌ Ошибка при запуске сервера: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
