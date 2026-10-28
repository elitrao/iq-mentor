import historyIcon from './assets/summary-report/history.svg';
import generateIcon from './assets/summary-report/generate.svg';
import settingsIcon from './assets/calls-report/settings.svg';
import exportIcon from './assets/calls-report/export.svg';
import './report-common.css';

function ActionIcon({ source }) {
  return <span className="report-action-icon" style={{ '--report-icon': `url("${source}")` }} aria-hidden="true" />;
}

export function ReportActions({ unread, generating = false, exportDisabled = false, onHistory, onGenerate, onSchedule, onExport }) {
  return <div className="report-actions">
    <button type="button" className="report-action report-action-history" onClick={onHistory}>
      <ActionIcon source={historyIcon} />Показать историю
      {unread && <span className="report-unread-dot" aria-label="Есть новые отчёты" />}
    </button>
    <button type="button" className="report-action report-action-generate" disabled={generating} onClick={onGenerate}>
      <ActionIcon source={generateIcon} />{generating ? 'Генерация…' : 'Сгенерировать'}
    </button>
    <button type="button" className="report-action report-action-square report-action-warm" aria-label="Настроить автоматическую генерацию" title="Настроить автоматическую генерацию" onClick={onSchedule}><ActionIcon source={settingsIcon} /></button>
    <button type="button" className="report-action report-action-square" aria-label="Экспортировать отчёт" title="Экспортировать отчёт" disabled={exportDisabled} onClick={onExport}><ActionIcon source={exportIcon} /></button>
  </div>;
}
