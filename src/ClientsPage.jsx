import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconArrowUpRight, IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconInfoCircle, IconPhone, IconSearch, IconStarFilled, IconUserFilled, IconX } from '@tabler/icons-react';
import { FeedbackSelect } from './FeedbackSelect.jsx';
import { ResizableReportTable } from './ResizableReportTable.jsx';
import { CLIENT_COLUMNS, DEMO_CLIENTS, EMPTY_CLIENT_FILTERS, clientDate, filterClientRows, parseClientPeriod, validateClientFilters } from './clients-model.js';
import filterIcon from './assets/calls-report/filter.svg';
import eyeIcon from './assets/calls-report/eye.svg';
import sortIcon from './assets/calls-report/sort.svg';
import './clients-page.css';

const ALL_COLUMNS = CLIENT_COLUMNS.map(column => column.id);
const DISPLAY_ORDER = ['name', 'rating', 'calls', 'source', 'activity', 'pipeline', 'summaryDate'];
const STORAGE_KEY = 'iq-mentor-client-columns-v1';
const icons = { filter: filterIcon, eye: eyeIcon, sort: sortIcon };
function SourceIcon({ name }) { return <i className="cp-source-icon" style={{ '--cp-icon': `url("${icons[name]}")` }} aria-hidden="true" />; }
function ClientDialog({ title, className = '', children, close }) {
  const ref = useRef(null), headingId = useId();
  useEffect(() => { const element = ref.current; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={ref} className={`cp-dialog ${className}`} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }}><header><h2 id={headingId}>{title}</h2><button type="button" className="cp-close" aria-label="Закрыть" onClick={close}><IconX size={18} stroke={1.5} /></button></header>{children}</dialog>;
}
function DatePeriod({ label, value, onChange }) {
  const [open, setOpen] = useState(false), [start, setStart] = useState(''), [month, setMonth] = useState(() => new Date(2026, 9, 1));
  const root = useRef(null), dateId = useId();
  useEffect(() => { if (!open) return; const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); }; document.addEventListener('pointerdown', dismiss); return () => document.removeEventListener('pointerdown', dismiss); }, [open]);
  const parsed = parseClientPeriod(value);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const monday = new Date(first); monday.setDate(first.getDate() - (first.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return { date, iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }; });
  const choose = iso => {
    if (!start) { setStart(iso); return; }
    const range = [start, iso].sort(); onChange(range.map(clientDate).join('-')); setStart(''); setOpen(false);
  };
  return <div className="cp-field cp-date-field" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}>
    <label htmlFor={dateId}>{label}</label><div className="cp-date-input"><button type="button" aria-label={`Календарь: ${label}`} aria-expanded={open} onClick={() => { setOpen(!open); setStart(''); }}><IconCalendar size={20} stroke={1.4} /></button><input id={dateId} value={value} placeholder="ДД.ММ.ГГГГ-ДД.ММ.ГГГГ" inputMode="numeric" maxLength={23} autoComplete="off" onChange={event => onChange(event.target.value)} /></div>
    {open && <div className="cp-calendar" role="group" aria-label={`Выбор периода: ${label}`}><header><button type="button" aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><IconChevronLeft size={16} /></button><strong>{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')}</strong><button type="button" aria-label="Следующий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><IconChevronRight size={16} /></button></header><div className="cp-calendar-grid">{['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(day => <span key={day}>{day}</span>)}{days.map(({ date, iso }) => <button type="button" key={iso} aria-label={date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} className={`${date.getMonth() !== month.getMonth() ? 'muted ' : ''}${iso === start || parsed && parsed.includes(iso) ? 'selected ' : ''}${parsed && iso > parsed[0] && iso < parsed[1] ? 'in-range' : ''}`} onClick={() => choose(iso)}>{date.getDate()}</button>)}</div></div>}
  </div>;
}
function ClientFilter({ filters, apply, close }) {
  const [draft, setDraft] = useState({ ...filters }), [error, setError] = useState('');
  const update = (key, value) => { setDraft(current => ({ ...current, [key]: value === 'Все' ? '' : value })); setError(''); };
  return <ClientDialog title="Фильтр" close={close}><form onSubmit={event => { event.preventDefault(); const message = validateClientFilters(draft); if (message) setError(message); else apply(draft); }}>
    <div className="cp-field"><span className="cp-label">Источник</span><FeedbackSelect label="Источник" placeholder="Выберите источник" value={draft.source} options={['Все', 'Лид', 'Сделка']} onChange={value => update('source', value)} /></div>
    <div className="cp-field cp-rating-field"><span className="cp-label">Рейтинг</span><div className="cp-rating-slider" style={{ '--cp-min': `${draft.min}%`, '--cp-max': `${draft.max}%` }}><div /><input type="range" min="0" max="100" aria-label="Минимальное значение" value={draft.min} onChange={event => update('min', Math.min(Number(event.target.value), draft.max))} /><input type="range" min="0" max="100" aria-label="Максимальное значение" value={draft.max} onChange={event => update('max', Math.max(Number(event.target.value), draft.min))} /></div><div className="cp-range-values"><span>{draft.min}</span><span>{draft.max}</span></div></div>
    <DatePeriod label="Активность" value={draft.activity} onChange={value => update('activity', value)} />
    <DatePeriod label="Дата итога" value={draft.summaryDate} onChange={value => update('summaryDate', value)} />
    <div className="cp-field"><span className="cp-label">Воронка</span><FeedbackSelect label="Воронка" placeholder="Выберите воронку" value={draft.pipeline} options={['Все', ...new Set(DEMO_CLIENTS.map(row => row.pipeline).filter(Boolean))]} onChange={value => update('pipeline', value)} /></div>
    {error && <p role="alert" className="cp-error">{error}</p>}<footer><button type="button" className="cp-button" onClick={() => { setDraft({ ...EMPTY_CLIENT_FILTERS }); setError(''); }}>Сбросить</button><button type="submit" className="cp-button primary">Применить</button></footer>
  </form></ClientDialog>;
}
function ClientDisplay({ visible, change, close }) {
  return <ClientDialog title="Настройки отображения" className="cp-display-dialog" close={close}><div className="cp-display-grid">{DISPLAY_ORDER.map(id => { const column = CLIENT_COLUMNS.find(item => item.id === id); return <label className={visible.includes(id) ? 'checked' : ''} key={id}><input type="checkbox" className="cp-checkbox" checked={visible.includes(id)} disabled={column.fixed} onChange={event => change(event.target.checked ? ALL_COLUMNS.filter(key => visible.includes(key) || key === id) : visible.filter(key => key !== id))} /><span>{column.label}</span></label>; })}</div></ClientDialog>;
}
function SourceBadge({ source, onClick }) {
  return <button className="cp-badge cp-source-badge" type="button" title={`Открыть ${source === 'Лид' ? 'лид' : 'сделку'} в CRM`} onClick={event => { event.stopPropagation(); onClick(); }}><IconArrowUpRight size={16} stroke={1.5} />{source}</button>;
}
function ClientDrawer({ client, close, notify }) {
  const ref = useRef(null), headingId = useId();
  const [tab, setTab] = useState('info'), [summaryOpen, setSummaryOpen] = useState(false), [call, setCall] = useState(null), [crmNotice, setCrmNotice] = useState(false);
  useEffect(() => { const element = ref.current; element.showModal(); return () => element.close(); }, []);
  const crm = () => setCrmNotice(true);
  return <dialog ref={ref} className="cp-drawer" aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }}><nav className="cp-drawer-tabs" aria-label="Карточка клиента"><button type="button" className="cp-drawer-dismiss" onClick={close} aria-label="Закрыть карточку"><IconChevronRight size={24} stroke={1.5} /></button><button type="button" className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')} aria-label="Информация о клиенте" aria-pressed={tab === 'info'}><IconInfoCircle size={24} stroke={1.5} /></button><button type="button" className={tab === 'calls' ? 'active' : ''} onClick={() => setTab('calls')} aria-label="История звонков" aria-pressed={tab === 'calls'}><IconPhone size={24} stroke={1.5} /></button></nav><div className="cp-drawer-content"><header><h2 id={headingId}>{client.name}</h2><SourceBadge source={client.source} onClick={crm} /><button className="cp-close cp-mobile-close" aria-label="Закрыть" onClick={close}><IconX size={18} /></button></header>
    {crmNotice && <p className="cp-client-summary" role="status">Это демонстрационная запись. Ссылка на реальную CRM не привязана.</p>}
    {tab === 'info' ? <><div className="cp-summary-heading"><span>Резюме по клиенту</span><button type="button" aria-label="Развернуть резюме по клиенту" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(!summaryOpen)}><IconChevronRight size={16} style={{ transform: summaryOpen ? 'rotate(90deg)' : '' }} /></button></div>{summaryOpen && <div className="cp-client-summary">{client.rating === null ? 'Резюме пока не сформировано.' : 'Клиент заинтересован в продукте. Обсудили задачи команды и договорились вернуться к условиям подключения после демонстрации.'}</div>}<div className="cp-category-title">Ключевые категории</div><div className="cp-category"><div><span className="cp-category-name"><IconStarFilled size={16} />Качество общения</span><span className="cp-badge">{client.rating === null ? 'Н/Д' : `${client.rating}%`}</span></div><span className="cp-badge">80%</span></div></> : call !== null ? <><button className="cp-history-back" type="button" onClick={() => setCall(null)}><IconChevronLeft size={16} />История звонков</button><dl className="cp-call-detail">{[['Звонок', client.name], ['Источник', 'Bitrix 24'], ['Дата звонка', clientDate(client.date)], ['Длительность', call ? '00:01:32' : '00:00:04'], ['Сотрудник', client.employee], ['Рейтинг', client.rating === null ? 'Не оценён' : `${client.rating}%`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <><div className="cp-category-title cp-history-title">История звонков</div><div className="cp-call-history">{Array.from({ length: client.calls }, (_, index) => <button className="cp-history-card" key={index} type="button" onClick={() => setCall(index)}><span className="cp-history-name">{client.name}<IconArrowUpRight size={14} /></span><span className="cp-call-meta"><span>{clientDate(client.date)}</span><span><IconClock size={14} />{index ? '1:32' : '0:04'}</span><span><IconUserFilled size={14} />{client.employee}</span></span></button>)}</div></>}
    </div></dialog>;
}
export function ClientsPage({ notify }) {
  const [query, setQuery] = useState(''), [filters, setFilters] = useState({ ...EMPTY_CLIENT_FILTERS }), [sort, setSort] = useState(null);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(25), [sizeOpen, setSizeOpen] = useState(false), [modal, setModal] = useState(null), [detail, setDetail] = useState(null);
  const [visible, setVisible] = useState(() => { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(stored) ? CLIENT_COLUMNS.filter(column => column.fixed || stored.includes(column.id)).map(column => column.id) : ALL_COLUMNS; } catch { return ALL_COLUMNS; } });
  const scrollRef = useRef(null), sizeRef = useRef(null);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visible)); } catch { /* Viewing still works when browser storage is unavailable. */ } }, [visible]);
  useEffect(() => { if (!sizeOpen) return; const outside = event => { if (!sizeRef.current?.contains(event.target)) setSizeOpen(false); }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside); }, [sizeOpen]);
  const rows = useMemo(() => filterClientRows(DEMO_CLIENTS, query, filters, sort), [query, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize)), currentPage = Math.min(page, pageCount);
  const shown = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), columns = CLIENT_COLUMNS.filter(column => visible.includes(column.id));
  const filtered = Object.keys(EMPTY_CLIENT_FILTERS).some(key => filters[key] !== EMPTY_CLIENT_FILTERS[key]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [currentPage, pageSize, query, filters, sort]);
  const changeSort = id => { setSort(current => current?.id !== id ? { id, direction: 'asc' } : current.direction === 'asc' ? { id, direction: 'desc' } : null); setPage(1); };
  const pages = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => currentPage <= 3 ? i + 1 : currentPage - 2 + i), pageCount])].filter(number => number > 0 && number <= pageCount).sort((a, b) => a - b);
  const cell = (row, id) => {
    if (id === 'name') return <button type="button" className="cp-client-name" onClick={() => setDetail(row)} title={row.name}>{row.name}</button>;
    if (id === 'source') return <SourceBadge source={row.source} onClick={() => notify?.('Это демонстрационная запись. Ссылка на реальную CRM не привязана.')} />;
    if (id === 'rating') return row.rating === null ? '—' : <span className={`cp-badge cp-rating ${row.rating >= 75 ? 'good' : row.rating >= 40 ? 'average' : ''}`}>{row.rating}% ({Math.round(row.rating * row.categories / 100)}/{row.categories})</span>;
    if (id === 'calls') return <span className="cp-badge cp-count">{row.calls}</span>;
    if (id === 'pipeline') return <span className="cp-pipeline">{row.pipeline && <span className="cp-badge">{row.pipeline}</span>}<span className="cp-badge">{row.stage}</span></span>;
    return clientDate(row[id]);
  };
  return <section className="clients-page"><header className="cp-page-heading"><h1>Клиенты</h1></header><div className="cp-table-card"><div className="cp-toolbar"><div className="cp-toolbar-left"><button type="button" className={`cp-icon-button${filtered ? ' has-filter' : ''}`} title="Фильтр" aria-label="Фильтр" onClick={() => setModal('filter')}><SourceIcon name="filter" /></button><button type="button" className="cp-icon-button" title="Настройки отображения" aria-label="Настройки отображения" onClick={() => setModal('display')}><SourceIcon name="eye" /></button><label className="cp-search"><IconSearch size={20} stroke={1.5} /><input aria-label="Поиск клиентов" placeholder="Поиск" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />{query && <button type="button" aria-label="Очистить поиск" onClick={() => { setQuery(''); setPage(1); }}><IconX size={16} /></button>}</label></div><div className="cp-toolbar-right"><div className="cp-page-size" ref={sizeRef}>На странице по: <button type="button" aria-haspopup="menu" aria-expanded={sizeOpen} aria-label={`Строк на странице: ${pageSize}`} onClick={() => setSizeOpen(!sizeOpen)} onKeyDown={event => { if (event.key === 'Escape') setSizeOpen(false); }}>{pageSize}</button>{sizeOpen && <div role="menu" aria-label="Строк на странице" onKeyDown={event => { if (event.key === 'Escape') { setSizeOpen(false); sizeRef.current?.querySelector('button')?.focus(); } }}>{[10, 25, 50, 100].map(size => <button role="menuitemradio" aria-checked={size === pageSize} type="button" key={size} onClick={() => { setPageSize(size); setPage(1); setSizeOpen(false); sizeRef.current?.querySelector('button')?.focus(); }}>{size}{size === pageSize && <IconCheck size={14} />}</button>)}</div>}</div><span aria-live="polite">Всего строк: {rows.length}</span></div></div>
    <div className="cp-table-scroll" ref={scrollRef}><ResizableReportTable columnIds={columns.map(column => column.id)} storageKey="iq-clients-column-widths-v1" className="cp-table" style={{ width: columns.reduce((sum, column) => sum + column.width, 0) }}><colgroup>{columns.map(column => <col key={column.id} style={{ width: column.width }} />)}</colgroup><thead><tr>{columns.map(column => <th key={column.id} scope="col" aria-sort={sort?.id === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : undefined}><div>{column.label}{column.id !== 'source' && <button type="button" className={sort?.id === column.id ? 'sorted' : ''} aria-label={`Сортировать: ${column.label}`} onClick={() => changeSort(column.id)}><SourceIcon name="sort" /></button>}</div></th>)}</tr></thead><tbody>{shown.map(row => <tr key={row.id} onClick={() => setDetail(row)}>{columns.map(column => <td key={column.id}>{cell(row, column.id)}</td>)}</tr>)}</tbody></ResizableReportTable>{shown.length === 0 && <div className="cp-empty"><IconSearch size={30} stroke={1.3} /><strong>Клиенты не найдены</strong><span>Попробуйте изменить поиск или фильтры.</span><button type="button" className="cp-button" onClick={() => { setQuery(''); setFilters({ ...EMPTY_CLIENT_FILTERS }); setPage(1); }}>Сбросить поиск и фильтры</button></div>}</div></div>
    <footer className="cp-footer"><nav className="cp-pagination" aria-label="Страницы клиентов">{currentPage > 1 && <button type="button" aria-label="Предыдущая страница" onClick={() => setPage(currentPage - 1)}><IconChevronLeft size={16} /></button>}{pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 && <i>...</i>}<button type="button" className={number === currentPage ? 'active' : ''} aria-current={number === currentPage ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button></span>)}{currentPage < pageCount && <button type="button" aria-label="Следующая страница" onClick={() => setPage(currentPage + 1)}><IconChevronRight size={16} /></button>}</nav></footer>
    {modal === 'filter' && <ClientFilter filters={filters} apply={value => { setFilters(value); setPage(1); setModal(null); }} close={() => setModal(null)} />}{modal === 'display' && <ClientDisplay visible={visible} change={setVisible} close={() => setModal(null)} />}{detail && <ClientDrawer client={detail} close={() => setDetail(null)} notify={notify} />}
  </section>;
}
