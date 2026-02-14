import test from "node:test";
import assert from "node:assert/strict";
import { health } from "../src/index.js";

test("aniir smoke: returns healthy status", () => {
  assert.deepEqual(health(), { status: "ok" });
});
