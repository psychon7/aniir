import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
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

test("sentry webhook accepts valid sha256 signature", async () => {
  const payload = {
    action: "created",
    data: {
      issue: {
        id: "123",
        title: "TypeError"
      }
    }
  };
  const rawBody = JSON.stringify(payload);
  const digest = createHmac("sha256", "test-secret").update(rawBody).digest("hex");

  const app = buildApp({ sentrySecret: "test-secret" });
  const res = await app.inject({
    method: "POST",
    url: "/webhooks/sentry",
    headers: {
      "sentry-hook-signature": `sha256=${digest}`
    },
    payload,
    rawBody
  });

  assert.equal(res.statusCode, 202);
  assert.equal(res.payload.accepted, true);
  assert.equal(res.payload.incident.source, "sentry");
});
