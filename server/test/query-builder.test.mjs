import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchQuery, normalizeRange } from '../query-builder.mjs';

describe('query-builder helpers', () => {
  it('produces range when normalized', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const range = normalizeRange('LAST_HOUR', now);
    assert.strictEqual(range.startTime.toISOString(), '2024-01-01T11:00:00.000Z');
    assert.strictEqual(range.stopTime.toISOString(), '2024-01-01T12:00:00.000Z');
  });

  it('ignores unknown range keys gracefully', () => {
    const range = normalizeRange('UNKNOWN');
    assert.strictEqual(range.startTime, undefined);
    assert.strictEqual(range.stopTime, undefined);
  });

  it('builds station filters and parameters', () => {
    const { queryText, parameters } = buildSearchQuery({
      stationFilters: [
        { key: 'OP10', status: 'OK' },
        { key: 'OP20', status: 'NG' }
      ],
      limit: 5,
      sn: 'ABC'
    });

    assert.ok(queryText.includes('TOP (5)'));
    assert.match(queryText, /OP10Result = @station_0/);
    assert.match(queryText, /OP20Result = @station_1/);
    assert.strictEqual(parameters.station_0, 1);
    assert.strictEqual(parameters.station_1, 0);
    assert.strictEqual(parameters.sn, '%ABC%');
  });
});
