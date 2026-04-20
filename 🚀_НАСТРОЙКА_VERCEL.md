# 🚀 Настройка Vercel для проекта

## Быстрая настройка через веб-интерфейс

### Шаг 1: Откройте Vercel Dashboard
Перейдите на: https://vercel.com/dashboard

### Шаг 2: Добавьте новый проект
1. Нажмите кнопку **"Add New Project"** или **"New Project"**
2. Если нужно авторизоваться через GitHub - авторизуйтесь

### Шаг 3: Выберите репозиторий
1. В списке репозиториев найдите: **shooting-requests-system**
2. Если репозитория нет в списке:
   - Нажмите **"Adjust GitHub App Permissions"**
   - Выберите репозиторий `shooting-requests-system`
   - Нажмите **"Save"**
   - Вернитесь к импорту проекта

### Шаг 4: Настройте проект
После выбора репозитория настройте:

- **Framework Preset:** `Other` или `Other`
- **Root Directory:** `./` (оставьте как есть)
- **Build Command:** (оставьте пустым)
- **Output Directory:** `./` (оставьте как есть)
- **Install Command:** `npm install` (если нужно)

### Шаг 5: Деплой
1. Нажмите кнопку **"Deploy"**
2. Дождитесь завершения деплоя (обычно 1-2 минуты)
3. Vercel автоматически даст вам ссылку на проект

## Альтернативный способ: через Vercel CLI

Если у вас установлен Vercel CLI:

```bash
# Установите Vercel CLI (если не установлен)
npm i -g vercel

# Войдите в Vercel
vercel login

# Деплой проекта
cd "c:\Исходники DaVinci\дут"
vercel

# Следуйте инструкциям:
# - Link to existing project? No
# - Project name: shooting-requests-system
# - Directory: ./
# - Override settings? No
```

## Проверка после деплоя

После успешного деплоя проверьте:

1. ✅ Открывается страница авторизации
2. ✅ Можно зарегистрироваться и войти
3. ✅ Формы Фигаро и ТТК работают
4. ✅ Панель администратора работает
5. ✅ Кнопка "Выгрузить в DOC" работает

## Ссылки

- **GitHub репозиторий:** https://github.com/volkonskiy93-cyber/shooting-requests-system
- **Vercel Dashboard:** https://vercel.com/dashboard

## Если что-то не работает

1. Проверьте логи деплоя в Vercel Dashboard
2. Убедитесь, что все файлы загружены на GitHub
3. Проверьте конфигурацию в `vercel.json`
4. Очистите кэш браузера (Ctrl+Shift+Delete)
