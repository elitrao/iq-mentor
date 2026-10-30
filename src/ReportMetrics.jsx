import { useId } from 'react';
import { reportCallMetrics, reportDepartmentCalls, reportDurationParts, reportScoreMetrics } from './report-metrics.js';
import './report-metrics.css';

const formatNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
const durationLabel = seconds => {
  const time = reportDurationParts(seconds);
  return time ? time.minutes + ' мин ' + time.seconds + ' с' : 'Нет данных';
};

function CallsChart({ rows, total }) {
  const departments = reportDepartmentCalls(rows);
  const tones = ['#f3ae69', '#82b9aa', '#91a7cf', '#b2a0cc'];
  let offset = 0;
  const segments = departments.map((row, index) => {
    const portion = total ? row.calls / total * 100 : 0;
    const segment = { ...row, portion, offset, color: tones[index] };
    offset += portion;
    return segment;
  });
  return <figure className="report-metric-chart report-metric-chart--departments">
    <figcaption>Звонки по отделам</figcaption>
    <div className="report-department-chart">
      <svg className="report-department-donut" viewBox="0 0 64 64" role="img" aria-label="Доли звонков по отделам">
        <circle cx="32" cy="32" r="25" fill="none" stroke="#e8eae7" strokeWidth="7" />
        {segments.filter(row => row.portion > 0).map(row => <circle key={row.name} cx="32" cy="32" r="25"
          fill="none" stroke={row.color} strokeWidth="7" pathLength="100"
          strokeDasharray={Math.max(0, row.portion - (segments.length > 1 ? 1.5 : 0)) + ' 100'}
          strokeDashoffset={-row.offset} transform="rotate(-90 32 32)">
          <title>{row.name}: {formatNumber.format(row.portion)}%</title>
        </circle>)}
        <path d="M27 23h-3a2 2 0 0 0-2 2c0 10 7 17 17 17a2 2 0 0 0 2-2v-3l-5-2-2 3c-4-2-6-4-8-8l3-2z" fill="none" stroke="#a4a49a" strokeWidth="1.5" strokeLinejoin="round" transform="translate(7 7) scale(.8)" />
      </svg>
      {segments.length ? <ul className="report-department-legend">
        {segments.map(row => <li key={row.name} title={row.name + ': ' + row.calls}>
          <i style={{ background: row.color }} aria-hidden="true" />
          <span>{row.name}</span><b>{formatNumber.format(row.calls)}</b>
        </li>)}
      </ul> : <span className="report-chart-empty">Нет звонков</span>}
    </div>
  </figure>;
}

function ScoreChart({ average }) {
  const color = average === null ? '#c9ccc9' : average < 60 ? '#ec9298' : average < 80 ? '#f3bf50' : '#61c69b';
  return <figure className="report-metric-chart report-metric-chart--score">
    <svg viewBox="0 0 100 76" role="img" aria-label={average === null ? 'Нет данных об оценке' : 'Средняя оценка: ' + formatNumber.format(average) + ' из 100%'}>
      <circle cx="50" cy="38" r="29" fill="none" stroke="#e8eae7" strokeWidth="7" />
      {average !== null && <circle cx="50" cy="38" r="29" fill="none" stroke={color} strokeWidth="7"
        pathLength="100" strokeDasharray={average + ' 100'} strokeLinecap={average ? 'round' : 'butt'} transform="rotate(-90 50 38)" />}
      <text x="50" y="44" textAnchor="middle" fill="#96968e" fontSize="18" fontFamily="Inter, sans-serif">%</text>
    </svg>
    <figcaption>Шкала 0–100%</figcaption>
  </figure>;
}

function DurationChart({ employees }) {
  const gradientId = useId();
  const timed = employees.filter(row => row.averageSeconds !== null);
  const maximum = Math.max(60, ...timed.map(row => row.averageSeconds)) * 1.15;
  const points = timed.map((row, index) => ({
    ...row,
    x: timed.length === 1 ? 80 : 6 + index / (timed.length - 1) * 148,
    y: 54 - row.averageSeconds / maximum * 48,
  }));
  const line = points.map((point, index) => (index ? 'L' : 'M') + point.x + ',' + point.y).join(' ');
  return <figure className="report-metric-chart">
    <svg viewBox="0 0 160 60" role="img" aria-label="Средняя длительность звонка по сотрудникам">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a9fc9" stopOpacity=".22" />
        <stop offset="100%" stopColor="#8a9fc9" stopOpacity="0" />
      </linearGradient></defs>
      <path className="report-chart-baseline" d="M4 55H156" />
      {points.length > 1 && <>
        <path d={line + ' L' + points.at(-1).x + ',54 L' + points[0].x + ',54 Z'} fill={'url(#' + gradientId + ')'} />
        <path d={line} stroke="#8a9fc9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {points.map(point => <g key={point.id}>
        <title>{point.name}: {durationLabel(point.averageSeconds)}</title>
        <circle cx={point.x} cy={point.y} r={points.length === 1 ? 3.5 : 1.6} fill="#8a9fc9" />
        <circle cx={point.x} cy={point.y} r="5" fill="transparent" />
      </g>)}
    </svg>
    <figcaption>{timed.length ? 'По сотрудникам' : 'Нет данных'}</figcaption>
  </figure>;
}

export function ReportMetrics({ rows, scope }) {
  const { average } = reportScoreMetrics(rows);
  const { calls, totalSeconds, averageSeconds, timedCalls, employees } = reportCallMetrics(rows);
  const duration = reportDurationParts(averageSeconds);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalTime = totalMinutes >= 60 ? Math.floor(totalMinutes / 60) + ' ч ' + totalMinutes % 60 + ' мин' : totalMinutes + ' мин';
  return <section className="report-metrics" aria-label="Ключевые показатели отчёта">
    <div className="report-metrics-grid">
      <article className="report-metric" aria-label="Количество звонков">
        <dl><dt>Количество звонков</dt><dd>{formatNumber.format(calls)}</dd></dl>
        <CallsChart rows={rows} total={calls} />
      </article>
      <article className="report-metric" aria-label="Средняя оценка">
        <dl title={`${scope}. Среднее арифметическое оценок сотрудников с учётом фильтров, на всех страницах отчёта.`}>
          <dt>Средняя оценка</dt><dd>{average === null ? '—' : <>{formatNumber.format(average)}<small>%</small></>}</dd>
          <dd className="report-metric-note"><span className="report-metric-scope" title={scope}>{scope}</span></dd>
        </dl>
        <ScoreChart average={average} />
      </article>
      <article className="report-metric" aria-label="Средняя длительность">
        <dl title={'Общая длительность звонков, делённая на их количество. Звонков с известной длительностью: ' + timedCalls + '.'}>
          <dt>Средняя длительность</dt>
          <dd>{duration ? <>{duration.minutes}<small>мин</small> {duration.seconds}<small>с</small></> : '—'}</dd>
          <dd className="report-metric-note"><span className="report-metric-scope" title="Общая длительность звонков в отчёте">{duration ? 'Всего ' + totalTime : 'Нет данных'}</span></dd>
        </dl>
        <DurationChart employees={employees} />
      </article>
    </div>
  </section>;
}
