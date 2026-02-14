import { runPlaywrightChecks } from "../../integrations/playwright/runner.js";

export function shouldRunFullVerification(config) {
  return (config?.verification?.mode ?? "full") === "full";
}

export async function verifyIncident({ config, testRunner, playwrightCwd }) {
  if (!shouldRunFullVerification(config)) {
    return { ok: true, mode: "fix_only", checks: [] };
  }

  const checks = [];
  if (typeof testRunner === "function") {
    const result = await testRunner();
    checks.push({ name: "tests", ...result });
    if (!result.ok) return { ok: false, mode: "full", checks };
  }

  if (config?.playwright?.enabled) {
    const pw = await runPlaywrightChecks(config.playwright.command, { cwd: playwrightCwd });
    checks.push({ name: "playwright", ...pw });
    if (!pw.ok) return { ok: false, mode: "full", checks };
  }

  return { ok: true, mode: "full", checks };
}
