export const BILLING_STORAGE_KEY = "iq-mentor-minute-billing-v1";

export const BILLING_RATES = Object.freeze({
  analyst: 500,
  trainer: 1200,
});

export const BILLING_SCENARIOS = Object.freeze([
  { id: "default", label: "Чистый сценарий" },
  { id: "parallel", label: "Параллельный старт" },
  { id: "exhaustion", label: "Баланс заканчивается" },
  { id: "conflict", label: "Конфликт Тренера и Аналитика" },
  { id: "error", label: "Техническая ошибка" },
  { id: "partial", label: "Частичное выполнение" },
  { id: "disabled", label: "Модуль выключен" },
  { id: "payment-failure", label: "Ошибка пополнения" },
  { id: "rounding", label: "Граница округления" },
]);

const DEFAULT_DATE = "2026-09-01";

function clampMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function roundBillableMinutes(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return Math.floor(safeSeconds / 60 + 0.5);
}

export function formatRubles(cents, sign = false) {
  const value = Math.round((Number(cents) || 0) / 100);
  const prefix = sign && value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function activeTrainers(state) {
  return state.trainerSessions.filter((session) => session.status === "active");
}

function activeAnalystOperations(state) {
  return state.analystOperations.filter((operation) => operation.status === "active");
}

export function selectTrainerReserve(state) {
  // Soft reserve covers each active session's next minute without debiting the balance.
  return activeTrainers(state).length * BILLING_RATES.trainer;
}

export function selectAnalystHold(state) {
  return activeAnalystOperations(state).reduce((sum, operation) => sum + (operation.heldCents || 0), 0);
}

export function selectAvailableForAnalyst(state) {
  return Math.max(0, state.balanceCents - selectTrainerReserve(state) - selectAnalystHold(state));
}

export function selectTrainerSpendable(state) {
  return Math.max(0, state.balanceCents - selectAnalystHold(state));
}

export function selectTrainerWarning(state) {
  const reserve = selectTrainerReserve(state);
  if (!reserve) return null;
  if (selectTrainerSpendable(state) < reserve) {
    return "На балансе заканчиваются средства. Тренировки будут завершены перед следующей минутой.";
  }
  if (selectTrainerSpendable(state) < reserve * 2) {
    return "На балансе заканчиваются средства. Тренировки будут завершены через 1 минуту.";
  }
  return null;
}

function nextId(state, prefix) {
  return `${prefix}-${String(state.sequence).padStart(4, "0")}`;
}

function entry(state, payload) {
  return {
    id: nextId(state, "event"),
    date: state.simulationDate,
    minute: state.simulationMinute,
    amountCents: 0,
    module: null,
    status: "success",
    entityId: null,
    meta: {},
    ...payload,
  };
}

function addEntries(state, entries, patch = {}) {
  return {
    ...state,
    ...patch,
    sequence: state.sequence + entries.length,
    ledger: [...entries.map((item, index) => ({ ...item, id: `event-${String(state.sequence + index).padStart(4, "0")}` })), ...state.ledger],
  };
}

function notice(state, tone, message) {
  return { ...state, notice: { id: state.sequence, tone, message } };
}

function openingEntry(balanceCents, title = "Стартовый баланс") {
  return {
    id: "event-0001",
    date: DEFAULT_DATE,
    minute: 0,
    kind: "opening_balance",
    title,
    module: null,
    amountCents: balanceCents,
    status: "success",
    entityId: null,
    meta: {},
  };
}

export function createInitialBillingState(overrides = {}) {
  const balanceCents = clampMoney(overrides.balanceCents ?? 250000);
  return {
    version: 1,
    balanceCents,
    simulationDate: DEFAULT_DATE,
    simulationMinute: 0,
    sequence: 2,
    modules: { analyst: true, trainer: true },
    policies: {
      analystReservation: "check-only",
      cancellation: "free",
      partial: "charge-completed",
      insufficientSettlement: "reject",
    },
    trainerSessions: [],
    analystOperations: [],
    ledger: [openingEntry(balanceCents)],
    notice: null,
    ...overrides,
  };
}

export function hydrateBillingState(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.ledger)) return createInitialBillingState();
    return createInitialBillingState({
      ...parsed,
      balanceCents: clampMoney(parsed.balanceCents),
      modules: { analyst: true, trainer: true, ...parsed.modules },
      policies: { ...createInitialBillingState().policies, ...parsed.policies },
    });
  } catch {
    return createInitialBillingState();
  }
}

