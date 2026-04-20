# 🧪 Тест serverless функции вручную

## Проверка, что функция работает:

Откройте консоль браузера (F12) на вашем сайте и выполните:

```javascript
fetch('https://2-git-main-pendehos-projects.vercel.app/api/send-email', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        to: 'pendeho098rus@yandex.ru',
        subject: 'Тест отправки',
        message: 'Это тестовое сообщение для проверки работы serverless функции.'
    })
})
.then(response => {
    console.log('Статус:', response.status);
    return response.json();
})
.then(data => {
    console.log('Результат:', data);
})
.catch(error => {
    console.error('Ошибка:', error);
});
```

## Что должно произойти:

**Если функция работает правильно:**
- Вы получите ответ: `{ success: true, message: 'Email sent successfully', ... }`
- На почту `pendeho098rus@yandex.ru` придет письмо

**Если видите ошибку:**
- `"SMTP credentials not configured"` → переменные окружения не настроены
- `"Authentication failed"` → неправильный пароль приложения
- `404` → функция не найдена, проверьте путь
- `CORS error` → проблема с настройками CORS

## После теста:

Скопируйте результат из консоли и проверьте по инструкции ДИАГНОСТИКА_ПРОБЛЕМЫ.md
