export const CALL_COLUMNS = [
  { id: 'title', label: 'Звонок', width: 205 },
  { id: 'client', label: 'Клиент', width: 180, sort: true },
  { id: 'evaluatedAt', label: 'Дата оценки', width: 180, sort: true },
  { id: 'source', label: 'Источник', width: 160, sort: true },
  { id: 'type', label: 'Тип вызова', width: 140 },
  { id: 'pipeline', label: 'Воронка и этап', width: 307 },
  { id: 'department', label: 'Отдел', width: 180, sort: true },
  { id: 'date', label: 'Дата звонка', width: 180, sort: true },
  { id: 'duration', label: 'Длительность', width: 195, sort: true },
  { id: 'employee', label: 'Сотрудник', width: 240, sort: true },
];
// Demo fixtures are independent of production customer records.
const CLIENTS = ['Смирнова Анна Викторовна', 'Волков Михаил Сергеевич', 'Кузнецова Елена Петровна', 'Соколов Алексей Андреевич', 'ООО «Вектор»', 'Орлова Мария Александровна', 'Попов Иван Сергеевич', '', '', 'Морозова Ольга Николаевна', 'Зайцева Татьяна Павловна', 'ООО «Север»', 'Лебедев Дмитрий Олегович', 'Новикова Наталья Ивановна', 'Козлов Андрей Михайлович'];
const EMPLOYEES = ['Петрова Мария', 'Иванов Сергей', 'Сидорова Елена', 'Кузнецов Алексей', 'Самойленко Даниил'];
const STAGES = ['Судебное заседание', 'Контроль оплаты', 'НДЗ call-центр', 'Иск', 'Реализация', 'Fedresurs'];
export const DEMO_CALLS = Array.from({ length: 75 }, (_, index) => {
  const i = index % CLIENTS.length, offline = !CLIENTS[i];
  const date = `2026-10-${String(26 - Math.floor(index / 15)).padStart(2, '0')}`;
  const status = offline ? 'error' : [0, 1, 2, 6, 9, 12].includes(i) ? 'evaluated' : 'new';
  return { id: `demo-call-${index + 1}`, title: CLIENTS[i] || `Рекордер ${String(index + 1).padStart(8, '0')}-demo`, client: CLIENTS[i], evaluatedAt: status === 'evaluated' ? date : '', date,
    source: offline ? 'ОКК-Офлайн' : index % 13 === 12 ? 'IQ Mentor' : 'Bitrix 24', type: index % 13 === 12 ? 'Ручной' : 'Авто',
    pipeline: offline ? '' : i === 4 ? 'ОРК Mentor' : i > 9 ? 'Агенты' : 'Банкротство', stage: offline ? '' : STAGES[i % STAGES.length],
    department: offline ? '' : ['ОРК Банкротство', 'ОРП Банкротство', 'ОРК 2–3 IT Mentor'][i % 3],
    duration: [324, 93, 141, 6, 8, 5, 185, 63, 68, 254, 18, 34, 442, 187, 135][i], employee: EMPLOYEES[i % EMPLOYEES.length], status,
    template: i % 3 === 0 ? 'Стандартный шаблон оценки качества' : 'Продажи' };
});
export const EMPTY_CALL_FILTERS = { department: '', employee: '', from: '', to: '', template: '', source: '', pipeline: '', min: '', max: '' };
export function formatCallDate(value) { return value ? value.split('-').reverse().join('.') : '—'; }
export function formatCallDuration(value) { return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60].map(part => String(part).padStart(2, '0')).join(':'); }
export function parseCallDuration(value) {
  if (!value?.trim()) return null;
  if (!/^\d{1,3}:[0-5]\d:[0-5]\d$/.test(value)) return NaN;
  return value.split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
}
export function validateCallFilters(filters) {
  const min = parseCallDuration(filters.min), max = parseCallDuration(filters.max);
  if (Number.isNaN(min) || Number.isNaN(max)) return 'Укажите длительность в формате ЧЧ:ММ:СС.';
  if (min !== null && max !== null && min > max) return 'Минимальная длительность не может быть больше максимальной.';
  if (filters.from && filters.to && filters.from > filters.to) return 'Дата начала не может быть позже даты окончания.';
  return '';
}
export function filterCallRows(rows, query, filters, sort = null) {
  const text = query.trim().toLocaleLowerCase('ru'), min = parseCallDuration(filters.min), max = parseCallDuration(filters.max);
  const filtered = rows.filter(row => (!text || [row.title, row.client, row.employee, row.department, row.source].join(' ').toLocaleLowerCase('ru').includes(text)) &&
    ['department', 'employee', 'template', 'source', 'pipeline'].every(key => !filters[key] || row[key] === filters[key]) &&
    (!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to) && (min === null || row.duration >= min) && (max === null || row.duration <= max));
  if (sort) filtered.sort((a, b) => { const result = sort.id === 'duration' ? a.duration - b.duration : String(a[sort.id] || '').localeCompare(String(b[sort.id] || ''), 'ru', { numeric: true }); return sort.direction === 'asc' ? result : -result; });
  return filtered;
}
export function callCellText(row, id) {
  if (id === 'duration') return formatCallDuration(row.duration);
  if (id === 'date' || id === 'evaluatedAt') return formatCallDate(row[id]);
  if (id === 'pipeline') return [row.pipeline, row.stage].filter(Boolean).join(' · ') || '—';
  return row[id] || '—';
}
export function callsToCsv(rows, columns) {
  const escape = value => { let text = String(value); if (/^[\s]*[=+@-]/.test(text) && text !== '—') text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  return '\uFEFF' + [columns.map(column => column.label), ...rows.map(row => columns.map(column => callCellText(row, column.id)))].map(row => row.map(escape).join(';')).join('\r\n');
}
