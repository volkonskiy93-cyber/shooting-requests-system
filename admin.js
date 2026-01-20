// JavaScript для страницы администратора

let currentApplications = [];
let currentFilter = {};
let currentSort = { field: 'createdAt', direction: 'desc' }; // По умолчанию сортировка по дате создания (новые сверху)

// Инициализация страницы
document.addEventListener('DOMContentLoaded', function() {
    // Ждем загрузки всех скриптов
    setTimeout(function() {
        if (typeof applicationManager === 'undefined') {
            console.error('applicationManager не загружен! Проверьте, что data.js подключен.');
            alert('Ошибка: система данных не загружена. Пожалуйста, обновите страницу.');
            return;
        }
        
        console.log('Инициализация страницы администратора');
        console.log('applicationManager доступен:', typeof applicationManager !== 'undefined');
        const allApps = applicationManager.getAllApplications();
        console.log('Текущее количество заявок:', allApps.length);
        console.log('Заявки:', allApps);
        
        loadApplications();
        setupFilters();
        // Обновляем индикаторы сортировки после загрузки DOM
        setTimeout(() => {
            // По умолчанию сортировка по дате создания (она не отображается в таблице, но применяется)
            updateSortIndicators();
        }, 100);
    }, 200);
});

// Загрузка заявок
function loadApplications() {
    if (typeof applicationManager === 'undefined') {
        console.error('applicationManager не определен');
        alert('Ошибка: система данных не загружена. Убедитесь, что файл data.js подключен.');
        // Пробуем еще раз через небольшую задержку
        setTimeout(function() {
            if (typeof applicationManager !== 'undefined') {
                loadApplications();
            }
        }, 500);
        return;
    }
    
    try {
        currentApplications = applicationManager.getAllApplications();
        console.log('Загружено заявок:', currentApplications.length);
        console.log('Заявки:', currentApplications);
        updateStatistics();
        applyFilters();
    } catch (error) {
        console.error('Ошибка при загрузке заявок:', error);
        alert('Ошибка при загрузке заявок: ' + error.message);
    }
}

// Обновление статистики
function updateStatistics() {
    const stats = applicationManager.getStatistics();
    const statsHTML = `
        <div class="stat-card new">
            <h3>Новые</h3>
            <div class="number">${stats.new}</div>
        </div>
        <div class="stat-card in-progress">
            <h3>В обработке</h3>
            <div class="number">${stats.inProgress}</div>
        </div>
        <div class="stat-card approved">
            <h3>Одобрены</h3>
            <div class="number">${stats.approved}</div>
        </div>
        <div class="stat-card rejected">
            <h3>Отклонены</h3>
            <div class="number">${stats.rejected}</div>
        </div>
        <div class="stat-card">
            <h3>Всего</h3>
            <div class="number">${stats.total}</div>
        </div>
    `;
    document.getElementById('stats').innerHTML = statsHTML;
}

// Настройка фильтров
function setupFilters() {
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('contractor-filter').addEventListener('change', applyFilters);
    document.getElementById('date-from').addEventListener('change', applyFilters);
    document.getElementById('date-to').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
}

