/**
 * `aniir connect` — one-time interactive setup wizard (with profiles).
 *
 * Collects Sentry token, GitHub App details (or PAT), and saves
 * to a named profile in ~/.aniir/credentials.json.
 *
 * Usage:
 *   aniir connect                                         # interactive (default profile)
 *   aniir connect --profile axtech                        # interactive (named profile)
 *   aniir connect --profile personal --sentry-token <tok> # non-interactive
 *   aniir connect --profile personal --github-token <tok> --non-interactive
 *   aniir connect --list-profiles                         # show saved profiles
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile } from "node:fs/promises";
import { mergeCredentials, getStorePath, listProfiles, setActiveProfile } from "../auth/credentials-store.js";

async function prompt(rl, question, defaultValue) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue || "";
}

function parseConnectArgs(argv) {
  const args = {};
  const flags = [
    "--sentry-token",
    "--github-token",
    "--github-app-id",
    "--github-private-key-path",
    "--github-installation-id",
    "--profile",
    "--non-interactive",
    "--list-profiles",
    "--set-active"
  ];
  for (const flag of flags) {
    const idx = argv.indexOf(flag);
    if (idx >= 0) {
      if (flag === "--non-interactive" || flag === "--list-profiles") {
        args[flag.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
      } else {
        args[flag.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[idx + 1];
      }
    }
  }
  return args;
}

export async function runConnect({ argv = process.argv, env = process.env } = {}) {
  const args = parseConnectArgs(argv);

  // ── List profiles ─────────────────────────────────────────────────
  if (args.listProfiles) {
    const info = await listProfiles();
    console.log(`Active profile: ${info.active}`);
    console.log(`Profiles: ${info.profiles.length ? info.profiles.join(", ") : "(none)"}`);
    return { ok: true, profiles: info };
  }

  // ── Set active profile ────────────────────────────────────────────
  if (args.setActive) {
    await setActiveProfile(args.setActive);
    console.log(`Active profile set to: ${args.setActive}`);
    return { ok: true, activeProfile: args.setActive };
  }

  const profileName = args.profile ?? "default";
  const updates = {};
  const summary = { saved: [], skipped: [] };

  if (args.nonInteractive) {
    // Non-interactive: save whatever was provided via flags
    if (args.sentryToken) updates.sentry_token = args.sentryToken;
    if (args.githubToken) updates.github_token = args.githubToken;
    if (args.githubAppId) updates.github_app_id = args.githubAppId;
    if (args.githubInstallationId) updates.github_installation_id = args.githubInstallationId;
    if (args.githubPrivateKeyPath) {
      const pem = await readFile(args.githubPrivateKeyPath, "utf8");
      updates.github_app_private_key = pem.trim();
    }
    const stored = await mergeCredentials(updates, profileName);
    return {
      ok: true,
      profile: profileName,
      credentialsPath: getStorePath(),
      saved: Object.keys(updates),
      stored: Object.keys(stored).filter((k) => k !== "updated_at")
    };
  }

  // Interactive wizard
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log("");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║         Aniir Connect — One-Time Setup        ║");
    console.log("╚════════════════════════════════════════════════╝");
    console.log("");
    console.log(`Profile: ${profileName}`);
    console.log(`Store:   ${getStorePath()}`);
    console.log("");

    // ── Profile name (allow override) ─────────────────────────────────
    const finalProfile = await prompt(rl, "Profile name", profileName);

    // ── Sentry ────────────────────────────────────────────────────────
    console.log("");
    console.log("─── Sentry ───");
    console.log("Create a token at: https://sentry.io/settings/account/api/auth-tokens/");
    console.log("Scopes needed: project:read, event:read, org:read");
    const sentryToken = await prompt(rl, "Sentry API token", env.SENTRY_TOKEN ?? "");
    if (sentryToken) {
      updates.sentry_token = sentryToken;
      summary.saved.push("sentry_token");
    } else {
      summary.skipped.push("sentry_token");
    }

    // ── GitHub ────────────────────────────────────────────────────────
    console.log("");
    console.log("─── GitHub ───");
    console.log("Option A: Install Aniir GitHub App (recommended for multi-repo)");
    console.log("Option B: Personal Access Token (quick for single repo)");
    console.log("");
    const githubMethod = await prompt(rl, "Use GitHub App? (y/n)", "n");

    if (githubMethod.toLowerCase() === "y") {
      console.log("");
      console.log("Create a GitHub App at: https://github.com/settings/apps/new");
      console.log("Permissions: Contents (rw), Pull requests (rw), Metadata (r)");
      console.log("After creating, install it on your org/repos.");
      console.log("");

      const appId = await prompt(rl, "GitHub App ID");
      const keyPath = await prompt(rl, "Path to private key .pem file");
      const instId = await prompt(rl, "Installation ID (from /settings/installations)");

      if (appId && keyPath && instId) {
        updates.github_app_id = appId;
        updates.github_installation_id = instId;
        try {
          const pem = await readFile(keyPath, "utf8");
          updates.github_app_private_key = pem.trim();
          summary.saved.push("github_app");
        } catch (err) {
          console.log(`⚠ Could not read ${keyPath}: ${err.message}`);
          summary.skipped.push("github_app");
        }
      } else {
        summary.skipped.push("github_app");
      }
    } else {
      console.log("");
      console.log("Create a fine-grained PAT at: https://github.com/settings/tokens?type=beta");
      console.log("Permissions: Contents (rw), Pull requests (rw)");
      const pat = await prompt(rl, "GitHub PAT", env.GITHUB_TOKEN ?? "");
      if (pat) {
        updates.github_token = pat;
        summary.saved.push("github_token");
      } else {
        summary.skipped.push("github_token");
      }
    }

    console.log("");

    // ── Save ──────────────────────────────────────────────────────────
    if (Object.keys(updates).length > 0) {
      await mergeCredentials(updates, finalProfile);
      console.log(`✓ Credentials saved to profile "${finalProfile}" at ${getStorePath()}`);
      console.log(`  Saved: ${summary.saved.join(", ") || "none"}`);
      if (summary.skipped.length) {
        console.log(`  Skipped: ${summary.skipped.join(", ")}`);
      }
      console.log("");
      console.log(`Tip: Set this profile in your repo's aniir.config.yaml:`);
      console.log(`  auth:`);
      console.log(`    profile: ${finalProfile}`);
    } else {
      console.log("No credentials were provided. Run `aniir connect` again when ready.");
    }
    console.log("");
    console.log("Next: run `aniir doctor` to verify your setup.");
    console.log("");

    return {
      ok: Object.keys(updates).length > 0,
      profile: finalProfile,
      credentialsPath: getStorePath(),
      saved: summary.saved,
      skipped: summary.skipped
    };
  } finally {
    rl.close();
  }
}
