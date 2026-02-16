const VALID_MODES = new Set([
  "codex_cloud_subscription",
  "codex_local_subscription",
  "openai_api"
]);

function summarizeTurn(turn, issueTitle) {
  const value = turn?.finalResponse;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") return JSON.stringify(value);
  return `Proposed fix for: ${issueTitle ?? "unknown issue"}`;
}

async function defaultCreateSdkClient({ mode, model, apiKey }) {
  let sdkModule;
  try {
    sdkModule = await import("@openai/codex-sdk");
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error("@openai/codex-sdk is required. Install it with `npm install @openai/codex-sdk`.");
    }
    throw error;
  }
  const { Codex } = sdkModule;
  const options = {
    config: {
      model
    }
  };
  if (mode === "openai_api") {
    options.env = {
      ...process.env,
      CODEX_API_KEY: apiKey
    };
  }
  return new Codex(options);
}

export function createCodexClient({
  mode = "codex_cloud_subscription",
  model = "gpt-5-codex",
  apiKey = process.env.OPENAI_API_KEY,
  apiKeyEnvName = "OPENAI_API_KEY",
  workingDirectory = process.cwd(),
  createSdkClient = defaultCreateSdkClient
} = {}) {
  if (!VALID_MODES.has(mode)) {
    throw new Error(`Unsupported AI mode: ${mode}`);
  }

  let threadPromise;
  async function getThread() {
    if (!threadPromise) {
      threadPromise = (async () => {
        const client = await createSdkClient({ mode, model, apiKey });
        if (!client || typeof client.startThread !== "function") {
          throw new Error("Codex SDK client must expose startThread()");
        }
        return client.startThread({
          workingDirectory
        });
      })();
    }
    return threadPromise;
  }

  return {
    mode,
    model,
    async proposeFix(issueContext) {
      if (mode === "openai_api" && !apiKey) {
        throw new Error(`${apiKeyEnvName} is required for openai_api mode`);
      }

      const thread = await getThread();
      const prompt =
        issueContext?.prompt ??
        `Investigate and propose a fix for: ${issueContext?.issueTitle ?? issueContext?.title ?? "unknown issue"}`;
      const turn = await thread.run(prompt);

      return {
        summary: summarizeTurn(turn, issueContext?.issueTitle),
        patch: "",
        testsAdded: [],
        mode,
        model,
        promptUsed: prompt
      };
    }
  };
}