// Применение фильтров
function applyFilters() {
    if (typeof applicationManager === 'undefined') {
        console.error('applicationManager не определен в applyFilters');
        return;
    }
    
    try {
        // Перезагружаем заявки из хранилища перед применением фильтров
        currentApplications = applicationManager.getAllApplications();
        console.log('Применение фильтров. Всего заявок:', currentApplications.length);
        
        let filtered = [...currentApplications];
        
        // Фильтр по статусу
        const statusFilter = document.getElementById('status-filter')?.value;
        if (statusFilter) {
            filtered = filtered.filter(app => app.status === statusFilter);
            console.log('После фильтра по статусу:', filtered.length);
        }
        
        // Фильтр по подрядчику
        const contractorFilter = document.getElementById('contractor-filter')?.value;
        if (contractorFilter) {
            filtered = filtered.filter(app => app.contractor === contractorFilter);
            console.log('После фильтра по подрядчику:', filtered.length);
        }
        
        // Фильтр по дате съемки
        const dateFrom = document.getElementById('date-from')?.value;
        const dateTo = document.getElementById('date-to')?.value;
        if (dateFrom) {
            filtered = filtered.filter(app => {
                if (!app.shootingDate) return false;
                return new Date(app.shootingDate) >= new Date(dateFrom);
            });
        }
        if (dateTo) {
            filtered = filtered.filter(app => {
                if (!app.shootingDate) return false;
                return new Date(app.shootingDate) <= new Date(dateTo);
            });
        }
        
        // Поиск по названию сюжета
        const searchQuery = document.getElementById('search-input')?.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(app => {
                const title = (app.storyTitle || '').toLowerCase();
                return title.includes(searchQuery);
            });
        }
        
        // Сортировка
        filtered = sortApplicationsData(filtered, currentSort.field, currentSort.direction);
        
        console.log('Отображаем заявок:', filtered.length);
        renderApplications(filtered);
    } catch (error) {
        console.error('Ошибка при применении фильтров:', error);
    }
}

// Сортировка заявок
function sortApplications(field) {
    // Если кликнули по тому же полю, меняем направление
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Обновляем визуальные индикаторы сортировки
    updateSortIndicators();
    
    // Применяем фильтры (они уже включают сортировку)
    applyFilters();
}

// Функция сортировки данных
function sortApplicationsData(applications, field, direction) {
    const sorted = [...applications];
    
    sorted.sort((a, b) => {
        let valueA, valueB;
        
        switch(field) {
            case 'storyTitle':
                valueA = (a.storyTitle || '').toLowerCase();
                valueB = (b.storyTitle || '').toLowerCase();
                break;
            case 'shootingDate':
                valueA = a.shootingDate ? new Date(a.shootingDate).getTime() : 0;
                valueB = b.shootingDate ? new Date(b.shootingDate).getTime() : 0;
                break;
            case 'createdAt':
                valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                break;
            default:
                // По умолчанию сортировка по дате создания
                valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                break;
        }
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            if (direction === 'asc') {
                return valueA.localeCompare(valueB, 'ru');
            } else {
                return valueB.localeCompare(valueA, 'ru');
            }
        } else {
            if (direction === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        }
    });
    
    return sorted;
}

// Обновление визуальных индикаторов сортировки
function updateSortIndicators() {
    // Убираем все классы сортировки
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
    });
    
    // Добавляем класс для активного поля сортировки
    if (currentSort.field) {
        document.querySelectorAll('.sortable').forEach(th => {
            const onclickAttr = th.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/sortApplications\('(.+?)'\)/);
                if (match && match[1] === currentSort.field) {
                    th.classList.add(currentSort.direction);
                }
            }
        });
    }
}