function makeScenario(id) {
  const base = createInitialBillingState();
  if (id === "parallel") {
    let state = createInitialBillingState({ balanceCents: 12000 });
    state = billingReducer(state, { type: "START_TRAINERS", count: 5 });
    return notice(state, "info", "Пять тренировок запущены атомарно. Следующий резерв — 60 ₽.");
  }
  if (id === "exhaustion") {
    let state = createInitialBillingState({ balanceCents: 4800 });
    state = billingReducer(state, { type: "START_TRAINERS", count: 2 });
    return notice(state, "warning", "Двум тренировкам хватает ровно на две минуты.");
  }
  if (id === "conflict") {
    let state = createInitialBillingState({ balanceCents: 10000 });
    state = billingReducer(state, { type: "START_TRAINERS", count: 2 });
    state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 720 });
    return notice(state, "warning", "Аналитик прошёл проверку, но деньги не заблокированы. Прокрутите минуты Тренера и завершите анализ.");
  }
  if (id === "error") {
    let state = createInitialBillingState({ balanceCents: 50000 });
    state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 600 });
    return notice(state, "info", "Завершите активный анализ с результатом «Техническая ошибка» — списания не будет.");
  }
  if (id === "partial") {
    let state = createInitialBillingState({ balanceCents: 50000 });
    state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 900 });
    return notice(state, "info", "Сравните политики частичного выполнения перед завершением операции.");
  }
  if (id === "disabled") {
    return billingReducer(createInitialBillingState({ balanceCents: 50000 }), { type: "TOGGLE_MODULE", module: "trainer", enabled: false });
  }
  if (id === "payment-failure") {
    return billingReducer(createInitialBillingState({ balanceCents: 0 }), { type: "TOP_UP", amountCents: 500000, success: false });
  }
  if (id === "rounding") {
    let state = createInitialBillingState({ balanceCents: 10000 });
    state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 29 });
    state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 30 });
    return notice(state, "info", "29 секунд округляются до 0 минут, 30 секунд — до 1 минуты.");
  }
  return base;
}

function toggleModule(state, action) {
  const module = action.module;
  if (!Object.hasOwn(state.modules, module)) return state;
  const enabled = typeof action.enabled === "boolean" ? action.enabled : !state.modules[module];
  const next = addEntries(state, [entry(state, {
    kind: "module_toggle",
    title: `${module === "analyst" ? "AI Аналитик" : "AI Тренер"}: модуль ${enabled ? "включён" : "выключен"}`,
    module,
    status: "info",
    meta: { enabled },
  })], { modules: { ...state.modules, [module]: enabled } });
  return notice(next, enabled ? "success" : "warning", `Модуль ${enabled ? "включён" : "выключен"}. Активные операции не прерываются.`);
}

function topUp(state, action) {
  const amountCents = clampMoney(action.amountCents);
  if (amountCents < 100000) {
    const next = addEntries(state, [entry(state, {
      kind: "top_up_failed",
      title: "Пополнение отклонено: сумма меньше 1 000 ₽",
      amountCents,
      status: "failed",
    })]);
    return notice(next, "error", "Минимальная сумма пополнения — 1 000 ₽.");
  }
  if (!action.success) {
    const next = addEntries(state, [entry(state, {
      kind: "top_up_failed",
      title: "Ошибка оплаты",
      amountCents,
      status: "failed",
    })]);
    return notice(next, "error", "Оплата не прошла. Баланс не изменился.");
  }
  const next = addEntries(state, [entry(state, {
    kind: "top_up",
    title: "Пополнение общего баланса",
    amountCents,
  })], { balanceCents: state.balanceCents + amountCents });
  return notice(next, "success", `Баланс пополнен на ${formatRubles(amountCents)}.`);
}

function migrationCredit(state, action) {
  const analystMinutes = Math.max(0, Math.round(Number(action.analystMinutes) || 0));
  const trainerMinutes = Math.max(0, Math.round(Number(action.trainerMinutes) || 0));
  const amountCents = analystMinutes * BILLING_RATES.analyst + trainerMinutes * BILLING_RATES.trainer;
  if (!amountCents) return notice(state, "error", "Укажите остаток минут хотя бы одного модуля.");
  const next = addEntries(state, [entry(state, {
    kind: "migration_credit",
    title: "Миграционное начисление",
    amountCents,
    meta: { analystMinutes, trainerMinutes },
  })], { balanceCents: state.balanceCents + amountCents });
  return notice(next, "success", `Начислено ${formatRubles(amountCents)} за неиспользованные минуты.`);
}

