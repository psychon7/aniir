import { createHmac, timingSafeEqual } from "node:crypto";

const PLATFORM_SIGNATURE_HEADERS = {
  sentry: "sentry-hook-signature",
  bugsnag: "x-hub-signature",
  pagerduty: "x-pagerduty-signature",
  incidentio: "webhook-signature",
  datadog: "dd-webhook-signature",
  grafana: "x-grafana-signature",
  opsgenie: "x-opsgenie-signature",
  signoz: "x-signoz-signature"
};

function getHeader(headers, headerName) {
  if (!headers || !headerName) return undefined;
  const lower = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function computeSha256(secret, content) {
  return createHmac("sha256", secret).update(content).digest("hex");
}

function getBodyForSignature(rawBody, payload) {
  if (typeof rawBody === "string") return rawBody;
  return JSON.stringify(payload ?? {});
}

function verifySentrySignature({ headerValue, secret, rawBody, payload }) {
  if (typeof headerValue !== "string" || !headerValue) return false;
  const digest = computeSha256(secret, getBodyForSignature(rawBody, payload));
  const expectedPrefixed = `sha256=${digest}`;

  if (headerValue.startsWith("sha256=")) {
    return safeEqual(headerValue, expectedPrefixed);
  }

  return safeEqual(headerValue, digest);
}

export function verifyWebhookSignature({ platform, headers, payload, rawBody, secret }) {
  if (!secret) return false;
  const headerName = PLATFORM_SIGNATURE_HEADERS[platform] ?? "x-webhook-signature";
  const headerValue = getHeader(headers, headerName);
  if (!headerValue) return false;

  if (platform === "sentry") {
    return verifySentrySignature({ headerValue, secret, rawBody, payload });
  }

  if (safeEqual(String(headerValue), String(secret))) return true;

  // Also support HMAC signatures in the form "sha256=<digest>".
  if (typeof headerValue === "string" && headerValue.startsWith("sha256=")) {
    const digest = computeSha256(secret, getBodyForSignature(rawBody, payload));
    return safeEqual(headerValue, `sha256=${digest}`);
  }
  return false;
}
