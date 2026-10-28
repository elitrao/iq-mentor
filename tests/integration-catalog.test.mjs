import test from 'node:test';
import assert from 'node:assert/strict';
import { filterIntegrations, INTEGRATION_SERVICES, normalizeIntegrationSettings, integrationConnectionDate, formatIntegrationConnectionDate } from '../src/settings/integration-catalog.js';
import { API_PAGE_SIZE, addApiEntry, addApiKey, filterApiEntries, getApiEntries, getApiKeys, paginateApiRows, sortApiRowsByCreatedAt, updateApiEntry, withApiEntries } from '../src/settings/api-integrations.js';

const keys = (items) => items.map((item) => item.key);

test('API date sorting uses actual timestamps, keeps equal dates stable and missing dates last without mutating records', () => {
  const rows = [
    { id: 'missing', createdAt: null },
    { id: 'newest', createdAt: '2026-10-28T10:05:00+04:00' },
    { id: 'older', createdAt: '2026-10-28T06:00:00Z' },
    { id: 'invalid', createdAt: 'invalid' },
    { id: 'same', createdAt: '2026-10-28T06:05:00Z' },
    { id: 'oldest', createdAt: '2026-09-30T10:00:00Z' },
  ].map(Object.freeze);
  Object.freeze(rows);
  assert.deepEqual(sortApiRowsByCreatedAt(rows).map((row) => row.id), ['newest', 'same', 'older', 'oldest', 'missing', 'invalid']);
  assert.deepEqual(sortApiRowsByCreatedAt(rows, 'asc').map((row) => row.id), ['oldest', 'older', 'newest', 'same', 'missing', 'invalid']);
  assert.equal(rows[0].id, 'missing');
  assert.deepEqual(sortApiRowsByCreatedAt([]), []);
});

test('API integration and key date sorting covers all pages and composes with search', () => {
  const rows = Array.from({ length: 9 }, (_, index) => ({ id: index + 1, name: `CRM ${index + 1}`, createdAt: `2026-10-${String(index + 1).padStart(2, '0')}T12:00:00Z` }));
  for (const records of [getApiEntries({ entries: rows }), getApiKeys({ keys: rows })]) {
    assert.deepEqual(paginateApiRows(sortApiRowsByCreatedAt(records), 1).items.map((row) => row.id), [9, 8, 7, 6, 5, 4]);
    assert.deepEqual(paginateApiRows(sortApiRowsByCreatedAt(records), 2).items.map((row) => row.id), [3, 2, 1]);
    assert.deepEqual(paginateApiRows(sortApiRowsByCreatedAt(records, 'asc'), 2).items.map((row) => row.id), [7, 8, 9]);
  }
  assert.deepEqual(sortApiRowsByCreatedAt(filterApiEntries(rows, 'CRM 2')).map((row) => row.id), [2]);
});

test('connection dates retain real saved timestamps and use the requested Bitrix demo date only when absent', () => {
  assert.equal(formatIntegrationConnectionDate(integrationConnectionDate(normalizeIntegrationSettings().bitrix)), '19.10.2026');
  const connectedAt = '2026-10-20T21:30:00Z';
  assert.equal(normalizeIntegrationSettings({ bitrix: { connectedAt } }).bitrix.connectedAt, connectedAt);
  assert.equal(formatIntegrationConnectionDate(connectedAt), '21.10.2026');
  assert.equal(integrationConnectionDate({ entries: [{ createdAt: 'invalid' }, { createdAt: connectedAt }] }), connectedAt);
  assert.equal(integrationConnectionDate({}), null);
  const first = withApiEntries({}, [{ id: 'one' }], connectedAt);
  assert.equal(first.connectedAt, connectedAt);
  assert.equal(withApiEntries(first, [{ id: 'one' }, { id: 'two' }], 'later').connectedAt, connectedAt);
  assert.equal(withApiEntries(first, []).connectedAt, null);
  const saved = normalizeIntegrationSettings({ amo: { connected: true, token: 'demo-preserve' } });
  assert.equal(saved.amo.token, 'demo-preserve');
  assert.ok(!INTEGRATION_SERVICES.some((service) => service.key === 'amo'));
});

