import { DepartmentBadge } from './DepartmentDialog.jsx';
import { EmployeeRoleBadge } from './EmployeeRole.jsx';

export function EmployeeViewToggle({ value, onChange }) {
  return <div className="employee-view-toggle" role="group" aria-label="Вид списка сотрудников">
    {[['table', 'Таблица'], ['cards', 'Карточки']].map(([view, label]) => <button key={view} type="button" aria-label={label} title={label} aria-pressed={value === view} onClick={() => onChange(view)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {view === 'table' ? <>
          <path d="M3 8V7a4 4 0 0 1 4-4h1v5H3Zm6.5-5H17a4 4 0 0 1 4 4v1H9.5V3ZM3 9.5h5V21H7a4 4 0 0 1-4-4V9.5Zm6.5 0H21V17a4 4 0 0 1-4 4H9.5V9.5Z" />
        </> : <><rect x="3" y="3" width="8" height="8" rx="2.5" /><rect x="13" y="3" width="8" height="8" rx="2.5" /><rect x="3" y="13" width="8" height="8" rx="2.5" /><rect x="13" y="13" width="8" height="8" rx="2.5" /></>}
      </svg>
      <span>{label}</span>
    </button>)}
  </div>;
}

export function EmployeeCards({ employees, departments, selected, onChangeRole, display }) {
  return <>
    <ul className="employee-cards-grid" aria-label="Карточки сотрудников">
      {employees.map((employee) => {
        const department = departments.find((item) => item.id === employee.department);
        const initials = employee.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');
        return <li key={employee.id} className={`employee-card${selected.includes(employee.id) ? ' is-selected' : ''}`}>
          <div className="employee-card-header">
            <span className="employee-card-avatar" aria-hidden="true">{initials}</span>
            <div className="employee-card-identity"><h4>{employee.name}</h4>{display.role && <div className="employee-card-role"><EmployeeRoleBadge value={employee.role} employeeName={employee.name} onChange={(roleId) => onChangeRole(employee.id, roleId)} /></div>}</div>
          </div>
          {(display.department || display.source || display.template) && <dl className="employee-card-fields">
            {display.department && <div><dt>Отдел</dt><dd>{department ? <DepartmentBadge department={department} /> : <span className="employee-without-department">Без отдела</span>}</dd></div>}
            {display.source && <div><dt>Источник</dt><dd><span className="employee-source-badge" data-source={employee.source}>{employee.source}</span></dd></div>}
            {display.template && <div className={`employee-card-template${!display.department && !display.source ? ' is-only-field' : ''}`}><dt>Шаблон</dt><dd>{employee.template}</dd></div>}
          </dl>}
        </li>;
      })}
    </ul>
  </>;
}
