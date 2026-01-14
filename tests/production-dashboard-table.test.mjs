import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTableMetrics, initTableSizing } from '../public/production-dashboard-table.mjs';

describe('production dashboard table sizing', () => {
  it('scales down to fit available height', () => {
    const result = computeTableMetrics({
      availableHeight: 300,
      rowCount: 10,
      headBase: 40,
      rowBase: 30,
      maxScale: 1.1
    });
    assert.ok(result.scale < 1);
    assert.ok(result.totalHeight <= 300);
  });

  it('does not scale above maxScale', () => {
    const result = computeTableMetrics({
      availableHeight: 1000,
      rowCount: 10,
      headBase: 40,
      rowBase: 30,
      maxScale: 1.1
    });
    assert.strictEqual(result.scale, 1.1);
  });

  it('writes scaled CSS variables for the table wrap', () => {
    const props = {};
    const tableWrap = {
      clientHeight: 300,
      style: {
        setProperty: (key, value) => {
          props[key] = value;
        }
      },
      querySelectorAll: () => new Array(10)
    };

    const getComputedStyle = () => ({
      paddingTop: '10px',
      paddingBottom: '10px',
      getPropertyValue: (name) => {
        if (name === '--thead-base') return '40px';
        if (name === '--row-base') return '30px';
        if (name === '--table-max-scale') return '1.1';
        return '';
      }
    });

    class FakeResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {}

      disconnect() {}
    }

    const { update } = initTableSizing(tableWrap, {
      getComputedStyle,
      ResizeObserverCtor: FakeResizeObserver
    });
    update();

    assert.strictEqual(props['--row-count'], '10');
    assert.ok(parseFloat(props['--table-scale']) < 1);
  });
});
