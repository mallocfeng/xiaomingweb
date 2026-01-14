const DEFAULTS = {
  headBase: 40,
  rowBase: 30,
  maxScale: 1
};

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function computeTableMetrics({ availableHeight, rowCount, headBase, rowBase, maxScale = 1 }) {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0 || rowCount <= 0) {
    return { scale: 1, totalHeight: 0 };
  }

  const totalBase = headBase + rowBase * rowCount;
  if (!Number.isFinite(totalBase) || totalBase <= 0) {
    return { scale: 1, totalHeight: 0 };
  }

  const rawScale = availableHeight / totalBase;
  const scale = Math.min(maxScale, rawScale);
  return { scale, totalHeight: totalBase * scale };
}

export function initTableSizing(tableWrap, options = {}) {
  if (!tableWrap) {
    return { update: () => {}, disconnect: () => {} };
  }

  const getComputedStyleFn = options.getComputedStyle ?? globalThis.getComputedStyle;
  const ResizeObserverCtor = options.ResizeObserverCtor ?? globalThis.ResizeObserver;

  const update = () => {
    const computed = getComputedStyleFn ? getComputedStyleFn(tableWrap) : null;
    const paddingTop = parseNumber(computed?.paddingTop, 0);
    const paddingBottom = parseNumber(computed?.paddingBottom, 0);
    const availableHeight = Math.max(0, tableWrap.clientHeight - paddingTop - paddingBottom);
    const rowCount = tableWrap.querySelectorAll ? tableWrap.querySelectorAll('tbody tr').length : 0;

    tableWrap.style?.setProperty('--row-count', String(rowCount));

    const headBase = parseNumber(computed?.getPropertyValue?.('--thead-base'), options.headBase ?? DEFAULTS.headBase);
    const rowBase = parseNumber(computed?.getPropertyValue?.('--row-base'), options.rowBase ?? DEFAULTS.rowBase);
    const maxScale = parseNumber(
      computed?.getPropertyValue?.('--table-max-scale'),
      options.maxScale ?? DEFAULTS.maxScale
    );

    const { scale } = computeTableMetrics({
      availableHeight,
      rowCount,
      headBase,
      rowBase,
      maxScale
    });

    tableWrap.style?.setProperty('--table-scale', Number.isFinite(scale) ? scale.toFixed(3) : '1');
  };

  update();

  let observer;
  if (ResizeObserverCtor) {
    observer = new ResizeObserverCtor(update);
    observer.observe(tableWrap);
  }

  return {
    update,
    disconnect: () => {
      if (observer) {
        observer.disconnect();
      }
    }
  };
}
