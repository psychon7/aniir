# Aniir Self-Healing Agent Design

**Date:** 2026-02-14  
**Status:** Approved for planning

## Goal

Build a repository-agnostic, cloud-hosted self-healing workflow that:

- receives Sentry issue alerts automatically
- filters noisy/non-actionable incidents with a small model
- remembers known/ignored issue fingerprints per repository
- investigates and proposes a minimal fix with Codex SDK
- validates fixes (tests + Playwright by default)
- opens PRs automatically when validation passes

## Chosen Decisions

- Execution model: cloud always-on service
- Isolation model: pre-warmed runner pool with isolated workspace per incident
- Distribution: Node.js CLI package (`npm`) + lightweight config in each repo
- VCS support v1: GitHub only (provider abstraction for future GitLab/Bitbucket)
- Memory: repository-local state (`.aniir/`) managed on bot state branch
- Trigger: Sentry webhook
- PR mode: auto-PR
- Verification default: `full`; `fix_only` is explicit opt-in

## Architecture

1. `aniir-service` (always-on control plane)
- Accepts and verifies Sentry webhooks.
- Normalizes alerts into incident jobs.
- Applies initial policy routing.

2. `noise-filter` stage (small/fast model)
- Classifies incidents into `ignore`, `defer`, `investigate`.
- Uses error fingerprint, environment, release, frequency, regression signals.

3. `memory` stage (repo-local knowledge)
- Reads known fingerprints from `.aniir/known-issues.*`.
- Avoids duplicate work for ignored/known-fixed/noisy incidents.
- Writes outcomes after job completion.

4. `runner pool` (pre-warmed isolated workers)
- Workers stay hot for speed.
- Each incident gets isolated workspace + per-job tokens/secrets.
- No shared mutable workspace between incidents.

5. `investigator/fixer` stage (Codex SDK)
- Builds context from Sentry event, affected files, historical memory.
- Produces root-cause hypothesis and minimal patch.
- Generates tests when needed.

6. `verification` stage
- Runs configured tests and Playwright journeys.
- Enforces policy gates before PR creation.

7. `pr-publisher` stage
- Opens branch + PR automatically with evidence and traceability.

## Incident Lifecycle

1. Sentry emits webhook event.
2. Aniir verifies signature and enriches metadata.
3. Noise filter classifies actionability.
4. Memory lookup checks known ignored/duplicate/fixed fingerprints.
5. Actionable incident is queued and assigned to warm worker.
6. Investigator produces root cause + patch target.
7. Test intelligence:
- extend existing regression tests when possible
- generate minimal tests when missing
- optionally bootstrap harness if repo lacks a test framework
8. Fix applied.
9. Validation runs according to `verification.mode`.
10. If green, auto-PR is opened; else incident is marked `needs-human`.
11. Memory is updated with final outcome and fingerprint metadata.

## Repository Configuration

Each repo adds `aniir.config.yaml`:

```yaml
version: 1
repo:
  id: "axtech/erp2025"
  default_branch: "main"
  language: "typescript"
  framework: "react-fastapi"

sentry:
  project: "erp2025-prod"
  severity_threshold: "error"
  environment_rules:
    include: ["production"]
    exclude: ["local", "dev"]

filter:
  ignore_tags: ["bot-noise", "known-flaky"]
  min_event_rate_per_hour: 1
  ignore_error_patterns:
    - "ResizeObserver loop limit exceeded"

memory:
  path: ".aniir/known-issues.sqlite"
  state_branch: "aniir-state"

commands:
  lint: "npm run lint"
  typecheck: "npm run typecheck"
  test:
    - "npm test -- --runInBand"

playwright:
  enabled: true
  command: "npx playwright test"
  critical_specs:
    - "tests/auth-flow.api.spec.ts"
    - "tests/frontend-backend-connection.api.spec.ts"

verification:
  mode: "full" # full | fix_only
  allow_fix_only_for: ["docs", "low-risk-frontend"]
  force_full_for: ["auth", "payments", "database"]

pr:
  labels: ["aniir", "auto-fix"]
  draft: false
  reviewers: ["platform-team"]
  title_template: "fix(aniir): {{issue_title}} [{{incident_id}}]"

ai:
  profiles:
    filter: "small-fast"
    investigator: "reasoning-balanced"
    fixer: "coding-strong"
```

## Verification Policy

- Default mode is `full`.
- `full` requires:
- failing-then-passing regression test (existing or generated)
- configured test command(s)
- configured Playwright critical flow(s), if enabled
- `fix_only` skips test/playwright and opens PR after patch generation.
- `fix_only` is disabled by default and must be explicitly set in repo config.

## Memory Model

Stored in `.aniir/known-issues.sqlite` (or JSON fallback), keyed by:

- repo
- sentry fingerprint
- normalized stack signature
- status (`ignored`, `fixed`, `needs-human`, `flaky`)
- last seen timestamp and linked PR/commit

Memory is written on dedicated state branch (`aniir-state`) to keep main history clean.

## Safety and Guardrails

- Strict secret scoping: per-incident ephemeral credentials.
- Critical path enforcement via `force_full_for`.
- Hard deny rules for unsafe file scopes (configurable).
- Auto-PR only after policy gate success.
- Full job transcript and evidence references attached to PR.

## Scalability

- Horizontal scale via runner pool size and queue depth controls.
- Multi-repo tenancy by config onboarding only.
- Stateless control plane plus external queue/store for resilience.
- Provider abstraction for future git host expansion.

## Out of Scope (v1)

- GitLab/Bitbucket integrations.
- Autonomous production deploy/rollback.
- Cross-repo multi-service fix orchestration.
