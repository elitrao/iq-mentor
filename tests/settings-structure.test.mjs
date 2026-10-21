import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_GROUPS, resolveSettingsSection, getReportPeriods, setReportPeriod } from '../src/settings/schema.js';

test('settings groups and report hierarchy match the supplied structure', () => {
  assert.deepEqual(SETTINGS_GROUPS.map((group) => group.title), ['Общие', 'Аналитик', 'Тренер']);
  assert.deepEqual(SETTINGS_GROUPS[0].items.map((item) => item.id), ['employees', 'integrations', 'notifications']);
  assert.equal(SETTINGS_GROUPS[0].items[2].label, 'Уведомления');
  assert.equal(SETTINGS_GROUPS[1].items[0].label, 'Автогенерация отчётов');
  assert.equal(SETTINGS_GROUPS[2].items[0].label, 'Автогенерация отчётов');
  assert.deepEqual(SETTINGS_GROUPS[1].items.map((item) => item.id), ['analyst-reports', 'call-assessment']);
  assert.deepEqual(SETTINGS_GROUPS[1].items[0].children.map((item) => item.label), ['Сводный отчёт', 'Отчёт по категориям']);
  assert.deepEqual(SETTINGS_GROUPS[1].items[1].children.map((item) => item.id), ['stereo', 'analyst-reports-calls']);
  assert.equal(resolveSettingsSection('stereo').parent.id, 'call-assessment');
  assert.equal(resolveSettingsSection('analyst-reports-calls').parent.id, 'call-assessment');
  assert.deepEqual(SETTINGS_GROUPS[2].items[0].children.map((item) => item.label), ['Отчёт по тренировкам', 'Сводный отчёт']);
});

test('primary sections have semantic icons; nested rows share a marker and have unique ids', () => {
  const items = SETTINGS_GROUPS.flatMap((group) => group.items.flatMap((item) => [item, ...(item.children || [])]));
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.ok(SETTINGS_GROUPS.every((group) => group.items.every((item) => item.icon)));
  assert.ok(SETTINGS_GROUPS.flatMap((group) => group.items.flatMap((item) => item.children || [])).every((item) => !item.icon));
});

test('legacy unknown section resolves to employees; report parents resolve to overview sections', () => {
  assert.equal(resolveSettingsSection('personal').item.id, 'employees');
  assert.equal(resolveSettingsSection('analyst-reports').item.id, 'analyst-reports');
  assert.equal(resolveSettingsSection('analyst-reports').item.reportType, undefined);
  assert.equal(resolveSettingsSection('trainer-reports').item.id, 'trainer-reports');
  assert.equal(resolveSettingsSection('trainer-reports-summary').group.id, 'trainer');
  assert.equal(resolveSettingsSection('documents').item.id, 'employees');
  assert.equal(resolveSettingsSection('criteria').item.id, 'employees');
  assert.equal(resolveSettingsSection('scoring').item.id, 'analyst-reports-calls');
});

test('report types have independent schedules and preserve legacy schedules without spreading them', () => {
  const analyst = { periods: { day: true }, types: { calls: { periods: { week: true } } } };
  assert.deepEqual(getReportPeriods(analyst, 'analyst', 'calls'), { day: false, week: true, month: false });
  assert.deepEqual(getReportPeriods(analyst, 'analyst', 'categories'), { day: true, week: false, month: false });
  assert.deepEqual(getReportPeriods(analyst, 'analyst', 'summary'), { day: false, week: false, month: false });
  assert.deepEqual(getReportPeriods({ periods: { month: true } }, 'trainer', 'training'), { day: false, week: false, month: true });
  assert.deepEqual(getReportPeriods({ periods: { month: true } }, 'trainer', 'summary'), { day: false, week: false, month: false });
});

test('report period autosave changes only its report and persists without a submit', () => {
  const original = { periods: { week: true }, types: { calls: { periods: { month: true }, custom: 'keep' }, summary: { periods: { day: true } } } };
  const changed = setReportPeriod(original, 'analyst', 'calls', 'day', true);
  assert.deepEqual(getReportPeriods(JSON.parse(JSON.stringify(changed)), 'analyst', 'calls'), { day: true, week: false, month: true });
  assert.equal(changed.types.calls.enabled, true);
  assert.equal(changed.types.calls.custom, 'keep');
  assert.equal(original.types.calls.periods.day, undefined);
  assert.deepEqual(changed.types.summary, original.types.summary);
  assert.deepEqual(changed.periods, original.periods);
  const disabled = setReportPeriod(setReportPeriod(changed, 'analyst', 'calls', 'day', false), 'analyst', 'calls', 'month', false);
  assert.equal(disabled.types.calls.enabled, false);
  const migrated = setReportPeriod(original, 'analyst', 'categories', 'month', true);
  assert.deepEqual(getReportPeriods(migrated, 'analyst', 'categories'), { day: false, week: true, month: true });
});
