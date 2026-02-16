import test from "node:test";
import assert from "node:assert/strict";
import { buildStepPrompt } from "../src/prompts/builder.js";

test("buildStepPrompt composes system, task, and user instructions", () => {
  const output = buildStepPrompt({
    step: "investigate_fix",
    issue: {
      issueTitle: "TypeError in checkout",
      severity: "blocking"
    },
    config: {
      prompts: {
        investigate_fix: {
          user_instructions: "Prioritize {{issue_title}} and severity {{issue_severity}}."
        }
      }
    }
  });

  assert.match(output.text, /TypeError in checkout/);
  assert.match(output.text, /severity blocking/);
  assert.match(output.text, /You are an incident remediation agent/);
});

test("buildStepPrompt rejects unknown template variables", () => {
  assert.throws(
    () =>
      buildStepPrompt({
        step: "investigate_fix",
        issue: { issueTitle: "Cart crash" },
        config: {
          prompts: {
            investigate_fix: {
              user_instructions: "Use {{not_allowed}}"
            }
          }
        }
      }),
    /Unknown prompt variable/
  );
});
