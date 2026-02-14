import test from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../src/pipeline/engine.js";

test("pipeline ignores incident when dedup marks it as known duplicate", async () => {
  const result = await runPipeline(
    { issueId: "SEN-2", title: "TypeError in checkout submit" },
    {
      deduplicateIssue: () => ({ match: true, method: "semantic" })
    }
  );

  assert.equal(result.finalState, "ignored");
  assert.equal(result.reason, "duplicate-semantic");
});

test("pipeline enriches result with severity level", async () => {
  const result = await runPipeline(
    { issueId: "SEN-3", title: "Login fails with 500", message: "cannot sign in", eventsPerHour: 9 },
    {
      classifySeverityLevel: () => "blocking"
    }
  );

  assert.equal(result.severity, "blocking");
});
