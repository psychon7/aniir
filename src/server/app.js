import { createServer } from "node:http";
import { normalizeWebhookIncident } from "../webhooks/normalize.js";
import { verifyWebhookSignature } from "../webhooks/signature.js";

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    payload
  };
}

export function buildApp(options = {}) {
  const { sentrySecret, onIncident, webhookSecrets: providedWebhookSecrets = {} } = options;
  const webhookSecrets = {
    sentry: sentrySecret,
    ...providedWebhookSecrets
  };

  function parseRoute(urlString = "") {
    const url = new URL(urlString, "http://localhost");
    if (url.pathname === "/webhooks/sentry") {
      return { platform: "sentry", tenantId: url.searchParams.get("tenant_id") ?? null };
    }
    const match = url.pathname.match(/^\/api\/webhooks\/([a-z0-9_-]+)$/i);
    if (!match) return null;
    return {
      platform: match[1].toLowerCase(),
      tenantId: url.searchParams.get("tenant_id") ?? null
    };
  }

  async function handleRequest(reqLike) {
    const req = reqLike ?? {};
    if (req.method !== "POST") {
      return jsonResponse(404, { error: "not found" });
    }

    const route = parseRoute(req.url);
    if (!route) {
      return jsonResponse(404, { error: "not found" });
    }

    const secret = webhookSecrets[route.platform];
    const verified = verifyWebhookSignature({
      platform: route.platform,
      headers: req.headers ?? {},
      payload: req.payload ?? {},
      secret
    });
    if (!verified) {
      return jsonResponse(401, { error: "invalid signature" });
    }

    const incident = normalizeWebhookIncident(route.platform, req.payload ?? {}, route.tenantId);
    if (typeof onIncident === "function") {
      await onIncident(incident);
    }
    return jsonResponse(202, { accepted: true, incident });
  }

  return {
    async inject(input) {
      return handleRequest(input);
    },
    listen(port = 8787) {
      const server = createServer(async (req, res) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : "{}";
          const payload = JSON.parse(body || "{}");
          const result = await handleRequest({
            method: req.method,
            url: req.url,
            headers: req.headers,
            payload
          });
          res.statusCode = result.statusCode;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result.payload));
        });
      });
      return new Promise((resolve) => {
        server.listen(port, () => resolve(server));
      });
    }
  };
}
