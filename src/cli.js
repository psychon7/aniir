#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createGitHubClient } from "./integrations/github/client.js";
import { createCodexClient } from "./integrations/codex/client.js";
import { runIncident } from "./commands/run-incident.js";
import { generateIncidentArtifacts } from "./commands/generate-incident-artifacts.js";
import { createSentryClient } from "./integrations/sentry/client.js";
import { runSync } from "./commands/run-sync.js";
import { runDoctor } from "./commands/doctor.js";
import { runInitSetup } from "./commands/init-setup.js";
import { runConnect } from "./commands/connect.js";
import { loadConfig } from "./config/load.js";
import { withConfigDefaults, validateConfig } from "./config/schema.js";
import { resolveGitHubToken, resolveSentryToken } from "./auth/github-app.js";
import { readCredentials } from "./auth/credentials-store.js";

function parseArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function createStderrLogger(enabled) {
  if (!enabled) {
    return { info() {}, warn() {}, error() {} };
  }
  const write = (level, message) => {
    process.stderr.write(`${level} ${message}\n`);
  };
  return {
    info: (m) => write("[info]", m),
    warn: (m) => write("[warn]", m),
    error: (m) => write("[error]", m)
  };
}

async function loadRuntimeConfig(defaultRepoId) {
  const explicitPath = parseArg("--config");
  if (explicitPath) {
    return loadConfig(explicitPath);
  }
  try {
    return await loadConfig("aniir.config.yaml");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    if (!defaultRepoId) {
      throw new Error(
        "No config file found and no repo ID available.\n" +
        "Provide --config <path> or set GITHUB_REPOSITORY / GITHUB_REPO_ID."
      );
    }
    return validateConfig(withConfigDefaults({ repo: { id: defaultRepoId } }));
  }
}

/**
 * In CI, subscription auth (browser/device-code) is not available.
 * When the config says subscription mode, auto-switch to openai_api
 * if an API key is available.  Returns the (possibly modified) config.
 */
function enforceCiAiPolicy(config, env = process.env) {
  const isCi = Boolean(env.CI);
  if (!isCi) return config;

  const mode = config?.ai?.mode ?? "codex_cloud_subscription";
  if (mode === "openai_api") return config;

  const allow = config?.ai?.allow_subscription_in_ci === true;
  if (allow) return config;

  // Auto-fallback: if OPENAI_API_KEY is set, silently switch to openai_api
  const apiKeyEnv = config?.ai?.openai?.api_key_env ?? "OPENAI_API_KEY";
  if (env[apiKeyEnv]) {
    return {
      ...config,
      ai: { ...config.ai, mode: "openai_api" }
    };
  }

  throw new Error(
    "CI detected — subscription auth is not supported in non-interactive environments.\n" +
    `Set the ${apiKeyEnv} secret for openai_api mode, or set ai.allow_subscription_in_ci: true in config.`
  );
}

function splitRepoId(repoId) {
  if (!repoId || typeof repoId !== "string") return { owner: undefined, repo: undefined };
  const [owner, repo] = repoId.split("/");
  if (!owner || !repo) return { owner: undefined, repo: undefined };
  return { owner, repo };
}

