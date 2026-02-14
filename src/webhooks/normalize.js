import { normalizeSentryEvent } from "../sentry/normalize.js";

function normalizeSentry(payload) {
  const sentry = normalizeSentryEvent(payload);
  return {
    source: "sentry",
    incidentId: payload?.data?.issue?.id ?? payload?.issue_id ?? sentry.fingerprint,
    title: sentry.title,
    severity: sentry.severity,
    service: payload?.project ?? payload?.data?.project?.slug ?? "unknown",
    tags: payload?.data?.issue?.metadata ? Object.keys(payload.data.issue.metadata) : [],
    startedAt: payload?.data?.event?.dateCreated ?? payload?.date_created ?? new Date().toISOString(),
    fingerprint: sentry.fingerprint,
    raw: payload
  };
}

function normalizePagerDuty(payload) {
  const incident = payload?.incident ?? {};
  return {
    source: "pagerduty",
    incidentId: incident.id ?? payload?.id ?? "unknown",
    title: incident.title ?? payload?.title ?? "PagerDuty incident",
    severity: incident.urgency ?? incident.severity ?? "high",
    service: incident.service?.summary ?? incident.service?.id ?? "unknown",
    tags: incident.alert_counts ? Object.keys(incident.alert_counts) : [],
    startedAt: incident.created_at ?? payload?.created_at ?? new Date().toISOString(),
    fingerprint: incident.id ?? payload?.id ?? "unknown",
    raw: payload
  };
}

function normalizeDatadog(payload) {
  return {
    source: "datadog",
    incidentId: payload?.id ?? payload?.event_id ?? "unknown",
    title: payload?.title ?? payload?.alert_title ?? "Datadog alert",
    severity: payload?.severity ?? payload?.alert_transition ?? "error",
    service: payload?.service ?? payload?.host ?? "unknown",
    tags: Array.isArray(payload?.tags) ? payload.tags : [],
    startedAt: payload?.date_happened ?? payload?.timestamp ?? new Date().toISOString(),
    fingerprint: payload?.aggregation_key ?? payload?.alert_id ?? payload?.id ?? "unknown",
    raw: payload
  };
}

function normalizeGeneric(platform, payload) {
  return {
    source: platform,
    incidentId: payload?.id ?? payload?.incident_id ?? "unknown",
    title: payload?.title ?? payload?.message ?? `${platform} incident`,
    severity: payload?.severity ?? payload?.status ?? "error",
    service: payload?.service ?? payload?.source ?? "unknown",
    tags: Array.isArray(payload?.tags) ? payload.tags : [],
    startedAt: payload?.timestamp ?? payload?.created_at ?? new Date().toISOString(),
    fingerprint: payload?.fingerprint ?? payload?.id ?? "unknown",
    raw: payload
  };
}

export function normalizeWebhookIncident(platform, payload, tenantId) {
  let normalized;
  if (platform === "sentry") normalized = normalizeSentry(payload);
  else if (platform === "pagerduty") normalized = normalizePagerDuty(payload);
  else if (platform === "datadog") normalized = normalizeDatadog(payload);
  else normalized = normalizeGeneric(platform, payload);

  return {
    ...normalized,
    tenantId
  };
}
