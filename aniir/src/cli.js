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

async function loadRuntimeConfig(defaultRepoId) {
  const explicitPath = parseArg("--config");
  if (explicitPath) {
    return loadConfig(explicitPath);
  }
  try {
    return await loadConfig("aniir.config.yaml");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return validateConfig(withConfigDefaults({ repo: { id: defaultRepoId } }));
  }
}

function enforceCiAiPolicy(config, env = process.env) {
  const isCi = Boolean(env.CI);
  if (!isCi) return;
  const mode = config?.ai?.mode ?? "codex_cloud_subscription";
  const allow = config?.ai?.allow_subscription_in_ci === true;
  if (mode !== "openai_api" && !allow) {
    throw new Error("CI requires ai.mode=openai_api unless ai.allow_subscription_in_ci=true");
  }
}

async function main() {
  const command = process.argv[2];
  if (command === "run-incident") {
    const incidentId = parseArg("--incident-id");
    if (!incidentId) {
      console.error("Missing --incident-id");
      process.exit(1);
    }

    const dryRun = process.argv.includes("--dry-run");
    const owner = process.env.GITHUB_OWNER ?? "axtech";
    const repo = process.env.GITHUB_REPO ?? "erp2025";
    const runtimeConfig = await loadRuntimeConfig(`${owner}/${repo}`);
    enforceCiAiPolicy(runtimeConfig, process.env);

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
    const dryRun = process.argv.includes("--dry-run");
    const owner = process.env.GITHUB_OWNER ?? "axtech";
    const repo = process.env.GITHUB_REPO ?? "erp2025";
    const runtimeConfig = await loadRuntimeConfig(`${owner}/${repo}`);
    enforceCiAiPolicy(runtimeConfig, process.env);

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
    const codex = createCodexClient({
      mode: runtimeConfig.ai.mode,
      model: runtimeConfig.ai.model,
      apiKey: process.env[apiKeyEnv],
      apiKeyEnvName: apiKeyEnv
    });
    const sentry = createSentryClient({
      token: sentryToken,
      apiHost: process.env[sentryApiHostEnv] ?? "https://sentry.io/api/0"
    });

    const result = await runSync(runtimeConfig, {
      sentryClient: sentry,
      codexClient: codex,
      githubClient: github
    });
    console.log(JSON.stringify(result));
    return;
  }

  if (command === "doctor") {
    const owner = process.env.GITHUB_OWNER ?? "axtech";
    const repo = process.env.GITHUB_REPO ?? "erp2025";
    const runtimeConfig = await loadRuntimeConfig(`${owner}/${repo}`);
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
  console.log("  node src/cli.js run-sync [--dry-run] [--config <file>]");
  console.log("  node src/cli.js generate-artifacts --input <incident-json-file>");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
