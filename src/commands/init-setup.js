import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runInitSetup({ cwd = process.cwd(), preset = "sentry-codex", force = false } = {}) {
  if (preset !== "sentry-codex") {
    throw new Error(`Unsupported preset: ${preset}`);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const templatesDir = join(here, "..", "..", "templates");
  const sourceConfigPath = join(templatesDir, "aniir.config.yaml");
  const sourceWorkflowPath = join(templatesDir, "github-workflow-aniir.yml");

  const targetConfigPath = join(cwd, "aniir.config.yaml");
  const targetWorkflowDir = join(cwd, ".github", "workflows");
  const targetWorkflowPath = join(targetWorkflowDir, "aniir.yml");

  await mkdir(targetWorkflowDir, { recursive: true });

  let createdConfig = false;
  if (force || !(await exists(targetConfigPath))) {
    await copyFile(sourceConfigPath, targetConfigPath);
    createdConfig = true;
  }

  let createdWorkflow = false;
  if (force || !(await exists(targetWorkflowPath))) {
    await copyFile(sourceWorkflowPath, targetWorkflowPath);
    createdWorkflow = true;
  }

  return {
    preset,
    createdConfig,
    createdWorkflow,
    configPath: targetConfigPath,
    workflowPath: targetWorkflowPath
  };
}
