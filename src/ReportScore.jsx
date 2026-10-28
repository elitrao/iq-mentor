import './report-score.css';

export function ReportScore({ score }) {
  const value = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null;
  const tone = value === null ? 'empty' : value >= 80 ? 'green' : value >= 60 ? 'amber' : 'red';

  return <span className={`report-score report-score--${tone}`}>
    <span className="report-score-value">{value === null ? '—' : `${value}%`}</span>
    <span className="report-score-track" aria-hidden="true"><span className="report-score-fill" style={{ width: `${value ?? 0}%` }} /></span>
  </span>;
}
