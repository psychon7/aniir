import test from "node:test";
import assert from "node:assert/strict";
import { runConnect } from "../src/commands/connect.js";
import { readCredentials } from "../src/auth/credentials-store.js";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateKeyPairSync } from "node:crypto";

function makeTestKeyPair() {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  return privateKey;
}

test("connect: non-interactive saves sentry token to default profile", async () => {
  const result = await runConnect({
    argv: [
      "node", "cli.js", "connect",
      "--sentry-token", "sntrx_test_abc123",
      "--non-interactive"
    ],
    env: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.profile, "default");
  assert.ok(result.saved.includes("sentry_token"));
});

test("connect: non-interactive saves github token", async () => {
  const result = await runConnect({
    argv: [
      "node", "cli.js", "connect",
      "--github-token", "ghp_test_token",
      "--non-interactive"
    ],
    env: {}
  });
  assert.equal(result.ok, true);
  assert.ok(result.saved.includes("github_token"));
});

test("connect: non-interactive saves to named profile", async () => {
  const result = await runConnect({
    argv: [
      "node", "cli.js", "connect",
      "--profile", "personal",
      "--sentry-token", "personal-sentry-token",
      "--github-token", "ghp_personal",
      "--non-interactive"
    ],
    env: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.profile, "personal");
  assert.ok(result.saved.includes("sentry_token"));
  assert.ok(result.saved.includes("github_token"));
});

test("connect: non-interactive saves github app credentials with pem file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aniir-connect-"));
  const pemPath = join(dir, "test-app.pem");
  const pem = makeTestKeyPair();
  await writeFile(pemPath, pem);

  try {
    const result = await runConnect({
      argv: [
        "node", "cli.js", "connect",
        "--profile", "work",
        "--github-app-id", "12345",
        "--github-private-key-path", pemPath,
        "--github-installation-id", "67890",
        "--non-interactive"
      ],
      env: {}
    });
    assert.equal(result.ok, true);
    assert.equal(result.profile, "work");
    assert.ok(result.saved.includes("github_app_id"));
    assert.ok(result.saved.includes("github_installation_id"));
    assert.ok(result.saved.includes("github_app_private_key"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("connect: non-interactive with no flags saves nothing", async () => {
  const result = await runConnect({
    argv: ["node", "cli.js", "connect", "--non-interactive"],
    env: {}
  });
  assert.equal(result.ok, true);
  assert.equal(result.saved.length, 0);
});

test("connect: --list-profiles returns profile info", async () => {
  const result = await runConnect({
    argv: ["node", "cli.js", "connect", "--list-profiles"],
    env: {}
  });
  assert.equal(result.ok, true);
  assert.ok(result.profiles);
  assert.ok(Array.isArray(result.profiles.profiles));
});
