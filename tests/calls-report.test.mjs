import test from 'node:test';
import assert from 'node:assert/strict';
import { CALL_COLUMNS, DEMO_CALLS, EMPTY_CALL_FILTERS, callsToCsv, filterCallRows, formatCallDuration, parseCallDuration, validateCallFilters } from '../src/calls-report-model.js';

test('search combines with source, date and duration filters without mutating fixtures', () => {
  const fixtures = [
    { ...DEMO_CALLS[0], id: 'a', title: 'Анна', date: '2026-10-26', source: 'Bitrix 24', duration: 30 },
    { ...DEMO_CALLS[0], id: 'b', title: 'Анна', date: '2026-10-26', source: 'IQ Mentor', duration: 30 },
    { ...DEMO_CALLS[0], id: 'c', title: 'Анна', date: '2026-10-25', source: 'Bitrix 24', duration: 30 },
    { ...DEMO_CALLS[0], id: 'd', title: 'Анна', date: '2026-10-26', source: 'Bitrix 24', duration: 29 },
  ];
  const before = structuredClone(fixtures);
  const result = filterCallRows(fixtures, ' АННА ', { ...EMPTY_CALL_FILTERS, source: 'Bitrix 24', from: '2026-10-26', to: '2026-10-26', min: '00:00:30', max: '00:00:30' });
  assert.deepEqual(result.map(row => row.id), ['a']);
  assert.deepEqual(fixtures, before);
});
test('duration sorting is numeric and date sorting handles missing evaluations', () => {
  const rows = [{ ...DEMO_CALLS[0], duration: 90, evaluatedAt: '' }, { ...DEMO_CALLS[0], duration: 1000, evaluatedAt: '2026-10-26' }, { ...DEMO_CALLS[0], duration: 8, evaluatedAt: '2026-09-30' }];
  assert.deepEqual(filterCallRows(rows, '', EMPTY_CALL_FILTERS, { id: 'duration', direction: 'asc' }).map(row => row.duration), [8, 90, 1000]);
  assert.deepEqual(filterCallRows(rows, '', EMPTY_CALL_FILTERS, { id: 'evaluatedAt', direction: 'desc' }).map(row => row.evaluatedAt), ['2026-10-26', '2026-09-30', '']);
});
test('duration boundaries reject malformed or reversed filter ranges', () => {
  assert.equal(parseCallDuration('01:02:03'), 3723);
  assert.equal(formatCallDuration(3723), '01:02:03');
  assert.equal(parseCallDuration(''), null);
  for (const value of ['00:60:00', '-01:00:00', 'abc']) assert.ok(Number.isNaN(parseCallDuration(value)));
  assert.ok(validateCallFilters({ ...EMPTY_CALL_FILTERS, min: '01:00:00', max: '00:30:00' }));
  assert.ok(validateCallFilters({ ...EMPTY_CALL_FILTERS, from: '2026-10-26', to: '2026-10-25' }));
});
test('CSV exports exactly the visible basic fields and escapes spreadsheet formulas', () => {
  assert.equal(CALL_COLUMNS.length, 10);
  assert.deepEqual(CALL_COLUMNS.map(c => c.id), ['title', 'client', 'evaluatedAt', 'source', 'type', 'pipeline', 'department', 'date', 'duration', 'employee']);
  const csv = callsToCsv([{ ...DEMO_CALLS[0], title: '=1+1', client: 'ООО "Вектор"' }], CALL_COLUMNS.slice(0, 2));
  assert.equal(csv, '\uFEFF"Звонок";"Клиент"\r\n"\'=1+1";"ООО ""Вектор"""');
});
