#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createGitHubClient } from "./integrations/github/client.js";
import { createCodexClient } from "./integrations/codex/client.js";
import { runIncident } from "./commands/run-incident.js";
import { generateIncidentArtifacts } from "./commands/generate-incident-artifacts.js";
import { loadConfig } from "./config/load.js";
import { withConfigDefaults, validateConfig } from "./config/schema.js";

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
    const github = createGitHubClient({
      token: dryRun ? "" : process.env.GITHUB_TOKEN,
      owner,
      repo
    });
    const runtimeConfig = await loadRuntimeConfig(`${owner}/${repo}`);
    const apiKeyEnv = runtimeConfig.ai?.openai?.api_key_env ?? "OPENAI_API_KEY";
    const codex = createCodexClient({
      mode: runtimeConfig.ai.mode,
      model: runtimeConfig.ai.model,
      apiKey: process.env[apiKeyEnv]
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
  console.log("Usage:");
  console.log("  node src/cli.js run-incident --incident-id <id> [--dry-run] [--config <file>]");
  console.log("  node src/cli.js generate-artifacts --input <incident-json-file>");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
