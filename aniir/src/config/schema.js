export function withConfigDefaults(input) {
  const config = input ?? {};
  return {
    ...config,
    verification: {
      mode: config.verification?.mode ?? "full",
      allow_fix_only_for: config.verification?.allow_fix_only_for ?? [],
      force_full_for: config.verification?.force_full_for ?? []
    }
  };
}

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be an object");
  }
  if (!config.repo || typeof config.repo.id !== "string" || !config.repo.id.trim()) {
    throw new Error("Config must include repo.id");
  }
  if (!["full", "fix_only"].includes(config.verification.mode)) {
    throw new Error("verification.mode must be 'full' or 'fix_only'");
  }
  return config;
}
