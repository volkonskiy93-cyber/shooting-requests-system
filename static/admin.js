// JavaScript для панели администратора

const API_BASE = '';

let currentApplications = [];
let currentFilter = {};

document.addEventListener('DOMContentLoaded', function() {
    loadApplications();
    loadStatistics();
    setupFilters();
});

function setupFilters() {
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('contractor-filter').addEventListener('change', applyFilters);
    document.getElementById('date-from').addEventListener('change', applyFilters);
    document.getElementById('date-to').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
}

async function loadApplications() {
    try {
        const params = new URLSearchParams(currentFilter);
        const response = await fetch(`/api/applications?${params}`);
        const data = await response.json();
        
        if (data.success) {
            currentApplications = data.applications;
            renderApplications();
        }
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
    }
}

async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.statistics;
            document.getElementById('stats').innerHTML = `
                <div class="stat-card">
                    <h3>Новые</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${stats.new}</div>
                </div>
                <div class="stat-card">
                    <h3>В обработке</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${stats.in_progress}</div>
                </div>
                <div class="stat-card">
                    <h3>Одобрены</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${stats.approved}</div>
                </div>
                <div class="stat-card">
                    <h3>Отклонены</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${stats.rejected}</div>
                </div>
                <div class="stat-card">
                    <h3>Всего</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function applyFilters() {
    currentFilter = {
        status: document.getElementById('status-filter').value,
        contractor: document.getElementById('contractor-filter').value,
        date_from: document.getElementById('date-from').value,
        date_to: document.getElementById('date-to').value,
        search: document.getElementById('search-input').value
    };
    
    // Удаляем пустые фильтры
    Object.keys(currentFilter).forEach(key => {
        if (!currentFilter[key]) delete currentFilter[key];
    });
    
    loadApplications();
}

function renderApplications() {
    const tbody = document.getElementById('applications-tbody');
    
    if (currentApplications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Заявок не найдено</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentApplications.map(app => {
        const contractorName = {
            'figaro': 'ФИГАРО',
            'ttk': 'ТТК',
            'producer': 'Продюсерам'
        }[app.contractor] || app.contractor;
        
        const statusName = {
            'new': 'Новая',
            'in_progress': 'В обработке',
            'approved': 'Одобрена',
            'rejected': 'Отклонена'
        }[app.status] || app.status;
        
        const shootingDate = app.shootingDate ? new Date(app.shootingDate).toLocaleDateString('ru-RU') : '-';
        
        return `
            <tr>
                <td>${app.storyTitle || '-'}</td>
                <td>${contractorName}</td>
                <td>${shootingDate}</td>
                <td>${statusName}</td>
                <td>
                    <button class="btn" onclick="viewApplication(${app.id})">Просмотр</button>
                    <button class="btn" onclick="exportDoc(${app.id})">Экспорт DOC</button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewApplication(id) {
    const app = currentApplications.find(a => a.id === id);
    if (app) {
        alert(`Заявка #${id}\nНазвание: ${app.storyTitle}\nСтатус: ${app.status}`);
        // Здесь можно открыть модальное окно с деталями
    }
}

function exportDoc(id) {
    window.open(`/api/applications/${id}/export/doc`, '_blank');
}
