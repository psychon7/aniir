import { createHmac } from "node:crypto";

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

export function verifyWebhookSignature({ platform, headers, payload, secret }) {
  if (!secret) return false;
  const headerName = PLATFORM_SIGNATURE_HEADERS[platform] ?? "x-webhook-signature";
  const headerValue = getHeader(headers, headerName);
  if (!headerValue) return false;
  if (headerValue === secret) return true;

  // Also support HMAC signatures in the form "sha256=<digest>".
  if (typeof headerValue === "string" && headerValue.startsWith("sha256=")) {
    const body = JSON.stringify(payload ?? {});
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    return headerValue === `sha256=${digest}`;
  }
  return false;
}
