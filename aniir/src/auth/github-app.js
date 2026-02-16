/**
 * GitHub App authentication module.
 *
 * Instead of per-repo PATs, users install the Aniir GitHub App once on their
 * org/account.  Aniir then generates short-lived installation tokens on the fly.
 *
 * Required env / credentials store values:
 *   ANIIR_GITHUB_APP_ID          – numeric App ID
 *   ANIIR_GITHUB_APP_PRIVATE_KEY – PEM private key (or path to .pem file)
 *   ANIIR_GITHUB_INSTALLATION_ID – installation ID for the target org/user
 *
 * When these are present Aniir never needs a PAT.
 */

import { createPrivateKey, createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

// ── JWT builder (RS256, GitHub App spec) ────────────────────────────────

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function buildJwt(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iat: now - 60,          // issued 60 s in the past (clock skew)
      exp: now + 10 * 60,     // 10 min lifetime (GitHub max)
      iss: String(appId)
    })
  );
  const unsigned = `${header}.${payload}`;
  const key = createPrivateKey(privateKeyPem);
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");
  return `${unsigned}.${signature}`;
}

// ── Installation token minting ──────────────────────────────────────────

async function mintInstallationToken(
  { appId, privateKeyPem, installationId, fetchImpl = fetch }
) {
  const jwt = buildJwt(appId, privateKeyPem);
  const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to mint GitHub installation token (${response.status}): ${body}`
    );
  }

  const data = await response.json();
  return {
    token: data.token,
    expiresAt: data.expires_at,
    permissions: data.permissions ?? {}
  };
}

// ── Resolve private key (inline PEM string or file path) ────────────────

async function resolvePrivateKey(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed;
  // Treat as file path
  try {
    const content = await readFile(trimmed, "utf8");
    return content.trim();
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Resolve a GitHub token using the best available method:
 *
 * 1. GitHub App credentials  → mint short-lived installation token (preferred)
 * 2. GITHUB_TOKEN env        → use as-is (fallback for Actions / manual PAT)
 *
 * Returns { token, method } where method is "github_app" | "env_token" | "none".
 */
export async function resolveGitHubToken({
  env = process.env,
  credentialsStore,
  fetchImpl = fetch
} = {}) {
  // ── Try GitHub App first ──────────────────────────────────────────────
  const appId =
    env.ANIIR_GITHUB_APP_ID ??
    credentialsStore?.github_app_id;

  const rawKey =
    env.ANIIR_GITHUB_APP_PRIVATE_KEY ??
    credentialsStore?.github_app_private_key;

  const installationId =
    env.ANIIR_GITHUB_INSTALLATION_ID ??
    credentialsStore?.github_installation_id;

  if (appId && rawKey && installationId) {
    const privateKeyPem = await resolvePrivateKey(rawKey);
    if (privateKeyPem) {
      const result = await mintInstallationToken({
        appId,
        privateKeyPem,
        installationId,
        fetchImpl
      });
      return { token: result.token, method: "github_app", expiresAt: result.expiresAt };
    }
  }

  // ── Fallback to env token or stored PAT ────────────────────────────────
  const envToken = env.GITHUB_TOKEN ?? credentialsStore?.github_token;
  if (envToken) {
    return { token: envToken, method: "env_token" };
  }

  return { token: "", method: "none" };
}

/**
 * Resolve Sentry token from credentials store or env.
 */
export function resolveSentryToken({ env = process.env, credentialsStore, tokenEnvName = "SENTRY_TOKEN" } = {}) {
  const token =
    env[tokenEnvName] ??
    credentialsStore?.sentry_token;

  return { token: token ?? "", method: token ? "resolved" : "none" };
}

export { buildJwt, mintInstallationToken };
