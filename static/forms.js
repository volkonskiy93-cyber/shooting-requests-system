// Flask /forms UI logic (Vercel-identical markup + Python backend)

function selectContractor(contractor) {
  const mainScreen = document.getElementById('mainScreen');
  const forms = {
    figaro: document.getElementById('formFigaro'),
    ttk: document.getElementById('formTTK'),
    producer: document.getElementById('formProducer'),
  };

  if (!mainScreen) return;

  mainScreen.classList.remove('active');
  Object.values(forms).forEach((f) => f && f.classList.remove('active'));

  const target = forms[contractor];
  if (target) {
    target.classList.add('active');
    _applyProfileDefaults();

    // init dates like in legacy
    const today = _getTodayIso();
    if (contractor === 'figaro') {
      const appDate = document.getElementById('figaro-application-date');
      const shootDate = document.getElementById('figaro-shooting-date');
      const startTime = document.getElementById('figaro-start-time');
      const endTime = document.getElementById('figaro-end-time');
      if (appDate) _setDateInput('figaro-application-date', today);
      if (shootDate) shootDate.min = today;
      // время выезда по умолчанию 09:00-18:00
      if (startTime && !startTime.value) startTime.value = '09:00';
      if (endTime && !endTime.value) endTime.value = '18:00';
    } else if (contractor === 'ttk') {
      const appDate = document.getElementById('ttk-application-date');
      const shootDate = document.getElementById('ttk-shooting-date');
      const startTime = document.getElementById('ttk-start-time');
      const endTime = document.getElementById('ttk-end-time');
      if (appDate) _setDateInput('ttk-application-date', today);
      if (shootDate) shootDate.min = today;
      // время выезда по умолчанию 09:00-18:00
      if (startTime && !startTime.value) startTime.value = '09:00';
      if (endTime && !endTime.value) endTime.value = '18:00';
    } else if (contractor === 'producer') {
      const shootDate = document.getElementById('producer-shooting-date');
      if (shootDate) shootDate.min = today;
    }
  }
}

function goBack() {
  const mainScreen = document.getElementById('mainScreen');
  ['formFigaro', 'formTTK', 'formProducer'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (mainScreen) mainScreen.classList.add('active');
}

function updateStoryTitleFromDate(formType) {
  const ids = {
    figaro: ['figaro-shooting-date', 'figaro-story-title'],
    ttk: ['ttk-shooting-date', 'ttk-story-title'],
    producer: ['producer-shooting-date', 'producer-story-title'],
  };
  const pair = ids[formType];
  if (!pair) return;
  const [dateId, titleId] = pair;
  const dateInput = document.getElementById(dateId);
  const titleInput = document.getElementById(titleId);
  if (!dateInput || !titleInput || !dateInput.value) return;

  const date = new Date(dateInput.value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  titleInput.value = `Съемка от ${day}.${month}.${year}`;
}

function _setDateInput(id, iso) {
  const el = document.getElementById(id);
  if (!el) return;
  // flatpickr attaches instance to element as _flatpickr
  if (el._flatpickr) {
    el._flatpickr.setDate(iso, true, 'Y-m-d');
  } else {
    el.value = iso;
  }
}

function _setDateTimeLocalInput(id, isoLocal) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._flatpickr) {
    el._flatpickr.setDate(isoLocal, true, "Y-m-d\\TH:i");
  } else {
    el.value = isoLocal;
  }
}

function _getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

const _correspondentStorageKey = 'davinci.correspondentName';
const _correspondentContactsStorageKey = 'davinci.correspondentContacts';

function _storageGet(key) {
  try {
    return window.localStorage.getItem(key) || '';
  } catch (error) {
    return '';
  }
}

