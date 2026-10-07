export const SETTINGS_GROUPS = [
  { id: 'general', title: 'Общие', items: [
    { id: 'employees', label: 'Сотрудники', icon: 'users' },
    { id: 'integrations', label: 'Интеграции', icon: 'plug' },
    { id: 'notifications', label: 'Уведомления', icon: 'bell' },
  ] },
  { id: 'analyst', title: 'Аналитик', items: [
    { id: 'analyst-reports', label: 'Автогенерация отчётов', icon: 'report', children: [
      { id: 'analyst-reports-calls', label: 'Звонки', reportType: 'calls' },
      { id: 'analyst-reports-summary', label: 'Сводный', reportType: 'summary' },
      { id: 'analyst-reports-categories', label: 'Категории', reportType: 'categories' },
    ] },
    { id: 'stereo', label: 'Стереоформат звонков', icon: 'headphones' },
    { id: 'criteria', label: 'Шаблоны', icon: 'folder', children: [
      { id: 'documents', label: 'Документы' },
    ] },
  ] },
  { id: 'trainer', title: 'Тренер', items: [
    { id: 'trainer-reports', label: 'Автогенерация отчётов', icon: 'report', children: [
      { id: 'trainer-reports-training', label: 'Тренировки', reportType: 'training' },
      { id: 'trainer-reports-summary', label: 'Сводный', reportType: 'summary' },
    ] },
  ] },
];

export function resolveSettingsSection(id) {
  if (id === 'scoring') id = 'analyst-reports-calls';
  for (const group of SETTINGS_GROUPS) {
    for (const item of group.items) {
      if (item.children) {
        const child = item.children.find((entry) => entry.id === id);
        if (child) return { group, item: child, parent: item };
        if (item.id === id) return item.id === 'criteria' ? { group, item } : { group, item: item.children[0], parent: item };
      } else if (item.id === id) return { group, item };
    }
  }
  return { group: SETTINGS_GROUPS[0], item: SETTINGS_GROUPS[0].items[0] };
}

export function getReportPeriods(value, kind, reportType) {
  // Existing Analyst schedules described categories; preserve them only there.
  const legacyType = kind === 'analyst' ? 'categories' : 'training';
  const saved = value.types?.[reportType]?.periods ?? (reportType === legacyType ? value.periods : undefined);
  return { day: saved?.day ?? false, week: saved?.week ?? false, month: saved?.month ?? false };
}
