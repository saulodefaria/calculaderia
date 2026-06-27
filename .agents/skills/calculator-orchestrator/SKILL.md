---
name: calculator-orchestrator
description: "Orchestrate the full Calculaderia tool agent workflow. Use when Codex should coordinate planner, creator, PR reviewer, tester, fix, and draft-PR steps for calculators or other ferramentas until a tool is complete, reviewed, validated, and published as a PR or a blocker is documented."
---

# Calculaderia Tool Orchestrator

Use this skill to run the end-to-end tool workflow through subagents.

This skill keeps the legacy `$calculator-orchestrator` name for compatibility, but it now coordinates any Calculaderia ferramenta. Use one unified workflow; calculators are a specialized branch with extra source/formula validation.

Use `$saulo-pr-review` for the post-creator review gate. Use `$create-pr` only after review fixes and tester validation pass, the final changes are committed, and the branch is ready to push.

## Backlog Database Coordination

The local Postgres `agent_backlog` schema is the source of truth for calculator and non-calculator automation backlog state. Do not select work from `docs/tool-backlog.md` or `docs/calculator-backlog.md`; those markdown files are archived seed snapshots only.

Before spawning the planner, claim exactly one row:

```bash
if [ -f .env ]; then set -a; source .env; set +a; fi
psql "$AGENT_BACKLOG_DATABASE_URL" \
  -v kind=<tool|calculator> \
  -v actor="${CODEX_THREAD_ID:-manual}" \
  -v ttl_hours=36 \
  -f scripts/backlog/claim_next.sql
```

Use `kind=tool` for non-calculator ferramentas and `kind=calculator` for calculators. If the result has `ok: false`, stop and report that there is no eligible unclaimed item for this run.

Treat the returned `item.slug`, `item.rank`, `item.targetRoute`, `item.planPath`, and `item.branch` as authoritative. Do not override them with a fresh local backlog or memory choice. Pass the claimed item to the planner and require it to plan only that row.

Update DB state during the workflow:

- After a buildable `new` or `enhancement` plan, run `scripts/backlog/mark_planned.sql`.
- Before review, run `scripts/backlog/set_stage.sql` with `stage=review`.
- Before tester validation, run `scripts/backlog/set_stage.sql` with `stage=testing`.
- After tester validation passes, run `scripts/backlog/set_stage.sql` with `stage=verified`.
- If the planner rejects, merges, or blocks the item, run `mark_rejected_or_merged.sql` or `mark_blocked.sql`.
- If review, tester, or PR creation stops on an unresolved blocker, run `mark_blocked.sql` with the concrete blocker or retry command.
- After the draft PR URL is recorded in the plan, run `mark_done.sql` with the final route, plan path, done ref, and PR URL.

## Model Policy

Follow the active subagent tool policy. When the full repo workflow explicitly calls for high-rigor agents and policy permits, use:

- `model: "gpt-5.5"`
- `reasoning_effort: "xhigh"`

Otherwise inherit the parent model and reasoning settings. If the subagent tool is unavailable, report the blocker instead of pretending orchestration happened.

## Workflow

1. Claim an item from the backlog database as described above. Then spawn a planner worker with `$calculator-planner`. Ownership: the selected plan file under `docs/tool-plans/<slug>.md` or `docs/calculator-plans/<slug>.md`, plus read-only app/overlap inspection. It writes or updates the plan and must not edit app code.
2. Review the planner result. Stop if the decision is `reject`, `merge` without implementation scope, or `blocked`.
3. Spawn a creator worker with `$calculator-creator`. Ownership: the planned implementation files, matching unit/URL tests, translations, route files, and plan/backlog implementation notes. Tell the worker it is not alone in the codebase and must not revert unrelated edits.
4. Review creator changes and run any quick local checks needed before the PR-review gate.
5. Spawn a reviewer worker with `$saulo-pr-review`. Ownership: read-only review of the current branch diff and plan contract. Ask for copy-paste-ready findings, but also require a concise severity summary grouped as `blocking`, `issue`, `security`, `test-gap`, `question`, `suggestion`, and `nit`.
6. Triage reviewer findings before tester validation:
   - Send `blocking`, `issue`, `security`, and material `test-gap` findings back to a creator/fix worker using `$calculator-creator` context and the smallest relevant owner files.
   - Resolve `question` findings from the plan/repo when possible; if author intent is genuinely required, document the blocker and stop.
   - Apply `suggestion` and `nit` findings only when they are low-risk, consistent with the plan, and do not widen scope.
   - After fixes, rerun targeted checks for the changed surface and repeat the reviewer gate once when substantial code changed.
7. Spawn a tester worker with `$calculator-tester` only after the reviewer gate has no unresolved blocking, issue, security, or material test-gap findings. Ownership: browser validation notes and `tests/e2e` changes only, unless a fix is explicitly delegated later.
8. If tester finds failures, spawn a fix worker using the same model policy. Give it the smallest failing scope and exact owner files. Then rerun tester or targeted validation. If the fix changes production behavior materially, rerun the reviewer gate before finalizing.
9. Mark the plan `verified` and DB item `Done` only after implementation, review fixes, and tester validation pass. If a commit or PR exists, put it in the DB `done_ref`; otherwise record the route and validation summary.
10. Prepare the branch for PR creation: inspect `git status`, confirm only intended files are included, create or stay on a dedicated `codex/` branch when needed, stage the intended files, and commit using the repo's commit style. Do not add `Co-Authored-By` lines.
11. Use `$create-pr` to push the branch when needed and create a draft GitHub PR. Record the PR URL in the plan and DB item when available.

## Delegation Rules

- Do not run creator before the planner has produced a buildable plan.
- Do not run reviewer before creator has implementation changes to inspect.
- Do not run tester before the reviewer gate has passed or all required review fixes have been delegated and completed.
- Do not use `$create-pr` before validation passes and the intended changes are committed.
- Keep write ownership disjoint between simultaneous agents; this workflow is usually sequential because each step gates the next.
- Pass only the needed plan path, slug, acceptance criteria, review findings, validation failures, and ownership to each agent.
- Close subagents when their role is complete.

## Review Gate

Treat the reviewer as independent fresh eyes, not as the planner. The planner owns product/design intent before implementation; the reviewer owns post-implementation risk, correctness, maintainability, security, and missing tests.

When prompting the reviewer, include:

- The current branch name and base branch if known.
- The plan path and target route.
- A request to review the branch diff against the plan.
- A reminder that review output should follow `$saulo-pr-review` formatting.

When sending fixes back to creator, include:

- The exact reviewer findings to address.
- The files or components likely owned by the fix.
- The checks that must be rerun after the fix.
- A reminder to preserve unrelated user edits and keep plan scope unchanged unless the finding exposes a real plan bug.

## PR Creation

Create the draft PR only after the final validation state is known. Before invoking `$create-pr`:

- Ensure the work is on a dedicated branch, preferably with the `codex/` prefix unless the user requested another branch.
- Inspect `git status` and `git diff HEAD` so unrelated local changes are not staged.
- Stage only intended workflow files.
- Commit the final changes.
- Update plan and DB status before the commit when possible so the PR includes the final references.

If PR creation fails because GitHub authentication, remote configuration, or network access is unavailable, leave the branch committed locally and report the exact retry command or blocker.

## Final Report

Report:

- Selected backlog item and plan path.
- Decision and target route.
- Implementation summary and files touched.
- PR review summary and which findings were fixed or deferred.
- Validation commands, browser coverage, and pass/fail result.
- DB item status/stage, plan final status, and draft PR URL when created.
- Any blocker or residual risk that remains.
