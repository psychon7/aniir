import test from "node:test";
import assert from "node:assert/strict";
import { createSentryClient } from "../src/integrations/sentry/client.js";

test("sentry client builds request with auth header and query params", async () => {
  const calls = [];
  const client = createSentryClient({
    token: "sentry-token",
    apiHost: "https://example.sentry/api/0",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return [];
        }
      };
    }
  });

  await client.listIssues({
    orgSlug: "axtech",
    project: "erp2025",
    status: "unresolved",
    limit: 5
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /projects\/axtech\/erp2025\/issues/);
  assert.match(calls[0].url, /status=unresolved/);
  assert.match(calls[0].url, /limit=5/);
  assert.equal(calls[0].options.headers.Authorization, "Bearer sentry-token");
});

test("sentry client requires API token", async () => {
  const client = createSentryClient({ token: "" });
  await assert.rejects(
    async () => client.listIssues({ orgSlug: "axtech", project: "erp2025" }),
    /SENTRY_TOKEN/
  );
});
