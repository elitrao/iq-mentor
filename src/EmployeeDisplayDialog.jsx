import { useState } from 'react';
import { ApiDialog } from './ApiDialog.jsx';
import { EmployeeCheckbox } from './EmployeeCheckbox.jsx';
import { EMPLOYEE_DISPLAY_FIELDS, DEFAULT_EMPLOYEE_DISPLAY } from './settings/employee-display.js';

export function EmployeeDisplayDialog({ value, onChange, close }) {
  const [error, setError] = useState('');
  const selectedCount = EMPLOYEE_DISPLAY_FIELDS.filter(({ id }) => value[id]).length;
  const update = (next) => {
    try { onChange(next); setError(''); }
    catch (cause) { setError(cause.message); }
  };
  return <ApiDialog title="Настройки отображения" closeLabel="Закрыть настройки отображения" close={close} className="employee-display-dialog">
    <div className="employee-display-group">
      <EmployeeCheckbox label="Показать все параметры сотрудника" caption="Параметры сотрудника" checked={selectedCount === EMPLOYEE_DISPLAY_FIELDS.length} mixed={selectedCount > 0 && selectedCount < EMPLOYEE_DISPLAY_FIELDS.length} onChange={(checked) => update(Object.fromEntries(EMPLOYEE_DISPLAY_FIELDS.map(({ id }) => [id, checked])))} />
    </div>
    <div className="employee-display-options">
      {EMPLOYEE_DISPLAY_FIELDS.map(({ id, label }) => <div key={id} className={value[id] ? 'is-visible' : ''}>
        <EmployeeCheckbox label={`Показывать: ${label}`} caption={label} checked={value[id]} onChange={(checked) => update({ ...value, [id]: checked })} />
      </div>)}
    </div>
    <p className="employee-display-note">Имя сотрудника отображается всегда. Настройки общие для таблицы и карточек.</p>
    {error && <p className="api-record-error" role="alert">{error}</p>}
    <button type="button" className="employee-display-reset" onClick={() => update({ ...DEFAULT_EMPLOYEE_DISPLAY })}>Показать всё</button>
  </ApiDialog>;
}
