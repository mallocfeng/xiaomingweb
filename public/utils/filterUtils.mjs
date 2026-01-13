export const stationKeys = [
  { key: 'OP10', label: 'OP10 · 预检' },
  { key: 'OP20', label: 'OP20 · 回流' },
  { key: 'OP30', label: 'OP30 · 功能' },
  { key: 'OP35', label: 'OP35 · 稳定' },
  { key: 'OP40', label: 'OP40 · 烧录' },
  { key: 'OP50', label: 'OP50 · 老化' },
  { key: 'OP60', label: 'OP60 · 终检' },
  { key: 'OP65', label: 'OP65 · 包装' },
  { key: 'OP70', label: 'OP70 · 跑分' }
];

export const rangePresets = [
  { key: 'LAST_HOUR', label: '最近 1 小时', offsetMinutes: 60 },
  { key: 'LAST_6_HOURS', label: '最近 6 小时', offsetMinutes: 360 },
  { key: 'LAST_24_HOURS', label: '最近 24 小时', offsetMinutes: 1440 },
  { key: 'LAST_72_HOURS', label: '最近 72 小时', offsetMinutes: 4320 },
  { key: 'TODAY', label: '当天', snapshot: 'today' }
];

export function mapStationFilters(stationState = []) {
  return stationState
    .map((station) => {
      const statuses = [];
      if (station.ok) statuses.push('OK');
      if (station.ng) statuses.push('NG');
      return statuses.length ? { key: station.key, statuses } : null;
    })
    .filter(Boolean);
}

export function deriveRangeBounds(rangeKey, now = new Date()) {
  const preset = rangePresets.find((entry) => entry.key === rangeKey);
  if (!preset) {
    return { startTime: undefined, stopTime: undefined, label: '自定义' };
  }

  const stopTime = now;
  let startTime;

  if (preset.snapshot === 'today') {
    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else {
    startTime = new Date(now.getTime() - (preset.offsetMinutes || 0) * 60 * 1000);
  }

  return {
    startTime,
    stopTime,
    label: preset.label
  };
}
