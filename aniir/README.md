# Aniir

Repo-agnostic self-healing incident runner for Sentry/Bugsnag triage and observability incident webhooks.

## What It Does

1. Receives error and incident payloads through webhook endpoints.
2. Filters noisy incidents before expensive investigation.
3. Checks local per-repo memory for known ignored/fixed fingerprints.
4. Deduplicates using exact ID, fingerprint, then semantic similarity.
5. Classifies severity (`blocking`, `annoying`, `harmless`) by impact.
6. Runs investigator/fixer stage (Codex adapter).
7. Validates in `full` mode by default (`fix_only` is opt-in).
8. Opens an automatic pull request when pipeline succeeds.

## Start Webhook Server

```bash
cd aniir
npm run dev
```

Default URL: `http://localhost:8787/webhooks/sentry`

Additional webhook endpoints:
- `/api/webhooks/pagerduty?tenant_id=<id>`
- `/api/webhooks/datadog?tenant_id=<id>`
- `/api/webhooks/grafana?tenant_id=<id>`
- `/api/webhooks/opsgenie?tenant_id=<id>`
- `/api/webhooks/incidentio?tenant_id=<id>`
- `/api/webhooks/signoz?tenant_id=<id>`

## Run Incident Command (Dry Run)

```bash
cd aniir
npm run incident -- --incident-id demo-1 --dry-run
```

Generate report + Slack-ready message from incident JSON:

```bash
cd aniir
npm run artifacts -- --input ./examples/incident.json
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
- `webhooks.secrets` for each platform
- `notifications.slack.channel`

3. Keep `verification.mode: full` unless you explicitly want `fix_only`.
