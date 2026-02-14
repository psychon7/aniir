import { createServer } from "node:http";
import { normalizeSentryEvent } from "../sentry/normalize.js";
import { verifySentrySignature } from "../sentry/verify.js";

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    payload
  };
}

export function buildApp({ sentrySecret, onIncident } = {}) {
  async function handleRequest(reqLike) {
    const req = reqLike ?? {};
    if (req.method !== "POST" || req.url !== "/webhooks/sentry") {
      return jsonResponse(404, { error: "not found" });
    }

    const verified = verifySentrySignature(req.headers ?? {}, sentrySecret);
    if (!verified) {
      return jsonResponse(401, { error: "invalid signature" });
    }

    const incident = normalizeSentryEvent(req.payload ?? {});
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
