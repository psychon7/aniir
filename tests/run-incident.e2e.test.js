import test from "node:test";
import assert from "node:assert/strict";
import { runIncident } from "../src/commands/run-incident.js";

test("runIncident opens pull request when pipeline succeeds", async () => {
  let called = false;
  const deps = {
    pipeline: async () => ({ finalState: "pr_opened", fixSummary: "guard null" }),
    github: {
      async createPullRequest() {
        called = true;
        return { number: 42 };
      }
    }
  };

  await runIncident({ incidentId: "inc-1" }, deps);
  assert.equal(called, true);
});
