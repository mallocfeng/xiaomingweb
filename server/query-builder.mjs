import dotenv from 'dotenv';

dotenv.config();

const STATION_KEYS = [
  'OP10',
  'OP20',
  'OP30',
  'OP35',
  'OP40',
  'OP50',
  'OP60',
  'OP65',
  'OP70'
];

const RANGE_PRESETS = {
  LAST_HOUR: { label: 'Last 1 hour', offsetMinutes: 60 },
  LAST_6_HOURS: { label: 'Last 6 hours', offsetMinutes: 360 },
  LAST_24_HOURS: { label: 'Last 24 hours', offsetMinutes: 1440 },
  LAST_3_DAYS: { label: 'Last 3 days', offsetMinutes: 4320 },
  TODAY: { label: 'Today', snapshot: 'today' }
};

const STATUS_MAP = {
  OK: 1,
  NG: 0
};

export function normalizeRange(rangeKey, now = new Date()) {
  const preset = RANGE_PRESETS[rangeKey];
  if (!preset) {
    return { startTime: undefined, stopTime: undefined };
  }

  if (preset.snapshot === 'today') {
    return {
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      stopTime: now
    };
  }

  const startTime = new Date(now.getTime() - preset.offsetMinutes * 60 * 1000);
  return { startTime, stopTime: now };
}

export function buildSearchQuery({
  rangeKey,
  startTime,
  stopTime,
  stationFilters = [],
  limit = 100,
  sn,
  orderName
  ,
  tableSchema,
  tableName
} = {}) {
  const normalized = normalizeRange(rangeKey);
  const effectiveStart = startTime || normalized.startTime;
  const effectiveStop = stopTime || normalized.stopTime;
  const clauses = [];
  const parameters = {};

  if (effectiveStart) {
    clauses.push('StartTime >= @startTime');
    parameters.startTime = effectiveStart;
  }

  if (effectiveStop) {
    clauses.push('StartTime <= @stopTime');
    parameters.stopTime = effectiveStop;
  }

  if (sn) {
    clauses.push('SN LIKE @sn');
    parameters.sn = `%${sn}%`;
  }

  if (orderName) {
    clauses.push('OrderName LIKE @orderName');
    parameters.orderName = `%${orderName}%`;
  }

  stationFilters.forEach((filter, index) => {
    if (!filter?.key || !filter?.status) return;
    const key = filter.key.toUpperCase();
    if (!STATION_KEYS.includes(key)) return;

    const status = STATUS_MAP[filter.status.toUpperCase()];
    if (status === undefined) return;

    const column = `${key}Result`;
    const paramName = `station_${index}`;
    clauses.push(`${column} = @${paramName}`);
    parameters[paramName] = status;
  });

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const finalLimit = Math.min(Math.max(limit, 1), 500);
  const tableRef = buildTableReference(tableSchema, tableName);
  const queryText = `SELECT TOP (${finalLimit}) * FROM ${tableRef} ${where} ORDER BY StartTime DESC`;

  return { queryText, parameters };
}

function buildTableReference(schemaOverride, tableOverride) {
  const schemaFromEnv = process.env.DB_SCHEMA ?? 'dbo';
  const table = process.env.DB_TABLE ?? 'TS70_246K';
  const schema = schemaOverride ?? schemaFromEnv;
  const resolvedTable = tableOverride?.trim() || table.trim();
  if (schema && schema.trim().length) {
    return `${schema.trim()}.${resolvedTable}`;
  }
  return table.trim();
}
