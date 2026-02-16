import test from "node:test";
import assert from "node:assert/strict";
import { runInvestigateFix } from "../src/pipeline/steps/investigate-fix.js";

test("investigate+fix returns patch metadata from codex adapter", async () => {
  let receivedIssue = null;
  const codex = {
    proposeFix: async (issue) => {
      receivedIssue = issue;
      return { patch: "diff --git ...", summary: "fix null guard" };
    }
  };
  const out = await runInvestigateFix(
    { issueTitle: "TypeError on login", severity: "blocking" },
    codex,
    {
      prompts: {
        investigate_fix: {
          user_instructions: "Focus root cause around {{issue_title}}."
        }
      }
    }
  );
  assert.ok(receivedIssue.prompt);
  assert.match(receivedIssue.prompt, /TypeError on login/);
  assert.match(out.summary, /fix/i);
});
