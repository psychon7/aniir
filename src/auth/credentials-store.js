/**
 * Shared credentials store for Aniir — with named profiles.
 *
 * Layout of ~/.aniir/credentials.json:
 *
 *   {
 *     "active_profile": "default",
 *     "profiles": {
 *       "default":  { sentry_token, github_token, ... },
 *       "axtech":   { sentry_token, github_app_id, ... },
 *       "personal": { sentry_token, github_token, ... }
 *     }
 *   }
 *
 * On first run: `aniir connect` writes credentials here.
 * On every run: Aniir reads the active profile (env vars always override).
 *
 * Each repo can pin a profile via `auth.profile` in aniir.config.yaml,
 * or override at CLI level with `--profile <name>`.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const STORE_DIR = join(homedir(), ".aniir");
const STORE_PATH = join(STORE_DIR, "credentials.json");
const DEFAULT_PROFILE = "default";

// ── Low-level I/O ───────────────────────────────────────────────────────

async function readStore(path = STORE_PATH) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

async function writeStore(data, path = STORE_PATH) {
  const dir = path === STORE_PATH ? STORE_DIR : join(path, "..");
  await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
}

// ── Migration helper: convert flat creds → profiled format ──────────────

function migrateFlat(store) {
  // If the store already has "profiles", nothing to do
  if (store.profiles && typeof store.profiles === "object") return store;

  // Old flat format: { sentry_token, github_token, ... }
  // Move everything except meta keys into profiles.default
  const { active_profile, profiles, updated_at, ...rest } = store;
  if (Object.keys(rest).length === 0) return { active_profile: active_profile ?? undefined, profiles: {} };

  return {
    active_profile: DEFAULT_PROFILE,
    profiles: { [DEFAULT_PROFILE]: { ...rest, updated_at } }
  };
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Read credentials for a specific profile.
 * Falls back to the active_profile, then to "default".
 */
export async function readCredentials(pathOrProfile, path = STORE_PATH) {
  // Compat: if first arg looks like a file path, treat it as path
  let profileName;
  if (pathOrProfile && pathOrProfile.includes("/")) {
    path = pathOrProfile;
    profileName = undefined;
  } else {
    profileName = pathOrProfile;
  }

  const raw = await readStore(path);
  const store = migrateFlat(raw);
  const name = profileName ?? store.active_profile ?? DEFAULT_PROFILE;
  return store.profiles?.[name] ?? {};
}

/**
 * Write credentials for a specific profile (full replace).
 */
export async function writeCredentials(data, pathOrProfile, path = STORE_PATH) {
  let profileName = DEFAULT_PROFILE;
  if (pathOrProfile && pathOrProfile.includes("/")) {
    path = pathOrProfile;
  } else if (pathOrProfile) {
    profileName = pathOrProfile;
  }

  const raw = await readStore(path);
  const store = migrateFlat(raw);
  if (!store.profiles) store.profiles = {};
  store.profiles[profileName] = data;
  if (!store.active_profile) store.active_profile = profileName;
  await writeStore(store, path);
}

/**
 * Merge updates into a specific profile, preserving existing keys.
 */
export async function mergeCredentials(updates, pathOrProfile, path = STORE_PATH) {
  let profileName = DEFAULT_PROFILE;
  if (pathOrProfile && pathOrProfile.includes("/")) {
    path = pathOrProfile;
  } else if (pathOrProfile) {
    profileName = pathOrProfile;
  }

  const raw = await readStore(path);
  const store = migrateFlat(raw);
  if (!store.profiles) store.profiles = {};
  const existing = store.profiles[profileName] ?? {};
  const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
  store.profiles[profileName] = merged;
  if (!store.active_profile) store.active_profile = profileName;
  await writeStore(store, path);
  return merged;
}

/**
 * Set which profile is active globally.
 */
export async function setActiveProfile(profileName, path = STORE_PATH) {
  const raw = await readStore(path);
  const store = migrateFlat(raw);
  store.active_profile = profileName;
  await writeStore(store, path);
}

/**
 * List all profile names.
 */
export async function listProfiles(path = STORE_PATH) {
  const raw = await readStore(path);
  const store = migrateFlat(raw);
  return {
    active: store.active_profile ?? DEFAULT_PROFILE,
    profiles: Object.keys(store.profiles ?? {})
  };
}

export function getStorePath() {
  return STORE_PATH;
}

