import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getConnectionPool } from './db.mjs';
import { buildSearchQuery } from './query-builder.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: '1mb' }));
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TS70 station explorer ready',
    timestamp: new Date().toISOString()
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

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    console.log(`TS70 explorer listening on port ${PORT}`);
  });
}

export { app };
