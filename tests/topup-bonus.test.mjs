import test from "node:test";
import assert from "node:assert/strict";
import { getTopUpBonus } from "../src/billing/topup.js";
import { billingReducer, createInitialBillingState } from "../src/billing/engine.js";

test("applies each rate at the exact lower boundary and below the next boundary", () => {
  for (const [amount, rate, bonus] of [
    [25000, 0, 0], [49999, 0, 0], [50000, 5, 2500], [99999, 5, 4999],
    [100000, 10, 10000], [249999, 10, 24999], [250000, 15, 37500],
    [499999, 15, 74999], [500000, 20, 100000], [750000, 20, 150000],
  ]) {
    const result = getTopUpBonus(amount);
    assert.equal(result.currentTier.rate, rate, String(amount));
    assert.equal(result.bonusPoints, bonus, String(amount));
  }
});

test("shows the hook only when the additional payment is at most 25%", () => {
  for (const [below, at, threshold] of [[39999, 40000, 50000], [79999, 80000, 100000], [199999, 200000, 250000], [399999, 400000, 500000]]) {
    assert.equal(getTopUpBonus(below).showBonusHook, false);
    assert.equal(getTopUpBonus(at).showBonusHook, true);
    assert.equal(getTopUpBonus(at).nextTier.threshold, threshold);
    assert.equal(getTopUpBonus(threshold).showBonusHook, false);
  }
  for (const invalid of [0, 24999, 750001]) {
    assert.equal(getTopUpBonus(invalid).showBonusHook, false);
    assert.equal(getTopUpBonus(invalid).bonusPoints, 0);
  }
});

test("calculates the actual bonus increase and credits exactly the displayed bonus", () => {
  const before = getTopUpBonus(90000);
  assert.equal(before.amountToNextTier, 10000);
  assert.equal(before.additionalBonus, 5500);
  const after = getTopUpBonus(before.nextTier.threshold);
  const state = createInitialBillingState({ balanceCents: 0, bonusBalanceCents: 0 });
  const credited = billingReducer(state, { type: "TOP_UP", amountCents: 10000000, bonusCents: after.bonusPoints * 100, success: true });
  assert.equal(credited.balanceCents, 10000000);
  assert.equal(credited.bonusBalanceCents, 1000000);
  assert.equal(credited.ledger[0].meta.bonusCents, 1000000);
});