test('API pagination shows six rows and enables another page only after six', () => {
  assert.equal(API_PAGE_SIZE, 6);
  for (const count of [0, 1, 6, 7, 12, 13, 15]) {
    const rows = Array.from({ length: count }, (_, id) => ({ id, name: `Запись ${id}` }));
    const first = paginateApiRows(rows);
    assert.equal(first.items.length, Math.min(count, 6));
    assert.equal(first.pageCount, Math.max(1, Math.ceil(count / 6)));
    assert.deepEqual(Array.from({ length: first.pageCount }, (_, i) => paginateApiRows(rows, i + 1).items).flat(), rows);
  }
});

test('API pagination clamps after deletion and paginates filtered results', () => {
  const rows = Array.from({ length: 7 }, (_, id) => ({ id, name: `Запись ${id}` }));
  const last = paginateApiRows(rows, 2);
  assert.deepEqual([last.start, last.end, last.total], [7, 7, 7]);
  assert.equal(paginateApiRows(rows.slice(0, 6), 2).page, 1);
  assert.equal(paginateApiRows([], 2).start, 0);
  assert.equal(paginateApiRows(rows, -1).page, 1);
  const filtered = paginateApiRows(filterApiEntries(rows, 'Запись 6'), 2);
  assert.equal(filtered.page, 1);
  assert.equal(filtered.pageCount, 1);
  assert.deepEqual(filtered.items, [rows[6]]);
});

test('catalog only lists existing configurable services', () => {
  assert.deepEqual(keys(filterIntegrations()), ['bitrix', 'yandex', 'api']);
  assert.equal(new Set(keys(INTEGRATION_SERVICES)).size, INTEGRATION_SERVICES.length);
});

test('category filters are distinct and preserve catalog order', () => {
  assert.deepEqual(keys(filterIntegrations('', 'crm')), ['bitrix']);
  assert.deepEqual(keys(filterIntegrations('', 'storage')), ['yandex']);
});

test('search supports Russian aliases, case, whitespace and descriptions', () => {
  assert.deepEqual(keys(filterIntegrations('  БИТРИКС  ')), ['bitrix']);
  assert.deepEqual(keys(filterIntegrations('yandex')), ['yandex']);
  assert.deepEqual(keys(filterIntegrations('аМО')), []);
  assert.deepEqual(keys(filterIntegrations('записей звонков')), ['yandex']);
  assert.deepEqual(keys(filterIntegrations('команды')), ['bitrix']);
  assert.deepEqual(keys(filterIntegrations(' \n ')), ['bitrix', 'yandex', 'api']);
  assert.deepEqual(keys(filterIntegrations('API')), ['api']);
  assert.deepEqual(keys(filterIntegrations('апи')), ['api']);
});

test('search combines with category and returns empty results without fallback', () => {
  assert.deepEqual(filterIntegrations('yandex', 'crm'), []);
  assert.deepEqual(filterIntegrations('несуществующий сервис'), []);
  assert.deepEqual(keys(filterIntegrations('crm', 'crm')), ['bitrix']);
});

test('connected services only appear in the connected section, never in catalog results', () => {
  const connections = { bitrix: { connected: true }, yandex: { connected: false }, amo: { connected: false } };
  assert.deepEqual(keys(filterIntegrations('', 'all', connections)), ['yandex', 'api']);
  assert.deepEqual(keys(filterIntegrations('', 'crm', connections)), []);
  assert.deepEqual(filterIntegrations('Битрикс', 'all', connections), []);
  assert.equal(connections.bitrix.connected, true);
});

test('disconnected services return immediately, and all-connected catalog is empty', () => {
  const connections = Object.fromEntries(INTEGRATION_SERVICES.map(({ key }) => [key, { connected: true }]));
  assert.deepEqual(filterIntegrations('', 'all', connections), []);
  assert.deepEqual(filterIntegrations('Яндекс', 'storage', connections), []);
  connections.yandex.connected = false;
  assert.deepEqual(keys(filterIntegrations('', 'all', connections)), ['yandex']);
});

