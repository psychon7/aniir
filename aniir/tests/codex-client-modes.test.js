import test from "node:test";
import assert from "node:assert/strict";
import { createCodexClient } from "../src/integrations/codex/client.js";

test("codex client defaults to codex_cloud_subscription and uses sdk thread", async () => {
  const client = createCodexClient({
    createSdkClient: async () => ({
      startThread: () => ({
        run: async () => ({ finalResponse: "Fix summary from Codex SDK" })
      })
    })
  });

  const result = await client.proposeFix({ issueTitle: "Login fails with 500", prompt: "Diagnose and fix it" });
  assert.equal(client.mode, "codex_cloud_subscription");
  assert.equal(result.mode, "codex_cloud_subscription");
  assert.match(result.summary, /Fix summary/);
});

test("openai_api mode requires API key", async () => {
  const client = createCodexClient({
    mode: "openai_api",
    apiKey: "",
    createSdkClient: async () => ({})
  });
  await assert.rejects(
    async () => client.proposeFix({ issueTitle: "Checkout broken" }),
    /OPENAI_API_KEY/
  );
});

test("openai_api mode works with API key using sdk", async () => {
  let receivedOptions = null;
  const client = createCodexClient({
    mode: "openai_api",
    apiKey: "sk-test",
    model: "gpt-5-mini",
    createSdkClient: async (options) => {
      receivedOptions = options;
      return {
        startThread: () => ({
          run: async () => ({ finalResponse: "API mode summary" })
        })
      };
    }
  });
  const result = await client.proposeFix({ issueTitle: "Payment timeout" });
  assert.equal(result.mode, "openai_api");
  assert.equal(result.model, "gpt-5-mini");
  assert.equal(receivedOptions.mode, "openai_api");
  assert.equal(receivedOptions.apiKey, "sk-test");
});
