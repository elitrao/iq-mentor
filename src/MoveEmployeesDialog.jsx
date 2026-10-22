import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown, IconFolder } from '@tabler/icons-react';
import { ApiDialog } from './ApiDialog.jsx';
import { DepartmentBadge } from './DepartmentDialog.jsx';

export function MoveEmployeesDialog({ count, selectedEmployees = [], departments, close, onMove }) {
  const [destination, setDestination] = useState(undefined);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const options = [{ id: '', name: 'Без отдела', colorId: 'gray', iconId: 'none' }, ...departments];
  const selectedDepartment = options.find((department) => department.id === destination);
  const selectedLabel = selectedEmployees.length === 1
    ? selectedEmployees[0].name
    : selectedEmployees.length > 1 ? `Выбрано сотрудников: ${selectedEmployees.length}` : `Выбрано сотрудников: ${count}`;

  useEffect(() => {
    if (!open) return;
    const selected = optionsRef.current?.querySelector('[aria-selected="true"]');
    (selected || optionsRef.current?.querySelector('[role="option"]'))?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const dismissOutside = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [open]);

  const closePicker = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const chooseDepartment = (department) => {
    setDestination(department.id);
    setError('');
    closePicker(true);
  };
  const handleOptionKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePicker(true); return; }
    if (nextIndex !== undefined) {
      event.preventDefault();
      optionsRef.current?.querySelectorAll('[role="option"]')[nextIndex]?.focus();
    }
  };

  return <ApiDialog title="Переместить в отдел" closeLabel="Закрыть перемещение сотрудников" close={close} onCancel={() => open ? closePicker() : close()} className="employee-move-dialog">
    <form onSubmit={(event) => { event.preventDefault(); try { onMove(destination); } catch (cause) { setError(cause.message); } }}>
      <p className="employee-move-selected" title={selectedLabel}>{selectedLabel}</p>
      <div className="employee-move-field" ref={pickerRef}>
        <label htmlFor="employee-move-department">Отдел</label>
        <button
          ref={triggerRef}
          id="employee-move-department"
          type="button"
          className={`employee-move-trigger${open ? ' is-open' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="employee-move-options"
          aria-label={selectedDepartment ? `Отдел: ${selectedDepartment.name}` : 'Выберите отдел'}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
          }}
        >
          <IconFolder size={20} stroke={1.6} aria-hidden="true" />
          {selectedDepartment ? (selectedDepartment.id ? <DepartmentBadge department={selectedDepartment} /> : <span>Без отдела</span>) : <span className="is-placeholder">Выберите отдел</span>}
          <IconChevronDown className="employee-move-chevron" size={18} stroke={1.6} aria-hidden="true" />
        </button>
        {open && <div id="employee-move-options" ref={optionsRef} className="employee-move-options" role="listbox" aria-label="Выберите отдел">
          {options.map((department, index) => <button
            key={department.id || 'unassigned'}
            type="button"
            role="option"
            aria-selected={destination === department.id}
            onClick={() => chooseDepartment(department)}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
          >
            {department.id ? <DepartmentBadge department={department} /> : <span>Без отдела</span>}
            {destination === department.id && <IconCheck size={16} aria-hidden="true" />}
          </button>)}
        </div>}
      </div>
      {error && <p className="api-record-error" role="alert">{error}</p>}
      <footer><button type="button" className="light-button" onClick={close}>Отменить</button><button type="submit" className="dark-button" disabled={destination === undefined}>Подтвердить</button></footer>
    </form>
  </ApiDialog>;
}
