#!/usr/bin/env node
import { createGitHubClient } from "./integrations/github/client.js";
import { runIncident } from "./commands/run-incident.js";

function parseArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const command = process.argv[2];
  if (command !== "run-incident") {
    console.log("Usage: node src/cli.js run-incident --incident-id <id> [--dry-run]");
    process.exit(1);
  }

  const incidentId = parseArg("--incident-id");
  if (!incidentId) {
    console.error("Missing --incident-id");
    process.exit(1);
  }

  const dryRun = process.argv.includes("--dry-run");
  const github = createGitHubClient({
    token: dryRun ? "" : process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER ?? "axtech",
    repo: process.env.GITHUB_REPO ?? "erp2025"
  });

  const pipeline = async () => ({
    finalState: "pr_opened",
    fixSummary: "Dry-run placeholder pipeline result"
  });

  const result = await runIncident({ incidentId }, { pipeline, github });
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
