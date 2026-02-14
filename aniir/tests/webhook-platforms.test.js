import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/server/app.js";

test("datadog webhook rejects invalid signature", async () => {
  const app = buildApp({
    webhookSecrets: {
      datadog: "dd-secret"
    }
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/webhooks/datadog?tenant_id=t-1",
    headers: {
      "dd-webhook-signature": "bad-secret"
    },
    payload: {
      title: "High error rate",
      severity: "critical"
    }
  });

  assert.equal(response.statusCode, 401);
});

test("pagerduty webhook accepts valid signature and normalizes context", async () => {
  let captured = null;
  const app = buildApp({
    webhookSecrets: {
      pagerduty: "pd-secret"
    },
    onIncident: async (incident) => {
      captured = incident;
    }
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/webhooks/pagerduty?tenant_id=t-2",
    headers: {
      "x-pagerduty-signature": "pd-secret"
    },
    payload: {
      incident: {
        id: "PD-123",
        title: "Checkout down",
        urgency: "high"
      }
    }
  });

  assert.equal(response.statusCode, 202);
  assert.equal(captured?.source, "pagerduty");
  assert.equal(captured?.tenantId, "t-2");
  assert.equal(captured?.incidentId, "PD-123");
});
