import { useMemo, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { BILLING_RATES, formatRubles } from "./billing/engine.js";
import { calculateBillingEstimate } from "./billing/calculator.js";
import "./billing.css";

const formatter = new Intl.NumberFormat("ru-RU");

function CalculatorControl({ label, hint, value, min, max, step, suffix, onChange, tone = "analyst", accessibleLabel = label }) {
  const rangeStyle = { "--range-progress": `${((value - min) / (max - min)) * 100}%` };
  return <div className={`tariff-control ${tone}`}>
    <span className="tariff-control-label">{label}</span>
    <span className="tariff-control-value">
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={accessibleLabel} />
      <em>{suffix}</em>
    </span>
    <small>{hint}</small>
    <input className="tariff-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={rangeStyle} aria-label={`${accessibleLabel}: ползунок`} />
  </div>;
}

function ResultCard({ label, value, description, tone = "analyst" }) {
  return <article className={`tariff-result-card ${tone}`}>
    <span>{label}</span><strong>{value}</strong><p>{description}</p>
  </article>;
}

export function BillingSimulator() {
  const [managers, setManagers] = useState(10);
  const [trainerManagers, setTrainerManagers] = useState(10);
  const [callsPerManager, setCallsPerManager] = useState(300);
  const [averageDuration, setAverageDuration] = useState(4);
  const [trainerMinutes, setTrainerMinutes] = useState(60);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const analyst = useMemo(() => calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes: averageDuration }), [managers, callsPerManager, averageDuration]);
  const trainer = useMemo(() => calculateBillingEstimate({ managers: trainerManagers, callsPerManager: 0, averageDurationMinutes: 0, trainerMinutesPerManager: trainerMinutes }), [trainerManagers, trainerMinutes]);

  return <section className="tariff-calculator-page">
    <header className="tariff-heading"><h1>Калькулятор тарификации</h1><p>Рассчитайте ежемесячный бюджет на анализ звонков и тренировки команды</p></header>
    <div className="tariff-module-grid">
      <section className="tariff-module tariff-module-trainer" aria-labelledby="tariff-trainer-title">
        <header className="tariff-module-heading"><h2 id="tariff-trainer-title">AI Тренер</h2><span>{formatRubles(BILLING_RATES.trainer)} / мин</span></header>
        <div aria-live="polite"><ResultCard tone="trainer" label="Тренировки · бюджет в месяц" value={formatRubles(trainer.trainerCostCents)} description={`${formatter.format(trainer.trainerMinutes)} минут практики для команды`} /></div>
        <div className="tariff-module-controls">
          <CalculatorControl label="Количество менеджеров" accessibleLabel="Тренер: количество менеджеров" hint="Сколько сотрудников будут тренироваться" value={trainerManagers} min={0} max={100} step={1} suffix="чел." onChange={setTrainerManagers} tone="trainer" />
          <CalculatorControl label="Тренировки на менеджера в месяц" hint="Среднее время практики с AI Тренером" value={trainerMinutes} min={0} max={600} step={15} suffix="мин." onChange={setTrainerMinutes} tone="trainer" />
        </div>
      </section>
      <section className="tariff-module tariff-module-analyst" aria-labelledby="tariff-analyst-title">
        <header className="tariff-module-heading"><h2 id="tariff-analyst-title">AI Аналитик</h2><span>{formatRubles(BILLING_RATES.analyst)} / мин</span></header>
        <div aria-live="polite"><ResultCard label="Анализ звонков · бюджет в месяц" value={formatRubles(analyst.analystCostCents)} description={`${formatter.format(analyst.monthlyCalls)} звонков · ${formatter.format(analyst.analystMinutes)} минут анализа`} /></div>
        <div className="tariff-module-controls">
          <CalculatorControl label="Количество менеджеров" accessibleLabel="Аналитик: количество менеджеров" hint="Сотрудников, чьи звонки нужно анализировать" value={managers} min={0} max={100} step={1} suffix="чел." onChange={setManagers} />
          <CalculatorControl label="Среднее количество звонков в месяц" hint="На одного менеджера" value={callsPerManager} min={10} max={2000} step={10} suffix="звонков" onChange={setCallsPerManager} />
          <CalculatorControl label="Средняя продолжительность 1 звонка" hint="Средняя длительность разговора" value={averageDuration} min={1} max={30} step={0.5} suffix="мин." onChange={setAverageDuration} />
        </div>
      </section>
    </div>
    <div className="tariff-bottom-summary">
        <div className="tariff-combined-budget" aria-live="polite"><div><h2>Общий бюджет в месяц</h2><p>Тренер + Аналитик</p></div><strong>{formatRubles(analyst.analystCostCents + trainer.trainerCostCents)}</strong></div>
        <div className={formulaOpen ? "tariff-formula open" : "tariff-formula"}>
          <button type="button" onClick={() => setFormulaOpen((current) => !current)} aria-expanded={formulaOpen}><span>Как считаем</span><IconChevronDown size={20} stroke={2} /></button>
          {formulaOpen && <div className="tariff-formula-body">
            <p className="analyst-line">Аналитик: <strong>{formatter.format(managers)} × {formatter.format(callsPerManager)} × {formatter.format(averageDuration)} мин × 5 ₽</strong></p>
            <p className="trainer-line">Тренер: <strong>{formatter.format(trainerManagers)} × {formatter.format(trainerMinutes)} мин × 12 ₽</strong></p>
            <span>Фактическое списание зависит от обработанных звонков и проведённых тренировок.</span>
          </div>}
        </div>
    </div>
  </section>;
}
