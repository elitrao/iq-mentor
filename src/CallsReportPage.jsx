import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconAlertCircle, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconClock, IconSearch, IconUpload, IconX } from '@tabler/icons-react';
import { FeedbackSelect } from './FeedbackSelect.jsx';
import { ResizableReportTable } from './ResizableReportTable.jsx';
import { CALL_COLUMNS, DEMO_CALLS, EMPTY_CALL_FILTERS, callCellText, callsToCsv, filterCallRows, formatCallDuration, parseCallDuration, validateCallFilters } from './calls-report-model.js';
import settingsIcon from './assets/calls-report/settings.svg';
import downloadIcon from './assets/calls-report/download.svg';
import exportIcon from './assets/calls-report/export.svg';
import filterIcon from './assets/calls-report/filter.svg';
import eyeIcon from './assets/calls-report/eye.svg';
import sortIcon from './assets/calls-report/sort.svg';
import './calls-report.css';

const STORAGE_KEY = 'iq-mentor-call-report-columns-v1';
const allColumns = CALL_COLUMNS.map(column => column.id);
const icons = { settings: settingsIcon, download: downloadIcon, export: exportIcon, filter: filterIcon, eye: eyeIcon, sort: sortIcon };
function SourceIcon({ name }) { return <i className="cr-source-icon" style={{ '--cr-icon': `url("${icons[name]}")` }} aria-hidden="true" />; }
function Check({ label, checked, mixed = false, disabled = false, onChange }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = mixed; }, [mixed]);
  return <input ref={ref} className="cr-checkbox" type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={onChange} />;
}
function ReportDialog({ title, children, close }) {
  const ref = useRef(null), headingId = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="cr-dialog" aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  }}><header><h2 id={headingId}>{title}</h2><button type="button" className="cr-close" aria-label="Закрыть" onClick={close}><IconX size={18} stroke={1.5} /></button></header>{children}</dialog>;
}
function FilterDialog({ filters, rows, apply, close, manageTeam }) {
  const [draft, setDraft] = useState(filters), [error, setError] = useState('');
  const set = (key, value) => { setDraft(current => ({ ...current, [key]: value === 'Все' ? '' : value })); setError(''); };
  const fields = [['department', 'Отдел'], ['employee', 'Сотрудник'], ['template', 'Выбранный шаблон'], ['source', 'Источник звонка'], ['pipeline', 'Воронка']];
  const select = ([key, label]) => <div className="cr-field" key={key}><div className="cr-label"><span>{label}</span>{['department', 'employee'].includes(key) && <button type="button" onClick={manageTeam}>Добавить</button>}</div><FeedbackSelect label={label} value={draft[key]} placeholder={key === 'pipeline' ? 'Выберите воронку' : 'Не выбрано'} options={['Все', ...new Set(rows.map(row => row[key]).filter(Boolean))]} onChange={value => set(key, value)} /></div>;
  return <ReportDialog title="Фильтр" close={close}><form onSubmit={event => { event.preventDefault(); const message = validateCallFilters(draft); if (message) setError(message); else apply(draft); }}>
    {fields.slice(0, 2).map(select)}
    <div className="cr-field"><span className="cr-label">Дата звонка</span><div className="cr-pair"><input aria-label="Дата звонка от" type="date" value={draft.from} onChange={e => set('from', e.target.value)} /><input aria-label="Дата звонка до" type="date" value={draft.to} onChange={e => set('to', e.target.value)} /></div></div>
    {fields.slice(2).map(select)}
    <div className="cr-field"><span className="cr-label">Длительность звонка</span><div className="cr-pair">{[['min', 'Минимальная длительность'], ['max', 'Максимальная длительность']].map(([key, label]) => <label className="cr-time" key={key}><IconClock size={18} /><input aria-label={label} placeholder="00:00:00" value={draft[key]} onChange={e => set(key, e.target.value)} maxLength={9} /></label>)}</div></div>
    {error && <p role="alert" className="cr-error">{error}</p>}
    <footer><button type="button" className="cr-button" onClick={() => { setDraft({ ...EMPTY_CALL_FILTERS }); setError(''); }}>Сбросить</button><button type="submit" className="cr-button primary">Применить</button></footer>
  </form></ReportDialog>;
}
function DisplayDialog({ visible, setVisible, close }) {
  const [expanded, setExpanded] = useState(true);
  return <ReportDialog title="Настройки отображения" close={close}>
    <div className="cr-display-group"><Check label="Все столбцы" checked={visible.length === allColumns.length} mixed={visible.length > 1 && visible.length < allColumns.length} onChange={e => setVisible(e.target.checked ? allColumns : ['title'])} /><button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>Общие<IconChevronDown size={16} style={{ transform: expanded ? '' : 'rotate(-90deg)' }} /></button></div>
    {expanded && <div className="cr-field-grid">{CALL_COLUMNS.map(column => <label key={column.id} className={visible.includes(column.id) ? 'checked' : ''}><Check label={column.label} checked={visible.includes(column.id)} disabled={column.id === 'title'} onChange={e => setVisible(e.target.checked ? allColumns.filter(id => id === column.id || visible.includes(id)) : visible.filter(id => id !== column.id))} /><span>{column.label}</span></label>)}</div>}
    <button className="cr-text-button" onClick={() => setVisible(allColumns)}>Показать всё</button>
  </ReportDialog>;
}
function GenerationDialog({ value, save, close }) {
  const [draft, setDraft] = useState({ autoAnalyze: value.autoAnalyze, minDuration: value.minDuration }), [error, setError] = useState('');
  return <ReportDialog title="Настройка оценки" close={close}><form onSubmit={event => { event.preventDefault(); if (draft.autoAnalyze && (parseCallDuration(draft.minDuration) === null || Number.isNaN(parseCallDuration(draft.minDuration)))) { setError('Укажите длительность в формате ЧЧ:ММ:СС.'); return; } save(draft); }}>
    <p className="cr-dialog-intro">Настройте длительность звонка для оценки</p>
    <div className={`cr-field${draft.autoAnalyze ? '' : ' is-disabled'}`}><label className="cr-label" htmlFor="cr-min-duration">Минимальная длительность звонка</label><div className="cr-time"><IconClock size={18} /><input id="cr-min-duration" disabled={!draft.autoAnalyze} value={draft.minDuration} onChange={e => { setDraft({ ...draft, minDuration: e.target.value }); setError(''); }} maxLength={9} /></div></div>
    <label className="cr-auto-check"><Check label="Автоматически отправлять звонок на анализ" checked={draft.autoAnalyze} onChange={e => setDraft({ ...draft, autoAnalyze: e.target.checked })} /><span>Автоматически отправлять звонок на анализ<small>Не придётся запускать анализ вручную</small></span></label>
    {error && <p role="alert" className="cr-error">{error}</p>}
    <footer><button className="cr-button" type="button" onClick={close}>Отменить</button><button className="cr-button primary" type="submit">Сохранить</button></footer>
  </form></ReportDialog>;
}
function ImportDialog({ rows, close, add }) {
  const [employee, setEmployee] = useState(''), [stereo, setStereo] = useState('Автоматическое определение'), [files, setFiles] = useState([]), [error, setError] = useState('');
  const chooseFiles = list => { const selected = [...list]; if (selected.some(file => !/\.(wav|flac|ogg|aac|amr|mp3)$/i.test(file.name))) { setError('Выберите аудиофайлы WAV, FLAC, OGG, AAC, AMR или MP3.'); return; } setFiles(selected); setError(''); };
  return <ReportDialog title="Импорт файлов" close={close}>
    <p className="cr-dialog-intro">Выберите сотрудника, к которому хотите прикрепить импортированные файлы</p>
    <div className="cr-import-steps" aria-label={`Шаг ${employee ? files.length ? 3 : 2 : 1} из 3`}>{[true, !!employee, !!files.length].map((active, i) => <span className={active ? 'active' : ''} key={i}><IconCheck size={10} /></span>)}</div>
    <div className="cr-field"><span className="cr-label">Сотрудник</span><FeedbackSelect label="Сотрудник" placeholder="Не выбрано" value={employee} options={[...new Set(rows.map(row => row.employee))]} onChange={setEmployee} /></div>
    <div className="cr-field"><span className="cr-label">Стереоформат звонков</span><FeedbackSelect label="Стереоформат звонков" value={stereo} options={['Автоматическое определение', 'L (Оператор), R (Клиент)', 'L (Клиент), R (Оператор)']} onChange={setStereo} /></div>
    {employee && <label className="cr-upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); chooseFiles(e.dataTransfer.files); }}><IconUpload size={24} /><span>{files.length ? `Выбрано файлов: ${files.length}` : 'Выберите файлы или перетащите сюда'}</span><input type="file" aria-label="Аудиофайлы" accept=".wav,.flac,.ogg,.aac,.amr,.mp3" multiple onChange={e => chooseFiles(e.target.files)} /></label>}
    {files.length > 0 && <ul className="cr-file-list">{files.map((file, i) => <li key={`${file.name}-${i}`}>{file.name}</li>)}</ul>}
    <p className="cr-upload-hint">Поддерживаемые форматы: WAV, FLAC, OGG, AAC, AMR, MP3<br />Поддержка анализа обеспечивается для аудиофайлов с битрейтом ≥ 16 кбит/с</p>
    {error && <p className="cr-error" role="alert">{error}</p>}
    {employee && <footer><button className="cr-button" onClick={close}>Отменить</button><button className="cr-button primary" disabled={!files.length} onClick={() => add(files, employee, stereo)}>Загрузить</button></footer>}
  </ReportDialog>;
}
export function CallsReportPage({ scoring, saveScoring, notify, manageTeam, openTrainer }) {
  const [rows, setRows] = useState(DEMO_CALLS), [query, setQuery] = useState(''), [filters, setFilters] = useState({ ...EMPTY_CALL_FILTERS });
  const [sort, setSort] = useState(null), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(25), [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null), [detail, setDetail] = useState(null), [sizeOpen, setSizeOpen] = useState(false);
  const [visible, setVisible] = useState(() => { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(stored) ? allColumns.filter(id => id === 'title' || stored.includes(id)) : allColumns; } catch { return allColumns; } });
  const scrollRef = useRef(null), sizeRef = useRef(null);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(visible)); }, [visible]);
  useEffect(() => { if (!sizeOpen) return; const outside = e => { if (!sizeRef.current?.contains(e.target)) setSizeOpen(false); }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside); }, [sizeOpen]);
  const columns = CALL_COLUMNS.filter(column => visible.includes(column.id));
  const filtered = useMemo(() => filterCallRows(rows, query, filters, sort), [rows, query, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pageCount);
  const shown = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRows = rows.filter(row => selected.includes(row.id)), selectedOnPage = shown.filter(row => selected.includes(row.id)).length;
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [currentPage, pageSize, query, filters, sort]);
  const close = () => { setModal(null); setDetail(null); };
  const toggle = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const changeSort = id => { setSort(current => current?.id !== id ? { id, direction: 'asc' } : current.direction === 'asc' ? { id, direction: 'desc' } : null); setPage(1); };
  const exportRows = () => { const data = selectedRows.length ? selectedRows : filtered; const url = URL.createObjectURL(new Blob([callsToCsv(data, columns)], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = 'Отчёт по звонкам.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify(`Экспортировано звонков: ${data.length}`); };
  const pageNumbers = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => currentPage <= 3 ? i + 1 : currentPage - 2 + i), pageCount])].filter(n => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const pagination = <nav className="cr-pagination" aria-label="Страницы отчёта"><button disabled={currentPage === 1} aria-label="Предыдущая страница" onClick={() => setPage(currentPage - 1)}><IconChevronLeft size={16} /></button>{pageNumbers.map((number, i) => <span key={number}>{i > 0 && number - pageNumbers[i - 1] > 1 && <i>…</i>}<button className={number === currentPage ? 'active' : ''} aria-label={`Страница ${number}`} aria-current={number === currentPage ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button></span>)}<button disabled={currentPage === pageCount} aria-label="Следующая страница" onClick={() => setPage(currentPage + 1)}><IconChevronRight size={16} /></button></nav>;
  const cell = (row, column) => {
    if (column.id === 'title') return <div className="cr-call-name">{row.status === 'evaluated' && <span className="cr-status evaluated" title="Звонок проанализирован">А</span>}{row.status === 'error' && <span className="cr-status error" title="Не удалось проанализировать"><IconAlertCircle size={15} stroke={1.4} /></span>}<button title={row.title} onClick={() => setDetail(row)}>{row.title}</button></div>;
    if (column.id === 'source') return <span className={`cr-badge source-${row.source === 'Bitrix 24' ? 'bitrix' : row.source === 'IQ Mentor' ? 'mentor' : 'offline'}`}>{row.source}</span>;
    if (column.id === 'type') return <span className="cr-badge cr-call-type">{row.type}</span>;
    if (column.id === 'pipeline') return row.pipeline ? <div className="cr-pipeline"><span className="cr-badge">{row.pipeline}</span><span className="cr-badge">{row.stage}</span></div> : '—';
    if (column.id === 'department') return row.department ? <span className="cr-badge cr-department" title={row.department}>{row.department}</span> : '—';
    return callCellText(row, column.id);
  };
  return <section className="detailed-calls-page" aria-labelledby="cr-title">
    <header className="cr-page-heading"><h1 id="cr-title">Отчет по звонкам</h1><div className="cr-heading-actions"><button className="cr-button" onClick={() => setModal('generation')}><SourceIcon name="settings" />Настроить генерацию</button><button className="cr-button primary" onClick={() => setModal('import')}><SourceIcon name="download" />Загрузить звонки</button><button className="cr-button icon-only" title="Экспортировать отчёт" aria-label="Экспортировать отчёт" onClick={exportRows} disabled={!filtered.length}><SourceIcon name="export" /></button></div></header>
    <div className="cr-table-card"><div className="cr-toolbar"><div className="cr-toolbar-left"><button className={`cr-button icon-only${Object.values(filters).some(Boolean) ? ' has-filter' : ''}`} aria-label="Фильтр" title="Фильтр" onClick={() => setModal('filter')}><SourceIcon name="filter" /></button><button className="cr-button icon-only" aria-label="Настройки отображения" title="Настройки отображения" onClick={() => setModal('display')}><SourceIcon name="eye" /></button><label className="cr-search"><IconSearch size={22} stroke={1.3} /><input aria-label="Поиск звонков" placeholder="Поиск" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />{query && <button aria-label="Очистить поиск" onClick={() => { setQuery(''); setPage(1); }}><IconX size={16} /></button>}</label></div>
    <div className="cr-toolbar-right"><div className="cr-page-size" ref={sizeRef}>На странице по: <button aria-label="Количество строк на странице" aria-expanded={sizeOpen} aria-haspopup="menu" onClick={() => setSizeOpen(!sizeOpen)} onKeyDown={e => { if (e.key === 'Escape') setSizeOpen(false); }}>{pageSize}</button>{sizeOpen && <div role="menu" aria-label="Количество строк" onKeyDown={e => { if (e.key === 'Escape') { setSizeOpen(false); sizeRef.current.querySelector('button').focus(); } }}>{[10, 25, 50, 100].map(size => <button role="menuitemradio" aria-checked={pageSize === size} key={size} onClick={() => { setPageSize(size); setPage(1); setSizeOpen(false); }}>{size}{size === pageSize && <IconCheck size={14} />}</button>)}</div>}</div><span aria-live="polite">Всего строк: {filtered.length}</span></div></div>
      <div className="cr-table-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Таблица звонков, доступна горизонтальная прокрутка">
        <ResizableReportTable columnIds={['selection', ...columns.map(column => column.id)]} disabledColumns={['selection']} storageKey="iq-calls-column-widths-v1" className="cr-table" style={{ width: 35 + columns.reduce((sum, column) => sum + column.width, 0) }}><caption className="cr-sr-only">Отчёт по звонкам</caption><colgroup><col style={{ width: 35 }} />{columns.map(column => <col key={column.id} style={{ width: column.width }} />)}</colgroup><thead><tr><th className="cr-check-cell"><Check label="Выбрать все звонки на странице" checked={shown.length > 0 && selectedOnPage === shown.length} mixed={selectedOnPage > 0 && selectedOnPage < shown.length} disabled={!shown.length} onChange={e => setSelected(current => e.target.checked ? [...new Set([...current, ...shown.map(row => row.id)])] : current.filter(id => !shown.some(row => row.id === id)))} /></th>{columns.map(column => <th key={column.id} scope="col" aria-sort={sort?.id === column.id ? sort.direction === 'asc' ? 'ascending' : 'descending' : undefined}><div><span className="cr-column-label" title={column.label}><span>{column.label}</span></span>{column.sort && <button className={sort?.id === column.id ? 'sorted' : ''} aria-label={`Сортировать: ${column.label}`} title="Изменить сортировку" onClick={() => changeSort(column.id)}><SourceIcon name="sort" /></button>}</div></th>)}</tr></thead><tbody>{shown.map(row => <tr key={row.id} className={selected.includes(row.id) ? 'selected' : ''}><td className="cr-check-cell"><Check label={`Выбрать звонок: ${row.title}`} checked={selected.includes(row.id)} onChange={() => toggle(row.id)} /></td>{columns.map(column => <td key={column.id} title={callCellText(row, column.id)}>{cell(row, column)}</td>)}</tr>)}</tbody></ResizableReportTable>
        {!shown.length && <div className="cr-empty"><IconSearch size={30} stroke={1.3} /><strong>Звонки не найдены</strong><span>Попробуйте изменить поиск или фильтры.</span><button className="cr-button" onClick={() => { setQuery(''); setFilters({ ...EMPTY_CALL_FILTERS }); setPage(1); }}>Сбросить поиск и фильтры</button></div>}
      </div>
    </div>
    <footer className={`cr-footer${selected.length ? ' has-selection' : ''}`}>{selected.length > 0 && <div className="cr-selection-summary"><span>Всего выбрано: <b>{selected.length}</b></span><span>Длительность: <b>{formatCallDuration(selectedRows.reduce((sum, row) => sum + row.duration, 0))}</b></span></div>}{pagination}{selected.length > 0 && <div className="cr-bulk-actions"><button onClick={() => setSelected([])}>Снять выделение</button><button onClick={() => setModal('delete')}>Удалить</button><button className="training" onClick={openTrainer}>Создать тренировку</button><button className="analyze" onClick={() => setModal('analyze')}>Анализировать</button></div>}</footer>
    {modal === 'filter' && <FilterDialog filters={filters} rows={rows} close={close} manageTeam={manageTeam} apply={next => { setFilters(next); setPage(1); close(); }} />}
    {modal === 'display' && <DisplayDialog visible={visible} setVisible={setVisible} close={close} />}
    {modal === 'generation' && <GenerationDialog value={scoring} close={close} save={draft => { saveScoring(draft); close(); notify('Настройки оценки сохранены'); }} />}
    {modal === 'import' && <ImportDialog rows={rows} close={close} add={(files, employee, stereo) => { const date = new Date().toISOString().slice(0, 10); setRows(current => [...files.map((file, i) => ({ id: `local-${Date.now()}-${i}`, title: file.name, client: '', evaluatedAt: '', date, source: 'IQ Mentor', type: 'Ручной', pipeline: '', stage: '', department: '', duration: 0, employee, status: 'new', template: '', stereo })), ...current]); setPage(1); setQuery(''); setFilters({ ...EMPTY_CALL_FILTERS }); close(); notify('Файлы добавлены в прототип. На сервер они не отправлялись.'); }} />}
    {modal === 'delete' && <ReportDialog title="Удалить звонки?" close={close}><p>Будут удалены выбранные записи в прототипе: {selected.length}.</p><footer><button className="cr-button" onClick={close}>Отменить</button><button className="cr-button primary" onClick={() => { setRows(current => current.filter(row => !selected.includes(row.id))); setSelected([]); close(); notify('Выбранные звонки удалены из прототипа'); }}>Удалить</button></footer></ReportDialog>}
    {modal === 'analyze' && <ReportDialog title="Анализ звонков" close={close}><p>Выбрано звонков: {selected.length}.</p><p className="cr-upload-hint">В прототипе можно посмотреть результат действия. Записи не отправляются на анализ, баланс не списывается.</p><footer><button className="cr-button" onClick={close}>Отменить</button><button className="cr-button primary" onClick={() => { setRows(current => current.map(row => selected.includes(row.id) ? { ...row, status: 'evaluated', evaluatedAt: row.date } : row)); setSelected([]); close(); notify('Показан демонстрационный результат анализа'); }}>Показать результат</button></footer></ReportDialog>}
    {detail && <ReportDialog title={detail.title} close={close}><dl className="cr-details">{CALL_COLUMNS.filter(column => column.id !== 'title').map(column => <div key={column.id}><dt>{column.label}</dt><dd>{callCellText(detail, column.id)}</dd></div>)}</dl></ReportDialog>}
  </section>;
}
