const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { MemoryStore } = require('express-rate-limit');
const { createLoginRateLimiter } = require('../src/middlewares/loginRateLimit');

async function setup(t, { trustProxy = false } = {}) {
  const app = express();
  app.set('trust proxy', trustProxy);
  const store = new MemoryStore();
  app.post('/login', createLoginRateLimiter({ limit: 2, windowMs: 60000, store }), (req, res) => {
    res.status(Number(req.query.status || 401)).json({ test: true });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    store.shutdown();
  });
  return {
    store,
    request(status = 401, forwardedFor) {
      return fetch(`http://127.0.0.1:${server.address().port}/login?status=${status}`, {
        method: 'POST',
        headers: forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {},
        signal: AbortSignal.timeout(5000),
      });
    },
  };
}

test('failed login limit returns 429, retry-after and a JSON error; reset restores access', async t => {
  const { request, store } = await setup(t);
  assert.equal((await request()).status, 401);
  assert.equal((await request()).status, 401);
  const blocked = await request();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.equal((await blocked.json()).code, 'LOGIN_RATE_LIMITED');
  store.resetAll();
  assert.equal((await request(200)).status, 200);
});

test('successful logins and server outages do not use the failure allowance', async t => {
  const { request } = await setup(t);
  for (const status of [200, 200, 503, 500, 401, 200, 401]) {
    assert.equal((await request(status)).status, status);
  }
  assert.equal((await request()).status, 429);
});

test('spoofing forwarded headers cannot bypass the limit on a direct connection', async t => {
  const { request } = await setup(t);
  t.mock.method(console, 'error', () => {});
  assert.equal((await request(401, '198.51.100.1')).status, 401);
  assert.equal((await request(401, '198.51.100.2')).status, 401);
  assert.equal((await request(401, '198.51.100.3')).status, 429);
});

test('trusted loopback proxy keeps separate limits for different client addresses', async t => {
  const { request } = await setup(t, { trustProxy: 'loopback' });
  assert.equal((await request(401, '198.51.100.1')).status, 401);
  assert.equal((await request(401, '198.51.100.1')).status, 401);
  assert.equal((await request(401, '198.51.100.1')).status, 429);
  assert.equal((await request(200, '198.51.100.2')).status, 200);
});
