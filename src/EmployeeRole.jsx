import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconUser, IconShieldCheck, IconChevronDown, IconCheck } from '@tabler/icons-react';
import { EMPLOYEE_ROLES, employeeRole } from './settings/employee-roles.js';

function RoleContent({ role }) {
  const Icon = role.icon === 'shield' ? IconShieldCheck : IconUser;
  return <><Icon size={13} stroke={1.7} aria-hidden="true" /><span>{role.label}</span></>;
}

export function EmployeeRoleBadge({ value, employeeName, onChange }) {
  const role = employeeRole(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const trigger = useRef(null);
  const menu = useRef(null);
  const options = useRef([]);
  const menuId = useId();
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = trigger.current.getBoundingClientRect();
      const box = menu.current.getBoundingClientRect();
      setPosition({
        left: Math.max(8, Math.min(anchor.left, window.innerWidth - box.width - 8)),
        top: Math.max(8, anchor.bottom + box.height + 6 <= window.innerHeight - 8 ? anchor.bottom + 6 : anchor.top - box.height - 6),
      });
    };
    place();
    const outside = (event) => {
      if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open, error]);
  useLayoutEffect(() => {
    if (open) options.current[EMPLOYEE_ROLES.findIndex((item) => item.id === role.id)]?.focus();
  }, [open]);
  const choose = (id) => {
    try {
      if (id !== role.id) onChange(id);
      close(true);
    } catch (cause) { setError(cause.message); }
  };
  return <>
    <button ref={trigger} type="button" className="employee-role-badge" style={{ backgroundColor: role.background, color: role.color }}
      aria-label={`Изменить роль: ${employeeName}. Текущая роль: ${role.label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      title="Изменить роль" onClick={() => { setError(''); setOpen(!open); }}
      onKeyDown={(event) => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setError(''); setOpen(true); } }}>
      <RoleContent role={role} /><IconChevronDown size={11} stroke={1.7} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={menu} className="employee-role-popover" style={position}>
      <div id={menuId} role="menu" aria-label={`Роль сотрудника: ${employeeName}`} onKeyDown={(event) => {
        const current = options.current.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
        if (event.key === 'Tab') close(true);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? EMPLOYEE_ROLES.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + EMPLOYEE_ROLES.length) % EMPLOYEE_ROLES.length;
          options.current[next]?.focus();
        }
      }}>
        {EMPLOYEE_ROLES.map((item, index) => <button key={item.id} ref={(node) => { options.current[index] = node; }} type="button" role="menuitemradio" aria-checked={item.id === role.id} tabIndex={-1} onClick={() => choose(item.id)}>
          <span className="employee-role-badge" style={{ backgroundColor: item.background, color: item.color }}><RoleContent role={item} /></span>
          {item.id === role.id && <IconCheck size={14} stroke={1.8} aria-hidden="true" />}
        </button>)}
      </div>
      {error && <p className="employee-role-error" role="alert">{error}</p>}
    </div>, document.body)}
  </>;
}
