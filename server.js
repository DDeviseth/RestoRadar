import 'dotenv/config';
import './network.js';
import express from 'express';
import { installAuth } from './auth.js';
import { MongoClient } from 'mongodb';
import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decorate, filterRecords, summarize, validateRecord, normalize } from './model.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  if (/(?:^|\/)(?:\.env(?:\.[^/]*)?|\.admin-access\.txt|\.git)(?:\/|$)/i.test(req.path)) {
    return res.status(404).end();
  }
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use('/api', (req, res, next) => {
  if (
    !req.path.startsWith('/auth/') &&
    process.env.VERCEL &&
    !process.env.MONGODB_URI &&
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  )
    return res
      .status(503)
      .json({ error: 'This hosted preview is read-only. Connect MongoDB Atlas to save changes.' });
  next();
});
installAuth(app, {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  secret: process.env.SESSION_SECRET,
  secure: !!process.env.VERCEL || process.env.COOKIE_SECURE === 'true',
});
let collection, client, records;
const localFile = path.join(
  root,
  process.env.VERCEL ? 'data/restaurants.json' : 'data/local-records.json',
);
if (process.env.MONGODB_URI) {
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  collection = client
    .db(process.env.MONGODB_DB || 'dbRestaurants')
    .collection(process.env.MONGODB_COLLECTION || 'restaurants');
  await collection.createIndex({ restaurant_id: 1 }, { unique: true });
} else {
  try {
    records = JSON.parse(await readFile(localFile, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    records = JSON.parse(await readFile(path.join(root, 'data/restaurants.json'), 'utf8'));
  }
}
if (records) records = records.map(normalize);
const all = () =>
  collection
    ? collection
        .find({})
        .toArray()
        .then((rows) => rows.map(normalize))
    : Promise.resolve(records);
let queue = Promise.resolve();
function mutate(fn) {
  const task = queue.then(fn);
  queue = task.catch(() => {});
  return task;
}
async function persist(next) {
  await writeFile(localFile + '.tmp', JSON.stringify(next));
  await rename(localFile + '.tmp', localFile);
  records = next;
}
const route = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
app.get(
  '/api/summary',
  route(async (req, res) => {
    const data = await all();
    const min = Math.max(0, Number(req.query.min) || 0),
      limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const result = summarize(data, min, limit);
    if (collection) {
      result.groups = await collection
        .aggregate([
          { $group: { _id: '$borough', count: { $sum: 1 } } },
          { $project: { _id: 0, name: '$_id', count: 1 } },
        ])
        .toArray();
      result.ranked = await collection
        .aggregate([
          { $unwind: '$grades' },
          {
            $group: {
              _id: '$restaurant_id',
              record: { $first: '$$ROOT' },
              totalScore: { $sum: '$grades.score' },
              inspectionCount: { $sum: 1 },
            },
          },
          { $match: { totalScore: { $gt: min } } },
          { $sort: { totalScore: -1, _id: 1 } },
          { $limit: limit },
        ])
        .toArray()
        .then((rows) =>
          rows.map((row) => ({
            ...decorate(data.find((r) => r.restaurant_id === row._id)),
            totalScore: row.totalScore,
            inspectionCount: row.inspectionCount,
          })),
        );
    }
    res.json({ ...result, mode: collection ? 'MongoDB Atlas' : 'Local dataset' });
  }),
);
app.get(
  '/api/restaurants',
  route(async (req, res) => {
    const filtered = filterRecords(await all(), req.query);
    const page = Math.max(1, Number(req.query.page) || 1),
      size = 12;
    res.json({
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / size),
      records: filtered.slice((page - 1) * size, page * size).map(decorate),
    });
  }),
);
app.get(
  '/api/restaurants/:id',
  route(async (req, res) => {
    const r = (await all()).find((r) => r.restaurant_id === req.params.id);
    if (!r) return res.status(404).json({ error: 'Restaurant not found.' });
    res.json(decorate(r));
  }),
);
app.post(
  '/api/restaurants',
  route(async (req, res) =>
    mutate(async () => {
      const clean = validateRecord(req.body);
      if ((await all()).some((r) => r.restaurant_id === clean.restaurant_id))
        return res.status(409).json({ error: 'This restaurant ID already exists.' });
      const r = { ...clean, grades: [] };
      if (collection) await collection.insertOne(r);
      else await persist([...records, r]);
      res.status(201).json(decorate(r));
    }),
  ),
);
app.put(
  '/api/restaurants/:id',
  route(async (req, res) =>
    mutate(async () => {
      const existing = (await all()).find((r) => r.restaurant_id === req.params.id);
      if (!existing) return res.status(404).json({ error: 'Restaurant not found.' });
      const clean = validateRecord({ ...req.body, restaurant_id: existing.restaurant_id });
      const updated = { ...existing, ...clean };
      if (collection)
        await collection.updateOne({ restaurant_id: existing.restaurant_id }, { $set: clean });
      else
        await persist(
          records.map((r) => (r.restaurant_id === existing.restaurant_id ? updated : r)),
        );
      res.json(decorate(updated));
    }),
  ),
);
app.delete(
  '/api/restaurants/:id',
  route(async (req, res) =>
    mutate(async () => {
      if (!(await all()).some((r) => r.restaurant_id === req.params.id))
        return res.status(404).json({ error: 'Restaurant not found.' });
      if (collection) await collection.deleteOne({ restaurant_id: req.params.id });
      else await persist(records.filter((r) => r.restaurant_id !== req.params.id));
      res.json({ deleted: true });
    }),
  ),
);
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown endpoint.' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.code === 11000 ? 409 : 400)
    .json({ error: err.code === 11000 ? 'This restaurant ID already exists.' : err.message });
});
if (!process.env.VERCEL) {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(root, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  const server = app.listen(Number(process.env.PORT) || 5173, '127.0.0.1', () =>
    console.log('RestoRadar ready at http://localhost:' + (process.env.PORT || 5173)),
  );
  process.on('SIGINT', async () => {
    server.close();
    await client?.close();
    process.exit(0);
  });
}
export default app;
