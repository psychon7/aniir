import test from "node:test";
import assert from "node:assert/strict";
import { runSync } from "../src/commands/run-sync.js";

function createEphemeralStateStore() {
  const state = { processed: {} };
  return {
    async read() {
      return state;
    },
    isProcessed(current, issueId) {
      return Boolean(current?.processed?.[issueId]);
    },
    markProcessed(current, issueId, metadata) {
      current.processed[issueId] = metadata;
    },
    async write() {}
  };
}

test("runSync returns empty summary when sentry has no issues", async () => {
  const out = await runSync(
    {
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      sentryClient: { listIssues: async () => [] },
      codexClient: { proposeFix: async () => ({ summary: "unused" }) },
      githubClient: { createPullRequest: async () => ({ number: 1 }) },
      stateStore: createEphemeralStateStore(),
      memoryStore: { readAll: async () => [], upsert: async () => {} }
    }
  );

  assert.equal(out.processed, 0);
  assert.equal(out.prOpened, 0);
});

test("runSync processes actionable issues and opens PRs", async () => {
  const prCalls = [];
  const out = await runSync(
    {
      prompts: { investigate_fix: { user_instructions: "Fix {{issue_title}}" } },
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      sentryClient: {
        listIssues: async () => [
          { id: "s1", title: "Login fails with 500", culprit: "AuthController.login" }
        ]
      },
      codexClient: {
        mode: "codex_cloud_subscription",
        proposeFix: async (issue) => ({ summary: `Fix for ${issue.issueTitle}`, mode: "codex_cloud_subscription" })
      },
      githubClient: {
        createPullRequest: async (payload) => {
          prCalls.push(payload);
          return { number: 101 };
        }
      },
      stateStore: createEphemeralStateStore(),
      memoryStore: { readAll: async () => [], upsert: async () => {} }
    }
  );

  assert.equal(out.processed, 1);
  assert.equal(out.prOpened, 1);
  assert.equal(prCalls.length, 1);
  assert.match(out.results[0].fixSummary, /Fix for/);
});

test("runSync skips issues already processed in sync state", async () => {
  const out = await runSync(
    {
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      sentryClient: {
        listIssues: async () => [{ id: "s1", title: "Login fails with 500", culprit: "AuthController.login" }]
      },
      codexClient: { mode: "openai_api", proposeFix: async () => ({ summary: "unused", mode: "openai_api" }) },
      githubClient: { createPullRequest: async () => ({ number: 1 }) },
      stateStore: {
        async read() {
          return { processed: { s1: { reason: "opened-pr" } } };
        },
        isProcessed(state, issueId) {
          return Boolean(state.processed[issueId]);
        },
        markProcessed() {},
        async write() {}
      }
    }
  );

  assert.equal(out.prOpened, 0);
  assert.equal(out.results[0].reason, "already_processed");
});

test("runSync skips PR creation when verification fails", async () => {
  const out = await runSync(
    {
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      sentryClient: {
        listIssues: async () => [{ id: "s1", title: "Payment timeout", culprit: "PaymentService" }]
      },
      codexClient: { mode: "openai_api", proposeFix: async () => ({ summary: "Fix", mode: "openai_api" }) },
      githubClient: { createPullRequest: async () => ({ number: 1 }) },
      stateStore: createEphemeralStateStore(),
      memoryStore: { readAll: async () => [], upsert: async () => {} },
      verifyFn: async () => ({ ok: false, mode: "full", checks: [{ name: "tests", ok: false }] })
    }
  );

  assert.equal(out.prOpened, 0);
  assert.equal(out.results[0].reason, "verification_failed");
});

test("runSync enforces max PRs per run", async () => {
  let prCalls = 0;
  const out = await runSync(
    {
      sync: { max_prs_per_run: 1 },
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      sentryClient: {
        listIssues: async () => [
          { id: "s1", title: "Login fails with 500", culprit: "AuthController.login" },
          { id: "s2", title: "Payment timeout", culprit: "PaymentService" }
        ]
      },
      codexClient: { mode: "openai_api", proposeFix: async () => ({ summary: "Fix", mode: "openai_api" }) },
      githubClient: {
        createPullRequest: async () => {
          prCalls += 1;
          return { number: prCalls };
        }
      },
      stateStore: createEphemeralStateStore(),
      memoryStore: { readAll: async () => [], upsert: async () => {} }
    }
  );

  assert.equal(prCalls, 1);
  assert.equal(out.prOpened, 1);
  assert.equal(out.results[1].reason, "max_pr_limit");
});

test("runSync dryRun plans without calling codex or opening PR", async () => {
  let markCalls = 0;
  const out = await runSync(
    {
      sync: { max_prs_per_run: 3 },
      sentry: { org_slug: "axtech", project: "erp2025", status: "unresolved", limit: 10 }
    },
    {
      dryRun: true,
      sentryClient: {
        listIssues: async () => [{ id: "s1", title: "Aniir mock issue", culprit: "Test" }]
      },
      // codex/github intentionally omitted in dryRun
      stateStore: {
        async read() {
          return { processed: {} };
        },
        isProcessed() {
          return false;
        },
        markProcessed() {
          markCalls += 1;
        },
        async write() {}
      },
      memoryStore: { readAll: async () => [], upsert: async () => {} }
    }
  );

  assert.equal(out.dryRun, true);
  assert.equal(out.processed, 1);
  assert.equal(out.prOpened, 0);
  assert.equal(markCalls, 0);
  assert.equal(out.results[0].finalState, "dry_run");
  assert.equal(out.results[0].reason, "would_process");
});
