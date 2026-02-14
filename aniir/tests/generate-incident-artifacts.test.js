import test from "node:test";
import assert from "node:assert/strict";
import { generateIncidentArtifacts } from "../src/commands/generate-incident-artifacts.js";

test("generateIncidentArtifacts builds report and slack message", () => {
  const result = generateIncidentArtifacts({
    incident: {
      source: "datadog",
      incidentId: "DD-9",
      title: "Checkout 500 surge",
      severity: "critical",
      service: "checkout-api"
    },
    evidence: [{ timestamp: "2026-02-14T12:03:00.000Z", message: "500 /checkout" }],
    rootCause: "null session in payment middleware",
    occurrences: 21,
    bugUrl: "https://sonarly.dev/bugs/dd-9"
  });

  assert.equal(result.report.incidentId, "DD-9");
  assert.match(result.slackMessage, /sonarly\.dev\/bugs\/dd-9/);
});
