export const MIN_TOP_UP = 25000;
export const MAX_TOP_UP = 750000;
export const TOP_UP_STEP = 25000;
export const BONUS_TIERS = Object.freeze([
  { threshold: MIN_TOP_UP, rate: 0 },
  { threshold: 50000, rate: 5 },
  { threshold: 100000, rate: 10 },
  { threshold: 250000, rate: 15 },
  { threshold: 500000, rate: 20 },
]);

export function getTopUpBonus(amount) {
  const amountRubles = Math.max(0, Math.round(Number(amount) || 0));
  const valid = amountRubles >= MIN_TOP_UP && amountRubles <= MAX_TOP_UP;
  const currentTier = [...BONUS_TIERS].reverse().find((tier) => amountRubles >= tier.threshold) || BONUS_TIERS[0];
  const nextTier = BONUS_TIERS.find((tier) => tier.threshold > amountRubles) || null;
  const bonusPoints = valid ? Math.floor(amountRubles * currentTier.rate / 100) : 0;
  const amountToNextTier = nextTier ? nextTier.threshold - amountRubles : 0;
  const potentialBonus = nextTier ? Math.floor(nextTier.threshold * nextTier.rate / 100) : bonusPoints;
  return {
    currentTier, nextTier, bonusPoints, amountToNextTier, potentialBonus,
    additionalBonus: potentialBonus - bonusPoints,
    showBonusHook: Boolean(valid && nextTier && amountToNextTier <= amountRubles * .25),
  };
}
