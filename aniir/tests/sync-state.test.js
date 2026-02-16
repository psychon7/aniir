import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SyncStateStore } from "../src/sync/state.js";

test("sync state store persists processed issues", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-sync-state-"));
  const filePath = join(dir, "sync-state.json");
  const store = new SyncStateStore(filePath);

  const initial = await store.read();
  assert.equal(store.isProcessed(initial, "s1"), false);

  store.markProcessed(initial, "s1", { reason: "opened-pr" });
  await store.write(initial);

  const reloaded = await store.read();
  assert.equal(store.isProcessed(reloaded, "s1"), true);
  assert.equal(reloaded.processed["s1"].reason, "opened-pr");
});
