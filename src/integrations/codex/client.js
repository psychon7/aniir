const VALID_MODES = new Set([
  "codex_cloud_subscription",
  "codex_local_subscription",
  "openai_api"
]);

function isInteractiveTty() {
  return Boolean(process.stdin?.isTTY && process.stdout?.isTTY);
}

function withTimeout(promise, timeoutMs, label) {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label ?? "Operation"} timed out after ${Math.ceil(timeoutMs / 1000)}s`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function withProgress(promise, { intervalMs, onTick }) {
  if (!intervalMs || intervalMs <= 0 || typeof onTick !== "function") return promise;
  const startedAt = Date.now();
  const timer = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    try {
      onTick(elapsedSeconds);
    } catch {
      // ignore logging failures
    }
  }, intervalMs);
  return Promise.resolve(promise).finally(() => clearInterval(timer));
}

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
  requireTtyForSubscription = true,
  timeoutMs = 5 * 60 * 1000,
  progressIntervalMs = 10 * 1000,
  logger,
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

      // Permanent fix for "hang with no login prompt":
      // Subscription modes may need interactive auth (browser/device-code UI).
      // When stdin/stdout are not TTY (CI, background tasks, some terminals),
      // the SDK can appear to hang. Fail fast with actionable guidance.
      if (mode !== "openai_api" && requireTtyForSubscription && !isInteractiveTty()) {
        throw new Error(
          "Codex subscription auth requires an interactive terminal. " +
          "Run `codex login --device-auth` once (recommended) or run Aniir in a normal terminal. " +
          "For CI/non-interactive runs, use ai.mode=openai_api with CODEX_API_KEY/OPENAI_API_KEY."
        );
      }

      const thread = await getThread();
      const prompt =
        issueContext?.prompt ??
        `Investigate and propose a fix for: ${issueContext?.issueTitle ?? issueContext?.title ?? "unknown issue"}`;
      const runPromise = withProgress(thread.run(prompt), {
        intervalMs: progressIntervalMs,
        onTick: (elapsedSeconds) => {
          if (logger?.info) logger.info(`[codex] still running... ${elapsedSeconds}s`);
        }
      });

      const turn = await withTimeout(runPromise, timeoutMs, "Codex proposeFix");

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
