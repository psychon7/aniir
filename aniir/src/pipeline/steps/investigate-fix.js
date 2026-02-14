export async function runInvestigateFix(issue, codexClient) {
  if (!codexClient || typeof codexClient.proposeFix !== "function") {
    throw new Error("Codex client with proposeFix is required");
  }
  return codexClient.proposeFix(issue);
}
