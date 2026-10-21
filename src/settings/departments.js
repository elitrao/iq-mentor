export const DEPARTMENT_STORAGE_KEY = 'iq-mentor-departments';

export const DEPARTMENT_ICONS = [
  { id: 'none', label: 'Без иконки' }, { id: 'folder', label: 'Папка' },
  { id: 'users', label: 'Команда' }, { id: 'briefcase', label: 'Портфель' },
  { id: 'phone', label: 'Телефон' }, { id: 'headset', label: 'Поддержка' },
  { id: 'chart', label: 'Аналитика' }, { id: 'code', label: 'Разработка' },
  { id: 'palette', label: 'Дизайн' }, { id: 'megaphone', label: 'Маркетинг' },
  { id: 'coin', label: 'Финансы' }, { id: 'rocket', label: 'Ракета' },
];

export function departmentIcon(id) {
  return DEPARTMENT_ICONS.some((icon) => icon.id === id) ? id : 'none';
}

export const DEPARTMENT_COLORS = [
  { id: 'gray', label: 'Серый', background: '#F1F1EF', color: '#575751' },
  { id: 'peach', label: 'Персиковый', background: '#FFF0E2', color: '#A54D15' },
  { id: 'yellow', label: 'Жёлтый', background: '#FFF5CC', color: '#806211' },
  { id: 'green', label: 'Зелёный', background: '#E8F4E7', color: '#386438' },
  { id: 'teal', label: 'Бирюзовый', background: '#E2F4F0', color: '#286B60' },
  { id: 'blue', label: 'Голубой', background: '#E8F0FF', color: '#365FA2' },
  { id: 'purple', label: 'Сиреневый', background: '#F0EAFC', color: '#7051A3' },
  { id: 'pink', label: 'Розовый', background: '#FCE8EF', color: '#A14C6C' },
];

export function departmentColor(id) {
  return DEPARTMENT_COLORS.find((color) => color.id === id) || DEPARTMENT_COLORS[0];
}

export function readDepartments(serialized) {
  const fallback = [{ id: '12312', name: '12312', colorId: 'gray', iconId: 'none' }, { id: '231', name: '231', colorId: 'gray', iconId: 'none' }];
  try {
    const values = JSON.parse(serialized);
    if (!Array.isArray(values)) return fallback;
    const result = [];
    for (const item of values) {
      const value = typeof item === 'string' ? { id: item, name: item } : item;
      if (!value || typeof value.name !== 'string' || !value.name.trim() || typeof value.id !== 'string') continue;
      const entry = { id: value.id, name: value.name.trim(), colorId: departmentColor(value.colorId).id, iconId: departmentIcon(value.iconId) };
      const index = result.findIndex((existing) => existing.id === entry.id);
      if (index >= 0) result[index] = entry;
      else if (!result.some((existing) => existing.name.toLocaleLowerCase('ru') === entry.name.toLocaleLowerCase('ru'))) result.push(entry);
    }
    return result;
  } catch { return fallback; }
}

export function createDepartment(departments, name, colorId, id, iconId = 'none') {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Введите название отдела');
  if (trimmed.length > 80) throw new Error('Название должно быть не длиннее 80 символов');
  if (departments.some((item) => item.name.toLocaleLowerCase('ru') === trimmed.toLocaleLowerCase('ru'))) throw new Error('Отдел с таким названием уже существует');
  return [...departments, { id, name: trimmed, colorId: departmentColor(colorId).id, iconId: departmentIcon(iconId) }];
}

export function updateDepartment(departments, id, name, colorId, iconId) {
  if (!departments.some((item) => item.id === id)) throw new Error('Отдел не найден');
  const updated = createDepartment(departments.filter((item) => item.id !== id), name, colorId, id, iconId).at(-1);
  return departments.map((item) => item.id === id ? updated : item);
}

export function removeDepartment(departments, id) {
  return departments.filter((item) => item.id !== id);
}