function _storageSet(key, value) {
  try {
    const normalized = (value || '').trim();
    if (normalized) {
      window.localStorage.setItem(key, normalized);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    // Ignore browser storage errors.
  }
}

function _currentUserProfile() {
  return window.currentUserProfile || {};
}

function _preferredCorrespondentName() {
  const profileName = (_currentUserProfile().fullName || '').trim();
  return profileName || _storageGet(_correspondentStorageKey);
}

function _preferredCorrespondentContacts() {
  const profileEmail = (_currentUserProfile().email || '').trim();
  return profileEmail || _storageGet(_correspondentContactsStorageKey);
}

function _applyProfileDefaults() {
  const correspondentName = _preferredCorrespondentName();
  ['figaro-correspondent', 'ttk-correspondent', 'producer-correspondent'].forEach((id) => {
    const input = document.getElementById(id);
    if (input && !input.value.trim() && correspondentName) {
      input.value = correspondentName;
    }
  });

  const contactsInput = document.getElementById('producer-correspondent-contacts');
  const correspondentContacts = _preferredCorrespondentContacts();
  if (contactsInput && !contactsInput.value.trim() && correspondentContacts) {
    contactsInput.value = correspondentContacts;
  }
}

function _initProfileAutofill() {
  [
    ['figaro-correspondent', _correspondentStorageKey],
    ['ttk-correspondent', _correspondentStorageKey],
    ['producer-correspondent', _correspondentStorageKey],
    ['producer-correspondent-contacts', _correspondentContactsStorageKey],
  ].forEach(([id, key]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => _storageSet(key, input.value));
    input.addEventListener('change', () => _storageSet(key, input.value));
  });

  _applyProfileDefaults();
}

let _successModalTimer = null;
let _autocompletePanel = null;
let _activeAutocompleteInput = null;
let _sendingSplashCounter = 0;

