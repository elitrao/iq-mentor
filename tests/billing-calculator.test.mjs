import test from "node:test";
import assert from "node:assert/strict";
import { calculateBillingEstimate } from "../src/billing/calculator.js";

test("calculates monthly calls, minutes and Analyst budget", () => {
  assert.deepEqual(calculateBillingEstimate({ managers: 10, callsPerManager: 300, averageDurationMinutes: 4 }), { monthlyCalls: 3000, monthlyMinutes: 12000, monthlyCostCents: 6000000 });
});

test("supports fractional duration and clamps negative input", () => {
  assert.deepEqual(calculateBillingEstimate({ managers: 2, callsPerManager: 25, averageDurationMinutes: 3.5 }), { monthlyCalls: 50, monthlyMinutes: 175, monthlyCostCents: 87500 });
  assert.deepEqual(calculateBillingEstimate({ managers: -2, callsPerManager: 25, averageDurationMinutes: 3 }), { monthlyCalls: 0, monthlyMinutes: 0, monthlyCostCents: 0 });
});
