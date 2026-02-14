export function verifySentrySignature(headers, sentrySecret) {
  const signature = headers["sentry-hook-signature"] ?? headers["Sentry-Hook-Signature"];
  if (!signature || !sentrySecret) return false;
  return signature === sentrySecret;
}
