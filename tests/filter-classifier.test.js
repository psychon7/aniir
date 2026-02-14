import test from "node:test";
import assert from "node:assert/strict";
import { classifyIncident } from "../src/filter/classifier.js";

test("noise filter ignores high-frequency ResizeObserver warnings", async () => {
  const outcome = await classifyIncident({
    title: "ResizeObserver loop limit exceeded",
    eventsPerHour: 30,
    severity: "warning"
  });
  assert.equal(outcome.decision, "ignore");
});