test('older saved settings gain API without losing existing connection values', () => {
  const saved = { bitrix: { connected: false, account: 'saved', token: 'demo-test' }, amo: { connected: true } };
  const migrated = normalizeIntegrationSettings(saved);
  assert.deepEqual(migrated.bitrix, saved.bitrix);
  assert.equal(migrated.amo.connected, true);
  assert.deepEqual(migrated.api, { connected: false, account: '', token: '' });
  assert.equal(saved.api, undefined);
  assert.equal(normalizeIntegrationSettings(null).bitrix.connected, true);
});

test('API follows active/available filtering and preserves a saved demo key', () => {
  const saved = normalizeIntegrationSettings({ api: { connected: true, token: 'demo_iq_test' } });
  assert.equal(saved.api.token, 'demo_iq_test');
  assert.deepEqual(filterIntegrations('api', 'all', saved), []);
  saved.api.connected = false;
  assert.deepEqual(keys(filterIntegrations('api', 'all', saved)), ['api']);
});

test('API table migrates a legacy demo key and keeps saved records', () => {
  assert.deepEqual(getApiEntries({}), []);
  assert.equal(getApiEntries({ connected: true, token: 'demo_iq_legacy' })[0].token, 'demo_iq_legacy');
  const rows = [{ id: '1', name: 'CRM', token: 'demo_iq_1', createdAt: '2026-10-19T12:00:00Z' }];
  assert.deepEqual(getApiEntries({ entries: rows }), rows);
  assert.equal(withApiEntries({}, rows).connected, true);
  assert.equal(withApiEntries({ token: 'demo_iq_legacy' }, []).connected, false);
  assert.equal(withApiEntries({ token: 'demo_iq_legacy' }, []).token, '');
});

test('API creation validates names and limits without mutating saved records', () => {
  const rows = addApiEntry([], '  Моя CRM  ', { id: '1', token: 'demo_iq_1', createdAt: '2026-10-19T12:00:00Z' });
  assert.equal(rows[0].name, 'Моя CRM');
  assert.throws(() => addApiEntry(rows, 'моя crm', {}), /уже существует/);
  assert.throws(() => addApiEntry([], '   ', {}), /название/);
  assert.throws(() => addApiEntry([], 'а'.repeat(81), {}), /80 символов/);
  assert.throws(() => addApiEntry(Array.from({ length: 15 }, (_, i) => ({ name: String(i) })), 'Новая', {}), /15 интеграций/);
  assert.equal(rows.length, 1);
  assert.deepEqual(filterApiEntries(rows, '  CRM '), rows);
  assert.deepEqual(filterApiEntries(rows, 'нет'), []);
});

test('editing integration preserves its date and keys and updates its badge', () => {
  const keys = [{ id: 'key-1', name: 'Сервер', token: 'demo_key' }];
  const rows = [{ id: 'one', name: 'CRM', createdAt: '2026-10-19', keys }, { id: 'two', name: 'Другая' }];
  const badge = { background: '#FFF1E6', color: '#5C3420' };
  const updated = updateApiEntry(rows, 'one', '  Новая CRM ', badge);
  assert.equal(updated[0].name, 'Новая CRM');
  assert.deepEqual(updated[0].badge, badge);
  assert.deepEqual(updated[0].keys, keys);
  assert.equal(updated[0].createdAt, '2026-10-19');
  assert.equal(rows[0].name, 'CRM');
  assert.throws(() => updateApiEntry(rows, 'one', 'другая', badge), /уже существует/);
});

test('API keys belong to their integration; new integrations start empty', () => {
  const fresh = addApiEntry([], 'CRM', { id: 'one', keys: [] })[0];
  assert.deepEqual(getApiKeys(fresh), []);
  const created = addApiKey(getApiKeys(fresh), '  Сервер  ', { id: 'key-1', token: 'demo_key' });
  assert.equal(created[0].name, 'Сервер');
  assert.deepEqual(getApiKeys(fresh), []);
  assert.equal(getApiKeys({ id: 'legacy', token: 'demo_old' })[0].token, 'demo_old');
  assert.throws(() => addApiKey(created, 'сервер', {}), /уже существует/);
  assert.throws(() => addApiKey([], ' ', {}), /название/);
});
