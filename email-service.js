// Email сервис для отправки заявок
// Вариант 1: EmailJS (простой, работает из браузера) - 200 писем/месяц бесплатно
// Вариант 2: Serverless функция (SMTP) - практически неограниченно, поддерживает вложения ⭐ РЕКОМЕНДУЕТСЯ
// Вариант 3: Telegram Bot API - абсолютно бесплатно и безлимитно
//
// ═══════════════════════════════════════════════════════════════
// 📧 НАСТРОЙКА EMAILJS:
// ═══════════════════════════════════════════════════════════════
// 
// 1. Зарегистрируйтесь на https://www.emailjs.com/ (бесплатно)
// 2. Подключите Email Service (Gmail/Yandex/etc) - получите Service ID
// 3. Создайте Email Template - получите Template ID
// 4. Получите Public Key в разделе Account → General
// 5. Заполните значения ниже и сохраните файл
//
// 📖 Подробная инструкция: ИНСТРУКЦИЯ_EMAILJS.md
// 📝 Шаблон для заполнения: КОНФИГУРАЦИЯ_EMAILJS.txt
//
// ═══════════════════════════════════════════════════════════════

class EmailService {
    constructor() {
        // ═══════════════════════════════════════════════════════
        // ⚙️ КОНФИГУРАЦИЯ EMAILJS - ЗАПОЛНИТЕ ЗДЕСЬ:
        // ═══════════════════════════════════════════════════════
        // 
        // Получите эти значения после регистрации на emailjs.com:
        // - Service ID: EmailJS → Email Services → Service ID
        // - Template ID: EmailJS → Email Templates → Template ID  
        // - Public Key: EmailJS → Account → General → Public Key
        //
        // Пример заполненной конфигурации:
        // serviceId: 'service_abc123',
        // templateId: 'template_xyz789',
        // publicKey: 'abcdefghijklmnop'
        //
        this.emailjsConfig = {
            serviceId: 'YOUR_SERVICE_ID',      // ← Вставьте ваш Service ID
            templateId: 'YOUR_TEMPLATE_ID',    // ← Вставьте ваш Template ID
            publicKey: 'YOUR_PUBLIC_KEY'       // ← Вставьте ваш Public Key
        };
        
        this.enabled = false; // Включить после настройки
        
        // ═══════════════════════════════════════════════════════
        // ⚙️ КОНФИГУРАЦИЯ GOOGLE APPS SCRIPT - ЗАПОЛНИТЕ ЗДЕСЬ:
        // ═══════════════════════════════════════════════════════
        // 
        // 1. Создайте Google Apps Script (см. НАСТРОЙКА_GOOGLE_APPS_SCRIPT.md)
        // 2. Разверните как веб-приложение
        // 3. Скопируйте URL веб-приложения сюда:
        //
        // Пример: 'https://script.google.com/macros/s/AKfycby.../exec'
        //
        this.googleAppsScriptUrl = null; // ← Вставьте URL вашего Google Apps Script
    }
    
    // Инициализация EmailJS
    initEmailJS() {
        if (typeof emailjs !== 'undefined' && 
            this.emailjsConfig.publicKey !== 'YOUR_PUBLIC_KEY' &&
            this.emailjsConfig.serviceId !== 'YOUR_SERVICE_ID') {
            try {
                emailjs.init(this.emailjsConfig.publicKey);
                this.enabled = true;
                return true;
            } catch (error) {
                console.error('Ошибка инициализации EmailJS:', error);
                this.enabled = false;
                return false;
            }
        }
        this.enabled = false;
        return false;
    }
    
    // Отправка письма с данными заявки (без вложения - EmailJS бесплатный план)
    async sendApplicationEmail(formData, applicationId, userEmail, emailRecipient = 'pendeho098rus@yandex.ru') {
        if (!this.enabled) {
            console.warn('EmailJS не настроен. Настройте конфигурацию в email-service.js');
            return { success: false, message: 'Email сервис не настроен' };
        }
        
        try {
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString + 'T00:00:00');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };
            
            // Определяем тип заявки и формируем содержимое письма
            let emailBody = '';
            let subjectPrefix = '';
            
