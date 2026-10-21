export const API_INTEGRATION_LIMIT = 15;
export const API_PAGE_SIZE = 6;

export function paginateApiRows(rows, requestedPage = 1) {
  const pageCount = Math.max(1, Math.ceil(rows.length / API_PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(requestedPage) || 1));
  const offset = (page - 1) * API_PAGE_SIZE;
  return { items: rows.slice(offset, offset + API_PAGE_SIZE), page, pageCount, total: rows.length, start: rows.length ? offset + 1 : 0, end: Math.min(offset + API_PAGE_SIZE, rows.length) };
}

export function getApiEntries(value = {}) {
  if (Array.isArray(value.entries)) return value.entries;
  if (value.connected && value.token) return [{ id: 'legacy-api', name: 'API-интеграция', createdAt: null, token: value.token }];
  return [];
}

export function addApiEntry(entries, name, details) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Укажите название интеграции.');
  if (cleanName.length > 80) throw new Error('Название должно быть не длиннее 80 символов.');
  if (entries.length >= API_INTEGRATION_LIMIT) throw new Error('Можно создать не более 15 интеграций.');
  if (entries.some((item) => item.name.toLocaleLowerCase('ru') === cleanName.toLocaleLowerCase('ru'))) throw new Error('Интеграция с таким названием уже существует.');
  return [...entries, { ...details, name: cleanName }];
}

export function filterApiEntries(entries, query) {
  const term = query.trim().toLocaleLowerCase('ru');
  return entries.filter((item) => item.name.toLocaleLowerCase('ru').includes(term));
}

export function withApiEntries(value, entries, now = new Date().toISOString()) {
  return { ...value, token: '', entries, connected: entries.length > 0,
    connectedAt: entries.length ? (value.connected ? value.connectedAt : now) : null };
}

export function updateApiEntry(entries, id, name, badge) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) throw new Error('Интеграция не найдена.');
  const validated = addApiEntry(entries.filter((item) => item.id !== id), name, { ...entry, badge }).at(-1);
  return entries.map((item) => item.id === id ? validated : item);
}

export function getApiKeys(entry) {
  if (Array.isArray(entry.keys)) return entry.keys;
  return entry.token ? [{ id: `${entry.id}-legacy-key`, name: 'Основной ключ', createdAt: entry.createdAt, token: entry.token }] : [];
}

export function addApiKey(keys, name, details) {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 80) throw new Error('Укажите название ключа от 1 до 80 символов.');
  if (keys.some((item) => item.name.toLocaleLowerCase('ru') === cleanName.toLocaleLowerCase('ru'))) throw new Error('Ключ с таким названием уже существует.');
  return [...keys, { ...details, name: cleanName }];
}
