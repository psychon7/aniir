# Sonarly Core Parity (Sentry + Codex) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver webhook-free default operation with Sentry pull ingestion, bounded custom prompts, and fast setup/validation commands.

**Architecture:** Add a pull-based `run-sync` CLI command that queries Sentry issues, runs existing pipeline logic, and produces PR actions. Add prompt templating with bounded per-step overrides in config. Add `init` and `doctor` commands to reduce onboarding and maintenance overhead.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing Aniir modules.

---

### Task 1: Extend Config Schema for Pull Runtime + Prompt Overrides

**Files:**
- Modify: `src/config/schema.js`
- Modify: `templates/aniir.config.yaml`
- Test: `tests/config-load.test.js`
- Test: `tests/template-config.test.js`

**Step 1: Write failing tests**
- Add test expecting defaults for `sentry.org_slug`, `sentry.status`, `sentry.limit`, and `prompts.*.user_instructions`.
- Add test ensuring invalid prompt keys are rejected.
- Add template test asserting new fields exist.

**Step 2: Run tests to verify failures**
Run: `npm test -- tests/config-load.test.js tests/template-config.test.js`
Expected: FAIL for missing defaults/validation/template fields.

**Step 3: Implement minimal config/schema changes**
- Add defaults for pull sync fields and prompt sections.
- Add validation for prompt object shape and allowlisted steps.
- Fix YAML inline comment parsing risk by avoiding inline value comments in template.

**Step 4: Re-run targeted tests**
Run: `npm test -- tests/config-load.test.js tests/template-config.test.js`
Expected: PASS.

**Step 5: Commit**
`git add src/config/schema.js templates/aniir.config.yaml tests/config-load.test.js tests/template-config.test.js && git commit -m "feat(config): add sentry pull and bounded prompt defaults"`

### Task 2: Add Prompt Builder with Bounded Overrides

**Files:**
- Create: `src/prompts/builder.js`
- Create: `tests/prompt-builder.test.js`
- Modify: `src/pipeline/steps/investigate-fix.js`

**Step 1: Write failing tests**
- Prompt builder composes system + task + user instructions.
- Unknown variables are rejected.
- Investigate step passes generated prompt and variables to Codex adapter.

**Step 2: Run tests to verify failures**
Run: `npm test -- tests/prompt-builder.test.js tests/investigate-fix.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Add allowlisted variables and step templates.
- Add rendering with strict token replacement.
- Wire investigate step to use prompt builder.

**Step 4: Re-run tests**
Run: `npm test -- tests/prompt-builder.test.js tests/investigate-fix.test.js`
Expected: PASS.

**Step 5: Commit**
`git add src/prompts/builder.js src/pipeline/steps/investigate-fix.js tests/prompt-builder.test.js tests/investigate-fix.test.js && git commit -m "feat(prompts): add bounded per-step prompt composition"`

### Task 3: Add Sentry Pull Client + Sync Command

**Files:**
- Create: `src/integrations/sentry/client.js`
- Create: `src/commands/run-sync.js`
- Modify: `src/cli.js`
- Create: `tests/sentry-client.test.js`
- Create: `tests/run-sync.test.js`

**Step 1: Write failing tests**
- Sentry client builds expected request URL and headers.
- Sync command handles empty result and actionable results.
- CLI route `run-sync` validates required config/env.

**Step 2: Run tests to verify failures**
Run: `npm test -- tests/sentry-client.test.js tests/run-sync.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Implement Sentry API fetch with host/org/project/status/limit.
- Normalize returned issues into pipeline incident shape.
- Add `run-sync` command to process batch and emit summary JSON.

**Step 4: Re-run tests**
Run: `npm test -- tests/sentry-client.test.js tests/run-sync.test.js`
Expected: PASS.

**Step 5: Commit**
`git add src/integrations/sentry/client.js src/commands/run-sync.js src/cli.js tests/sentry-client.test.js tests/run-sync.test.js && git commit -m "feat(sync): add pull-based sentry ingestion pipeline"`

### Task 4: Add Setup + Doctor UX for Fast Onboarding

**Files:**
- Create: `src/commands/init-setup.js`
- Create: `src/commands/doctor.js`
- Create: `templates/github-workflow-aniir.yml`
- Modify: `src/cli.js`
- Create: `tests/doctor.test.js`
- Create: `tests/init-setup.test.js`

**Step 1: Write failing tests**
- `doctor` reports missing required env vars by mode.
- `init --preset sentry-codex` creates expected config/workflow artifacts.

**Step 2: Run tests to verify failures**
Run: `npm test -- tests/doctor.test.js tests/init-setup.test.js`
Expected: FAIL.

**Step 3: Minimal implementation**
- Add doctor checks for config load + env requirements.
- Add init command that scaffolds config and workflow file.

**Step 4: Re-run tests**
Run: `npm test -- tests/doctor.test.js tests/init-setup.test.js`
Expected: PASS.

**Step 5: Commit**
`git add src/commands/doctor.js src/commands/init-setup.js templates/github-workflow-aniir.yml src/cli.js tests/doctor.test.js tests/init-setup.test.js && git commit -m "feat(cli): add init and doctor for low-friction setup"`

### Task 5: Documentation + Full Verification

**Files:**
- Modify: `README.md`
- Modify: `package.json`

**Step 1: Update docs and scripts**
- Document no-webhook default flow and commands:
  - `npm run sync`
  - `npm run doctor`
  - `npm run init -- --preset sentry-codex`

**Step 2: Run full verification**
Run:
- `npm test`
- `npm run lint`
- `npm run typecheck`
Expected: all commands pass.

**Step 3: Commit**
`git add README.md package.json && git commit -m "docs: describe pull-based sentry codex workflow"`
