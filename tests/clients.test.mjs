import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_CLIENTS, EMPTY_CLIENT_FILTERS, filterClientRows, parseClientPeriod, validateClientFilters } from '../src/clients-model.js';

test('client filters combine the query, source, rating and date range', () => {
  const rows = [
    { id: 'a', name: 'Анна', source: 'Лид', rating: 75, activity: '2026-10-20', summaryDate: '', pipeline: '', calls: 2 },
    { id: 'b', name: 'Анна', source: 'Сделка', rating: 75, activity: '2026-10-20', summaryDate: '', pipeline: '', calls: 1 },
    { id: 'c', name: 'Анна', source: 'Лид', rating: null, activity: '2026-10-20', summaryDate: '', pipeline: '', calls: 3 },
    { id: 'd', name: 'Анна', source: 'Лид', rating: 80, activity: '2026-10-26', summaryDate: '', pipeline: '', calls: 5 },
  ];
  const filters = { ...EMPTY_CLIENT_FILTERS, source: 'Лид', min: 50, activity: '19.10.2026-21.10.2026' };
  assert.deepEqual(filterClientRows(rows, ' АННА ', filters, null).map(row => row.id), ['a']);
  assert.equal(filterClientRows(rows, '', EMPTY_CLIENT_FILTERS, null).length, 4);
});

test('date ranges reject nonexistent dates and reversed endpoints', () => {
  assert.deepEqual(parseClientPeriod('01.10.2026-26.10.2026'), ['2026-10-01', '2026-10-26']);
  assert.equal(parseClientPeriod('31.02.2026-03.03.2026'), false);
  assert.equal(parseClientPeriod('27.10.2026-26.10.2026'), false);
  assert.equal(parseClientPeriod(''), null);
  assert.ok(validateClientFilters({ ...EMPTY_CLIENT_FILTERS, summaryDate: '26.10.2026' }));
});

test('sorts numeric values numerically and keeps missing values last', () => {
  const rows = [{ id: 1, name: 'А', rating: 2 }, { id: 2, name: 'Б', rating: 10 }, { id: 3, name: 'В', rating: null }];
  assert.deepEqual(filterClientRows(rows, '', EMPTY_CLIENT_FILTERS, { id: 'rating', direction: 'asc' }).map(row => row.id), [1, 2, 3]);
  assert.deepEqual(filterClientRows(rows, '', EMPTY_CLIENT_FILTERS, { id: 'rating', direction: 'desc' }).map(row => row.id), [2, 1, 3]);
  assert.equal(new Set(DEMO_CLIENTS.map(row => row.name)).size, DEMO_CLIENTS.length);
});
