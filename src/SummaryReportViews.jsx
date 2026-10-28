import { IconTable, IconLayoutGrid, IconPhone, IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react';
import { FeedbackSelect } from './FeedbackSelect.jsx';
import { ReportEmployeeAvatar } from './ReportEmployeeAvatar.jsx';
import { ReportScore } from './ReportScore.jsx';
import './summary-report-views.css';

const sortOptions = [
  { value: 'По умолчанию', icon: IconArrowsSort, sort: null },
  { value: 'Оценка: по убыванию', icon: IconArrowDown, sort: { key: 'score', direction: -1 } },
  { value: 'Оценка: по возрастанию', icon: IconArrowUp, sort: { key: 'score', direction: 1 } },
  { value: 'Имя: А–Я', icon: IconArrowUp, sort: { key: 'name', direction: 1 } },
  { value: 'Имя: Я–А', icon: IconArrowDown, sort: { key: 'name', direction: -1 } },
];

export function SummaryReportViewControls({ view, onView, sort, onSort }) {
  const selectedSort = sortOptions.find(option => option.sort?.key === sort?.key && option.sort?.direction === sort?.direction) || sortOptions[0];
  return <>
    <div className="sr-view-switch" role="group" aria-label="Вид сводного отчёта">
      {[
        { value: 'table', label: 'Таблица 1', description: 'Процент внутри шкалы', Icon: IconTable },
        { value: 'table-outside', label: 'Таблица 2', description: 'Процент рядом со шкалой', Icon: IconTable },
        { value: 'cards', label: 'Карточки', description: 'Карточки сотрудников', Icon: IconLayoutGrid },
      ].map(({ value, label, description, Icon }) => <button key={value} type="button" title={description} aria-pressed={view === value} onClick={() => onView(value)}>
        <Icon size={17} stroke={1.7} aria-hidden="true" />{label}
      </button>)}
    </div>
    {view === 'cards' && <div className="sr-cards-sort">
      <FeedbackSelect label="Сортировка карточек" options={sortOptions} value={selectedSort.value} onChange={value => onSort(sortOptions.find(option => option.value === value).sort)} />
    </div>}
  </>;
}

export function SummaryReportCards({ rows, onOpen }) {
  return <ul className="sr-employee-grid" aria-label="Карточки сотрудников">
    {rows.map(employee => <li key={employee.id}>
      <button type="button" className="sr-report-card" onClick={() => onOpen(employee)} aria-label={`Открыть подробности: ${employee.name}`}>
        <span className="sr-report-card-heading">
          <ReportEmployeeAvatar name={employee.name} />
          <span className="sr-report-card-identity">
            <span className="sr-report-card-name">{employee.name}</span>
            <span className={`sr-report-card-department${employee.department ? '' : ' is-empty'}`}>{employee.department || 'Без отдела'}</span>
          </span>
        </span>
        <span className="sr-report-card-score">
          <span className="sr-report-card-caption">Средняя оценка</span>
          <ReportScore score={employee.score} />
        </span>
        <span className="sr-report-card-footer">
          <span className="sr-report-card-calls"><IconPhone size={15} stroke={1.7} aria-hidden="true" /><span>Звонков за период</span><strong>{employee.calls}</strong></span>
        </span>
      </button>
    </li>)}
  </ul>;
}
