import { useEffect, useRef, useState } from 'react';
import { IconCopy, IconFile, IconPlus, IconTrash, IconUsers } from '@tabler/icons-react';
import { IntegrationScreen } from './IntegrationDetailScreens.jsx';
import { ApiDialog, ApiUsersDialog } from './ApiDialog.jsx';
import { API_PAGE_SIZE, addApiKey, getApiKeys, paginateApiRows } from './settings/api-integrations.js';
import { ApiPagination } from './ApiPagination.jsx';

export function ApiKeysScreen({ entry, onChange, back, backToCatalog, notify }) {
  const backRef = useRef(null);
  const [modal, setModal] = useState(null);
  const [name, setName] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const keys = getApiKeys(entry);
  const pagination = paginateApiRows(keys, page);
  useEffect(() => { setPage(pagination.page); }, [pagination.page]);
  const selected = keys.find((key) => key.id === modal);
  useEffect(() => { backRef.current?.focus(); }, []);
  const close = () => { setModal(null); setError(''); setConfirmDelete(false); };
  const save = (next) => onChange({ ...entry, token: '', keys: next });
  const newToken = () => `demo_iq_${crypto.randomUUID().replaceAll('-', '')}`;
  const create = (event) => {
    event.preventDefault();
    try {
      const id = crypto.randomUUID();
      const next = addApiKey(keys, name, { id, token: newToken(), createdAt: new Date().toISOString() });
      save(next); setPage(Math.ceil(next.length / API_PAGE_SIZE));
      setModal(id); setError(''); notify('Демонстрационный ключ создан');
    } catch (cause) { setError(cause.message); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(selected.token); notify('Демонстрационный ключ скопирован'); }
    catch { notify('Не удалось скопировать ключ'); }
  };
  const remove = () => { save(keys.filter((key) => key.id !== selected.id)); close(); notify('Демонстрационный ключ удалён'); };
  const formatDate = (date) => date && !Number.isNaN(Date.parse(date)) ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) : '—';
  return <IntegrationScreen connected title={<><span>Интеграция</span><span className="api-integration-badge" style={{ background: entry.badge?.background || '#f5f5f5', color: entry.badge?.color || '#5c5c5c' }}>{entry.name}</span></>} backRef={backRef} breadcrumbs={[{ label: 'Интеграции', onClick: backToCatalog }, { label: 'API-интеграции', onClick: back }, { label: 'Ключи интеграции' }]} className="api-reference-page api-keys-page" actions={<>
    <a className="light-button api-doc-icon" href="https://test.mentor.iqgroup.ai/api/integration/docs" target="_blank" rel="noopener noreferrer" aria-label="Документация API"><IconFile size={23} /></a>
    <button type="button" className="light-button" onClick={() => setModal('users')}>Пользователи<IconUsers size={22} /></button>
    <button type="button" className="dark-button" onClick={() => { setName(''); setModal('create'); }}><IconPlus size={21} />Создать новый ключ</button>
  </>}>
    <div className="api-reference-table-panel">
      <div className="api-reference-toolbar api-keys-toolbar"><div className="api-reference-counts"><span>На странице по: <b>{API_PAGE_SIZE}</b></span><span role="status">Всего строк: {keys.length}</span></div></div>
      <div className="api-reference-table-surface"><table className="api-reference-table"><thead><tr><th scope="col">Название</th><th scope="col">Создан</th></tr></thead><tbody>
        {pagination.items.map((key) => <tr key={key.id}><td><button type="button" onClick={() => setModal(key.id)}>{key.name}</button></td><td><div className="api-row-end"><time dateTime={key.createdAt || undefined}>{formatDate(key.createdAt)}</time><div className="api-row-actions"><button type="button" aria-label={`Удалить ключ «${key.name}»`} onClick={() => { setModal(key.id); setConfirmDelete(true); }}><IconTrash size={17} /></button></div></div></td></tr>)}
        {!keys.length && <tr><td colSpan={2} className="api-reference-empty">Ключей пока нет</td></tr>}
      </tbody></table></div>
      <ApiPagination pagination={pagination} onChange={setPage} />
    </div>
    {modal === 'users' && <ApiUsersDialog entry={entry} close={close} />}
    {modal === 'create' && <ApiDialog title="Создание ключа" close={close}><form onSubmit={create}><label className="api-record-name">Название ключа<input required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Введите название ключа" /></label><p className="api-record-note">Ключ в локальном прототипе демонстрационный и не даёт доступа к данным.</p>{error && <p role="alert" className="api-record-error">{error}</p>}<footer><button className="light-button" type="button" onClick={close}>Отменить</button><button className="dark-button" type="submit">Создать ключ</button></footer></form></ApiDialog>}
    {selected && <ApiDialog title={selected.name} close={close}><p className="api-record-note">Демонстрационный ключ — только для проверки интерфейса.</p><div className="api-record-key"><input readOnly aria-label="Демонстрационный API-ключ" value={'•'.repeat(32)} /><button type="button" aria-label="Скопировать API-ключ" onClick={copy}><IconCopy size={20} /></button></div>{confirmDelete ? <div className="api-record-confirm"><p>Удалить ключ «{selected.name}»?</p><button className="light-button" type="button" onClick={() => setConfirmDelete(false)}>Отменить</button><button className="dark-button" type="button" onClick={remove}>Удалить ключ</button></div> : <footer><button className="api-record-remove" type="button" onClick={() => setConfirmDelete(true)}>Удалить ключ</button><button className="light-button" type="button" onClick={() => { save(keys.map((key) => key.id === selected.id ? { ...key, token: newToken() } : key)); notify('Демонстрационный ключ обновлён'); }}>Обновить ключ</button></footer>}</ApiDialog>}
  </IntegrationScreen>;
}
