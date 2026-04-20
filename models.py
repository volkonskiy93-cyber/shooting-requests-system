"""
Модели базы данных для системы заявок на видеосъемку
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class User(db.Model):
    """Модель пользователя"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='correspondent')
    approval_status = db.Column(db.String(20), nullable=False, default='pending')
    approved_at = db.Column(db.DateTime, nullable=True)
    approved_by_email = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'fullName': self.full_name,
            'role': self.role,
            'approvalStatus': self.approval_status,
            'approvedAt': self.approved_at.isoformat() if self.approved_at else None,
            'approvedByEmail': self.approved_by_email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    """Модель заявки на видеосъемку"""
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Связь с пользователем
    
    # Тип подрядчика
    contractor = db.Column(db.String(50), nullable=False)  # figaro, ttk, producer
    
    # Основные поля
    story_title = db.Column(db.String(500), nullable=False)
    annotation = db.Column(db.Text)
    notes = db.Column(db.Text)
    accreditation = db.Column(db.String(10), default='no')
    
    # Персонал
    director = db.Column(db.String(255))
    correspondent = db.Column(db.String(255))
    producer = db.Column(db.String(255))
    operator = db.Column(db.String(255))
    video_engineer = db.Column(db.String(255))
    
    # Даты и время
    application_date = db.Column(db.Date)
    shooting_date = db.Column(db.Date)
    start_time = db.Column(db.String(20))
    end_time = db.Column(db.String(20))
    broadcast_date = db.Column(db.Date)
    
    # Оборудование (JSON)
    equipment = db.Column(db.Text)  # JSON массив объектов
    
    # Дополнительные поля для TTK
    clarifications = db.Column(db.Text)
    extension = db.Column(db.String(255))
    car_number = db.Column(db.String(50))
    submission_date = db.Column(db.Date)
    
    # Дополнительные поля для Producer
    summary = db.Column(db.Text)
    heroes = db.Column(db.Text)
    correspondent_contacts = db.Column(db.String(255))
    
    # Статус и комментарии
    status = db.Column(db.String(20), default='new')  # new, in_progress, approved, rejected
    comments = db.Column(db.Text)  # JSON массив комментариев
    
    # Метаданные
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Все данные формы в JSON (для совместимости)
    form_data = db.Column(db.Text)  # Полный JSON формы
    
    def to_dict(self):
        """Преобразование в словарь для JSON"""
        return {
            'id': self.id,
            'contractor': self.contractor,
            'storyTitle': self.story_title,
            'annotation': self.annotation,
            'notes': self.notes,
            'accreditation': self.accreditation,
            'director': self.director,
            'correspondent': self.correspondent,
            'producer': self.producer,
            'operator': self.operator,
            'videoEngineer': self.video_engineer,
            'applicationDate': self.application_date.isoformat() if self.application_date else None,
            'shootingDate': self.shooting_date.isoformat() if self.shooting_date else None,
            'startTime': self.start_time,
            'endTime': self.end_time,
            'broadcastDate': self.broadcast_date.isoformat() if self.broadcast_date else None,
            'equipment': json.loads(self.equipment) if self.equipment else [],
            'clarifications': self.clarifications,
            'extension': self.extension,
            'carNumber': self.car_number,
            'submissionDate': self.submission_date.isoformat() if self.submission_date else None,
            'summary': self.summary,
            'heroes': self.heroes,
            'correspondentContacts': self.correspondent_contacts,
            'status': self.status,
            'comments': json.loads(self.comments) if self.comments else [],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
