import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_REPORT_ROWS, CATEGORY_REPORT_EMPLOYEES, filterCategoryRows, generateCategoryRows, validateCategoryGeneration, categoryRowsCsv, categoryReportPeriod } from '../src/category-report-model.js';

test('category and employee filters intersect, sorting does not reorder source', () => {
  const source = Object.freeze([
    { id: 'a', name: 'А', employees: ['Анна'], score: 70 },
    { id: 'b', name: 'Б', employees: ['Борис'], score: 90 },
    { id: 'c', name: 'В', employees: ['Анна', 'Борис'], score: 80 },
  ]);
  assert.deepEqual(filterCategoryRows(source, { categories: ['a', 'c'], employees: ['Борис'] }).map(row => row.id), ['c']);
  assert.deepEqual(filterCategoryRows(source, { categories: [], employees: [] }, { key: 'score', direction: 'desc' }).map(row => row.id), ['b', 'c', 'a']);
  assert.deepEqual(source.map(row => row.id), ['a', 'b', 'c']);
});

test('generation validates partial dates, reverse ranges and malformed duration', () => {
  const draft = { categories: [], employees: [], from: '', to: '', min: '', max: '' };
  assert.equal(validateCategoryGeneration(draft), '');
  assert.ok(validateCategoryGeneration({ ...draft, from: '2026-10-26' }));
  assert.ok(validateCategoryGeneration({ ...draft, from: '2026-10-26', to: '2026-10-19' }));
  assert.ok(validateCategoryGeneration({ ...draft, min: '00:70:00' }));
  assert.ok(validateCategoryGeneration({ ...draft, min: '00:02:00', max: '00:01:00' }));
  assert.equal(validateCategoryGeneration({ ...draft, from: '2026-10-19', to: '2026-10-26', min: '00:01:00', max: '00:01:00' }), '');
});

test('generation limits duration inclusively and selected employees without changing original records', () => {
  const source = [{ id: 'a', name: 'А', employees: ['Анна', 'Борис'], score: 75, duration: 60 }, { id: 'b', name: 'Б', employees: ['Борис'], score: 80, duration: 61 }];
  const result = generateCategoryRows(source, { categories: [], employees: ['Борис'], min: '00:01:00', max: '00:01:00' });
  assert.deepEqual(result.map(row => row.id), ['a']);
  assert.deepEqual(result[0].employees, ['Борис']);
  assert.deepEqual(source[0].employees, ['Анна', 'Борис']);
});

test('report period and CSV preserve Russian text and protect spreadsheet formulas', () => {
  assert.equal(categoryReportPeriod('2026-10-26', '2026-10-26'), '26.10.2026');
  assert.equal(categoryReportPeriod('2026-10-19', '2026-10-26'), '19.10.2026–26.10.2026');
  const csv = categoryRowsCsv([{ name: '=1+1', employees: ['Анна'], score: 80, explanation: 'Текст "цитаты"; продолжение' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"Текст ""цитаты""; продолжение"'));
});

test('demo categories have unique identities and employees from the shared summary directory', () => {
  assert.equal(CATEGORY_REPORT_ROWS.length, 33);
  assert.equal(new Set(CATEGORY_REPORT_ROWS.map(row => row.id)).size, 33);
  assert.ok(CATEGORY_REPORT_ROWS.every(row => row.employees.length && row.employees.every(employee => CATEGORY_REPORT_EMPLOYEES.includes(employee))));
});
