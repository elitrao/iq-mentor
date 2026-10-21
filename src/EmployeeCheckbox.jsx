import { useLayoutEffect, useRef } from 'react';
import { IconCheck, IconMinus } from '@tabler/icons-react';

export function EmployeeCheckbox({ label, checked, mixed = false, disabled = false, onChange }) {
  const input = useRef(null);
  useLayoutEffect(() => { input.current.indeterminate = mixed; }, [mixed]);
  return <label className="employee-row-select">
    <input ref={input} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <span aria-hidden="true">{mixed ? <IconMinus size={11} stroke={2.3} /> : <IconCheck size={11} stroke={2.3} />}</span>
  </label>;
}
