import { useEffect, useState } from 'react';
import { IconId, IconPlus, IconSearch, IconUsers, IconFilter } from '@tabler/icons-react';
import { DepartmentBadge, DepartmentDialog } from './DepartmentDialog.jsx';
import { DepartmentRow } from './DepartmentRow.jsx';
import { DepartmentList } from './DepartmentList.jsx';
import { MoveEmployeesDialog } from './MoveEmployeesDialog.jsx';
import { EmployeeCheckbox } from './EmployeeCheckbox.jsx';
import { EmployeeCards, EmployeeViewToggle } from './EmployeeCards.jsx';
import { EmployeeRoleBadge } from './EmployeeRole.jsx';
import { EmployeeFilterDialog } from './EmployeeFilterDialog.jsx';
import { EMPTY_EMPLOYEE_FILTERS, filterEmployees } from './settings/employee-filters.js';
import { EMPLOYEE_ROLES_KEY, readEmployeeRoles, changeEmployeeRole } from './settings/employee-roles.js';
import { DEMO_EMPLOYEES_KEY, readOrSeedDemoEmployees } from './settings/demo-employees.js';
import { EMPLOYEE_ASSIGNMENTS_KEY, readEmployeeAssignments, assignEmployees } from './settings/employee-assignments.js';
import { ApiDialog } from './ApiDialog.jsx';
import { createDepartment, updateDepartment, removeDepartment, DEPARTMENT_STORAGE_KEY, readDepartments } from './settings/departments.js';
import './employees-settings.css';

const EMPLOYEES = [{
  id: 'samoilenko',
  name: 'Самойленко Даниил',
  department: '12312',
  source: 'IQ Mentor',
  template: 'Стандартный шаблон оценки качества',
  role: 'Администратор',
}];

