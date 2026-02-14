export async function runIncident(input, deps) {
  const incidentId = input?.incidentId;
  if (!incidentId) throw new Error("incidentId is required");
  if (!deps?.pipeline || !deps?.github) throw new Error("pipeline and github deps are required");

  const result = await deps.pipeline(input);
  if (result.finalState === "pr_opened") {
    await deps.github.createPullRequest({
      title: `fix(aniir): ${incidentId}`,
      body: `Automated remediation for incident ${incidentId}`,
      head: `aniir/${incidentId}`,
      base: input.baseBranch ?? "main"
    });
  }

  return result;
}
