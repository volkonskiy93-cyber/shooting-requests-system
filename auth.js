// Система авторизации по email с паролем
// Хранит данные пользователей в localStorage

class AuthManager {
    constructor() {
        this.storageKey = 'shootingAppUser';
        this.usersStorageKey = 'shootingAppUsers'; // Хранение зарегистрированных пользователей
        this.currentUser = this.getCurrentUser();
        this.initDefaultUsers(); // Инициализация тестовых пользователей
    }
    
    // Инициализация тестовых пользователей (для примера)
    initDefaultUsers() {
        const users = this.getAllUsers();
        if (Object.keys(users).length === 0) {
            // Добавляем несколько тестовых пользователей
            this.register('admin@dobroeyutro.ru', 'admin123');
            this.register('user@dobroeyutro.ru', 'user123');
        }
    }
    
    // Простой хэш пароля (для клиентского приложения)
    hashPassword(password) {
        // Простой хэш для демонстрации (в продакшене использовать более надежный метод)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Конвертируем в 32-битное число
        }
        return hash.toString();
    }
    
    // Получить всех зарегистрированных пользователей
    getAllUsers() {
        const usersData = localStorage.getItem(this.usersStorageKey);
        return usersData ? JSON.parse(usersData) : {};
    }
    
    // Сохранить всех пользователей
    saveAllUsers(users) {
        localStorage.setItem(this.usersStorageKey, JSON.stringify(users));
    }
    
    // Регистрация нового пользователя
    register(email, password) {
        if (!this.isValidEmail(email)) {
            return { success: false, message: 'Некорректный email адрес' };
        }
        
        if (!password || password.length < 4) {
            return { success: false, message: 'Пароль должен быть не менее 4 символов' };
        }
        
        const users = this.getAllUsers();
        const emailLower = email.toLowerCase().trim();
        
        if (users[emailLower]) {
            return { success: false, message: 'Пользователь с таким email уже зарегистрирован' };
        }
        
        // Сохраняем пользователя с хэшированным паролем
        users[emailLower] = {
            email: emailLower,
            passwordHash: this.hashPassword(password),
            registeredDate: new Date().toISOString()
        };
        
        this.saveAllUsers(users);
        
        return { success: true, message: 'Регистрация успешна. Теперь можно войти.' };
    }
    
    // Войти с email и паролем
    login(email, password) {
        if (!this.isValidEmail(email)) {
            return { success: false, message: 'Некорректный email адрес' };
        }
        
        if (!password) {
            return { success: false, message: 'Введите пароль' };
        }
        
        const users = this.getAllUsers();
        const emailLower = email.toLowerCase().trim();
        const user = users[emailLower];
        
        if (!user) {
            return { success: false, message: 'Пользователь с таким email не найден' };
        }
        
        // Проверяем пароль
        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Неверный пароль' };
        }
        
        // Сохраняем текущего пользователя
        const currentUser = {
            email: emailLower,
            loginDate: new Date().toISOString(),
            name: emailLower.split('@')[0]
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(currentUser));
        this.currentUser = currentUser;
        
        return { success: true, user: currentUser };
    }
    
    // Получить текущего пользователя
    getCurrentUser() {
        const userData = localStorage.getItem(this.storageKey);
        return userData ? JSON.parse(userData) : null;
    }
    
    // Выйти
    logout() {
        localStorage.removeItem(this.storageKey);
        this.currentUser = null;
        return { success: true };
    }
    
    // Проверка авторизации
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Получить email пользователя
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }
    
    // Валидация email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Создаем глобальный экземпляр
const authManager = new AuthManager();
