"""Тестовый скрипт для проверки запуска приложения"""
import sys
import os

# Добавляем текущую директорию в путь
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("Проверка импортов...")
print("=" * 50)

try:
    print("1. Импорт Flask...")
    from flask import Flask
    print("   ✅ Flask импортирован")
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    sys.exit(1)

try:
    print("2. Импорт app...")
    from app import app
    print("   ✅ app импортирован")
except Exception as e:
    print(f"   ❌ Ошибка импорта app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("3. Импорт models...")
    from models import db
    print("   ✅ models импортированы")
except Exception as e:
    print(f"   ❌ Ошибка импорта models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 50)
print("✅ Все импорты успешны!")
print("=" * 50)
print()
print("Запуск приложения...")
print("Откройте: http://localhost:5000")
print("=" * 50)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("База данных инициализирована")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
