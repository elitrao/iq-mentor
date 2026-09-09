import { useEffect, useMemo, useRef, useState } from "react";
import { IconChartDots3, IconHeadphones, IconMessages, IconSparkles } from "@tabler/icons-react";
import { BILLING_RATES, formatRubles } from "./billing/engine.js";
import { calculateBillingEstimate, calculateTrainerRecommendation } from "./billing/calculator.js";
import "./billing.css";

const hoursFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const controlFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const CALCULATOR_STORAGE_KEY = "iq-mentor-tariff-calculator-v1";
const CONSULTATION_THRESHOLD_CENTS = 35000000;
const BUSINESS_AVERAGES = { managers: 10, callsPerManager: 600, averageDuration: 10 };
const DEFAULT_CALCULATOR_VALUES = { ...BUSINESS_AVERAGES };
const CALCULATION_MESSAGES = ["Собираем ваши ответы", "Считаем бюджет", "Ещё чуть-чуть — почти готово"];

function loadCalculatorPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(CALCULATOR_STORAGE_KEY) || "null");
    return saved ? { ...DEFAULT_CALCULATOR_VALUES, ...saved } : { ...DEFAULT_CALCULATOR_VALUES, completed: false };
  } catch {
    return { ...DEFAULT_CALCULATOR_VALUES, completed: false };
  }
}

function useAnimatedNumber(target, duration = 900) {
  const [displayed, setDisplayed] = useState(target);
  const displayedRef = useRef(target);
  const animationFrame = useRef(null);

  useEffect(() => {
    window.cancelAnimationFrame(animationFrame.current);
    const from = displayedRef.current;
    const to = Number(target) || 0;
    if (from === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedRef.current = to;
      setDisplayed(to);
      return undefined;
    }
    const startedAt = window.performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;
      displayedRef.current = next;
      setDisplayed(next);
      if (progress < 1) animationFrame.current = window.requestAnimationFrame(animate);
    };
    animationFrame.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame.current);
  }, [target, duration]);

  return displayed;
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
    <div className="tariff-slider-field" style={rangeStyle}>
      <input className="tariff-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${accessibleLabel}: ползунок`} disabled={disabled} />
      <span className="tariff-range-limits" aria-hidden="true"><span>{controlFormatter.format(min)}</span><span>{controlFormatter.format(max)}</span></span>
    </div>
  </div>;
}

function ResultCard({ label, value, description, caption = "Рекомендуемый объём", tone = "analyst" }) {
  const PatternIcon = tone === "trainer" ? IconMessages : IconChartDots3;
  return <article className={`tariff-result-card ${tone}`} aria-label={label}>
    <div className="tariff-result-main"><strong>{value}</strong><b>{description}</b></div>
    <p className="tariff-volume"><span>{caption}</span></p>
    <span className="tariff-result-pattern" aria-hidden="true"><PatternIcon /><IconSparkles /><PatternIcon /></span>
  </article>;
}

