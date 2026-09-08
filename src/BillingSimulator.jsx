import { useEffect, useMemo, useState } from "react";
import { IconChartDots3, IconMessages, IconSparkles } from "@tabler/icons-react";
import { BILLING_RATES, formatRubles } from "./billing/engine.js";
import { calculateBillingEstimate, calculateTrainerRecommendation } from "./billing/calculator.js";
import "./billing.css";

const formatter = new Intl.NumberFormat("ru-RU");
const CALCULATOR_STORAGE_KEY = "iq-mentor-tariff-calculator-v1";
const DEFAULT_CALCULATOR_VALUES = { managers: 10, callsPerManager: 300, averageDuration: 4 };
const CALCULATION_MESSAGES = ["Собираем ваши ответы", "Считаем бюджет", "Ещё чуть-чуть — почти готово"];

function loadCalculatorPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(CALCULATOR_STORAGE_KEY) || "null");
    return saved ? { ...DEFAULT_CALCULATOR_VALUES, ...saved } : { ...DEFAULT_CALCULATOR_VALUES, completed: false };
  } catch {
    return { ...DEFAULT_CALCULATOR_VALUES, completed: false };
  }
}

function CalculatorControl({ label, hint, value, min, max, step, suffix, onChange, tone = "analyst", accessibleLabel = label, disabled = false }) {
  const rangeStyle = { "--range-progress": `${((value - min) / (max - min)) * 100}%` };
  return <div className={`tariff-control ${tone}${disabled ? " is-disabled" : ""}`}>
    <span className="tariff-control-label">{label}</span>
    <span className="tariff-control-value">
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={accessibleLabel} disabled={disabled} />
      <em>{suffix}</em>
    </span>
    {hint && <small>{hint}</small>}
    <input className="tariff-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} style={rangeStyle} aria-label={`${accessibleLabel}: ползунок`} disabled={disabled} />
  </div>;
}

function ResultCard({ label, value, description, caption = "Рекомендуемый объём", tone = "analyst" }) {
  const PatternIcon = tone === "trainer" ? IconMessages : IconChartDots3;
  return <article className={`tariff-result-card ${tone}`} aria-label={label}>
    <strong>{value}</strong><p className="tariff-volume"><span>{caption}</span><b>{description}</b></p>
    <span className="tariff-result-pattern" aria-hidden="true"><PatternIcon /><IconSparkles /><PatternIcon /></span>
  </article>;
}

