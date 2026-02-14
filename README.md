# Aniir

Repo-agnostic self-healing incident runner for Sentry-triggered issues.

## What It Does

1. Receives Sentry issue payloads through webhook endpoint.
2. Filters noisy incidents before expensive investigation.
3. Checks local per-repo memory for known ignored/fixed fingerprints.
4. Runs investigator/fixer stage (Codex adapter).
5. Validates in `full` mode by default (`fix_only` is opt-in).
6. Opens an automatic pull request when pipeline succeeds.

## Start Webhook Server

```bash
cd aniir
npm run dev
```

Default URL: `http://localhost:8787/webhooks/sentry`

## Run Incident Command (Dry Run)

```bash
cd aniir
npm run incident -- --incident-id demo-1 --dry-run
```

## Repository Setup

1. Copy template:

```bash
cp aniir/templates/aniir.config.yaml aniir.config.yaml
```

2. Edit repo-specific values:
- `repo.id`
- `sentry.project`
- `commands.test`
- `playwright.command`

3. Keep `verification.mode: full` unless you explicitly want `fix_only`.
