import { ReportPagination } from './ReportPagination.jsx';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconCalendar, IconChartPieFilled, IconCheck, IconChevronDown, IconChevronRight, IconClock, IconFileFilled, IconInfoCircle, IconSearch, IconUsers, IconX } from '@tabler/icons-react';
import { formatCallDate } from './calls-report-model.js';
import { ReportScore } from './ReportScore.jsx';
import { ReportTitle } from './ReportTitle.jsx';
import { ReportActions } from './ReportActions.jsx';
import { ReportTableToolbar } from './ReportTableToolbar.jsx';
import { ReportOpenHint } from './ReportOpenHint.jsx';

import { ReportEmployeeAvatar } from './ReportEmployeeAvatar.jsx';
import { ResizableReportTable } from './ResizableReportTable.jsx';
import { CATEGORY_REPORT_EMPLOYEES, CATEGORY_REPORT_ROWS, EMPTY_CATEGORY_FILTER, INITIAL_CATEGORY_HISTORY, categoryReportPeriod, categoryRowsCsv, filterCategoryRows, generateCategoryRows, validateCategoryGeneration } from './category-report-model.js';
import filterIcon from './assets/calls-report/filter.svg';
import settingsIcon from './assets/calls-report/settings.svg';
import exportIcon from './assets/calls-report/export.svg';
import sortIcon from './assets/calls-report/sort.svg';
import historyIcon from './assets/summary-report/history.svg';
import generateIcon from './assets/summary-report/generate.svg';
import './category-report.css';

const CATEGORY_OPTIONS = CATEGORY_REPORT_ROWS.map(row => ({ value: row.id, label: row.name }));
const EMPLOYEE_OPTIONS = CATEGORY_REPORT_EMPLOYEES.map(value => ({ value, label: value }));
const freshFilters = () => ({ categories: [], employees: [] });
const iconAssets = { filter: filterIcon, settings: settingsIcon, export: exportIcon, sort: sortIcon, history: historyIcon, generate: generateIcon };
const SCHEDULE_KEY = 'iq-category-report-schedule-v1';

function SourceIcon({ name }) { return <span className="catr-source-icon" aria-hidden="true" style={{ '--catr-icon': `url("${iconAssets[name]}")` }} />; }
function ReportMode({ mode }) { return <span className={`catr-mode ${mode === 'auto' ? 'automatic' : 'manual'}`} title={mode === 'auto' ? 'Автоматический отчёт' : 'Ручной отчёт'}>{mode === 'auto' ? 'А' : 'Р'}</span>; }

