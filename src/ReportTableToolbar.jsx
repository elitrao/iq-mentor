import { useEffect, useId, useRef, useState } from 'react';
import filterIcon from './assets/calls-report/filter.svg';
import './report-common.css';

export function ReportTableToolbar({ filtered, onFilter, pageSize, onPageSize, count }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null), menuId = useId();
  useEffect(() => {
    if (!open) return;
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  return <div className="report-table-toolbar">
    <button type="button" className={`report-filter-button${filtered ? ' is-active' : ''}`} aria-label="Фильтр" title="Фильтр" onClick={onFilter}>
      <span className="report-action-icon" style={{ '--report-icon': `url("${filterIcon}")` }} aria-hidden="true" />
    </button>
    <div className="report-table-counts">
      <div className="report-page-size" ref={root} onKeyDown={event => { if (open && event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
        На странице по: <button ref={trigger} type="button" aria-label="Количество строк на странице" aria-expanded={open} aria-haspopup="menu" aria-controls={menuId} onClick={() => setOpen(!open)}>{pageSize}</button>
        {open && <div className="report-size-menu" id={menuId} role="menu" aria-label="Количество строк">
          {[10, 25, 50, 100].map(size => <button key={size} type="button" role="menuitemradio" aria-checked={size === pageSize} onClick={() => { onPageSize(size); setOpen(false); trigger.current?.focus(); }}>{size}</button>)}
        </div>}
      </div>
      <span aria-live="polite">Всего строк: {count}</span>
    </div>
  </div>;
}
