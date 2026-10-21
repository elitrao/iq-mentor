import { employeeRole } from './employee-roles.js';

export const EMPTY_EMPLOYEE_FILTERS = { source: '', template: '', role: '' };

export function filterEmployees(employees, { query = '', department = null, source = '', template = '', role = '' } = {}) {
  const search = query.trim().toLocaleLowerCase('ru');
  return employees.filter((employee) => (!department || employee.department === department)
    && employee.name.toLocaleLowerCase('ru').includes(search)
    && (!source || employee.source === source)
    && (!template || employee.template === template)
    && (!role || employeeRole(employee.role).id === role));
}
