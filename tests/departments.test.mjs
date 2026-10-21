import test from 'node:test';
import assert from 'node:assert/strict';
import { DEPARTMENT_COLORS, DEPARTMENT_ICONS, createDepartment, departmentColor, departmentIcon, updateDepartment, removeDepartment, readDepartments } from '../src/settings/departments.js';

test('department presets have eight distinct readable color combinations', () => {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  assert.equal(DEPARTMENT_COLORS.length, 8);
  assert.equal(new Set(DEPARTMENT_COLORS.map((color) => color.id)).size, 8);
  for (const palette of DEPARTMENT_COLORS) assert.ok((luminance(palette.background) + .05) / (luminance(palette.color) + .05) >= 4.5, palette.id);
});

test('department creation persists name and color without changing existing departments', () => {
  const original = readDepartments(null);
  const next = createDepartment(original, '  Продажи  ', 'purple', 'sales');
  assert.equal(original.length, 2);
  assert.deepEqual(next[2], { id: 'sales', name: 'Продажи', colorId: 'purple', iconId: 'none' });
  assert.deepEqual(readDepartments(JSON.stringify(next)), next);
  assert.throws(() => createDepartment(next, ' продажи ', 'blue', 'duplicate'), /уже существует/);
  assert.throws(() => createDepartment(next, '   ', 'blue', 'empty'), /Введите название/);
  assert.throws(() => createDepartment(next, 'а'.repeat(81), 'blue', 'long'), /80 символов/);
});

test('department icons and edits preserve stable identity and round-trip correctly', () => {
  assert.equal(new Set(DEPARTMENT_ICONS.map((icon) => icon.id)).size, DEPARTMENT_ICONS.length);
  const original = readDepartments(null);
  const next = createDepartment(original, 'Разработка', 'blue', 'dev', 'code');
  assert.equal(next[2].iconId, 'code');
  const edited = updateDepartment(next, '12312', 'Продажи', 'green', 'phone');
  assert.equal(edited[0].id, '12312');
  assert.equal(edited[0].name, 'Продажи');
  assert.equal(edited[0].iconId, 'phone');
  assert.equal(next[0].name, '12312');
  assert.deepEqual(readDepartments(JSON.stringify(edited)), edited);
  assert.throws(() => updateDepartment(edited, '12312', 'Разработка', 'gray', 'none'), /уже существует/);
  assert.equal(departmentIcon('invalid'), 'none');
  assert.equal(readDepartments(JSON.stringify([{ id: 'legacy', name: 'Старый отдел', colorId: 'pink' }]))[0].iconId, 'none');
});

test('deleted departments do not return on reload, including when all are removed', () => {
  const original = readDepartments(null);
  const removed = removeDepartment(original, '12312');
  assert.equal(original.length, 2);
  assert.deepEqual(readDepartments(JSON.stringify(removed)), removed);
  assert.deepEqual(readDepartments(JSON.stringify(removeDepartment(removed, '231'))), []);
});

test('department loading keeps defaults and safely handles legacy or invalid values', () => {
  assert.equal(readDepartments('broken').length, 2);
  const restored = readDepartments(JSON.stringify(['12312', '231', 'Поддержка', null, { id: 'test', name: 'Тест', colorId: 'invalid' }]));
  assert.equal(restored.length, 4);
  assert.equal(restored[3].colorId, 'gray');
  assert.equal(departmentColor('missing').id, 'gray');
});
