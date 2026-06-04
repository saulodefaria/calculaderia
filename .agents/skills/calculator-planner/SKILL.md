---
name: calculator-planner
description: "Plan new or enhanced Calculaderia tool work, including calculators and other ferramentas. Use when Codex needs to choose the next backlog idea, check overlap with existing tools, research formulas/sources when needed, and write a complete Markdown design plan before implementation."
---

# Calculaderia Tool Planner

Use this skill to turn one backlog row into a written tool design plan. The planner decides whether to build a new route, enhance an existing tool, merge the idea into another plan, or reject/defer it.

This skill keeps the legacy `$calculator-planner` name for compatibility, but it now plans any Calculaderia ferramenta. Treat calculators as one specialized family with stricter formula, source, save, and disclaimer requirements.

## Inputs

- Non-calculator backlog: `docs/tool-backlog.md`.
- Non-calculator plan output directory: `docs/tool-plans`.
- Non-calculator plan template: `docs/tool-plans/_template.md`.
- Calculator backlog: `docs/calculator-backlog.md`.
- Calculator plan output directory: `docs/calculator-plans`.
- Calculator plan template: `docs/calculator-plans/_template.md`.

If the user names a slug, keyword, rank, family, or existing plan, use that. If they ask for a calculator, use the calculator backlog. If they ask for a general/non-calculator ferramenta, use the tool backlog. If no family is specified, prefer the highest-ranked `Ready` row in `docs/tool-backlog.md`; if no `Ready` rows exist there, choose the highest-ranked `Backlog` row.

## Workflow

1. Read the backlog row, preserving rank, status, slug, keyword cluster, score, idea type, notes, and done reference.
2. Check overlap before planning:
   - Existing routes under `app/[locale]`, especially the target family path.
   - Tool families, categories, and registry entries in `lib/constants.ts`.
   - Non-calculator logic modules in `lib/tools`.
   - Calculator logic modules in `lib/calculators` when the idea is a calculator.
   - URL state helpers in `components/tools/url-state.ts` and `lib/url-state` as applicable.
   - Components under `components/tools` and `components/calculators`.
   - Translation keys in `messages/*.json`.
   - Prior plans in `docs/tool-plans` and `docs/calculator-plans`.
   - Text search for the primary keyword, slug, and cluster keywords.
3. Choose one decision: `new`, `enhancement`, `merge`, or `reject`.
4. Define the full tool intent: audience, job-to-be-done, scope, non-goals, inputs, outputs, default values, validation rules, result explanations, URL params, share behavior, save/favorites behavior, and related tools.
5. Decide whether the backlog family/category maps to an existing `ToolFamilyId`/`ToolCategoryId` or needs a new family/category in `lib/constants.ts`. Proposed backlog families such as `texto`, `dev`, `cores`, `conversores`, `imagens`, and `documentos` are planning hints, not automatic registry IDs.
6. Define logic and data assumptions. For calculators and for labor, tax, benefits, legal, government-program, public-rate, check-digit, security, file-processing, or table-driven tools, research current authoritative sources and record source links, access dates, rule/table dates, limitations, and freshness risk.
7. Write or update the correct plan file using the correct template. Use the backlog slug unless the similarity check proves a different target route is better.

## Plan Requirements

Every plan must include:

- Backlog row summary and selected decision.
- Similarity check findings and why the target route is right.
- User intent and tool scope.
- Inputs, outputs, defaults, validation, and URL state.
- Logic or formula contract, source links, source dates, and source limitations when applicable.
- UI/content outline, SEO cluster, FAQ/disclaimer/privacy guidance, and related links.
- Translation guidance for `pt-br`, `en`, and `es`.
- Creator implementation checklist.
- Unit, URL-state, e2e, browser, lint, and build validation expectations.

## Rules

- Do not edit app code.
- Do not mark the backlog row `In Progress`; the creator does that when implementation starts.
- If Ubersuggest metrics are missing, keep status as `Backlog` unless the user explicitly approves editorial prioritization.
- If official sources are required but unavailable or contradictory, write a `decision: "reject"` or `status: "blocked"` plan that explains the blocker.
- Update an existing plan instead of creating duplicates for the same slug/target route.
- Prefer precise, sourced estimates over broad legal, tax, credit, investment, security, or document-validity advice.
