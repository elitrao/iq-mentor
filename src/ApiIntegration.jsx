import { useEffect, useRef, useState } from 'react';
import { IconArrowUpRight, IconPencil, IconPlus, IconSearch, IconTrash, IconUsers } from '@tabler/icons-react';
import { IntegrationScreen } from './IntegrationDetailScreens.jsx';
import { API_INTEGRATION_LIMIT, API_PAGE_SIZE, addApiEntry, filterApiEntries, getApiEntries, paginateApiRows, updateApiEntry, withApiEntries } from './settings/api-integrations.js';
import { ApiPagination } from './ApiPagination.jsx';
import { ApiDialog, ApiUsersDialog } from './ApiDialog.jsx';
import { ApiKeysScreen } from './ApiKeysScreen.jsx';
import './api-integrations.css';

export function ApiIntegration({ value, onChange, notify, back, backRef }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [name, setName] = useState('');
  const [badgeBackground, setBadgeBackground] = useState('#f5f5f5');
  const [badgeColor, setBadgeColor] = useState('#5c5c5c');
  const safeBackground = /^#[\da-f]{6}$/i.test(badgeBackground) ? badgeBackground : '#f5f5f5';
  const safeColor = /^#[\da-f]{6}$/i.test(badgeColor) ? badgeColor : '#5c5c5c';
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const returnRowRef = useRef(null);
  useEffect(() => { if (!activeId && returnRowRef.current) document.getElementById(returnRowRef.current)?.focus(); }, [activeId]);
  const entries = getApiEntries(value);
  const visible = filterApiEntries(entries, query);
  const pagination = paginateApiRows(visible, page);
  useEffect(() => { setPage(pagination.page); }, [pagination.page]);
  const selected = entries.find((item) => item.id === targetId);
  const activeEntry = entries.find((item) => item.id === activeId);
  const close = () => { setModal(null); setError(''); };
  const saveEntries = (next) => onChange(withApiEntries(value, next));
  const create = (event) => {
    event.preventDefault();
    try {
      const badge = { background: badgeBackground, color: badgeColor };
      if (modal === 'edit') saveEntries(updateApiEntry(entries, selected.id, name, badge));
      else {
        const next = addApiEntry(entries, name, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), keys: [], users: [], badge });
        saveEntries(next);
        setPage(Math.ceil(next.length / API_PAGE_SIZE));
      }
      setQuery(''); setModal(null); setError('');
      notify(modal === 'edit' ? 'API-интеграция обновлена' : 'Демонстрационная API-интеграция создана');
    } catch (cause) { setError(cause.message); }
  };
  const remove = () => {
    saveEntries(entries.filter((item) => item.id !== selected.id)); close();
    notify('Демонстрационная API-интеграция удалена');
  };
  const formatDate = (date) => date && !Number.isNaN(Date.parse(date)) ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) : '—';
  const openEntry = (item) => { returnRowRef.current = `api-entry-${item.id}`; setActiveId(item.id); };
  const editEntry = (item) => { setTargetId(item.id); setName(item.name); setBadgeBackground(item.badge?.background || '#f5f5f5'); setBadgeColor(item.badge?.color || '#5c5c5c'); setError(''); setModal('edit'); };

  if (activeEntry) return <ApiKeysScreen entry={activeEntry} onChange={(updated) => saveEntries(entries.map((item) => item.id === updated.id ? updated : item))} back={() => setActiveId(null)} backToCatalog={back} notify={notify} />;

  return <IntegrationScreen title="API-интеграции" back={back} backRef={backRef} className="api-reference-page" actions={<>
    <a className="light-button" href="https://test.mentor.iqgroup.ai/api/integration/docs" target="_blank" rel="noopener noreferrer">Документация API<IconArrowUpRight size={18} aria-hidden="true" /></a>
    <button type="button" className="dark-button" disabled={entries.length >= API_INTEGRATION_LIMIT} onClick={() => { setName(''); setBadgeBackground('#f5f5f5'); setBadgeColor('#5c5c5c'); setError(''); setModal('create'); }}><IconPlus size={21} aria-hidden="true" />Создать новую интеграцию</button>
  </>}>
    <div className="api-reference-table-panel">
      <div className="api-reference-toolbar">
        <label className="api-reference-search"><IconSearch size={19} aria-hidden="true" /><input type="search" placeholder="Поиск" aria-label="Поиск API-интеграций" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <div className="api-reference-counts"><span>На странице по: <b>{API_PAGE_SIZE}</b></span><span role="status">Всего интеграций: {entries.length}/{API_INTEGRATION_LIMIT}</span></div>
      </div>
      <div className="api-reference-table-surface"><table className="api-reference-table"><thead><tr><th scope="col">Название</th><th scope="col">Создана</th></tr></thead><tbody>
        {pagination.items.map((item) => <tr className="api-entry-row" key={item.id} onClick={() => openEntry(item)}><td><button id={`api-entry-${item.id}`} type="button" onClick={(event) => { event.stopPropagation(); openEntry(item); }}><span className="api-integration-badge" style={{ background: item.badge?.background || '#f5f5f5', color: item.badge?.color || '#5c5c5c' }}>{item.name}</span></button></td><td><div className="api-row-end"><time dateTime={item.createdAt || undefined}>{formatDate(item.createdAt)}</time><div className="api-row-actions" onClick={(event) => event.stopPropagation()}>
          <button type="button" aria-label={`Редактировать интеграцию «${item.name}»`} onClick={() => editEntry(item)}><IconPencil size={17} /></button>
          <button type="button" aria-label={`Пользователи интеграции «${item.name}»`} onClick={() => { setTargetId(item.id); setModal('users'); }}><IconUsers size={17} /></button>
          <button type="button" aria-label={`Удалить интеграцию «${item.name}»`} onClick={() => { setTargetId(item.id); setModal('delete'); }}><IconTrash size={17} /></button>
        </div></div></td></tr>)}
        {!visible.length && <tr><td colSpan={2} className="api-reference-empty">{query.trim() ? 'Ничего не найдено' : 'Интеграций пока нет'}</td></tr>}
      </tbody></table></div>
      <ApiPagination pagination={pagination} onChange={setPage} />
    </div>
    {(modal === 'create' || modal === 'edit') && <ApiDialog title={modal === 'edit' ? 'Редактирование API-интеграции' : 'Создание API-интеграции'} close={close} className="api-create-dialog"><form className="api-create-form" onSubmit={create}>
      <label className="api-record-name">Название<input autoFocus value={name} maxLength={80} required placeholder="Введите название интеграции" onChange={(event) => { setName(event.target.value); setError(''); }} /></label>
      <fieldset className="api-badge-colors"><legend>Настройка бейджа</legend><div>
        <div className="api-badge-color-field"><input type="color" aria-label="Цвет фона бейджа" value={safeBackground} onInput={(event) => setBadgeBackground(event.currentTarget.value)} onChange={(event) => setBadgeBackground(event.target.value)} /><input className="api-badge-hex" aria-label="Код цвета фона бейджа" value={badgeBackground.toUpperCase()} onChange={(event) => setBadgeBackground(event.target.value)} required pattern="#[a-fA-F0-9]{6}" maxLength={7} spellCheck={false} /></div>
        <div className="api-badge-color-field"><input type="color" aria-label="Цвет текста бейджа" value={safeColor} onInput={(event) => setBadgeColor(event.currentTarget.value)} onChange={(event) => setBadgeColor(event.target.value)} /><input className="api-badge-hex" aria-label="Код цвета текста бейджа" value={badgeColor.toUpperCase()} onChange={(event) => setBadgeColor(event.target.value)} required pattern="#[a-fA-F0-9]{6}" maxLength={7} spellCheck={false} /></div>
      </div></fieldset>
      <div className="api-badge-preview"><span>Предпросмотр</span><span className="api-integration-badge" style={{ background: safeBackground, color: safeColor }}>{name.trim() || 'Название интеграции'}</span></div>
      {error && <p className="api-record-error" role="alert">{error}</p>}
      <footer><button className="light-button" type="button" onClick={close}>Отменить</button><button className="dark-button" type="submit">Сохранить</button></footer>
    </form></ApiDialog>}
    {modal === 'users' && selected && <ApiUsersDialog entry={selected} close={close} />}
    {modal === 'delete' && selected && <ApiDialog title="Удалить интеграцию?" close={close}><p className="api-record-note">Будет удалена локальная интеграция «{selected.name}» и все её демонстрационные ключи. Это действие нельзя отменить.</p><footer><button className="light-button" type="button" onClick={close}>Отменить</button><button className="dark-button" type="button" onClick={remove}>Удалить интеграцию</button></footer></ApiDialog>}
  </IntegrationScreen>;
}
