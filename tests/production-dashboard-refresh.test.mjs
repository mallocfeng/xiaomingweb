import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const SERVER_PATH = new URL('../server/index.mjs', import.meta.url);
const DASHBOARD_PATH = new URL('../public/production-dashboard-v6.html', import.meta.url);

const readFileText = async (pathUrl) => readFile(pathUrl, 'utf-8');

describe('production dashboard remote refresh', () => {
  it('adds refresh endpoint that broadcasts page-refresh', async () => {
    const serverCode = await readFileText(SERVER_PATH);

    assert.match(serverCode, /app\.post\('\/api\/production-dashboard-refresh'/);
    assert.match(serverCode, /page-refresh/);
  });

  it('listens for page-refresh event and reloads', async () => {
    const html = await readFileText(DASHBOARD_PATH);

    assert.match(html, /addEventListener\('page-refresh'/);
    assert.match(html, /location\.reload\(/);
  });
});
