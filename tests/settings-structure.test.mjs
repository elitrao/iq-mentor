import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_GROUPS, resolveSettingsSection, getReportPeriods } from '../src/settings/schema.js';

test('settings groups and report hierarchy match the supplied structure', () => {
  assert.deepEqual(SETTINGS_GROUPS.map((group) => group.title), ['Общие', 'Аналитик', 'Тренер']);
  assert.deepEqual(SETTINGS_GROUPS[0].items.map((item) => item.id), ['employees', 'integrations', 'notifications']);
  assert.equal(SETTINGS_GROUPS[0].items[2].label, 'Уведомления');
  assert.equal(SETTINGS_GROUPS[1].items[0].label, 'Автогенерация отчётов');
  assert.deepEqual(SETTINGS_GROUPS[1].items.map((item) => item.id), ['analyst-reports', 'stereo', 'criteria']);
  assert.equal(SETTINGS_GROUPS[1].items[2].label, 'Шаблоны');
  assert.equal(SETTINGS_GROUPS[1].items[2].icon, 'folder');
  assert.equal(SETTINGS_GROUPS[1].items[2].children[0].label, 'Документы');
  assert.deepEqual(SETTINGS_GROUPS[1].items[0].children.map((item) => item.label), ['Звонки', 'Сводный', 'Категории']);
  assert.deepEqual(SETTINGS_GROUPS[2].items[0].children.map((item) => item.label), ['Тренировки', 'Сводный']);
});

test('primary sections have semantic icons; nested rows share a marker and have unique ids', () => {
  const items = SETTINGS_GROUPS.flatMap((group) => group.items.flatMap((item) => [item, ...(item.children || [])]));
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.ok(SETTINGS_GROUPS.every((group) => group.items.every((item) => item.icon)));
  assert.ok(SETTINGS_GROUPS.flatMap((group) => group.items.flatMap((item) => item.children || [])).every((item) => !item.icon));
});

test('legacy unknown section resolves to employees; parents resolve to their first report', () => {
  assert.equal(resolveSettingsSection('personal').item.id, 'employees');
  assert.equal(resolveSettingsSection('analyst-reports').item.reportType, 'calls');
  assert.equal(resolveSettingsSection('trainer-reports').item.reportType, 'training');
  assert.equal(resolveSettingsSection('trainer-reports-summary').group.id, 'trainer');
  assert.equal(resolveSettingsSection('documents').group.id, 'analyst');
  assert.equal(resolveSettingsSection('documents').parent.id, 'criteria');
  assert.equal(resolveSettingsSection('criteria').item.id, 'criteria');
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
