import { DEPARTMENT_STORAGE_KEY } from './departments.js';
import { DEMO_EMPLOYEES_KEY } from './demo-employees.js';
import { EMPLOYEE_ASSIGNMENTS_KEY } from './employee-assignments.js';
import { EMPLOYEE_ROLES_KEY, readEmployeeRoles } from './employee-roles.js';

export const LOCAL_DIRECTORY_RESET_KEY = 'iq-mentor-local-directory-reset-2026-10-22';
export const LOCAL_DIRECTORY_BACKUP_KEY = `${LOCAL_DIRECTORY_RESET_KEY}-backup`;

// Apply the requested cleanup once in each browser using this local prototype.
// Future departments and unrelated settings must survive subsequent visits.
export function resetLocalEmployeeDirectory(storage, location) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.port !== '4170') return false;
  if (storage.getItem(LOCAL_DIRECTORY_RESET_KEY) === 'done') return false;

  const keys = [DEPARTMENT_STORAGE_KEY, DEMO_EMPLOYEES_KEY, EMPLOYEE_ASSIGNMENTS_KEY, EMPLOYEE_ROLES_KEY];
  const previous = Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]));
  if (storage.getItem(LOCAL_DIRECTORY_BACKUP_KEY) === null) {
    storage.setItem(LOCAL_DIRECTORY_BACKUP_KEY, JSON.stringify(previous));
  }
  const roles = readEmployeeRoles(previous[EMPLOYEE_ROLES_KEY]);
  storage.setItem(DEPARTMENT_STORAGE_KEY, '[]');
  storage.setItem(DEMO_EMPLOYEES_KEY, '[]');
  storage.setItem(EMPLOYEE_ASSIGNMENTS_KEY, JSON.stringify({ samoilenko: '' }));
  storage.setItem(EMPLOYEE_ROLES_KEY, JSON.stringify(roles.samoilenko ? { samoilenko: roles.samoilenko } : {}));
  storage.setItem(LOCAL_DIRECTORY_RESET_KEY, 'done');
  return true;
}
