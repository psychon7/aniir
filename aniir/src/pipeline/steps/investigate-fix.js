import { buildStepPrompt } from "../../prompts/builder.js";

export async function runInvestigateFix(issue, codexClient, config = {}) {
  if (!codexClient || typeof codexClient.proposeFix !== "function") {
    throw new Error("Codex client with proposeFix is required");
  }
  const prompt = buildStepPrompt({ step: "investigate_fix", issue, config });
  return codexClient.proposeFix({
    ...issue,
    prompt: prompt.text,
    promptVariables: prompt.variables
  });
}
