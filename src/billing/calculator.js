import { BILLING_RATES } from "./engine.js";

export const TRAINER_RECOMMENDATION_SHARE = 0.25;

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

export function calculateTrainerRecommendation(analystCostCents) {
  const safeAnalystCost = Math.max(0, Number(analystCostCents) || 0);
  const trainerCostCents = Math.round(safeAnalystCost * TRAINER_RECOMMENDATION_SHARE);
  const trainerMinutes = Math.floor(trainerCostCents / BILLING_RATES.trainer);
  return { trainerCostCents, trainerMinutes };
}