// Отображение заявок в таблице
function renderApplications(applications) {
    const tbody = document.getElementById('applications-tbody');
    const emptyState = document.getElementById('empty-state');
    
    if (applications.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = applications.map((app, index) => {
        let contractorName, contractorClass;
        if (app.contractor === 'figaro') {
            contractorName = 'ФИГАРО';
            contractorClass = 'contractor-figaro';
        } else if (app.contractor === 'ttk') {
            contractorName = 'ТТК';
            contractorClass = 'contractor-ttk';
        } else if (app.contractor === 'producer') {
            contractorName = 'Продюсер';
            contractorClass = 'contractor-figaro'; // Используем тот же стиль
        } else {
            contractorName = app.contractor || '-';
            contractorClass = 'contractor-figaro';
        }
        const statusName = getStatusName(app.status);
        const statusClass = `status-${app.status}`;
        const shootingDate = app.shootingDate ? formatDate(app.shootingDate) : '-';
        const shortId = app.id.substring(0, 8);
        
        return `
            <tr onclick="viewApplication('${app.id}')">
                <td>${app.storyTitle || '-'}</td>
                <td><span class="contractor-badge ${contractorClass}">${contractorName}</span></td>
                <td>${shootingDate}</td>
                <td>${app.director || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusName}</span></td>
                <td class="action-buttons" onclick="event.stopPropagation()">
                    <button class="btn-view" onclick="viewApplication('${app.id}')">Просмотр</button>
                    <button class="btn-delete" onclick="deleteApplication('${app.id}')">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Получить название статуса
function getStatusName(status) {
    const names = {
        'new': 'Новая',
        'in_progress': 'В обработке',
        'approved': 'Одобрена',
        'rejected': 'Отклонена'
    };
    return names[status] || status;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

// Просмотр заявки
function viewApplication(id) {
    const app = applicationManager.getApplicationById(id);
    if (!app) {
        alert('Заявка не найдена');
        return;
    }
    
    let contractorName;
    if (app.contractor === 'figaro') {
        contractorName = 'ВЕК XXL (ФИГАРО)';
    } else if (app.contractor === 'ttk') {
        contractorName = 'Технологический центр ТВ (ТТК)';
    } else if (app.contractor === 'producer') {
        contractorName = 'Заявка продюсерам';
    } else {
        contractorName = app.contractor || '-';
    }
    const statusName = getStatusName(app.status);
    
    let equipmentHTML = '';
    if (app.equipment && app.equipment.length > 0) {
        equipmentHTML = '<div class="equipment-list">';
        app.equipment.forEach(eq => {
            if (eq.main || eq.additional) {
                equipmentHTML += '<div class="equipment-item">';
                if (eq.main) {
                    equipmentHTML += `<strong>Основное:</strong> ${eq.main}${eq.mainQuantity > 0 ? ` (${eq.mainQuantity} шт.)` : ''}<br>`;
                }
                if (eq.additional && eq.additionalQuantity > 0) {
                    equipmentHTML += `<strong>Дополнительное:</strong> ${eq.additional} (${eq.additionalQuantity} шт.)`;
                }
                equipmentHTML += '</div>';
            }
        });
        equipmentHTML += '</div>';
    }
    
    let commentsHTML = '';
    if (app.comments && app.comments.length > 0) {
        commentsHTML = '<div class="comments-section">';
        app.comments.forEach(comment => {
            commentsHTML += `
                <div class="comment">
                    <div class="comment-author">${comment.author || 'Система'}</div>
                    <div class="comment-date">${formatDateTime(comment.date)}</div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `;
        });
        commentsHTML += '</div>';
    } else {
        commentsHTML = '<div class="comments-section"><p style="color: #7f8c8d;">Комментариев нет</p></div>';
    }
    
    const detailsHTML = `
        <div class="detail-section">
            <h3>Основная информация</h3>
            <div class="detail-row">
                <div class="detail-label">Подрядчик:</div>
                <div class="detail-value">${contractorName}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Название сюжета:</div>
                <div class="detail-value">${app.storyTitle || '-'}</div>
            </div>
            ${app.annotation || app.summary ? `
            <div class="detail-row">
                <div class="detail-label">${app.contractor === 'producer' ? 'Краткое содержание сюжета:' : 'Аннотация к съемке и адрес локации:'}</div>
                <div class="detail-value">${app.annotation || app.summary || '-'}</div>
            </div>
            ` : ''}
            ${app.heroes ? `
            <div class="detail-row">
                <div class="detail-label">Герои:</div>
                <div class="detail-value">${app.heroes}</div>
            </div>
            ` : ''}
            ${app.notes ? `
            <div class="detail-row">
                <div class="detail-label">Примечания:</div>
                <div class="detail-value">${app.notes}</div>
            </div>
            ` : ''}
            ${app.accreditation ? `
            <div class="detail-row">
                <div class="detail-label">Аккредитация:</div>
                <div class="detail-value">${app.accreditation === 'yes' ? 'ДА' : 'НЕТ'}</div>
            </div>
            ` : ''}
            ${app.clarifications ? `
            <div class="detail-row">
                <div class="detail-label">Уточнения:</div>
                <div class="detail-value">${app.clarifications}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Статус:</div>
                <div class="detail-value"><span class="status-badge status-${app.status}">${statusName}</span></div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Ответственные лица</h3>
            <div class="detail-row">
                <div class="detail-label">Режиссер (редактор):</div>
                <div class="detail-value">${app.director || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Корреспондент:</div>
                <div class="detail-value">${app.correspondent || '-'}</div>
            </div>
            ${app.correspondentContacts ? `
            <div class="detail-row">
                <div class="detail-label">Контакты корреспондента:</div>
                <div class="detail-value">${app.correspondentContacts}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Продюсер:</div>
                <div class="detail-value">${app.producer || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Оператор:</div>
                <div class="detail-value">${app.operator || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Видео инженер:</div>
                <div class="detail-value">${app.videoEngineer || '-'}</div>
            </div>
            ${app.carNumber ? `
            <div class="detail-row">
                <div class="detail-label">Номер автомобиля:</div>
                <div class="detail-value">${app.carNumber}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="detail-section">
            <h3>Даты и время</h3>
            <div class="detail-row">
                <div class="detail-label">Дата подачи заявки:</div>
                <div class="detail-value">${formatDate(app.applicationDate)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Дата съемки:</div>
                <div class="detail-value">${formatDate(app.shootingDate)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Время съемки:</div>
                <div class="detail-value">${app.startTime || '-'} - ${app.endTime || '-'}</div>
            </div>
            ${app.broadcastDate ? `
            <div class="detail-row">
                <div class="detail-label">Дата эфира:</div>
                <div class="detail-value">${formatDate(app.broadcastDate)}</div>
            </div>
            ` : ''}
            ${app.extension ? `
            <div class="detail-row">
                <div class="detail-label">Продление:</div>
                <div class="detail-value">${app.extension}</div>
            </div>
            ` : ''}
            ${app.submissionDate ? `
            <div class="detail-row">
                <div class="detail-label">Дата и время сдачи материала в инжест:</div>
                <div class="detail-value">${formatDateTime(app.submissionDate)}</div>
            </div>
            ` : ''}
            ${app.engineerName ? `
            <div class="detail-row">
                <div class="detail-label">Инженер инжеста ФИО:</div>
                <div class="detail-value">${app.engineerName}</div>
            </div>
            ` : ''}
            ${app.signature ? `
            <div class="detail-row">
                <div class="detail-label">Подпись:</div>
                <div class="detail-value">${app.signature}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Создана:</div>
                <div class="detail-value">${formatDateTime(app.createdAt)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Обновлена:</div>
                <div class="detail-value">${formatDateTime(app.updatedAt)}</div>
            </div>
        </div>
        
        ${equipmentHTML ? `
        <div class="detail-section">
            <h3>Оборудование</h3>
            ${equipmentHTML}
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h3>Комментарии</h3>
            ${commentsHTML}
        </div>
        
        <div class="status-actions">
            <h3>Действия со заявкой</h3>
            <button class="btn-view" onclick="exportToPDF('${app.id}')" style="background-color: #9b59b6;">📄 Выгрузить в PDF</button>
            ${app.status === 'new' || app.status === 'in_progress' ? `
                <button class="btn-approve" onclick="changeStatusWithComment('${app.id}', 'approved')">Одобрить</button>
                <button class="btn-reject" onclick="changeStatusWithComment('${app.id}', 'rejected')">Отклонить</button>
            ` : ''}
            ${app.status === 'new' ? `
                <button class="btn-approve" onclick="changeStatusWithComment('${app.id}', 'in_progress')">Взять в работу</button>
            ` : ''}
            <button class="btn-delete" onclick="deleteApplicationConfirm('${app.id}')">Удалить заявку</button>
        </div>
    `;
    
    document.getElementById('application-details').innerHTML = detailsHTML;
    document.getElementById('application-modal').classList.add('active');
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('application-modal').classList.remove('active');
}

// Изменить статус заявки
function changeStatus(id, status) {
    if (confirm('Вы уверены, что хотите изменить статус заявки?')) {
        const comment = prompt('Добавить комментарий (необязательно):');
        applicationManager.changeStatus(id, status, comment || '');
        loadApplications();
        closeModal();
    }
}

// Изменить статус с комментарием
function changeStatusWithComment(id, status) {
    const comment = prompt('Добавить комментарий (необязательно):');
    if (comment !== null) {
        applicationManager.changeStatus(id, status, comment || '');
        loadApplications();
        closeModal();
    }
}

// Удалить заявку
function deleteApplication(id) {
    if (confirm('Вы уверены, что хотите удалить заявку?')) {
        applicationManager.deleteApplication(id);
        loadApplications();
    }
}

// Удалить заявку с подтверждением (из модального окна)
function deleteApplicationConfirm(id) {
    if (confirm('Вы уверены, что хотите удалить заявку? Это действие нельзя отменить.')) {
        applicationManager.deleteApplication(id);
        closeModal();
        loadApplications();
    }
}

// Закрытие модального окна по клику вне его
document.addEventListener('click', function(e) {
    const modal = document.getElementById('application-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Экспорт заявки в PDF
function exportToPDF(id) {
    const app = applicationManager.getApplicationById(id);
    if (!app) {
        alert('Заявка не найдена');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;
        
        // Заголовок
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const contractorName = app.contractor === 'figaro' ? 'ВЕК XXL (ФИГАРО)' : 
                              app.contractor === 'ttk' ? 'Технологический центр ТВ (ТТК)' : 
                              'Заявка продюсерам';
        doc.text(contractorName, margin, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Заявка на видеосъемку', margin, yPos);
        yPos += 5;
        doc.text('Программа "Доброе утро"', margin, yPos);
        yPos += 15;
        
        // Линия-разделитель
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        // Основная информация
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Основная информация', margin, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        const addField = (label, value) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', margin, yPos);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(value || '-', maxWidth - 40);
            doc.text(lines, margin + 35, yPos);
            yPos += lines.length * 5 + 5;
        };
        
        addField('Название сюжета', app.storyTitle || '-');
        if (app.contractor === 'producer') {
            if (app.summary) addField('Краткое содержание сюжета', app.summary);
            if (app.heroes) addField('Герои', app.heroes);
        } else {
            if (app.annotation) addField('Аннотация', app.annotation);
            if (app.notes) addField('Примечания', app.notes);
            if (app.accreditation) addField('Аккредитация', app.accreditation === 'yes' ? 'ДА' : 'НЕТ');
        }
        
        yPos += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        // Ответственные лица
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Ответственные лица', margin, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        if (app.director) addField('Редактор', app.director);
        if (app.correspondent) addField('Корреспондент', app.correspondent);
        if (app.correspondentContacts) addField('Контакты корреспондента', app.correspondentContacts);
        if (app.producer && app.contractor !== 'producer') addField('Продюсер', app.producer);
        if (app.operator) addField('Оператор', app.operator);
        if (app.videoEngineer) addField('Видео инженер', app.videoEngineer);
        if (app.carNumber) addField('Номер автомобиля', app.carNumber);
        
        yPos += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        // Даты и время
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Даты и время', margin, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        if (app.applicationDate) addField('Дата подачи заявки', formatDate(app.applicationDate));
        if (app.shootingDate) addField('Дата съемки', formatDate(app.shootingDate));
        if (app.startTime && app.endTime) addField('Время съемки', `${app.startTime} - ${app.endTime}`);
        if (app.broadcastDate) addField('Дата эфира', formatDate(app.broadcastDate));
        if (app.extension) addField('Продление', app.extension);
        
        // Статус
        yPos += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        addField('Статус', getStatusName(app.status));
        
        // Футер
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Страница ${i} из ${pageCount} | Создано: ${formatDateTime(app.createdAt)}`,
                margin,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'left' }
            );
        }
        
        // Сохранение
        const fileName = `Заявка_${app.storyTitle?.substring(0, 30) || app.id.substring(0, 8)}_${formatDate(app.shootingDate || app.applicationDate)}.pdf`;
        doc.save(fileName.replace(/[<>:"/\\|?*]/g, '_'));
        
    } catch (error) {
        console.error('Ошибка при создании PDF:', error);
        alert('Ошибка при создании PDF. Убедитесь, что библиотеки загружены.');
    }
}
