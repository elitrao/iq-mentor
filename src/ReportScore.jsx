import './report-score.css';

export function ReportScore({ score, labelPosition = 'inside' }) {
  const value = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null;
  const tone = value === null ? 'empty' : value >= 80 ? 'green' : value >= 60 ? 'amber' : 'red';
  const outside = labelPosition === 'outside';
  const label = <span className="report-score-value">{value === null ? '—' : `${value}%`}</span>;

  return <span className={`report-score report-score--${tone}${outside ? ' report-score--outside' : ''}`}>
    {outside && label}
    <span className="report-score-track">
      <span className="report-score-fill" style={{ width: `${value ?? 0}%` }} aria-hidden="true" />
      {!outside && label}
    </span>
  </span>;
}
