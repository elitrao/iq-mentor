export const SETTINGS_GROUPS = [
  { id: 'general', title: 'Общие', items: [
    { id: 'employees', label: 'Сотрудники', icon: 'users' },
    { id: 'integrations', label: 'Интеграции', icon: 'plug' },
  ] },
  { id: 'analyst', title: 'Аналитик', items: [
    { id: 'analyst-notifications', label: 'Уведомления', icon: 'bell' },
    { id: 'analyst-reports', label: 'Автогенерация отчётов', icon: 'report', children: [
      { id: 'analyst-reports-summary', label: 'Сводный отчёт', reportType: 'summary' },
      { id: 'analyst-reports-categories', label: 'Отчёт по категориям', reportType: 'categories' },
    ] },
    { id: 'call-assessment', label: 'Оценка звонков', icon: 'headphones', children: [
      { id: 'stereo', label: 'Стереоформат звонков' },
      { id: 'analyst-reports-calls', label: 'Автоматический отчёт по звонкам', reportType: 'calls' },
    ] },
  ] },
  { id: 'trainer', title: 'Тренер', items: [
    { id: 'trainer-notifications', label: 'Уведомления', icon: 'bell' },
    { id: 'trainer-reports', label: 'Автогенерация отчётов', icon: 'report', children: [
      { id: 'trainer-reports-summary', label: 'Сводный отчёт', reportType: 'summary' },
    ] },
  ] },
];

// A flat navigation alternative; report types keep their existing section IDs.
export const SETTINGS_PILL_SECTIONS = SETTINGS_GROUPS.flatMap((group) => group.items.map((item) => ({
  id: item.id,
  icon: item.icon,
  group: group.id,
  label: item.id === 'analyst-reports' ? 'Отчёты · Аналитик'
    : item.id === 'trainer-reports' ? 'Отчёты · Тренер'
    : item.id === 'analyst-notifications' ? 'Уведомления · Аналитик'
    : item.id === 'trainer-notifications' ? 'Уведомления · Тренер' : item.label,
})));

export function resolveSettingsSection(id) {
  if (id === 'notifications') id = 'analyst-notifications';
  if (id === 'scoring') id = 'analyst-reports-calls';
  if (id === 'trainer-reports-training') id = 'trainer-reports';
  for (const group of SETTINGS_GROUPS) {
    for (const item of group.items) {
      if (item.children) {
        const child = item.children.find((entry) => entry.id === id);
        if (child) return { group, item: child, parent: item };
        if (item.id === id) return { group, item };
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

export function setReportPeriod(value, kind, reportType, period, enabled) {
  const periods = { ...getReportPeriods(value, kind, reportType), [period]: enabled };
  return { ...value, types: { ...value.types, [reportType]: {
    ...value.types?.[reportType], periods, enabled: Object.values(periods).some(Boolean),
  } } };
}
