# Order Station Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a stylish animated dashboard that lets operators query `TS70_246K` with flexible range filters, station toggles, and SQl Server-backed results.

**Architecture:** An Express + mssql service exposes parameterized search APIs and a health check; the same server serves a single-page static UI that animates filter controls and lists results in a card grid.

**Tech Stack:** Node.js 20+, Express, `mssql`, `dotenv`, `supertest`, Node built-in test runner, vanilla HTML/CSS/JS (ES modules), modern CSS variables and animations, fetch API.

### Task 1: Stand up the backend service + query helpers + tests

**Files:**
- Create: `package.json` (type=module, scripts for `dev`, `start`, `test`).
- Create: `.gitignore` (ignore `node_modules`, `.env`, `dist`, `public/dist`).
- Create: `.env.example` (connection template for `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
- Create: `server/index.mjs` (exportable Express app, `/api/status`, `/api/search`, static middleware).
- Create: `server/db.mjs` (single `getConnectionPool` helper using `mssql`, caches pool, logs cycle time).
- Create: `server/query-builder.mjs` (exports `buildSearchQuery` + `normalizeRange`, returns parameterized SQL and values).
- Create: `server/test/status.test.mjs` (supertest hitting `/api/status`).
- Create: `server/test/query-builder.test.mjs` (node test verifying SQL pieces for sample filters).

**Step 1: Write the failing test**

```javascript
// server/test/status.test.mjs
import request from 'supertest';
import { app } from '../index.mjs';

describe('GET /api/status', () => {
  it('responds 200 with a descriptive message', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/TS70/i);
  });
});
```

**Step 2: Run the test to ensure it fails**

Run: `npm run test -- server/test/status.test.mjs`
Expected: FAIL because `server/index.mjs` and `/api/status` do not yet exist.

**Step 3: Implement the Express app, query helper, and `/api/status` plus `/api/search` using the planned helpers.**

**Step 4: Run `npm run test` again**

Run: `npm run test`
Expected: PASS (supertest and query-builder expectations succeed).

**Step 5: Commit**

```bash
git add package.json server .env.example server/test
git commit -m "feat: add ts70 query service"
```

### Task 2: Build the animated filter-driven UI + docs

**Files:**
- Create: `public/index.html` (hero gradient, form with dropdowns, checkboxes styled as toggles, result area, font import via CSS).
- Create: `public/styles.css` (use CSS variables, layered gradient background, glassy panels, keyframe reveals, hover states, animation delays).
- Create: `public/app.js` (module handling filter state, dropdown for time range, station toggles, fetch to `/api/search`, renders cards with animated entry, builds query payload). 
- Create: `public/utils/filterUtils.mjs` (exports `mapStationFilters` and `buildRangePayload` so we can unit test the logic).
- Update: `server/index.mjs` to serve `public` as static assets and return `index.html` on all other routes.
- Create: `tests/filterUtils.test.mjs` (node test verifying `mapStationFilters` honors selected stations and skip unchecked ones).
- Update: `README.md` to include run instructions (`npm run dev`, `npm run start`, environment vars, UI usage).

**Step 1: Write the failing UI helper test**

```javascript
// tests/filterUtils.test.mjs
import { mapStationFilters } from '../public/utils/filterUtils.mjs';

node:test('skips unchecked station filters', () => {
  const payload = mapStationFilters({
    stations: [ { key: 'OP10', checked: true }, { key: 'OP20', checked: false } ]
  });
  expect(payload.stationKeys).toEqual(['OP10']);
});
```

**Step 2: Run test to confirm failure**

Run: `npm run test -- tests/filterUtils.test.mjs`
Expected: FAIL because `mapStationFilters` is not implemented yet.

**Step 3: Implement the UI files and helper module, wiring the fetch call to use the helper outputs and animating the DOM updates.**

**Step 4: Run `npm run test`**

Run: `npm run test`
Expected: PASS (filter helper test passes). Validate manually by running `npm run dev` and visiting `http://localhost:3000` to see the animated dashboard.

**Step 5: Commit**

```bash
git add public README.md tests
git commit -m "feat: add animated ts70 dashboard"
```

### Task 3: Document usage and deployment pointers

**Files:**
- Modify: `README.md:1-30` (add section describing `.env` values, launch commands, and UI features).

**Step 1: Draft README section describing `.env`, scripts, and query workflow.**
**Step 2: Save and format README.**
**Step 3: Review with `cat README.md` or `bat README.md` to verify clarity.**
**Step 4: Commit**

```
git add README.md
git commit -m "docs: describe ts70 dashboard workflow"
```

Plan complete and saved to `docs/plans/2026-01-13-order-station-explorer.md`. Two execution options:

1. **Subagent-Driven (this session)** – stay here, run through `superpowers:subagent-driven-development`, and review after each task.
2. **Parallel Session (separate)** – start a new session/worktree guided by `superpowers:executing-plans` for each milestone.

Which approach would you like to take? EOF