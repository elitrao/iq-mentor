export const EMPLOYEE_ROLES_KEY = 'iq-mentor-employee-roles';

// Shared presets for local prototype roles, not backend permissions.
export const EMPLOYEE_ROLES = [
  { id: 'user', label: 'Пользователь', icon: 'user', background: '#f5f5f3', color: '#73716b' },
  { id: 'admin', label: 'Администратор', icon: 'shield', background: '#eeedea', color: '#57554f' },
];

export function employeeRole(value) {
  return EMPLOYEE_ROLES.find((role) => role.id === value || role.label === value) || EMPLOYEE_ROLES[0];
}

export function readEmployeeRoles(serialized) {
  try {
    const value = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, role]) => EMPLOYEE_ROLES.some((item) => item.id === role)));
  } catch { return {}; }
}

export function changeEmployeeRole(roles, employeeId, roleId, employees) {
  if (!employees.some((employee) => employee.id === employeeId)) throw new Error('Сотрудник не найден.');
  if (!EMPLOYEE_ROLES.some((role) => role.id === roleId)) throw new Error('Выберите роль из списка.');
  return { ...roles, [employeeId]: roleId };
}
