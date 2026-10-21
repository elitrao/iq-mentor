import { useState } from 'react';
import { IconDownload, IconFile, IconUser, IconChevronDown } from '@tabler/icons-react';
import { ApiDialog } from './ApiDialog.jsx';
import { EMPLOYEE_ROLES } from './settings/employee-roles.js';

export function EmployeeFilterDialog({ value, employees, close, onApply, onReset }) {
  const [draft, setDraft] = useState(value);
  const unique = (field) => [...new Set(employees.map((employee) => employee[field]))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'));
  const fields = [
    { key: 'source', label: 'Источник', placeholder: 'Выберите источник', Icon: IconDownload, options: unique('source').map((name) => ({ id: name, label: name })) },
    { key: 'template', label: 'Шаблон', placeholder: 'Выберите шаблон', Icon: IconFile, options: unique('template').map((name) => ({ id: name, label: name })) },
    { key: 'role', label: 'Роль', placeholder: 'Выберите роль', Icon: IconUser, options: EMPLOYEE_ROLES },
  ];
  return <ApiDialog title="Фильтр" closeLabel="Закрыть фильтр сотрудников" close={close} className="employee-filter-dialog">
    <form onSubmit={(event) => { event.preventDefault(); onApply(draft); }}>
      <div className="employee-filter-fields">
        {fields.map(({ key, label, placeholder, Icon, options }) => <label className="employee-filter-field" key={key}>
          <span>{label}</span>
          <span className={`employee-filter-select${draft[key] ? ' has-value' : ''}`}>
            <Icon size={18} stroke={1.5} aria-hidden="true" />
            <select aria-label={label} autoFocus={key === 'source'} value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}>
              <option value="">{placeholder}</option>
              {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <IconChevronDown size={16} stroke={1.5} aria-hidden="true" />
          </span>
        </label>)}
      </div>
      <footer><button type="button" className="light-button" onClick={onReset}>Сбросить</button><button type="submit" className="dark-button">Применить</button></footer>
    </form>
  </ApiDialog>;
}
