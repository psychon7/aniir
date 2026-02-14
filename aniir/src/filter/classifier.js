export async function classifyIncident(input) {
  const title = input?.title ?? "";
  const eventsPerHour = Number(input?.eventsPerHour ?? 0);
  const severity = input?.severity ?? "error";

  if (title.includes("ResizeObserver") && eventsPerHour >= 5 && severity !== "error") {
    return { decision: "ignore", reason: "known-noise-pattern" };
  }

  if (eventsPerHour === 0) {
    return { decision: "defer", reason: "insufficient-signal" };
  }

  return { decision: "investigate", reason: "actionable" };
}
