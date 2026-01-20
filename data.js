// Система управления заявками на видеосъемку
// Использует localStorage для хранения данных

class ApplicationManager {
    constructor() {
        this.storageKey = 'shootingApplications';
        this.initStorage();
    }

    // Инициализация хранилища
    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Получить все заявки
    getAllApplications() {
        const data = localStorage.getItem(this.storageKey);
        return JSON.parse(data || '[]');
    }

    // Получить заявку по ID
    getApplicationById(id) {
        const applications = this.getAllApplications();
        return applications.find(app => app.id === id);
    }

    // Создать новую заявку
    createApplication(applicationData) {
        const applications = this.getAllApplications();
        const newApplication = {
            id: this.generateId(),
            ...applicationData,
            status: 'new', // new, in_progress, approved, rejected
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: []
        };
        applications.push(newApplication);
        localStorage.setItem(this.storageKey, JSON.stringify(applications));
        return newApplication;
    }

    // Обновить заявку
    updateApplication(id, updates) {
        const applications = this.getAllApplications();
        const index = applications.findIndex(app => app.id === id);
        if (index === -1) return null;

        applications[index] = {
            ...applications[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(applications));
        return applications[index];
    }

    // Изменить статус заявки
    changeStatus(id, status, comment = '') {
        const application = this.getApplicationById(id);
        if (!application) return null;

        const updates = { status };
        if (comment) {
            updates.comments = [...(application.comments || []), {
                text: comment,
                author: 'Администратор',
                date: new Date().toISOString()
            }];
        }

        return this.updateApplication(id, updates);
    }

    // Удалить заявку
    deleteApplication(id) {
        const applications = this.getAllApplications();
        const filtered = applications.filter(app => app.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        return true;
    }

    // Получить заявки по фильтрам
    getFilteredApplications(filters = {}) {
        let applications = this.getAllApplications();

        if (filters.status) {
            applications = applications.filter(app => app.status === filters.status);
        }

        if (filters.contractor) {
            applications = applications.filter(app => app.contractor === filters.contractor);
        }

        if (filters.dateFrom) {
            applications = applications.filter(app => app.shootingDate >= filters.dateFrom);
        }

        if (filters.dateTo) {
            applications = applications.filter(app => app.shootingDate <= filters.dateTo);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            applications = applications.filter(app => 
                app.storyTitle?.toLowerCase().includes(searchLower) ||
                app.annotation?.toLowerCase().includes(searchLower) ||
                app.director?.toLowerCase().includes(searchLower) ||
                app.correspondent?.toLowerCase().includes(searchLower)
            );
        }

        // Сортировка по дате создания (новые сверху)
        return applications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    // Получить статистику
    getStatistics() {
        const applications = this.getAllApplications();
        return {
            total: applications.length,
            new: applications.filter(app => app.status === 'new').length,
            inProgress: applications.filter(app => app.status === 'in_progress').length,
            approved: applications.filter(app => app.status === 'approved').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            byContractor: {
                figaro: applications.filter(app => app.contractor === 'figaro').length,
                ttk: applications.filter(app => app.contractor === 'ttk').length
            }
        };
    }

    // Генерация уникального ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Экспорт заявок в JSON
    exportToJSON() {
        return JSON.stringify(this.getAllApplications(), null, 2);
    }

    // Импорт заявок из JSON
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Ошибка импорта:', e);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
const applicationManager = new ApplicationManager();
