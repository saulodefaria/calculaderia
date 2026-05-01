---
name: test-calculator-e2e
description: "Add, run, or improve browser end-to-end tests for Calculaderia calculator pages. Use for Playwright-style frontend flows that submit calculators, verify visible results, share URLs, saved favorites, restored state, responsive layouts, and locale routes."
---

# Test Calculator E2E

## Overview

Use this skill when the task needs a real browser. The goal is to protect user workflows across the calculator frontend: navigating to a calculator, filling the form, submitting it, seeing results, sharing/restoring state, saving favorites, and checking that the page works on desktop and mobile.

Do not use e2e tests to exhaustively prove financial formulas. The math belongs in `lib/calculators/*.test.ts`; e2e tests should prove that the UI is wired to that logic correctly.

## Current Repo State

- There is no Playwright setup in `package.json` yet.
- There is no `playwright.config.*` yet.
- There is no `tests/e2e` directory yet.
- If the user asks to add e2e tests, add the harness as part of the change instead of leaving orphaned test files.
- If the user only asks for guidance or a skill update, document the expected harness without changing app dependencies.

## Suggested Harness

When implementing e2e coverage, prefer Playwright:

- Add `@playwright/test` as a dev dependency.
- Add scripts:
  - `test:e2e`: `playwright test`
  - `test:e2e:ui`: `playwright test --ui`
- Add `playwright.config.ts`.
- Put specs under `tests/e2e`.
- Use `baseURL: "http://127.0.0.1:3000"`.
- Use Playwright `webServer` with `pnpm dev` for local e2e iteration.
- For CI-like verification, run `pnpm build` before e2e if the touched code could differ between dev and production.

Use fresh browser contexts or clear `localStorage` before tests so favorites do not leak between cases.

## Routes To Cover

Default locale `pt-br` is unprefixed:

- `/calculadoras/financiamento`
- `/calculadoras/consorcio`
- `/calculadoras/comparativo`
- `/calculadoras/alugar-vs-comprar`
- `/calculadoras/tir`
- `/calculadoras/juros-compostos`
- `/calculadoras/renda-fixa`
- `/favoritos`

Non-default locales are prefixed:

- `/en/...`
- `/es/...`

Run the full calculator happy-path matrix in the default locale. Add one or two locale smoke tests when routing, metadata, messages, or navigation changes.

## What Good E2E Tests Prove

- The calculator route loads without redirect loops or hydration errors.
- Required fields accept realistic user input and formatting does not block submission.
- The submit button produces a visible results section.
- The result summary, table, and chart areas appear when that calculator has them.
- Tabs/selects such as SAC/PRICE or period selectors change the scenario that is submitted.
- URL query params restore a shared calculation on page load.
- Share copies a URL with query params after a calculation.
- Save stores the current simulation and the favorites page can show it.
- Invalid user states block submission or show the intended validation message.
- Desktop and mobile viewports can complete the main flow without hidden controls or overlapped content.

## Selector Policy

- Prefer user-facing selectors: `getByRole`, `getByLabel`, and `getByText`.
- Use form field ids when labels are duplicated across sections, especially in `comparativo`.
- Do not rely on deep CSS class chains, table row indexes, or Recharts internals unless there is no better semantic hook.
- Add `data-testid` only when accessible selectors and stable ids are genuinely insufficient.
- If a component has unlabeled dynamic inputs, improve accessibility first when the task allows it.

Stable field ids currently include:

- Financiamento: `valorEmprestimo`, `valorEntrada`, `taxaJurosAnual`, `meses`, `correcaoAnualImovel`, `aluguelMensal`, `correcaoAnualAluguel`.
- Consorcio: `valorBem`, `meses`, `taxaAdministracaoTotal`, `correcaoAnual`, `valorLance`, `mesContemplacao`, `agio`, `aluguelMensal`, `correcaoAnualAluguel`.
- Comparativo: `valorImovel`, `valorEntrada`, `taxaJurosAnual`, `mesesFinanciamento`, `correcaoAnualImovel`, `mesesConsorcio`, `taxaAdministracaoTotal`, `correcaoAnualConsorcio`, `valorLance`, `mesContemplacao`, `agioCartaContemplada`, `aluguelMensal`, `correcaoAnualAluguel`, `taxaRendimentoAnual`.
- Alugar vs Comprar: `valorImovel`, `valorEntrada`, `taxaJurosAnual`, `meses`, `correcaoAnualImovel`, `aluguelMensal`, `correcaoAnualAluguel`, `taxaRendimentoAnual`.
- Juros Compostos: `valorInicial`, `taxaJuros`, `periodo`, `aportes`, `quantidadePeriodos`.
- Renda Fixa: `valor`, `prazoDias`, `preAnual`, `cdiPercent`, `ipcaMaisAnual`, `selicAnual`, `cdiAnual`, `ipcaAnual`, `custodiaAnual`.
- TIR: `periodo`; cashflow inputs are dynamic and currently need accessible labels or a carefully scoped locator.

