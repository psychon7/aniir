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
});

test("config loader rejects invalid ai mode", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  await assert.rejects(
    async () => loadConfig(join(here, "fixtures", "aniir.config.invalid-mode.yaml")),
    /ai\.mode/
  );
});
