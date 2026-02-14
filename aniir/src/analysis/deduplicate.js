function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text) {
  const value = normalize(text);
  if (!value) return new Set();
  return new Set(value.split(" "));
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateIssue(incoming, knownIssues) {
  const known = Array.isArray(knownIssues) ? knownIssues : [];

  const exactId = known.find((item) => item.issueId && item.issueId === incoming?.issueId);
  if (exactId) {
    return { match: true, method: "exact-id", reference: exactId };
  }

  const exactFingerprint = known.find(
    (item) => item.fingerprint && incoming?.fingerprint && item.fingerprint === incoming.fingerprint
  );
  if (exactFingerprint) {
    return { match: true, method: "fingerprint", reference: exactFingerprint };
  }

  const incomingTokens = tokens(incoming?.title ?? incoming?.message ?? "");
  let best = null;
  let bestScore = 0;
  for (const item of known) {
    const score = jaccard(incomingTokens, tokens(item.title ?? item.message ?? ""));
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore >= 0.3) {
    return {
      match: true,
      method: "semantic",
      score: Number(bestScore.toFixed(3)),
      reference: best
    };
  }

  return { match: false, method: "none" };
}