function ModuleToggle({ label, checked, tone, onChange }) {
  return <label className={`tariff-module-toggle ${tone}`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={`${checked ? "Исключить" : "Включить"} ${label}`} />
    <span aria-hidden="true" />
  </label>;
}

function OnboardingQuestion({ step, total, label, value, min, max, stepValue, suffix, tone, businessAverage, leaving, onChange, onBack, onNext }) {
  const progress = ((step + 1) / total) * 100;
  const rangeProgress = ((value - min) / (max - min)) * 100;
  const averageProgress = ((businessAverage - min) / (max - min)) * 100;

  return <section className={`tariff-onboarding-question ${tone}${leaving ? " is-leaving" : ""}`}>
    <div className="tariff-onboarding-progress" aria-label={`Шаг ${step + 1} из ${total}`}>
      <span style={{ width: `${progress}%` }} />
    </div>
    <p className="tariff-onboarding-step">Вопрос {step + 1} из {total}</p>
    <h1>{label}</h1>
    <label className="tariff-onboarding-answer">
      <input type="number" min={min} max={max} step={stepValue} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} aria-label={label} autoFocus />
      <span>{suffix}</span>
    </label>
    <div className="tariff-onboarding-slider-field" style={{ "--range-progress": `${rangeProgress}%` }}>
      <span className="tariff-business-average" style={{ "--average-position": `${averageProgress}%` }} title={`Среднее значение по бизнесу — ${controlFormatter.format(businessAverage)} ${suffix}`}><i />Среднее по бизнесу</span>
      <input className="tariff-onboarding-range" type="range" min={min} max={max} step={stepValue} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${label}: ползунок`} />
      <span className="tariff-range-limits" aria-hidden="true"><span>{controlFormatter.format(min)}</span><span>{controlFormatter.format(max)}</span></span>
    </div>
    <div className="tariff-onboarding-actions">
      {step > 0 ? <button className="secondary" type="button" onClick={onBack} disabled={leaving}>Назад</button> : <span />}
      <button className="primary" type="button" onClick={onNext} disabled={leaving}>{step === total - 1 ? "Показать расчёт" : "Далее"}</button>
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

function SurveyResults({ analyst, trainer, onCustomize, onRestart }) {
  const analystHours = hoursFormatter.format(analyst.analystMinutes / 60);
  const trainerHours = hoursFormatter.format(trainer.trainerMinutes / 60);

  return <section className="tariff-onboarding-page">
    <div className="tariff-survey-results">
      <h1>Вот сколько времени вернётся вашей команде</h1>
      <div className="tariff-benefit-grid">
        <article className="tariff-benefit-card analyst">
          <strong>≈ {analystHours} ч</strong>
          <p>вы сэкономите на прослушивании записей</p>
          <span className="tariff-benefit-pattern" aria-hidden="true"><IconHeadphones /><IconSparkles /></span>
        </article>
        <article className="tariff-benefit-card trainer">
          <strong>Более {trainerHours} ч</strong>
          <p>тренировок для вашей команды</p>
          <span className="tariff-benefit-pattern" aria-hidden="true"><IconMessages /><IconSparkles /></span>
        </article>
        <article className="tariff-benefit-card coverage">
          <strong>{controlFormatter.format(analyst.monthlyCalls)} звонков</strong>
          <p>будут проанализированы каждый месяц</p>
          <span className="tariff-benefit-pattern" aria-hidden="true"><IconChartDots3 /><IconSparkles /></span>
        </article>
      </div>
      <div className="tariff-survey-results-actions">
        <button className="primary" type="button" onClick={onCustomize}>Настроить расчёт самостоятельно</button>
        <button className="secondary" type="button" onClick={onRestart}>Пройти опрос заново</button>
      </div>
    </div>
  </section>;
}

export function BillingSimulator({ dispatch, onConsultation, onboardingRequest = 0, onOnboardingOpened }) {
  const [preferences] = useState(loadCalculatorPreferences);
  const [managers, setManagers] = useState(preferences.managers);
  const [callsPerManager, setCallsPerManager] = useState(preferences.callsPerManager);
  const [averageDuration, setAverageDuration] = useState(preferences.averageDuration);
  const [trainerEnabled, setTrainerEnabled] = useState(typeof preferences.trainerEnabled === "boolean" ? preferences.trainerEnabled : true);
  const [analystEnabled, setAnalystEnabled] = useState(typeof preferences.analystEnabled === "boolean" ? preferences.analystEnabled : true);
  const [onboardingComplete, setOnboardingComplete] = useState(Boolean(preferences.completed));
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingLeaving, setOnboardingLeaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showSurveyResults, setShowSurveyResults] = useState(false);
  const [calculationMessage, setCalculationMessage] = useState(0);
  const [showTopUp, setShowTopUp] = useState(false);
  const onboardingTransitionTimer = useRef(null);
  const analyst = useMemo(() => calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes: averageDuration }), [managers, callsPerManager, averageDuration]);
  const trainer = useMemo(() => calculateTrainerRecommendation(analyst.analystCostCents), [analyst.analystCostCents]);
  const monthlyBudget = (trainerEnabled ? trainer.trainerCostCents : 0) + (analystEnabled ? analyst.analystCostCents : 0);
  const requiresConsultation = monthlyBudget > CONSULTATION_THRESHOLD_CENTS;
  const questionsDisabled = !analystEnabled && !trainerEnabled;
  const animatedAnalystCost = useAnimatedNumber(analyst.analystCostCents);
  const animatedAnalystHours = useAnimatedNumber(analyst.analystMinutes / 60);
  const animatedTrainerCost = useAnimatedNumber(trainer.trainerCostCents);
  const animatedTrainerHours = useAnimatedNumber(trainer.trainerMinutes / 60);
  const animatedMonthlyBudget = useAnimatedNumber(monthlyBudget);

  useEffect(() => {
    if (!onboardingComplete) return;
    localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify({ completed: true, managers, callsPerManager, averageDuration, trainerEnabled, analystEnabled }));
  }, [onboardingComplete, managers, callsPerManager, averageDuration, trainerEnabled, analystEnabled]);

  useEffect(() => {
    if (!onboardingRequest) return;
    window.clearTimeout(onboardingTransitionTimer.current);
    setOnboardingLeaving(false);
    setManagers(BUSINESS_AVERAGES.managers);
    setCallsPerManager(BUSINESS_AVERAGES.callsPerManager);
    setAverageDuration(BUSINESS_AVERAGES.averageDuration);
    setCalculating(false);
    setShowSurveyResults(false);
    setCalculationMessage(0);
    setOnboardingStep(0);
    setOnboardingComplete(false);
    onOnboardingOpened?.();
  }, [onboardingRequest, onOnboardingOpened]);

  useEffect(() => () => window.clearTimeout(onboardingTransitionTimer.current), []);

  useEffect(() => {
    if (!calculating) return undefined;
    setCalculationMessage(0);
    const secondMessage = window.setTimeout(() => setCalculationMessage(1), 950);
    const thirdMessage = window.setTimeout(() => setCalculationMessage(2), 1950);
    const finish = window.setTimeout(() => {
      setShowSurveyResults(true);
      setCalculating(false);
    }, 3000);
    return () => {
      window.clearTimeout(secondMessage);
      window.clearTimeout(thirdMessage);
      window.clearTimeout(finish);
    };
  }, [calculating]);

  useEffect(() => {
    setShowTopUp(false);
    if (!onboardingComplete || calculating || monthlyBudget <= 0) return undefined;
    const reveal = window.setTimeout(() => setShowTopUp(true), 2500);
    return () => window.clearTimeout(reveal);
  }, [onboardingComplete, calculating, monthlyBudget, managers, callsPerManager, averageDuration, trainerEnabled, analystEnabled]);

  const onboardingQuestions = [
    { label: "Сколько менеджеров в вашей команде?", value: managers, min: 0, max: 100, stepValue: 1, suffix: "чел.", businessAverage: BUSINESS_AVERAGES.managers, tone: "shared", onChange: setManagers },
    { label: "Сколько звонков в месяц совершает один менеджер?", value: callsPerManager, min: 10, max: 2000, stepValue: 10, suffix: "звонков", businessAverage: BUSINESS_AVERAGES.callsPerManager, tone: "analyst", onChange: setCallsPerManager },
    { label: "Сколько в среднем длится один звонок?", value: averageDuration, min: 1, max: 30, stepValue: 0.5, suffix: "мин.", businessAverage: BUSINESS_AVERAGES.averageDuration, tone: "analyst", onChange: setAverageDuration },
  ];

  if (calculating) return <CalculationLoading message={CALCULATION_MESSAGES[calculationMessage]} />;

  if (showSurveyResults) return <SurveyResults analyst={analyst} trainer={trainer} onCustomize={() => { setShowSurveyResults(false); setOnboardingComplete(true); }} onRestart={() => { setManagers(BUSINESS_AVERAGES.managers); setCallsPerManager(BUSINESS_AVERAGES.callsPerManager); setAverageDuration(BUSINESS_AVERAGES.averageDuration); setShowSurveyResults(false); setOnboardingStep(0); setOnboardingLeaving(false); setOnboardingComplete(false); }} />;

  if (!onboardingComplete) {
    const question = onboardingQuestions[onboardingStep];
    const transitionTo = (next) => {
      if (onboardingLeaving) return;
      setOnboardingLeaving(true);
      window.clearTimeout(onboardingTransitionTimer.current);
      onboardingTransitionTimer.current = window.setTimeout(() => {
        next();
        setOnboardingLeaving(false);
      }, 280);
    };
    return <section className="tariff-onboarding-page">
      <OnboardingQuestion
        key={onboardingStep}
        {...question}
        step={onboardingStep}
        total={onboardingQuestions.length}
        leaving={onboardingLeaving}
        onBack={() => transitionTo(() => setOnboardingStep((current) => Math.max(0, current - 1)))}
        onNext={() => {
          if (onboardingStep < onboardingQuestions.length - 1) transitionTo(() => setOnboardingStep((current) => current + 1));
          else transitionTo(() => setCalculating(true));
        }}
      />
    </section>;
  }

  return <section className="tariff-calculator-page">
    <header className="tariff-heading"><h1>Калькулятор тарификации</h1></header>
    <div className="tariff-question-grid">
      <CalculatorControl label="Сколько менеджеров в команде?" value={managers} min={0} max={100} step={1} suffix="чел." onChange={setManagers} tone="shared" disabled={questionsDisabled} />
      <CalculatorControl label="Сколько звонков в месяц совершает один менеджер?" value={callsPerManager} min={10} max={2000} step={10} suffix="звонков" onChange={setCallsPerManager} disabled={questionsDisabled} />
      <CalculatorControl label="Сколько в среднем длится один звонок?" value={averageDuration} min={1} max={30} step={0.5} suffix="мин." onChange={setAverageDuration} disabled={questionsDisabled} />
    </div>
    <div className="tariff-module-grid tariff-summary-grid">
      <section className={`tariff-module tariff-module-analyst${analystEnabled ? "" : " is-disabled"}`} aria-labelledby="tariff-analyst-title">
        <header className="tariff-module-heading"><h2 id="tariff-analyst-title"><span className="tariff-module-icon analyst" aria-hidden="true"><IconChartDots3 size={20} stroke={1.9} /></span>AI Аналитик</h2><div className="tariff-module-heading-actions"><span>{formatRubles(BILLING_RATES.analyst)} / мин</span><ModuleToggle label="AI Аналитик в расчёт" checked={analystEnabled} tone="analyst" onChange={setAnalystEnabled} /></div></header>
        <div className="tariff-module-content" aria-hidden={!analystEnabled}>
          <div aria-live="polite"><ResultCard label="Анализ звонков · бюджет в месяц" value={formatRubles(Math.round(animatedAnalystCost))} description={`≈ ${hoursFormatter.format(animatedAnalystHours)} ч`} /></div>
        </div>
      </section>
      <section className={`tariff-module tariff-module-trainer tariff-module-secondary${trainerEnabled ? "" : " is-disabled"}`} aria-labelledby="tariff-trainer-title">
        <header className="tariff-module-heading"><h2 id="tariff-trainer-title"><span className="tariff-module-icon trainer" aria-hidden="true"><IconMessages size={20} stroke={1.9} /></span>AI Тренер</h2><div className="tariff-module-heading-actions"><span>{formatRubles(BILLING_RATES.trainer)} / мин</span><ModuleToggle label="AI Тренер в расчёт" checked={trainerEnabled} tone="trainer" onChange={setTrainerEnabled} /></div></header>
        <div className="tariff-module-content" aria-hidden={!trainerEnabled}>
          <div aria-live="polite"><ResultCard tone="trainer" label="Рекомендуемый бюджет AI Тренера" value={formatRubles(Math.round(animatedTrainerCost))} caption="Рекомендуемый объём" description={`≈ ${hoursFormatter.format(animatedTrainerHours)} ч`} /></div>
        </div>
      </section>
      <section className="tariff-module-total" aria-label="Рекомендуемый общий бюджет">
        <div className="tariff-combined-budget" aria-live="polite">
          <strong>{formatRubles(Math.round(animatedMonthlyBudget))}</strong>
          <p>Рекомендуемая общая сумма</p>
          <span className="tariff-budget-pattern" aria-hidden="true"><IconMessages /><IconSparkles /><IconChartDots3 /><IconSparkles /></span>
        </div>
        <div className={`tariff-topup-reveal${showTopUp ? " is-visible" : ""}${requiresConsultation ? " is-consultation" : ""}`} aria-hidden={!showTopUp}>
          <button type="button" tabIndex={showTopUp ? 0 : -1} onClick={() => requiresConsultation ? onConsultation?.() : dispatch?.({ type: "TOP_UP", amountCents: Math.max(100000, monthlyBudget), success: true })}>
            <span className="tariff-topup-label">{requiresConsultation ? "Проконсультироваться со специалистом" : "Пополнить баланс"}</span>
            <span className="tariff-topup-pattern" aria-hidden="true"><IconSparkles /><IconMessages /><IconChartDots3 /></span>
          </button>
        </div>
      </section>
    </div>
  </section>;
}
