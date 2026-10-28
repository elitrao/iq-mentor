import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import './report-pagination.css';

export function ReportPagination({ page, pageCount, onChange, label = 'Страницы отчёта' }) {
  const last = Math.max(1, pageCount);
  const current = Math.max(1, Math.min(page, last));
  const start = Math.max(2, Math.min(current - 1, last - 3));
  const end = Math.min(last - 1, Math.max(current + 1, 4));
  const pages = last <= 7
    ? Array.from({ length: last }, (_, index) => index + 1)
    : [1, ...(start > 2 ? ['before'] : []), ...Array.from({ length: end - start + 1 }, (_, index) => start + index), ...(end < last - 1 ? ['after'] : []), last];

  return <nav className="report-pagination" aria-label={label}>
    <button type="button" className="report-page-button" aria-label="Предыдущая страница" disabled={current === 1} onClick={() => onChange(current - 1)}><IconChevronLeft size={18} stroke={1.6} /></button>
    {pages.map(number => typeof number === 'number'
      ? <button type="button" className="report-page-button" key={number} aria-label={`Страница ${number}`} aria-current={number === current ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>
      : <span className="report-page-gap" key={number} aria-hidden="true">…</span>)}
    <button type="button" className="report-page-button" aria-label="Следующая страница" disabled={current === last} onClick={() => onChange(current + 1)}><IconChevronRight size={18} stroke={1.6} /></button>
  </nav>;
}
