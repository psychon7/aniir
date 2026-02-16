import test from "node:test";
import assert from "node:assert/strict";
import { runIncident } from "../src/commands/run-incident.js";

test("runIncident opens pull request when pipeline succeeds", async () => {
  let called = false;
  let prepared = false;
  const deps = {
    pipeline: async () => ({ finalState: "pr_opened", fixSummary: "guard null", aiMode: "openai_api" }),
    github: {
      async prepareIncidentBranch(payload) {
        prepared = true;
        assert.match(payload.content, /guard null/);
      },
      async createPullRequest() {
        called = true;
        return { number: 42 };
      }
    }
  };

  await runIncident({ incidentId: "inc-1" }, deps);
  assert.equal(called, true);
  assert.equal(prepared, true);
});
