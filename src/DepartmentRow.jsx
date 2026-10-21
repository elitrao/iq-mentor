import { useEffect, useRef, useState } from 'react';
import { IconDotsVertical, IconPencil, IconTrash } from '@tabler/icons-react';
import { DepartmentBadge } from './DepartmentDialog.jsx';

export function DepartmentRow({ department, count, active, onSelect, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const firstAction = useRef(null);
  useEffect(() => {
    if (!open) return;
    firstAction.current?.focus();
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div ref={root} data-department-id={department.id} className={`employee-department-row${active ? ' is-active' : ''}`}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => { if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    <button type="button" className="employee-department" aria-pressed={active} onClick={onSelect}><DepartmentBadge department={department} /><span className="employee-department-count">{count}</span></button>
    <button type="button" ref={trigger} className="department-more" aria-label={`Действия отдела «${department.name}»`} aria-expanded={open} onClick={() => setOpen(!open)}><IconDotsVertical size={16} aria-hidden="true" /></button>
    {open && <div className="department-actions-popover" role="group" aria-label={`Действия отдела «${department.name}»`}>
      <button type="button" ref={firstAction} onClick={() => { setOpen(false); trigger.current?.focus(); onEdit(); }}><IconPencil size={16} aria-hidden="true" />Редактировать</button>
      <button type="button" className="is-destructive" onClick={() => { setOpen(false); trigger.current?.focus(); onDelete(); }}><IconTrash size={16} aria-hidden="true" />Удалить</button>
    </div>}
  </div>;
}
