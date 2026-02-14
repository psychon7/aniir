function text(input) {
  return `${input?.title ?? ""} ${input?.message ?? ""}`.toLowerCase();
}

export function classifySeverityLevel(input) {
  const value = text(input);
  const eventsPerHour = Number(input?.eventsPerHour ?? 1);

  const blockingSignals = [
    "login fails",
    "cannot sign in",
    "payment",
    "checkout",
    "500",
    "outage",
    "service down",
    "fatal"
  ];
  if (blockingSignals.some((signal) => value.includes(signal)) && eventsPerHour >= 1) {
    return "blocking";
  }

  const harmlessSignals = ["warning", "deprecated", "console", "minor"];
  if (harmlessSignals.some((signal) => value.includes(signal)) && eventsPerHour < 3) {
    return "harmless";
  }

  return "annoying";
}
