import test from "node:test";
import assert from "node:assert/strict";
import { NOTIFICATION_EVENTS, notificationPreference } from "../src/settings/notifications.js";

test("trainer lists the seven requested events and channel availability", () => {
  assert.deepEqual(NOTIFICATION_EVENTS.trainer.map(([key]) => key), [
    "creationStarted", "trainingCreated", "trainingAssigned", "analysisStarted",
    "analysisComplete", "reportPreparing", "reportComplete",
  ]);
  assert.deepEqual(NOTIFICATION_EVENTS.trainer.map(([, , display]) => display), [
    true, true, false, false, false, true, true,
  ]);
  assert.equal(NOTIFICATION_EVENTS.analyst.length, 4);
});

test("new trainer events default to enabled only for supported channels", () => {
  for (const [key, , display] of NOTIFICATION_EVENTS.trainer) {
    assert.equal(notificationPreference("trainer", undefined, key, "sound"), true);
    assert.equal(notificationPreference("trainer", {}, key, "display"), display);
  }
});

test("saved choices survive, new events are independent, old events remain untouched", () => {
  const saved = { events: {
    reportComplete: { display: false, sound: false },
    progress: { display: false, sound: true },
  } };
  const snapshot = structuredClone(saved);
  assert.equal(notificationPreference("trainer", saved, "reportComplete", "display"), false);
  assert.equal(notificationPreference("trainer", saved, "reportComplete", "sound"), false);
  assert.equal(notificationPreference("trainer", saved, "trainingCreated", "sound"), true);
  assert.equal(notificationPreference("analyst", {}, "reportComplete", "sound"), true);
  assert.deepEqual(saved, snapshot);
});

test("unsupported display controls cannot become enabled by stale saved data", () => {
  const saved = { events: { trainingAssigned: { display: true, sound: false } } };
  assert.equal(notificationPreference("trainer", saved, "trainingAssigned", "display"), false);
  assert.equal(notificationPreference("trainer", saved, "trainingAssigned", "sound"), false);
});