function _ensureSuccessModal() {
  let modal = document.getElementById('brandSuccessModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'brandSuccessModal';
  modal.className = 'brand-success-modal';
  modal.innerHTML = `
    <div class="brand-success-backdrop" data-success-close="true"></div>
    <div class="brand-success-dialog" role="dialog" aria-modal="true" aria-labelledby="brandSuccessTitle">
      <div class="brand-success-kicker">Доброе утро</div>
      <h3 id="brandSuccessTitle">Заявка успешно отправлена</h3>
      <p>Файл сформирован, заявка сохранена и отправлена адресату.</p>
      <button type="button" class="brand-success-button">Понятно</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.successClose === 'true') {
      hideSuccessModal();
    }
  });

  const button = modal.querySelector('.brand-success-button');
  if (button) {
    button.addEventListener('click', hideSuccessModal);
  }

  return modal;
}

function _ensureSendingSplash() {
  let splash = document.getElementById('brandSendingSplash');
  if (splash) return splash;

  splash = document.createElement('div');
  splash.id = 'brandSendingSplash';
  splash.className = 'brand-sending-splash';
  splash.innerHTML = `
    <div class="brand-sending-backdrop"></div>
    <div class="brand-sending-dialog" role="status" aria-live="polite" aria-labelledby="brandSendingTitle">
      <div class="brand-sending-kicker">Доброе утро</div>
      <div class="brand-sending-spinner" aria-hidden="true"></div>
      <h3 id="brandSendingTitle">Отправляем заявку</h3>
      <p>Подождите немного, файл формируется и уходит адресату.</p>
    </div>
  `;

  document.body.appendChild(splash);
  return splash;
}

function showSendingSplash() {
  _sendingSplashCounter += 1;
  const splash = _ensureSendingSplash();
  splash.classList.add('is-visible');
  document.body.classList.add('modal-open');
}

function hideSendingSplash() {
  _sendingSplashCounter = Math.max(0, _sendingSplashCounter - 1);
  if (_sendingSplashCounter > 0) return;

  const splash = document.getElementById('brandSendingSplash');
  if (splash) {
    splash.classList.remove('is-visible');
  }
  document.body.classList.remove('modal-open');
}

function showSuccessModal(message) {
  hideSendingSplash();
  const modal = _ensureSuccessModal();
  const text = modal.querySelector('p');
  if (text && message) {
    text.textContent = message;
  }

  modal.classList.add('is-visible');
  document.body.classList.add('modal-open');

  if (_successModalTimer) clearTimeout(_successModalTimer);
  _successModalTimer = window.setTimeout(() => {
    hideSuccessModal();
  }, 3500);
}

function hideSuccessModal() {
  const modal = document.getElementById('brandSuccessModal');
  if (!modal) return;
  modal.classList.remove('is-visible');
  document.body.classList.remove('modal-open');
  if (_successModalTimer) {
    clearTimeout(_successModalTimer);
    _successModalTimer = null;
  }
}

function _ensureAutocompletePanel() {
  if (_autocompletePanel) return _autocompletePanel;

  _autocompletePanel = document.createElement('div');
  _autocompletePanel.id = 'brandAutocompletePanel';
  _autocompletePanel.className = 'brand-autocomplete-panel';
  document.body.appendChild(_autocompletePanel);

  return _autocompletePanel;
}

function _hideAutocompletePanel() {
  if (!_autocompletePanel) return;
  _autocompletePanel.classList.remove('is-visible');
  _autocompletePanel.innerHTML = '';
  _activeAutocompleteInput = null;
}

function _getDatalistOptions(input) {
  const listId = input.dataset.listSource;
  if (!listId) return [];

  const list = document.getElementById(listId);
  if (!list) return [];

  return Array.from(list.querySelectorAll('option'))
    .map((option) => (option.value || '').trim())
    .filter(Boolean);
}

function _positionAutocompletePanel(input) {
  const panel = _ensureAutocompletePanel();
  const rect = input.getBoundingClientRect();
  panel.style.left = `${rect.left + window.scrollX}px`;
  panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
  panel.style.width = `${rect.width}px`;
}

function _renderAutocompleteOptions(input) {
  const panel = _ensureAutocompletePanel();
  const options = _getDatalistOptions(input);
  const query = (input.value || '').trim().toLowerCase();

  const filtered = query
    ? options.filter((item) => item.toLowerCase().includes(query))
    : options;

  if (!filtered.length) {
    _hideAutocompletePanel();
    return;
  }

  panel.innerHTML = filtered
    .slice(0, 12)
    .map((item) => `<button type="button" class="brand-autocomplete-option">${item}</button>`)
    .join('');

  panel.querySelectorAll('.brand-autocomplete-option').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      input.value = button.textContent || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      _hideAutocompletePanel();
      input.focus();
    });
  });

  _positionAutocompletePanel(input);
  panel.classList.add('is-visible');
  _activeAutocompleteInput = input;
}

function _initCustomDatalists() {
  const inputs = document.querySelectorAll('input[list]');
  if (!inputs.length) return;

  inputs.forEach((input) => {
    const listId = input.getAttribute('list');
    if (!listId) return;

    input.dataset.listSource = listId;
    input.removeAttribute('list');
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('focus', () => _renderAutocompleteOptions(input));
    input.addEventListener('click', () => _renderAutocompleteOptions(input));
    input.addEventListener('input', () => _renderAutocompleteOptions(input));
    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (_activeAutocompleteInput === input) {
          _hideAutocompletePanel();
        }
      }, 120);
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.brand-autocomplete-panel')) return;
    if (target.matches('input[data-list-source]')) return;
    _hideAutocompletePanel();
  });

  window.addEventListener('resize', () => {
    if (_activeAutocompleteInput) _positionAutocompletePanel(_activeAutocompleteInput);
  });

  window.addEventListener('scroll', () => {
    if (_activeAutocompleteInput) _positionAutocompletePanel(_activeAutocompleteInput);
  }, true);
}

function _initPickers() {
  if (typeof flatpickr === 'undefined') return;

  flatpickr.localize(flatpickr.l10ns.ru);

  // Date inputs: keep ISO value (Y-m-d) for backend, show dd-mm-YYYY to user
  const dateCfg = {
    allowInput: false,
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd-m-Y',
  };

  // Datetime-local: keep ISO local for backend, show dd-mm-YYYY HH:MM (24h)
  const dtCfg = {
    allowInput: false,
    enableTime: true,
    time_24hr: true,
    dateFormat: "Y-m-d\\TH:i",
    altInput: true,
    altFormat: 'd-m-Y H:i',
  };

  // Time-only (24h)
  const timeCfg = {
    allowInput: false,
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: 'H:i',
  };

  // Apply
  ['figaro-application-date', 'figaro-shooting-date', 'figaro-broadcast-date',
   'ttk-application-date', 'ttk-shooting-date', 'ttk-broadcast-date',
   'producer-shooting-date'
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) flatpickr(el, dateCfg);
  });

  // Time inputs
  ['figaro-start-time', 'figaro-end-time', 'ttk-start-time', 'ttk-end-time', 'producer-start-time', 'producer-end-time']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) flatpickr(el, timeCfg);
    });

  const sub = document.getElementById('ttk-submission-date');
  if (sub) {
    // switch datetime-local to flatpickr-controlled input while keeping value format for backend
    // flatpickr works fine on input type datetime-local too
    flatpickr(sub, dtCfg);
  }

  // Rule: broadcast date >= shooting date (minDate)
  const figShoot = document.getElementById('figaro-shooting-date');
  const figBroad = document.getElementById('figaro-broadcast-date');
  if (figShoot && figBroad) {
    const updateMin = () => {
      const v = figShoot.value;
      if (figBroad._flatpickr) figBroad._flatpickr.set('minDate', v || null);
      figBroad.min = v || '';
      if (figBroad.value && v && figBroad.value < v) _setDateInput('figaro-broadcast-date', v);
    };
    figShoot.addEventListener('change', updateMin);
    updateMin();
  }

  const ttkShoot = document.getElementById('ttk-shooting-date');
  const ttkBroad = document.getElementById('ttk-broadcast-date');
  if (ttkShoot && ttkBroad) {
    const updateMin = () => {
      const v = ttkShoot.value;
      if (ttkBroad._flatpickr) ttkBroad._flatpickr.set('minDate', v || null);
      ttkBroad.min = v || '';
      if (ttkBroad.value && v && ttkBroad.value < v) _setDateInput('ttk-broadcast-date', v);
    };
    ttkShoot.addEventListener('change', updateMin);
    updateMin();
  }
}

function _syncTtkMainKitMode() {
  const toggle = document.getElementById('ttk-without-main-kit');
  const table = document.querySelector('#shooting-request-form-ttk .equipment-table');
  const mainInputs = document.querySelectorAll('#shooting-request-form-ttk input[name^="main-qty-"]');
  const mainHeader = document.querySelector('#shooting-request-form-ttk .ttk-main-header');
  const mainTexts = document.querySelectorAll('#shooting-request-form-ttk .eq-main-text');
  const addTexts = document.querySelectorAll('#shooting-request-form-ttk .eq-add-text');
  const rows = document.querySelectorAll('#shooting-request-form-ttk .equipment-table tbody tr');

  if (!toggle || !table || !mainInputs.length) return;

  const withoutMainKit = Boolean(toggle.checked);

  if (mainHeader) {
    mainHeader.textContent = withoutMainKit
      ? (mainHeader.dataset.noKitText || mainHeader.textContent)
      : (mainHeader.dataset.defaultText || mainHeader.textContent);
  }

  mainTexts.forEach((node) => {
    node.textContent = withoutMainKit
      ? (node.dataset.noKitText || '')
      : (node.dataset.defaultText || '');
  });

  addTexts.forEach((node) => {
    node.textContent = withoutMainKit
      ? (node.dataset.noKitText || node.dataset.defaultText || '')
      : (node.dataset.defaultText || '');
  });

  rows.forEach((row) => {
    const mainText = row.querySelector('.eq-main-text');
    row.classList.toggle('without-main-row', withoutMainKit && mainText && !mainText.textContent.trim());
  });

  mainInputs.forEach((input) => {
    const cell = input.closest('td');
    if (withoutMainKit) {
      if (input.dataset.savedValue === undefined) {
        input.dataset.savedValue = input.value;
      }
      input.value = '0';
      input.disabled = true;
      input.style.display = 'none';
      if (cell) {
        cell.classList.add('no-kit-cell');
      }
    } else {
      input.disabled = false;
      input.style.display = '';
      if (input.dataset.savedValue !== undefined) {
        input.value = input.dataset.savedValue;
        delete input.dataset.savedValue;
      } else {
        input.value = input.defaultValue || input.value || '0';
      }
      if (cell) {
        cell.classList.remove('no-kit-cell');
      }
    }
  });

  table.classList.toggle('without-main-kit', withoutMainKit);
}

function _resetTtkMainKitMode() {
  const toggle = document.getElementById('ttk-without-main-kit');
  const table = document.querySelector('#shooting-request-form-ttk .equipment-table');
  const mainInputs = document.querySelectorAll('#shooting-request-form-ttk input[name^="main-qty-"]');

  if (toggle) toggle.checked = false;

  mainInputs.forEach((input) => {
    input.disabled = false;
    delete input.dataset.savedValue;
    input.value = input.defaultValue || '0';
    input.style.display = '';
  });

  if (table) table.classList.remove('without-main-kit');
}

function _initTtkMainKitToggle() {
  const toggle = document.getElementById('ttk-without-main-kit');
  if (!toggle) return;

  toggle.addEventListener('change', _syncTtkMainKitMode);
  _syncTtkMainKitMode();
}

function collectEquipment(formId) {
  const equipment = [];
  const equipmentTable = document.querySelector(`#${formId} .equipment-table tbody`);
  if (!equipmentTable) return equipment;

  const rows = equipmentTable.querySelectorAll('tr');
  
  if (formId === 'shooting-request-form-ttk') {
    const dataByRowIndex = {};

    rows.forEach((row) => {
      // Ищем инпуты с rowIndex в имени
      const inputs = row.querySelectorAll('input[name], select[name]');
      inputs.forEach(input => {
        const parts = input.name.split('-');
        const idx = parseInt(parts.pop(), 10);
        const type = parts[0]; // main или add

        if (!dataByRowIndex[idx]) dataByRowIndex[idx] = { rowIndex: idx };

        if (type === 'main') {
          // Для основного комплекта текст берем из родительской ячейки
          const cell = input.closest('td');
          const cellClone = cell.cloneNode(true);
          cellClone.querySelector('input').remove();
          dataByRowIndex[idx].main = cellClone.textContent.trim().replace(/\s+/g, ' ');
          dataByRowIndex[idx].mainQuantity = parseInt(input.value, 10) || 0;
        } else if (type === 'add') {
          // Для доп оборудования текст берем из соседа слева
          const cell = input.closest('td');
          const addTextCell = cell.previousElementSibling;
          dataByRowIndex[idx].additional = addTextCell.textContent.trim().replace(/\s+/g, ' ');
          dataByRowIndex[idx].additionalQuantity = parseInt(input.value, 10) || 0;
        }
      });
    });
    return Object.values(dataByRowIndex);
  }

  // Для ФИГАРО оставляем стандартную логику (там строки совпадают с шаблоном)
  rows.forEach((row, rowIndex) => {
    const mainCell = row.querySelector('td:first-child');
    const additionalCell = row.querySelector('td:nth-child(2)');
    const selectCell = row.querySelector('td:last-child');

    let mainEquip = '';
    let mainQuantity = 0;
    if (mainCell) {
      const mainCellClone = mainCell.cloneNode(true);
      const quantityInput = mainCellClone.querySelector('input[type="number"]');
      if (quantityInput) {
        mainQuantity = parseInt(quantityInput.value, 10) || 0;
        quantityInput.remove();
      }
      mainEquip = mainCellClone.textContent.trim().replace(/\s+/g, ' ');
    }

    let additionalEquip = '';
    let additionalQuantity = 0;
    if (additionalCell) {
      additionalEquip = additionalCell.textContent.trim().replace(/\s+/g, ' ');
    }

    if (selectCell) {
      const additionalSelect = selectCell.querySelector('select');
      if (additionalSelect) {
        additionalQuantity = parseInt(additionalSelect.value, 10) || 0;
      }
    }

    if (mainEquip || additionalEquip) {
      equipment.push({
        main: mainEquip,
        mainQuantity,
        additional: additionalEquip,
        additionalQuantity,
        rowIndex: rowIndex
      });
    }
  });
  
  return equipment;
}

function _selectedText(selectEl) {
  if (!selectEl) return '';
  const opt = selectEl.options?.[selectEl.selectedIndex];
  return (opt?.text || selectEl.value || '').trim();
}

async function _postApplication(payload) {
  const resp = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) {
    throw new Error(data.message || data.error || `HTTP ${resp.status}`);
  }
  return data;
}

