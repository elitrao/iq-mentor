export const DEMO_EMPLOYEES_KEY = 'iq-mentor-demo-employees-v1';

const NAMES = ['Анна Смирнова', 'Михаил Волков', 'Елена Кузнецова', 'Алексей Соколов', 'Мария Орлова', 'Иван Попов', 'Ольга Морозова', 'Дмитрий Новиков', 'София Лебедева', 'Артём Козлов', 'Полина Павлова', 'Никита Фёдоров', 'Алина Васильева', 'Максим Белов', 'Дарья Соколова', 'Андрей Зайцев', 'Виктория Романова', 'Сергей Михайлов', 'Ксения Алексеева', 'Павел Егоров'];

// Seed once against the user's existing department snapshot. Never refill after moves/deletions.
export function readOrSeedDemoEmployees(serialized, departments, existing) {
  if (serialized !== null) {
    try {
      const saved = JSON.parse(serialized);
      if (Array.isArray(saved)) return saved.filter((employee) => employee && typeof employee.id === 'string' && typeof employee.name === 'string' && typeof employee.department === 'string' && typeof employee.source === 'string' && typeof employee.template === 'string' && ['user', 'admin'].includes(employee.role));
    } catch { /* Recover invalid demo-only data with a fresh snapshot. */ }
  }
  let nameIndex = 0;
  return departments.flatMap((department, departmentIndex) => {
    const members = existing.filter((employee) => employee.department === department.id);
    return Array.from({ length: Math.max(0, 3 + departmentIndex % 3 - members.length) }, (_, index) => {
      const number = nameIndex++;
      return {
        id: `demo-${department.id}-${index + 1}`,
        name: NAMES[number % NAMES.length] + (number >= NAMES.length ? ` ${Math.floor(number / NAMES.length) + 1}` : ''),
        department: department.id,
        source: index % 2 ? 'Bitrix 24' : 'IQ Mentor',
        template: 'Стандартный шаблон оценки качества',
        role: index === 0 && !members.some((employee) => ['admin', 'Администратор'].includes(employee.role)) ? 'admin' : 'user',
      };
    });
  });
}
