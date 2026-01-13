import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../index.mjs';

describe('GET /api/status', () => {
  it('returns health payload with TS70 reference', async () => {
    const response = await request(app).get('/api/status');
    assert.strictEqual(response.status, 200);
    assert.match(response.body.message, /TS70/i);
    assert.ok(response.body.timestamp);
  });
});