## Input Formatting Notes

Currency inputs format on every change using Brazilian separators. In Playwright, either fill the formatted value directly, such as `500.000,00`, or use helper functions that type the amount as cents-aware digits.

Percent inputs accept comma decimals, for example `10,5`. Month/day/period fields accept digits only.

For selects built with Radix UI, interact through the trigger role and option text instead of trying to set the hidden value directly.

## Minimum Happy-Path Matrix

Cover one realistic scenario per calculator:

- Financiamento: fill loan amount, down payment, annual interest, term, property appreciation, choose SAC or PRICE, submit, expect financing summary and amortization table.
- Consorcio: fill asset value, term, admin fee, annual correction, contemplation month, optionally a bid, submit, expect consortium summary and installments table.
- Comparativo: fill property, financing, consortium, rent/investment assumptions, submit, expect comparison result and monthly evolution.
- Alugar vs Comprar: fill property, loan, rent, and investment assumptions, submit, expect buy/rent comparison result and table.
- TIR: enter or paste at least one negative and one positive cashflow, submit, expect TIR result and flow summary.
- Juros Compostos: fill initial amount, interest rate, period, contributions, and number of periods, submit, expect investment summary and graph.
- Renda Fixa: fill amount, term, Pre/CDI/IPCA+/Selic assumptions, market expectations, and fees, submit, expect best option and detailed comparison.

## Deeper Calculator Flows

Add these when touching the related feature:

- Financiamento additional amortization: after results load, add an extra amortization in the table and verify the summary switches to the additional-amortization scenario.
- Consorcio lance/agio validation: verify bid and premium cannot both be submitted when both are filled.
- Share URL restoration: submit a calculation, click share, read the clipboard URL, navigate to it in a new page, and assert the form/results restore.
- Favorites: submit a calculation, click save, navigate to `/favoritos`, and assert the saved simulation is present.
- Locale smoke: run a simple calculation in `/en/calculadoras/juros-compostos` or `/es/calculadoras/juros-compostos` after translation/routing changes.
- Mobile smoke: run one core calculator flow at a mobile viewport and verify the form, submit button, results, share, and save controls are usable.

## Browser Setup Details

- Grant clipboard permissions when testing the share button.
- Clear localStorage before each test unless testing persistence.
- Stub network only if a real external call is introduced; current calculator flows should run fully locally.
- Keep analytics out of assertions.
- Treat console errors as suspicious. Investigate hydration errors, uncaught exceptions, and failed resource loads.

Useful helper ideas:

- `fillCurrency(page, selector, value)` where `value` is already formatted, for example `500.000,00`.
- `fillPercent(page, selector, value)` for comma-decimal percentages.
- `submitAndExpect(page, buttonName, resultHeading)` for common form submit/result assertions.
- `expectNoHorizontalOverflow(page)` for responsive checks.

## Validation

When e2e tests are added or changed:

- Run the specific spec while iterating.
- Run `pnpm test:e2e` before finishing if the harness exists.
- Also run `pnpm test` when the e2e change touches calculator logic or URL-state helpers.
- Run `pnpm lint` when adding config, helpers, or TypeScript test files.

Report which browsers/viewports ran and whether any broader matrix was skipped.

## Example Requests

- `Use $test-calculator-e2e to add Playwright coverage for the financiamento calculator.`
- `Use $test-calculator-e2e to verify share links restore calculator state.`
- `Use $test-calculator-e2e to add a mobile smoke test for all calculator pages.`
- `Use $test-calculator-e2e to test saved simulations on the favoritos page.`
