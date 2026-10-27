import { formatCallDate, parseCallDuration } from './calls-report-model.js';
import { SUMMARY_ROWS } from './summary-report-model.js';

export const CATEGORY_REPORT_EMPLOYEES = SUMMARY_ROWS.slice(0, 5).map(row => row.name);
const categoryNames = [
  'Вежливость', 'Ответы на вопросы клиента', 'Стоимость и скидка', 'Выявление потребности', 'Качество презентации',
  'Работа с возражениями', 'Приветствие', 'Завершение разговора', 'Потребности клиента', 'Описание клиента',
  'Факты разговора', 'Проверка понимания', 'Следующий шаг', 'Активное слушание', 'Уточняющие вопросы',
  'Инициатива в разговоре', 'Польза предложения', 'Подведение итогов', 'Точность информации', 'Темп речи',
  'Структура разговора', 'Обращение по имени', 'Эмпатия', 'Согласование встречи', 'Договорённости',
  'Презентация решения', 'Сравнение вариантов', 'Причина обращения', 'Срок принятия решения', 'Обратная связь',
  'Соблюдение сценария', 'Рекомендации клиенту', 'Вероятность следующего контакта',
];
const scores = [100, 100, 86, 78, 74, 65, 93, 81, 70, 68, 85, 79, 72, 88, 90, 63, 82, 85, 91, 76, 89, 67, 92, 71, 84, 87, 69, 77, 80, 94, 73, 83, 75];

// Fictional report content: no production customer records are included.
export const CATEGORY_REPORT_ROWS = categoryNames.map((name, index) => {
  const count = index < 2 ? 1 : 2 + index % 4;
  const employees = Array.from({ length: count }, (_, n) => CATEGORY_REPORT_EMPLOYEES[(index + n) % CATEGORY_REPORT_EMPLOYEES.length]);
  const score = scores[index];
  return {
    id: `demo-category-${index + 1}`, name, employees, score,
    type: index % 7 === 6 ? 'boolean' : index % 5 === 4 ? 'text' : 'percentage',
    duration: 60 + index * 17,
    explanation: index < 2
      ? `По категории «${name}» все оценки максимальные — ${score}%. Сотрудники последовательно выполняют рекомендации и поддерживают понятную структуру диалога.`
      : `Средний результат по категории «${name}» — ${score}%. В большинстве разговоров сотрудники уверенно ведут диалог, уточняют детали и помогают клиенту определить следующий шаг.`,
  };
});

export const EMPTY_CATEGORY_FILTER = { categories: [], employees: [] };
export function categoryReportPeriod(from, to) {
  return from === to ? formatCallDate(from) : `${formatCallDate(from)}–${formatCallDate(to)}`;
}
export function filterCategoryRows(rows, filter = EMPTY_CATEGORY_FILTER, sort = null) {
  const result = rows.filter(row => (!filter.categories.length || filter.categories.includes(row.id)) &&
    (!filter.employees.length || row.employees.some(employee => filter.employees.includes(employee))));
  if (sort) result.sort((a, b) => (sort.key === 'score' ? a.score - b.score : a.name.localeCompare(b.name, 'ru')) * (sort.direction === 'asc' ? 1 : -1));
  return result;
}
export function validateCategoryGeneration(draft) {
  if (!!draft.from !== !!draft.to) return 'Укажите начало и конец периода.';
  if (draft.from && draft.from > draft.to) return 'Дата начала не может быть позже даты окончания.';
  const min = parseCallDuration(draft.min), max = parseCallDuration(draft.max);
  if (Number.isNaN(min) || Number.isNaN(max)) return 'Укажите длительность в формате ЧЧ:ММ:СС.';
  if (min !== null && max !== null && min > max) return 'Минимальная длительность не может быть больше максимальной.';
  return '';
}
export function generateCategoryRows(rows, draft) {
  const min = parseCallDuration(draft.min), max = parseCallDuration(draft.max);
  return filterCategoryRows(rows, draft).filter(row => (min === null || row.duration >= min) && (max === null || row.duration <= max))
    .map(row => ({ ...row, employees: draft.employees.length ? row.employees.filter(employee => draft.employees.includes(employee)) : [...row.employees] }));
}
export const INITIAL_CATEGORY_HISTORY = [
  { id: 'category-week', title: 'Отчет за период', from: '2026-10-19', to: '2026-10-26', created: '2026-10-26', mode: 'manual', creator: 'Самойленко Даниил', rows: CATEGORY_REPORT_ROWS },
  { id: 'category-today', title: 'Отчет за период', from: '2026-10-26', to: '2026-10-26', created: '2026-10-26', mode: 'manual', creator: 'Самойленко Даниил', rows: CATEGORY_REPORT_ROWS.slice(0, 18) },
  { id: 'category-oct24', title: 'Отчет за день', from: '2026-10-23', to: '2026-10-24', created: '2026-10-24', mode: 'auto', creator: 'Петрова Мария', rows: CATEGORY_REPORT_ROWS.slice(0, 23) },
  { id: 'category-oct23', title: 'Отчет за день', from: '2026-10-22', to: '2026-10-23', created: '2026-10-23', mode: 'auto', creator: 'Петрова Мария', rows: CATEGORY_REPORT_ROWS.slice(0, 16) },
  { id: 'category-oct19', title: 'Отчет за неделю', from: '2026-10-12', to: '2026-10-19', created: '2026-10-19', mode: 'auto', creator: 'Петрова Мария', rows: CATEGORY_REPORT_ROWS.slice(0, 28) },
];
export function categoryRowsCsv(rows) {
  const escape = value => { let text = String(value); if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  return '\uFEFF' + [['Категория оценки', 'Сотрудники', 'Средняя оценка', 'Пояснение оценки'], ...rows.map(row => [row.name, row.employees.join(', '), `${row.score}%`, row.explanation])]
    .map(row => row.map(escape).join(';')).join('\r\n');
}
