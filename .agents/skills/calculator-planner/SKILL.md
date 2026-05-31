---
name: calculator-planner
description: "Plan new or enhanced Calculaderia calculator work from docs/calculator-backlog.md. Use when Codex needs to choose the next calculator idea, check overlap with existing calculators, research formulas/sources, and write a complete Markdown design plan before implementation."
---

# Calculator Planner

Use this skill to turn one backlog row into a written calculator design plan. The planner decides whether to build a new route, enhance an existing calculator, merge the idea into another plan, or reject/defer it.

## Inputs

- Backlog: `docs/calculator-backlog.md`.
- Plan output directory: `docs/calculator-plans`.
- Plan template: `docs/calculator-plans/_template.md`.

If the user names a slug, keyword, rank, or existing plan, use that. Otherwise choose the highest-ranked `Ready` backlog row; if no `Ready` rows exist, choose the highest-ranked `Backlog` row.

## Workflow

1. Read the backlog row, preserving rank, status, slug, keyword cluster, score, idea type, notes, and done reference.
2. Check overlap before planning:
   - Existing routes under `app/[locale]/calculadoras`.
   - Calculator registry in `lib/constants.ts`.
   - Calculation modules in `lib/calculators`.
   - URL state modules in `lib/url-state`.
   - Translation keys in `messages/*.json`.
   - Prior plans in `docs/calculator-plans`.
   - Text search for the primary keyword, slug, and cluster keywords.
3. Choose one decision: `new`, `enhancement`, `merge`, or `reject`.
4. Define the full calculator intent: audience, job-to-be-done, scope, non-goals, inputs, outputs, default values, validation rules, result explanations, URL params, save/share behavior, and related calculators.
5. Define formulas and data assumptions. For labor, tax, benefits, legal, government-program, public-rate, or table-driven calculators, research current official sources and record source links, access dates, rule/table dates, limitations, and any freshness risk.
6. Write or update `docs/calculator-plans/<slug>.md` using the template. Use the backlog slug unless the similarity check proves a different target route is better.

## Plan Requirements

Every plan must include:

- Backlog row summary and selected decision.
- Similarity check findings and why the target route is right.
- User intent and calculator scope.
- Inputs, outputs, defaults, validation, and URL state.
- Formula contract, source links, source dates, and source limitations.
- UI/content outline, SEO cluster, FAQ/disclaimer guidance, and related links.
- Translation guidance for `pt-br`, `en`, and `es`.
- Creator implementation checklist.
- Unit, URL-state, e2e, browser, lint, and build validation expectations.

## Rules

- Do not edit app code.
- Do not mark the backlog row `In Progress`; the creator does that when implementation starts.
- If official sources are required but unavailable or contradictory, write a `decision: "reject"` or `status: "blocked"` plan that explains the blocker.
- Update an existing plan instead of creating duplicates for the same slug/target route.
- Prefer precise, sourced estimates over broad legal, tax, credit, or investment advice.
