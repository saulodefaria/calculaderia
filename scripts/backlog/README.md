# Agent Backlog SQL

Local Codex automations use the `agent_backlog` Postgres schema as the source of
truth for calculator and non-calculator tool backlog selection. The markdown
backlog files are archived seed snapshots only.

Initialize locally:

```bash
docker compose up -d postgres
if [ -f .env ]; then set -a; source .env; set +a; fi
psql "$AGENT_BACKLOG_DATABASE_URL" -f scripts/backlog/001_schema.sql
psql "$AGENT_BACKLOG_DATABASE_URL" -f scripts/backlog/002_seed_from_markdown.sql
```

PS: 002_seed_from_markdown.sql is not in the repository, it is in the .local directory.

Claim the next item:

```bash
psql "$AGENT_BACKLOG_DATABASE_URL" \
  -v kind=tool \
  -v actor="${CODEX_THREAD_ID:-manual}" \
  -v ttl_hours=36 \
  -f scripts/backlog/claim_next.sql
```

Use `kind=calculator` for calculator automation. After claiming, update state
with `mark_planned.sql`, `set_stage.sql`, `mark_blocked.sql`,
`mark_rejected_or_merged.sql`, or `mark_done.sql`.
