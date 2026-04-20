"""Скрипт для создания тестового пользователя"""
import sys
import os

# Добавляем текущую директорию в путь
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

# Тестовые данные
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test1234"

with app.app_context():
    # Проверяем, существует ли пользователь
    existing_user = User.query.filter_by(email=TEST_EMAIL).first()
    
    if existing_user:
        print(f"✅ Пользователь {TEST_EMAIL} уже существует")
        print(f"   Email: {TEST_EMAIL}")
        print(f"   Пароль: {TEST_PASSWORD}")
    else:
        # Создаем нового пользователя
        password_hash = bcrypt.generate_password_hash(TEST_PASSWORD).decode('utf-8')
        user = User(email=TEST_EMAIL, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()
        
        print("=" * 60)
        print("  ТЕСТОВЫЙ ПОЛЬЗОВАТЕЛЬ СОЗДАН")
        print("=" * 60)
        print()
        print(f"Email: {TEST_EMAIL}")
        print(f"Пароль: {TEST_PASSWORD}")
        print()
        print("Теперь вы можете войти в систему с этими данными")
        print("=" * 60)
