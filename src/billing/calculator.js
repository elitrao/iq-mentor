import { BILLING_RATES } from "./engine.js";

export function calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes }) {
  const safeManagers = Math.max(0, Number(managers) || 0);
  const safeCalls = Math.max(0, Number(callsPerManager) || 0);
  const safeDuration = Math.max(0, Number(averageDurationMinutes) || 0);
  const monthlyCalls = safeManagers * safeCalls;
  const monthlyMinutes = monthlyCalls * safeDuration;
  return { monthlyCalls, monthlyMinutes, monthlyCostCents: Math.round(monthlyMinutes * BILLING_RATES.analyst) };
}
