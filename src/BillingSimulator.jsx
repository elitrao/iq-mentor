import { useMemo, useState } from "react";
import {
  IconAlertTriangle, IconArrowDown, IconArrowUp, IconBolt, IconCalendar, IconCheck, IconClock,
  IconCoin, IconPlayerPause, IconPlayerPlay, IconPlus, IconRefresh, IconRobot, IconSchool,
  IconSettings, IconShieldCheck, IconWallet,
} from "@tabler/icons-react";
import {
  BILLING_RATES, BILLING_SCENARIOS, formatRubles, roundBillableMinutes, selectAnalystHold,
  selectAvailableForAnalyst, selectClientHistory, selectTrainerReserve, selectTrainerWarning,
} from "./billing/engine.js";

const MODULE_LABELS = { analyst: "AI Аналитик", trainer: "AI Тренер" };
const OUTCOME_LABELS = {
  success: "Успех",
  technical_error: "Техническая ошибка",
  canceled: "Отмена",
  partial: "Частично выполнено",
};

const EVENT_LABELS = {
  opening_balance: "Стартовый баланс",
  top_up: "Пополнение",
  top_up_failed: "Ошибка оплаты",
  migration_credit: "Миграция",
  module_toggle: "Модуль",
  trainer_started: "Запуск Тренера",
  trainer_start_rejected: "Отказ запуска",
  trainer_charge: "Списание Тренера",
  trainer_stopped: "Остановка Тренера",
  trainer_completed: "Завершение Тренера",
  analyst_started: "Запуск Аналитика",
  analyst_start_rejected: "Отказ запуска",
  analyst_charge: "Списание Аналитика",
  analyst_no_charge: "Без списания",
  reserve_changed: "Резерв",
  balance_warning: "Предупреждение",
  policy_changed: "Политика",
  day_changed: "Дата",
};

function Toggle({ checked, onChange, label }) {
  return <label className="billing-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i></i><span>{label}</span></label>;
}

function MoneyValue({ cents, signed = false }) {
  const tone = cents > 0 ? "positive" : cents < 0 ? "negative" : "neutral";
  return <span className={`billing-money ${tone}`}>{formatRubles(cents, signed)}</span>;
}

function StatusPill({ status }) {
  const labels = { success: "Успешно", failed: "Ошибка", warning: "Спорно", info: "Событие" };
  return <span className={`billing-status ${status || "info"}`}>{labels[status] || labels.info}</span>;
}

function EmptyState({ children }) {
  return <div className="billing-empty"><IconClock size={22} stroke={1.5} /><span>{children}</span></div>;
}

function SummaryCard({ icon: Icon, label, value, hint, tone }) {
  return <article className={`billing-summary-card ${tone}`}><span><Icon size={20} stroke={1.8} /></span><div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div></article>;
}

function TrainerPanel({ state, dispatch, autoplay, setAutoplay }) {
  const [count, setCount] = useState(1);
  const active = state.trainerSessions.filter((session) => session.status === "active");
  const warning = selectTrainerWarning(state);
  return <article className="billing-card billing-module-card trainer">
    <header className="billing-card-header"><div><span className="billing-card-icon"><IconSchool size={22} /></span><div><h2>AI Тренер</h2><p>{formatRubles(BILLING_RATES.trainer)} / минута</p></div></div><Toggle checked={state.modules.trainer} onChange={(enabled) => dispatch({ type: "TOGGLE_MODULE", module: "trainer", enabled })} label={state.modules.trainer ? "Включён" : "Выключен"} /></header>
    {warning && <div className="billing-inline-alert warning"><IconAlertTriangle size={18} /><span>{warning}</span></div>}
    <div className="billing-launch-row"><label><span>Запустить одновременно</span><div><input type="number" min="1" max="50" value={count} onChange={(event) => setCount(event.target.value)} /><em>сессий</em></div></label><button className="billing-primary" onClick={() => dispatch({ type: "START_TRAINERS", count })} disabled={!state.modules.trainer}><IconPlayerPlay size={17} />Запустить</button></div>
    <div className="billing-tick-controls"><button onClick={() => dispatch({ type: "TRAINER_TICK" })} disabled={!active.length}><IconBolt size={17} />Списать следующую минуту</button><button className={autoplay ? "active" : ""} onClick={() => setAutoplay(!autoplay)} disabled={!active.length}>{autoplay ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}{autoplay ? "Пауза" : "Автопрокрутка"}</button><span>1 сек = 1 мин</span></div>
    <div className="billing-session-list">
      <div className="billing-list-head"><span>Сессия</span><span>Минуты</span><span>Следующая</span><span></span></div>
      {active.length ? active.map((session) => <div className="billing-session-row" key={session.id}><span><i></i><strong>{session.name}</strong></span><b>{session.elapsedMinutes}</b><em>{formatRubles(BILLING_RATES.trainer)}</em><button onClick={() => dispatch({ type: "STOP_TRAINER", id: session.id })}>Завершить</button></div>) : <EmptyState>Активных тренировок нет</EmptyState>}
    </div>
  </article>;
}

