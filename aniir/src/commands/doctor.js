import { readCredentials, getStorePath } from "../auth/credentials-store.js";
import { resolveSentryToken, resolveGitHubToken } from "../auth/github-app.js";

export async function runDoctor(config, { env = process.env, credentialsStoreOverride } = {}) {
  const errors = [];
  const warnings = [];

  if (!config?.repo?.id) {
    errors.push("repo.id is required");
  }

  // Load credentials store (best-effort, profile-aware)
  const profile = config?.auth?.profile ?? "default";
  let credentialsStore = credentialsStoreOverride ?? {};
  if (!credentialsStoreOverride) {
    try {
      credentialsStore = await readCredentials(profile);
    } catch {
      warnings.push(`Could not read credentials store at ${getStorePath()}`);
    }
  }

  // ── Sentry token ──────────────────────────────────────────────────
  const sentryTokenEnv = config?.sentry?.api_token_env ?? "SENTRY_TOKEN";
  const { token: sentryToken, method: sentryMethod } = resolveSentryToken({
    env,
    credentialsStore,
    tokenEnvName: sentryTokenEnv
  });
  if (!sentryToken) {
    errors.push(`Sentry token missing. Set ${sentryTokenEnv} env var or run \`aniir connect\``);
  } else {
    const source = sentryMethod === "resolved"
      ? (env[sentryTokenEnv] ? `env:${sentryTokenEnv}` : "credentials store")
      : sentryMethod;
    warnings.push(`Sentry token found via ${source}`);
  }

  // ── GitHub token ──────────────────────────────────────────────────
  const { token: githubToken, method: githubMethod } = await resolveGitHubToken({
    env,
    credentialsStore
  }).catch(() => ({ token: "", method: "none" }));

  if (!githubToken) {
    errors.push("GitHub token missing. Set GITHUB_TOKEN env var, configure GitHub App, or run `aniir connect`");
  } else {
    warnings.push(`GitHub token found via ${githubMethod}`);
  }

  // ── AI config ─────────────────────────────────────────────────────
  const aiMode = config?.ai?.mode ?? "codex_cloud_subscription";
  const allowSubscriptionInCi = config?.ai?.allow_subscription_in_ci === true;
  const openaiApiEnv = config?.ai?.openai?.api_key_env ?? "OPENAI_API_KEY";
  if (aiMode === "openai_api" && !env[openaiApiEnv]) {
    errors.push(`${openaiApiEnv} is required when ai.mode is openai_api`);
  }
  if (aiMode !== "openai_api" && !env[openaiApiEnv]) {
    warnings.push(`${openaiApiEnv} is not set (okay for subscription modes)`);
  }
  if (env.CI && aiMode !== "openai_api") {
    if (allowSubscriptionInCi) {
      warnings.push("CI detected: subscription mode allowed because ai.allow_subscription_in_ci=true.");
    } else {
      errors.push("CI requires ai.mode=openai_api unless ai.allow_subscription_in_ci=true");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    auth: {
      github: githubMethod,
      sentry: sentryToken ? "configured" : "missing"
    },
    checkedAt: new Date().toISOString()
  };
}
