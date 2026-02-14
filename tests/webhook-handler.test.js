import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/server/app.js";

test("sentry webhook rejects invalid signatures", async () => {
  const app = buildApp({ sentrySecret: "test-secret" });
  const res = await app.inject({
    method: "POST",
    url: "/webhooks/sentry",
    headers: {
      "sentry-hook-signature": "bad"
    },
    payload: {
      action: "created"
    }
  });
  assert.equal(res.statusCode, 401);
});
