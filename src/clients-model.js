export const CLIENT_COLUMNS = [
  { id: 'name', label: 'Клиент', width: 260, fixed: true },
  { id: 'source', label: 'Источник', width: 140 },
  { id: 'rating', label: 'Рейтинг', width: 140, fixed: true },
  { id: 'calls', label: 'Звонки', width: 110 },
  { id: 'activity', label: 'Активность', width: 190 },
  { id: 'pipeline', label: 'Воронка и этап', width: 240 },
  { id: 'summaryDate', label: 'Дата итога', width: 190 },
];
export const EMPTY_CLIENT_FILTERS = { source: '', min: 0, max: 100, activity: '', summaryDate: '', pipeline: '' };
const NAMES = ['Смирнова Анна Викторовна', 'Волков Михаил Сергеевич', 'Кузнецова Елена Петровна', 'Соколов Алексей Андреевич', 'ООО «Вектор»', 'Орлова Мария Александровна', 'Попов Иван Сергеевич', 'Морозова Ольга Николаевна', 'Зайцева Татьяна Павловна', 'ООО «Север»', 'Лебедев Дмитрий Олегович', 'Новикова Наталья Ивановна', 'Козлов Андрей Михайлович', 'Васильев Павел Игоревич', 'Федорова Светлана Андреевна'];
const SURNAMES = ['Белов', 'Тихонов', 'Романов', 'Савельев', 'Никитин', 'Егоров', 'Крылов', 'Фомин', 'Грачёв', 'Мельников'];
const GIVEN = ['Александр Павлович', 'Денис Сергеевич', 'Роман Андреевич', 'Максим Олегович', 'Николай Игоревич', 'Виктор Алексеевич'];
const EMPLOYEES = ['Петрова Мария', 'Иванов Сергей', 'Сидорова Елена', 'Кузнецов Алексей'];
// Fictional records only; no customer data or CRM identifiers are copied from the source.
export const DEMO_CLIENTS = Array.from({ length: 75 }, (_, index) => {
  const i = index % 15;
  const name = NAMES[index] || `${SURNAMES[Math.floor((index - 15) / GIVEN.length)]} ${GIVEN[(index - 15) % GIVEN.length]}`;
  const activity = [0, 1, 4, 7, 9, 11].includes(i) ? '' : `2026-10-${String(26 - Math.floor(index / 15)).padStart(2, '0')}`;
  const rating = [2, 3, 6, 10, 13].includes(i) ? (index < 15 ? 0 : [25, 50, 75, 100][index % 4]) : null;
  const source = i === 9 || i === 12 ? 'Лид' : 'Сделка';
  const pipeline = source === 'Лид' ? '' : i === 4 || i === 9 ? 'ОРК Mentor' : i === 5 || i === 8 ? 'Банкротство' : 'Агенты';
  return { id: `demo-client-${index + 1}`, name, source, rating, categories: i === 10 ? 4 : 1, calls: [2, 2, 1, 1, 2, 1, 1, 3, 1, 1, 1, 2, 2, 1, 3][i], activity, summaryDate: activity,
    pipeline, stage: source === 'Лид' ? 'Новый лид' : pipeline === 'Банкротство' ? 'Реализация' : pipeline === 'ОРК Mentor' ? 'База' : 'В работе', employee: EMPLOYEES[i % 4], date: activity || '2026-10-26' };
});
export function clientDate(value) { return value ? value.split('-').reverse().join('.') : '—'; }
export function parseClientPeriod(value) {
  if (!value.trim()) return null;
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s*[-–—]\s*(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return false;
  const dates = [[match[3], match[2], match[1]], [match[6], match[5], match[4]]].map(parts => parts.join('-'));
  if (dates.some(date => { const parsed = new Date(`${date}T12:00:00Z`); return Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== date; })) return false;
  return dates[0] <= dates[1] ? dates : false;
}
export function validateClientFilters(filters) {
  if (Number(filters.min) < 0 || Number(filters.max) > 100 || Number(filters.min) > Number(filters.max)) return 'Укажите диапазон рейтинга от 0 до 100.';
  if (parseClientPeriod(filters.activity) === false || parseClientPeriod(filters.summaryDate) === false) return 'Укажите период в формате ДД.ММ.ГГГГ-ДД.ММ.ГГГГ: дата начала должна быть раньше даты окончания.';
  return '';
}
export function filterClientRows(rows, query, filters, sort) {
  const search = query.trim().toLocaleLowerCase('ru');
  const periods = ['activity', 'summaryDate'].map(key => [key, parseClientPeriod(filters[key])]);
  const filtered = rows.filter(row => {
    if (search && ![row.name, row.source, row.pipeline, row.stage].join(' ').toLocaleLowerCase('ru').includes(search)) return false;
    if (filters.source && filters.source !== row.source || filters.pipeline && filters.pipeline !== row.pipeline) return false;
    if ((filters.min !== 0 || filters.max !== 100) && (row.rating === null || row.rating < filters.min || row.rating > filters.max)) return false;
    return periods.every(([key, period]) => !period || !!row[key] && row[key] >= period[0] && row[key] <= period[1]);
  });
  if (sort) filtered.sort((a, b) => {
    const av = a[sort.id], bv = b[sort.id];
    // Missing values stay at the end for either direction.
    if (av === null || av === '') return bv === null || bv === '' ? 0 : 1;
    if (bv === null || bv === '') return -1;
    const result = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ru');
    return sort.direction === 'asc' ? result : -result;
  });
  return filtered;
}
