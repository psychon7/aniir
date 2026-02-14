import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

export async function runPlaywrightChecks(command, { cwd } = {}) {
  if (!command) return { ok: true, skipped: true };
  try {
    await exec(command, { cwd });
    return { ok: true, skipped: false };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error?.message ?? "Playwright command failed"
    };
  }
}
