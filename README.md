# Aniir

Repo-agnostic self-healing incident runner focused on Sentry + Codex.

## Default Operating Model (No Webhook Hosting)

Aniir now defaults to pull-based sync from Sentry so teams do not need to host incoming webhooks.

1. Scheduled GitHub Action or manual run starts sync.
2. Aniir pulls recent Sentry issues.
3. Issues are triaged and passed to Codex for fix proposals.
4. Verification runs and PRs are opened when successful.

Webhook endpoints are still available for advanced integrations, but they are optional.

## Quick Start

```bash
npm install
npm run init -- --preset sentry-codex
```

This scaffolds:
- `aniir.config.yaml`
- `.github/workflows/aniir.yml`

Then run environment checks:

```bash
npm run doctor
```

Run a sync:

```bash
npm run sync -- --dry-run
```

## Core Commands

- `npm run init -- --preset sentry-codex` scaffolds config + workflow.
- `npm run doctor` validates required config and env vars.
- `npm run sync` pulls Sentry issues and processes them in batch.
- `npm run incident -- --incident-id <id> --dry-run` runs single-incident flow.
- `npm run artifacts -- --input <incident-json-file>` generates report artifacts.

## Required Environment Variables

- `SENTRY_TOKEN` (or configured `sentry.api_token_env`)
- `GITHUB_TOKEN` for PR creation
- `OPENAI_API_KEY` only when `ai.mode: openai_api`

Optional:
- `SENTRY_API_HOST` for self-hosted Sentry API base URL

## Codex SDK + AI Modes

Aniir uses the official `@openai/codex-sdk` integration.

- `codex_cloud_subscription` (default): use Codex with ChatGPT subscription auth.
- `codex_local_subscription`: local interactive Codex subscription style.
- `openai_api`: explicit API-key mode via `OPENAI_API_KEY`.

In subscription modes, Aniir does not require `OPENAI_API_KEY`.

## CI Policy (ERP Recommended)

- In CI (`CI=true`), Aniir requires `ai.mode: openai_api` by default.
- To bypass this intentionally, set `ai.allow_subscription_in_ci: true`.
- `npm run doctor` fails if CI mode policy is violated.

This keeps unattended runs deterministic and avoids subscription-session surprises in GitHub Actions.

## Sync Safety Gates

`run-sync` applies safety checks before opening PRs:

- Skip already processed Sentry issue IDs (local sync state).
- Filter noise/insufficient-signal incidents.
- Deduplicate against known issue memory.
- Enforce verification checks before PR creation.
- Enforce `sync.max_prs_per_run` limit.

Sync state is stored at `.aniir/sync-state.json` by default.

## Config Notes

Edit these values in `aniir.config.yaml`:
- `repo.id`
- `sentry.org_slug`
- `sentry.project`
- `ai.mode`
- `ai.allow_subscription_in_ci` (default `false`)
- `prompts.*.user_instructions` for bounded per-step custom prompt guidance
- `sync.max_prs_per_run` (default `3`)

Keep `verification.mode: full` unless you explicitly want `fix_only`.
