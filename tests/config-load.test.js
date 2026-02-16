import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadConfig } from "../src/config/load.js";

test("config loader defaults verification mode to full", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const config = await loadConfig(join(here, "fixtures", "aniir.config.valid.yaml"));
  assert.equal(config.verification.mode, "full");
  assert.equal(config.ai.mode, "codex_cloud_subscription");
  assert.equal(config.ai.allow_subscription_in_ci, false);
  assert.equal(config.sentry.org_slug, "");
  assert.equal(config.sentry.status, "unresolved");
  assert.equal(config.sentry.limit, 20);
  assert.equal(config.sentry.api_token_env, "SENTRY_TOKEN");
  assert.equal(config.sentry.api_host_env, "SENTRY_API_HOST");
  assert.equal(config.prompts.investigate_fix.user_instructions, "");
  assert.equal(config.prompts.verify.user_instructions, "");
  assert.equal(config.sync.max_prs_per_run, 3);
  assert.equal(config.sync.state_path, ".aniir/sync-state.json");
});

test("config loader rejects invalid ai mode", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  await assert.rejects(
    async () => loadConfig(join(here, "fixtures", "aniir.config.invalid-mode.yaml")),
    /ai\.mode/
  );
});

test("config loader rejects unsupported prompt override step", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  await assert.rejects(
    async () => loadConfig(join(here, "fixtures", "aniir.config.invalid-prompts.yaml")),
    /prompts\./
  );
});

test("config loader allows explicit subscription override in CI", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const config = await loadConfig(join(here, "fixtures", "aniir.config.subscription-ci-override.json"));
  assert.equal(config.ai.allow_subscription_in_ci, true);
});
