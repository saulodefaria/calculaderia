---
name: calculator-creator
description: "Implement Calculaderia tools from Markdown plans, including calculators and other ferramentas. Use when Codex needs to write tool logic, URL state, UI, translations, SEO, unit tests, e2e hooks, and backlog/plan status updates from an approved planner spec."
---

# Calculaderia Tool Creator

Use this skill to implement exactly one tool plan. The plan is the contract; do not widen scope without updating the plan first.

This skill keeps the legacy `$calculator-creator` name for compatibility, but it now implements any Calculaderia ferramenta. Calculators remain the heavyweight branch; most non-calculator tools should be smaller, client-side, privacy-preserving utilities.

## Inputs

- Plan directories: `docs/tool-plans` and `docs/calculator-plans`.
- If the user provides a plan path or slug, use it.
- If no plan is named, choose the most recently modified non-template plan with `status: "planned"` or `status: "in_progress"`, preferring `docs/tool-plans` for non-calculator requests and `docs/calculator-plans` for calculator requests.
- If the orchestrator provides PR-review findings, treat them as a review-fix handoff for the existing implementation. Address only the accepted findings and preserve the original plan scope unless the orchestrator explicitly approves a plan update.

Read these references when useful:

- `references/repo-patterns.md` for implementation, UI, SEO, translation, and backlog rules.
- `references/unit-url-tests.md` for Vitest and URL-state coverage.

## Workflow

1. Read the selected plan and confirm it has a buildable decision: `new` or `enhancement`.
2. If the plan is missing required logic/formulas, source links for sensitive tools, target route, inputs, outputs, validation rules, or privacy boundaries, update the plan with the blocker and stop.
3. Before editing app code, update the matching backlog row to `In Progress` and set the plan status to `in_progress`.
4. Implement only the planned behavior using existing repo patterns.
5. Add or update tests while implementing.
6. Run targeted unit/URL-state tests first, then the broader relevant checks from the plan.
7. When working from review findings, update the implementation and tests needed for those findings, then rerun the targeted checks named by the orchestrator or implied by the touched surface.
8. Leave the backlog as `In Progress` after implementation unless tester validation has already passed. Mark `Done` only after browser/e2e validation passes, and include the route plus commit/PR reference when available.

## Implementation Surface

New non-calculator tools usually touch:

- Pure logic in an existing `lib/tools/<domain>.ts` module, or a new focused module only when the family is new.
- Unit tests beside that module, such as `lib/tools/<domain>.test.ts`.
- UI in `components/tools/<family>/<tool>-client.tsx`.
- A route at `app/[locale]/<family>/<slug>/page.tsx` that wraps the client in `ToolPageLayout`.
- `lib/constants.ts` for the tool, family, category, icon, route, ranks, `stateMode`, and `seoApplicationCategory`.
- `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` in the `tools`, `toolFamilies`, and `toolCategories` namespaces.
- `tests/e2e` when the plan asks for route/share/navigation coverage.

Calculator implementations usually touch:

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
- Keep non-calculator parsing, generation, validation, encoding, conversion, and formatting logic deterministic and isolated from UI.
- Preserve explicit rounding, rate conversion, and date/table assumptions in code and tests.
- Use official-source dates in comments or SEO copy when they affect results.
- Match existing page structure: server page, localized metadata, `ToolPageLayout` for non-calculators or the established calculator layout for calculators, static SEO sections, related links, disclaimer, and FAQ when useful.
- Keep form controls accessible with stable `id` values for Playwright.
- Include share behavior through existing `ShareButton` and compact URL params. Include `SaveButton` only when the plan explicitly calls for favorites, currently mostly calculator simulations.
- Do not claim final legal, tax, credit, investment, security, document-validity, or official-government advice.

## Handoff

Before finishing, update the plan with:

- Files changed.
- Validation commands and results.
- PR-review findings addressed, if this was a review-fix handoff.
- Remaining tester focus areas.
- Backlog status and why it is still `In Progress` or ready for `Done`.
