import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

test("template config includes verification mode docs", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "..");
  const template = await readFile(join(root, "templates", "aniir.config.yaml"), "utf8");
  assert.match(template, /verification:/);
  assert.match(template, /mode:\s*full/);
  assert.match(template, /ai:/);
  assert.match(template, /codex_cloud_subscription/);
  assert.match(template, /allow_subscription_in_ci:\s*false/);
  assert.match(template, /org_slug:/);
  assert.match(template, /status:\s*\"unresolved\"/);
  assert.match(template, /api_token_env:/);
  assert.match(template, /api_host_env:/);
  assert.match(template, /prompts:/);
  assert.match(template, /investigate_fix:/);
  assert.match(template, /sync:/);
  assert.match(template, /max_prs_per_run:\s*3/);
});
