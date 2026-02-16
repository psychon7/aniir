# ERP Production Hardening Design

## Goal
Make Aniir operationally safe and actually deployable for ERP workloads by replacing placeholders, adding deterministic gating, and enforcing unattended-run auth policy.

## Decisions
- CI default auth mode is `openai_api`.
- Local/dev may use `codex_cloud_subscription` or `codex_local_subscription`.
- Pull sync remains the default ingestion model (no required webhook hosting).

## Gaps Being Closed
1. Real GitHub PR integration instead of placeholder return objects.
2. Sync safety gates (dedup/noise/severity/verification) before PR creation.
3. Sync idempotency (state cursor/history) to avoid repeated processing.
4. CI policy checks to prevent flaky unattended subscription mode usage.

## Architecture
### Sync pipeline
1. Pull Sentry issues by org/project/status/limit.
2. Ignore already-processed issue IDs from local sync state.
3. Convert issue to pipeline incident shape.
4. Apply classifier + dedup + severity.
5. Build prompt and run Codex investigation.
6. Run verification checks (`commands.test` and optional Playwright command).
7. If passing, create/update PR branch artifact and open PR.
8. Persist sync state + memory record.

### GitHub integration
- Use GitHub REST API directly with `fetch`.
- Ensure branch exists from base ref.
- Commit incident note artifact file on branch so PR has diff.
- Create PR, and treat already-open head PR as idempotent success.

### CI auth policy
- In CI (`env.CI=true`), reject non-`openai_api` mode unless explicit override flag in config.
- `doctor` should fail CI mode policy violations.

## Security and Ops
- Secrets remain env-only.
- No incoming webhook exposure needed for default operation.
- Deterministic summary JSON output from CLI for observability.
