import test from "node:test";
import assert from "node:assert/strict";
import { allocateWorkspace } from "../src/runner/workspace.js";

test("workspace allocation creates unique path per incident", async () => {
  const a = await allocateWorkspace("inc-1");
  const b = await allocateWorkspace("inc-2");
  assert.notEqual(a.path, b.path);
});
