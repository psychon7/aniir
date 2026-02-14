export function normalizeSentryEvent(payload = {}) {
  return {
    action: payload.action ?? "unknown",
    title: payload.data?.title ?? payload.title ?? "Unknown issue",
    fingerprint: payload.data?.culprit ?? payload.fingerprint ?? "unknown",
    severity: payload.data?.level ?? payload.level ?? "error",
    raw: payload
  };
}
