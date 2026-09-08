import { useMemo, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { BILLING_RATES, formatRubles } from "./billing/engine.js";
import { calculateBillingEstimate } from "./billing/calculator.js";
import "./billing.css";

const formatter = new Intl.NumberFormat("ru-RU");

function CalculatorControl({ label, hint, value, min, max, step, suffix, onChange }) {
  const rangeStyle = { "--range-progress": `${((value - min) / (max - min)) * 100}%` };
  return <label className="tariff-control">
    <span className="tariff-control-label">{label}</span>
    <span className="tariff-control-value">
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={label} />
      <em>{suffix}</em>
    </span>
    <small>{hint}</small>
    <input className="tariff-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={rangeStyle} aria-label={`${label}: ползунок`} />
  </label>;
}

function ResultCard({ label, value, description, emphasized = false }) {
  return <article className={emphasized ? "tariff-result-card emphasized" : "tariff-result-card"}>
    <span>{label}</span><strong>{value}</strong><p>{description}</p>
  </article>;
}

export function BillingSimulator() {
  const [managers, setManagers] = useState(10);
  const [callsPerManager, setCallsPerManager] = useState(300);
  const [averageDuration, setAverageDuration] = useState(4);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const estimate = useMemo(() => calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes: averageDuration }), [managers, callsPerManager, averageDuration]);

  return <section className="tariff-calculator-page">
    <header className="tariff-heading"><h1>Калькулятор тарификации</h1><p>Рассчитайте ежемесячный бюджет на анализ звонков вашей команды</p></header>
    <div className="tariff-calculator-grid">
      <div className="tariff-controls" aria-label="Параметры расчёта">
        <CalculatorControl label="Количество менеджеров" hint="Сотрудников, чьи звонки нужно анализировать" value={managers} min={1} max={100} step={1} suffix="чел." onChange={setManagers} />
        <CalculatorControl label="Среднее количество звонков в месяц" hint="На одного менеджера" value={callsPerManager} min={10} max={2000} step={10} suffix="звонков" onChange={setCallsPerManager} />
        <CalculatorControl label="Средняя продолжительность 1 звонка" hint="Средняя длительность разговора" value={averageDuration} min={1} max={30} step={0.5} suffix="мин." onChange={setAverageDuration} />
      </div>
      <div className="tariff-results" aria-live="polite">
        <ResultCard label="Всего звонков в месяц" value={formatter.format(estimate.monthlyCalls)} description={`${formatter.format(managers)} менеджеров × ${formatter.format(callsPerManager)} звонков`} />
        <ResultCard label="Минут анализа в месяц" value={`${formatter.format(estimate.monthlyMinutes)} мин`} description={`${formatter.format(estimate.monthlyCalls)} звонков × ${formatter.format(averageDuration)} мин`} />
        <ResultCard emphasized label="Ориентировочный бюджет в месяц" value={formatRubles(estimate.monthlyCostCents)} description={`Тариф AI Аналитика — ${formatRubles(BILLING_RATES.analyst)} за минуту`} />
        <div className={formulaOpen ? "tariff-formula open" : "tariff-formula"}>
          <button type="button" onClick={() => setFormulaOpen((current) => !current)} aria-expanded={formulaOpen}><span>Как считаем</span><IconChevronDown size={20} stroke={2} /></button>
          {formulaOpen && <div className="tariff-formula-body"><p><strong>{formatter.format(managers)}</strong> менеджеров × <strong>{formatter.format(callsPerManager)}</strong> звонков × <strong>{formatter.format(averageDuration)}</strong> мин × <strong>5 ₽</strong></p><span>Расчёт ориентировочный. Фактическое списание зависит от длительности каждого обработанного звонка.</span></div>}
        </div>
      </div>
    </div>
  </section>;
}
