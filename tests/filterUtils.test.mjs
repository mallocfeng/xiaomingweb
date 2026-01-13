import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapStationFilters, deriveRangeBounds, rangePresets } from '../public/utils/filterUtils.mjs';

describe('filter utils', () => {
  it('only serializes active station filters', () => {
    const state = [
      { key: 'OP10', status: 'OK' },
      { key: 'OP20', status: null },
      { key: 'OP30', status: 'NG' }
    ];
    const payload = mapStationFilters(state);
    assert.strictEqual(payload.length, 2);
    assert.deepStrictEqual(payload[0], { key: 'OP10', status: 'OK' });
    assert.deepStrictEqual(payload[1], { key: 'OP30', status: 'NG' });
  });

  it('derives expected range bounds', () => {
    const now = new Date('2026-01-01T12:00:00.000Z');
    const { startTime, stopTime, label } = deriveRangeBounds('LAST_HOUR', now);
    assert.strictEqual(stopTime.toISOString(), '2026-01-01T12:00:00.000Z');
    assert.strictEqual(startTime.toISOString(), '2026-01-01T11:00:00.000Z');
    assert.strictEqual(label, rangePresets.find((entry) => entry.key === 'LAST_HOUR').label);
  });
});