async function main() {
  const command = process.argv[2];
  if (command === "run-incident") {
    const incidentId = parseArg("--incident-id");
    if (!incidentId) {
      console.error("Missing --incident-id");
      process.exit(1);
    }

    const dryRun = hasFlag("--dry-run");
    const defaultRepoId = process.env.GITHUB_REPOSITORY ?? process.env.GITHUB_REPO_ID;
    let runtimeConfig = await loadRuntimeConfig(defaultRepoId);
    runtimeConfig = enforceCiAiPolicy(runtimeConfig, process.env);
    const fromConfig = splitRepoId(runtimeConfig?.repo?.id);
    const owner = process.env.GITHUB_OWNER ?? fromConfig.owner;
    const repo = process.env.GITHUB_REPO ?? fromConfig.repo;

    // Resolve tokens from credentials store + env (profile-aware)
    const profile = runtimeConfig.auth?.profile ?? "default";
    const credentialsStore = await readCredentials(profile);
    const { token: githubToken } = await resolveGitHubToken({ env: process.env, credentialsStore });

    const github = createGitHubClient({
      token: dryRun ? "" : githubToken,
      owner,
      repo
    });
    const apiKeyEnv = runtimeConfig.ai?.openai?.api_key_env ?? "OPENAI_API_KEY";
    const codex = createCodexClient({
      mode: runtimeConfig.ai.mode,
      model: runtimeConfig.ai.model,
      apiKey: process.env[apiKeyEnv],
      apiKeyEnvName: apiKeyEnv
    });

    const pipeline = async () => {
      const fix = await codex.proposeFix({ issueTitle: `Incident ${incidentId}` });
      return {
      finalState: "pr_opened",
        fixSummary: fix.summary,
        aiMode: fix.mode
      };
    };

    const result = await runIncident({ incidentId }, { pipeline, github });
    console.log(JSON.stringify(result));
    return;
  }

  if (command === "run-sync") {
    const dryRun = hasFlag("--dry-run");
    const verbose = hasFlag("--verbose");
    const defaultRepoId = process.env.GITHUB_REPOSITORY ?? process.env.GITHUB_REPO_ID;
    let runtimeConfig = await loadRuntimeConfig(defaultRepoId);
    runtimeConfig = enforceCiAiPolicy(runtimeConfig, process.env);
    const fromConfig = splitRepoId(runtimeConfig?.repo?.id);
    const owner = process.env.GITHUB_OWNER ?? fromConfig.owner;
    const repo = process.env.GITHUB_REPO ?? fromConfig.repo;

    const logger = createStderrLogger(verbose);

    // Resolve tokens from credentials store + env (profile-aware)
    const profile = runtimeConfig.auth?.profile ?? "default";
    const credentialsStore = await readCredentials(profile);
    const { token: githubToken } = await resolveGitHubToken({ env: process.env, credentialsStore });
    const sentryApiHostEnv = runtimeConfig.sentry?.api_host_env ?? "SENTRY_API_HOST";
    const sentryTokenEnv = runtimeConfig.sentry?.api_token_env ?? "SENTRY_TOKEN";
    const { token: sentryToken } = resolveSentryToken({
      env: process.env,
      credentialsStore,
      tokenEnvName: sentryTokenEnv
    });

    const github = createGitHubClient({
      token: dryRun ? "" : githubToken,
      owner,
      repo
    });
    const apiKeyEnv = runtimeConfig.ai?.openai?.api_key_env ?? "OPENAI_API_KEY";
    const aiTimeoutSeconds = Number(runtimeConfig.ai?.timeout_seconds ?? 300);
    const aiProgressSeconds = Number(runtimeConfig.ai?.progress_interval_seconds ?? 10);
    const codex = createCodexClient({
      mode: runtimeConfig.ai.mode,
      model: runtimeConfig.ai.model,
      apiKey: process.env[apiKeyEnv],
      apiKeyEnvName: apiKeyEnv,
      timeoutMs:
        Number.isFinite(aiTimeoutSeconds) && aiTimeoutSeconds > 0
          ? aiTimeoutSeconds * 1000
          : 0,
      progressIntervalMs:
        Number.isFinite(aiProgressSeconds) && aiProgressSeconds > 0
          ? aiProgressSeconds * 1000
          : 0,
      logger
    });
    const sentry = createSentryClient({
      token: sentryToken,
      apiHost: process.env[sentryApiHostEnv] ?? "https://sentry.io/api/0"
    });

    const result = await runSync(runtimeConfig, {
      sentryClient: sentry,
      codexClient: codex,
      githubClient: github,
      dryRun,
      logger
    });
    console.log(JSON.stringify(result));
    return;
  }

  if (command === "doctor") {
    const runtimeConfig = await loadRuntimeConfig(process.env.GITHUB_REPO_ID ?? "AXTECH-Shop/ERP");
    const result = await runDoctor(runtimeConfig, { env: process.env });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (command === "init") {
    const preset = parseArg("--preset") ?? "sentry-codex";
    const force = process.argv.includes("--force");
    const result = await runInitSetup({ preset, force });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "generate-artifacts") {
    const inputPath = parseArg("--input");
    if (!inputPath) {
      console.error("Missing --input <path-to-incident-json>");
      process.exit(1);
    }
    const raw = await readFile(inputPath, "utf8");
    const input = JSON.parse(raw);
    const result = generateIncidentArtifacts(input);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "connect") {
    const result = await runConnect({ argv: process.argv, env: process.env });
    if (!result.ok) process.exit(1);
    return;
  }

  console.log("Usage:");
  console.log("  node src/cli.js connect [--profile <name>]                     # credential setup");
  console.log("  node src/cli.js connect --list-profiles                        # list saved profiles");
  console.log("  node src/cli.js connect --set-active <name>                    # switch default profile");
  console.log("  node src/cli.js init [--preset sentry-codex] [--force]");
  console.log("  node src/cli.js doctor [--config <file>]");
  console.log("  node src/cli.js run-incident --incident-id <id> [--dry-run] [--config <file>]");
  console.log("  node src/cli.js run-sync [--dry-run] [--verbose] [--config <file>]");
  console.log("  node src/cli.js generate-artifacts --input <incident-json-file>");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
