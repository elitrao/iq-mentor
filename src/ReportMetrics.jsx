import { IconArrowDown, IconArrowUp, IconAward, IconCategory, IconChartPie, IconCircleCheck, IconMinus, IconTrendingDown, IconUsers } from '@tabler/icons-react';
import { reportScoreMetrics } from './report-metrics.js';
import { metricComparison } from './report-comparison-model.js';
import './report-metrics.css';

const formatNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

const signed = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber.format(Math.abs(value))}`;

function MetricChange({ current, previous, isScore = false, lowerIsBetter = false }) {
  const comparison = metricComparison(current, previous);
  if (!comparison) return <span className="report-metric-change is-neutral" title="Нет данных для сравнения с предыдущим периодом">—</span>;
  const { delta, percentage } = comparison;
  const Arrow = delta > 0 ? IconArrowUp : delta < 0 ? IconArrowDown : IconMinus;
  const tone = delta === 0 ? 'neutral' : (lowerIsBetter ? delta < 0 : delta > 0) ? 'positive' : 'negative';
  const title = `Демонстрационное сравнение с предыдущим периодом: ${formatNumber.format(previous)}${isScore ? '%' : ''}. ${isScore ? 'Разница оценки — в процентных пунктах; в бейдже — относительное изменение.' : 'Разница — в количестве; в бейдже — относительное изменение.'}${percentage === null ? ' Процент не рассчитывается при предыдущем значении 0.' : ''}`;
  return <span className={`report-metric-change is-${tone}`} title={title}>
    <span className="report-metric-delta">{signed(delta)}{isScore && <small> п.п.</small>}</span>
    <span className="report-metric-change-badge"><Arrow size={12} stroke={2} aria-hidden="true" />{percentage === null ? '—' : `${formatNumber.format(Math.abs(percentage))}%`}</span>
  </span>;
}

export function ReportMetrics({ rows, previousRows = [], kind, scope }) {
  const { count, average, belowTarget, highScore } = reportScoreMetrics(rows);
  const previous = reportScoreMetrics(previousRows);
  const categories = kind === 'categories';
  const subject = categories ? 'категориям' : 'сотрудникам';
  const CountIcon = categories ? IconCategory : IconUsers;
  const AttentionIcon = belowTarget ? IconTrendingDown : IconCircleCheck;

  return <dl className="report-metrics" aria-label="Ключевые показатели отчёта" aria-live="polite" aria-atomic="true">
    <div className="report-metric" title={`Среднее арифметическое оценок по ${subject} с учётом фильтров, на всех страницах отчёта.`}>
      <dt><span className="report-metric-label">Средняя оценка</span><span className="report-metric-scope" title={scope}>{scope}</span><span className="report-metric-icon" aria-hidden="true"><IconChartPie size={16} stroke={1.8} /></span></dt>
      <dd><span className="report-metric-value">{average === null ? '—' : <>{formatNumber.format(average)}<small>%</small></>}</span><MetricChange current={average} previous={previous.average} isScore /></dd>
    </div>
    <div className="report-metric" title="Количество в отчёте с учётом фильтров, на всех страницах.">
      <dt><span className="report-metric-label">{categories ? 'Категорий' : 'Сотрудников'}</span><span className="report-metric-icon" aria-hidden="true"><CountIcon size={18} stroke={1.8} /></span></dt>
      <dd><span className="report-metric-value">{formatNumber.format(count)}</span><MetricChange current={count} previous={previous.count} /></dd>
    </div>
    <div className="report-metric" title={`Количество ${categories ? 'категорий' : 'сотрудников'} с оценкой строго ниже 60%, с учётом фильтров.`}>
      <dt><span className="report-metric-label">Ниже 60%</span><span className="report-metric-icon" aria-hidden="true"><AttentionIcon size={18} stroke={1.8} /></span></dt>
      <dd><span className="report-metric-value">{formatNumber.format(belowTarget)}</span><MetricChange current={belowTarget} previous={previous.belowTarget} lowerIsBetter /></dd>
    </div>
    <div className="report-metric" title={`Количество ${categories ? 'категорий' : 'сотрудников'} с оценкой от 80% включительно, с учётом фильтров, на всех страницах отчёта.`}>
      <dt><span className="report-metric-label">80% и выше</span><span className="report-metric-icon" aria-hidden="true"><IconAward size={18} stroke={1.8} /></span></dt>
      <dd><span className="report-metric-value">{formatNumber.format(highScore)}</span><MetricChange current={highScore} previous={previous.highScore} /></dd>
    </div>
  </dl>;
}
