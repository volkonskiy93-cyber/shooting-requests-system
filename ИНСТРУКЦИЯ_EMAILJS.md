# 📧 Пошаговая инструкция по настройке EmailJS

## 🎯 Цель
Настроить автоматическую отправку писем с заявками на `pendeho098rus@yandex.ru`

---

## Шаг 1: Регистрация на EmailJS (5 минут)

1. **Откройте сайт:** https://www.emailjs.com/
2. **Нажмите "Sign Up"** (можно войти через Google для быстрой регистрации)
3. **Заполните форму:**
   - Email: ваш email
   - Password: придумайте пароль
   - Или войдите через Google
4. **Подтвердите email** (если нужно)

**✅ Бесплатный план:** 200 писем в месяц - достаточно для работы!

---

## Шаг 2: Подключение Email сервиса (10 минут)

### Вариант A: Gmail (РЕКОМЕНДУЕТСЯ - самый простой)

1. В панели EmailJS перейдите в **"Email Services"** (в меню слева)
2. Нажмите **"Add New Service"**
3. Выберите **"Gmail"**
4. Нажмите **"Connect Account"**
5. Войдите в ваш Gmail аккаунт и разрешите доступ
6. **✅ Запомните Service ID** (будет показан, например: `service_abc123`)

### Вариант B: Yandex (для отправки на yandex.ru)

1. В Email Services нажмите **"Add New Service"**
2. Выберите **"Other"** → **"Custom SMTP"**
3. Заполните данные Yandex:
   ```
   SMTP Server: smtp.yandex.ru
   SMTP Port: 465 (SSL) или 587 (TLS)
   SMTP Username: ваш_логин@yandex.ru
   SMTP Password: пароль приложения Yandex
   ```
4. **Важно!** Для Yandex нужен **пароль приложения**:
   - Перейдите: https://passport.yandex.ru/profile → Безопасность
   - Создайте пароль приложения для почты
   - Используйте его в настройках SMTP
5. **✅ Запомните Service ID**

---

## Шаг 3: Создание Email Template (5 минут)

1. В панели EmailJS перейдите в **"Email Templates"** (в меню слева)
2. Нажмите **"Create New Template"**

### Настройте шаблон:

**Template Name:** `Заявка на съемку`

**To Email:**
```
{{to_email}}
```

**Subject:**
```
{{subject}}
```

**Content (тело письма):**
```
{{message}}
```

**From Name:**
```
Заявки на съемку
```

**From Email:**
```
ваш_email@gmail.com
```
(Или email, который вы настроили в Email Service)

3. Нажмите **"Save"**
4. **✅ Запомните Template ID** (будет показан, например: `template_xyz789`)

---

## Шаг 4: Получение Public Key (2 минуты)

1. В панели EmailJS перейдите в **"Account"** (в меню слева)
2. Откройте вкладку **"General"**
3. Найдите раздел **"API Keys"**
4. Найдите **"Public Key"** (например: `abcdefghijklmnop`)
5. **✅ Скопируйте Public Key**

---

## Шаг 5: Заполнение конфигурации в коде (1 минута)

### Откройте файл: `email-service.js`

Найдите строки 8-12 и замените значения:

```javascript
this.emailjsConfig = {
    serviceId: 'YOUR_SERVICE_ID',      // ← Вставьте ваш Service ID
    templateId: 'YOUR_TEMPLATE_ID',    // ← Вставьте ваш Template ID
    publicKey: 'YOUR_PUBLIC_KEY'       // ← Вставьте ваш Public Key
};
```

### Пример заполненной конфигурации:

```javascript
this.emailjsConfig = {
    serviceId: 'service_abc123',           // ← Ваш Service ID из шага 2
    templateId: 'template_xyz789',         // ← Ваш Template ID из шага 3
    publicKey: 'abcdefghijklmnop'          // ← Ваш Public Key из шага 4
};
```

**✅ Сохраните файл!**

---

## Шаг 6: Проверка работы (2 минуты)

1. **Откройте `index.html` в браузере**
2. **Войдите в систему** (используйте email и пароль)
3. **Выберите "Корреспондент"**
4. **Создайте тестовую заявку** (любого типа)
5. **Нажмите "Отправить заявку"**
6. **Должно появиться сообщение:** "Заявка успешно создана и отправлена на email!"

### Если не работает:

**Откройте консоль браузера** (F12 → Console) и проверьте:
- Если видите ошибку - проверьте, что все ID и ключи введены правильно
- Убедитесь, что Email Service подключен и работает
- Проверьте, что Template настроен правильно

---

## 🔧 Настройка для отправки на другой email

По умолчанию письма отправляются на: `pendeho098rus@yandex.ru`

Чтобы изменить email получателя, откройте `email-service.js` и найдите строку 37:

```javascript
async sendApplicationEmail(formData, applicationId, userEmail, emailRecipient = 'pendeho098rus@yandex.ru') {
```

Или измените значение по умолчанию в функции `createWordDocumentAndSend` в `deepseek_htmlобщая.html`.

---

## ⚠️ Важные моменты

1. **Бесплатный план EmailJS:** 200 писем/месяц
2. **EmailJS не поддерживает вложения в бесплатном плане** - Word файл скачивается, а письмо отправляется с текстом заявки
3. **Проверьте папку "Спам"** - первое письмо может попасть туда
4. **Если используете Gmail:** проверьте настройки безопасности аккаунта

---

## ✅ Готово!

После выполнения всех шагов заявки будут автоматически отправляться на email при создании!

---

## 🆘 Проблемы?

### Ошибка: "EmailJS не настроен"
- Проверьте, что все три параметра (serviceId, templateId, publicKey) заполнены в `email-service.js`

### Ошибка: "Service ID not found"
- Убедитесь, что Email Service подключен и активен в панели EmailJS

### Ошибка: "Template ID not found"
- Проверьте, что Template создан и сохранен в панели EmailJS

### Письма не приходят
- Проверьте папку "Спам"
- Убедитесь, что Email Service подключен к реальному аккаунту
- Проверьте настройки безопасности почтового аккаунта (Gmail/Yandex)
