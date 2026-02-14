export function withConfigDefaults(input) {
  const config = input ?? {};
  return {
    ...config,
    webhooks: {
      secrets: {
        sentry: config.webhooks?.secrets?.sentry ?? config.sentrySecret ?? "",
        pagerduty: config.webhooks?.secrets?.pagerduty ?? "",
        datadog: config.webhooks?.secrets?.datadog ?? "",
        grafana: config.webhooks?.secrets?.grafana ?? "",
        opsgenie: config.webhooks?.secrets?.opsgenie ?? "",
        incidentio: config.webhooks?.secrets?.incidentio ?? "",
        signoz: config.webhooks?.secrets?.signoz ?? ""
      }
    },
    notifications: {
      slack: {
        enabled: config.notifications?.slack?.enabled ?? false,
        channel: config.notifications?.slack?.channel ?? ""
      }
    },
    verification: {
      mode: config.verification?.mode ?? "full",
      allow_fix_only_for: config.verification?.allow_fix_only_for ?? [],
      force_full_for: config.verification?.force_full_for ?? []
    }
  };
}

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be an object");
  }
  if (!config.repo || typeof config.repo.id !== "string" || !config.repo.id.trim()) {
    throw new Error("Config must include repo.id");
  }
  if (!["full", "fix_only"].includes(config.verification.mode)) {
    throw new Error("verification.mode must be 'full' or 'fix_only'");
  }
  if (typeof config.notifications?.slack?.enabled !== "boolean") {
    throw new Error("notifications.slack.enabled must be boolean");
  }
  return config;
}
