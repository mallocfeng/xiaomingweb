import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const DASHBOARD_PATH = new URL('../public/production-dashboard-v6.html', import.meta.url);

const readDashboardHtml = async () => {
  return readFile(DASHBOARD_PATH, 'utf-8');
};

describe('production dashboard theme toggle', () => {
  it('adds a persisted dark theme toggle hook', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /data-theme=\"dark\"/);
    assert.match(html, /localStorage\.getItem\(['\"]theme['\"]\)/);
    assert.match(html, /localStorage\.setItem\(['\"]theme['\"],\s*['\"]dark['\"]\)/);
  });

  it('syncs chart label colors with CSS variables', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /getComputedStyle\(document\.documentElement\)/);
    assert.match(html, /--text-main/);
    assert.match(html, /legend\.labels\.color/);
  });

  it('sets legend text colors from CSS variables', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /getPropertyValue\('--text-muted'\)/);
    assert.match(html, /getPropertyValue\('--text-main'\)/);
    assert.match(html, /legendKey\.style\.color/);
    assert.match(html, /legendVal\.style\.color/);
  });

  it('assigns chart legend font color for canvas labels', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /generateLabels/);
    assert.match(html, /fontColor:\s*labelColor/);
  });

  it('refreshes legend colors when theme toggles', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /let\s+legendData/);
    assert.match(html, /updateLegend\(legendData\)/);
  });

  it('uses chart text tokens for axis labels', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /--chart-text/);
    assert.match(html, /getPropertyValue\('--chart-text'\)/);
    assert.match(html, /ticks\.color/);
  });

  it('defaults to time-based auto theme on load', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /getHours\(\)/);
    assert.match(html, /autoTheme/);
  });

  it('allows manual toggle after auto theme load', async () => {
    const html = await readDashboardHtml();

    assert.match(html, /setTheme\([^)]*'manual'/);
  });
});
