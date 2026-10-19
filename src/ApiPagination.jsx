import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export function ApiPagination({ pagination, onChange }) {
  const { page, pageCount, total, start, end } = pagination;
  if (pageCount <= 1) return null;
  return <div className="api-pagination">
    <span role="status">{start}–{end} из {total}</span>
    <nav aria-label="Страницы таблицы">
      <button type="button" aria-label="Предыдущая страница" disabled={page === 1} onClick={() => onChange(page - 1)}><IconChevronLeft size={17} aria-hidden="true" /></button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" aria-label={`Страница ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>)}
      <button type="button" aria-label="Следующая страница" disabled={page === pageCount} onClick={() => onChange(page + 1)}><IconChevronRight size={17} aria-hidden="true" /></button>
    </nav>
  </div>;
}
