import test from "node:test";
import assert from "node:assert/strict";
import { resolveGitHubToken, resolveSentryToken, buildJwt, mintInstallationToken } from "../src/auth/github-app.js";
import { readCredentials, writeCredentials, mergeCredentials, getStorePath, listProfiles, setActiveProfile } from "../src/auth/credentials-store.js";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { generateKeyPairSync } from "node:crypto";

// ── Helpers ─────────────────────────────────────────────────────────────

function makeTestKeyPair() {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  return privateKey;
}

// ── Credentials Store ───────────────────────────────────────────────────

test("credentials store: read returns empty object when file does not exist", async () => {
  const path = join(tmpdir(), `aniir-test-${Date.now()}-nonexistent.json`);
  const result = await readCredentials("default", path);
  assert.deepStrictEqual(result, {});
});

test("credentials store: write and read roundtrip", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    await writeCredentials({ sentry_token: "test-token-123" }, "default", path);
    const result = await readCredentials("default", path);
    assert.equal(result.sentry_token, "test-token-123");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("credentials store: merge preserves existing keys", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    await writeCredentials({ sentry_token: "old-token", github_token: "gh-pat" }, "default", path);
    const merged = await mergeCredentials({ sentry_token: "new-token" }, "default", path);
    assert.equal(merged.sentry_token, "new-token");
    assert.equal(merged.github_token, "gh-pat");
    assert.ok(merged.updated_at);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("credentials store: getStorePath returns expected path", () => {
  const storePath = getStorePath();
  assert.ok(storePath.endsWith("credentials.json"));
  assert.ok(storePath.includes(".aniir"));
});

// ── Profiles ────────────────────────────────────────────────────────────

test("credentials store: separate profiles are isolated", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    await mergeCredentials({ sentry_token: "personal-sentry" }, "personal", path);
    await mergeCredentials({ sentry_token: "axtech-sentry" }, "axtech", path);
    const personal = await readCredentials("personal", path);
    const axtech = await readCredentials("axtech", path);
    assert.equal(personal.sentry_token, "personal-sentry");
    assert.equal(axtech.sentry_token, "axtech-sentry");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("credentials store: listProfiles returns all profile names", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    await mergeCredentials({ sentry_token: "t1" }, "alpha", path);
    await mergeCredentials({ sentry_token: "t2" }, "beta", path);
    const info = await listProfiles(path);
    assert.ok(info.profiles.includes("alpha"));
    assert.ok(info.profiles.includes("beta"));
    assert.equal(info.active, "alpha"); // first written becomes active
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("credentials store: setActiveProfile switches active", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    await mergeCredentials({ sentry_token: "t1" }, "alpha", path);
    await mergeCredentials({ sentry_token: "t2" }, "beta", path);
    await setActiveProfile("beta", path);
    const info = await listProfiles(path);
    assert.equal(info.active, "beta");
    // Reading without explicit profile should return active profile's data
    const data = await readCredentials(undefined, path);
    assert.equal(data.sentry_token, "t2");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("credentials store: migrates flat format to profiled format", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-test-"));
  const path = join(dir, "creds.json");
  try {
    // Write old flat format directly
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path, JSON.stringify({ sentry_token: "old-flat-token", github_token: "gh-old" }));
    // Reading should auto-migrate
    const data = await readCredentials("default", path);
    assert.equal(data.sentry_token, "old-flat-token");
    assert.equal(data.github_token, "gh-old");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ── Sentry Token Resolution ────────────────────────────────────────────

test("resolveSentryToken: returns env var when set", () => {
  const result = resolveSentryToken({ env: { SENTRY_TOKEN: "env-token" }, credentialsStore: {} });
  assert.equal(result.token, "env-token");
  assert.equal(result.method, "resolved");
});

test("resolveSentryToken: falls back to credentials store", () => {
  const result = resolveSentryToken({
    env: {},
    credentialsStore: { sentry_token: "stored-token" }
  });
  assert.equal(result.token, "stored-token");
  assert.equal(result.method, "resolved");
});

test("resolveSentryToken: env takes priority over credentials store", () => {
  const result = resolveSentryToken({
    env: { SENTRY_TOKEN: "env-token" },
    credentialsStore: { sentry_token: "stored-token" }
  });
  assert.equal(result.token, "env-token");
});

test("resolveSentryToken: returns none when no token found", () => {
  const result = resolveSentryToken({ env: {}, credentialsStore: {} });
  assert.equal(result.token, "");
  assert.equal(result.method, "none");
});

test("resolveSentryToken: respects custom tokenEnvName", () => {
  const result = resolveSentryToken({
    env: { MY_SENTRY: "custom-token" },
    credentialsStore: {},
    tokenEnvName: "MY_SENTRY"
  });
  assert.equal(result.token, "custom-token");
  assert.equal(result.method, "resolved");
});

// ── GitHub Token Resolution ─────────────────────────────────────────────

test("resolveGitHubToken: returns env GITHUB_TOKEN as fallback", async () => {
  const result = await resolveGitHubToken({
    env: { GITHUB_TOKEN: "ghp_test123" },
    credentialsStore: {}
  });
  assert.equal(result.token, "ghp_test123");
  assert.equal(result.method, "env_token");
});

test("resolveGitHubToken: returns none when nothing configured", async () => {
  const result = await resolveGitHubToken({ env: {}, credentialsStore: {} });
  assert.equal(result.token, "");
  assert.equal(result.method, "none");
});

test("resolveGitHubToken: prefers GitHub App over env token", async () => {
  const privateKeyPem = makeTestKeyPair();

  // Mock fetch to return a successful installation token
  const mockFetch = async (url, opts) => {
    assert.ok(url.includes("/installations/"), "should call installations API");
    assert.equal(opts.method, "POST");
    assert.ok(opts.headers.Authorization.startsWith("Bearer "), "should send JWT");
    return {
      ok: true,
      json: async () => ({
        token: "ghs_app_token_123",
        expires_at: "2099-01-01T00:00:00Z",
        permissions: { contents: "write", pull_requests: "write" }
      })
    };
  };

  const result = await resolveGitHubToken({
    env: {
      ANIIR_GITHUB_APP_ID: "12345",
      ANIIR_GITHUB_APP_PRIVATE_KEY: privateKeyPem,
      ANIIR_GITHUB_INSTALLATION_ID: "67890",
      GITHUB_TOKEN: "ghp_should_not_use"
    },
    credentialsStore: {},
    fetchImpl: mockFetch
  });
  assert.equal(result.token, "ghs_app_token_123");
  assert.equal(result.method, "github_app");
});

test("resolveGitHubToken: uses credentials store for app auth", async () => {
  const privateKeyPem = makeTestKeyPair();

  const mockFetch = async () => ({
    ok: true,
    json: async () => ({
      token: "ghs_from_store",
      expires_at: "2099-01-01T00:00:00Z",
      permissions: {}
    })
  });

  const result = await resolveGitHubToken({
    env: {},
    credentialsStore: {
      github_app_id: "11111",
      github_app_private_key: privateKeyPem,
      github_installation_id: "22222"
    },
    fetchImpl: mockFetch
  });
  assert.equal(result.token, "ghs_from_store");
  assert.equal(result.method, "github_app");
});

// ── JWT Builder ─────────────────────────────────────────────────────────

test("buildJwt: produces a valid 3-part JWT", () => {
  const pem = makeTestKeyPair();
  const jwt = buildJwt("12345", pem);
  const parts = jwt.split(".");
  assert.equal(parts.length, 3, "JWT should have 3 parts");

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  assert.equal(header.alg, "RS256");
  assert.equal(header.typ, "JWT");

  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  assert.equal(payload.iss, "12345");
  assert.ok(payload.iat > 0);
  assert.ok(payload.exp > payload.iat);
});

// ── Installation Token Minting ──────────────────────────────────────────

test("mintInstallationToken: throws on non-ok response", async () => {
  const pem = makeTestKeyPair();
  const mockFetch = async () => ({
    ok: false,
    status: 401,
    text: async () => "Bad credentials"
  });

  await assert.rejects(
    () => mintInstallationToken({
      appId: "12345",
      privateKeyPem: pem,
      installationId: "67890",
      fetchImpl: mockFetch
    }),
    /Failed to mint GitHub installation token \(401\)/
  );
});

test("mintInstallationToken: returns token on success", async () => {
  const pem = makeTestKeyPair();
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({
      token: "ghs_minted",
      expires_at: "2099-12-31T00:00:00Z",
      permissions: { contents: "write" }
    })
  });

  const result = await mintInstallationToken({
    appId: "12345",
    privateKeyPem: pem,
    installationId: "67890",
    fetchImpl: mockFetch
  });
  assert.equal(result.token, "ghs_minted");
  assert.equal(result.expiresAt, "2099-12-31T00:00:00Z");
  assert.deepStrictEqual(result.permissions, { contents: "write" });
});
