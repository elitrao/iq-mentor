import test from 'node:test';
import assert from 'node:assert/strict';
import { SUMMARY_ROWS, filterSummaryRows, summaryCsv, summaryCallMinutes, validateSummaryGeneration } from '../src/summary-report-model.js';
test('department and employee filters are combined and sorting does not mutate fixtures', () => { const before = SUMMARY_ROWS.map(row => row.id); const result = filterSummaryRows(SUMMARY_ROWS, { departments: ['Отдел продаж'], employees: [SUMMARY_ROWS[0].id, SUMMARY_ROWS[1].id] }, { key: 'score', direction: -1 }); assert.deepEqual(result.map(row => row.id), [SUMMARY_ROWS[0].id]); assert.deepEqual(SUMMARY_ROWS.map(row => row.id), before); });
test('generation validates employees, dates, and duration boundaries', () => { const value = { employees: ['x'], from: '2026-10-01', to: '2026-10-26', min: '00:00:30', max: '00:05:00' }; assert.equal(validateSummaryGeneration(value), ''); for (const change of [{ employees: [] }, { to: '2026-09-30' }, { min: '00:75:00' }, { max: '00:00:10' }]) assert.notEqual(validateSummaryGeneration({ ...value, ...change }), ''); });
test('CSV preserves quoted names and semicolons in explanations', () => { const csv = summaryCsv([{ name: 'Анна "Тест"', department: 'Продажи', score: 61, explanation: 'Ответ; пояснение' }]); assert.match(csv, /"Анна ""Тест"""/); assert.match(csv, /"Ответ; пояснение"/); });

test('report minutes retain fractional minutes and distinguish zero from missing data in CSV', () => {
  assert.equal(summaryCallMinutes(90), '1,5');
  assert.equal(summaryCallMinutes(80), '1,3');
  assert.equal(summaryCallMinutes(0), '0');
  assert.equal(summaryCallMinutes(undefined), '—');
  assert.equal(summaryCallMinutes(-1), '—');
  const csv = summaryCsv([{ name: 'Тест', department: '', callDurationSeconds: 90, calls: 2, score: 61, explanation: '' }]);
  assert.match(csv, /"Минуты в звонках";"Звонков в отчёте"/);
  assert.match(csv, /"1,5";"2";"61%"/);
});

test('call totals sort numerically within the employee filter without mutating source rows', () => {
  const rows = [
    { id: 'first', name: 'А', department: 'Продажи', calls: 2, callDurationSeconds: 900 },
    { id: 'second', name: 'Б', department: 'Продажи', calls: 10, callDurationSeconds: 1200 },
    { id: 'excluded', name: 'В', department: 'Продажи', calls: 30, callDurationSeconds: 3000 },
  ];
  const filter = { departments: ['Продажи'], employees: ['first', 'second'] };
  assert.deepEqual(filterSummaryRows(rows, filter, { key: 'calls', direction: 1 }).map(row => row.id), ['first', 'second']);
  assert.deepEqual(filterSummaryRows(rows, filter, { key: 'callDurationSeconds', direction: -1 }).map(row => row.id), ['second', 'first']);
  assert.deepEqual(rows.map(row => row.id), ['first', 'second', 'excluded']);
});