function startTrainers(state, action) {
  const count = Math.max(1, Math.min(50, Math.round(Number(action.count) || 1)));
  if (!state.modules.trainer) {
    const next = addEntries(state, [entry(state, { kind: "trainer_start_rejected", title: "Запуск Тренера отклонён: модуль выключен", module: "trainer", status: "failed", meta: { count } })]);
    return notice(next, "error", "AI Тренер выключен. Новые сессии не запускаются.");
  }
  const current = activeTrainers(state).length;
  const projectedReserve = (current + count) * BILLING_RATES.trainer;
  if (selectTrainerSpendable(state) < projectedReserve) {
    const next = addEntries(state, [entry(state, {
      kind: "trainer_start_rejected",
      title: `Запуск ${count} тренировок отклонён: недостаточно средств`,
      module: "trainer",
      status: "failed",
      meta: { count, projectedReserve },
    })]);
    return notice(next, "error", `Нужно ${formatRubles(projectedReserve)} для следующей минуты всех сессий.`);
  }
  const sessions = Array.from({ length: count }, (_, index) => ({
    id: `trainer-${String(state.sequence).padStart(4, "0")}-${index + 1}`,
    name: `Тренировка #${String(state.sequence).padStart(3, "0")}.${index + 1}`,
    startedDate: state.simulationDate,
    startedMinute: state.simulationMinute,
    elapsedMinutes: 0,
    status: "active",
  }));
  const entries = [
    entry(state, { kind: "trainer_started", title: `Запущено тренировок: ${count}`, module: "trainer", meta: { count } }),
    entry(state, { kind: "reserve_changed", title: `Soft reserve Тренера: ${formatRubles(projectedReserve)}`, module: "trainer", status: "info", meta: { reserveCents: projectedReserve } }),
  ];
  const next = addEntries(state, entries, { trainerSessions: [...state.trainerSessions, ...sessions] });
  return notice(next, "success", `${count === 1 ? "Тренировка запущена" : `Запущено ${count} тренировок`}. Проверка выполнена атомарно.`);
}

function trainerTick(state) {
  const sessions = activeTrainers(state);
  if (!sessions.length) return notice(state, "info", "Нет активных тренировок для списания.");
  const requiredCents = sessions.length * BILLING_RATES.trainer;
  if (selectTrainerSpendable(state) < requiredCents) {
    const stopped = state.trainerSessions.map((session) => session.status === "active" ? { ...session, status: "stopped_insufficient" } : session);
    const next = addEntries(state, [
      entry(state, { kind: "trainer_stopped", title: "Все тренировки остановлены до неоплачиваемой минуты", module: "trainer", status: "failed", meta: { count: sessions.length, requiredCents } }),
      entry(state, { kind: "reserve_changed", title: "Soft reserve Тренера снят", module: "trainer", status: "info", meta: { reserveCents: 0 } }),
    ], { trainerSessions: stopped });
    return notice(next, "error", "Средств на следующую минуту всех сессий недостаточно. Тренировки завершены без ухода в минус.");
  }
  const updated = state.trainerSessions.map((session) => session.status === "active" ? { ...session, elapsedMinutes: session.elapsedMinutes + 1 } : session);
  const balanceCents = state.balanceCents - requiredCents;
  const nextReserve = sessions.length * BILLING_RATES.trainer;
  const entries = [entry(state, {
    kind: "trainer_charge",
    title: `Минута ${sessions.length} активных тренировок`,
    module: "trainer",
    amountCents: -requiredCents,
    meta: { count: sessions.length, rateCents: BILLING_RATES.trainer },
  })];
  if (Math.max(0, balanceCents - selectAnalystHold(state)) < nextReserve) {
    entries.push(entry(state, { kind: "balance_warning", title: "Следующая минута Тренера не обеспечена", module: "trainer", status: "warning", meta: { reserveCents: nextReserve } }));
  }
  return addEntries(state, entries, {
    balanceCents,
    simulationMinute: state.simulationMinute + 1,
    trainerSessions: updated,
    notice: Math.max(0, balanceCents - selectAnalystHold(state)) < nextReserve
      ? { id: state.sequence, tone: "warning", message: "Оплаченная минута завершена. Следующая минута всех тренировок уже не обеспечена." }
      : { id: state.sequence, tone: "success", message: `Списано ${formatRubles(requiredCents)} за минуту Тренера.` },
  });
}

