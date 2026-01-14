# Production Dashboard Table Sizing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the middle table sizing so all rows remain visible across resize/maximize without being covered by other elements.

**Architecture:** Add a small table-sizing module that computes a scale factor from available height and row count, then apply the scale via CSS variables. Integrate the module into the dashboard HTML and adjust table CSS to use scaled heights and padding.

**Tech Stack:** HTML/CSS, vanilla JS (ES modules), Node.js built-in test runner.

### Task 1: Table sizing utilities + tests (TDD)

**Files:**
- Create: `public/production-dashboard-table.mjs`
- Create: `tests/production-dashboard-table.test.mjs`

**Step 1: Write the failing test**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTableMetrics } from '../public/production-dashboard-table.mjs';

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
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/production-dashboard-table.test.mjs`
Expected: FAIL with "computeTableMetrics is not defined".

**Step 3: Write minimal implementation**

```js
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
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/production-dashboard-table.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add public/production-dashboard-table.mjs tests/production-dashboard-table.test.mjs
git commit -m "feat: add table sizing helper"
```

### Task 2: Integrate sizing logic into dashboard HTML

**Files:**
- Modify: `public/production-dashboard.html`

**Step 1: Update table CSS variables and row sizing**

```css
.table-wrap {
  --row-count: 12;
  --table-scale: 1;
  --table-max-scale: 1.1;
  --thead-base: 40px;
  --row-base: 30px;
  --thead-height: calc(var(--thead-base) * var(--table-scale));
  --row-height: calc(var(--row-base) * var(--table-scale));
  --cell-font-base: 14px;
  --thead-font-base: 15px;
  --cell-pad-y-base: 6px;
  --cell-pad-x-base: 6px;
  --cell-font-size: calc(var(--cell-font-base) * var(--table-scale));
  --thead-font-size: calc(var(--thead-font-base) * var(--table-scale));
  --cell-pad-y: calc(var(--cell-pad-y-base) * var(--table-scale));
  --cell-pad-x: calc(var(--cell-pad-x-base) * var(--table-scale));
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  table-layout: fixed;
}

thead th,
tbody td {
  padding: var(--cell-pad-y) var(--cell-pad-x);
  line-height: 1.15;
  word-break: break-word;
}

thead th {
  font-size: var(--thead-font-size);
  height: var(--thead-height);
}

tbody td {
  font-size: var(--cell-font-size);
}

tbody tr {
  height: var(--row-height);
}
```

**Step 2: Add sizing init to script (module)**

```html
<script type="module">
  import { initTableSizing } from './production-dashboard-table.mjs';

  initTableSizing(document.querySelector('.table-wrap'));

  const ChartJS = window.Chart;
  // ...existing Chart.js setup using ChartJS...
</script>
```

**Step 3: Run tests**

Run: `npm test`
Expected: PASS.

**Step 4: Commit**

```bash
git add public/production-dashboard.html
git commit -m "feat: scale dashboard table to fit container"
```

### Task 3: Manual verification

**Files:**
- None

**Step 1: Manual checks**
- Open `public/production-dashboard.html` in a browser.
- Resize height/width and toggle maximize.
- Confirm all table rows are visible and no overlap with the chart section.

**Step 2: Commit notes (optional)**
- If any fixes are needed, repeat TDD and re-run tests.
