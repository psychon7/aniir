import test from "node:test";
import assert from "node:assert/strict";
import { runInvestigateFix } from "../src/pipeline/steps/investigate-fix.js";

test("investigate+fix returns patch metadata from codex adapter", async () => {
  const codex = {
    proposeFix: async () => ({ patch: "diff --git ...", summary: "fix null guard" })
  };
  const out = await runInvestigateFix({ issueTitle: "TypeError on login" }, codex);
  assert.match(out.summary, /fix/i);
});