            if (formData.contractor === 'producer') {
                subjectPrefix = 'Заявка продюсерам';
                emailBody = `
Заявка продюсерам
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Краткое содержание: ${formData.summary || '-'}
${formData.heroes ? `Герои: ${formData.heroes}` : ''}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Корреспондент: ${formData.correspondentText || formData.correspondent || '-'}
Контакты корреспондента: ${formData.correspondentContacts || '-'}
Редактор: ${formData.directorText || formData.director || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}

Номер заявки: ${applicationId.substring(0, 8)}
                `.trim();
            } else if (formData.contractor === 'figaro') {
                subjectPrefix = 'Заявка ФИГАРО';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `
Заявка на видеосъемку - ВЕК XXL (ФИГАРО)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}
                `.trim();
            } else if (formData.contractor === 'ttk') {
                subjectPrefix = 'Заявка ТТК';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `
Заявка на видеосъемку - Технологический центр ТВ (ТТК)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Уточнения: ${formData.clarifications || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Номер машины: ${formData.carNumber || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Продление: ${formData.extension || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
${formData.submissionDate ? `Дата сдачи: ${formatDate(formData.submissionDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}
                `.trim();
            }
            
            // Параметры для EmailJS
            const templateParams = {
                to_email: emailRecipient,
                from_email: userEmail || 'noreply@dobroeyutro.ru',
                subject: `${subjectPrefix}: ${formData.storyTitle || 'Новая заявка'}`,
                message: emailBody,
                application_id: applicationId.substring(0, 8),
                shooting_date: formatDate(formData.shootingDate)
            };
            
            // Отправка через EmailJS
            const response = await emailjs.send(
                this.emailjsConfig.serviceId,
                this.emailjsConfig.templateId,
                templateParams
            );
            
            return { 
                success: true, 
                message: 'Письмо отправлено успешно',
                response: response 
            };
            
        } catch (error) {
            console.error('Ошибка отправки email:', error);
            return { 
                success: false, 
                message: 'Ошибка отправки письма: ' + error.message 
            };
        }
    }
    
    // Отправка через Serverless функцию (для вложений)
    async sendWithAttachment(wordFileBlob, formData, applicationId) {
        try {
            // Конвертируем Blob в base64
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const base64File = reader.result.split(',')[1];
                    const fileName = `Заявка_продюсерам_${new Date(formData.shootingDate).toLocaleDateString('ru-RU')}.doc`;
                    
                    // Отправка на serverless endpoint
                    const response = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: 'pendeho098rus@yandex.ru',
                            subject: `Заявка продюсерам: ${formData.storyTitle}`,
                            body: this.formatEmailBody(formData, applicationId),
                            attachment: {
                                filename: fileName,
                                content: base64File,
                                type: 'application/msword'
                            }
                        })
                    });
                    
                    if (response.ok) {
                        resolve({ success: true, message: 'Email отправлен с вложением' });
                    } else {
                        reject({ success: false, message: 'Ошибка отправки' });
                    }
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(wordFileBlob);
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    formatEmailBody(formData, applicationId) {
        // Форматирование тела письма
        // (та же логика что и в sendApplicationEmail)
        return `Заявка продюсерам...`; // Упрощенная версия
    }
    
    // ═══════════════════════════════════════════════════════════
    // 🔥 НОВЫЙ МЕТОД: Отправка через Serverless функцию (SMTP)
    // ═══════════════════════════════════════════════════════════
    // Преимущества:
    // - Практически неограниченное количество писем
    // - Поддерживает вложения (Word файл)
    // - Работает через Gmail/Yandex SMTP
    // - Бесплатно через Vercel/Netlify
    //
    // Для использования:
    // 1. Задеплойте проект на Vercel или Netlify
    // 2. Настройте переменные окружения: SMTP_USER, SMTP_PASSWORD
    // 3. Используйте этот метод вместо sendApplicationEmail
    //
    async sendApplicationEmailWithAttachment(wordFileBlob, formData, applicationId, emailRecipient = 'pendeho098rus@yandex.ru', serverlessUrl = null) {
        try {
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString + 'T00:00:00');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };
            
            // Используем ту же логику формирования письма, что и в sendApplicationEmail
            let emailBody = '';
            let subjectPrefix = '';
            
            if (formData.contractor === 'producer') {
                subjectPrefix = 'Заявка продюсерам';
                emailBody = `Заявка продюсерам
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Краткое содержание: ${formData.summary || '-'}
${formData.heroes ? `Герои: ${formData.heroes}` : ''}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Корреспондент: ${formData.correspondentText || formData.correspondent || '-'}
Контакты корреспондента: ${formData.correspondentContacts || '-'}
Редактор: ${formData.directorText || formData.director || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}

Номер заявки: ${applicationId.substring(0, 8)}`;
            } else if (formData.contractor === 'figaro') {
                subjectPrefix = 'Заявка ФИГАРО';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `Заявка на видеосъемку - ВЕК XXL (ФИГАРО)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}`;
            } else if (formData.contractor === 'ttk') {
                subjectPrefix = 'Заявка ТТК';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `Заявка на видеосъемку - Технологический центр ТВ (ТТК)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Уточнения: ${formData.clarifications || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Номер машины: ${formData.carNumber || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Продление: ${formData.extension || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
${formData.submissionDate ? `Дата сдачи: ${formatDate(formData.submissionDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}`;
            }
            
            // Определяем URL serverless функции
            const apiUrl = serverlessUrl || (typeof window !== 'undefined' ? window.location.origin : '') + '/api/send-email';
            
            // Конвертируем Blob в base64
            const base64Promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(wordFileBlob);
            });
            
            const base64File = await base64Promise;
            
            // Имя файла
            const fileName = formData.contractor === 'producer' 
                ? `Заявка_продюсерам_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`
                : formData.contractor === 'figaro'
                ? `Заявка_ФИГАРО_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`
                : `Заявка_ТТК_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`;
            
            // Отправка на serverless функцию
            console.log('Отправка email через serverless функцию:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: emailRecipient,
                    subject: `${subjectPrefix}: ${formData.storyTitle || 'Новая заявка'}`,
                    message: emailBody,
                    attachment: {
                        filename: fileName,
                        content: base64File,
                        type: 'application/msword'
                    }
                })
            });
            
            console.log('Ответ от serverless функции:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка ответа serverless функции:', errorText);
                try {
                    const result = JSON.parse(errorText);
                    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
                } catch (e) {
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            }
            
            const result = await response.json();
            console.log('Результат отправки:', result);
            
            if (response.ok && result.success) {
                return {
                    success: true,
                    message: 'Email отправлен с вложением Word файла',
                    result: result
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Ошибка отправки email',
                    error: result
                };
            }
            
        } catch (error) {
            console.error('Ошибка отправки email через serverless:', error);
            return {
                success: false,
                message: 'Ошибка отправки: ' + error.message
            };
        }
    }
    
    // ═══════════════════════════════════════════════════════════
    // 🔥 НОВЫЙ МЕТОД: Отправка через Google Apps Script ⭐ РЕКОМЕНДУЕТСЯ
    // ═══════════════════════════════════════════════════════════
    // Преимущества:
    // - Абсолютно бесплатно
    // - Неограниченное количество писем (100/день бесплатно)
    // - Поддерживает вложения (Word файл)
    // - Работает через Gmail
    // - Очень просто настроить
    //
    // Для использования:
    // 1. Создайте Google Apps Script (см. НАСТРОЙКА_GOOGLE_APPS_SCRIPT.md)
    // 2. Разверните как веб-приложение
    // 3. Укажите URL в this.googleAppsScriptUrl
    // 4. Используйте этот метод вместо sendApplicationEmailWithAttachment
    //
    async sendViaGoogleAppsScript(wordFileBlob, formData, applicationId, emailRecipient = 'pendeho098rus@yandex.ru', scriptUrl = null) {
        try {
            // Проверка наличия URL
            const apiUrl = scriptUrl || this.googleAppsScriptUrl;
            if (!apiUrl) {
                throw new Error('Google Apps Script URL не настроен. Укажите URL в email-service.js или передайте его как параметр.');
            }
            
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString + 'T00:00:00');
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };
            
            // Используем ту же логику формирования письма
            let emailBody = '';
            let subjectPrefix = '';
            
            if (formData.contractor === 'producer') {
                subjectPrefix = 'Заявка продюсерам';
                emailBody = `Заявка продюсерам
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Краткое содержание: ${formData.summary || '-'}
${formData.heroes ? `Герои: ${formData.heroes}` : ''}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Корреспондент: ${formData.correspondentText || formData.correspondent || '-'}
Контакты корреспондента: ${formData.correspondentContacts || '-'}
Редактор: ${formData.directorText || formData.director || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}

Номер заявки: ${applicationId.substring(0, 8)}`;
            } else if (formData.contractor === 'figaro') {
                subjectPrefix = 'Заявка ФИГАРО';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `Заявка на видеосъемку - ВЕК XXL (ФИГАРО)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}`;
            } else if (formData.contractor === 'ttk') {
                subjectPrefix = 'Заявка ТТК';
                const equipmentText = formData.equipment && formData.equipment.length > 0 
                    ? formData.equipment.map(eq => `${eq.main || '-'} (${eq.mainQuantity || 0} шт.)${eq.additional ? ` + ${eq.additional} (${eq.additionalQuantity || 0} шт.)` : ''}`).join('\n')
                    : '-';
                
                emailBody = `Заявка на видеосъемку - Технологический центр ТВ (ТТК)
Программа "Доброе утро"

Название сюжета: ${formData.storyTitle || '-'}
Аннотация: ${formData.annotation || '-'}
Примечания: ${formData.notes || '-'}
Аккредитация: ${formData.accreditation || '-'}
Уточнения: ${formData.clarifications || '-'}
Режиссер (редактор): ${formData.director || '-'}
Корреспондент: ${formData.correspondent || '-'}
Продюсер: ${formData.producer || '-'}
Оператор: ${formData.operator || '-'}
Видеоинженер: ${formData.videoEngineer || '-'}
Номер машины: ${formData.carNumber || '-'}
Дата подачи заявки: ${formatDate(formData.applicationDate)}
Дата съемки: ${formatDate(formData.shootingDate)}
Время съемки: ${formData.startTime || '-'} - ${formData.endTime || '-'}
Продление: ${formData.extension || '-'}
${formData.broadcastDate ? `Дата эфира: ${formatDate(formData.broadcastDate)}` : ''}
${formData.submissionDate ? `Дата сдачи: ${formatDate(formData.submissionDate)}` : ''}
Оборудование: ${equipmentText}

Номер заявки: ${applicationId.substring(0, 8)}`;
            }
            
            // Конвертируем Blob в base64
            const base64Promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                };
                reader.onerror = reject;
                reader.readAsDataURL(wordFileBlob);
            });
            
            const base64File = await base64Promise;
            
            // Имя файла
            const fileName = formData.contractor === 'producer' 
                ? `Заявка_продюсерам_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`
                : formData.contractor === 'figaro'
                ? `Заявка_ФИГАРО_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`
                : `Заявка_ТТК_${formatDate(formData.shootingDate)}_${(formData.storyTitle || applicationId.substring(0, 8)).substring(0, 20).replace(/[<>:"/\\|?*]/g, '_')}.doc`;
            
            // Отправка на Google Apps Script
            console.log('Отправка email через Google Apps Script:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: emailRecipient,
                    subject: `${subjectPrefix}: ${formData.storyTitle || 'Новая заявка'}`,
                    message: emailBody,
                    attachment: {
                        filename: fileName,
                        content: base64File,
                        type: 'application/msword'
                    }
                })
            });
            
            console.log('Ответ от Google Apps Script:', response.status, response.statusText);
            
            const responseText = await response.text();
            console.log('Текст ответа:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Не удалось распарсить ответ: ${responseText}`);
            }
            
            if (result.success) {
                return {
                    success: true,
                    message: 'Email отправлен с вложением Word файла через Google Apps Script',
                    result: result
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Ошибка отправки email',
                    error: result
                };
            }
            
        } catch (error) {
            console.error('Ошибка отправки email через Google Apps Script:', error);
            return {
                success: false,
                message: 'Ошибка отправки: ' + error.message
            };
        }
    }
}

// Создаем глобальный экземпляр
const emailService = new EmailService();
