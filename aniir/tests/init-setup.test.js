import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runInitSetup } from "../src/commands/init-setup.js";

test("init setup creates config and workflow scaffold", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "aniir-init-"));
  const out = await runInitSetup({
    cwd: workspace,
    preset: "sentry-codex"
  });

  assert.equal(out.createdConfig, true);
  assert.equal(out.createdWorkflow, true);
  await access(join(workspace, "aniir.config.yaml"));
  await access(join(workspace, ".github", "workflows", "aniir.yml"));
});
