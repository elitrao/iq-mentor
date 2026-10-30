// Fictional fixture data for the local report prototype. No production records.
const names = ['Смирнова Анна Викторовна', 'Волков Михаил Сергеевич', 'Кузнецова Елена Павловна', 'Соколов Алексей Андреевич', 'Орлова Мария Александровна', 'Попов Иван Сергеевич', 'Морозова Ольга Николаевна', 'Лебедев Дмитрий Олегович', 'Новикова Ирина Игоревна', 'Петров Сергей Владимирович', 'Васильева Наталья Андреевна', 'Зайцев Андрей Петрович', 'Белова Светлана Олеговна', 'Соловьёв Павел Игоревич', 'Крылова Татьяна Сергеевна', 'Макаров Николай Андреевич', 'Фомина Юлия Павловна', 'Семенов Виктор Олегович', 'Виноградова Дарья Игоревна', 'Богданов Артём Сергеевич', 'Калинина Алина Петровна', 'Романов Максим Игоревич', 'Захарова Вера Андреевна', 'Киселёв Денис Олегович', 'Алексеева Полина Сергеевна'];
const scores = [61, 61, 57, 56, 48, 48, 46, 44, 43, 41, 40, 39, 38, 37, 35, 35, 28, 20, 18, 14, 13, 10, 8, 0, 0];
export const SUMMARY_ROWS = names.map((name, i) => {
  const calls = 8 + i * 3;
  // Fictional durations for exactly the calls included in this employee's demo report.
  const callDurationSeconds = Array.from({ length: calls }, (_, call) => 95 + (i * 37 + call * 53) % 480).reduce((sum, seconds) => sum + seconds, 0);
  return { id: `summary-employee-${i + 1}`, name, department: ['Отдел продаж', 'Клиентский сервис', '', 'Отдел продаж', 'Поддержка'][i % 5], score: scores[i], explanation: `Общая оценка работы менеджера. Средняя оценка менеджера составляет ${scores[i]}%. Сотрудник поддерживает доброжелательный тон и понятно отвечает на вопросы клиента. Результаты различаются от звонка к звонку. Чтобы повысить стабильность, стоит уточнять потребности, связывать предложение с задачей клиента и фиксировать следующий шаг.`, calls, callDurationSeconds };
});
const minutesFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
export function summaryCallMinutes(seconds) { return Number.isFinite(seconds) && seconds >= 0 ? minutesFormatter.format(seconds / 60) : '—'; }
export const SUMMARY_HISTORY = [
  { id: 'week-26', title: 'Отчет за неделю', from: '2026-10-19', to: '2026-10-26', date: 'Сегодня', type: 'А', author: 'Администратор', unread: true },
  { id: 'period-26', title: 'Отчет за период', from: '2026-10-26', to: '2026-10-26', date: 'Сегодня', type: 'Р', author: 'Демо-пользователь', unread: true },
  ...[24, 23, 22, 21, 20, 19].map(day => ({ id: `day-${day}`, title: 'Отчет за день', from: `2026-10-${day - 1}`, to: `2026-10-${day - 1}`, date: `${day} октября`, type: 'А', author: 'Администратор', unread: true })),
];
export const EMPTY_SUMMARY_FILTER = { departments: [], employees: [] };
export function summaryPeriod(from, to) { const display = value => value ? value.split('-').reverse().join('.') : ''; return from === to ? display(from) : `${display(from)}-${display(to)}`; }
export function filterSummaryRows(rows, filter, sort) {
  const found = rows.filter(row => (!filter.departments.length || filter.departments.includes(row.department || 'Без отдела')) && (!filter.employees.length || filter.employees.includes(row.id)));
  return !sort ? found : found.sort((a, b) => (['score', 'calls', 'callDurationSeconds'].includes(sort.key) ? a[sort.key] - b[sort.key] : a.name.localeCompare(b.name, 'ru')) * sort.direction);
}
export function validateSummaryGeneration(value) {
  if (!value.employees.length) return 'Выберите хотя бы одного сотрудника.';
  if (!value.from || !value.to) return 'Укажите период звонков.';
  if (value.from > value.to) return 'Дата начала должна быть раньше даты окончания.';
  const seconds = input => { if (!/^\d{2}:\d{2}:\d{2}$/.test(input)) return null; const [h, m, s] = input.split(':').map(Number); return m > 59 || s > 59 ? null : h * 3600 + m * 60 + s; };
  const min = seconds(value.min), max = seconds(value.max);
  if (min === null || max === null) return 'Укажите длительность в формате ЧЧ:ММ:СС.';
  if (max && min > max) return 'Минимальная длительность не должна превышать максимальную.';
  return '';
}
export function summaryCsv(rows) { const cell = value => `"${String(value).replaceAll('"', '""')}"`; return '\uFEFF' + [['Сотрудник', 'Отдел', 'Минуты в звонках', 'Звонков в отчёте', 'Оценка', 'Пояснение оценки'], ...rows.map(row => [row.name, row.department || 'Без отдела', summaryCallMinutes(row.callDurationSeconds), row.calls ?? '—', `${row.score}%`, row.explanation])].map(row => row.map(cell).join(';')).join('\r\n'); }
