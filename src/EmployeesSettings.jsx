import { useState } from 'react';
import { IconId, IconPlus, IconSearch, IconUsers } from '@tabler/icons-react';
import { DepartmentBadge, DepartmentDialog } from './DepartmentDialog.jsx';
import { DepartmentRow } from './DepartmentRow.jsx';
import { DepartmentList } from './DepartmentList.jsx';
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
  const [query, setQuery] = useState('');
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
  const visibleEmployees = EMPLOYEES.filter((employee) =>
    (!activeDepartment || employee.department === activeDepartment)
    && employee.name.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
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
            <span className="employee-all-label"><IconUsers size={15} stroke={1.7} aria-hidden="true" />Все сотрудники</span><span className="employee-department-count">{EMPLOYEES.length}</span>
          </button>
        </div>
        <DepartmentList activeId={activeDepartment}>
          {visibleDepartments.map((department) => <DepartmentRow key={department.id} department={department}
            active={activeDepartment === department.id} onSelect={() => setActiveDepartment(department.id)}
            count={EMPLOYEES.filter((employee) => employee.department === department.id).length}
            onEdit={() => setEditingDepartment(department)} onDelete={() => { setDeleteError(''); setDeletingDepartment(department); }} />)}
          {!visibleDepartments.length && <p className="employee-directory-muted">Отделы не найдены</p>}
        </DepartmentList>
      </aside>
      <div className="employee-directory-results" role="region" aria-labelledby="employee-results-title">
        <h3 id="employee-results-title" className="employee-results-title">Сотрудники</h3>
        <div className="employee-directory-toolbar">
          <label className="employee-directory-search">
            <IconSearch size={17} aria-hidden="true" />
            <input type="search" aria-label="Поиск сотрудников" placeholder="Поиск" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <span className="employee-directory-count" role="status">Всего сотрудников: {visibleEmployees.length}</span>
        </div>
        <div className="employee-directory-table-wrap">
          <table className="employee-directory-table" aria-label="Сотрудники компании">
            <thead><tr>
              <th scope="col" className="employee-selection-column"><span className="employee-visually-hidden">Выбор</span></th>
              <th scope="col">ФИО сотрудника</th><th scope="col">Отдел</th>
              <th scope="col">Источник</th><th scope="col">Привязанный шаблон</th><th scope="col">Роль</th>
            </tr></thead>
            <tbody>{visibleEmployees.map((employee) => <tr key={employee.id} className={selected.includes(employee.id) ? 'is-selected' : ''}>
              <td className="employee-selection-column"><label className="employee-row-select">
                <input type="checkbox" aria-label={`Выбрать сотрудника: ${employee.name}`} checked={selected.includes(employee.id)} onChange={(event) => selectEmployee(employee.id, event.target.checked)} />
              </label></td>
              <th scope="row" className="employee-name">{employee.name}</th>
              <td data-label="Отдел">{departments.some((department) => department.id === employee.department)
                ? <DepartmentBadge department={departments.find((department) => department.id === employee.department)} />
                : <span className="employee-without-department">Без отдела</span>}</td>
              <td data-label="Источник"><span className="employee-source-badge">{employee.source}</span></td>
              <td data-label="Привязанный шаблон" className="employee-template">{employee.template}</td>
              <td data-label="Роль">{employee.role}</td>
            </tr>)}</tbody>
          </table>
          {!visibleEmployees.length && <div className="employee-directory-empty" role="status">
            <IconUsers size={24} stroke={1.5} aria-hidden="true" />
            <p>{query.trim() ? 'Сотрудники не найдены' : 'В этом отделе пока нет сотрудников'}</p>
            <button type="button" onClick={() => { setQuery(''); setActiveDepartment(null); }}>Показать всех сотрудников</button>
          </div>}
        </div>
      </div>
    </div>
    {creatingDepartment && <DepartmentDialog close={() => setCreatingDepartment(false)} onCreate={addDepartment} />}
    {editingDepartment && <DepartmentDialog department={editingDepartment} close={() => setEditingDepartment(null)} onCreate={editDepartment} />}
    {deletingDepartment && <ApiDialog title="Удалить отдел?" closeLabel="Закрыть удаление отдела" close={() => setDeletingDepartment(null)} className="department-delete-dialog">
      <p className="api-record-note">Отдел «{deletingDepartment.name}» будет удалён. Его сотрудники останутся в списке с пометкой «Без отдела».</p>
      {deleteError && <p className="api-record-error" role="alert">{deleteError}</p>}
      <footer><button type="button" className="light-button" onClick={() => setDeletingDepartment(null)}>Отменить</button><button type="button" className="dark-button" onClick={deleteDepartment}>Удалить отдел</button></footer>
    </ApiDialog>}
  </section>;
}
