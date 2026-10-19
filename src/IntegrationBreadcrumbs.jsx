import { IconChevronRight } from '@tabler/icons-react';
import './integration-breadcrumbs.css';

export function IntegrationBreadcrumbs({ items, parentRef }) {
  return <nav className="integration-breadcrumbs" aria-label="Хлебные крошки"><ol>
    {items.map((item, index) => <li key={index}>
      {index > 0 && <IconChevronRight size={16} stroke={1.5} aria-hidden="true" />}
      {index === items.length - 1
        ? <span aria-current="page">{item.label}</span>
        : <button ref={index === items.length - 2 ? parentRef : undefined} type="button" onClick={item.onClick}>{item.label}</button>}
    </li>)}
  </ol></nav>;
}
