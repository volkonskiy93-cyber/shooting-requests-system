let currentApplications = [];
let currentUsers = [];
let currentFilter = {
    sort_by: 'created_at',
    sort_dir: 'desc',
};

document.addEventListener('DOMContentLoaded', () => {
    setupFilters();
    refreshAdminData();
});

async function readJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (contentType.includes('application/json')) {
        return JSON.parse(rawText || '{}');
    }

    const compactText = rawText.replace(/\s+/g, ' ').trim();
    const looksLikeHtml = /<!doctype|<html|<body/i.test(compactText);
    if (looksLikeHtml) {
        throw new Error('Сервер вернул HTML вместо JSON. Возможно, сессия истекла или приложение временно недоступно.');
    }

    throw new Error(compactText || `Неожиданный ответ сервера (HTTP ${response.status})`);
}

function csrfHeaders(extraHeaders = {}) {
    return {
        ...extraHeaders,
        'X-CSRF-Token': window.getCsrfToken ? window.getCsrfToken() : '',
    };
}

function setupFilters() {
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('contractor-filter').addEventListener('change', applyFilters);
    document.getElementById('date-from').addEventListener('change', applyFilters);
    document.getElementById('date-to').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('sort-by').addEventListener('change', applyFilters);
    document.getElementById('sort-dir').addEventListener('change', applyFilters);
    document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
    document.getElementById('users-search-input').addEventListener('input', renderUsers);
}

async function refreshAdminData() {
    await Promise.all([loadApplications(), loadStatistics(), loadPendingUsers(), loadUsers()]);
}

