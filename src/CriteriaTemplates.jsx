import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconChevronRight, IconPlus, IconPlusMinus, IconStar, IconUser, IconX } from '@tabler/icons-react';
import { CRITERIA_EMPLOYEES, createCriteriaTemplates, getCriteriaTemplateStats, makeCriteriaTemplate, updateCriteriaTemplate } from './settings/criteria-templates.js';
import './criteria-templates.css';

function GroupCheckbox({ rows, label, onChange }) {
  const ref = useRef(null);
  const count = rows.filter((row) => row.enabled).length;
  useLayoutEffect(() => { ref.current.indeterminate = count > 0 && count < rows.length; }, [count, rows.length]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={rows.length > 0 && count === rows.length} disabled={!rows.length} onChange={(event) => onChange(event.target.checked)} />;
}

function CriteriaDialog({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="criteria-dialog" aria-labelledby="criteria-dialog-title" onCancel={close}>
    <header><h2 id="criteria-dialog-title">{title}</h2><button type="button" aria-label="Закрыть окно" onClick={close}><IconX size={19} /></button></header>{children}
  </dialog>;
}

function TemplateDialog({ close, create }) {
  const [name, setName] = useState('');
  return <CriteriaDialog title="Создать шаблон" close={close}><form onSubmit={(event) => { event.preventDefault(); if (name.trim()) create(name.trim()); }}>
    <label>Название шаблона<input autoFocus required pattern=".*\S.*" value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, входящие звонки" /></label>
    <footer><button type="button" className="light-button" onClick={close}>Отмена</button><button type="submit" className="dark-button">Создать шаблон</button></footer>
  </form></CriteriaDialog>;
}

function CategoryDialog({ category, close, save }) {
  const [draft, setDraft] = useState(category || { name: '', description: '', type: 'percent', enabled: true });
  return <CriteriaDialog title={category ? 'Настройка категории' : 'Новая категория'} close={close}><form onSubmit={(event) => { event.preventDefault(); if (draft.name.trim()) save({ ...draft, name: draft.name.trim(), description: draft.description.trim() }); }}>
    <label>Название категории<input autoFocus required pattern=".*\S.*" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
    <label>Что оценивать<textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Опишите правило оценки" /></label>
    <label>Формат результата<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="percent">Текст и процент</option><option value="text">Текст</option><option value="binary">Да / нет</option></select></label>
    <footer><button type="button" className="light-button" onClick={close}>Отмена</button><button type="submit" className="dark-button">Сохранить категорию</button></footer>
  </form></CriteriaDialog>;
}

function EmployeesDialog({ ids, close, save }) {
  const [selected, setSelected] = useState(new Set(ids));
  const [query, setQuery] = useState('');
  const employees = CRITERIA_EMPLOYEES.filter((employee) => employee.name.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru').trim()));
  return <CriteriaDialog title="Привязка сотрудников" close={close}><form onSubmit={(event) => { event.preventDefault(); save([...selected]); }}>
    <label>Поиск сотрудника<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ФИО сотрудника" /></label>
    <div className="criteria-employee-options">{employees.map((employee) => <label key={employee.id}><input type="checkbox" checked={selected.has(employee.id)} onChange={(event) => { const next = new Set(selected); if (event.target.checked) next.add(employee.id); else next.delete(employee.id); setSelected(next); }} /><span>{employee.name}</span></label>)}{!employees.length && <p>Сотрудники не найдены</p>}</div>
    <footer><span className="criteria-selected-count">Выбрано: {selected.size}</span><button type="button" className="light-button" onClick={close}>Отмена</button><button type="submit" className="dark-button">Привязать</button></footer>
  </form></CriteriaDialog>;
}

export function CriteriaTemplates({ settings, update, notify }) {
  const [model, setModel] = useState(() => settings.criteriaTemplates?.templates?.length ? structuredClone(settings.criteriaTemplates) : createCriteriaTemplates(settings.criteria));
  const [dialog, setDialog] = useState(null);
  const selected = model.templates.find((template) => template.id === model.selectedId) || model.templates[0];
  const commit = (next) => { setModel(next); update((settingsDraft) => { settingsDraft.criteriaTemplates = structuredClone(next); }); };
  const changeTemplate = (change) => commit(updateCriteriaTemplate(model, selected.id, change));
  const employeeIds = new Set(selected.employees);
  const close = () => setDialog(null);
  return <div className="criteria-templates">
    <aside className="criteria-template-list criteria-panel" aria-label="Список шаблонов">
      <h3>Список шаблонов</h3><div className="criteria-template-scroll">{model.templates.map((template) => { const stats = getCriteriaTemplateStats(template); return <button type="button" key={template.id} className={`criteria-template-item${selected.id === template.id ? ' selected' : ''}`} aria-pressed={selected.id === template.id} aria-label={template.name} title={template.name} onClick={() => commit({ ...model, selectedId: template.id })}>
        <span>{template.name}</span><small><IconStar size={14} />{stats.enabled}/{stats.total}</small><small><IconUser size={14} />{stats.employees}</small>
      </button>; })}</div>
      <button type="button" className="criteria-create" onClick={() => setDialog({ type: 'template' })}><IconPlus size={20} />Создать</button>
    </aside>
    <section className="criteria-category-panel criteria-panel" aria-label="Категории шаблона">
      <h3>{selected.name}</h3><div className="criteria-category-columns">{[['system', 'Системные категории'], ['custom', 'Пользовательские категории']].map(([key, title]) => <section key={key} className="criteria-category-group" aria-label={title}>
        <header><label><GroupCheckbox rows={selected[key]} label={`Выбрать все: ${title.toLowerCase()}`} onChange={(enabled) => changeTemplate((template) => { template[key].forEach((category) => { category.enabled = enabled; }); })} /><strong>{title}</strong></label>{key === 'custom' && <button type="button" className="criteria-add-category" aria-label="Добавить пользовательскую категорию" onClick={() => setDialog({ type: 'category', group: key })}><IconPlus size={19} /></button>}</header>
        <div className="criteria-category-scroll">{selected[key].map((category) => <div className="criteria-category-row" key={category.id}>
          <label><input type="checkbox" aria-label={`Оценивать: ${category.name}`} checked={category.enabled} onChange={(event) => changeTemplate((template) => { template[key].find((entry) => entry.id === category.id).enabled = event.target.checked; })} /><span title={category.name}>{category.name}</span></label>
          <button type="button" className="criteria-category-edit" aria-label={`Настроить категорию: ${category.name}`} onClick={() => setDialog({ type: 'category', group: key, category })}><IconChevronRight size={17} /></button>
          <span className="criteria-category-format" title={{ percent: 'Текст и процент', text: 'Текст', binary: 'Да / нет' }[category.type]}>{category.type === 'binary' ? <IconPlusMinus size={17} /> : category.type === 'text' ? 'Aa' : 'Aa %'}</span>
        </div>)}{!selected[key].length && <p className="criteria-empty">Добавьте категорию для этого шаблона.</p>}</div>
      </section>)}</div>
    </section>
    <aside className="criteria-bindings criteria-panel" aria-label="Привязка сотрудников">
      <h3>Привязка сотрудников</h3><div className="criteria-binding-scroll">{CRITERIA_EMPLOYEES.filter((employee) => employeeIds.has(employee.id)).map((employee) => <div key={employee.id} title={employee.name}>{employee.name}</div>)}{!employeeIds.size && <p className="criteria-empty">К шаблону пока не привязаны сотрудники.</p>}</div>
      <button type="button" className="criteria-bind" onClick={() => setDialog({ type: 'employees' })}><IconPlus size={20} />Добавить</button>
    </aside>
    {dialog?.type === 'template' && <TemplateDialog close={close} create={(name) => { const template = makeCriteriaTemplate(crypto.randomUUID(), name, { userCategories: false }); commit({ selectedId: template.id, templates: [...model.templates, template] }); close(); notify('Шаблон создан'); }} />}
    {dialog?.type === 'category' && <CategoryDialog category={dialog.category} close={close} save={(category) => { changeTemplate((template) => { if (dialog.category) template[dialog.group] = template[dialog.group].map((entry) => entry.id === category.id ? category : entry); else template.custom.push({ ...category, id: crypto.randomUUID() }); }); close(); notify('Категория сохранена'); }} />}
    {dialog?.type === 'employees' && <EmployeesDialog ids={selected.employees} close={close} save={(ids) => { changeTemplate((template) => { template.employees = ids; }); close(); notify('Привязка сотрудников сохранена'); }} />}
  </div>;
}
