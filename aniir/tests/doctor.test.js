import test from "node:test";
import assert from "node:assert/strict";
import { runDoctor } from "../src/commands/doctor.js";

// All doctor tests pass credentialsStoreOverride: {} to avoid reading
// the real ~/.aniir/credentials.json (which may have tokens from other tests).

test("doctor fails when sentry and github tokens are missing", async () => {
  const result = await runDoctor({
    repo: { id: "axtech/erp2025" },
    ai: { mode: "codex_cloud_subscription", openai: { api_key_env: "OPENAI_API_KEY" } },
    sentry: { api_token_env: "SENTRY_TOKEN" }
  }, {
    env: {},
    credentialsStoreOverride: {}
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => /Sentry token/i.test(e) || /SENTRY_TOKEN/.test(e)));
  assert.ok(result.errors.some(e => /GitHub token/i.test(e)));
});

test("doctor requires openai key in openai_api mode", async () => {
  const result = await runDoctor({
    repo: { id: "axtech/erp2025" },
    ai: { mode: "openai_api", openai: { api_key_env: "OPENAI_API_KEY" } },
    sentry: { api_token_env: "SENTRY_TOKEN" }
  }, {
    env: { SENTRY_TOKEN: "sentry-token", GITHUB_TOKEN: "gh-token" },
    credentialsStoreOverride: {}
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /OPENAI_API_KEY/);
});

test("doctor passes for subscription mode with sentry + github tokens", async () => {
  const result = await runDoctor({
    repo: { id: "axtech/erp2025" },
    ai: { mode: "codex_cloud_subscription", openai: { api_key_env: "OPENAI_API_KEY" } },
    sentry: { api_token_env: "SENTRY_TOKEN" }
  }, {
    env: { SENTRY_TOKEN: "sentry-token", GITHUB_TOKEN: "gh-token" },
    credentialsStoreOverride: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.auth.github, "env_token");
  assert.equal(result.auth.sentry, "configured");
});

test("doctor fails in CI for subscription mode unless override enabled", async () => {
  const result = await runDoctor({
    repo: { id: "axtech/erp2025" },
    ai: {
      mode: "codex_cloud_subscription",
      allow_subscription_in_ci: false,
      openai: { api_key_env: "OPENAI_API_KEY" }
    },
    sentry: { api_token_env: "SENTRY_TOKEN" }
  }, {
    env: { SENTRY_TOKEN: "sentry-token", GITHUB_TOKEN: "gh-token", CI: "true" },
    credentialsStoreOverride: {}
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /openai_api/);
});

test("doctor allows subscription mode in CI when override enabled", async () => {
  const result = await runDoctor({
    repo: { id: "axtech/erp2025" },
    ai: {
      mode: "codex_cloud_subscription",
      allow_subscription_in_ci: true,
      openai: { api_key_env: "OPENAI_API_KEY" }
    },
    sentry: { api_token_env: "SENTRY_TOKEN" }
  }, {
    env: { SENTRY_TOKEN: "sentry-token", GITHUB_TOKEN: "gh-token", CI: "true" },
    credentialsStoreOverride: {}
  });

  assert.equal(result.ok, true);
});
