import test from 'node:test';
import assert from 'node:assert/strict';
import { reportScoreMetrics } from '../src/report-metrics.js';
import { filterCategoryRows } from '../src/category-report-model.js';
import { metricComparison, summaryMetricScope } from '../src/report-comparison-model.js';

test('score counts include zero and 80, while excluding 60 from below-target and 79.9 from high scores', () => {
  assert.deepEqual(reportScoreMetrics([{ score: 0 }, { score: 60 }, { score: 79.9 }, { score: 80 }, { score: 100 }]), {
    count: 5, average: 319.9 / 5, belowTarget: 1, highScore: 2,
  });
});

test('empty or invalid scores do not produce a misleading zero average', () => {
  assert.deepEqual(reportScoreMetrics([]), { count: 0, average: null, belowTarget: 0, highScore: 0 });
  assert.deepEqual(reportScoreMetrics([{}, { score: null }, { score: NaN }, { score: -1 }, { score: 101 }]), {
    count: 5, average: null, belowTarget: 0, highScore: 0,
  });
});

test('metrics cover all filtered rows and stay unchanged by sorting', () => {
  const rows = Array.from({ length: 33 }, (_, i) => ({ id: String(i), name: String(i), employees: [i % 2 ? 'Анна' : 'Борис'], score: i % 2 ? 80 : 40 }));
  const source = structuredClone(rows);
  assert.deepEqual(reportScoreMetrics(rows), { count: 33, average: 1960 / 33, belowTarget: 17, highScore: 16 });
  const filter = { categories: [], employees: ['Анна'] };
  const filtered = filterCategoryRows(rows, filter);
  assert.deepEqual(reportScoreMetrics(filtered), { count: 16, average: 80, belowTarget: 0, highScore: 16 });
  assert.deepEqual(reportScoreMetrics(filterCategoryRows(rows, filter, { key: 'score', direction: 'desc' })), reportScoreMetrics(filtered));
  assert.deepEqual(rows, source);
});

test('dashboard comparisons distinguish percentage points from relative percent and handle zero', () => {
  assert.deepEqual(metricComparison(80, 60), { delta: 20, percentage: 33.3 });
  assert.deepEqual(metricComparison(23, 25), { delta: -2, percentage: -8 });
  assert.deepEqual(metricComparison(3, 0), { delta: 3, percentage: null });
  assert.deepEqual(metricComparison(0, 0), { delta: 0, percentage: 0 });
  assert.equal(metricComparison(null, 10), null);
});

test('average caption identifies the department and employee scope', () => {
  assert.equal(summaryMetricScope({}, 25), 'Все сотрудники');
  assert.equal(summaryMetricScope({ departments: ['Отдел продаж'] }, 10), 'Отдел продаж');
  assert.equal(summaryMetricScope({ departments: ['Отдел продаж', 'Поддержка'] }, 15), 'Отделов: 2');
  assert.equal(summaryMetricScope({ employees: ['one'] }, 1), 'Выбрано: 1 сотр.');
  assert.equal(summaryMetricScope({}, 3, true), 'Выбрано: 3 сотр.');
  assert.equal(summaryMetricScope({ departments: ['Отдел продаж'], employees: ['one'] }, 1), 'Отдел продаж · 1 сотр.');
});
