# Aniir Self-Healing Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a repo-agnostic Node.js service + CLI that ingests Sentry alerts, filters noise, applies Codex-driven fixes, validates (default full), and auto-creates GitHub PRs.

**Architecture:** A long-running control service receives Sentry webhooks and dispatches incidents to a pre-warmed worker pool. Each incident runs in an isolated workspace through a pluggable pipeline (`filter -> memory -> investigate -> fix -> verify -> pr`) driven by `aniir.config.yaml`.

**Tech Stack:** Node.js 22+, TypeScript, Fastify (webhook server), Vitest, Zod, Pino, BullMQ (or in-memory queue for v1), simple-git, Octokit, Playwright CLI.

---

### Task 1: Bootstrap Aniir Package + Test Harness

**Files:**
- Create: `aniir/package.json`
- Create: `aniir/tsconfig.json`
- Create: `aniir/vitest.config.ts`
- Create: `aniir/src/index.ts`
- Test: `aniir/tests/smoke.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { health } from "../src/index";

describe("aniir smoke", () => {
  it("returns healthy status", () => {
    expect(health()).toEqual({ status: "ok" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/smoke.test.ts`
Expected: FAIL with module/function missing.

**Step 3: Write minimal implementation**

```ts
export function health() {
  return { status: "ok" as const };
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/smoke.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/package.json aniir/tsconfig.json aniir/vitest.config.ts aniir/src/index.ts aniir/tests/smoke.test.ts
git commit -m "feat(aniir): scaffold package and test harness"
```

### Task 2: Config Loader (`aniir.config.yaml`) with Verification Policy

**Files:**
- Create: `aniir/src/config/schema.ts`
- Create: `aniir/src/config/load.ts`
- Test: `aniir/tests/config-load.test.ts`
- Create: `aniir/tests/fixtures/aniir.config.valid.yaml`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config/load";

