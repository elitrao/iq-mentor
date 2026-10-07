const SYSTEM_CATEGORIES = [
  ['success', 'Вероятность успеха звонка', 'percent'],
  ['politeness', 'Вежливость', 'percent'],
  ['needs', 'Потребность', 'percent'],
  ['presentation', 'Качество презентации', 'percent'],
  ['facts', 'Факты разговора', 'text'],
  ['client-needs', 'Потребности клиента', 'text'],
];
const USER_CATEGORIES = [
  'КЦ. Представление и цель звонка', 'КЦ. Выход на ЛПР',
  'КЦ. Квалификация сотрудника', 'КЦ. Презентация',
  'КЦ. Отработка возражений', 'КЦ. Следующий шаг, передача МОП',
  'ОП Банкротство. Опросник', 'ОП Банкротство. Потребность и боль',
  'ОП Банкротство. Стоимость и скидка',
];
const SAMPLE_EMPLOYEES = [
  'Гладкова Оксана', 'Фролова Анастасия', 'Мальцев Дмитрий Викторович',
  'Гладкова Оксана Владимировна', 'Шоломов Александр Евгеньевич',
  'Бескровная Ирина', 'Лунев Сергей Евгеньевич', 'Лидген Лидген',
  'Робот Робот', 'Григораш Антон Александрович', 'Манькова Татьяна',
  'Власова Анастасия Алексеевна',
];
const SURNAMES = ['Иванов', 'Петров', 'Смирнов', 'Кузнецов', 'Соколов', 'Попов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соловьёв', 'Васильев', 'Зайцев', 'Павлов'];
const NAMES = ['Александр', 'Дмитрий', 'Сергей', 'Андрей', 'Алексей', 'Максим', 'Михаил', 'Николай'];

// Local prototype fixtures, not a customer directory or a production binding.
export const CRITERIA_EMPLOYEES = Array.from({ length: 121 }, (_, index) => ({
  id: `employee-${index + 1}`,
  name: SAMPLE_EMPLOYEES[index] || `${SURNAMES[Math.floor((index - SAMPLE_EMPLOYEES.length) / NAMES.length)]} ${NAMES[(index - SAMPLE_EMPLOYEES.length) % NAMES.length]}`,
}));

export function makeCriteriaTemplate(id, name, { userCategories = true, employeeCount = 0, enabledCount = 0 } = {}) {
  return {
    id, name,
    system: SYSTEM_CATEGORIES.map(([categoryId, label, type]) => ({ id: categoryId, name: label, type, description: '', enabled: true })),
    custom: userCategories ? USER_CATEGORIES.map((label, index) => ({ id: `${id}-custom-${index + 1}`, name: label, type: index === 0 ? 'binary' : 'percent', description: '', enabled: index < enabledCount })) : [],
    employees: CRITERIA_EMPLOYEES.slice(0, employeeCount).map((employee) => employee.id),
  };
}

export function createCriteriaTemplates(legacyCriteria) {
  const names = ['Стандартный шаблон оценки качества', 'ОРК Клиент принят', 'ОРК Имущество', 'HR (пригл на собес)', 'Партнёры Банкротство', 'ОРК IT Mentor', 'ОП Банкротство', 'IQ Mentor Онлайн', 'КЦ Mentor'];
  const counts = [121, 0, 6, 3, 2, 11, 7, 2, 1];
  const enabled = [0, 0, 4, 0, 1, 0, 5, 0, 3];
  const templates = names.map((name, index) => makeCriteriaTemplate(`template-${index + 1}`, name, { employeeCount: counts[index], enabledCount: enabled[index] }));
  if (Array.isArray(legacyCriteria)) {
    for (const criterion of legacyCriteria) {
      const existing = templates[0].system.find((item) => item.id === criterion.id);
      if (existing) Object.assign(existing, structuredClone(criterion));
      else templates[0].custom.push({ type: 'text', ...structuredClone(criterion) });
    }
  }
  return { selectedId: templates[0].id, templates };
}

export function updateCriteriaTemplate(model, id, change) {
  const next = structuredClone(model);
  const template = next.templates.find((item) => item.id === id);
  if (template) change(template);
  return next;
}

export function getCriteriaTemplateStats(template) {
  return { enabled: template.custom.filter((item) => item.enabled).length, total: template.custom.length, employees: new Set(template.employees).size };
}