async function loadApplications() {
    try {
        const params = new URLSearchParams(currentFilter);
        const response = await fetch(`/api/applications?${params}`);
        const data = await readJsonResponse(response);
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
        const data = await readJsonResponse(response);
        if (!data.success) return;

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
                <h3>Ожидают доступ</h3>
                <div style="font-size: 2rem; font-weight: bold;">${stats.pendingUsers || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Всего заявок</h3>
                <div style="font-size: 2rem; font-weight: bold;">${stats.total}</div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

async function loadPendingUsers() {
    const container = document.getElementById('pending-users-list');
    if (!container) return;

    try {
        const response = await fetch('/api/admin/pending-users');
        const data = await readJsonResponse(response);
        if (!data.success) {
            container.innerHTML = '<div class="empty-state">Не удалось загрузить регистрации.</div>';
            return;
        }

        if (!data.users.length) {
            container.innerHTML = '<div class="empty-state">Сейчас нет пользователей, ожидающих одобрения.</div>';
            return;
        }

        container.innerHTML = data.users.map((user) => {
            const createdAt = user.created_at
                ? new Date(user.created_at).toLocaleString('ru-RU')
                : '—';

            return `
                <div class="pending-user-card">
                    <h4>${escapeHtml(user.fullName || 'Без имени')}</h4>
                    <p><strong>Почта:</strong> ${escapeHtml(user.email)}</p>
                    <p><strong>Подана:</strong> ${createdAt}</p>
                    <div class="pending-user-actions">
                        <button class="btn btn-approve" onclick="approveUser(${user.id})">Одобрить</button>
                        <button class="btn btn-reject" onclick="rejectUser(${user.id})">Отклонить</button>
                        <button class="btn btn-delete" type="button" onclick="deleteUser(${user.id})">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ошибка загрузки регистраций:', error);
        container.innerHTML = '<div class="empty-state">Ошибка загрузки регистраций.</div>';
    }
}

async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    const summary = document.getElementById('users-summary');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/users');
        const data = await readJsonResponse(response);
        if (!data.success) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Не удалось загрузить пользователей.</td></tr>';
            if (summary) summary.textContent = 'Ошибка загрузки пользователей';
            return;
        }

        currentUsers = data.users || [];
        renderUsers();
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Ошибка загрузки пользователей.</td></tr>';
        if (summary) summary.textContent = 'Ошибка загрузки пользователей';
    }
}

function applyFilters() {
    currentFilter = {
        status: document.getElementById('status-filter').value,
        contractor: document.getElementById('contractor-filter').value,
        date_from: document.getElementById('date-from').value,
        date_to: document.getElementById('date-to').value,
        search: document.getElementById('search-input').value,
        sort_by: document.getElementById('sort-by').value,
        sort_dir: document.getElementById('sort-dir').value,
    };

    Object.keys(currentFilter).forEach((key) => {
        if (!currentFilter[key]) delete currentFilter[key];
    });

    loadApplications();
}

function resetFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('contractor-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('search-input').value = '';
    document.getElementById('sort-by').value = 'created_at';
    document.getElementById('sort-dir').value = 'desc';
    applyFilters();
}

function renderApplications() {
    const tbody = document.getElementById('applications-tbody');
    const summary = document.getElementById('applications-summary');
    if (!tbody) return;

    if (summary) {
        summary.textContent = `Показано заявок: ${currentApplications.length}`;
    }

    if (!currentApplications.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Заявок не найдено</td></tr>';
        return;
    }

    tbody.innerHTML = currentApplications.map((app) => {
        const contractorName = {
            figaro: 'ТМК',
            ttk: 'ТТК',
            producer: 'Продюсерам',
        }[app.contractor] || app.contractor;

        const statusName = {
            new: 'Новая',
            in_progress: 'В обработке',
            approved: 'Одобрена',
            rejected: 'Отклонена',
        }[app.status] || app.status;

        const shootingDate = app.shootingDate
            ? new Date(app.shootingDate).toLocaleDateString('ru-RU')
            : '-';
        const createdAt = app.createdAt
            ? new Date(app.createdAt).toLocaleString('ru-RU')
            : '-';

        return `
            <tr>
                <td class="table-meta">${createdAt}</td>
                <td>${escapeHtml(app.storyTitle || '-')}</td>
                <td>${escapeHtml(app.correspondent || '-')}</td>
                <td>${escapeHtml(contractorName)}</td>
                <td>${shootingDate}</td>
                <td><span class="table-status">${statusName}</span></td>
                <td>
                    <button class="btn" onclick="viewApplication(${app.id})">Просмотр</button>
                    ${app.contractor === 'producer'
                        ? ''
                        : `<button class="btn btn-secondary" onclick="exportExcel(${app.id})">Excel</button>`}
                    ${app.contractor === 'producer'
                        ? `<button class="btn" onclick="exportDoc(${app.id})">Экспорт DOC</button>`
                        : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    const summary = document.getElementById('users-summary');
    const searchInput = document.getElementById('users-search-input');
    if (!tbody) return;

    const query = String(searchInput?.value || '').trim().toLowerCase();
    const filteredUsers = currentUsers.filter((user) => {
        if (!query) return true;
        return [user.fullName, user.email, user.role]
            .map((value) => String(value || '').toLowerCase())
            .some((value) => value.includes(query));
    });

    if (summary) {
        summary.textContent = `Пользователей: ${filteredUsers.length} из ${currentUsers.length}`;
    }

    if (!filteredUsers.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Пользователи не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = filteredUsers.map((user) => {
        const createdAt = formatDateTime(user.created_at);
        const approvedAt = user.approvedAt ? formatDateTime(user.approvedAt) : '—';
        const accessStatus = user.approvalStatus || 'pending';
        const accessLabel = {
            approved: 'Доступ открыт',
            pending: 'Ожидает',
            rejected: 'Доступ закрыт',
        }[accessStatus] || accessStatus;
        const roleLabel = user.role === 'admin' ? 'Администратор' : 'Корреспондент';
        const isAdmin = user.role === 'admin';
        const me = window.CURRENT_ADMIN_USER_ID;
        const canDelete = !isAdmin && typeof me === 'number' && user.id !== me;

        return `
            <tr>
                <td>${escapeHtml(user.fullName || 'Без имени')}</td>
                <td>${escapeHtml(user.email || '—')}</td>
                <td><span class="user-role-badge">${roleLabel}</span></td>
                <td><span class="user-access-badge ${accessStatus}">${accessLabel}</span></td>
                <td class="table-meta">${createdAt}</td>
                <td class="table-meta">${approvedAt}</td>
                <td>
                    ${accessStatus !== 'approved'
                        ? `<button class="btn btn-approve" onclick="approveUser(${user.id})">Открыть доступ</button>`
                        : ''}
                    ${!isAdmin && accessStatus !== 'rejected'
                        ? `<button class="btn btn-reject" onclick="rejectUser(${user.id})">Ограничить доступ</button>`
                        : ''}
                    ${isAdmin ? '<span class="table-meta">Администратор</span>' : ''}
                    ${canDelete
                        ? `<button class="btn btn-delete" type="button" onclick="deleteUser(${user.id})" title="Удалить учётную запись">Удалить</button>`
                        : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function viewApplication(id) {
    const app = currentApplications.find((item) => item.id === id);
    if (!app) return;

    const contractorName = {
        figaro: 'ТМК',
        ttk: 'ТТК',
        producer: 'Продюсерам',
    }[app.contractor] || app.contractor;

    alert(
        `Заявка #${id}\n` +
        `Название: ${app.storyTitle || '-'}\n` +
        `Поступила: ${app.createdAt ? new Date(app.createdAt).toLocaleString('ru-RU') : '-'}\n` +
        `Подрядчик: ${contractorName}\n` +
        `Корреспондент: ${app.correspondent || '-'}\n` +
        `Дата съемки: ${app.shootingDate ? new Date(app.shootingDate).toLocaleDateString('ru-RU') : '-'}\n` +
        `Статус: ${app.status || '-'}`
    );
}

async function approveUser(userId) {
    if (!confirm('Одобрить доступ этому пользователю?')) return;
    await postAdminAction(`/api/admin/users/${userId}/approve`);
}

async function rejectUser(userId) {
    if (!confirm('Отклонить доступ этому пользователю?')) return;
    await postAdminAction(`/api/admin/users/${userId}/reject`);
}

async function deleteUser(userId) {
    if (
        !confirm(
            'Удалить этого пользователя безвозвратно?\n\n' +
                'Ранее отправленные заявки останутся в системе, но не будут привязаны к этому аккаунту.',
        )
    ) {
        return;
    }
    await postAdminAction(`/api/admin/users/${userId}/delete`);
}

async function postAdminAction(url) {
    try {
        const response = await window.fetchWithCsrfRetry(url, {
            method: 'POST',
            headers: csrfHeaders(),
        });
        const data = await readJsonResponse(response);
        if (!data.success) {
            throw new Error(data.error || data.message || 'Не удалось выполнить действие');
        }
        await refreshAdminData();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

function exportDoc(id) {
    window.open(`/api/applications/${id}/export/doc`, '_blank');
}

async function exportExcel(id) {
    try {
        const applicationResponse = await fetch(`/api/applications/${id}`);
        const applicationData = await readJsonResponse(applicationResponse);
        if (!applicationData.success || !applicationData.application) {
            throw new Error(applicationData.error || applicationData.message || 'Не удалось загрузить данные заявки');
        }

        const response = await window.fetchWithCsrfRetry('/api/export/excel', {
            method: 'POST',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(applicationData.application),
        });

        if (!response.ok) {
            const errorData = await readJsonResponse(response);
            throw new Error(errorData.error || errorData.message || 'Не удалось выгрузить Excel');
        }

        const blob = await response.blob();
        const explicitName = response.headers.get('X-Download-Filename');
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
        const fileName = decodeURIComponent(explicitName || match?.[1] || match?.[2] || 'Заявка.xlsx');

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(`Ошибка выгрузки Excel: ${error.message}`);
    }
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU');
}
