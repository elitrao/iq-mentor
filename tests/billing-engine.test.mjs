import test from "node:test";
import assert from "node:assert/strict";
import {
  BILLING_RATES, billingReducer, createInitialBillingState, roundBillableMinutes,
  selectAvailableForAnalyst, selectClientHistory, selectTrainerReserve,
} from "../src/billing/engine.js";

function reduce(state, ...actions) {
  return actions.reduce((current, action) => billingReducer(current, action), state);
}

test("rounds total duration mathematically at the 30 second boundary", () => {
  assert.equal(roundBillableMinutes(0), 0);
  assert.equal(roundBillableMinutes(29), 0);
  assert.equal(roundBillableMinutes(30), 1);
  assert.equal(roundBillableMinutes(89), 1);
  assert.equal(roundBillableMinutes(90), 2);
});

test("starts parallel trainer sessions atomically and rejects an unaffordable batch", () => {
  const state = createInitialBillingState({ balanceCents: 2400 });
  const rejected = billingReducer(state, { type: "START_TRAINERS", count: 3 });
  assert.equal(rejected.trainerSessions.length, 0);
  assert.equal(rejected.balanceCents, 2400);
  assert.equal(rejected.ledger[0].kind, "trainer_start_rejected");

  const accepted = billingReducer(state, { type: "START_TRAINERS", count: 2 });
  assert.equal(accepted.trainerSessions.filter((session) => session.status === "active").length, 2);
  assert.equal(selectTrainerReserve(accepted), 2400);
});

test("charges every active trainer session as one atomic minute batch", () => {
  const started = billingReducer(createInitialBillingState({ balanceCents: 6000 }), { type: "START_TRAINERS", count: 3 });
  const ticked = billingReducer(started, { type: "TRAINER_TICK" });
  assert.equal(ticked.balanceCents, 2400);
  assert.equal(ticked.simulationMinute, 1);
  assert.deepEqual(ticked.trainerSessions.map((session) => session.elapsedMinutes), [1, 1, 1]);
  assert.equal(ticked.ledger.find((entry) => entry.kind === "trainer_charge").amountCents, -3600);
});

test("assigns unique trainer session ids across repeated batch starts", () => {
  let state = billingReducer(createInitialBillingState({ balanceCents: 12000 }), { type: "START_TRAINERS", count: 3 });
  state = billingReducer(state, { type: "START_TRAINERS", count: 2 });
  const ids = state.trainerSessions.map((session) => session.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("stops all trainer sessions before an unaffordable minute without going negative", () => {
  let state = billingReducer(createInitialBillingState({ balanceCents: 2400 }), { type: "START_TRAINERS", count: 2 });
  state = billingReducer(state, { type: "TRAINER_TICK" });
  assert.equal(state.balanceCents, 0);
  state = billingReducer(state, { type: "TRAINER_TICK" });
  assert.equal(state.balanceCents, 0);
  assert.ok(state.trainerSessions.every((session) => session.status === "stopped_insufficient"));
  assert.equal(selectTrainerReserve(state), 0);
});

test("trainer soft reserve reduces the amount available to Analyst", () => {
  const state = billingReducer(createInitialBillingState({ balanceCents: 10000 }), { type: "START_TRAINERS", count: 3 });
  assert.equal(selectTrainerReserve(state), 3600);
  assert.equal(selectAvailableForAnalyst(state), 6400);
  const rejected = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 780 });
  assert.equal(rejected.analystOperations.length, 0);
});

test("technical Analyst errors never charge the customer", () => {
  let state = billingReducer(createInitialBillingState({ balanceCents: 10000 }), { type: "START_ANALYST", expectedSeconds: 600 });
  const operation = state.analystOperations[0];
  state = billingReducer(state, { type: "COMPLETE_ANALYST", id: operation.id, actualSeconds: 600, outcome: "technical_error" });
  assert.equal(state.balanceCents, 10000);
  assert.equal(state.ledger[0].kind, "analyst_no_charge");
  assert.equal(state.ledger[0].meta.desiredCents, 0);
});

test("partial Analyst operations follow the selected settlement policy", () => {
  let charged = billingReducer(createInitialBillingState({ balanceCents: 10000 }), { type: "START_ANALYST", expectedSeconds: 600 });
  charged = billingReducer(charged, { type: "COMPLETE_ANALYST", id: charged.analystOperations[0].id, actualSeconds: 210, outcome: "partial" });
  assert.equal(charged.balanceCents, 8000);

  let free = billingReducer(createInitialBillingState({ balanceCents: 10000 }), { type: "SET_POLICY", policy: "partial", value: "free" });
  free = billingReducer(free, { type: "START_ANALYST", expectedSeconds: 600 });
  free = billingReducer(free, { type: "COMPLETE_ANALYST", id: free.analystOperations[0].id, actualSeconds: 210, outcome: "partial" });
  assert.equal(free.balanceCents, 10000);
});

test("hard Analyst hold is excluded from trainer spendable funds", () => {
  let state = createInitialBillingState({ balanceCents: 6000 });
  state = billingReducer(state, { type: "SET_POLICY", policy: "analystReservation", value: "hold-estimate" });
  state = billingReducer(state, { type: "START_ANALYST", expectedSeconds: 600 });
  assert.equal(state.analystOperations[0].heldCents, 5000);
  state = billingReducer(state, { type: "START_TRAINERS", count: 1 });
  assert.equal(state.trainerSessions.length, 0);
  assert.equal(state.balanceCents, 6000);
});

test("failed top-up leaves balance unchanged and successful top-up updates it", () => {
  const initial = createInitialBillingState({ balanceCents: 0 });
  const failed = billingReducer(initial, { type: "TOP_UP", amountCents: 500000, success: false });
  assert.equal(failed.balanceCents, 0);
  const successful = billingReducer(failed, { type: "TOP_UP", amountCents: 500000, success: true });
  assert.equal(successful.balanceCents, 500000);
});

test("migration converts remaining module minutes using current rates", () => {
  const state = billingReducer(createInitialBillingState({ balanceCents: 0 }), { type: "MIGRATION_CREDIT", analystMinutes: 5000, trainerMinutes: 1000 });
  assert.equal(state.balanceCents, 5000 * BILLING_RATES.analyst + 1000 * BILLING_RATES.trainer);
});

test("client history groups usage charges by day and module", () => {
  let state = createInitialBillingState({ balanceCents: 10000 });
  state = reduce(state,
    { type: "START_TRAINERS", count: 1 },
    { type: "TRAINER_TICK" },
    { type: "TRAINER_TICK" },
    { type: "ADVANCE_DAY" },
    { type: "TRAINER_TICK" },
  );
  const trainerRows = selectClientHistory(state).filter((row) => row.module === "trainer");
  assert.equal(trainerRows.length, 2);
  assert.deepEqual(trainerRows.map((row) => row.amountCents).sort((a, b) => a - b), [-2400, -1200]);
});

test("every supported path preserves the non-negative balance invariant", () => {
  let state = createInitialBillingState({ balanceCents: 1200 });
  state = reduce(state,
    { type: "START_TRAINERS", count: 1 },
    { type: "TRAINER_TICK" },
    { type: "TRAINER_TICK" },
    { type: "TOP_UP", amountCents: 99900, success: true },
    { type: "START_ANALYST", expectedSeconds: 3600 },
  );
  assert.ok(state.balanceCents >= 0);
});

