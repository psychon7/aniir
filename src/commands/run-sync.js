import { runIncident } from "./run-incident.js";
import { runInvestigateFix } from "../pipeline/steps/investigate-fix.js";
import { classifyIncident } from "../filter/classifier.js";
import { deduplicateIssue } from "../analysis/deduplicate.js";
import { classifySeverityLevel } from "../analysis/severity.js";
import { verifyIncident } from "../pipeline/steps/verify.js";
import { MemoryStore } from "../memory/store.js";
import { SyncStateStore } from "../sync/state.js";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

function toIncident(issue = {}) {
  const issueTitle = issue.title ?? "Unknown issue";
  return {
    incidentId: issue.id ?? issue.shortId ?? issueTitle.replace(/\s+/g, "-").toLowerCase(),
    issueTitle,
    title: issueTitle,
    message: issue.culprit ?? "",
    severity: issue.level ?? "error",
    fingerprint: issue.shortId ?? issue.id ?? issueTitle,
    eventsPerHour: Number(issue.count ?? 1)
  };
}

export async function runSync(
  config,
  {
    sentryClient,
    codexClient,
    githubClient,
    dryRun = false,
    logger = { info() {}, warn() {}, error() {} },
    stateStore: providedStateStore,
    memoryStore: providedMemoryStore,
    classifyIncidentFn: providedClassifyIncidentFn,
    deduplicateIssueFn: providedDeduplicateIssueFn,
    classifySeverityFn: providedClassifySeverityFn,
    verifyFn: providedVerifyFn
  } = {}
) {
  if (!sentryClient || typeof sentryClient.listIssues !== "function") {
    throw new Error("sentryClient with listIssues is required");
  }
  // In plan-only dry-run mode we intentionally avoid AI + PR creation.
  if (!dryRun) {
    if (!codexClient || typeof codexClient.proposeFix !== "function") {
      throw new Error("codexClient with proposeFix is required");
    }
    if (!githubClient || typeof githubClient.createPullRequest !== "function") {
      throw new Error("githubClient with createPullRequest is required");
    }
  }

  const stateStore = providedStateStore ?? new SyncStateStore(config?.sync?.state_path ?? ".aniir/sync-state.json");
  const memoryStore = providedMemoryStore ?? new MemoryStore(config?.memory?.path ?? ".aniir/known-issues.json");
  const classifyIncidentFn = providedClassifyIncidentFn ?? classifyIncident;
  const deduplicateIssueFn = providedDeduplicateIssueFn ?? deduplicateIssue;
  const classifySeverityFn = providedClassifySeverityFn ?? classifySeverityLevel;
  const verifyFn = providedVerifyFn ?? verifyIncident;
  const maxPrsPerRun = Number(config?.sync?.max_prs_per_run ?? 3);

  const sentryConfig = config?.sentry ?? {};
  const issues = await sentryClient.listIssues({
    orgSlug: sentryConfig.org_slug,
    project: sentryConfig.project,
    status: sentryConfig.status,
    limit: sentryConfig.limit
  });

  logger.info(
    `[sync] fetched ${issues.length} issues from Sentry (${sentryConfig.org_slug}/${sentryConfig.project}, status=${sentryConfig.status})`
  );

  const state = await stateStore.read();
  const knownIssues = typeof memoryStore.readAll === "function" ? await memoryStore.readAll() : [];
  const testCommands = Array.isArray(config?.commands?.test) ? config.commands.test : [];
  const testRunner =
    testCommands.length === 0
      ? undefined
      : async () => {
          for (const command of testCommands) {
            try {
              await exec(command, { cwd: process.cwd() });
            } catch (error) {
              return { ok: false, error: error?.message ?? `Test command failed: ${command}` };
            }
          }
          return { ok: true };
        };

  const results = [];
  let prOpened = 0;
  for (const issue of issues) {
    const issueId = issue?.id ?? issue?.shortId ?? issue?.title;
    logger.info(`[sync] issue ${issue?.shortId ?? issueId}: ${issue?.title ?? "(no title)"}`);

    if (stateStore.isProcessed(state, issueId)) {
      logger.info(`[sync] skip: already processed`);
      results.push({
        incidentId: issueId,
        finalState: "ignored",
        reason: "already_processed",
        fixSummary: ""
      });
      continue;
    }

    const incident = toIncident(issue);
    const filterResult = await classifyIncidentFn(incident);
    if (filterResult?.decision === "ignore" || filterResult?.decision === "defer") {
      logger.info(`[sync] skip: ${filterResult.decision} (classifier)`);
      if (!dryRun) stateStore.markProcessed(state, issueId, { reason: filterResult.decision });
      results.push({
        incidentId: incident.incidentId,
        finalState: "ignored",
        reason: filterResult.decision,
        fixSummary: ""
      });
      continue;
    }

    const dedup = deduplicateIssueFn(incident, knownIssues);
    if (dedup?.match) {
      logger.info(`[sync] skip: duplicate (${dedup.method ?? "unknown"})`);
      if (!dryRun) stateStore.markProcessed(state, issueId, { reason: `duplicate-${dedup.method ?? "unknown"}` });
      results.push({
        incidentId: incident.incidentId,
        finalState: "ignored",
        reason: "duplicate",
        fixSummary: ""
      });
      continue;
    }

    const severity = classifySeverityFn(incident);
    logger.info(`[sync] severity: ${severity}`);
    if (prOpened >= maxPrsPerRun) {
      logger.info(`[sync] defer: max PR limit reached (${maxPrsPerRun})`);
      results.push({
        incidentId: incident.incidentId,
        finalState: "deferred",
        reason: "max_pr_limit",
        severity,
        fixSummary: ""
      });
      continue;
    }

    if (dryRun) {
      logger.info(`[sync] dry-run: would investigate + verify + open PR`);
      results.push({
        incidentId: incident.incidentId,
        finalState: "dry_run",
        reason: "would_process",
        severity,
        fixSummary: ""
      });
      continue;
    }

    logger.info(`[sync] investigate_fix: start (Codex)`);
    const fix = await runInvestigateFix(incident, codexClient, config);
    logger.info(`[sync] investigate_fix: done`);

    logger.info(`[sync] verify: start`);
    const verifyResult = await verifyFn({ config, testRunner, playwrightCwd: process.cwd(), incident, fixResult: fix });
    if (!verifyResult?.ok) {
      logger.warn(`[sync] verify: failed`);
      results.push({
        incidentId: incident.incidentId,
        finalState: "needs_human",
        reason: "verification_failed",
        severity,
        fixSummary: fix?.summary ?? ""
      });
      continue;
    }

    logger.info(`[sync] verify: ok`);
    logger.info(`[sync] PR: opening`);

    const result = await runIncident(
      {
        incidentId: incident.incidentId,
        baseBranch: config?.repo?.default_branch ?? "main"
      },
      {
        pipeline: async () => {
          return {
            finalState: "pr_opened",
            fixSummary: fix.summary,
            aiMode: fix.mode
          };
        },
        github: githubClient
      }
    );

    if (result.finalState === "pr_opened") {
      prOpened += 1;
      stateStore.markProcessed(state, issueId, { reason: "opened_pr", severity });
      if (typeof memoryStore.upsert === "function") {
        await memoryStore.upsert({
          issueId: issueId,
          fingerprint: incident.fingerprint,
          title: incident.title,
          status: "opened_pr"
        });
      }
      logger.info(`[sync] PR: opened`);
    }

    results.push({
      incidentId: incident.incidentId,
      finalState: result.finalState,
      fixSummary: result.fixSummary ?? ""
    });
  }

  await stateStore.write(state);

  return {
    processed: issues.length,
    prOpened,
    dryRun,
    results
  };
}
