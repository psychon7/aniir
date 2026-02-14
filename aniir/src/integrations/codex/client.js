export function createCodexClient({ model = "gpt-5-codex" } = {}) {
  return {
    model,
    async proposeFix(issueContext) {
      return {
        summary: `Proposed fix for: ${issueContext.issueTitle ?? "unknown issue"}`,
        patch: "",
        testsAdded: []
      };
    }
  };
}
