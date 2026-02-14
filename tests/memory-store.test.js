import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MemoryStore } from "../src/memory/store.js";

test("memory store returns ignored fingerprint entries", async () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const store = new MemoryStore(join(here, "fixtures", "known-issues.seed.json"));
  const record = await store.findByFingerprint("fp_ignored_1");
  assert.equal(record?.status, "ignored");
});