export function EmployeesSettings({ notify }) {
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('iq-mentor-employee-view') === 'cards' ? 'cards' : 'table'; } catch { return 'table'; }
  });
  const changeView = (next) => {
    setView(next);
    try { localStorage.setItem('iq-mentor-employee-view', next); } catch { /* View switching remains usable without storage. */ }
  };
  const [assignments, setAssignments] = useState(() => {
    try { return readEmployeeAssignments(localStorage.getItem(EMPLOYEE_ASSIGNMENTS_KEY)); } catch { return {}; }
  });
  const [roles, setRoles] = useState(() => {
    try { return readEmployeeRoles(localStorage.getItem(EMPLOYEE_ROLES_KEY)); } catch { return {}; }
  });
  const [demoEmployees] = useState(() => {
    const existing = EMPLOYEES.map((employee) => ({ ...employee, department: assignments[employee.id] ?? employee.department, role: roles[employee.id] ?? employee.role }));
    try { return readOrSeedDemoEmployees(localStorage.getItem(DEMO_EMPLOYEES_KEY), readDepartments(localStorage.getItem(DEPARTMENT_STORAGE_KEY)), existing); }
    catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(DEMO_EMPLOYEES_KEY, JSON.stringify(demoEmployees)); }
    catch { notify('Не удалось сохранить тестовых сотрудников в браузере'); }
  }, [demoEmployees, notify]);
  const employees = [...EMPLOYEES, ...demoEmployees].map((employee) => ({ ...employee, department: assignments[employee.id] ?? employee.department, role: roles[employee.id] ?? employee.role }));
  const saveRole = (employeeId, roleId) => {
    const next = changeEmployeeRole(roles, employeeId, roleId, employees);
    try { localStorage.setItem(EMPLOYEE_ROLES_KEY, JSON.stringify(next)); }
    catch { throw new Error('Не удалось сохранить роль. Попробуйте ещё раз.'); }
    setRoles(next);
    notify('Роль сотрудника изменена');
  };
  const [movingEmployees, setMovingEmployees] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_EMPLOYEE_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterCount = Object.values(filters).filter(Boolean).length;
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [departments, setDepartments] = useState(() => {
    try { return readDepartments(localStorage.getItem(DEPARTMENT_STORAGE_KEY)); } catch { return readDepartments(null); }
  });
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deletingDepartment, setDeletingDepartment] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [selected, setSelected] = useState([]);
  const visibleDepartments = departments.filter(({ name }) => name.toLocaleLowerCase('ru').includes(departmentQuery.trim().toLocaleLowerCase('ru')));
  const visibleEmployees = filterEmployees(employees, { ...filters, query, department: activeDepartment });
  const persistDepartments = (next) => {
    try { localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error('Не удалось сохранить изменения в браузере. Попробуйте ещё раз.'); }
    setDepartments(next);
  };
  const addDepartment = (name, colorId, iconId) => {
    persistDepartments(createDepartment(departments, name, colorId, crypto.randomUUID(), iconId));
    setDepartmentQuery('');
    setCreatingDepartment(false);
    notify('Отдел создан');
  };
  const editDepartment = (name, colorId, iconId) => {
    persistDepartments(updateDepartment(departments, editingDepartment.id, name, colorId, iconId));
    setEditingDepartment(null);
    setDepartmentQuery('');
    notify('Отдел обновлён');
  };
  const deleteDepartment = () => {
    try {
      persistDepartments(removeDepartment(departments, deletingDepartment.id));
      if (activeDepartment === deletingDepartment.id) setActiveDepartment(null);
      setDeletingDepartment(null);
      setDeleteError('');
      notify('Отдел удалён. Сотрудники сохранены');
    } catch (cause) { setDeleteError(cause.message); }
  };
  const selectEmployee = (id, checked) => setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id));
  const visibleSelectedCount = visibleEmployees.filter((employee) => selected.includes(employee.id)).length;
  const selectVisibleEmployees = (checked) => setSelected((current) => checked
    ? [...new Set([...current, ...visibleEmployees.map((employee) => employee.id)])]
    : current.filter((id) => !visibleEmployees.some((employee) => employee.id === id)));
  const moveSelectedEmployees = (destination) => {
    const next = assignEmployees(assignments, selected, destination, employees, departments);
    try { localStorage.setItem(EMPLOYEE_ASSIGNMENTS_KEY, JSON.stringify(next)); }
    catch { throw new Error('Не удалось сохранить перемещение. Попробуйте ещё раз.'); }
    setAssignments(next);
    setMovingEmployees(false);
    setSelected([]);
    setActiveDepartment(destination || null);
    setQuery('');
    notify(destination ? 'Сотрудники перемещены в отдел' : 'Сотрудники перемещены в «Без отдела»');
  };

  return <section className="employee-directory" aria-labelledby="employee-directory-title">
    <header className="employee-directory-header">
      <div className="employee-directory-heading">
        <h2 id="employee-directory-title">Сотрудники</h2>
        <p className="employee-directory-note" role="note"><IconId size={20} stroke={1.6} aria-hidden="true" /><span>Добавление и удаление сотрудников — в <span className="employee-directory-note-accent">личном кабинете</span></span></p>
      </div>
      <div className="employee-directory-actions">
        <button type="button" className="employee-directory-button" onClick={() => notify('Дубли не найдены')}>
          <IconUsers size={17} aria-hidden="true" />Поиск дублей
        </button>
        <button type="button" className="employee-directory-button is-primary" onClick={() => setCreatingDepartment(true)}>
          <IconPlus size={18} aria-hidden="true" />Создать отдел
        </button>
      </div>
    </header>
    <div className="employee-directory-layout">
      <aside className="employee-departments" aria-labelledby="employee-departments-title">
        <div className="employee-departments-header">
          <h3 id="employee-departments-title">Отделы</h3>
          <label className="employee-directory-search">
            <IconSearch size={16} aria-hidden="true" />
            <input type="search" aria-label="Поиск по отделам" placeholder="Поиск" value={departmentQuery} onChange={(event) => setDepartmentQuery(event.target.value)} />
          </label>
        </div>
        <div className="employee-all-filter">
          <button type="button" className={`employee-department employee-all-button${activeDepartment === null ? ' is-active' : ''}`}
            aria-pressed={activeDepartment === null} onClick={() => setActiveDepartment(null)}>
            <span className="employee-all-label"><IconUsers size={15} stroke={1.7} aria-hidden="true" />Все сотрудники</span><span className="employee-department-count">{employees.length}</span>
          </button>
        </div>
        <DepartmentList activeId={activeDepartment}>
          {visibleDepartments.map((department) => <DepartmentRow key={department.id} department={department}
            active={activeDepartment === department.id} onSelect={() => setActiveDepartment(department.id)}
            count={employees.filter((employee) => employee.department === department.id).length}
            onEdit={() => setEditingDepartment(department)} onDelete={() => { setDeleteError(''); setDeletingDepartment(department); }} />)}
          {!visibleDepartments.length && <p className="employee-directory-muted">Отделы не найдены</p>}
        </DepartmentList>
      </aside>
      <div className="employee-directory-results" role="region" aria-labelledby="employee-results-title">
        <h3 id="employee-results-title" className="employee-results-title">Сотрудники</h3>
        <div className="employee-directory-toolbar">
          <div className="employee-search-controls">
          <button type="button" className={`employee-filter-button${filterCount ? ' is-active' : ''}`} aria-label={`Фильтр сотрудников${filterCount ? `: активно ${filterCount}` : ''}`} aria-haspopup="dialog" title="Фильтр сотрудников" onClick={() => setFilterOpen(true)}>
            <IconFilter size={19} stroke={1.6} aria-hidden="true" />
            {filterCount > 0 && <span className="employee-filter-count" aria-hidden="true">{filterCount}</span>}
          </button>
          <label className="employee-directory-search">
            <IconSearch size={17} aria-hidden="true" />
            <input type="search" aria-label="Поиск сотрудников" placeholder="Поиск" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          </div>
        </div>
        <div className="employee-view-bar">
          <EmployeeViewToggle value={view} onChange={changeView} />
          <span className="employee-directory-count" role="status">Всего сотрудников: {visibleEmployees.length}</span>
        </div>
        <div className={view === 'table' ? 'employee-directory-table-wrap' : 'employee-card-view'}>
          {view === 'table' ? <table className="employee-directory-table" aria-label="Сотрудники компании">
            <colgroup>
              <col className="employee-col-selection" /><col className="employee-col-name" />
              <col className="employee-col-department" /><col className="employee-col-source" />
              <col className="employee-col-template" /><col className="employee-col-role" />
            </colgroup>
            <thead><tr>
              <th scope="col" className="employee-selection-column"><EmployeeCheckbox label="Выбрать всех сотрудников в списке" checked={visibleEmployees.length > 0 && visibleSelectedCount === visibleEmployees.length} mixed={visibleSelectedCount > 0 && visibleSelectedCount < visibleEmployees.length} disabled={!visibleEmployees.length} onChange={selectVisibleEmployees} /></th>
              <th scope="col">Сотрудник</th><th scope="col">Отдел</th>
              <th scope="col">Источник</th><th scope="col">Шаблон</th><th scope="col">Роль</th>
            </tr></thead>
            <tbody>{visibleEmployees.map((employee) => <tr key={employee.id} className={selected.includes(employee.id) ? 'is-selected' : ''}>
              <td className="employee-selection-column"><EmployeeCheckbox label={`Выбрать сотрудника: ${employee.name}`} checked={selected.includes(employee.id)} onChange={(checked) => selectEmployee(employee.id, checked)} /></td>
              <th scope="row" className="employee-name">{employee.name}</th>
              <td data-label="Отдел">{departments.some((department) => department.id === employee.department)
                ? <DepartmentBadge department={departments.find((department) => department.id === employee.department)} />
                : <span className="employee-without-department">Без отдела</span>}</td>
              <td data-label="Источник"><span className="employee-source-badge">{employee.source}</span></td>
              <td data-label="Шаблон" className="employee-template">{employee.template}</td>
              <td data-label="Роль"><EmployeeRoleBadge value={employee.role} employeeName={employee.name} onChange={(roleId) => saveRole(employee.id, roleId)} /></td>
            </tr>)}</tbody>
          </table> : <EmployeeCards employees={visibleEmployees} departments={departments} selected={selected} onSelectAll={selectVisibleEmployees} onChangeRole={saveRole} />}
          {!visibleEmployees.length && <div className="employee-directory-empty" role="status">
            <IconUsers size={24} stroke={1.5} aria-hidden="true" />
            <p>{query.trim() || filterCount ? 'Сотрудники не найдены' : 'В этом отделе пока нет сотрудников'}</p>
            <button type="button" onClick={() => { setQuery(''); setActiveDepartment(null); setFilters(EMPTY_EMPLOYEE_FILTERS); }}>Показать всех сотрудников</button>
          </div>}
        </div>
        {selected.length > 0 && <div className="employee-selection-actions" role="region" aria-label="Действия с выбранными сотрудниками">
          <span role="status">Выбрано: {selected.length}</span>
          <div><button type="button" onClick={() => setSelected([])}>Снять выделение</button><button type="button" onClick={() => setMovingEmployees(true)}>Переместить в отдел</button></div>
        </div>}
      </div>
    </div>
    {filterOpen && <EmployeeFilterDialog value={filters} employees={employees} close={() => setFilterOpen(false)} onApply={(next) => { setFilters(next); setFilterOpen(false); }} onReset={() => { setFilters(EMPTY_EMPLOYEE_FILTERS); setFilterOpen(false); }} />}
    {movingEmployees && <MoveEmployeesDialog count={selected.length} departments={departments} close={() => setMovingEmployees(false)} onMove={moveSelectedEmployees} />}
    {creatingDepartment && <DepartmentDialog close={() => setCreatingDepartment(false)} onCreate={addDepartment} />}
    {editingDepartment && <DepartmentDialog department={editingDepartment} close={() => setEditingDepartment(null)} onCreate={editDepartment} />}
    {deletingDepartment && <ApiDialog title="Удалить отдел?" closeLabel="Закрыть удаление отдела" close={() => setDeletingDepartment(null)} className="department-delete-dialog">
      <p className="api-record-note">Отдел «{deletingDepartment.name}» будет удалён. Его сотрудники останутся в списке с пометкой «Без отдела».</p>
      {deleteError && <p className="api-record-error" role="alert">{deleteError}</p>}
      <footer><button type="button" className="light-button" onClick={() => setDeletingDepartment(null)}>Отменить</button><button type="button" className="dark-button" onClick={deleteDepartment}>Удалить отдел</button></footer>
    </ApiDialog>}
  </section>;
}
