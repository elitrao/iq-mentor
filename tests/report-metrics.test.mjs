import test from 'node:test';
import assert from 'node:assert/strict';
import { reportCallMetrics, reportDepartmentCalls, reportDurationParts, reportEmployeeCount, reportScoreDistribution, reportScoreMetrics } from '../src/report-metrics.js';
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

test('distribution preserves threshold boundaries and never counts missing scores as low scores', () => {
  const rows = [{ score: 0 }, { score: 59.9 }, { score: 60 }, { score: 79.9 }, { score: 80 }, { score: 100 }, {}, { score: null }, { score: -1 }, { score: 101 }];
  const result = reportScoreDistribution(rows);
  assert.deepEqual(result.map(group => group.count), [2, 2, 2, 4]);
  assert.equal(result.reduce((sum, group) => sum + group.count, 0), rows.length);
  assert.deepEqual(reportScoreDistribution([]).map(group => group.count), [0, 0, 0, 0]);
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
  assert.equal(summaryMetricScope({ employees: ['one'] }, 1), '1 сотрудник');
  assert.equal(summaryMetricScope({}, 7, true), '7 сотрудников');
  assert.equal(summaryMetricScope({ departments: ['Отдел продаж'], employees: ['one'] }, 1), 'Отдел продаж · 1 сотрудник');
  assert.deepEqual([0, 2, 11, 21, 22, 25].map(reportEmployeeCount), ['0 сотрудников', '2 сотрудника', '11 сотрудников', '21 сотрудник', '22 сотрудника', '25 сотрудников']);
});

test('department chart aggregates calls and retains the total when grouping smaller departments', () => {
  const rows = [{ department: 'A', calls: 3 }, { department: 'A', calls: 2 }, { calls: 1 }, { department: 'B', calls: 4 }, { department: 'C', calls: 6 }, { department: 'D', calls: 7 }];
  const groups = reportDepartmentCalls(rows);
  assert.deepEqual(groups, [{ name: 'D', calls: 7 }, { name: 'C', calls: 6 }, { name: 'A', calls: 5 }, { name: 'Остальные отделы', calls: 5 }]);
  assert.equal(groups.reduce((sum, row) => sum + row.calls, 0), reportCallMetrics(rows).calls);
  assert.deepEqual(reportDepartmentCalls([{ calls: null }, { calls: -1 }]), []);
  assert.deepEqual(reportDepartmentCalls([{ calls: 2 }]), [{ name: 'Без отдела', calls: 2 }]);
});

test('call duration is weighted by call count, not averaged between employees', () => {
  const rows = [{ id: '2', calls: 9, callDurationSeconds: 900 }, { id: '1', calls: 1, callDurationSeconds: 300 }];
  const metrics = reportCallMetrics(rows);
  assert.equal(metrics.calls, 10);
  assert.equal(metrics.totalSeconds, 1200);
  assert.equal(metrics.averageSeconds, 120);
  assert.deepEqual(metrics.employees.map(row => row.id), ['1', '2']);
  assert.deepEqual(reportCallMetrics([...rows].reverse()), metrics);
  assert.equal(reportCallMetrics(rows.slice(0, 1)).averageSeconds, 100);
});

test('missing durations do not dilute averages; zero calls and empty results stay finite', () => {
  const result = reportCallMetrics([
    { calls: 3 }, { calls: 2, callDurationSeconds: 0 }, { calls: 0, callDurationSeconds: 600 },
    { calls: -1, callDurationSeconds: 900 }, { calls: null, callDurationSeconds: 900 },
  ]);
  assert.equal(result.calls, 5);
  assert.equal(result.timedCalls, 2);
  assert.equal(result.averageSeconds, 0);
  assert.equal(reportCallMetrics([{ calls: 0, callDurationSeconds: 0 }]).averageSeconds, null);
  assert.equal(reportCallMetrics([]).calls, 0);
  assert.equal(reportCallMetrics([]).averageSeconds, null);
  assert.deepEqual(reportDurationParts(359.7), { minutes: 6, seconds: 0 });
  assert.equal(reportDurationParts(null), null);
});
