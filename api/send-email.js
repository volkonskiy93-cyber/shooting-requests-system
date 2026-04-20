// Serverless функция для отправки email через SMTP
// Работает на Vercel/Netlify бесплатно
// Использует nodemailer для отправки через Gmail/Yandex SMTP

const nodemailer = require('nodemailer');

// Обработчик serverless функции
module.exports = async (req, res) => {
    // Настройка CORS для работы из браузера
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка OPTIONS запроса (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            to, 
            subject, 
            message, 
            attachment, // { filename, content (base64), type }
            smtpConfig 
        } = req.body;

        // Проверка обязательных полей
        if (!to || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: to, subject, message' 
            });
        }

        // Получаем SMTP конфигурацию из переменных окружения или из запроса
        const smtp = smtpConfig || {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for другие порты
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD // Для Gmail: пароль приложения
            }
        };

        // Проверка конфигурации SMTP
        if (!smtp.auth.user || !smtp.auth.pass) {
            return res.status(500).json({ 
                success: false, 
                error: 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.' 
            });
        }

        // Создаем транспорт для отправки
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: smtp.auth,
            tls: {
                rejectUnauthorized: false // Для некоторых SMTP серверов
            }
        });

        // Подготовка вложения (если есть)
        const attachments = [];
        if (attachment && attachment.content) {
            attachments.push({
                filename: attachment.filename || 'document.doc',
                content: attachment.content,
                encoding: 'base64'
            });
        }

        // Параметры письма
        const mailOptions = {
            from: `"Заявки на съемку" <${smtp.auth.user}>`,
            to: to,
            subject: subject,
            text: message,
            html: message.replace(/\n/g, '<br>'), // Простое форматирование
            attachments: attachments
        };

        // Отправка письма
        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send email'
        });
    }
};
