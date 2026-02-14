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
});
