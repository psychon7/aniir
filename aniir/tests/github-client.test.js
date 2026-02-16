import test from "node:test";
import assert from "node:assert/strict";
import { createGitHubClient } from "../src/integrations/github/client.js";

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    }
  };
}

test("github client prepares branch artifact and opens PR", async () => {
  const calls = [];
  const github = createGitHubClient({
    token: "ghs_test",
    owner: "axtech",
    repo: "erp2025",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/git/ref/heads/main")) {
        return jsonResponse(200, { object: { sha: "base-sha-1" } });
      }
      if (url.endsWith("/git/ref/heads/aniir%2Finc-1")) {
        return jsonResponse(404, { message: "Not Found" });
      }
      if (url.endsWith("/git/refs") && options.method === "POST") {
        return jsonResponse(201, {});
      }
      if (url.includes("/contents/.aniir%2Fincidents%2Finc-1.md") && options.method === "GET") {
        return jsonResponse(404, { message: "Not Found" });
      }
      if (url.includes("/contents/.aniir%2Fincidents%2Finc-1.md") && options.method === "PUT") {
        return jsonResponse(201, { content: { path: ".aniir/incidents/inc-1.md" } });
      }
      if (url.endsWith("/pulls") && options.method === "POST") {
        return jsonResponse(201, { number: 77, html_url: "https://github.com/axtech/erp2025/pull/77" });
      }
      return jsonResponse(500, { message: `Unexpected request: ${url}` });
    }
  });

  await github.prepareIncidentBranch({
    incidentId: "inc-1",
    base: "main",
    head: "aniir/inc-1",
    content: "# Incident inc-1"
  });

  const pr = await github.createPullRequest({
    title: "fix(aniir): inc-1",
    body: "Automated remediation",
    head: "aniir/inc-1",
    base: "main"
  });

  assert.equal(pr.number, 77);
  assert.equal(pr.dryRun, false);
  assert.equal(calls.some((call) => call.url.includes("/git/refs")), true);
  assert.equal(calls.some((call) => call.url.includes("/contents/.aniir%2Fincidents%2Finc-1.md")), true);
});

test("github client resolves already-open PR idempotently", async () => {
  const github = createGitHubClient({
    token: "ghs_test",
    owner: "axtech",
    repo: "erp2025",
    fetchImpl: async (url, options) => {
      if (url.endsWith("/pulls") && options.method === "POST") {
        return jsonResponse(422, { message: "Validation Failed" });
      }
      if (url.includes("/pulls?state=open")) {
        return jsonResponse(200, [{ number: 15, html_url: "https://github.com/axtech/erp2025/pull/15" }]);
      }
      return jsonResponse(500, { message: `Unexpected request: ${url}` });
    }
  });

  const pr = await github.createPullRequest({
    title: "fix(aniir): inc-1",
    body: "Automated remediation",
    head: "aniir/inc-1",
    base: "main"
  });

  assert.equal(pr.number, 15);
  assert.equal(pr.dryRun, false);
  assert.equal(pr.existing, true);
});
