export async function runIncident(input, deps) {
  const incidentId = input?.incidentId;
  if (!incidentId) throw new Error("incidentId is required");
  if (!deps?.pipeline || !deps?.github) throw new Error("pipeline and github deps are required");

  const result = await deps.pipeline(input);
  if (result.finalState === "pr_opened") {
    const base = input.baseBranch ?? "main";
    const head = `aniir/${incidentId}`;
    const bodyParts = [
      `Automated remediation for incident ${incidentId}`
    ];
    if (result.fixSummary) {
      bodyParts.push("", `Fix summary: ${result.fixSummary}`);
    }
    if (result.aiMode) {
      bodyParts.push(`AI mode: ${result.aiMode}`);
    }

    if (typeof deps.github.prepareIncidentBranch === "function") {
      await deps.github.prepareIncidentBranch({
        incidentId,
        base,
        head,
        content: [
          `# Incident ${incidentId}`,
          "",
          `- Final state: ${result.finalState}`,
          `- AI mode: ${result.aiMode ?? "unknown"}`,
          "",
          "## Fix Summary",
          "",
          result.fixSummary ?? "No summary provided."
        ].join("\n")
      });
    }

    await deps.github.createPullRequest({
      title: `fix(aniir): ${incidentId}`,
      body: bodyParts.join("\n"),
      head,
      base
    });
  }

  return result;
}
