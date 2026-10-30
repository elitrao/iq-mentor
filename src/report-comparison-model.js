import { SUMMARY_ROWS } from './summary-report-model.js';
import { CATEGORY_REPORT_ROWS } from './category-report-model.js';
import { reportEmployeeCount } from './report-metrics.js';

// Fictional previous-period snapshots for the dashboard prototype only.
// These are not production history and are identified as demo data in the UI help.
const employeeScores = [53, 64, 57, 49, 54, 42, 46, 39, 46, 35, 38, 44, 30, 37, 41, 29, 25, 26, 18, 12, 19, 8, 12];
const categoryScores = [94, 96, 82, 75, 70, 58, 91, 78, 64, 62, 83, 74, 68, 82, 88, 54, 76, 80, 87, 70, 82, 60, 88, 67, 78, 80, 63, 72, 74, 89];
export const PREVIOUS_SUMMARY_ROWS = SUMMARY_ROWS.slice(0, employeeScores.length).map((row, index) => ({ ...row, score: employeeScores[index] }));
export const PREVIOUS_CATEGORY_ROWS = CATEGORY_REPORT_ROWS.slice(0, categoryScores.length).map((row, index) => ({ ...row, score: categoryScores[index] }));

export function metricComparison(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  const percentage = previous === 0 ? current === 0 ? 0 : null : Math.round((current - previous) / previous * 1000) / 10;
  return { delta, percentage };
}

export function summaryMetricScope(filters, count, isSelectedReport = false) {
  const departments = filters.departments || [];
  const selected = Boolean(filters.employees?.length || isSelectedReport);
  const department = departments.length === 1 ? departments[0] : departments.length > 1 ? `Отделов: ${departments.length}` : '';
  if (department) return selected ? `${department} · ${reportEmployeeCount(count)}` : department;
  return selected ? reportEmployeeCount(count) : 'Все сотрудники';
}
