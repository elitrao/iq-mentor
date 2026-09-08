import { useMemo, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { BILLING_RATES, formatRubles } from "./billing/engine.js";
import { calculateBillingEstimate } from "./billing/calculator.js";
import "./billing.css";

const formatter = new Intl.NumberFormat("ru-RU");

function CalculatorControl({ label, hint, value, min, max, step, suffix, onChange, tone = "analyst" }) {
  const rangeStyle = { "--range-progress": `${((value - min) / (max - min)) * 100}%` };
  return <label className={`tariff-control ${tone}`}>
    <span className="tariff-control-label">{label}</span>
    <span className="tariff-control-value">
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={label} />
      <em>{suffix}</em>
    </span>
    <small>{hint}</small>
    <input className="tariff-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={rangeStyle} aria-label={`${label}: ползунок`} />
  </label>;
}

function ResultCard({ label, value, description, tone = "analyst" }) {
  return <article className={`tariff-result-card ${tone}`}>
    <span>{label}</span><strong>{value}</strong><p>{description}</p>
  </article>;
}

export function BillingSimulator() {
  const [managers, setManagers] = useState(10);
  const [callsPerManager, setCallsPerManager] = useState(300);
  const [averageDuration, setAverageDuration] = useState(4);
  const [trainerMinutes, setTrainerMinutes] = useState(60);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const estimate = useMemo(() => calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes: averageDuration, trainerMinutesPerManager: trainerMinutes }), [managers, callsPerManager, averageDuration, trainerMinutes]);

  return <section className="tariff-calculator-page">
    <header className="tariff-heading"><h1>Калькулятор тарификации</h1><p>Рассчитайте ежемесячный бюджет на анализ звонков и тренировки команды</p></header>
    <div className="tariff-calculator-grid">
      <div className="tariff-controls" aria-label="Параметры расчёта">
        <CalculatorControl label="Количество менеджеров" hint="Сотрудников, чьи звонки нужно анализировать" value={managers} min={1} max={100} step={1} suffix="чел." onChange={setManagers} />
        <CalculatorControl label="Среднее количество звонков в месяц" hint="На одного менеджера" value={callsPerManager} min={10} max={2000} step={10} suffix="звонков" onChange={setCallsPerManager} />
        <CalculatorControl label="Средняя продолжительность 1 звонка" hint="Средняя длительность разговора" value={averageDuration} min={1} max={30} step={0.5} suffix="мин." onChange={setAverageDuration} />
        <CalculatorControl label="Тренировки на менеджера в месяц" hint="Среднее время практики с AI Тренером" value={trainerMinutes} min={0} max={600} step={15} suffix="мин." onChange={setTrainerMinutes} tone="trainer" />
      </div>
      <div className="tariff-results" aria-live="polite">
        <ResultCard label="AI Аналитик · бюджет в месяц" value={formatRubles(estimate.analystCostCents)} description={`${formatter.format(estimate.monthlyCalls)} звонков · ${formatter.format(estimate.analystMinutes)} мин × ${formatRubles(BILLING_RATES.analyst)}/мин`} />
        <ResultCard tone="trainer" label="AI Тренер · бюджет в месяц" value={formatRubles(estimate.trainerCostCents)} description={`${formatter.format(managers)} менеджеров · ${formatter.format(estimate.trainerMinutes)} мин × ${formatRubles(BILLING_RATES.trainer)}/мин`} />
        <ResultCard tone="combined" label="Общий бюджет в месяц" value={formatRubles(estimate.totalCostCents)} description={`Аналитик ${formatRubles(estimate.analystCostCents)} + Тренер ${formatRubles(estimate.trainerCostCents)}`} />
        <div className={formulaOpen ? "tariff-formula open" : "tariff-formula"}>
          <button type="button" onClick={() => setFormulaOpen((current) => !current)} aria-expanded={formulaOpen}><span>Как считаем</span><IconChevronDown size={20} stroke={2} /></button>
          {formulaOpen && <div className="tariff-formula-body">
            <p className="analyst-line">Аналитик: <strong>{formatter.format(managers)} × {formatter.format(callsPerManager)} × {formatter.format(averageDuration)} мин × 5 ₽</strong></p>
            <p className="trainer-line">Тренер: <strong>{formatter.format(managers)} × {formatter.format(trainerMinutes)} мин × 12 ₽</strong></p>
            <span>Фактическое списание зависит от обработанных звонков и проведённых тренировок.</span>
          </div>}
        </div>
      </div>
    </div>
  </section>;
}