function CategoryDialog({ title, children, close, drawer = false, tools, className = '' }) {
  const ref = useRef(null), titleId = useId(), outside = useRef(false);
  useEffect(() => {
    const el = ref.current, active = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; el.showModal();
    return () => { el.close(); document.body.style.overflow = overflow; if (active?.isConnected) active.focus({ preventScroll: true }); };
  }, []);
  const isOutside = event => { if (event.target !== event.currentTarget) return false; const rect = event.currentTarget.getBoundingClientRect(); return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom; };
  return <dialog ref={ref} className={`catr-dialog${drawer ? ' catr-drawer' : ''} ${className}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); close(); }} onPointerDown={event => { outside.current = isOutside(event); }}
    onClick={event => { if (outside.current && isOutside(event)) close(); outside.current = false; }}>
    {drawer && <div className="catr-drawer-tools"><button type="button" className="catr-drawer-back" aria-label="Закрыть панель" onClick={close}><IconChevronRight size={24} stroke={1.5} /></button>{tools}</div>}
    <div className="catr-dialog-body"><header><h2 id={titleId}>{title}</h2>{!drawer && <button type="button" className="catr-close" aria-label="Закрыть" onClick={close}><IconX size={17} stroke={1.4} /></button>}</header>{children}</div>
  </dialog>;
}

function MultiSelect({ label, placeholder, options, value, onChange }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [popupStyle, setPopupStyle] = useState({});
  const ref = useRef(null), trigger = useRef(null), search = useRef(null), listId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const position = () => {
      const rect = trigger.current.getBoundingClientRect(), availableBelow = window.innerHeight - rect.bottom - 16;
      const above = availableBelow < 230 && rect.top > availableBelow;
      setPopupStyle({ position: 'fixed', left: rect.left, top: above ? 'auto' : rect.bottom + 5, bottom: above ? window.innerHeight - rect.top + 5 : 'auto', width: rect.width, maxHeight: Math.max(160, above ? rect.top - 16 : availableBelow), overflowY: 'auto' });
    };
    position(); search.current?.focus();
    const dismiss = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss); window.addEventListener('resize', position);
    return () => { document.removeEventListener('pointerdown', dismiss); window.removeEventListener('resize', position); };
  }, [open]);
  const visible = options.filter(option => option.label.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const selected = options.filter(option => value.includes(option.value));
  const choose = item => onChange(value.includes(item) ? value.filter(entry => entry !== item) : [...value, item]);
  const closeMenu = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="catr-multi" ref={ref} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); closeMenu(); }
    if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault(); const buttons = [...ref.current.querySelectorAll('[role="option"]')]; const current = buttons.indexOf(document.activeElement); const next = current < 0 ? 0 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length; buttons[next]?.focus();
    }
  }}>
    <div className="catr-field-label"><span>{label}</span><button type="button" onClick={() => setOpen(true)}>Добавить</button></div>
    <button ref={trigger} className={`catr-select-trigger${selected.length ? ' has-value' : ''}`} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
      <span>{selected.length ? `${selected[0].label}${selected.length > 1 ? ` +${selected.length - 1}` : ''}` : placeholder}</span><IconChevronDown size={18} stroke={1.5} />
    </button>
    {open && <div className="catr-select-popup" style={popupStyle}><label className="catr-select-search"><IconSearch size={17} stroke={1.4} /><input ref={search} placeholder="Поиск" aria-label={`Поиск: ${label}`} value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button type="button" className="catr-select-all" onClick={() => onChange(visible.every(option => value.includes(option.value)) ? value.filter(entry => !visible.some(option => option.value === entry)) : [...new Set([...value, ...visible.map(option => option.value)])])}><span className={`catr-check${visible.length > 0 && visible.every(option => value.includes(option.value)) ? ' checked' : ''}`} aria-hidden="true"><IconCheck size={12} /></span>Выбрать все</button>
      <div role="listbox" id={listId} aria-label={label} aria-multiselectable="true">{visible.map(option => <button type="button" role="option" aria-selected={value.includes(option.value)} key={option.value} onClick={() => choose(option.value)}><span className={`catr-check${value.includes(option.value) ? ' checked' : ''}`} aria-hidden="true"><IconCheck size={12} /></span>{option.label}</button>)}{!visible.length && <p className="catr-select-empty">Ничего не найдено</p>}</div>
    </div>}
  </div>;
}

function CategoryFilter({ value, apply, close, history = false, inline = false }) {
  const [draft, setDraft] = useState({ ...value, categories: [...value.categories], employees: [...value.employees] });
  const [error, setError] = useState('');
  const set = (key, next) => setDraft(current => ({ ...current, [key]: next }));
  const form = <form className={`catr-filter-form${inline ? ' catr-history-inline' : ''}`} onSubmit={event => { event.preventDefault(); if (draft.from && draft.to && draft.from > draft.to) { setError('Дата начала не может быть позже даты окончания.'); return; } apply(draft); }}>
    <MultiSelect label="Категории" placeholder="Выберите категории" options={CATEGORY_OPTIONS} value={draft.categories} onChange={next => set('categories', next)} />
    <MultiSelect label="Сотрудник" placeholder="Выберите сотрудников" options={EMPLOYEE_OPTIONS} value={draft.employees} onChange={next => set('employees', next)} />
    {history && <DateRange label="Период" from={draft.from || ''} to={draft.to || ''} setFrom={next => set('from', next)} setTo={next => set('to', next)} />}
    {error && <p role="alert" className="catr-error">{error}</p>}
    <footer><button type="button" className="catr-button" onClick={() => { setDraft({ ...freshFilters(), ...(history ? { from: '', to: '' } : {}) }); setError(''); }}>Сбросить</button><button type="submit" className="catr-button dark">Применить</button></footer>
  </form>;
  return inline ? form : <CategoryDialog title="Фильтр" close={close}>{form}</CategoryDialog>;
}

function DateRange({ label, from, to, setFrom, setTo }) {
  const [open, setOpen] = useState(false), [popupStyle, setPopupStyle] = useState({});
  const ref = useRef(null), trigger = useRef(null), input = useRef(null), popupId = useId();
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return undefined;
    const position = () => {
      const rect = trigger.current.getBoundingClientRect(), above = window.innerHeight - rect.bottom < 160 && rect.top > 160;
      setPopupStyle({ left: rect.left, top: above ? 'auto' : rect.bottom + 5, bottom: above ? window.innerHeight - rect.top + 5 : 'auto', width: rect.width });
    };
    position(); input.current?.focus();
    const dismiss = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss); window.addEventListener('resize', position);
    return () => { document.removeEventListener('pointerdown', dismiss); window.removeEventListener('resize', position); };
  }, [open]);
  return <div className="catr-field catr-date-field" ref={ref} onKeyDown={event => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }}>
    <span className="catr-field-label">{label}</span>
    <button ref={trigger} type="button" className={`catr-date-range${from || to ? ' has-value' : ''}`} aria-label={label} aria-expanded={open} aria-controls={popupId} onClick={() => setOpen(!open)}><IconCalendar size={20} stroke={1.4} /><span>{from || to ? `${from ? formatCallDate(from) : 'ДД.ММ.ГГГГ'}–${to ? formatCallDate(to) : 'ДД.ММ.ГГГГ'}` : 'ДД.ММ.ГГГГ-ДД.ММ.ГГГГ'}</span></button>
    {open && <div className="catr-date-popup" id={popupId} role="group" aria-label={`Выбор периода: ${label}`} style={popupStyle}>
      <label>От<input ref={input} type="date" value={from} aria-label={`${label}: от`} onInput={event => setFrom(event.currentTarget.value)} onChange={event => setFrom(event.target.value)} /></label>
      <label>До<input type="date" value={to} aria-label={`${label}: до`} onInput={event => setTo(event.currentTarget.value)} onChange={event => setTo(event.target.value)} /></label>
      <button className="catr-button dark" type="button" onClick={close}>Готово</button>
    </div>}
  </div>;
}

function GenerationDialog({ close, generate }) {
  const [draft, setDraft] = useState({ ...freshFilters(), from: '', to: '', min: '', max: '' }), [error, setError] = useState('');
  const set = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setError(''); };
  return <CategoryDialog title="Генерация отчета по категориям" close={close}><form className="catr-generation-form" onSubmit={event => { event.preventDefault(); const problem = validateCategoryGeneration(draft); if (problem) setError(problem); else generate(draft); }}>
    <MultiSelect label="Категории" placeholder="Выберите категории оценки" options={CATEGORY_OPTIONS} value={draft.categories} onChange={next => set('categories', next)} />
    <MultiSelect label="Сотрудники" placeholder="Выберите сотрудников" options={EMPLOYEE_OPTIONS} value={draft.employees} onChange={next => set('employees', next)} />
    <DateRange label="Дата звонков" from={draft.from} to={draft.to} setFrom={next => set('from', next)} setTo={next => set('to', next)} />
    <div className="catr-field"><span className="catr-field-label">Длительность звонка</span><div className="catr-duration-range">{['min', 'max'].map((key, i) => <div className="catr-duration-part" key={key}>{i > 0 && <span>–</span>}<label><IconClock size={19} stroke={1.4} /><input value={draft[key]} placeholder="00:00:00" aria-label={i ? 'Максимальная длительность' : 'Минимальная длительность'} maxLength={9} onChange={event => set(key, event.target.value)} /></label></div>)}</div></div>
    {error && <p role="alert" className="catr-error">{error}</p>}
    <footer><button type="submit" className="catr-button orange"><SourceIcon name="generate" />Сгенерировать</button></footer>
  </form></CategoryDialog>;
}

function AutoGenerationDialog({ value, close, save }) {
  const [draft, setDraft] = useState(value);
  return <CategoryDialog title="Автоматическая генерация" close={close}><p className="catr-auto-description">Настройте, как часто система будет автоматически создавать отчет по категориям:</p>
    <div className="catr-auto-periods">{[['day', 'За прошедший день'], ['week', 'За прошедшую неделю'], ['month', 'За прошедший месяц']].map(([key, label]) => <label key={key}><input type="checkbox" role="switch" checked={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.checked })} /><span className="catr-switch" aria-hidden="true" /><span>{label}</span></label>)}</div>
    <footer><button type="button" className="catr-button" onClick={close}>Отменить</button><button type="button" className="catr-button dark" onClick={() => save(draft)}>Сохранить</button></footer>
  </CategoryDialog>;
}

function HistoryDrawer({ reports, close, select }) {
  const [filterOpen, setFilterOpen] = useState(false), [filter, setFilter] = useState({ ...freshFilters(), from: '', to: '' });
  const filtered = reports.filter(report => (!filter.from || report.to >= filter.from) && (!filter.to || report.from <= filter.to) && filterCategoryRows(report.rows, filter).length > 0);
  const groups = [...new Set(filtered.map(report => report.created))];
  return <CategoryDialog title="История отчетов" close={close} drawer className="catr-history"><button className={`catr-button icon catr-history-filter${filterOpen || filter.categories.length || filter.employees.length || filter.from || filter.to ? ' active' : ''}`} type="button" aria-label="Фильтр истории" aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}><SourceIcon name="filter" /></button>
    {filterOpen && <CategoryFilter history inline value={filter} close={() => setFilterOpen(false)} apply={next => { setFilter(next); setFilterOpen(false); }} />}
    <div className="catr-history-list">{groups.map((date, i) => <section key={date}><h3 className={i === 0 ? 'today' : ''}>{date === '2026-10-26' || date === new Date().toISOString().slice(0, 10) ? 'Сегодня' : new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</h3>{filtered.filter(report => report.created === date).map(report => <button type="button" className="catr-history-row" key={report.id} onClick={() => select(report)}><div><ReportMode mode={report.mode} /><span>{report.title}</span><i className="catr-history-dot" /></div><small><span>{categoryReportPeriod(report.from, report.to)}</span><span>Создал(а) {report.creator}</span></small></button>)}</section>)}{!filtered.length && <div className="catr-empty"><strong>Отчёты не найдены</strong><span>Попробуйте изменить фильтр.</span></div>}</div>
  </CategoryDialog>;
}

function CategoryDetail({ row, report, close, openEmployee }) {
  const [section, setSection] = useState(row.initialSection || 'info'), [tab, setTab] = useState('explanation'), [search, setSearch] = useState('');
  const employees = row.employees.filter(employee => employee.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')));
  return <CategoryDialog title={section === 'info' ? 'Подробная информация' : 'Привязанные сотрудники'} close={close} drawer className="catr-detail"
    tools={<><button className={section === 'info' ? 'active' : ''} type="button" title="Подробная информация" aria-label="Подробная информация" onClick={() => setSection('info')}><IconInfoCircle size={26} stroke={1.5} /></button><button className={section === 'employees' ? 'active' : ''} type="button" title="Привязанные сотрудники" aria-label="Привязанные сотрудники" onClick={() => setSection('employees')}><IconUsers size={26} stroke={1.5} /></button></>}>
    <div className="catr-detail-chips"><span><IconFileFilled size={15} />{row.name}</span><span><IconCalendar size={15} />{formatCallDate(report.to)}</span><span className="score"><IconChartPieFilled size={15} />{row.score}%</span></div>
    {section === 'info' ? <><div role="tablist" aria-label="Информация о категории" className="catr-detail-tabs"><button type="button" role="tab" aria-selected={tab === 'explanation'} onClick={() => setTab('explanation')}>Пояснение оценки</button><button type="button" role="tab" aria-selected={tab === 'recommendations'} onClick={() => setTab('recommendations')}>Рекомендации</button></div><div role="tabpanel" className="catr-detail-copy">
      {tab === 'explanation' ? <><p><strong>{row.explanation.split('. ')[0]}.</strong><br />В выборке {row.employees.length === 1 ? 'один сотрудник' : `сотрудников: ${row.employees.length}`} — {row.employees.join(', ')}. Оценка отражает качество работы за выбранный период. В большинстве разговоров сотрудники соблюдают структуру диалога, внимательно слушают клиента и уточняют важные детали. В отдельных звонках полезно подробнее объяснить следующий шаг и убедиться, что договорённости понятны обеим сторонам.</p><p>Результат помогает увидеть общую картину по команде. При разборе категории стоит обращать внимание на содержание разговоров и сравнивать несколько примеров, а не делать вывод только по средней оценке.</p><h3>Кто тянет категорию вверх</h3><p>{row.employees[0]} показывает уверенный результат. Хорошие примеры можно использовать для совместного разбора: обсудить, как сотрудник задаёт вопросы, реагирует на сомнения клиента и подводит итог разговора.</p></> : <><h3>Что можно улучшить</h3><p>Выберите несколько звонков с разными оценками и обсудите их с сотрудниками. Отметьте конкретные удачные формулировки и действия, которые помогли клиенту.</p><h3>Следующий шаг</h3><p>Добавьте в сценарий короткую проверку понимания и фиксацию договорённостей. Через неделю сравните результаты по категории «{row.name}» и оцените изменения на новых звонках.</p></>}
    </div></> : <><label className="catr-employee-search"><IconSearch size={21} stroke={1.4} /><input aria-label="Поиск сотрудника" placeholder="Поиск сотрудника" value={search} onChange={event => setSearch(event.target.value)} /></label><div className="catr-linked-employees">{employees.map(employee => <button type="button" key={employee} onClick={() => openEmployee?.(employee)}><ReportEmployeeAvatar name={employee} /><span>{employee}</span><IconChevronRight size={17} stroke={1.3} /><em>{row.score}%</em></button>)}{!employees.length && <p className="catr-muted">Сотрудники не найдены</p>}</div></>}
  </CategoryDialog>;
}

export function CategoryReportPage({ notify = () => {}, openEmployee }) {
  const [reports, setReports] = useState(INITIAL_CATEGORY_HISTORY), [report, setReport] = useState(INITIAL_CATEGORY_HISTORY[0]);
  const [filters, setFilters] = useState(EMPTY_CATEGORY_FILTER), [sort, setSort] = useState(null), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(25);
  const [modal, setModal] = useState(null), [detail, setDetail] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [schedule, setSchedule] = useState(() => { try { return { day: true, week: true, month: true, ...JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '{}') }; } catch { return { day: true, week: true, month: true }; } });
  const scrollRef = useRef(null);
  const filtered = useMemo(() => filterCategoryRows(report.rows, filters, sort), [report.rows, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pageCount), shown = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [currentPage, pageSize, report, filters, sort]);
  const changeSort = key => { setSort(current => current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null); setPage(1); };
  const pickReport = selected => { setReport(selected); setFilters(freshFilters()); setPage(1); setModal(null); };
  const close = () => setModal(null);
  const exportRows = () => { const url = URL.createObjectURL(new Blob([categoryRowsCsv(filtered)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'Отчёт по категориям.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Отчёт по категориям экспортирован'); };
  const generate = draft => { const next = { id: `category-local-${Date.now()}`, title: 'Отчет за период', from: draft.from || report.from, to: draft.to || report.to, created: new Date().toISOString().slice(0, 10), mode: 'manual', creator: 'Самойленко Даниил', rows: generateCategoryRows(CATEGORY_REPORT_ROWS, draft) }; setReports(current => [next, ...current]); pickReport(next); notify('Демонстрационный отчёт сформирован'); };
  return <section className="category-report-page" aria-label="Отчёт по категориям">
    <header className="catr-page-heading report-page-heading"><ReportTitle title={report.title} automatic={report.mode === 'auto'} period={categoryReportPeriod(report.from, report.to)} onRename={() => { setRenameTitle(report.title); setModal('rename'); }} /><ReportActions unread onHistory={() => setModal('history')} onGenerate={() => setModal('generation')} onSchedule={() => setModal('schedule')} onExport={exportRows} exportDisabled={!filtered.length} /></header>
    <div className="catr-table-card"><ReportTableToolbar filtered={Boolean(filters.categories.length || filters.employees.length)} onFilter={() => setModal('filter')} pageSize={pageSize} onPageSize={size => { setPageSize(size); setPage(1); }} count={filtered.length} />
      <div className="catr-table-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Таблица категорий, доступна горизонтальная прокрутка">
        <ResizableReportTable className="catr-table" fillContainer columnIds={['name', 'employees', 'score']} storageKey="iq-category-column-widths-v1" minWidths={{ name: 180, employees: 180, score: 200 }}>
          <caption className="catr-sr-only">Отчёт по категориям</caption>
          <colgroup><col style={{ width: '36%' }} /><col style={{ width: '34%' }} /><col style={{ width: '30%' }} /></colgroup>
          <thead><tr>{[['name', 'Категория оценки'], ['employees', 'Сотрудники'], ['score', 'Средняя оценка']].map(([key, label]) => <th key={key} data-column={key} scope="col" aria-sort={sort?.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : undefined}><div>{label}{['name', 'score'].includes(key) && <button type="button" className={sort?.key === key ? 'active' : ''} aria-label={`Сортировать: ${label}`} onClick={() => changeSort(key)}><SourceIcon name="sort" /></button>}</div></th>)}</tr></thead>
          <tbody>
            {shown.map(row => <tr key={row.id}>
              <td><button type="button" className="catr-category-name" aria-label={`Открыть подробности категории «${row.name}»`} onClick={() => setDetail(row)}><span className="catr-category-label">{row.name}</span><i className={row.type === 'boolean' ? 'boolean' : ''}>{row.type === 'boolean' ? '+/−' : row.type === 'text' ? 'Aa' : 'Aa %'}</i><ReportOpenHint className="catr-open-hint" /></button></td>
              <td><button type="button" className="catr-employee-cell" onClick={() => setDetail({ ...row, initialSection: 'employees' })} aria-label={`Открыть сотрудников категории «${row.name}»`}><ReportEmployeeAvatar name={row.employees[0]} /><span className="catr-employee-label" title={row.employees[0]}>{row.employees[0]}</span>{row.employees.length > 1 && <span className="catr-employee-more" title={`Ещё сотрудников: ${row.employees.length - 1}`}>{row.employees.length - 1}+</span>}<ReportOpenHint className="catr-open-hint" /></button></td>
              <td><button type="button" className="catr-score-cell" aria-label={`Открыть подробности категории «${row.name}»: оценка ${row.score}%`} onClick={() => setDetail(row)}><ReportScore score={row.score} /><ReportOpenHint className="catr-open-hint" /></button></td>
            </tr>)}
            {!shown.length && <tr className="catr-empty-row"><td colSpan={3}><div className="catr-empty"><IconSearch size={29} stroke={1.3} /><strong>Категории не найдены</strong><span>Попробуйте изменить фильтр или сформировать новый отчёт.</span>{(filters.categories.length > 0 || filters.employees.length > 0) && <button type="button" className="catr-button" onClick={() => { setFilters(freshFilters()); setPage(1); }}>Сбросить фильтр</button>}</div></td></tr>}
          </tbody>
        </ResizableReportTable>
      </div>
    </div><footer className="report-pagination-footer"><ReportPagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Страницы отчёта по категориям" /></footer>
    {modal === 'rename' && <CategoryDialog title="Переименование отчета" close={close}>
      <form onSubmit={event => {
        event.preventDefault();
        const title = renameTitle.trim();
        if (!title) return;
        const next = { ...report, title };
        setReport(next);
        setReports(current => current.map(item => item.id === next.id ? next : item));
        close();
      }}>
        <label className="catr-rename-label"><span className="catr-field-label">Название</span><input className="catr-rename-input" value={renameTitle} onChange={event => setRenameTitle(event.target.value)} placeholder="Введите название отчета" maxLength={120} autoFocus /></label>
        <footer><button type="button" className="catr-button" onClick={close}>Отменить</button><button type="submit" className="catr-button dark" disabled={!renameTitle.trim()}>Сохранить</button></footer>
      </form>
    </CategoryDialog>}
    {modal === 'filter' && <CategoryFilter value={filters} close={close} apply={next => { setFilters(next); setPage(1); close(); }} />}
    {modal === 'generation' && <GenerationDialog close={close} generate={generate} />}
    {modal === 'schedule' && <AutoGenerationDialog value={schedule} close={close} save={next => { setSchedule(next); localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next)); close(); notify('Настройки автоматической генерации сохранены'); }} />}
    {modal === 'history' && <HistoryDrawer reports={reports} close={close} select={pickReport} />}
    {detail && <CategoryDetail row={detail} report={report} close={() => setDetail(null)} openEmployee={employee => { setDetail(null); if (openEmployee) openEmployee(employee); else notify(`Сотрудник: ${employee}`); }} />}
  </section>;
}
