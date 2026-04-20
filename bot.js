require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Загрузка конфигурации
const configPath = path.join(__dirname, 'bot_config.json');
let config = {
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  recipients: [] // массив chat_id получателей
};

// Загрузка конфигурации из файла, если существует
if (fs.existsSync(configPath)) {
  try {
    const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...savedConfig };
  } catch (error) {
    console.error('Ошибка при загрузке конфигурации:', error.message);
  }
}

// Сохранение конфигурации
function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

// Проверка наличия токена
if (!config.token) {
  console.error('❌ ОШИБКА: Токен бота не найден!');
  console.log('Создайте файл .env и добавьте: TELEGRAM_BOT_TOKEN=ваш_токен');
  console.log('Или отредактируйте bot_config.json и добавьте токен');
  process.exit(1);
}

// Создание бота
let bot;
try {
  bot = new TelegramBot(config.token, { polling: true });
  console.log('🤖 Телеграм бот запущен!');
  console.log(`🔑 Токен: ${config.token.substring(0, 10)}...`);
} catch (error) {
  console.error('❌ Ошибка при создании бота:', error.message);
  process.exit(1);
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`📨 Получена команда /start от chat_id: ${chatId}`);
  const welcomeMessage = `
👋 Привет! Я бот для рассылки сообщений.

📋 Доступные команды:
/help - Показать справку
/add - Добавить этот чат в список получателей
/remove - Удалить этот чат из списка получателей
/list - Показать список получателей
/broadcast <сообщение> - Отправить сообщение всем получателям
/test - Отправить тестовое сообщение себе
  `;
  
  bot.sendMessage(chatId, welcomeMessage).catch(error => {
    console.error(`❌ Ошибка при отправке сообщения ${chatId}:`, error.message);
  });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 Справка по командам:

/add - Добавить текущий чат в список получателей рассылки
/remove - Удалить текущий чат из списка получателей
/list - Показать количество получателей
/broadcast <текст> - Отправить сообщение всем получателям
/test - Отправить тестовое сообщение себе

💡 Пример использования:
/broadcast Привет! Это тестовая рассылка.
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Команда /add - добавить чат в список получателей
bot.onText(/\/add/, (msg) => {
  const chatId = msg.chat.id;
  
  if (!config.recipients.includes(chatId)) {
    config.recipients.push(chatId);
    saveConfig();
    bot.sendMessage(chatId, `✅ Ваш чат (ID: ${chatId}) добавлен в список получателей!`);
  } else {
    bot.sendMessage(chatId, `ℹ️ Ваш чат уже есть в списке получателей.`);
  }
});

// Команда /remove - удалить чат из списка получателей
bot.onText(/\/remove/, (msg) => {
  const chatId = msg.chat.id;
  
  const index = config.recipients.indexOf(chatId);
  if (index > -1) {
    config.recipients.splice(index, 1);
    saveConfig();
    bot.sendMessage(chatId, `✅ Ваш чат удален из списка получателей.`);
  } else {
    bot.sendMessage(chatId, `ℹ️ Ваш чат не найден в списке получателей.`);
  }
});

// Команда /list - показать список получателей
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const count = config.recipients.length;
  
  if (count === 0) {
    bot.sendMessage(chatId, `📋 Список получателей пуст. Используйте /add для добавления.`);
  } else {
    bot.sendMessage(chatId, `📋 Количество получателей: ${count}\n\nID получателей:\n${config.recipients.join('\n')}`);
  }
});

// Команда /test - отправить тестовое сообщение себе
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '✅ Тестовое сообщение получено! Бот работает корректно.');
});

// Команда /broadcast - рассылка сообщения всем получателям
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const senderId = msg.chat.id;
  const message = match[1];
  
  if (config.recipients.length === 0) {
    bot.sendMessage(senderId, '❌ Список получателей пуст! Используйте /add для добавления получателей.');
    return;
  }
  
  bot.sendMessage(senderId, `📤 Начинаю рассылку сообщения ${config.recipients.length} получателям...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const recipientId of config.recipients) {
    try {
      await bot.sendMessage(recipientId, `📢 Рассылка:\n\n${message}`);
      successCount++;
    } catch (error) {
      console.error(`Ошибка при отправке сообщения ${recipientId}:`, error.message);
      failCount++;
      
      // Если пользователь заблокировал бота, удаляем его из списка
      if (error.response && error.response.statusCode === 403) {
        const index = config.recipients.indexOf(recipientId);
        if (index > -1) {
          config.recipients.splice(index, 1);
          saveConfig();
        }
      }
    }
  }
  
  bot.sendMessage(senderId, `✅ Рассылка завершена!\n\n✅ Успешно: ${successCount}\n❌ Ошибок: ${failCount}`);
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error.message || error);
  console.error('Полная ошибка:', error);
});

// Обработка всех сообщений для отладки
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const username = msg.from?.username || 'неизвестно';
  
  console.log(`📩 Получено сообщение от @${username} (ID: ${chatId}): ${text || '(не текст)'}`);
  
  // Если это не команда, можно ответить
  if (text && !text.startsWith('/')) {
    console.log(`💬 Обычное сообщение, игнорируем`);
  }
});

// Обработка успешного запуска polling
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM') {
    console.error('❌ Ошибка Telegram API:', error.message);
    console.error('Проверьте правильность токена!');
  }
});

// Проверка подключения
bot.getMe().then((botInfo) => {
  console.log(`✅ Бот подключен: @${botInfo.username} (${botInfo.first_name})`);
}).catch((error) => {
  console.error('❌ Ошибка при получении информации о боте:', error.message);
  console.error('Возможно, токен неверный или бот не существует!');
});

console.log('✅ Бот готов к работе!');
console.log(`📋 Текущее количество получателей: ${config.recipients.length}`);
