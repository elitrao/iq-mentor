import editIcon from './assets/summary-report/edit.svg';
import './report-title.css';

export function ReportTitle({ title, automatic, period, onRename }) {
  return <div className="report-title">
    <h1 title={title}>{title}</h1>
    <span className={`report-title-mode${automatic ? '' : ' is-manual'}`} title={automatic ? 'Автоматическая генерация' : 'Ручная генерация'}>{automatic ? 'А' : 'Р'}</span>
    <span className="report-title-period" title={period}>{period}</span>
    <button type="button" className="report-title-edit" aria-label="Переименовать отчет" title="Переименовать отчет" onClick={onRename}>
      <span aria-hidden="true" style={{ maskImage: `url("${editIcon}")`, WebkitMaskImage: `url("${editIcon}")` }} />
    </button>
  </div>;
}
