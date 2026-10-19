export const INTEGRATION_SERVICES = [
  { key: 'bitrix', name: 'Bitrix24', category: 'crm', description: 'Звонки, сделки и команда', keywords: 'битрикс битрикс24 crm срм структура команды' },
  { key: 'yandex', name: 'Яндекс Диск', category: 'storage', description: 'Автозагрузка записей звонков', keywords: 'yandex disk drive хранилище автоматическая загрузка' },
  { key: 'amo', name: 'amoCRM', category: 'crm', description: 'Контакты, сделки и звонки', keywords: 'амо амосрм crm срм разговоры менеджеров' },
  { key: 'api', name: 'API', category: 'api', description: 'Связь с вашими системами', keywords: 'апи разработчики ключ токен собственная интеграция подключение iq mentor' },
];

export function normalizeIntegrationSettings(saved = {}) {
  return Object.fromEntries(INTEGRATION_SERVICES.map(({ key }) => [key, {
    connected: key === 'bitrix',
    account: key === 'bitrix' ? 'iqgroup.bitrix24.ru' : '',
    ...(key === 'api' ? { token: '' } : {}),
    ...saved?.[key],
  }]));
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
