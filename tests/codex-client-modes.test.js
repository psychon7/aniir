import test from "node:test";
import assert from "node:assert/strict";
import { createCodexClient } from "../src/integrations/codex/client.js";

test("codex client defaults to codex_cloud_subscription", async () => {
  const client = createCodexClient();
  const result = await client.proposeFix({ issueTitle: "Login fails with 500" });
  assert.equal(client.mode, "codex_cloud_subscription");
  assert.equal(result.mode, "codex_cloud_subscription");
});

test("openai_api mode requires API key", async () => {
  const client = createCodexClient({ mode: "openai_api", apiKey: "" });
  await assert.rejects(
    async () => client.proposeFix({ issueTitle: "Checkout broken" }),
    /OPENAI_API_KEY/
  );
});

test("openai_api mode works with API key", async () => {
  const client = createCodexClient({ mode: "openai_api", apiKey: "sk-test", model: "gpt-5-mini" });
  const result = await client.proposeFix({ issueTitle: "Payment timeout" });
  assert.equal(result.mode, "openai_api");
  assert.equal(result.model, "gpt-5-mini");
});
