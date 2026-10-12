import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignPhotos } from '../src/photo-selection.js';
test('unsupported cuisines use varied food illustrations and stable assignments', () => {
  const records = Array.from({ length: 12 }, (_, i) => ({
    restaurant_id: String(30000000 + i),
    cuisine: 'Irish',
  }));
  const picks = assignPhotos(records);
  assert.equal(new Set([...picks.values()].map((p) => p.file)).size, 12);
  assert.ok([...picks.values()].every((p) => p.generic && p.group !== 'city'));
  assert.deepEqual(assignPhotos(records), picks);
});
test('American cards avoid repeat photos until their cuisine pool is exhausted', () => {
  const records = Array.from({ length: 6 }, (_, i) => ({
    restaurant_id: String(i),
    cuisine: 'American',
  }));
  assert.equal(new Set([...assignPhotos(records).values()].map((p) => p.file)).size, 6);
});
