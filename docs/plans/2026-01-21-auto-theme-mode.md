# Auto Theme by Time Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically choose light/dark theme based on local time (06:00-17:59 light, otherwise dark) while still allowing manual toggle per session.

**Architecture:** Add a time-based theme selector that runs at page load to set the initial theme. Manual toggle updates theme immediately and persists, but load always starts from the time-based rule. Keep theme colors and chart updates consistent through existing `setTheme`/`applyChartTheme` flows.

**Tech Stack:** HTML/CSS, vanilla JS, Chart.js, node:test

### Task 1: Add a failing test for time-based auto theme

**Files:**
- Modify: `tests/production-dashboard-theme.test.mjs`

**Step 1: Write the failing test**

```js
it('defaults to time-based auto theme on load', async () => {
  const html = await readDashboardHtml();

  assert.match(html, /getHours\(\)/);
  assert.match(html, /autoTheme/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/production-dashboard-theme.test.mjs`
Expected: FAIL because time-based auto theme logic is not present yet.

**Step 3: Write minimal implementation**

Add an `autoTheme` function that uses local time and set the initial `data-theme` in the `<head>` script. Ensure the module script uses the same `autoTheme` for initial `setTheme`.

**Step 4: Run test to verify it passes**

Run: `node --test tests/production-dashboard-theme.test.mjs`
Expected: PASS.

**Step 5: Commit**

Skipped per user request (no git commits).

### Task 2: Ensure manual toggle overrides during the session

**Files:**
- Modify: `public/production-dashboard-v6.html`

**Step 1: Write the failing test**

```js
it('allows manual toggle after auto theme load', async () => {
  const html = await readDashboardHtml();

  assert.match(html, /setTheme\(.*'manual'/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/production-dashboard-theme.test.mjs`
Expected: FAIL because `setTheme` does not accept a manual mode yet.

**Step 3: Write minimal implementation**

Update `setTheme(theme, mode)` to accept `mode = 'manual'` and store it in localStorage; use `mode = 'auto'` during initial load. Keep the existing manual toggle behavior unchanged for UI.

**Step 4: Run test to verify it passes**

Run: `node --test tests/production-dashboard-theme.test.mjs`
Expected: PASS.

**Step 5: Commit**

Skipped per user request (no git commits).

### Task 3: Run full test suite

**Files:**
- Test: `npm test`

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Commit**

Skipped per user request (no git commits).
