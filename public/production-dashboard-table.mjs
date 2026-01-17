const DEFAULTS = {
  headBase: 40,
  rowBase: 30,
  maxScale: 1
};

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function computeFittedFontSize({ availableWidth, textWidth, baseSize, minScale = 0.7 }) {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(textWidth) || !Number.isFinite(baseSize)) {
    return baseSize;
  }

  if (availableWidth <= 0 || textWidth <= 0 || baseSize <= 0) {
    return baseSize;
  }

  if (textWidth <= availableWidth) {
    return baseSize;
  }

  const ratio = availableWidth / textWidth;
  const scale = Math.max(minScale, ratio);
  return baseSize * scale;
}

export function computeTableMetrics({ availableHeight, rowCount, headBase, rowBase, maxScale = 1 }) {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0 || rowCount <= 0) {
    return {
      fontScale: 1,
      headHeight: 0,
      rowHeight: 0,
      totalHeight: 0
    };
  }

  const totalBase = headBase + rowBase * rowCount;
  if (!Number.isFinite(totalBase) || totalBase <= 0) {
    return {
      fontScale: 1,
      headHeight: 0,
      rowHeight: 0,
      totalHeight: 0
    };
  }

  const rawScale = availableHeight / totalBase;
  const fontScale = Math.min(maxScale, rawScale);
  const headHeight = headBase * fontScale;
  const rowHeight = rowCount > 0 ? Math.max(0, (availableHeight - headHeight) / rowCount) : 0;
  return {
    fontScale,
    headHeight,
    rowHeight,
    totalHeight: headHeight + rowHeight * rowCount
  };
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
    let availableHeight = Math.max(0, tableWrap.clientHeight - paddingTop - paddingBottom);
    const rowCount = tableWrap.querySelectorAll ? tableWrap.querySelectorAll('tbody tr').length : 0;

    tableWrap.style?.setProperty('--row-count', String(rowCount));

    if (tableWrap.querySelector) {
      const hint = tableWrap.querySelector('.table-scroll-hint');
      const hintStyle = hint && getComputedStyleFn ? getComputedStyleFn(hint) : null;
      const hintPosition = hintStyle?.position;
      const shouldSubtractHint = hint && (!hintPosition || (hintPosition !== 'absolute' && hintPosition !== 'fixed'));
      if (shouldSubtractHint && Number.isFinite(hint.offsetHeight)) {
        availableHeight = Math.max(0, availableHeight - hint.offsetHeight);
      }
    }

    const headBase = parseNumber(computed?.getPropertyValue?.('--thead-base'), options.headBase ?? DEFAULTS.headBase);
    const rowBase = parseNumber(computed?.getPropertyValue?.('--row-base'), options.rowBase ?? DEFAULTS.rowBase);
    const maxScale = parseNumber(
      computed?.getPropertyValue?.('--table-max-scale'),
      options.maxScale ?? DEFAULTS.maxScale
    );

    const { fontScale, rowHeight } = computeTableMetrics({
      availableHeight,
      rowCount,
      headBase,
      rowBase,
      maxScale
    });

    tableWrap.style?.setProperty('--table-font-scale', Number.isFinite(fontScale) ? fontScale.toFixed(3) : '1');
    let resolvedRowHeight = rowHeight;
    if (tableWrap.querySelector) {
      const thead = tableWrap.querySelector('thead');
      const measuredHeadHeight = thead?.getBoundingClientRect?.().height;
      if (Number.isFinite(measuredHeadHeight) && measuredHeadHeight > headBase * fontScale && rowCount > 0) {
        resolvedRowHeight = Math.max(0, (availableHeight - measuredHeadHeight) / rowCount);
      }
    }

    tableWrap.style?.setProperty(
      '--row-height',
      Number.isFinite(resolvedRowHeight) ? `${resolvedRowHeight.toFixed(2)}px` : '0px'
    );
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
