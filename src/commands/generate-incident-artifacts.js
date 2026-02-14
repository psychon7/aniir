import { buildIncidentReport } from "../incident/report.js";
import { buildSlackBugMessage } from "../notifications/slack.js";

export function generateIncidentArtifacts(input) {
  const report = buildIncidentReport({
    incident: input.incident,
    evidence: input.evidence,
    rootCause: input.rootCause
  });

  const slackMessage = buildSlackBugMessage({
    title: report.title,
    severity: report.severity,
    occurrences: input.occurrences ?? 0,
    bugUrl: input.bugUrl
  });

  return {
    report,
    slackMessage
  };
}
