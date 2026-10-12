import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { installAuth } from '../auth.js';
test('admin authentication protects writes and rejects forged sessions', async () => {
  const app = express();
  app.use(express.json());
  installAuth(app, { username: 'admin', password: 'test-password', secret: 'test-secret' });
  app.post('/api/restaurants', (req, res) => res.json({ saved: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + '/api/restaurants', { method: 'POST' })).status, 401);
    const login = (password) =>
      fetch(base + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password }),
      });
    assert.equal((await login('wrong')).status, 401);
    const result = await login('test-password');
    assert.equal(result.status, 200);
    const raw = result.headers.get('set-cookie');
    assert.match(raw, /HttpOnly/);
    assert.match(raw, /SameSite=Strict/);
    const cookie = raw.split(';')[0];
    assert.equal(
      (await fetch(base + '/api/restaurants', { method: 'POST', headers: { cookie } })).status,
      200,
    );
    assert.equal(
      (
        await fetch(base + '/api/restaurants', {
          method: 'POST',
          headers: { cookie: cookie + 'x' },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + '/api/restaurants', {
          method: 'POST',
          headers: { cookie, origin: 'https://other.example' },
        })
      ).status,
      403,
    );
    const logout = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { cookie } });
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal((await (await fetch(base + '/api/auth/session')).json()).authenticated, false);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
