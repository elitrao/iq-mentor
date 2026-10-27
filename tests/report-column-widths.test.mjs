import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanColumnWidths, columnLimits, mergeColumnWidths, readColumnWidths, resizeColumnSnapshot, writeColumnWidths } from '../src/report-column-widths.js';

test('a resize changes only its target and preserves the 35px selection column', () => {
  const measured = { selection: 35, employee: 380.5, department: 200, score: 180 };
  const next = resizeColumnSnapshot(measured, 'employee', 412.5);
  assert.deepEqual(next, { selection: 35, employee: 412.5, department: 200, score: 180 });
  assert.equal(measured.employee, 380.5);
});
test('widths remain associated with stable IDs when columns are hidden or reordered', () => {
  const previous = { selection: 35, employee: 380, department: 200, score: 180 };
  const resizedVisible = resizeColumnSnapshot({ selection: 35, score: 180, employee: 380 }, 'employee', 450);
  const persisted = mergeColumnWidths(previous, resizedVisible);
  assert.deepEqual(['department', 'employee', 'score'].map(id => persisted[id]), [200, 450, 180]);
  assert.equal(persisted.selection, 35);
});
test('bounds clamp only the resized column and honor per-column overrides', () => {
  assert.equal(resizeColumnSnapshot({ title: 300 }, 'title', -200).title, 80);
  assert.equal(resizeColumnSnapshot({ title: 300 }, 'title', 5000).title, 1200);
  assert.equal(resizeColumnSnapshot({ title: 300 }, 'title', 20, { title: 160 }).title, 160);
  assert.equal(resizeColumnSnapshot({ title: 300 }, 'title', 500, {}, { title: 400 }).title, 400);
  assert.deepEqual(columnLimits('title', { title: 1600 }), { min: 1600, max: 1600 });
});
test('corrupt storage values cannot produce invalid table widths', () => {
  assert.deepEqual(cleanColumnWidths({ good: 35, nan: NaN, negative: -1, infinite: Infinity, text: '200', excessive: 10001 }), { good: 35 });
  for (const value of [null, [], 'not a map', 123]) assert.deepEqual(cleanColumnWidths(value), {});
});
test('storage round-trip preserves hidden IDs and reset removes the whole preference', () => {
  const original = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  try {
    writeColumnWidths('table', { employee: 400, hidden: 180, selection: 35 });
    assert.deepEqual(readColumnWidths('table'), { employee: 400, hidden: 180, selection: 35 });
    writeColumnWidths('table', {});
    assert.equal(values.has('table'), false);
    values.set('table', '{broken'); assert.deepEqual(readColumnWidths('table'), {});
    globalThis.localStorage = { getItem() { throw Error('Denied'); }, setItem() { throw Error('Denied'); }, removeItem() { throw Error('Denied'); } };
    assert.deepEqual(readColumnWidths('table'), {});
    assert.doesNotThrow(() => writeColumnWidths('table', { employee: 200 }));
    assert.doesNotThrow(() => writeColumnWidths('table', {}));
  } finally { if (original === undefined) delete globalThis.localStorage; else globalThis.localStorage = original; }
});
