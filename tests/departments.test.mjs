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
import { readEmployeeAssignments, assignEmployees } from '../src/settings/employee-assignments.js';
import { employeeRole, readEmployeeRoles, changeEmployeeRole } from '../src/settings/employee-roles.js';
import { readOrSeedDemoEmployees } from '../src/settings/demo-employees.js';
import { filterEmployees, EMPTY_EMPLOYEE_FILTERS } from '../src/settings/employee-filters.js';
import { readEmployeeDisplay, DEFAULT_EMPLOYEE_DISPLAY } from '../src/settings/employee-display.js';

test('employee display preferences default on, preserve false and validate stored data', () => {
  for (const value of [null, 'bad', '[]', 'null']) assert.deepEqual(readEmployeeDisplay(value), DEFAULT_EMPLOYEE_DISPLAY);
  assert.deepEqual(readEmployeeDisplay('{"role":false,"source":false,"template":"false","other":true}'), { department: true, source: false, template: true, role: false });
  const hidden = { department: false, source: false, template: false, role: false };
  assert.deepEqual(readEmployeeDisplay(JSON.stringify(hidden)), hidden);
  const restored = readEmployeeDisplay(null);
  restored.role = false;
  assert.equal(DEFAULT_EMPLOYEE_DISPLAY.role, true);
});

test('employee filters intersect source, template, role, department and name without mutating data', () => {
  const employees = [
    { id: 'a', name: 'Анна Смирнова', department: 'sales', source: 'Bitrix 24', template: 'Основной', role: 'Администратор' },
    { id: 'b', name: 'Анна Орлова', department: 'sales', source: 'IQ Mentor', template: 'Другой', role: 'user' },
    { id: 'c', name: 'Иван Попов', department: 'support', source: 'Bitrix 24', template: 'Основной', role: 'admin' },
  ];
  assert.deepEqual(filterEmployees(employees, EMPTY_EMPLOYEE_FILTERS), employees);
  assert.deepEqual(filterEmployees(employees, { query: ' АННА ', department: 'sales', source: 'Bitrix 24', template: 'Основной', role: 'admin' }).map((employee) => employee.id), ['a']);
  assert.deepEqual(filterEmployees(employees, { role: 'user' }).map((employee) => employee.id), ['b']);
  assert.equal(filterEmployees(employees, { source: 'IQ Mentor', template: 'Основной' }).length, 0);
  assert.equal(filterEmployees(employees, { role: 'admin' }).length, 2);
  assert.equal(employees.length, 3);
});

test('role presets, persistence and validation preserve unrelated employees', () => {
  assert.equal(employeeRole('Администратор').id, 'admin');
  assert.equal(employeeRole(undefined).id, 'user');
  const original = { two: 'admin' };
  const changed = changeEmployeeRole(original, 'one', 'user', [{ id: 'one' }]);
  assert.deepEqual(changed, { two: 'admin', one: 'user' });
  assert.deepEqual(original, { two: 'admin' });
  assert.deepEqual(readEmployeeRoles(JSON.stringify(changed)), changed);
  assert.deepEqual(readEmployeeRoles('{"one":"owner","two":"admin"}'), { two: 'admin' });
  for (const value of ['bad', 'null', '[]']) assert.deepEqual(readEmployeeRoles(value), {});
  assert.throws(() => changeEmployeeRole(original, 'missing', 'user', []));
  assert.throws(() => changeEmployeeRole(original, 'one', 'owner', [{ id: 'one' }]));
});

test('demo population fills current departments to 3–5 without resetting existing members or later moves', () => {
  const departments = ['a', 'b', 'c'].map((id) => ({ id }));
  const existing = [{ id: 'original', department: 'a', role: 'Администратор' }];
  const demo = readOrSeedDemoEmployees(null, departments, existing);
  assert.deepEqual(departments.map(({ id }) => [...existing, ...demo].filter((employee) => employee.department === id).length), [3, 4, 5]);
  assert.equal(new Set(demo.map((employee) => employee.id)).size, demo.length);
  assert.ok(demo.some((employee) => employee.role === 'admin'));
  assert.ok(demo.some((employee) => employee.role === 'user'));
  assert.deepEqual(readOrSeedDemoEmployees(JSON.stringify(demo), [], []), demo);
  assert.deepEqual(readOrSeedDemoEmployees('[]', departments, existing), []);
  const moved = assignEmployees({}, [demo[0].id], 'b', demo, departments);
  assert.equal(moved[demo[0].id], 'b');
  assert.deepEqual(readOrSeedDemoEmployees(JSON.stringify(demo), departments, existing), demo);
});

test('employee moves persist independently, preserve other assignments, and validate destinations', () => {
  const employees = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  const departments = [{ id: 'sales' }, { id: 'support' }];
  const original = { one: 'sales', three: 'sales' };
  const moved = assignEmployees(original, ['one', 'two'], 'support', employees, departments);
  assert.deepEqual(readEmployeeAssignments(JSON.stringify(moved)), { one: 'support', two: 'support', three: 'sales' });
  assert.deepEqual(original, { one: 'sales', three: 'sales' });
  assert.equal(assignEmployees(moved, ['one'], '', employees, departments).one, '');
  assert.throws(() => assignEmployees(original, ['one'], 'missing', employees, departments));
  assert.throws(() => assignEmployees(original, [], 'sales', employees, departments));
  assert.throws(() => assignEmployees(original, ['unknown'], 'sales', employees, departments));
  assert.deepEqual(readEmployeeAssignments('invalid'), {});
  assert.deepEqual(readEmployeeAssignments('["sales"]'), {});
});
