import { BILLING_RATES } from "./engine.js";

export function calculateBillingEstimate({ managers, callsPerManager, averageDurationMinutes, trainerMinutesPerManager = 0 }) {
  const safeManagers = Math.max(0, Number(managers) || 0);
  const safeCalls = Math.max(0, Number(callsPerManager) || 0);
  const safeDuration = Math.max(0, Number(averageDurationMinutes) || 0);
  const safeTrainerMinutes = Math.max(0, Number(trainerMinutesPerManager) || 0);
  const monthlyCalls = safeManagers * safeCalls;
  const analystMinutes = monthlyCalls * safeDuration;
  const trainerMinutes = safeManagers * safeTrainerMinutes;
  const analystCostCents = Math.round(analystMinutes * BILLING_RATES.analyst);
  const trainerCostCents = Math.round(trainerMinutes * BILLING_RATES.trainer);
  return { monthlyCalls, analystMinutes, trainerMinutes, analystCostCents, trainerCostCents, totalCostCents: analystCostCents + trainerCostCents };
}
