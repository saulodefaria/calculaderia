---
name: calculator-creator
description: "Implement Calculaderia calculators from docs/calculator-plans Markdown plans. Use when Codex needs to write calculator logic, URL state, UI, translations, SEO, unit tests, e2e hooks, and backlog/plan status updates from an approved planner spec."
---

# Calculator Creator

Use this skill to implement exactly one calculator plan. The plan is the contract; do not widen scope without updating the plan first.

## Inputs

- Required plan directory: `docs/calculator-plans`.
- If the user provides a plan path or slug, use it.
- If no plan is named, choose the most recently modified non-template plan with `status: "planned"` or `status: "in_progress"`.

Read these references when useful:

- `references/repo-patterns.md` for implementation, UI, SEO, translation, and backlog rules.
- `references/unit-url-tests.md` for Vitest and URL-state coverage.

## Workflow

1. Read the selected plan and confirm it has a buildable decision: `new` or `enhancement`.
2. If the plan is missing required formulas, source links for sensitive calculators, target route, inputs, outputs, or validation rules, update the plan with the blocker and stop.
3. Before editing app code, update the matching backlog row to `In Progress` and set the plan status to `in_progress`.
4. Implement only the planned behavior using existing repo patterns.
5. Add or update tests while implementing.
6. Run targeted unit/URL-state tests first, then the broader relevant checks from the plan.
7. Leave the backlog as `In Progress` after implementation unless tester validation has already passed. Mark `Done` only after browser/e2e validation passes, and include the route plus commit/PR reference when available.

## Implementation Surface

New calculator implementations usually touch:

- `lib/calculators/<slug>.ts` and `lib/calculators/<slug>.test.ts`.
- `lib/url-state/<slug>.ts`, `lib/url-state/<slug>.test.ts`, and `lib/url-state/index.ts`.
- `components/calculators/<slug>/`.
- `app/[locale]/calculadoras/<slug>/page.tsx` and `layout.tsx`.
- `lib/constants.ts`.
- `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
- `tests/e2e` only when the plan asks creator to add harness coverage before tester runs it.

Enhancements should stay inside the existing route/module unless the plan explicitly approves a new page.

## Quality Rules

- Keep formulas deterministic and isolated in pure TypeScript.
- Preserve explicit rounding, rate conversion, and date/table assumptions in code and tests.
- Use official-source dates in comments or SEO copy when they affect results.
- Match existing page structure: server page, localized metadata, `Suspense` client calculator, static SEO sections, related links, disclaimer, and FAQ when useful.
- Keep form controls accessible with stable `id` values for Playwright.
- Include share and save behavior through existing `ShareButton`, `SaveButton`, and compact URL params.
- Do not claim final legal, tax, credit, or investment advice.

## Handoff

Before finishing, update the plan with:

- Files changed.
- Validation commands and results.
- Remaining tester focus areas.
- Backlog status and why it is still `In Progress` or ready for `Done`.
