function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeIssue(row = {}) {
  return {
    id: row.id ?? row.shortId ?? "unknown",
    shortId: row.shortId ?? "",
    title: row.title ?? "Unknown issue",
    culprit: row.culprit ?? "",
    level: row.level ?? "error",
    status: row.status ?? "unresolved",
    count: Number(row.count ?? 0),
    permalink: row.permalink ?? ""
  };
}

export function createSentryClient({
  token = process.env.SENTRY_TOKEN,
  apiHost = process.env.SENTRY_API_HOST ?? "https://sentry.io/api/0",
  fetchImpl = fetch
} = {}) {
  return {
    async listIssues({ orgSlug, project, status = "unresolved", limit = 20 } = {}) {
      if (!token) {
        throw new Error("SENTRY_TOKEN is required for Sentry pull sync");
      }
      if (!orgSlug || !project) {
        throw new Error("orgSlug and project are required");
      }

      const host = String(apiHost).replace(/\/$/, "");
      const url = new URL(`${host}/projects/${encodeURIComponent(orgSlug)}/${encodeURIComponent(project)}/issues/`);
      url.searchParams.set("status", String(status));
      url.searchParams.set("limit", String(toPositiveInteger(limit, 20)));

      const response = await fetchImpl(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Sentry issues request failed with status ${response.status}`);
      }
      const payload = await response.json();
      if (!Array.isArray(payload)) return [];
      return payload.map(normalizeIssue);
    }
  };
}
