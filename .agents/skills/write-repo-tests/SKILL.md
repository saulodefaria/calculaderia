---
name: write-repo-tests
description: "Write or improve unit tests and lightweight component tests for the Calculaderia Next.js app. Use for calculator math, URL state, formatting, favorites storage, and React component behavior. For browser end-to-end coverage of calculator pages, use the companion test-calculator-e2e skill."
---

# Write Repo Tests

## Overview

Treat tests as part of the feature. In this repo, the highest-value tests are fast Vitest tests around financial calculations, URL state, formatting/parsing helpers, and small browser-adjacent utilities.

Use this skill for unit tests and narrowly scoped component tests. Use `test-calculator-e2e` when the task needs real browser navigation, calculator forms, share links, favorites, responsive layout, or full frontend flows.

## Current Repo State

- This is a single Next.js 16 / React 19 / TypeScript app using App Router and `next-intl`.
- `pnpm test` runs `vitest run`.
- There is no explicit `vitest.config.*` yet; existing tests rely on Vitest defaults.
- Existing tests are colocated `*.test.ts` files under:
  - `lib/calculators`
  - `lib/url-state`
  - `lib/utils`
  - `lib/favorites`
- The current test suite is mostly pure TypeScript and intentionally fast.
- There is no React Testing Library/jsdom component harness yet.
- There is no Playwright/e2e harness yet; browser e2e belongs in the companion skill.

## Commands

- Run all unit tests: `pnpm test`
- Run one test file: `pnpm test -- lib/calculators/financiamento.test.ts`
- Run a focused pattern: `pnpm test -- -t "calcularSAC"`
- Run lint after broader changes: `pnpm lint`
- Run build when touching Next pages, routing, metadata, or component wiring: `pnpm build`

Prefer the narrowest command while iterating, then run the broader relevant command before finishing.

## Testing Philosophy

- Test behavior, not implementation.
- Prefer pure unit tests before component tests.
- Keep fixtures small, typed, and realistic for Brazilian finance scenarios.
- Use fixed rates, fixed terms, fixed dates, and deterministic IDs.
- Prefer explicit assertions over snapshots.
- Use `toBeCloseTo` for money, rates, IRR, and amortization values affected by rounding.
- Cover the happy path, one invalid/failure path, and meaningful edge cases for each branchy module.
- Do not test React, Next.js, Radix, Recharts, or `next-intl` itself.

## Existing Test Style

- Import from Vitest with `import { describe, it, expect } from "vitest";`.
- Group tests by exported behavior, for example `describe("calcularSAC", ...)`.
- Use readable typed inputs:
  - `InputsFinanciamento`
  - `InputsConsorcio`
  - `InputsComparativo`
  - `InputsAluguelVsComprar`
  - `InputsJurosCompostos`
  - `InputsComparadorRendaFixa`
- Arrange inputs inline unless a tiny local builder removes meaningful repetition.
- Assert observable outputs: totals, first/last installments, array length, rankings, encoded params, decoded state, and null/error returns.
- Avoid asserting every row in a long schedule. Assert representative months, boundaries, and totals.

## Test Selection Rules

1. Start with pure calculator logic in `lib/calculators`.
2. Add URL state tests in `lib/url-state` whenever a calculator input can be shared or restored from the URL.
3. Add formatting/parsing tests in `lib/utils` when user input formats change.
4. Add favorites storage tests in `lib/favorites` when localStorage behavior changes.
5. Add component tests only when the behavior cannot be covered cleanly through pure helpers.
6. If a component test requires a harness that does not exist, either add the harness as part of the task or extract/test the pure behavior and call out the remaining component follow-up.

## Calculator Priorities

- `lib/calculators/financiamento.ts`
  - Cover SAC vs PRICE, down payment handling, zero/invalid inputs, property appreciation, rent cashflows, monthly/annual IRR, additional amortizations, and the distinction between reducing term (`prazo`) and reducing payment (`parcela`).
- `lib/calculators/consorcio.ts`
  - Cover admin fee math, annual correction steps in months 13/25, contemplation month, bid/lance behavior, premium/agio, rent after contemplation, additional amortizations, and IRR sign-change cases.
- `lib/calculators/comparativo.ts`
  - Cover parity with standalone financing/consortium calculators, investment-difference assumptions, winner selection, agio/lance propagation, and rent inputs.
- `lib/calculators/alugar-vs-comprar.ts`
  - Cover rent correction, invested monthly difference, extra contribution when rent is higher than payment, buy vs rent equity, winner selection, SAC/PRICE paths, and total paid.
- `lib/calculators/juros-compostos.ts`
  - Cover monthly vs annual periods, periodic contributions, zero interest, zero/large periods, period-by-period evolution, and final totals.
- `lib/calculators/tir.ts`
  - Cover strict cashflow parsing, pasted/list formats, validation for no sign change or too few flows, known IRR cases, negative IRR, and periodic-to-annual conversions.
- `lib/calculators/renda-fixa.ts`
  - Cover IR brackets, IOF days 1-29 vs day 30+, annual/daily conversion, Pre/CDI/IPCA+/Selic options, custody fees, real vs nominal return, ranking/ties, and evolution series.

## URL State Priorities

Every calculator with shareable state should have encode/decode/generate tests:

- Required fields are encoded.
- Optional fields are omitted when zero/default and restored to defaults on decode.
- Invalid required values return `null`.
- Invalid list entries are ignored only when that is the contract.
- Roundtrips preserve meaningful state.
- Generated share URLs use compact parameter names consistently.

Current compact params live in `lib/url-state/*.ts`; keep tests next to each module.

## Favorites And Browser-Adjacent Utilities

`lib/favorites/storage.test.ts` uses a simple in-memory `localStorage` mock. Keep that pattern for storage behavior:

- Reset storage in `beforeEach`.
- Cover corrupted JSON and invalid schemas.
- Cover duplicate detection by calculator id plus query string.
- Cover ordering, removal, clearing, and recovery after bad data.
- Do not use a real browser for these unit tests.

## Component Test Guidance

There is no component test harness yet. If a task needs one:

- Prefer React Testing Library plus user-event with a jsdom-compatible Vitest setup.
- Render components through the smallest provider surface needed.
- For `next-intl`, use real messages from `messages/pt-br.json` or a tiny message subset that matches the component.
- Mock `next/navigation` only at the boundary (`useSearchParams`, navigation calls).
- Mock browser APIs such as `ResizeObserver`, clipboard, and localStorage explicitly when a component depends on them.
- Query by role, label, button name, or visible text. Use DOM ids only when duplicate translated labels make a form ambiguous.
- Avoid snapshots and avoid asserting implementation-only state.

## Quality Bar

- Test names should read like specs.
- One test should protect one behavior.
- Do not chase coverage by testing trivial re-exports or generated framework files.
- Strengthen nearby gaps when touching an existing test file.
- For calculator math, include at least one scenario with business meaning, not just toy numbers.
- For rounding-sensitive assertions, assert the smallest number of representative values needed to prove the rule.

## Validation

Run the narrowest relevant test first. Before finishing a meaningful change, report:

- Which test command ran.
- Whether it passed.
- Any broader validation that was skipped and why.

For docs-only changes to skills, `pnpm test` is usually unnecessary unless the skill edits include runnable examples or package changes.

## Example Requests

- `Use $write-repo-tests to add coverage for lib/calculators/renda-fixa.ts.`
- `Use $write-repo-tests to update URL state tests for the financiamento share params.`
- `Use $write-repo-tests to add favorites storage tests for duplicate saved simulations.`
- `Use $write-repo-tests and extract a helper instead of testing a whole Next page.`
