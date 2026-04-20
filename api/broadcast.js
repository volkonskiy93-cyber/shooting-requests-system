// API endpoint для рассылки через HTTP запросы
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Загрузка конфигурации
const configPath = path.join(__dirname, '..', 'bot_config.json');
let config = {
  token: '',
  recipients: []
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Ошибка при загрузке конфигурации:', error.message);
  }
}

// Проверка токена из переменных окружения
if (process.env.TELEGRAM_BOT_TOKEN) {
  config.token = process.env.TELEGRAM_BOT_TOKEN;
}

module.exports = async (req, res) => {
  // Установка CORS заголовков
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен. Используйте POST.' });
  }

  try {
    const { message, secret } = req.body;

    // Простая проверка секретного ключа (можно улучшить)
    if (secret && secret !== process.env.BROADCAST_SECRET) {
      return res.status(401).json({ error: 'Неверный секретный ключ' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Сообщение не указано' });
    }

    if (!config.token) {
      return res.status(500).json({ error: 'Токен бота не настроен' });
    }

    if (config.recipients.length === 0) {
      return res.status(400).json({ error: 'Список получателей пуст' });
    }

    // Создание экземпляра бота
    const bot = new TelegramBot(config.token);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Отправка сообщений
    for (const recipientId of config.recipients) {
      try {
        await bot.sendMessage(recipientId, `📢 Рассылка:\n\n${message}`);
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({ recipientId, error: error.message });
        
        // Удаление заблокированных пользователей
        if (error.response && error.response.statusCode === 403) {
          const index = config.recipients.indexOf(recipientId);
          if (index > -1) {
            config.recipients.splice(index, 1);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Рассылка выполнена',
      stats: {
        total: config.recipients.length,
        success: successCount,
        failed: failCount
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Ошибка при рассылке:', error);
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      message: error.message 
    });
  }
};
