import test from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../src/pipeline/engine.js";

test("pipeline short-circuits when memory marks issue ignored", async () => {
  const result = await runPipeline(
    { fingerprint: "fp_ignored_1" },
    {
      memoryLookup: async () => ({ status: "ignored" })
    }
  );
  assert.equal(result.finalState, "ignored");
});
