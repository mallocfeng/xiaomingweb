import {
  stationKeys,
  rangePresets,
  mapStationFilters,
  deriveRangeBounds
} from './utils/filterUtils.mjs';

const stationGrid = document.querySelector('#station-grid');
const rangeSelect = document.querySelector('#range-select');
const rangeDisplay = document.querySelector('#range-display');
const filterForm = document.querySelector('#filter-form');
const snInput = document.querySelector('#sn-input');
const orderInput = document.querySelector('#order-input');
const limitSelect = document.querySelector('#limit-select');
const statusMessage = document.querySelector('#status-message');
const resultsGrid = document.querySelector('#results-grid');
const resultCount = document.querySelector('#result-count');
const fetchButton = document.querySelector('#fetch-button');

const stationState = stationKeys.map((station) => ({ key: station.key, status: null }));

function injectRangeOptions() {
  rangeSelect.innerHTML = rangePresets
    .map(
      (entry, index) =>
        `<option value="${entry.key}" ${entry.key === 'LAST_24_HOURS' ? 'selected' : ''} data-index="${index}">${entry.label}</option>`
    )
    .join('');
  updateRangeDisplay();
}

function updateRangeDisplay() {
  const preview = deriveRangeBounds(rangeSelect.value);
  rangeDisplay.textContent = ` ${preview.label}`;
}

function buildStationCards() {
  stationGrid.innerHTML = stationKeys
    .map(
      (station) => `
      <div class="station-card" data-key="${station.key}">
        <strong>${station.key}</strong>
        <p>${station.label}</p>
        <div class="station-buttons">
          <button type="button" class="status-button" data-status="OK">OK</button>
          <button type="button" class="status-button" data-status="NG">NG</button>
        </div>
      </div>`
    )
    .join('');
}

function refreshStationButtons(cardEl, status) {
  const buttons = cardEl.querySelectorAll('.status-button');
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.status === status);
  });
}

stationGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.status-button');
  if (!button) return;
  const card = event.target.closest('.station-card');
  const key = card.dataset.key;
  const entry = stationState.find((item) => item.key === key);
  const clickedStatus = button.dataset.status;
  entry.status = entry.status === clickedStatus ? null : clickedStatus;
  refreshStationButtons(card, entry.status);
});

rangeSelect.addEventListener('change', () => {
  updateRangeDisplay();
});

filterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await executeSearch();
});

async function executeSearch() {
  fetchButton.disabled = true;
  statusMessage.textContent = '正在联系 SQL Server...';
  const rangeBounds = deriveRangeBounds(rangeSelect.value);
  const payload = {
    rangeKey: rangeSelect.value,
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
            <span class="status-chip ${chipClass}">
              <span>${statusText}</span>
              <small>${station.key}</small>
            </span>`;
        })
        .join('');

      return `
        <article class="result-card" style="animation-delay:${index * 0.08}s">
          <h4>${record.SN || '未知 SN'}</h4>
          <div class="meta">
            <span>订单：${record.OrderName || '—'}</span>
            <span>${latestRange}</span>
          </div>
          <div class="meta">
            <span>操作者：${record.Operator || '匿名'}</span>
            <span>结束：${stopRange}</span>
          </div>
          <div class="status-row">
            ${statuses}
          </div>
        </article>`;
    })
    .join('');
}

function init() {
  injectRangeOptions();
  buildStationCards();
  renderResults([]);
}

init();
