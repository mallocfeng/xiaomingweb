import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fsPromises from 'fs/promises';
import fs from 'fs';
import { getConnectionPool } from './db.mjs';
import { buildSearchQuery } from './query-builder.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: '1mb' }));
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
const dashboardDataFile = path.join(publicDir, 'production-dashboard-data.json');
const sseClients = new Set();
let dataWatchTimer = null;

const broadcastDataUpdate = () => {
  const payload = `event: data-update\ndata: ${Date.now()}\n\n`;
  sseClients.forEach((res) => {
    res.write(payload);
  });
};

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TS70 station explorer ready',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    server: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'TS70_246K'
  });
});

app.post('/api/search', async (req, res) => {
  try {
    const { startTime, stopTime, rangeKey, stationFilters, sn, orderName, limit } = req.body;
    const { queryText, parameters } = buildSearchQuery({
      rangeKey,
      startTime: startTime ? new Date(startTime) : undefined,
      stopTime: stopTime ? new Date(stopTime) : undefined,
      stationFilters,
      sn,
      orderName,
      limit
    });

    const pool = await getConnectionPool();
    const request = pool.request();

    Object.entries(parameters).forEach(([key, value]) => {
      request.input(key, value);
    });

    const sqlResult = await request.query(queryText);
    res.json({
      count: sqlResult.recordset.length,
      data: sqlResult.recordset
    });
  } catch (error) {
    console.error('Search request failed', error);
    res.status(500).json({ error: 'Unable to execute search' });
  }
});

app.post('/api/production-dashboard-data', express.text({ type: '*/*', limit: '2mb' }), async (req, res) => {
  try {
    let rawText = '';
    if (typeof req.body === 'string') {
      rawText = req.body.trim();
    } else if (req.body && typeof req.body === 'object') {
      rawText = JSON.stringify(req.body, null, 2);
    }
    if (!rawText) {
      res.status(400).json({ error: 'Empty payload' });
      return;
    }

    const shouldValidateJson = req.is('application/json') || /^[{\[]/.test(rawText);
    if (shouldValidateJson) {
      try {
        JSON.parse(rawText);
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }
    }

    const tempFile = `${dashboardDataFile}.tmp`;
    const content = rawText.endsWith('\n') ? rawText : `${rawText}\n`;
    await fsPromises.writeFile(tempFile, content, 'utf8');
    await fsPromises.rename(tempFile, dashboardDataFile);

    broadcastDataUpdate();
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Dashboard data update failed', error);
    res.status(500).json({ error: 'Unable to update data file' });
  }
});

app.get('/api/production-dashboard-data/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('retry: 5000\n\n');

  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

const watchDashboardData = () => {
  try {
    fs.watch(dashboardDataFile, { persistent: false }, () => {
      if (dataWatchTimer) {
        clearTimeout(dataWatchTimer);
      }
      dataWatchTimer = setTimeout(() => {
        broadcastDataUpdate();
      }, 120);
    });
  } catch (error) {
    console.error('Dashboard data watch failed', error);
  }
};

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
if (process.argv[1] === __filename) {
  watchDashboardData();
  app.listen(PORT, () => {
    console.log(`TS70 explorer listening on port ${PORT}`);
  });
}

export { app };
