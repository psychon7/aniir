import test from "node:test";
import assert from "node:assert/strict";
import { shouldRunFullVerification } from "../src/pipeline/steps/verify.js";

test("verification policy defaults to full mode", () => {
  assert.equal(shouldRunFullVerification({}), true);
});
