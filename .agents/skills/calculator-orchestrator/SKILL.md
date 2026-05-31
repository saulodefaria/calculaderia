---
name: calculator-orchestrator
description: "Orchestrate the full Calculaderia calculator agent workflow. Use when Codex should coordinate planner, creator, tester, and fix subagents using gpt-5.5 with xhigh reasoning until a calculator is complete or a blocker is documented."
---

# Calculator Orchestrator

Use this skill to run the end-to-end calculator workflow through subagents.

## Required Model Policy

For every workflow subagent, call `multi_agent_v1.spawn_agent` with:

- `model: "gpt-5.5"`
- `reasoning_effort: "xhigh"`

If the subagent tool is unavailable, report the blocker instead of pretending orchestration happened.

## Workflow

1. Spawn a planner worker with `$calculator-planner`. Ownership: `docs/calculator-plans/<slug>.md` and read-only backlog/app inspection. It writes or updates the calculator plan and must not edit app code.
2. Review the planner result. Stop if the decision is `reject`, `merge` without implementation scope, or `blocked`.
3. Spawn a creator worker with `$calculator-creator`. Ownership: the planned implementation files, matching unit/URL tests, translations, route files, and plan/backlog implementation notes. Tell the worker it is not alone in the codebase and must not revert unrelated edits.
4. Review creator changes and run any quick local checks needed before browser validation.
5. Spawn a tester worker with `$calculator-tester`. Ownership: browser validation notes and `tests/e2e` changes only, unless a fix is explicitly delegated later.
6. If tester finds failures, spawn a fix worker with `gpt-5.5` and `xhigh`. Give it the smallest failing scope and exact owner files. Then rerun tester or targeted validation.
7. Mark the plan `verified` and backlog row `Done` only after implementation and tester validation pass. If a commit or PR exists, put it in `Done Ref`; otherwise record the route and validation summary.

## Delegation Rules

- Do not run creator before the planner has produced a buildable plan.
- Do not run tester before creator has a route or enhancement to verify.
- Keep write ownership disjoint between simultaneous agents; this workflow is usually sequential because each step gates the next.
- Pass only the needed plan path, slug, acceptance criteria, and ownership to each agent.
- Close subagents when their role is complete.

## Final Report

Report:

- Selected backlog item and plan path.
- Decision and target route.
- Implementation summary and files touched.
- Validation commands, browser coverage, and pass/fail result.
- Backlog/plan final status.
- Any blocker or residual risk that remains.
