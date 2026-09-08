import test from "node:test";
import assert from "node:assert/strict";
import { calculateBillingEstimate } from "../src/billing/calculator.js";

test("calculates Analyst, Trainer and combined monthly budgets", () => {
  assert.deepEqual(calculateBillingEstimate({ managers: 10, callsPerManager: 300, averageDurationMinutes: 4, trainerMinutesPerManager: 60 }), {
    monthlyCalls: 3000,
    analystMinutes: 12000,
    trainerMinutes: 600,
    analystCostCents: 6000000,
    trainerCostCents: 720000,
    totalCostCents: 6720000,
  });
});

test("supports fractional duration and clamps negative input", () => {
  assert.deepEqual(calculateBillingEstimate({ managers: 2, callsPerManager: 25, averageDurationMinutes: 3.5, trainerMinutesPerManager: 30 }), { monthlyCalls: 50, analystMinutes: 175, trainerMinutes: 60, analystCostCents: 87500, trainerCostCents: 72000, totalCostCents: 159500 });
  assert.deepEqual(calculateBillingEstimate({ managers: -2, callsPerManager: 25, averageDurationMinutes: 3, trainerMinutesPerManager: 30 }), { monthlyCalls: 0, analystMinutes: 0, trainerMinutes: 0, analystCostCents: 0, trainerCostCents: 0, totalCostCents: 0 });
});
