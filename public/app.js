import { stationKeys, mapStationFilters, deriveRangeBounds } from './utils/filterUtils.mjs';

const stationGrid = document.querySelector('#station-grid');
const startInput = document.querySelector('#start-time');
const endInput = document.querySelector('#end-time');
const filterForm = document.querySelector('#filter-form');
const snInput = document.querySelector('#sn-input');
const orderInput = document.querySelector('#order-input');
const limitSelect = document.querySelector('#limit-select');
const statusMessage = document.querySelector('#status-message');
const resultsGrid = document.querySelector('#results-grid');
const resultCount = document.querySelector('#result-count');
const fetchButton = document.querySelector('#fetch-button');
const maxRecordValue = document.querySelector('#max-record-value');
const resultsPanel = document.querySelector('.results-panel');
const skinToggle = document.querySelector('#skin-toggle');
const rangeButtons = document.querySelectorAll('.range-button');

const stationState = stationKeys.map((station) => ({ key: station.key, ok: true, ng: true }));

function buildStationCards() {
  stationGrid.innerHTML = stationKeys
    .map(
      (station) => `
      <div class="station-card" data-key="${station.key}">
        <strong>${station.key}</strong>
        <p>${station.label}</p>
        <div class="station-buttons">
          <button type="button" class="status-button" data-status="OK">
            <span class="checkmark">✅</span>
            <span class="label">OK</span>
          </button>
          <button type="button" class="status-button" data-status="NG">
            <span class="checkmark">✅</span>
            <span class="label">NG</span>
          </button>
        </div>
      </div>`
    )
    .join('');

  stationKeys.forEach((station) => {
    const card = stationGrid.querySelector(`[data-key="${station.key}"]`);
    const entry = stationState.find((item) => item.key === station.key);
    if (card && entry) {
      refreshStationButtons(card, entry);
    }
  });
}

function refreshStationButtons(cardEl, entry) {
  const buttons = cardEl.querySelectorAll('.status-button');
  buttons.forEach((button) => {
    const statusKey = button.dataset.status.toLowerCase();
    button.classList.toggle('active', Boolean(entry?.[statusKey]));
  });
}

stationGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.status-button');
  if (!button) return;
  const card = event.target.closest('.station-card');
  const key = card.dataset.key;
  const entry = stationState.find((item) => item.key === key);
  const clickedStatus = button.dataset.status.toLowerCase();
  entry[clickedStatus] = !entry[clickedStatus];
  if (!entry.ok && !entry.ng) {
    entry[clickedStatus] = true;
  }
  refreshStationButtons(card, entry);
});

filterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await executeSearch();
});

limitSelect.addEventListener('change', () => {
  if (maxRecordValue) {
    maxRecordValue.textContent = limitSelect.value;
  }
});

async function executeSearch() {
  fetchButton.disabled = true;
  statusMessage.textContent = '正在联系 SQL Server...';
  const rangeBounds = getRangeBoundsFromInputs();
  const payload = {
    startTime: rangeBounds.startTime ? rangeBounds.startTime.toISOString() : undefined,
    stopTime: rangeBounds.stopTime ? rangeBounds.stopTime.toISOString() : undefined,
    stationFilters: mapStationFilters(stationState),
    sn: snInput.value.trim() || undefined,
    orderName: orderInput.value.trim() || undefined,
    limit: Number(limitSelect.value)
  };

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('查询失败');
    }

    const result = await response.json();
    statusMessage.textContent = `共找到 ${result.count} 条记录，展示 ${Math.min(result.count, payload.limit)} 条。`;
    renderResults(result.data);
    if (resultsPanel) {
      resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    statusMessage.textContent = '查询异常，请检查服务状态。';
  } finally {
    fetchButton.disabled = false;
  }
}

function renderResults(records = []) {
  resultCount.textContent = `${records.length} 条记录`;
  if (!records.length) {
    resultsGrid.innerHTML = '<p class="helper">未返回数据，请调整筛选条件。</p>';
    return;
  }

  resultsGrid.innerHTML = records
    .map((record, index) => {
      const latestRange = new Date(record.StartTime).toLocaleString('zh-CN');
      const stopRange = record.StopTime ? new Date(record.StopTime).toLocaleString('zh-CN') : '进行中';
      const statuses = stationKeys
        .map((station) => {
        const rawValue = record[`${station.key}Result`];
        const statusText = rawValue === 1 ? 'OK' : rawValue === 0 ? 'NG' : '—';
        const chipClass = statusText === 'OK' ? 'ok' : statusText === 'NG' ? 'ng' : '';
        return `
            <span class="status-step ${chipClass}" data-key="${station.key}">
              <span class="status-label">${statusText}</span>
              <small>${station.key}</small>
            </span>`;
      })
      .join('');

      return `
        <article class="result-card" style="animation-delay:${index * 0.08}s">
          <div class="record-summary">
            <h4>${record.SN || '未知 SN'}</h4>
            <div class="meta">
              <span>订单：${record.OrderName || '—'}</span>
              <span>${latestRange}</span>
            </div>
            <div class="meta">
              <span>操作者：${record.Operator || '匿名'}</span>
              <span>结束：${stopRange}</span>
            </div>
          </div>
          <div class="status-flow">
            ${statuses}
          </div>
        </article>`;
    })
    .join('');
}

function formatLocalDatetime(datetime) {
  const tzOffset = datetime.getTimezoneOffset();
  const local = new Date(datetime.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 19);
}

function getRangeBoundsFromInputs() {
  let startTime = startInput.value ? new Date(startInput.value) : undefined;
  let stopTime = endInput.value ? new Date(endInput.value) : undefined;
  if (!startTime || !stopTime) {
    const fallback = deriveRangeBounds('LAST_24_HOURS');
    startTime ??= fallback.startTime;
    stopTime ??= fallback.stopTime;
  }
  return { startTime, stopTime };
}

function setDefaultRangeInputs() {
  applyRangePreset('LAST_24_HOURS');
}

function applyRangePreset(rangeKey) {
  const bounds = deriveRangeBounds(rangeKey);
  if (bounds.startTime) {
    startInput.value = formatLocalDatetime(bounds.startTime);
  }
  if (bounds.stopTime) {
    endInput.value = formatLocalDatetime(bounds.stopTime);
  }

  rangeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.range === rangeKey);
  });
}

function init() {
  setDefaultRangeInputs();
  buildStationCards();
  renderResults([]);
  if (maxRecordValue) {
    maxRecordValue.textContent = limitSelect.value;
  }

  if (skinToggle) {
    const body = document.body;
    const savedTheme = localStorage.getItem('ts70-theme');
    const startCaramel = savedTheme ? savedTheme === 'caramel' : true;
    if (startCaramel) {
      body.classList.add('theme-caramel');
      skinToggle.textContent = '皮肤：Caramel';
      skinToggle.setAttribute('aria-pressed', 'true');
    }

    skinToggle.addEventListener('click', () => {
      const isCaramel = body.classList.toggle('theme-caramel');
      localStorage.setItem('ts70-theme', isCaramel ? 'caramel' : 'aurora');
      skinToggle.textContent = isCaramel ? '皮肤：Caramel' : '皮肤：Aurora';
      skinToggle.setAttribute('aria-pressed', String(isCaramel));
    });
  }

  if (rangeButtons.length) {
    rangeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const rangeKey = button.dataset.range;
        if (rangeKey) {
          applyRangePreset(rangeKey);
        }
      });
    });
  }
}

init();
