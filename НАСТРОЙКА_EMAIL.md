# Настройка автоматической отправки Email

## Вариант 1: EmailJS (РЕКОМЕНДУЕТСЯ - простой, без backend)

### Шаг 1: Регистрация на EmailJS
1. Перейдите на https://www.emailjs.com/
2. Зарегистрируйтесь (бесплатно, можно через Google)
3. Бесплатный план: 200 писем/месяц

### Шаг 2: Настройка Email сервиса
1. В панели EmailJS перейдите в **Email Services**
2. Нажмите **Add New Service**
3. Выберите ваш email провайдер:
   - Gmail
   - Outlook
   - Yandex
   - Или Custom SMTP
4. Следуйте инструкциям для подключения
5. Запомните **Service ID**

### Шаг 3: Создание Email Template
1. Перейдите в **Email Templates**
2. Нажмите **Create New Template**
3. Настройте шаблон:
   ```
   To Email: {{to_email}}
   Subject: {{subject}}
   
   Body:
   {{message}}
   
   Номер заявки: {{application_id}}
   Дата съемки: {{shooting_date}}
   ```
4. **From Name:** Заявки на съемку
5. **From Email:** ваш email (настроенный в сервисе)
6. Запомните **Template ID**

### Шаг 4: Получение Public Key
1. Перейдите в **Account** → **General**
2. Найдите **Public Key**
3. Скопируйте его

### Шаг 5: Настройка в коде
Откройте файл `email-service.js` и замените:
```javascript
this.emailjsConfig = {
    serviceId: 'YOUR_SERVICE_ID',      // ← Замените на ваш Service ID
    templateId: 'YOUR_TEMPLATE_ID',    // ← Замените на ваш Template ID
    publicKey: 'YOUR_PUBLIC_KEY'       // ← Замените на ваш Public Key
};
```

### Шаг 6: Подключение библиотеки
В файле `deepseek_htmlобщая.html` добавьте перед `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script src="auth.js"></script>
<script src="email-service.js"></script>
```

---

## Вариант 2: Serverless функция (для отправки с вложениями)

Если нужна отправка Word файла как вложения, используйте Serverless функцию на Vercel/Netlify.

### Создание функции на Vercel:

1. Создайте папку `api` в корне проекта
2. Создайте файл `api/send-email.js` (см. пример ниже)
3. Загрузите проект на Vercel
4. Настройте переменные окружения для SMTP

---

## Текущая реализация

**Сейчас используется:** EmailJS (простой вариант)
- Отправляет текст заявки в email
- Работает без backend сервера
- Автоматически при создании заявки продюсерам

**Для отправки Word файла как вложения** - нужен Serverless вариант.