function stopTrainer(state, action) {
  const target = state.trainerSessions.find((session) => session.id === action.id && session.status === "active");
  if (!target) return state;
  const trainerSessions = state.trainerSessions.map((session) => session.id === action.id ? { ...session, status: "completed" } : session);
  const nextReserve = Math.max(0, (activeTrainers(state).length - 1) * BILLING_RATES.trainer);
  const next = addEntries(state, [
    entry(state, { kind: "trainer_completed", title: `${target.name} завершена`, module: "trainer", entityId: target.id, meta: { elapsedMinutes: target.elapsedMinutes } }),
    entry(state, { kind: "reserve_changed", title: `Soft reserve Тренера: ${formatRubles(nextReserve)}`, module: "trainer", status: "info", meta: { reserveCents: nextReserve } }),
  ], { trainerSessions });
  return notice(next, "success", `${target.name} завершена вручную.`);
}

function startAnalyst(state, action) {
  const expectedSeconds = Math.max(0, Math.round(Number(action.expectedSeconds) || 0));
  const expectedMinutes = roundBillableMinutes(expectedSeconds);
  const expectedCostCents = expectedMinutes * BILLING_RATES.analyst;
  if (!state.modules.analyst) {
    const next = addEntries(state, [entry(state, { kind: "analyst_start_rejected", title: "Анализ отклонён: модуль выключен", module: "analyst", status: "failed", meta: { expectedSeconds } })]);
    return notice(next, "error", "AI Аналитик выключен. Новые операции не запускаются.");
  }
  if (selectAvailableForAnalyst(state) < expectedCostCents) {
    const next = addEntries(state, [entry(state, {
      kind: "analyst_start_rejected",
      title: "Анализ отклонён: недостаточно доступных средств",
      module: "analyst",
      status: "failed",
      meta: { expectedSeconds, expectedCostCents },
    })]);
    return notice(next, "error", `Аналитику доступно ${formatRubles(selectAvailableForAnalyst(state))}, нужно ${formatRubles(expectedCostCents)}.`);
  }
  const id = nextId(state, "analyst");
  const heldCents = state.policies.analystReservation === "hold-estimate" ? expectedCostCents : 0;
  const operation = {
    id,
    name: `Анализ #${String(state.sequence).padStart(3, "0")}`,
    expectedSeconds,
    expectedMinutes,
    expectedCostCents,
    heldCents,
    status: "active",
    startedDate: state.simulationDate,
    startedMinute: state.simulationMinute,
  };
  const entries = [entry(state, { kind: "analyst_started", title: `${operation.name} запущен`, module: "analyst", entityId: id, meta: { expectedSeconds, expectedMinutes, expectedCostCents } })];
  if (heldCents) entries.push(entry(state, { kind: "reserve_changed", title: `Резерв Аналитика: ${formatRubles(heldCents)}`, module: "analyst", status: "info", entityId: id, meta: { reserveCents: heldCents } }));
  const next = addEntries(state, entries, { analystOperations: [...state.analystOperations, operation] });
  return notice(next, "success", heldCents ? `Анализ запущен, ${formatRubles(heldCents)} зарезервировано.` : "Анализ запущен после проверки средств без блокировки.");
}

function analystDesiredCharge(state, outcome, actualSeconds) {
  const actualMinutes = roundBillableMinutes(actualSeconds);
  if (outcome === "technical_error") return { actualMinutes, desiredCents: 0, reason: "Техническая ошибка на стороне IQ Mentor" };
  if (outcome === "canceled" && state.policies.cancellation === "free") return { actualMinutes, desiredCents: 0, reason: "Отмена бесплатна по выбранной политике" };
  if (outcome === "partial" && state.policies.partial === "free") return { actualMinutes, desiredCents: 0, reason: "Частичное выполнение бесплатно по выбранной политике" };
  return { actualMinutes, desiredCents: actualMinutes * BILLING_RATES.analyst, reason: "Фактически выполненные минуты" };
}

