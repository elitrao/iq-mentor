export const EMPLOYEE_DISPLAY_KEY = 'iq-mentor-employee-display';
export const EMPLOYEE_DISPLAY_FIELDS = [
  { id: 'department', label: 'Отдел' },
  { id: 'source', label: 'Источник' },
  { id: 'template', label: 'Шаблон' },
  { id: 'role', label: 'Роль' },
];
export const DEFAULT_EMPLOYEE_DISPLAY = Object.fromEntries(EMPLOYEE_DISPLAY_FIELDS.map(({ id }) => [id, true]));

export function readEmployeeDisplay(serialized) {
  try {
    const value = JSON.parse(serialized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_EMPLOYEE_DISPLAY };
    return Object.fromEntries(EMPLOYEE_DISPLAY_FIELDS.map(({ id }) => [id, typeof value[id] === 'boolean' ? value[id] : true]));
  } catch { return { ...DEFAULT_EMPLOYEE_DISPLAY }; }
}
