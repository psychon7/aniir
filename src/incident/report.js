function sortByTimestamp(entries) {
  const copy = [...(entries ?? [])];
  copy.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return copy;
}

export function buildIncidentReport({ incident, evidence = [], rootCause = "unknown root cause" }) {
  const timeline = sortByTimestamp(evidence).map((item) => ({
    timestamp: item.timestamp,
    message: item.message
  }));

  return {
    source: incident?.source ?? "unknown",
    incidentId: incident?.incidentId ?? "unknown",
    title: incident?.title ?? "Untitled incident",
    severity: incident?.severity ?? "error",
    service: incident?.service ?? "unknown",
    rootCause,
    timeline,
    suggestedActions: [
      "Add regression test for the failing path",
      "Deploy guarded fix behind a feature flag if risk is high",
      "Add alert threshold tuning to reduce repeated noise"
    ]
  };
}
