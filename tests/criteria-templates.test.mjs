import test from 'node:test';
import assert from 'node:assert/strict';
import { CRITERIA_EMPLOYEES, createCriteriaTemplates, makeCriteriaTemplate, updateCriteriaTemplate, getCriteriaTemplateStats } from '../src/settings/criteria-templates.js';

test('reference template fixtures have independent categories and matching employee counts', () => {
  const state = createCriteriaTemplates();
  assert.equal(state.templates.length, 9);
  assert.equal(state.templates[0].system.length, 6);
  assert.equal(state.templates[0].custom.length, 9);
  assert.equal(getCriteriaTemplateStats(state.templates[0]).employees, 121);
  assert.equal(new Set(CRITERIA_EMPLOYEES.map((employee) => employee.id)).size, 121);
  assert.ok(CRITERIA_EMPLOYEES.every((employee) => employee.name && !employee.name.includes('undefined')));
});
test('editing a selected template never mutates the source or another template', () => {
  const state = createCriteriaTemplates();
  const next = updateCriteriaTemplate(state, state.selectedId, (template) => { template.custom[0].enabled = true; });
  assert.equal(state.templates[0].custom[0].enabled, false);
  assert.equal(next.templates[0].custom[0].enabled, true);
  assert.deepEqual(next.templates[1], state.templates[1]);
  assert.equal(getCriteriaTemplateStats(next.templates[0]).enabled, 1);
});
test('legacy criterion names, descriptions, enabled values and custom entries are preserved', () => {
  const legacy = [{ id: 'politeness', name: 'Моя вежливость', description: 'Правило', enabled: false }, { id: 'legacy-custom', name: 'Мой критерий', description: '', enabled: true }];
  const state = createCriteriaTemplates(legacy);
  assert.deepEqual(state.templates[0].system.find((item) => item.id === 'politeness'), { type: 'percent', ...legacy[0] });
  assert.ok(state.templates[0].custom.some((item) => item.id === 'legacy-custom'));
  assert.equal(state.templates[1].system.find((item) => item.id === 'politeness').enabled, true);
});
test('new templates have system categories, no custom categories and no assigned employees', () => {
  const template = makeCriteriaTemplate('new', 'Новый', { userCategories: false });
  assert.equal(template.system.length, 6);
  assert.deepEqual(template.custom, []);
  assert.deepEqual(template.employees, []);
});
