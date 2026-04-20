# 🚀 Настройка отправки email через Serverless функцию (SMTP)

## ✅ Преимущества этого решения:

- ✅ **Практически неограниченное** количество писем (зависит от SMTP провайдера)
- ✅ **Поддерживает вложения** (Word файл отправляется вместе с письмом)
- ✅ **Бесплатно** через Vercel или Netlify
- ✅ **Надежная доставка** через Gmail/Yandex SMTP
- ✅ **Не требует EmailJS** или других сторонних сервисов с ограничениями

---

## 📋 Что нужно:

1. Аккаунт на **Vercel** (https://vercel.com) или **Netlify** (https://netlify.com) - бесплатно
2. Gmail или Yandex аккаунт для SMTP
3. Пароль приложения для Gmail/Yandex (для безопасности)

---

## 🎯 Вариант 1: Деплой на Vercel (РЕКОМЕНДУЕТСЯ - проще всего)

### Шаг 1: Подготовка Gmail/Yandex SMTP

#### Для Gmail:
1. Перейдите: https://myaccount.google.com/security
2. Включите "2-Step Verification" (двухфакторная аутентификация)
3. Перейдите: https://myaccount.google.com/apppasswords
4. Создайте пароль приложения для "Mail"
5. **✅ Скопируйте пароль приложения** (16 символов)

#### Для Yandex:
1. Перейдите: https://passport.yandex.ru/profile → Безопасность
2. Создайте пароль приложения для почты
3. **✅ Скопируйте пароль приложения**

### Шаг 2: Загрузка проекта на Vercel

**Вариант A: Через GitHub (РЕКОМЕНДУЕТСЯ)**
1. Загрузите проект в GitHub (если еще не загружен)
2. Перейдите на https://vercel.com
3. Войдите через GitHub
4. Нажмите "Add New Project"
5. Импортируйте ваш репозиторий
6. Vercel автоматически определит настройки

**Вариант B: Через Vercel CLI**
```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт
vercel login

# Загрузите проект
vercel

# Деплой в продакшн
vercel --prod
```

### Шаг 3: Настройка переменных окружения

1. В панели Vercel перейдите в ваш проект
2. Откройте **Settings** → **Environment Variables**
3. Добавьте переменные:

```
SMTP_HOST=smtp.gmail.com          (или smtp.yandex.ru для Yandex)
SMTP_PORT=587                     (или 465 для SSL)
SMTP_SECURE=false                 (true для порта 465, false для 587)
SMTP_USER=ваш_email@gmail.com     (ваш Gmail или Yandex)
SMTP_PASSWORD=пароль_приложения   (пароль приложения из шага 1)
```

4. Нажмите **Save**

### Шаг 4: Обновление кода для использования serverless функции

В файле `deepseek_htmlобщая.html` найдите функцию `createWordDocumentAndSend` и обновите вызов email сервиса:

```javascript
// Вместо:
emailService.sendApplicationEmail(...)

// Используйте:
emailService.sendApplicationEmailWithAttachment(blob, formData, applicationId, emailRecipient, 'https://ваш-домен.vercel.app/api/send-email')
```

**Или:** Установите автоматическое определение URL:
```javascript
const apiUrl = window.location.origin + '/api/send-email';
emailService.sendApplicationEmailWithAttachment(blob, formData, applicationId, emailRecipient, apiUrl)
```

### Шаг 5: Проверка

1. Создайте тестовую заявку
2. Нажмите "Отправить заявку"
3. Проверьте почту получателя (pendeho098rus@yandex.ru)
4. **✅ Word файл должен быть во вложении!**

---

## 🎯 Вариант 2: Деплой на Netlify

### Шаг 1-3: Аналогично Vercel (подготовка SMTP, загрузка проекта)

### Шаг 4: Настройка переменных окружения в Netlify

1. В панели Netlify перейдите в ваш проект
2. Откройте **Site settings** → **Environment variables**
3. Добавьте те же переменные, что и для Vercel

### Шаг 5: Настройка serverless функции для Netlify

Если используете Netlify, функция должна быть в папке `netlify/functions/`:

Переместите `api/send-email.js` → `netlify/functions/send-email.js`

Или создайте `netlify.toml`:
```toml
[build]
  functions = "netlify/functions"
  
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## ⚙️ Настройка для работы с Yandex SMTP

Если используете Yandex, настройте переменные окружения:

```
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=ваш_логин@yandex.ru
SMTP_PASSWORD=пароль_приложения
```

---

## 🔧 Локальное тестирование

Для тестирования serverless функции локально:

```bash
# Установите Vercel CLI
npm install -g vercel

# Запустите локальный сервер
vercel dev

# Откройте в браузере
http://localhost:3000
```

Функция будет доступна на: `http://localhost:3000/api/send-email`

---

## 📊 Ограничения (БЕСПЛАТНЫЕ ПЛАНЫ):

### Vercel:
- 100 GB-часов выполнения функций/месяц
- Для ~10,000 писем в месяц - более чем достаточно

### Netlify:
- 125,000 запросов/месяц
- Для ~10,000 писем в месяц - более чем достаточно

### Gmail:
- До 500 писем/день с одного аккаунта
- Для большинства случаев достаточно

### Yandex:
- До 1,000 писем/день с одного аккаунта
- Еще больше чем Gmail

---

## 🆘 Решение проблем

### Ошибка: "SMTP credentials not configured"
- Проверьте, что все переменные окружения установлены в Vercel/Netlify
- Убедитесь, что переменные применены к нужному окружению (Production)

### Ошибка: "Authentication failed"
- Для Gmail: используйте пароль приложения, а не основной пароль
- Проверьте, что включена двухфакторная аутентификация
- Убедитесь, что SMTP_USER - это полный email адрес

### Письма не приходят
- Проверьте папку "Спам"
- Убедитесь, что SMTP_HOST и SMTP_PORT настроены правильно
- Проверьте логи в Vercel/Netlify dashboard

---

## ✅ Готово!

После настройки заявки будут автоматически отправляться на `pendeho098rus@yandex.ru` с Word файлом во вложении!

**Количество писем:** Практически неограниченно (до 500/день Gmail или 1000/день Yandex)
