const VALID_MODES = new Set([
  "codex_cloud_subscription",
  "codex_local_subscription",
  "openai_api"
]);

export function createCodexClient({
  mode = "codex_cloud_subscription",
  model = "gpt-5-codex",
  apiKey = process.env.OPENAI_API_KEY
} = {}) {
  if (!VALID_MODES.has(mode)) {
    throw new Error(`Unsupported AI mode: ${mode}`);
  }

  return {
    mode,
    model,
    async proposeFix(issueContext) {
      if (mode === "openai_api" && !apiKey) {
        throw new Error("OPENAI_API_KEY is required for openai_api mode");
      }

      return {
        summary: `Proposed fix for: ${issueContext.issueTitle ?? "unknown issue"}`,
        patch: "",
        testsAdded: [],
        mode,
        model
      };
    }
  };
}
