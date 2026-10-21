export const EMPLOYEE_ASSIGNMENTS_KEY = 'iq-mentor-employee-departments';

export function readEmployeeAssignments(serialized) {
  try {
    const value = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, department]) => typeof department === 'string'));
  } catch { return {}; }
}

export function assignEmployees(assignments, selectedIds, destination, employees, departments) {
  if (destination !== '' && !departments.some((department) => department.id === destination)) throw new Error('Выберите существующий отдел.');
  const ids = [...new Set(selectedIds)].filter((id) => employees.some((employee) => employee.id === id));
  if (!ids.length) throw new Error('Выберите сотрудников для перемещения.');
  return { ...assignments, ...Object.fromEntries(ids.map((id) => [id, destination])) };
}