function completeAnalyst(state, action) {
  const operation = state.analystOperations.find((item) => item.id === action.id && item.status === "active");
  if (!operation) return state;
  const outcome = ["success", "technical_error", "canceled", "partial"].includes(action.outcome) ? action.outcome : "success";
  const actualSeconds = Math.max(0, Math.round(Number(action.actualSeconds) || 0));
  const { actualMinutes, desiredCents, reason } = analystDesiredCharge(state, outcome, actualSeconds);
  const otherHeld = activeAnalystOperations(state).filter((item) => item.id !== operation.id).reduce((sum, item) => sum + (item.heldCents || 0), 0);
  const payableCents = Math.max(0, state.balanceCents - selectTrainerReserve(state) - otherHeld);
  let chargedCents = desiredCents;
  let status = "completed";
  let settlementStatus = "success";
  if (desiredCents > payableCents) {
    if (state.policies.insufficientSettlement === "charge-available") {
      chargedCents = payableCents;
      status = "completed_underpaid";
      settlementStatus = "warning";
    } else {
      chargedCents = 0;
      status = "completed_unpaid";
      settlementStatus = "failed";
    }
  }
  const analystOperations = state.analystOperations.map((item) => item.id === operation.id ? {
    ...item,
    status,
    outcome,
    actualSeconds,
    actualMinutes,
    desiredCents,
    chargedCents,
    heldCents: 0,
  } : item);
  const entries = [];
  if (operation.heldCents) entries.push(entry(state, { kind: "reserve_changed", title: `Резерв ${operation.name} снят`, module: "analyst", status: "info", entityId: operation.id, meta: { reserveCents: 0 } }));
  entries.push(entry(state, {
    kind: chargedCents ? "analyst_charge" : "analyst_no_charge",
    title: chargedCents ? `${operation.name}: списание за использование` : `${operation.name}: без списания`,
    module: "analyst",
    amountCents: -chargedCents,
    status: settlementStatus,
    entityId: operation.id,
    meta: { outcome, actualSeconds, actualMinutes, desiredCents, chargedCents, shortfallCents: Math.max(0, desiredCents - chargedCents), reason },
  }));
  const next = addEntries(state, entries, { balanceCents: state.balanceCents - chargedCents, analystOperations });
  if (settlementStatus === "failed") return notice(next, "error", `Операция выполнена, но списание ${formatRubles(desiredCents)} отклонено: защищён резерв Тренера.`);
  if (settlementStatus === "warning") return notice(next, "warning", `Списано только ${formatRubles(chargedCents)} из ${formatRubles(desiredCents)}. Недоплата зафиксирована.`);
  if (!chargedCents) return notice(next, "success", `${reason}. Баланс не изменился.`);
  return notice(next, "success", `Списано ${formatRubles(chargedCents)} за ${actualMinutes} мин. Аналитика.`);
}

function setPolicy(state, action) {
  if (!Object.hasOwn(state.policies, action.policy)) return state;
  const next = addEntries(state, [entry(state, {
    kind: "policy_changed",
    title: `Изменена политика: ${action.policy}`,
    status: "info",
    meta: { policy: action.policy, value: action.value },
  })], { policies: { ...state.policies, [action.policy]: action.value } });
  return notice(next, "info", "Политика применена к следующим операциям.");
}

function advanceDay(state) {
  const date = new Date(`${state.simulationDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  const simulationDate = date.toISOString().slice(0, 10);
  return addEntries(state, [entry(state, { kind: "day_changed", title: `Расчётная дата: ${simulationDate}`, status: "info" })], { simulationDate, simulationMinute: 0 });
}

export function billingReducer(state, action) {
  switch (action.type) {
    case "RESET": return createInitialBillingState();
    case "LOAD_SCENARIO": return makeScenario(action.scenario);
    case "TOGGLE_MODULE": return toggleModule(state, action);
    case "TOP_UP": return topUp(state, action);
    case "MIGRATION_CREDIT": return migrationCredit(state, action);
    case "START_TRAINERS": return startTrainers(state, action);
    case "TRAINER_TICK": return trainerTick(state);
    case "STOP_TRAINER": return stopTrainer(state, action);
    case "START_ANALYST": return startAnalyst(state, action);
    case "COMPLETE_ANALYST": return completeAnalyst(state, action);
    case "SET_POLICY": return setPolicy(state, action);
    case "ADVANCE_DAY": return advanceDay(state);
    default: return state;
  }
}

export function selectClientHistory(state) {
  const result = [];
  const grouped = new Map();
  for (const item of [...state.ledger].reverse()) {
    if (["top_up", "migration_credit"].includes(item.kind)) {
      result.push({
        id: `client-${item.id}`,
        date: item.date,
        type: item.kind === "migration_credit" ? "Миграционное начисление" : "Пополнение баланса",
        module: null,
        amountCents: item.amountCents,
        status: item.status,
        entryIds: [item.id],
      });
      continue;
    }
    if (!["trainer_charge", "analyst_charge"].includes(item.kind) || !item.amountCents) continue;
    const key = `${item.date}:${item.module}`;
    if (!grouped.has(key)) {
      const row = {
        id: `client-${key}`,
        date: item.date,
        type: "Списание за использование (за день)",
        module: item.module,
        amountCents: 0,
        status: "success",
        entryIds: [],
      };
      grouped.set(key, row);
      result.push(row);
    }
    const row = grouped.get(key);
    row.amountCents += item.amountCents;
    row.entryIds.push(item.id);
  }
  return result.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

