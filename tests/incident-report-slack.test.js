import test from "node:test";
import assert from "node:assert/strict";
import { buildIncidentReport } from "../src/incident/report.js";
import { buildSlackBugMessage } from "../src/notifications/slack.js";

test("buildIncidentReport includes timeline and suggested actions", () => {
  const report = buildIncidentReport({
    incident: {
      source: "datadog",
      incidentId: "DD-42",
      title: "Payment endpoint 500 surge",
      severity: "critical",
      service: "billing-api",
      startedAt: "2026-02-14T12:00:00.000Z"
    },
    evidence: [
      { timestamp: "2026-02-14T12:00:05.000Z", message: "500 at /payments/charge" },
      { timestamp: "2026-02-14T12:00:30.000Z", message: "DB timeout on invoice_lock" }
    ],
    rootCause: "invoice lock query timeout under load"
  });

  assert.equal(report.incidentId, "DD-42");
  assert.equal(report.timeline.length, 2);
  assert.match(report.suggestedActions[0], /add regression test/i);
});

test("buildSlackBugMessage renders severity and occurrence count", () => {
  const message = buildSlackBugMessage({
    title: "Login fails with 500",
    severity: "blocking",
    occurrences: 18,
    bugUrl: "https://sonarly.dev/bugs/123"
  });

  assert.match(message, /blocking/i);
  assert.match(message, /18/);
  assert.match(message, /sonarly\.dev\/bugs\/123/);
});
