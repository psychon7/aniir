# ERP Production Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace placeholder paths and harden Aniir into a safe pull-sync automation for ERP with real PR operations and idempotent gating.

**Architecture:** Keep pull-based Sentry ingestion, but route issues through dedup/filter/severity/verify gates and a real GitHub API client before opening PRs. Enforce unattended CI mode to `openai_api` and persist processed issue state.

**Tech Stack:** Node.js ESM, built-in `fetch`, `node:test`, existing Aniir pipeline modules.

---

### Task 1: Real GitHub API Client for PR Path

**Files:**
- Modify: `src/integrations/github/client.js`
- Modify: `src/commands/run-incident.js`
- Create: `tests/github-client.test.js`
- Modify: `tests/run-incident.e2e.test.js`

**Step 1: Write failing tests**
- Test branch ensure + incident artifact commit + PR creation flow.
- Test idempotent handling when PR already exists.
- Test `runIncident` passes fix metadata into PR preparation.

**Step 2: Run test to verify it fails**
Run: `npm test -- tests/github-client.test.js tests/run-incident.e2e.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Implement real API operations via `fetch`.
- Add `prepareIncidentBranch` in GitHub client.
- Invoke prepare step from `runIncident` before PR create.

**Step 4: Re-run tests**
Run: `npm test -- tests/github-client.test.js tests/run-incident.e2e.test.js`
Expected: PASS.

### Task 2: Sync Gating + Idempotency

**Files:**
- Create: `src/sync/state.js`
- Modify: `src/commands/run-sync.js`
- Create: `tests/sync-state.test.js`
- Modify: `tests/run-sync.test.js`

**Step 1: Write failing tests**
- Skip already processed issue IDs.
- Filter ignored/deferred issues.
- Run verification and skip PR when verification fails.
- Enforce max PRs per run.

**Step 2: Run test to verify it fails**
Run: `npm test -- tests/sync-state.test.js tests/run-sync.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Add persistent processed-issues store.
- Integrate classifier, severity, verification gates.
- Add limits and result reason fields.

**Step 4: Re-run tests**
Run: `npm test -- tests/sync-state.test.js tests/run-sync.test.js`
Expected: PASS.

### Task 3: CI Auth Policy Enforcement

**Files:**
- Modify: `src/config/schema.js`
- Modify: `src/commands/doctor.js`
- Modify: `src/cli.js`
- Modify: `templates/aniir.config.yaml`
- Modify: `tests/doctor.test.js`
- Modify: `tests/config-load.test.js`

**Step 1: Write failing tests**
- CI + subscription mode fails unless explicit override.
- CI + openai_api passes when key present.

**Step 2: Run test to verify it fails**
Run: `npm test -- tests/doctor.test.js tests/config-load.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Add config flag `ai.allow_subscription_in_ci: false`.
- Enforce in doctor and run-sync path.

**Step 4: Re-run tests**
Run: `npm test -- tests/doctor.test.js tests/config-load.test.js`
Expected: PASS.

### Task 4: End-to-End Verification + Docs

**Files:**
- Modify: `README.md`

**Step 1: Update docs**
- Document CI policy and operational checklist.

**Step 2: Run full verification**
Run:
- `npm test`
- `npm run lint`
- `npm run typecheck`
Expected: all pass.