function ModuleToggle({ label, checked, tone, onChange }) {
  return <label className={`tariff-module-toggle ${tone}`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={`${checked ? "Исключить" : "Включить"} ${label}`} />
    <span aria-hidden="true" />
  </label>;
}

function OnboardingQuestion({ step, total, label, value, min, max, stepValue, suffix, tone, onChange, onBack, onNext }) {
  const progress = ((step + 1) / total) * 100;
  const rangeProgress = ((value - min) / (max - min)) * 100;

  return <section className={`tariff-onboarding-question ${tone}`} key={step}>
    <div className="tariff-onboarding-progress" aria-label={`Шаг ${step + 1} из ${total}`}>
      <span style={{ width: `${progress}%` }} />
    </div>
    <p className="tariff-onboarding-step">Вопрос {step + 1} из {total}</p>
    <h1>{label}</h1>
    <label className="tariff-onboarding-answer">
      <input type="number" min={min} max={max} step={stepValue} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={label} autoFocus />
      <span>{suffix}</span>
    </label>
    <input className="tariff-onboarding-range" type="range" min={min} max={max} step={stepValue} value={value} onChange={(event) => onChange(Number(event.target.value))} style={{ "--range-progress": `${rangeProgress}%` }} aria-label={`${label}: ползунок`} />
    <div className="tariff-onboarding-actions">
      {step > 0 ? <button className="secondary" type="button" onClick={onBack}>Назад</button> : <span />}
      <button className="primary" type="button" onClick={onNext}>{step === total - 1 ? "Показать расчёт" : "Далее"}</button>
    </div>
  </section>;
}

function CalculationLoading({ message }) {
  return <section className="tariff-loading-page" aria-live="polite" aria-busy="true">
    <div className="tariff-loading-card">
      <div className="tariff-loading-mark"><span /><span /><span /></div>
      <p>Готовим персональный расчёт</p>
      <h1 key={message}>{message}</h1>
      <div className="tariff-loading-progress"><span /></div>
    </div>
  </section>;
}

export function BillingSimulator({ onboardingRequest = 0, onOnboardingOpened }) {
  const [preferences] = useState(loadCalculatorPreferences);
  const [managers, setManagers] = useState(preferences.managers);
  const [callsPerManager, setCallsPerManager] = useState(preferences.callsPerManager);
  const [averageDuration, setAverageDuration] = useState(preferences.averageDuration);
  const [trainerEnabled, setTrainerEnabled] = useState(typeof preferences.trainerEnabled === "boolean" ? preferences.trainerEnabled : true);
  const [analystEnabled, setAnalystEnabled] = useState(typeof preferences.analystEnabled === "boolean" ? preferences.analystEnabled : true);
  const [onboardingComplete, setOnboardingComplete] = useState(Boolean(preferences.completed));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [calculationMessage, setCalculationMessage] = useState(0);
  const analyst = useMemo(() => calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes: averageDuration }), [managers, callsPerManager, averageDuration]);
  const trainer = useMemo(() => calculateTrainerRecommendation(analyst.analystCostCents), [analyst.analystCostCents]);

  useEffect(() => {
    if (!onboardingComplete) return;
    localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify({ completed: true, managers, callsPerManager, averageDuration, trainerEnabled, analystEnabled }));
  }, [onboardingComplete, managers, callsPerManager, averageDuration, trainerEnabled, analystEnabled]);

  useEffect(() => {
    if (!onboardingRequest) return;
    setCalculating(false);
    setCalculationMessage(0);
    setOnboardingStep(0);
    setOnboardingComplete(false);
    onOnboardingOpened?.();
  }, [onboardingRequest, onOnboardingOpened]);

  useEffect(() => {
    if (!calculating) return undefined;
    setCalculationMessage(0);
    const secondMessage = window.setTimeout(() => setCalculationMessage(1), 950);
    const thirdMessage = window.setTimeout(() => setCalculationMessage(2), 1950);
    const finish = window.setTimeout(() => {
      setOnboardingComplete(true);
      setCalculating(false);
    }, 3000);
    return () => {
      window.clearTimeout(secondMessage);
      window.clearTimeout(thirdMessage);
      window.clearTimeout(finish);
    };
  }, [calculating]);

  const onboardingQuestions = [
    { label: "Сколько менеджеров в вашей команде?", value: managers, min: 0, max: 100, stepValue: 1, suffix: "чел.", tone: "shared", onChange: setManagers },
    { label: "Сколько звонков в месяц совершает один менеджер?", value: callsPerManager, min: 10, max: 2000, stepValue: 10, suffix: "звонков", tone: "analyst", onChange: setCallsPerManager },
    { label: "Сколько в среднем длится один звонок?", value: averageDuration, min: 1, max: 30, stepValue: 0.5, suffix: "мин.", tone: "analyst", onChange: setAverageDuration },
  ];

  if (calculating) return <CalculationLoading message={CALCULATION_MESSAGES[calculationMessage]} />;

  if (!onboardingComplete) {
    const question = onboardingQuestions[onboardingStep];
    return <section className="tariff-onboarding-page">
      <OnboardingQuestion
        {...question}
        step={onboardingStep}
        total={onboardingQuestions.length}
        onBack={() => setOnboardingStep((current) => Math.max(0, current - 1))}
        onNext={() => {
          if (onboardingStep < onboardingQuestions.length - 1) setOnboardingStep((current) => current + 1);
          else setCalculating(true);
        }}
      />
    </section>;
  }

  const monthlyBudget = (trainerEnabled ? trainer.trainerCostCents : 0) + (analystEnabled ? analyst.analystCostCents : 0);
  const questionsDisabled = !analystEnabled && !trainerEnabled;

  return <section className="tariff-calculator-page">
    <header className="tariff-heading"><h1>Калькулятор тарификации</h1><p>Рассчитайте ежемесячный бюджет на анализ звонков и тренировки команды</p></header>
    <div className="tariff-question-grid">
      <CalculatorControl label="Сколько менеджеров в команде?" value={managers} min={0} max={100} step={1} suffix="чел." onChange={setManagers} tone="shared" disabled={questionsDisabled} />
      <CalculatorControl label="Сколько звонков в месяц совершает один менеджер?" value={callsPerManager} min={10} max={2000} step={10} suffix="звонков" onChange={setCallsPerManager} disabled={questionsDisabled} />
      <CalculatorControl label="Сколько в среднем длится один звонок?" value={averageDuration} min={1} max={30} step={0.5} suffix="мин." onChange={setAverageDuration} disabled={questionsDisabled} />
    </div>
    <div className="tariff-module-grid tariff-summary-grid">
      <section className={`tariff-module tariff-module-analyst${analystEnabled ? "" : " is-disabled"}`} aria-labelledby="tariff-analyst-title">
        <header className="tariff-module-heading"><h2 id="tariff-analyst-title"><span className="tariff-module-icon analyst" aria-hidden="true"><IconChartDots3 size={20} stroke={1.9} /></span>AI Аналитик</h2><div className="tariff-module-heading-actions"><span>{formatRubles(BILLING_RATES.analyst)} / мин</span><ModuleToggle label="AI Аналитик в расчёт" checked={analystEnabled} tone="analyst" onChange={setAnalystEnabled} /></div></header>
        <div className="tariff-module-content" aria-hidden={!analystEnabled}>
          <div aria-live="polite"><ResultCard label="Анализ звонков · бюджет в месяц" value={formatRubles(analyst.analystCostCents)} description={`${formatter.format(analyst.analystMinutes)} мин`} /></div>
        </div>
      </section>
      <section className={`tariff-module tariff-module-trainer tariff-module-secondary${trainerEnabled ? "" : " is-disabled"}`} aria-labelledby="tariff-trainer-title">
        <header className="tariff-module-heading"><h2 id="tariff-trainer-title"><span className="tariff-module-icon trainer" aria-hidden="true"><IconMessages size={20} stroke={1.9} /></span>AI Тренер</h2><div className="tariff-module-heading-actions"><span>{formatRubles(BILLING_RATES.trainer)} / мин</span><ModuleToggle label="AI Тренер в расчёт" checked={trainerEnabled} tone="trainer" onChange={setTrainerEnabled} /></div></header>
        <div className="tariff-module-content" aria-hidden={!trainerEnabled}>
          <div aria-live="polite"><ResultCard tone="trainer" label="Рекомендуемый бюджет AI Тренера" value={formatRubles(trainer.trainerCostCents)} caption="25% от бюджета Аналитика" description={`≈ ${formatter.format(trainer.trainerMinutes)} мин`} /></div>
        </div>
      </section>
      <section className="tariff-module tariff-module-total" aria-labelledby="tariff-total-title">
        <header className="tariff-module-heading"><h2 id="tariff-total-title">Общий бюджет</h2></header>
        <div className="tariff-module-content">
          <div className="tariff-combined-budget" aria-live="polite">
            <strong>{formatRubles(monthlyBudget)}</strong>
            <p>Рекомендуемая сумма</p>
            <span className="tariff-budget-pattern" aria-hidden="true"><IconMessages /><IconSparkles /><IconChartDots3 /><IconSparkles /></span>
          </div>
        </div>
      </section>
    </div>
  </section>;
}
