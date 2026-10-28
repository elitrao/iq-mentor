import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

export function ApiCreatedAtHeader({ label, direction, onChange }) {
  const descending = direction === 'desc';
  const Arrow = descending ? IconArrowDown : IconArrowUp;
  const nextOrder = descending ? 'сначала старые' : 'сначала новые';
  return <th scope="col" aria-sort={descending ? 'descending' : 'ascending'}>
    <button type="button" className="api-created-sort" aria-label={`Сортировать по дате создания: ${nextOrder}`} title={`${descending ? 'Сначала новые' : 'Сначала старые'}. Нажмите — ${nextOrder}`} onClick={() => onChange(descending ? 'asc' : 'desc')}>
      <span>{label}</span><Arrow size={16} stroke={1.7} aria-hidden="true" />
    </button>
  </th>;
}
