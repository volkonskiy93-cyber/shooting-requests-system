# 📧 Настройка отправки email через Google Apps Script

## ✅ Преимущества этого варианта:
- Абсолютно бесплатно
- Неограниченное количество писем
- Поддерживает вложения (Word файлы)
- Работает через Gmail
- Очень просто настроить (5-10 минут)
- Не требует сервера

---

## 📋 ШАГ 1: Создание Google Apps Script

1. Откройте: https://script.google.com
2. Нажмите "Новый проект"
3. Удалите весь код в редакторе
4. Скопируйте код из файла `google-apps-script.js` (см. ниже)
5. Вставьте код в редактор
6. Сохраните проект (Ctrl+S или Cmd+S)
7. Назовите проект: "Отправка заявок на съемку"

---

## 📋 ШАГ 2: Настройка кода

В коде найдите строку:
```javascript
const RECIPIENT_EMAIL = 'pendeho098rus@yandex.ru';
```

Убедитесь, что email правильный (или измените на нужный).

---

## 📋 ШАГ 3: Развертывание как веб-приложения

1. В редакторе Google Apps Script нажмите "Развернуть" → "Новое развертывание"
2. Нажмите на значок шестеренки ⚙️ рядом с "Тип развертывания"
3. Выберите "Веб-приложение"
4. Заполните:
   - **Описание:** "Отправка заявок на съемку"
   - **Выполнять от имени:** "Меня"
   - **У кого есть доступ:** "Все"
5. Нажмите "Развернуть"
6. **ВАЖНО:** При первом развертывании Google попросит авторизоваться:
   - Нажмите "Разрешить"
   - Выберите ваш Google аккаунт
   - Нажмите "Дополнительно" → "Перейти к [название проекта] (небезопасно)"
   - Нажмите "Разрешить"
7. Скопируйте **URL веб-приложения** (он будет показан после развертывания)
   - Пример: `https://script.google.com/macros/s/AKfycby.../exec`

⚠️ **ВАЖНО:** Сохраните этот URL - он понадобится для настройки сайта!

---

## 📋 ШАГ 4: Обновление кода сайта

После получения URL веб-приложения:

1. Откройте файл `email-service.js`
2. Найдите функцию `sendApplicationEmailWithAttachment`
3. Замените URL на ваш Google Apps Script URL
4. Или используйте новый метод `sendViaGoogleAppsScript` (см. ниже)

---

## 🔧 Код для Google Apps Script

Создайте файл `google-apps-script.js` с этим содержимым:

```javascript
// Google Apps Script для отправки email с вложением
// Разверните как веб-приложение и используйте URL для отправки запросов

const RECIPIENT_EMAIL = 'pendeho098rus@yandex.ru'; // Email получателя

function doPost(e) {
  try {
    // Получаем данные из запроса
    const data = JSON.parse(e.postData.contents);
    
    const {
      to = RECIPIENT_EMAIL,
      subject,
      message,
      attachment // { filename, content (base64), type }
    } = data;
    
    // Проверка обязательных полей
    if (!subject || !message) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Missing required fields: subject, message'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Подготовка вложения (если есть)
    const attachments = [];
    if (attachment && attachment.content) {
      const blob = Utilities.newBlob(
        Utilities.base64Decode(attachment.content),
        attachment.type || 'application/msword',
        attachment.filename || 'document.doc'
      );
      attachments.push(blob);
    }
    
    // Отправка письма через Gmail
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: message,
      htmlBody: message.replace(/\n/g, '<br>'),
      attachments: attachments
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Функция для тестирования (опционально)
function testSend() {
  const testData = {
    to: RECIPIENT_EMAIL,
    subject: 'Тестовое письмо',
    message: 'Это тестовое письмо для проверки работы Google Apps Script.',
    attachment: null
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
```

---

## 🧪 Тестирование

После развертывания можно протестировать:

1. В Google Apps Script нажмите "Выполнить" → выберите функцию `testSend`
2. Или используйте тестовую страницу на сайте

---

## ✅ Готово!

После настройки:
- Ваш сайт будет отправлять файлы Word на Google Apps Script
- Google Apps Script будет автоматически отправлять письма через Gmail
- Письма будут приходить на указанный email с вложением

---

## 🔒 Безопасность

Google Apps Script безопасен:
- Запросы идут через HTTPS
- Только ваш сайт может отправлять запросы (если настроить ограничения)
- Данные не хранятся на сервере Google

---

## 📝 Примечания

- Первые несколько писем могут идти медленнее (Google проверяет безопасность)
- Лимит: 100 писем/день для бесплатного аккаунта (обычно достаточно)
- Если нужно больше - можно использовать Gmail API (тоже бесплатно)
