import { FinalStates } from "./types.js";
import { memoryLookupStep } from "./steps/memory-lookup.js";

export async function runPipeline(incident, deps = {}) {
  const known = await memoryLookupStep(deps.memoryLookup, incident?.fingerprint);
  if (known?.status === "ignored") {
    return { finalState: FinalStates.IGNORED, reason: "known-ignored" };
  }

  const filterResult = deps.classifyIncident
    ? await deps.classifyIncident(incident)
    : { decision: "investigate" };

  if (filterResult.decision === "ignore") {
    return { finalState: FinalStates.IGNORED, reason: "noise-filter" };
  }
  if (filterResult.decision === "defer") {
    return { finalState: FinalStates.DEFERRED, reason: "insufficient-signal" };
  }

  const fixResult = deps.investigateFix ? await deps.investigateFix(incident) : null;
  const verifyResult = deps.verify ? await deps.verify({ incident, fixResult }) : { ok: true };
  if (!verifyResult.ok) {
    return { finalState: FinalStates.NEEDS_HUMAN, reason: "verification-failed", verifyResult };
  }

  if (deps.openPullRequest) {
    const pr = await deps.openPullRequest({ incident, fixResult, verifyResult });
    return { finalState: FinalStates.PR_OPENED, pr };
  }

  return { finalState: FinalStates.VERIFIED };
}
