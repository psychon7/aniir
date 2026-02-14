const SEVERITY_EMOJI = {
  blocking: "🔴",
  annoying: "🟠",
  harmless: "🟢"
};

export function buildSlackBugMessage({ title, severity, occurrences, bugUrl }) {
  const level = String(severity ?? "annoying").toLowerCase();
  const emoji = SEVERITY_EMOJI[level] ?? "🟠";
  return [
    `${emoji} *${level.toUpperCase()}* bug detected`,
    `• Title: ${title ?? "Unknown issue"}`,
    `• Occurrences: ${occurrences ?? 0}`,
    `• Link: ${bugUrl ?? "n/a"}`
  ].join("\n");
}
