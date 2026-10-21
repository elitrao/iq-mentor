export const INTEGRATION_SERVICES = [
  { key: 'bitrix', name: 'Bitrix24', category: 'crm', description: 'Звонки, сделки и команда', keywords: 'битрикс битрикс24 crm срм структура команды' },
  { key: 'yandex', name: 'Яндекс Диск', category: 'storage', description: 'Автозагрузка записей звонков', keywords: 'yandex disk drive хранилище автоматическая загрузка' },
  { key: 'api', name: 'API', category: 'api', description: 'Связь с вашими системами', keywords: 'апи разработчики ключ токен собственная интеграция подключение iq mentor' },
];

export function normalizeIntegrationSettings(saved = {}) {
  return { ...(saved?.amo ? { amo: saved.amo } : {}), ...Object.fromEntries(INTEGRATION_SERVICES.map(({ key }) => [key, {
    connected: key === 'bitrix',
    account: key === 'bitrix' ? 'iqgroup.bitrix24.ru' : '',
    // User-requested recent demo date for the prototype's seeded Bitrix connection.
    ...(key === 'bitrix' && saved?.bitrix?.connected !== false && !saved?.bitrix?.connectedAt ? { connectedAt: '2026-10-19T09:00:00+04:00' } : {}),
    ...(key === 'api' ? { token: '' } : {}),
    ...saved?.[key],
  }])) };
}

export function integrationConnectionDate(value = {}) {
  const dates = value.connectedAt ? [value.connectedAt] : (value.entries || []).map((entry) => entry.createdAt);
  const valid = dates.filter((date) => typeof date === 'string' && Number.isFinite(Date.parse(date))).sort((a, b) => Date.parse(a) - Date.parse(b));
  return valid[0] || null;
}

export function formatIntegrationConnectionDate(date) {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Samara' }).format(new Date(date));
}

const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();

export function filterIntegrations(query = '', category = 'all', connections = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return INTEGRATION_SERVICES.filter((service) => {
    const words = normalize(`${service.name} ${service.description} ${service.keywords}`).split(/\s+/);
    return !connections[service.key]?.connected
      && (category === 'all' || service.category === category)
      && terms.every((term) => words.some((word) => word.startsWith(term)));
  });
}
