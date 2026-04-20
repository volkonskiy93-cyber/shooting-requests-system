// Google Apps Script для отправки email с вложением Word файла
// Инструкция по настройке: НАСТРОЙКА_GOOGLE_APPS_SCRIPT.md

// ═══════════════════════════════════════════════════════════
// ⚙️ НАСТРОЙКА: Укажите email получателя
// ═══════════════════════════════════════════════════════════
const RECIPIENT_EMAIL = 'pendeho098rus@yandex.ru';

// ═══════════════════════════════════════════════════════════
// 📧 ОСНОВНАЯ ФУНКЦИЯ: Обработка POST запросов
// ═══════════════════════════════════════════════════════════
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
      try {
        const blob = Utilities.newBlob(
          Utilities.base64Decode(attachment.content),
          attachment.type || 'application/msword',
          attachment.filename || 'document.doc'
        );
        attachments.push(blob);
      } catch (attachError) {
        // Если ошибка с вложением, отправляем письмо без него
        Logger.log('Ошибка обработки вложения: ' + attachError.toString());
      }
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
    Logger.log('Ошибка отправки email: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════
// 🧪 ТЕСТОВАЯ ФУНКЦИЯ: Для проверки работы
// ═══════════════════════════════════════════════════════════
function testSend() {
  const testData = {
    to: RECIPIENT_EMAIL,
    subject: 'Тестовое письмо - Google Apps Script',
    message: `Это тестовое письмо для проверки работы Google Apps Script.

Дата отправки: ${new Date().toLocaleString('ru-RU')}

Если вы получили это письмо - значит всё работает правильно!`,
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
