import { test } from 'node:test';
import assert from 'node:assert/strict';
test('Vercel entry serves JSON dataset and rejects non-durable writes', async () => {
  process.env.VERCEL = '1';
  delete process.env.MONGODB_URI;
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const r = await fetch(base + '/api/summary?min=90');
    assert.equal(r.status, 200);
    assert.ok(r.headers.get('content-type').includes('application/json'));
    assert.equal((await r.json()).total, 3772);
    const list = await fetch(base + '/api/restaurants?cuisine=Bakery');
    assert.equal((await list.json()).total, 127);
    const detail = await fetch(base + '/api/restaurants/30075445');
    assert.equal((await detail.json()).name, 'Morris Park Bake Shop');
    const write = await fetch(base + '/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(write.status, 503);
    assert.match((await write.json()).error, /read-only/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
