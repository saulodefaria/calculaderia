---
name: calculator-tester
description: "Verify Calculaderia tool implementations with a dev server, Browser/browser-use manual checks, and Playwright e2e coverage. Use when Codex needs to test routes, forms, visible results, share URLs, save behavior when planned, responsiveness, console errors, and acceptance criteria from a tool plan."
---

# Calculaderia Tool Tester

Use this skill after a tool has been implemented or when an existing tool needs browser-level validation.

This skill keeps the legacy `$calculator-tester` name for compatibility, but it now verifies calculators and non-calculator ferramentas.

## Inputs

- Tool plan in `docs/tool-plans/<slug>.md` or calculator plan in `docs/calculator-plans/<slug>.md`.
- Implemented route under `app/[locale]/<family>/<slug>`.
- Playwright harness in `tests/e2e`.

Read `references/e2e-checks.md` before adding or updating Playwright coverage.

## Workflow

1. Read the plan and implementation notes so validation matches the intended behavior.
2. Inspect the route, field ids, result labels, share params, and save behavior before running broad tests.
3. Start `pnpm dev` for Browser/browser-use checks unless Playwright's configured web server is better for the requested test.
4. Use Browser/browser-use to verify:
   - Route load and no redirect loop.
   - Main form can be completed with realistic inputs.
   - Results, tables, charts, or explanations appear as planned.
   - Share URL restores form state and results.
   - Save behavior works or redirects to sign-in as expected when the plan includes favorites.
   - Mobile viewport has no horizontal overflow or unusable controls.
   - Console has no hydration errors or uncaught exceptions.
5. Add or update Playwright tests only in `tests/e2e` when coverage is missing.
6. Run targeted e2e tests first, then broader e2e/lint/build checks when the plan requires them.
7. Update the plan with validation commands, browser coverage, failures, screenshots if useful, and pass/fail status.

## Boundaries

- Do not modify production tool code unless the orchestrator explicitly delegates a fix.
- Do not use e2e tests to prove every logic/formula branch; pure behavior belongs in `lib/tools/*.test.ts` or `lib/calculators/*.test.ts`.
- If validation fails, report exact reproduction steps and likely owner files.
- Stop any dev server you started unless the user asks to keep it running.
