# Sonarly Core Parity (Sentry + Codex) Design

## Goal
Achieve practical parity with Sonarly's core flow for ERP: ingest Sentry issues, triage/dedup/severity, run Codex-driven fix analysis, verify, and open PRs, without requiring hosted webhook infrastructure.

## Scope (Phase 1)
In scope:
- Pull-based Sentry ingestion (scheduled + manual run)
- Codex cloud-oriented fix pipeline with AI mode support
- Dedup + severity + verification gates
- PR opening flow and incident artifacts
- Configurable bounded prompt overrides per step
- Setup and health checks for fast onboarding

Out of scope:
- Slack/email delivery and digesting
- Multi-platform incident webhooks hardening beyond current baseline
- Central multi-tenant hosted control plane

## Architecture
### Runtime model
- Default runtime uses GitHub Actions schedule (`cron`) + manual dispatch.
- Aniir runs as an in-repo CLI process (`run-sync`), fetches recent Sentry issues, and processes each issue through the pipeline.
- No externally hosted webhook endpoint is required for default operation.

### Data flow
1. Workflow starts (schedule/manual).
2. Load `aniir.config.yaml` and env secrets.
3. Pull issues from Sentry API using org/project filter and status/limit window.
4. Normalize issue context, dedup, classify severity.
5. Generate Codex step prompts (system/task/default + bounded user overrides).
6. Run investigate/fix step and verification policy.
7. Open PRs for actionable issues.
8. Persist/emit state summary for idempotent subsequent runs.

### Prompting model
Prompt stack per step:
- Locked built-in system instructions (safety and workflow invariants)
- Built-in task template with allowlisted variables
- User-provided `user_instructions` from config (bounded override)

Planned configurable steps:
- `triage`
- `investigate_fix`
- `verify`
- `pr_body`

## Configuration strategy
### Split config for maintainability
- Repo-owned, shareable config (`aniir.config.yaml`) for non-secret behavior.
- Environment-owned secrets in GitHub Secrets:
  - `SENTRY_TOKEN`
  - `OPENAI_API_KEY` (or custom configured env var)
  - optional `SENTRY_API_HOST`

### Operational simplification
- `aniir init --preset sentry-codex` scaffolds config + GitHub workflow.
- `aniir doctor` validates config and required env variables.

## Reliability and scalability
- Concurrency lock in workflow to prevent overlapping runs.
- Pull window limit and status filters to cap work per run.
- Deterministic branch naming and idempotent dedup path reduce duplicate PRs.

## Security model
- No webhook exposure needed for default flow.
- Read-only Sentry token recommended for issue ingestion.
- API keys only from env, never from committed config.

## Success criteria
- New repo can be onboarded with one setup flow in under 15 minutes.
- Scheduled job pulls and processes Sentry issues without manual hosting.
- Custom prompt overrides are accepted only in safe bounded fields.
- Pipeline outputs actionable PR metadata for investigated issues.
