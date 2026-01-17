import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeFittedFontSize, computeTableMetrics, initTableSizing } from '../public/production-dashboard-table.mjs';

describe('production dashboard table sizing', () => {
  it('scales down evenly when space is tight', () => {
    const result = computeTableMetrics({
      availableHeight: 300,
      rowCount: 10,
      headBase: 40,
      rowBase: 30,
      maxScale: 1.1
    });
    assert.ok(result.fontScale < 1);
    assert.ok(Math.abs(result.rowHeight - result.fontScale * 30) < 0.01);
    assert.ok(Math.abs(result.totalHeight - 300) < 0.01);
  });

  it('caps font scale but expands row height when space is abundant', () => {
    const result = computeTableMetrics({
      availableHeight: 1000,
      rowCount: 10,
      headBase: 40,
      rowBase: 30,
      maxScale: 1.1
    });
    assert.strictEqual(result.fontScale, 1.1);
    assert.ok(result.rowHeight > 30 * result.fontScale);
    assert.ok(Math.abs(result.totalHeight - 1000) < 0.01);
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
    assert.ok(parseFloat(props['--table-font-scale']) < 1);
    assert.ok(parseFloat(props['--row-height']) > 0);
  });

  it('shrinks row height when the header grows taller than the base', () => {
    const props = {};
    const thead = {
      getBoundingClientRect: () => ({ height: 80 })
    };
    const tableWrap = {
      clientHeight: 300,
      style: {
        setProperty: (key, value) => {
          props[key] = value;
        }
      },
      querySelectorAll: () => new Array(10),
      querySelector: (selector) => {
        if (selector === 'thead') return thead;
        return null;
      }
    };

    const getComputedStyle = () => ({
      paddingTop: '0px',
      paddingBottom: '0px',
      getPropertyValue: (name) => {
        if (name === '--thead-base') return '40px';
        if (name === '--row-base') return '30px';
        if (name === '--table-max-scale') return '1.1';
        return '';
      }
    });

    const { update } = initTableSizing(tableWrap, {
      getComputedStyle,
      ResizeObserverCtor: null
    });
    update();

    assert.strictEqual(props['--row-height'], '22.00px');
  });

  it('subtracts scroll hint height when it is in flow', () => {
    const props = {};
    const hint = { offsetHeight: 30 };
    const tableWrap = {
      clientHeight: 300,
      style: {
        setProperty: (key, value) => {
          props[key] = value;
        }
      },
      querySelectorAll: () => new Array(10),
      querySelector: (selector) => {
        if (selector === '.table-scroll-hint') return hint;
        return null;
      }
    };

    const getComputedStyle = (el) => {
      if (el === hint) {
        return { position: 'static' };
      }
      return {
        paddingTop: '0px',
        paddingBottom: '0px',
        getPropertyValue: (name) => {
          if (name === '--thead-base') return '40px';
          if (name === '--row-base') return '30px';
          if (name === '--table-max-scale') return '1';
          return '';
        }
      };
    };

    const { update } = initTableSizing(tableWrap, {
      getComputedStyle,
      ResizeObserverCtor: null
    });
    update();

    assert.strictEqual(props['--row-height'], '23.82px');
  });
});

describe('production dashboard text fitting', () => {
  it('keeps base size when there is enough space', () => {
    const size = computeFittedFontSize({
      availableWidth: 120,
      textWidth: 100,
      baseSize: 16,
      minScale: 0.7
    });
    assert.strictEqual(size, 16);
  });

  it('shrinks to fit but respects min scale', () => {
    const size = computeFittedFontSize({
      availableWidth: 60,
      textWidth: 120,
      baseSize: 16,
      minScale: 0.7
    });
    assert.strictEqual(size, 11.2);
  });
});