function AnalystPanel({ state, dispatch }) {
  const [expectedSeconds, setExpectedSeconds] = useState(600);
  const [drafts, setDrafts] = useState({});
  const active = state.analystOperations.filter((operation) => operation.status === "active");
  const expectedMinutes = roundBillableMinutes(expectedSeconds);
  const expectedCost = expectedMinutes * BILLING_RATES.analyst;
  const updateDraft = (id, patch) => setDrafts((current) => ({ ...current, [id]: { actualSeconds: 600, outcome: "success", ...current[id], ...patch } }));
  return <article className="billing-card billing-module-card analyst">
    <header className="billing-card-header"><div><span className="billing-card-icon"><IconRobot size={22} /></span><div><h2>AI Аналитик</h2><p>{formatRubles(BILLING_RATES.analyst)} / минута</p></div></div><Toggle checked={state.modules.analyst} onChange={(enabled) => dispatch({ type: "TOGGLE_MODULE", module: "analyst", enabled })} label={state.modules.analyst ? "Включён" : "Выключен"} /></header>
    <div className="billing-analyst-launch"><label><span>Ожидаемая длительность, сек</span><input type="number" min="0" value={expectedSeconds} onChange={(event) => setExpectedSeconds(event.target.value)} /></label><div><span>Расчёт</span><strong>{expectedMinutes} мин × 5 ₽ = {formatRubles(expectedCost)}</strong></div><button className="billing-primary" onClick={() => dispatch({ type: "START_ANALYST", expectedSeconds })} disabled={!state.modules.analyst}><IconPlayerPlay size={17} />Запустить анализ</button></div>
    <div className="billing-operation-list">
      {active.length ? active.map((operation) => {
        const draft = { actualSeconds: operation.expectedSeconds, outcome: "success", ...drafts[operation.id] };
        return <div className="billing-operation" key={operation.id}><div className="billing-operation-title"><span><i></i><strong>{operation.name}</strong></span><small>{operation.heldCents ? `Зарезервировано ${formatRubles(operation.heldCents)}` : "Средства не заблокированы"}</small></div><div className="billing-operation-controls"><label><span>Факт, сек</span><input type="number" min="0" value={draft.actualSeconds} onChange={(event) => updateDraft(operation.id, { actualSeconds: event.target.value })} /></label><label><span>Результат</span><select value={draft.outcome} onChange={(event) => updateDraft(operation.id, { outcome: event.target.value })}>{Object.entries(OUTCOME_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button onClick={() => dispatch({ type: "COMPLETE_ANALYST", id: operation.id, actualSeconds: draft.actualSeconds, outcome: draft.outcome })}><IconCheck size={17} />Завершить</button></div></div>;
      }) : <EmptyState>Активных анализов нет</EmptyState>}
    </div>
  </article>;
}

function PolicyPanel({ state, dispatch }) {
  const policy = (name, value) => dispatch({ type: "SET_POLICY", policy: name, value });
  return <article className="billing-card billing-policy-card"><header><span><IconSettings size={20} /></span><div><h2>Лаборатория правил</h2><p>Спорные решения можно менять без переписывания логики</p></div></header><div className="billing-policy-grid">
    <label><span>Средства Аналитика при старте</span><select value={state.policies.analystReservation} onChange={(event) => policy("analystReservation", event.target.value)}><option value="check-only">Только проверить</option><option value="hold-estimate">Зарезервировать оценку</option></select><small>Проверка учитывает soft reserve Тренера.</small></label>
    <label><span>Отменённая операция</span><select value={state.policies.cancellation} onChange={(event) => policy("cancellation", event.target.value)}><option value="free">Не списывать</option><option value="charge-completed">Списать выполненное</option></select></label>
    <label><span>Частично выполненная</span><select value={state.policies.partial} onChange={(event) => policy("partial", event.target.value)}><option value="charge-completed">Списать выполненное</option><option value="free">Не списывать</option></select></label>
    <label><span>Не хватает при завершении</span><select value={state.policies.insufficientSettlement} onChange={(event) => policy("insufficientSettlement", event.target.value)}><option value="reject">Отклонить списание</option><option value="charge-available">Списать доступное</option></select></label>
  </div><div className="billing-fixed-rule"><IconShieldCheck size={18} /><span><strong>Неизменяемые правила</strong>Отрицательный баланс запрещён, техническая ошибка всегда бесплатна.</span></div></article>;
}

function FundingPanel({ state, dispatch }) {
  const [amountRubles, setAmountRubles] = useState(2500);
  const [analystMinutes, setAnalystMinutes] = useState(500);
  const [trainerMinutes, setTrainerMinutes] = useState(0);
  const [migrationAnalyst, setMigrationAnalyst] = useState(5000);
  const [migrationTrainer, setMigrationTrainer] = useState(1000);
  const recommendedCents = analystMinutes * BILLING_RATES.analyst + trainerMinutes * BILLING_RATES.trainer;
  const addQuick = (amount) => setAmountRubles((current) => Math.max(0, Number(current) || 0) + amount);
  return <article className="billing-card billing-funding-card"><header><span><IconWallet size={20} /></span><div><h2>Пополнение и калькулятор</h2><p>Платёжный сценарий симулируется локально</p></div></header><div className="billing-funding-grid"><div className="billing-topup-block"><label><span>Сумма пополнения</span><div><input type="number" min="0" value={amountRubles} onChange={(event) => setAmountRubles(event.target.value)} /><em>₽</em></div></label>{Number(amountRubles) > 0 && Number(amountRubles) < 1000 && <small className="billing-validation">Минимальная сумма — 1 000 ₽</small>}<div className="billing-quick-row">{[1000, 5000, 10000, 50000].map((amount) => <button key={amount} onClick={() => addQuick(amount)}>+{new Intl.NumberFormat("ru-RU").format(amount)} ₽</button>)}</div><div className="billing-payment-actions"><button className="billing-primary" onClick={() => dispatch({ type: "TOP_UP", amountCents: Number(amountRubles) * 100, success: true })}>Успешная оплата</button><button onClick={() => dispatch({ type: "TOP_UP", amountCents: Number(amountRubles) * 100, success: false })}>Симулировать ошибку</button></div></div><div className="billing-calculator"><h3>Не знаете, сколько пополнить?</h3><label><span>AI Аналитик <b>{analystMinutes} мин</b></span><input type="range" min="0" max="5000" step="50" value={analystMinutes} onChange={(event) => setAnalystMinutes(Number(event.target.value))} /></label><label><span>AI Тренер <b>{trainerMinutes} мин</b></span><input type="range" min="0" max="5000" step="50" value={trainerMinutes} onChange={(event) => setTrainerMinutes(Number(event.target.value))} /></label><div><span>Ориентировочный бюджет</span><strong>{formatRubles(recommendedCents)}</strong><button onClick={() => setAmountRubles(Math.round(recommendedCents / 100))}>Подставить сумму</button></div></div></div><details className="billing-migration"><summary>Миграционное начисление</summary><div><label><span>Остаток минут Аналитика</span><input type="number" min="0" value={migrationAnalyst} onChange={(event) => setMigrationAnalyst(event.target.value)} /></label><label><span>Остаток минут Тренера</span><input type="number" min="0" value={migrationTrainer} onChange={(event) => setMigrationTrainer(event.target.value)} /></label><button onClick={() => dispatch({ type: "MIGRATION_CREDIT", analystMinutes: migrationAnalyst, trainerMinutes: migrationTrainer })}>Начислить {formatRubles(migrationAnalyst * BILLING_RATES.analyst + migrationTrainer * BILLING_RATES.trainer)}</button></div></details></article>;
}

function RawLedger({ state, moduleFilter, typeFilter, dateFilter }) {
  const rows = state.ledger.filter((item) => (!moduleFilter || item.module === moduleFilter) && (!typeFilter || item.kind === typeFilter) && (!dateFilter || item.date === dateFilter));
  return <div className="billing-ledger-table raw"><div className="billing-ledger-head"><span>Событие</span><span>Модуль</span><span>Дата / время</span><span>Статус</span><span>Сумма</span></div>{rows.length ? rows.map((item) => <div className="billing-ledger-row" key={item.id}><span><strong>{EVENT_LABELS[item.kind] || item.kind}</strong><small>{item.title}</small></span><span>{item.module ? MODULE_LABELS[item.module] : "—"}</span><span>{item.date}<small>T+{item.minute} мин</small></span><span><StatusPill status={item.status} /></span><span><MoneyValue cents={item.amountCents} signed /></span></div>) : <EmptyState>По выбранным фильтрам операций нет</EmptyState>}</div>;
}

function ClientLedger({ state, moduleFilter, dateFilter, detail, setDetail }) {
  const history = selectClientHistory(state).filter((item) => (!moduleFilter || item.module === moduleFilter) && (!dateFilter || item.date === dateFilter));
  const details = detail ? state.ledger.filter((item) => detail.entryIds.includes(item.id)) : [];
  return <><div className="billing-ledger-table client"><div className="billing-ledger-head"><span>Тип операции</span><span>Модуль</span><span>Дата</span><span>Статус</span><span>Сумма</span></div>{history.length ? history.map((item) => <div className={detail?.id === item.id ? "billing-ledger-row selected" : "billing-ledger-row"} key={item.id}><span><strong>{item.type}</strong></span><span>{item.module ? MODULE_LABELS[item.module] : "—"}</span><span>{item.date}</span><span><StatusPill status={item.status} /></span><button className="billing-amount-link" onClick={() => setDetail(item)}><MoneyValue cents={item.amountCents} signed /></button></div>) : <EmptyState>Финансовых операций пока нет</EmptyState>}</div>{detail && <div className="billing-ledger-detail"><header><div><h3>Детализация операции</h3><p>{detail.date} · {detail.module ? MODULE_LABELS[detail.module] : "Общий баланс"}</p></div><button onClick={() => setDetail(null)}>Закрыть</button></header>{details.map((item) => <div key={item.id}><span>{item.title}</span><small>T+{item.minute} мин</small><MoneyValue cents={item.amountCents} signed /></div>)}</div>}</>;
}

function LedgerPanel({ state }) {
  const [view, setView] = useState("events");
  const [moduleFilter, setModuleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const dates = [...new Set(state.ledger.map((item) => item.date))].sort().reverse();
  const types = [...new Set(state.ledger.map((item) => item.kind))];
  return <article className="billing-card billing-ledger-card"><header className="billing-ledger-title"><div><span><IconCoin size={20} /></span><div><h2>Ledger операций</h2><p>Технические события и клиентская дневная история</p></div></div><div className="billing-ledger-tabs"><button className={view === "events" ? "active" : ""} onClick={() => { setView("events"); setDetail(null); }}>События</button><button className={view === "client" ? "active" : ""} onClick={() => { setView("client"); setDetail(null); }}>История платежей</button></div></header><div className="billing-ledger-filters"><select value={moduleFilter} onChange={(event) => { setModuleFilter(event.target.value); setDetail(null); }}><option value="">Все модули</option><option value="analyst">AI Аналитик</option><option value="trainer">AI Тренер</option></select><select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setDetail(null); }}><option value="">Все даты</option>{dates.map((date) => <option value={date} key={date}>{date}</option>)}</select>{view === "events" && <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Все события</option>{types.map((type) => <option value={type} key={type}>{EVENT_LABELS[type] || type}</option>)}</select>}</div>{view === "events" ? <RawLedger state={state} moduleFilter={moduleFilter} typeFilter={typeFilter} dateFilter={dateFilter} /> : <ClientLedger state={state} moduleFilter={moduleFilter} dateFilter={dateFilter} detail={detail} setDetail={setDetail} />}</article>;
}

export function BillingSimulator({ state, dispatch, autoplay, setAutoplay }) {
  const trainerReserve = selectTrainerReserve(state);
  const analystHold = selectAnalystHold(state);
  const analystAvailable = selectAvailableForAnalyst(state);
  const activeTrainers = state.trainerSessions.filter((session) => session.status === "active").length;
  const minutesAvailable = activeTrainers ? Math.floor(state.balanceCents / (activeTrainers * BILLING_RATES.trainer)) : 0;
  const summary = useMemo(() => ({ trainerReserve, analystHold, analystAvailable }), [trainerReserve, analystHold, analystAvailable]);
  const reset = () => {
    if (window.confirm("Сбросить баланс, сессии, политики и ledger к начальному сценарию?")) {
      setAutoplay(false);
      dispatch({ type: "RESET" });
    }
  };
  return <section className="billing-page"><div className="billing-page-title"><div><span className="billing-title-icon"><IconWallet size={22} /></span><div><h1>Симулятор тарификации</h1><p>Проверяйте финансовые сценарии без реальных платежей и backend</p></div></div><div className="billing-page-actions"><label><span>Сценарий</span><select defaultValue="default" onChange={(event) => { setAutoplay(false); dispatch({ type: "LOAD_SCENARIO", scenario: event.target.value }); }}><option value="" disabled>Выберите сценарий</option>{BILLING_SCENARIOS.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.label}</option>)}</select></label><button onClick={() => dispatch({ type: "ADVANCE_DAY" })}><IconCalendar size={17} />Следующий день</button><button onClick={reset}><IconRefresh size={17} />Сбросить</button></div></div>
    {state.notice && <div className={`billing-notice ${state.notice.tone}`}><span>{state.notice.tone === "success" ? <IconCheck size={18} /> : state.notice.tone === "error" || state.notice.tone === "warning" ? <IconAlertTriangle size={18} /> : <IconBolt size={18} />}</span><p>{state.notice.message}</p></div>}
    <div className="billing-summary"><SummaryCard icon={IconWallet} label="Единый баланс" value={formatRubles(state.balanceCents)} hint="Не сгорает и общий для модулей" tone="balance" /><SummaryCard icon={IconShieldCheck} label="Soft reserve Тренера" value={formatRubles(summary.trainerReserve)} hint={`${activeTrainers} активных сессий · ${minutesAvailable} мин доступно`} tone="reserve" /><SummaryCard icon={IconRobot} label="Доступно Аналитику" value={formatRubles(summary.analystAvailable)} hint={summary.analystHold ? `Ещё ${formatRubles(summary.analystHold)} удержано Аналитиком` : "Баланс за вычетом резерва Тренера"} tone="available" /></div>
    <div className="billing-module-grid"><TrainerPanel state={state} dispatch={dispatch} autoplay={autoplay} setAutoplay={setAutoplay} /><AnalystPanel state={state} dispatch={dispatch} /></div>
    <div className="billing-secondary-grid"><PolicyPanel state={state} dispatch={dispatch} /><FundingPanel state={state} dispatch={dispatch} /></div>
    <LedgerPanel state={state} />
  </section>;
}

