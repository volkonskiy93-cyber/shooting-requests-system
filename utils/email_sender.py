"""
Отправка email через API сервис Resend
"""

import os
import resend
import base64
from html import escape

def send_email_with_attachment(
    to_email,
    subject,
    file_path,
    filename,
    sender_display_email=None,
    sender_display_name=None
):
    """
    Отправка email с вложением через Resend API
    
    Args:
        to_email: адрес получателя
        subject: тема письма
        file_path: путь к файлу для вложения
        filename: имя файла во вложении
        sender_display_email: email корреспондента для отображения
        sender_display_name: имя корреспондента для отображения
    
    Returns:
        dict с полями success, error, provider_id
    """
    api_key = os.environ.get('RESEND_API_KEY')
    
    if not api_key:
        print("⚠️ RESEND_API_KEY не настроен. Email не будет отправлен.")
        print(f"Заявка сохранена в базе, но не отправлена на {to_email}")
        return {
            "success": False,
            "error": "RESEND_API_KEY не настроен в окружении сервера",
            "provider_id": None,
        }

    resend.api_key = api_key

    try:
        # Подготовка вложения
        attachment_data = None
        if file_path and os.path.exists(file_path):
            with open(file_path, "rb") as f:
                attachment_data = base64.b64encode(f.read()).decode()

        # Формируем имя отправителя
        # Если у нас нет своего домена, мы можем отправлять только с адреса resend, 
        # но в имени указывать кого угодно.
        sender_display_name = (sender_display_name or "").strip()
        sender_display_email = (sender_display_email or "").strip()
        safe_sender_name = escape(sender_display_name or 'Не указан')
        safe_sender_email = escape(sender_display_email or 'Не указана')
        safe_to_email = escape(to_email or '')
        safe_filename = escape(filename or '')

        from_name = "Система Заявок"
        if sender_display_name and sender_display_email:
            from_name = f"Заявка от {sender_display_name} ({sender_display_email})"
        elif sender_display_name:
            from_name = f"Заявка от {sender_display_name}"
        elif sender_display_email:
            from_name = f"Заявка от {sender_display_email}"
        
        # ВАЖНО: Если у вас нет подтвержденного домена, Resend разрешает отправлять 
        # только с адреса onboarding@resend.dev на ваш же email.
        # После подтверждения домена (например davinci.ru) можно будет ставить любой адрес.
        from_email = os.environ.get('EMAIL_FROM', 'onboarding@resend.dev')

        params = {
            "from": f"{from_name} <{from_email}>",
            "to": [to_email],
            "subject": subject,
            "reply_to": sender_display_email if sender_display_email else to_email,
            "html": f"""
                <h3>Новая заявка на видеосъемку</h3>
                <p><b>Отправитель:</b> {safe_sender_name}</p>
                <p><b>Личная почта автора:</b> {safe_sender_email}</p>
                <p><b>Служебный адрес получателя:</b> {safe_to_email}</p>
                <p>К письму прикреплен файл: {safe_filename}</p>
                <br>
                <hr>
                <p><small>Это автоматическое уведомление системы DaVinci</small></p>
            """
        }

        if attachment_data:
            params["attachments"] = [
                {
                    "content": attachment_data,
                    "filename": filename,
                }
            ]

        # Отправка через SDK
        r = resend.Emails.send(params)
        provider_id = r.get('id') if isinstance(r, dict) else None
        print(f"✅ Email успешно отправлен через Resend! ID: {provider_id}")
        return {
            "success": True,
            "error": None,
            "provider_id": provider_id,
        }

    except Exception as e:
        print(f"❌ Ошибка отправки через Resend API: {e}")
        return {
            "success": False,
            "error": str(e),
            "provider_id": None,
        }