describe("config loader", () => {
  it("defaults verification mode to full", async () => {
    const cfg = await loadConfig("aniir/tests/fixtures/aniir.config.valid.yaml");
    expect(cfg.verification.mode).toBe("full");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/config-load.test.ts`
Expected: FAIL with `loadConfig` missing.

**Step 3: Write minimal implementation**

```ts
import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { z } from "zod";

const ConfigSchema = z.object({
  verification: z.object({
    mode: z.enum(["full", "fix_only"]).default("full"),
  }).default({ mode: "full" }),
});

export async function loadConfig(path: string) {
  const raw = await readFile(path, "utf8");
  const parsed = YAML.parse(raw);
  return ConfigSchema.parse(parsed);
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/config-load.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/config/schema.ts aniir/src/config/load.ts aniir/tests/config-load.test.ts aniir/tests/fixtures/aniir.config.valid.yaml
git commit -m "feat(aniir): add validated config loader with full-mode default"
```

### Task 3: Repository-Local Memory Store

**Files:**
- Create: `aniir/src/memory/store.ts`
- Test: `aniir/tests/memory-store.test.ts`
- Create: `aniir/tests/fixtures/known-issues.seed.json`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { MemoryStore } from "../src/memory/store";

describe("memory store", () => {
  it("returns ignored fingerprint entries", async () => {
    const store = new MemoryStore("aniir/tests/fixtures/known-issues.seed.json");
    const record = await store.findByFingerprint("fp_ignored_1");
    expect(record?.status).toBe("ignored");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/memory-store.test.ts`
Expected: FAIL with class missing.

**Step 3: Write minimal implementation**

```ts
export type MemoryStatus = "ignored" | "fixed" | "needs-human" | "flaky";
export type MemoryRecord = { fingerprint: string; status: MemoryStatus; lastSeenAt: string };

export class MemoryStore {
  constructor(private readonly filePath: string) {}
  async findByFingerprint(fingerprint: string): Promise<MemoryRecord | undefined> {
    const rows: MemoryRecord[] = JSON.parse(await (await import("node:fs/promises")).readFile(this.filePath, "utf8"));
    return rows.find((row) => row.fingerprint === fingerprint);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/memory-store.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/memory/store.ts aniir/tests/memory-store.test.ts aniir/tests/fixtures/known-issues.seed.json
git commit -m "feat(aniir): add local known-issue memory lookup"
```

### Task 4: Sentry Webhook Ingestion + Signature Verification

**Files:**
- Create: `aniir/src/sentry/verify.ts`
- Create: `aniir/src/sentry/normalize.ts`
- Create: `aniir/src/server/app.ts`
- Test: `aniir/tests/webhook-handler.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildApp } from "../src/server/app";

describe("sentry webhook", () => {
  it("rejects invalid signatures", async () => {
    const app = buildApp({ sentrySecret: "test-secret" });
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/sentry",
      headers: { "sentry-hook-signature": "bad" },
      payload: { action: "created" },
    });
    expect(res.statusCode).toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/webhook-handler.test.ts`
Expected: FAIL with missing app/route.

**Step 3: Write minimal implementation**

```ts
import Fastify from "fastify";

export function buildApp(opts: { sentrySecret: string }) {
  const app = Fastify();
  app.post("/webhooks/sentry", async (req, reply) => {
    const sig = req.headers["sentry-hook-signature"];
    if (sig !== opts.sentrySecret) return reply.code(401).send({ error: "invalid signature" });
    return reply.code(202).send({ accepted: true });
  });
  return app;
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/webhook-handler.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/sentry/verify.ts aniir/src/sentry/normalize.ts aniir/src/server/app.ts aniir/tests/webhook-handler.test.ts
git commit -m "feat(aniir): add sentry webhook ingestion and signature gate"
```

### Task 5: Noise Filter Classifier Stage

**Files:**
- Create: `aniir/src/filter/classifier.ts`
- Test: `aniir/tests/filter-classifier.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { classifyIncident } from "../src/filter/classifier";

describe("noise filter", () => {
  it("marks high-frequency resize observer errors as ignore", async () => {
    const outcome = await classifyIncident({
      title: "ResizeObserver loop limit exceeded",
      eventsPerHour: 30,
      severity: "warning",
    });
    expect(outcome.decision).toBe("ignore");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/filter-classifier.test.ts`
Expected: FAIL with function missing.

**Step 3: Write minimal implementation**

```ts
export type FilterDecision = "ignore" | "defer" | "investigate";
export async function classifyIncident(input: { title: string; eventsPerHour: number; severity: string }) {
  if (input.title.includes("ResizeObserver") && input.eventsPerHour > 5) return { decision: "ignore" as FilterDecision };
  return { decision: "investigate" as FilterDecision };
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/filter-classifier.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/filter/classifier.ts aniir/tests/filter-classifier.test.ts
git commit -m "feat(aniir): implement actionable-vs-noise filter stage"
```

### Task 6: Pipeline Engine (`filter -> memory -> investigate -> fix -> verify -> pr`)

**Files:**
- Create: `aniir/src/pipeline/types.ts`
- Create: `aniir/src/pipeline/engine.ts`
- Create: `aniir/src/pipeline/steps/memory-lookup.ts`
- Test: `aniir/tests/pipeline-engine.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { runPipeline } from "../src/pipeline/engine";

describe("pipeline engine", () => {
  it("short-circuits when memory says ignored", async () => {
    const result = await runPipeline({ fingerprint: "fp_ignored_1" }, {
      memoryLookup: async () => ({ status: "ignored" }),
    } as any);
    expect(result.finalState).toBe("ignored");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/pipeline-engine.test.ts`
Expected: FAIL with engine missing.

**Step 3: Write minimal implementation**

```ts
export async function runPipeline(input: { fingerprint: string }, deps: { memoryLookup: (f: string) => Promise<{ status: string } | null> }) {
  const known = await deps.memoryLookup(input.fingerprint);
  if (known?.status === "ignored") return { finalState: "ignored" as const };
  return { finalState: "investigate" as const };
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/pipeline-engine.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/pipeline/types.ts aniir/src/pipeline/engine.ts aniir/src/pipeline/steps/memory-lookup.ts aniir/tests/pipeline-engine.test.ts
git commit -m "feat(aniir): add pluggable incident pipeline engine"
```

### Task 7: Worker Pool and Isolated Workspace Runtime

**Files:**
- Create: `aniir/src/runner/pool.ts`
- Create: `aniir/src/runner/workspace.ts`
- Test: `aniir/tests/runner-pool.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { allocateWorkspace } from "../src/runner/workspace";

describe("workspace allocation", () => {
  it("creates unique workspace per incident", async () => {
    const a = await allocateWorkspace("inc-1");
    const b = await allocateWorkspace("inc-2");
    expect(a.path).not.toBe(b.path);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/runner-pool.test.ts`
Expected: FAIL with allocator missing.

**Step 3: Write minimal implementation**

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function allocateWorkspace(incidentId: string) {
  const path = await mkdtemp(join(tmpdir(), `aniir-${incidentId}-`));
  return { path };
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/runner-pool.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/runner/pool.ts aniir/src/runner/workspace.ts aniir/tests/runner-pool.test.ts
git commit -m "feat(aniir): add isolated workspace allocation for warm workers"
```

### Task 8: Codex Investigator/Fixer Adapter + Patch Application

**Files:**
- Create: `aniir/src/integrations/codex/client.ts`
- Create: `aniir/src/pipeline/steps/investigate-fix.ts`
- Test: `aniir/tests/investigate-fix.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { runInvestigateFix } from "../src/pipeline/steps/investigate-fix";

describe("investigate+fix", () => {
  it("returns patch metadata from codex adapter", async () => {
    const codex = { proposeFix: vi.fn().mockResolvedValue({ patch: "diff --git...", summary: "fix null guard" }) };
    const out = await runInvestigateFix({ issueTitle: "TypeError on login" }, codex as any);
    expect(out.summary).toContain("fix");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/investigate-fix.test.ts`
Expected: FAIL with step missing.

**Step 3: Write minimal implementation**

```ts
export async function runInvestigateFix(issue: { issueTitle: string }, codex: { proposeFix: (i: any) => Promise<{ patch: string; summary: string }> }) {
  return codex.proposeFix(issue);
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/investigate-fix.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/integrations/codex/client.ts aniir/src/pipeline/steps/investigate-fix.ts aniir/tests/investigate-fix.test.ts
git commit -m "feat(aniir): wire codex investigation and fix proposal adapter"
```

### Task 9: Verification Step (`full` default, `fix_only` opt-in)

**Files:**
- Create: `aniir/src/pipeline/steps/verify.ts`
- Create: `aniir/src/integrations/playwright/runner.ts`
- Test: `aniir/tests/verify-policy.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { shouldRunFullVerification } from "../src/pipeline/steps/verify";

describe("verification policy", () => {
  it("uses full mode when unspecified", () => {
    expect(shouldRunFullVerification({} as any)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/verify-policy.test.ts`
Expected: FAIL with function missing.

**Step 3: Write minimal implementation**

```ts
export function shouldRunFullVerification(config: { verification?: { mode?: "full" | "fix_only" } }) {
  return (config.verification?.mode ?? "full") === "full";
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/verify-policy.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/pipeline/steps/verify.ts aniir/src/integrations/playwright/runner.ts aniir/tests/verify-policy.test.ts
git commit -m "feat(aniir): enforce full-by-default verification policy"
```

### Task 10: GitHub PR Publisher + End-to-End Incident Command

**Files:**
- Create: `aniir/src/integrations/github/client.ts`
- Create: `aniir/src/cli.ts`
- Create: `aniir/src/commands/run-incident.ts`
- Test: `aniir/tests/run-incident.e2e.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { runIncident } from "../src/commands/run-incident";

describe("run incident", () => {
  it("opens PR when pipeline returns success", async () => {
    const github = { createPullRequest: vi.fn().mockResolvedValue({ number: 42 }) };
    const pipeline = vi.fn().mockResolvedValue({ finalState: "pr_opened" });
    await runIncident({ incidentId: "inc-1" } as any, { github, pipeline } as any);
    expect(github.createPullRequest).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/run-incident.e2e.test.ts`
Expected: FAIL with command missing.

**Step 3: Write minimal implementation**

```ts
export async function runIncident(input: { incidentId: string }, deps: { pipeline: (i: any) => Promise<{ finalState: string }>; github: { createPullRequest: (d: any) => Promise<any> } }) {
  const result = await deps.pipeline(input);
  if (result.finalState === "pr_opened") {
    await deps.github.createPullRequest({ title: `fix(aniir): ${input.incidentId}` });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/run-incident.e2e.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/src/integrations/github/client.ts aniir/src/cli.ts aniir/src/commands/run-incident.ts aniir/tests/run-incident.e2e.test.ts
git commit -m "feat(aniir): add incident command and auto-pr integration"
```

### Task 11: Documentation + Repo Onboarding Template

**Files:**
- Create: `aniir/README.md`
- Create: `aniir/templates/aniir.config.yaml`
- Modify: `README.md`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("template", () => {
  it("includes verification mode docs", () => {
    const content = readFileSync("aniir/templates/aniir.config.yaml", "utf8");
    expect(content).toContain("verification:");
    expect(content).toContain("mode: full");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix aniir test -- aniir/tests/template-config.test.ts`
Expected: FAIL with missing template file.

**Step 3: Write minimal implementation**

```yaml
version: 1
verification:
  mode: full
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix aniir test -- aniir/tests/template-config.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add aniir/README.md aniir/templates/aniir.config.yaml README.md aniir/tests/template-config.test.ts
git commit -m "docs(aniir): add onboarding and reusable repository template"
```

### Task 12: Final Verification and Hardening Pass

**Files:**
- Modify: `aniir/src/**` (small cleanup only)
- Modify: `aniir/tests/**` (small cleanup only)

**Step 1: Run full test suite**

Run: `npm --prefix aniir test`
Expected: all tests PASS.

**Step 2: Run lint/typecheck**

Run: `npm --prefix aniir run lint && npm --prefix aniir run typecheck`
Expected: no errors.

**Step 3: Smoke-run webhook server**

Run: `npm --prefix aniir run dev`
Expected: server starts and exposes `/webhooks/sentry`.

**Step 4: Validate incident command path**

Run: `npm --prefix aniir run incident -- --incident-id demo-1 --dry-run`
Expected: pipeline executes to completion with dry-run output.

**Step 5: Commit**

```bash
git add aniir
git commit -m "chore(aniir): finalize verification and hardening"
```

## Notes for Execution

- Apply `@test-driven-development` on every task.
- Apply `@verification-before-completion` before claiming task completion.
- Keep each commit scoped to one task.
- If queue or runner implementation grows, split Task 6/7 into sub-tasks in execution session.
