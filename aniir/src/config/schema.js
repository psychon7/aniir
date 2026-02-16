export function withConfigDefaults(input) {
  const config = input ?? {};
  return {
    ...config,
    auth: {
      method: config.auth?.method ?? "auto",        // "auto" | "github_app" | "token"
      profile: config.auth?.profile ?? "default",   // credentials profile name
      credentials_path: config.auth?.credentials_path ?? undefined   // override ~/.aniir/credentials.json
    },
    ai: {
      mode: config.ai?.mode ?? "codex_cloud_subscription",
      model: config.ai?.model ?? "gpt-5-codex",
      allow_subscription_in_ci: config.ai?.allow_subscription_in_ci ?? false,
      openai: {
        api_key_env: config.ai?.openai?.api_key_env ?? "OPENAI_API_KEY"
      }
    },
    sentry: {
      project: config.sentry?.project ?? "",
      org_slug: config.sentry?.org_slug ?? "",
      status: config.sentry?.status ?? "unresolved",
      limit: Number(config.sentry?.limit ?? 20),
      api_token_env: config.sentry?.api_token_env ?? "SENTRY_TOKEN",
      api_host_env: config.sentry?.api_host_env ?? "SENTRY_API_HOST",
      severity_threshold: config.sentry?.severity_threshold ?? "error"
    },
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
    },
    sync: {
      max_prs_per_run: Number(config.sync?.max_prs_per_run ?? 3),
      state_path: config.sync?.state_path ?? ".aniir/sync-state.json"
    },
    prompts: {
      ...(config.prompts ?? {}),
      triage: {
        user_instructions: config.prompts?.triage?.user_instructions ?? ""
      },
      investigate_fix: {
        user_instructions: config.prompts?.investigate_fix?.user_instructions ?? ""
      },
      verify: {
        user_instructions: config.prompts?.verify?.user_instructions ?? ""
      },
      pr_body: {
        user_instructions: config.prompts?.pr_body?.user_instructions ?? ""
      }
    }
  };
}

function validatePrompts(prompts) {
  if (!prompts || typeof prompts !== "object") {
    throw new Error("prompts must be an object");
  }
  const allowedSteps = new Set(["triage", "investigate_fix", "verify", "pr_body"]);
  for (const step of Object.keys(prompts)) {
    if (!allowedSteps.has(step)) {
      throw new Error(`prompts.${step} is not supported`);
    }
    const entry = prompts[step];
    if (!entry || typeof entry !== "object") {
      throw new Error(`prompts.${step} must be an object`);
    }
    if (typeof entry.user_instructions !== "string") {
      throw new Error(`prompts.${step}.user_instructions must be a string`);
    }
  }
}

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be an object");
  }
  if (!config.repo || typeof config.repo.id !== "string" || !config.repo.id.trim()) {
    throw new Error("Config must include repo.id");
  }
  if (!["auto", "github_app", "token"].includes(config.auth?.method)) {
    throw new Error("auth.method must be 'auto', 'github_app', or 'token'");
  }
  if (!["full", "fix_only"].includes(config.verification.mode)) {
    throw new Error("verification.mode must be 'full' or 'fix_only'");
  }
  if (!["codex_cloud_subscription", "codex_local_subscription", "openai_api"].includes(config.ai?.mode)) {
    throw new Error("ai.mode must be 'codex_cloud_subscription', 'codex_local_subscription', or 'openai_api'");
  }
  if (typeof config.ai?.allow_subscription_in_ci !== "boolean") {
    throw new Error("ai.allow_subscription_in_ci must be boolean");
  }
  if (!["unresolved", "resolved", "ignored", "all"].includes(config.sentry?.status)) {
    throw new Error("sentry.status must be 'unresolved', 'resolved', 'ignored', or 'all'");
  }
  if (!Number.isInteger(config.sentry?.limit) || config.sentry.limit <= 0) {
    throw new Error("sentry.limit must be a positive integer");
  }
  if (!Number.isInteger(config.sync?.max_prs_per_run) || config.sync.max_prs_per_run <= 0) {
    throw new Error("sync.max_prs_per_run must be a positive integer");
  }
  if (typeof config.sync?.state_path !== "string" || !config.sync.state_path.trim()) {
    throw new Error("sync.state_path must be a non-empty string");
  }
  if (typeof config.notifications?.slack?.enabled !== "boolean") {
    throw new Error("notifications.slack.enabled must be boolean");
  }
  validatePrompts(config.prompts);
  return config;
}