function _validateRequired(formSelector) {
  const requiredFields = document.querySelectorAll(`${formSelector} [required]`);
  let isValid = true;
  requiredFields.forEach((field) => {
    if (!String(field.value || '').trim()) {
      isValid = false;
      field.style.borderColor = '#e74c3c';
    } else {
      field.style.borderColor = '#bdc3c7';
    }
  });
  return isValid;
}

function exportToDOC(contractorType) {
  // Minimal DOC export (no embedded <script> to avoid artifacts)
  const now = new Date().toLocaleString('ru-RU');
  const titleMap = {
    figaro: 'ВЕК XXL (ФИГАРО)',
    ttk: 'Технологический центр ТВ (ТТК)',
    producer: 'Заявка продюсерам',
  };

  const storyTitle =
    contractorType === 'figaro'
      ? document.getElementById('figaro-story-title')?.value || ''
      : contractorType === 'ttk'
        ? document.getElementById('ttk-story-title')?.value || ''
        : document.getElementById('producer-story-title')?.value || '';

  const htmlContent = `<!doctype html><html><head><meta charset="utf-8"><title>Заявка</title></head><body>
  <h2>${titleMap[contractorType] || 'Заявка'}</h2>
  <p><b>Название сюжета:</b> ${String(storyTitle).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  <p><i>Создано:</i> ${now}</p>
  </body></html>`;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Заявка_${(contractorType || 'form').toUpperCase()}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportToExcel(contractorType) {
  // Собираем payload так же, как при отправке, и просим backend вернуть XLSX (шаблонный, со стилями)
  let payload = null;

  if (contractorType === 'figaro') {
    if (!_validateRequired('#shooting-request-form-figaro')) {
      alert('Пожалуйста, заполните все обязательные поля (отмечены *).');
      return;
    }
    const today = _getTodayIso();
    _setDateInput('figaro-application-date', today);
    payload = {
      contractor: 'figaro',
      storyTitle: document.getElementById('figaro-story-title')?.value || '',
      annotation: document.getElementById('figaro-annotation')?.value || '',
      notes: document.getElementById('figaro-notes')?.value || '',
      accreditation: document.getElementById('figaro-accreditation')?.value || 'no',
      director: _selectedText(document.getElementById('figaro-director')),
      correspondent: _selectedText(document.getElementById('figaro-correspondent')),
      producer: _selectedText(document.getElementById('figaro-producer')),
      operator: _selectedText(document.getElementById('figaro-operator')),
      videoEngineer: _selectedText(document.getElementById('figaro-video-engineer')),
      applicationDate: today,
      shootingDate: document.getElementById('figaro-shooting-date')?.value || '',
      startTime: document.getElementById('figaro-start-time')?.value || '',
      endTime: document.getElementById('figaro-end-time')?.value || '',
      broadcastDate: document.getElementById('figaro-broadcast-date')?.value || null,
      equipment: collectEquipment('shooting-request-form-figaro'),
    };
  } else if (contractorType === 'ttk') {
    if (!_validateRequired('#shooting-request-form-ttk')) {
      alert('Пожалуйста, заполните все обязательные поля (отмечены *).');
      return;
    }
    const today = _getTodayIso();
    _setDateInput('ttk-application-date', today);
    payload = {
      contractor: 'ttk',
      storyTitle: document.getElementById('ttk-story-title')?.value || '',
      annotation: document.getElementById('ttk-annotation')?.value || '',
      notes: document.getElementById('ttk-notes')?.value || '',
      accreditation: document.getElementById('ttk-accreditation')?.value || 'no',
      clarifications: document.getElementById('ttk-clarifications')?.value || '',
      director: _selectedText(document.getElementById('ttk-director')),
      correspondent: _selectedText(document.getElementById('ttk-correspondent')),
      producer: _selectedText(document.getElementById('ttk-producer')),
      operator: _selectedText(document.getElementById('ttk-operator')),
      videoEngineer: _selectedText(document.getElementById('ttk-video-engineer')),
      carNumber: document.getElementById('ttk-car-number')?.value || '',
      applicationDate: today,
      shootingDate: document.getElementById('ttk-shooting-date')?.value || '',
      startTime: document.getElementById('ttk-start-time')?.value || '',
      endTime: document.getElementById('ttk-end-time')?.value || '',
      extension: document.getElementById('ttk-extension')?.value || '',
      broadcastDate: document.getElementById('ttk-broadcast-date')?.value || null,
      submissionDate: document.getElementById('ttk-submission-date')?.value || null,
      engineerName: document.getElementById('ttk-engineer-name')?.value || '',
      signature: document.getElementById('ttk-signature')?.value || '',
      withoutMainKit: document.getElementById('ttk-without-main-kit')?.checked || false,
      equipment: collectEquipment('shooting-request-form-ttk'),
    };
  } else {
    alert('Excel доступен только для ФИГАРО и ТТК');
    return;
  }

  try {
    const resp = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${resp.status}`);
    }

    const blob = await resp.blob();
    const explicitName = resp.headers.get('X-Download-Filename');
    const cd = resp.headers.get('Content-Disposition') || '';
    const m = cd.match(/filename\\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
    const fileName = explicitName || decodeURIComponent(m?.[1] || m?.[2] || 'Заявка.xlsx');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Ошибка выгрузки Excel: ${err.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Expose for inline onclick handlers in the HTML
  window.selectContractor = selectContractor;
  window.goBack = goBack;
  window.updateStoryTitleFromDate = updateStoryTitleFromDate;
  window.exportToDOC = exportToDOC;
  window.exportToExcel = exportToExcel;

  _initPickers();
  _initTtkMainKitToggle();
  _initCustomDatalists();
  _initProfileAutofill();

  const figaroForm = document.getElementById('shooting-request-form-figaro');
  const ttkForm = document.getElementById('shooting-request-form-ttk');
  const producerForm = document.getElementById('shooting-request-form-producer');

  if (figaroForm) {
    figaroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!_validateRequired('#shooting-request-form-figaro')) {
        alert('Пожалуйста, заполните все обязательные поля (отмечены *).');
        return;
      }

      // Дата подачи заявки = день отправки (сегодня)
      const today = _getTodayIso();
      _setDateInput('figaro-application-date', today);

      const payload = {
        contractor: 'figaro',
        storyTitle: document.getElementById('figaro-story-title')?.value || '',
        annotation: document.getElementById('figaro-annotation')?.value || '',
        notes: document.getElementById('figaro-notes')?.value || '',
        accreditation: document.getElementById('figaro-accreditation')?.value || 'no',
        director: _selectedText(document.getElementById('figaro-director')),
        correspondent: _selectedText(document.getElementById('figaro-correspondent')),
        producer: _selectedText(document.getElementById('figaro-producer')),
        operator: _selectedText(document.getElementById('figaro-operator')),
        videoEngineer: _selectedText(document.getElementById('figaro-video-engineer')),
        applicationDate: today,
        shootingDate: document.getElementById('figaro-shooting-date')?.value || '',
        startTime: document.getElementById('figaro-start-time')?.value || '',
        endTime: document.getElementById('figaro-end-time')?.value || '',
        broadcastDate: document.getElementById('figaro-broadcast-date')?.value || null,
        equipment: collectEquipment('shooting-request-form-figaro'),
      };

      try {
        showSendingSplash();
        await _postApplication(payload);
        figaroForm.reset();
        goBack();
        showSuccessModal('Файл сформирован, заявка сохранена и отправлена адресату.');
      } catch (err) {
        hideSendingSplash();
        alert(`Ошибка отправки: ${err.message}`);
      }
    });

    figaroForm.addEventListener('reset', () => {
      setTimeout(_applyProfileDefaults, 0);
    });
  }

  if (ttkForm) {
    ttkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!_validateRequired('#shooting-request-form-ttk')) {
        alert('Пожалуйста, заполните все обязательные поля (отмечены *).');
        return;
      }

      // Дата подачи заявки = день отправки (сегодня)
      const today = _getTodayIso();
      _setDateInput('ttk-application-date', today);

      const payload = {
        contractor: 'ttk',
        storyTitle: document.getElementById('ttk-story-title')?.value || '',
        annotation: document.getElementById('ttk-annotation')?.value || '',
        notes: document.getElementById('ttk-notes')?.value || '',
        accreditation: document.getElementById('ttk-accreditation')?.value || 'no',
        clarifications: document.getElementById('ttk-clarifications')?.value || '',
        director: _selectedText(document.getElementById('ttk-director')),
        correspondent: _selectedText(document.getElementById('ttk-correspondent')),
        producer: _selectedText(document.getElementById('ttk-producer')),
        operator: _selectedText(document.getElementById('ttk-operator')),
        videoEngineer: _selectedText(document.getElementById('ttk-video-engineer')),
        carNumber: document.getElementById('ttk-car-number')?.value || '',
        applicationDate: today,
        shootingDate: document.getElementById('ttk-shooting-date')?.value || '',
        startTime: document.getElementById('ttk-start-time')?.value || '',
        endTime: document.getElementById('ttk-end-time')?.value || '',
        extension: document.getElementById('ttk-extension')?.value || '',
        broadcastDate: document.getElementById('ttk-broadcast-date')?.value || null,
        submissionDate: document.getElementById('ttk-submission-date')?.value || null,
        engineerName: document.getElementById('ttk-engineer-name')?.value || '',
        signature: document.getElementById('ttk-signature')?.value || '',
        withoutMainKit: document.getElementById('ttk-without-main-kit')?.checked || false,
        equipment: collectEquipment('shooting-request-form-ttk'),
      };

      try {
        showSendingSplash();
        await _postApplication(payload);
        ttkForm.reset();
        _resetTtkMainKitMode();
        goBack();
        showSuccessModal('Файл сформирован, заявка сохранена и отправлена адресату.');
      } catch (err) {
        hideSendingSplash();
        alert(`Ошибка отправки: ${err.message}`);
      }
    });

    ttkForm.addEventListener('reset', () => {
      setTimeout(() => {
        _resetTtkMainKitMode();
        _applyProfileDefaults();
      }, 0);
    });
  }

  if (producerForm) {
    producerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!_validateRequired('#shooting-request-form-producer')) {
        alert('Пожалуйста, заполните все обязательные поля (отмечены *).');
        return;
      }

      const payload = {
        contractor: 'producer',
        storyTitle: document.getElementById('producer-story-title')?.value || '',
        summary: document.getElementById('producer-summary')?.value || '',
        heroes: document.getElementById('producer-heroes')?.value || '',
        shootingDate: document.getElementById('producer-shooting-date')?.value || '',
        startTime: document.getElementById('producer-start-time')?.value || '',
        endTime: document.getElementById('producer-end-time')?.value || '',
        correspondent: _selectedText(document.getElementById('producer-correspondent')),
        correspondentContacts: document.getElementById('producer-correspondent-contacts')?.value || '',
        director: _selectedText(document.getElementById('producer-director')),
      };

      try {
        showSendingSplash();
        await _postApplication(payload);
        producerForm.reset();
        goBack();
        showSuccessModal('Заявка сохранена и успешно отправлена.');
      } catch (err) {
        hideSendingSplash();
        alert(`Ошибка отправки: ${err.message}`);
      }
    });

    producerForm.addEventListener('reset', () => {
      setTimeout(_applyProfileDefaults, 0);
    });
  }
});
