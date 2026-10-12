import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterRecords, summarize, validateRecord, decorate, normalize } from '../model.js';
const records = JSON.parse(
  await readFile(new URL('../data/restaurants.json', import.meta.url), 'utf8'),
).map(normalize);
test('Real dataset group totals and aggregate maximum', () => {
  const s = summarize(records, 90, 10);
  assert.equal(s.total, 3772);
  assert.equal(
    s.groups.reduce((n, b) => n + b.count, 0),
    3772,
  );
  assert.equal(s.groups.find((b) => b.name === 'Manhattan').count, 1883);
  assert.equal(s.ranked[0].totalScore, 225);
  assert.equal(s.ranked.length, 10);
});
test('Search combines case-insensitive name with exact borough and cuisine', () => {
  const r = filterRecords(records, {
    q: 'star',
    field: 'name',
    borough: 'Brooklyn',
    cuisine: 'American',
  });
  assert.ok(r.length);
  assert.ok(
    r.every(
      (x) =>
        x.name.toLowerCase().includes('star') &&
        x.borough === 'Brooklyn' &&
        x.cuisine === 'American',
    ),
  );
  assert.equal(filterRecords(records, { q: 'not-a-real-restaurant-93818' }).length, 0);
});
test('Latest inspection follows date, not input order', () => {
  const r = {
    ...records[0],
    grades: [
      { date: { $date: 1 }, score: 9, grade: 'B' },
      { date: { $date: 2 }, score: 2, grade: 'A' },
    ],
  };
  assert.equal(decorate(r).latest.score, 2);
});
test('Validation rejects malformed fields and strips inspection changes', () => {
  const r = { ...records[0], description: 'Recorded bakery in the Bronx.' };
  assert.equal(validateRecord(r).name, r.name);
  assert.equal(validateRecord(r).grades, undefined);
  assert.throws(() => validateRecord({ ...r, restaurant_id: 'abc' }));
  assert.throws(() => validateRecord({ ...r, borough: 'Unknown' }));
  assert.throws(() => validateRecord({ ...r, address: { ...r.address, zipcode: '2000' } }));
});

test('Cafe encoding variants share one searchable cuisine', () => {
  const base = records[0];
  for (const cuisine of ['Caf\u00c3\u00a9/Coffee/Tea', 'Caf\ufffd/Coffee/Tea', 'Café/Coffee/Tea']) {
    assert.equal(normalize({ ...base, cuisine }).cuisine, 'Café/Coffee/Tea');
  }
});
