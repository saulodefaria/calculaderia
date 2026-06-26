---
slug: "investimento"
backlogRank: 16
primaryKeyword: "calculadora investimento"
decision: "new"
targetRoute: "/calculadoras/investimento"
status: "verified"
createdAt: "2026-06-26"
updatedAt: "2026-06-26"
---

# Calculadora de Investimento Plan

## Backlog Row

- Rank: 16
- Original status: `Backlog`
- Slug: `investimento`
- Primary keyword: `calculadora investimento`
- Cluster keywords: `calculadora investimento online`; `calculadora investimento mensal`
- Opportunity score: 64
- Idea type: `New`
- Notes: Broad umbrella calculator; likely overlaps juros compostos and renda fixa.
- Done ref: `-`
- Selection notes:
  - Read candidate rows only from `docs/calculator-backlog.md`.
  - Skipped stale rank 10 `hp-12c-online` because automation memory records completed draft PR work targeting `/calculadoras/calculadora-financeira-online`.
  - Skipped stale/in-flight rank 11 `financiamento-veiculo` because automation memory records prior implementation work despite the stale backlog status.
  - Skipped stale rank 13 `imposto-de-renda` because automation memory records completed draft PR work for `/calculadoras/imposto-de-renda`.
  - Skipped stale/in-flight rank 15 `cdb` because automation memory records recent planner and creator work for `/calculadoras/cdb`.

## Decision

- Decision: `new`.
- Target route: `/calculadoras/investimento`.
- Target calculator id: `investimento`.
- Proposed category: existing `investimentos-rendimentos`; no new `ToolFamilyId` or `ToolCategoryId`.
- Rationale: keep the route as a broad investment projection and goal-planning calculator, not a duplicate fixed-income or tax calculator. The core job is "how much could I accumulate, how much do I need to invest monthly, or when do I reach a target under editable return assumptions?" This is distinct from:
  - `/calculadoras/juros-compostos`, which is a focused forward compound-interest calculator.
  - `/calculadoras/renda-fixa`, which compares fixed-income product styles with IR/IOF and inflation assumptions.
  - `/calculadoras/tir`, which evaluates arbitrary cash-flow returns.
  - `/calculadoras/cdb`, which recent automation memory says is already in progress as a product-specific CDB calculator.

## Similarity Check

- Existing calculators/routes checked:
  - `app/[locale]/calculadoras/juros-compostos`
  - `app/[locale]/calculadoras/renda-fixa`
  - `app/[locale]/calculadoras/tir`
  - `app/[locale]/calculadoras/alugar-vs-comprar`
  - `app/[locale]/calculadoras/comparativo`
  - No existing `/calculadoras/investimento` route.
- Related modules/translations checked:
  - `lib/calculators/juros-compostos.ts` supports fixed periodic contributions and forward projection only.
  - `lib/calculators/renda-fixa.ts` supports product-style fixed-income comparisons, tax tables, and real return.
  - `lib/calculators/tir.ts` supports cash-flow IRR/annualization.
  - `lib/url-state` has query-state patterns for existing calculators but no `investimento` module.
  - `components/calculators` has no `investimento` folder.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have `juros-compostos`, `renda-fixa`, and `tir`, but no `investimento` calculator namespace.
  - `lib/constants.ts` already has category `investimentos-rendimentos` and registry examples using `FinanceApplication`.
- Prior plans checked:
  - No `docs/calculator-plans/investimento.md` existed before this plan.
  - Existing plans reference `juros-compostos` and `renda-fixa` as related calculators, but none owns the broader investment-goal route.
- Overlap conclusion: buildable as a separate route if the creator keeps scope to editable, constant-rate projection and goal planning. Do not add taxes, current rates, product recommendations, brokerage comparisons, or product-specific promises.

## User Intent And Scope

- Target user: Brazilian users comparing personal saving/investment scenarios before choosing a product elsewhere.
- User job:
  - Estimate final value from an initial amount, recurring contribution, rate, and time.
  - Estimate the monthly contribution needed to reach a target amount by a deadline.
  - Estimate how long it may take to reach a target under a contribution and return assumption.
  - Understand the split between principal contributed and estimated earnings.
- In scope:
  - Constant periodic return assumptions entered by the user.
  - Annual effective or monthly rate input, converted consistently to the simulation period.
  - Monthly contribution at the end or beginning of the period.
  - Optional inflation adjustment using user-entered inflation.
  - Projection table and chart sampled monthly/yearly.
  - Goal-mode warnings when assumptions make the goal unreachable within the supported horizon.
  - Related links to tax/product-specific calculators.
- Out of scope:
  - Automatic CDI, Selic, IPCA, asset, fund, crypto, or stock quote fetching.
  - Product rankings, brokerage comparison, portfolio allocation, or buy/sell recommendations.
  - IR, IOF, come-cotas, custody, administration/performance fees, spread, slippage, credit risk, liquidity risk, or guarantees.
  - Variable monthly contributions, irregular cash flows, or reinvested dividends beyond the constant return assumption.
  - CDB, LCI/LCA, Tesouro, poupança, or fund-specific tax treatment.
- Sensitive-topic caveats:
  - Results are educational estimates and not investment advice.
  - The user-entered rate is a scenario assumption, not a forecast.
  - Past or assumed return is not a guarantee of future return.
  - Inflation, fees, and taxes can materially change real outcomes.

## Calculator Contract

- Inputs:
  - `mode`: `projection`, `requiredContribution`, or `timeToGoal`.
  - `valorInicial`: starting amount in BRL.
  - `aporteMensal`: recurring monthly contribution in BRL. Required for `projection` and `timeToGoal`; solved in `requiredContribution`.
  - `metaValor`: target amount in BRL. Required for `requiredContribution` and `timeToGoal`.
  - `prazoMeses`: horizon in months. Required for `projection` and `requiredContribution`.
  - `taxa`: return rate as a percentage.
  - `taxaPeriodo`: `anualEfetiva` or `mensal`.
  - `aporteTiming`: `fim` or `inicio`.
  - `inflacaoAnual`: optional annual inflation assumption as a percentage.
- Defaults:
  - `mode`: `projection`
  - `valorInicial`: `1000`
  - `aporteMensal`: `500`
  - `metaValor`: `100000`
  - `prazoMeses`: `120`
  - `taxa`: `8`
  - `taxaPeriodo`: `anualEfetiva`
  - `aporteTiming`: `fim`
  - `inflacaoAnual`: blank or `0`
  - Default return is only an editable example, not a current market rate.
- Validation rules:
  - `valorInicial`: `0` to `1000000000`.
  - `aporteMensal`: `0` to `100000000`.
  - `metaValor`: `0.01` to `10000000000` when used.
  - `prazoMeses`: integer `1` to `600` for projection and contribution modes.
  - `taxa`: greater than `-100`; recommend hard cap around `1000` for monthly and `10000` for annual to prevent overflow.
  - `inflacaoAnual`: greater than `-100`; cap around `1000`.
  - Reject or warn if all growth inputs are zero and `timeToGoal` cannot reach the target.
  - Round display money to cents; keep internal math unrounded until row/output boundaries.
- Outputs:
  - `valorFinalNominal`
  - `valorFinalReal` when inflation is provided
  - `totalAportado`
  - `totalJurosEstimados`
  - `percentualJuros`
  - `aporteMensalNecessario` for contribution mode
  - `mesesAteMeta` and equivalent years/months for time-to-goal mode
  - `taxaMensalEquivalente` and `taxaAnualEquivalente`
  - projection series with period, opening balance, contribution, estimated return, closing nominal balance, optional real balance
  - warnings for stale source version, no taxes/fees, and unreachable goal.
- Result explanations:
  - Explain that the calculation assumes constant return and fixed monthly contribution.
  - Separate amount contributed from estimated earnings.
  - Show what changes if contributions are made at the beginning rather than the end of each month.
  - For optional inflation, frame real value as purchasing-power estimate under the user-entered inflation rate.
- URL params:
  - `sv`: source/formula version, required value `2026-06-26`.
  - `m`: mode, `p` projection, `a` required contribution, `t` time to goal.
  - `vi`: `valorInicial`.
  - `am`: `aporteMensal`.
  - `mv`: `metaValor`.
  - `pm`: `prazoMeses`.
  - `tx`: `taxa`.
  - `tp`: `a` annual effective, `m` monthly.
  - `at`: `f` end of period, `i` beginning of period.
  - `ia`: optional `inflacaoAnual`.
  - Omit blank optional inflation; encode zeros explicitly when they materially affect a restored state.
- Share/save behavior:
  - Generate share URLs from the full encoded state including `sv`.
  - On missing or unsupported `sv`, restore safe defaults and show a stale-link warning.
  - Use `SaveButton calculatorId="investimento"` and the generated share URL so unauthenticated callbacks preserve query state.
  - No sensitive personal data is required, but the share section should still warn that URLs include the user-entered financial scenario.

## Formulas And Sources

- Formula summary:
  - Normalize the periodic monthly rate:
    - If `taxaPeriodo = anualEfetiva`, `r = (1 + taxa / 100) ** (1 / 12) - 1`.
    - If `taxaPeriodo = mensal`, `r = taxa / 100`.
    - `taxaAnualEquivalente = (1 + r) ** 12 - 1`.
  - Let `n = prazoMeses`, `P = valorInicial`, `C = aporteMensal`, and `due = aporteTiming === "inicio" ? (1 + r) : 1`.
  - Forward projection:
    - If `r = 0`, `FV = P + C * n`.
    - Otherwise, `FV = P * (1 + r) ** n + C * due * (((1 + r) ** n - 1) / r)`.
  - Required monthly contribution:
    - `gap = metaValor - P * (1 + r) ** n`.
    - If `gap <= 0`, required contribution is `0`.
    - If `r = 0`, `C = gap / n`.
    - Otherwise, `C = gap / (due * (((1 + r) ** n - 1) / r))`.
    - If denominator is not positive, return an unreachable/invalid-assumption warning instead of a contribution.
  - Time to goal:
    - Use the same forward-projection function and solve the smallest integer month where `FV >= metaValor`.
    - Prefer deterministic bisection from `0` to `600` months after proving the target is reachable at the upper bound; linear loop is acceptable because the horizon is capped.
    - Return `0` months when `valorInicial >= metaValor`.
  - Optional real value:
    - `inflacaoMensal = (1 + inflacaoAnual / 100) ** (1 / 12) - 1`.
    - `valorReal = valorNominal / ((1 + inflacaoMensal) ** meses)`.
- Data tables or assumptions:
  - No public rate table is embedded.
  - No tax table is embedded.
  - All return and inflation assumptions are user-provided.
  - `sv=2026-06-26` identifies formula/source copy, not a market-rate snapshot.
- Official or primary sources:
  - Microsoft Support, FV function: https://support.microsoft.com/en-us/office/fv-function-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3
  - Microsoft Support, PMT function: https://support.microsoft.com/en-us/office/pmt-function-0214da64-9a63-4996-bc20-214433fa6441
  - Microsoft Support, NPER function: https://support.microsoft.com/en-us/office/nper-function-240535b5-6653-4d2d-bfcf-b6a38151d815
  - Microsoft Support, EFFECT function: https://support.microsoft.com/en-us/office/effect-function-910d4e4c-79e2-4009-95e6-507e04f11bc4
  - Banco Central do Brasil, Calculadora do Cidadão landing page: https://www.bcb.gov.br/meubc/calculadoradocidadao
- Source access dates:
  - Microsoft FV/PMT/NPER/EFFECT pages accessed 2026-06-26 America/Sao_Paulo.
  - Banco Central Calculadora do Cidadão landing page accessed 2026-06-26 America/Sao_Paulo; command-line page content requires JavaScript, so it is only a supporting official reference, not the formula source.
- Creator source revalidation:
  - 2026-06-26 America/Sao_Paulo: Microsoft FV, PMT, NPER, and EFFECT support links re-opened successfully; canonical redirects now point to Microsoft Excel function pages and still document constant-rate periods, fixed payments, payment timing, and effective-rate conversion.
  - 2026-06-26 America/Sao_Paulo: Banco Central Calculadora do Cidadão landing page re-opened successfully as a JS-rendered official supporting reference. No BCB rate table or market-rate data is embedded in this calculator.
- Rule/table effective dates:
  - Not applicable; this calculator embeds no law table, tax table, public rate, or product-specific rule.
- Source-derived test fixtures:
  - Future value fixture matching Microsoft FV example shape: monthly rate `0.06 / 12`, `n=10`, contribution `200`, initial `500`, beginning timing should produce approximately `2581.40` after sign normalization.
  - Future value fixture matching Microsoft FV example shape: monthly rate `0.12 / 12`, `n=12`, contribution `1000`, initial `0`, end timing should produce approximately `12682.50`.
  - Required contribution should invert the forward formula for target/horizon cases within one cent.
  - Time-to-goal should map the Microsoft NPER-style investment example to about `60` whole months after rounding up to the first reached month.
- Freshness or maintenance risk:
  - Low formula freshness risk because the plan uses standard constant-rate time-value-of-money formulas.
  - Medium product-context risk if UI copy implies market rates, tax treatment, guarantees, or advice; creator must keep examples clearly user-editable and assumption-based.
  - Revalidate source links and source-version date on implementation day.
- Estimator limitations:
  - Constant return, fixed contribution, and no taxes/fees are material simplifications.
  - Real returns depend on actual inflation, taxes, fees, asset behavior, and investor timing.
  - Negative or very high rates can make results unintuitive; show validation/warning copy rather than hiding the assumption.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Calculadora de investimento`
  - PT-BR description: `Simule quanto seu investimento pode render, quanto aportar por mês para atingir uma meta ou em quanto tempo chegar ao valor desejado.`
- Main form sections:
  - Mode segmented control: projeção, aporte necessário, tempo até a meta.
  - Scenario inputs: starting value, monthly contribution, target, horizon.
  - Assumptions: annual/monthly return, contribution timing, optional inflation.
  - Actions: calculate, reset, share, save.
- Results sections:
  - Summary cards for final nominal value, required contribution or time to goal, total contributed, estimated earnings.
  - Assumption badges for monthly equivalent rate, contribution timing, and `sv=2026-06-26`.
  - Projection chart and compact yearly table.
  - Warning panel for taxes/fees/current-rate exclusions.
- SEO sections:
  - How the investment calculator works.
  - Projection vs goal calculation.
  - Annual vs monthly rate consistency.
  - What the calculator does not include.
  - When to use the fixed-income, CDB, compound-interest, or IRR calculators instead.
- FAQ topics:
  - Is the return rate updated automatically?
  - Does the calculator include IR, IOF, or fees?
  - What is the difference between annual and monthly rate?
  - Why does contribution timing change the final value?
  - Can this be used for CDB, Tesouro, stocks, or funds?
  - Does the result guarantee future returns?
- Disclaimer:
  - Educational estimate only, not investment, accounting, tax, or legal advice.
  - No recommendation of product, broker, issuer, or asset class.
  - The calculator does not fetch or validate current market rates.
- Related calculator links:
  - `/calculadoras/juros-compostos`
  - `/calculadoras/renda-fixa`
  - `/calculadoras/cdb` when available; otherwise leave as planned/future copy only if route exists.
  - `/calculadoras/tir`
- Translation guidance:
  - `pt-br`: natural Brazilian finance language: "aporte mensal", "meta", "rentabilidade estimada", "valor real".
  - `en`: "investment calculator", "monthly contribution", "target amount", "estimated return", "real value".
  - `es`: "calculadora de inversión", "aporte mensual", "meta", "rentabilidad estimada", "valor real".
  - Keep legal/disclaimer copy localized, not machine-literal, and avoid product recommendations in all locales.

## Implementation Checklist

- Calculator logic:
  - Add pure logic module `lib/calculators/investimento.ts`.
  - Export typed inputs/results, default inputs, validation error codes, and formula helpers.
  - Implement projection, required-contribution, and time-to-goal modes from one shared `futureValue` helper.
  - Keep internal calculations unrounded until output row/summary creation.
- URL state:
  - Add `lib/url-state/investimento.ts` and focused tests.
  - Export from `lib/url-state/index.ts`.
  - Require `sv=2026-06-26`; stale/missing source versions should produce defaults plus warning metadata.
- UI components:
  - Add `components/calculators/investimento/investimento-calculator-client.tsx`.
  - Add form, results summary, chart/table components following existing calculator patterns.
  - Use segmented controls for mode and rate period; use numeric inputs for rates and money.
  - Include source-version/disclaimer/warning copy in the result area.
- Route and metadata:
  - Add `app/[locale]/calculadoras/investimento/page.tsx`.
  - Add `app/[locale]/calculadoras/investimento/layout.tsx`.
  - Use localized canonical/alternate path helpers consistent with existing calculators.
- Registry:
  - Add `investimento` to `lib/constants.ts` with category `investimentos-rendimentos`, `stateMode: "query"`, and `seoApplicationCategory: "FinanceApplication"`.
  - Choose icon `TrendingUp`, `LineChart`, or another existing lucide import already compatible with registry style.
- Messages:
  - Add full `calculators.investimento` namespace to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add category/index labels if required by registry cards.
- Unit tests:
  - Add `lib/calculators/investimento.test.ts` for formula, edge cases, and source-derived fixtures.
  - Add `lib/url-state/investimento.test.ts` for encode/decode/defaults/stale source version.
- E2E hooks/tests:
  - Add stable labels/selectors only where existing calculator e2e style needs them.
  - Add `tests/e2e/investimento.spec.ts`.
- Backlog updates:
  - Creator may mark rank 16 `In Progress` only when implementation begins.
  - Do not mark Done until orchestrator/tester finalization.

## Test Plan

- Unit scenarios:
  - Projection with annual effective rate, monthly contribution at end of period.
  - Projection with monthly rate and contribution at beginning of period.
  - Zero-rate projection.
  - Negative-rate projection with finite valid output.
  - Required contribution inverts projection within one cent.
  - Required contribution returns zero when starting value already reaches target by the deadline.
  - Time-to-goal returns zero when `valorInicial >= metaValor`.
  - Time-to-goal returns unreachable when target cannot be reached within 600 months.
  - Optional inflation real-value calculation.
  - Source-derived Microsoft FV/NPER-style fixtures listed above.
- URL-state scenarios:
  - Full state encodes and decodes all modes.
  - Zero values that affect state round-trip explicitly.
  - Missing optional inflation restores as blank/zero without polluting URLs.
  - Missing or unsupported `sv` returns defaults and stale warning.
  - Generated share URL uses `/calculadoras/investimento`.
- Browser scenarios:
  - PT-BR route loads with no unexpected console errors.
  - Default projection renders summary, chart/table, source-version badge, and no-advice disclaimer.
  - Switching to required-contribution mode solves and updates URL.
  - Switching to time-to-goal mode returns a readable whole-month result.
  - Share URL restores values and `sv=2026-06-26`.
  - Unauthenticated save redirect preserves generated query state.
  - Stale source version warning appears for an old `sv`.
  - Mobile 390px viewport has no horizontal overflow or overlapping controls.

## Creator Implementation Notes

- Status: implementation completed by creator on 2026-06-26; browser/tester validation passed, backlog row is `Done`, and this plan is `verified`.
- Review-fix handoff: on 2026-06-26, addressed only the accepted review findings. `lib/calculators/investimento.ts` now rejects rate/horizon combinations whose growth factor is non-finite for the relevant horizon (`prazoMeses` for projection/required contribution, 600 months for time-to-goal), while preserving valid negative rates above `-100%` and finite high-rate scenarios. Focused calculator and URL-state regressions cover overflowing current-`sv` URLs. The route source section now includes Microsoft EFFECT with localized `sources.effect` labels in PT-BR, EN, and ES.
- Second review-fix handoff: on 2026-06-26, addressed only the accepted finite-factor/non-finite-FV validation finding. `validateInvestimentoInputs` now checks the actual projected monetary result with `futureValueInvestimento` for the relevant horizon, so current-`sv` URLs such as `vi=1000000000&am=100000000&tx=220&tp=m&pm=600` are rejected before formatting can mask a non-finite final value. For `requiredContribution`, the overflow probe uses contribution `0` because the user-entered `aporteMensal` is unused by that mode, preserving finite valid scenarios with large unused contribution values.
- Source revalidation summary: Microsoft FV, PMT, NPER, and EFFECT support pages were re-opened successfully on 2026-06-26 America/Sao_Paulo; Banco Central Calculadora do Cidadão landing page was re-opened successfully as an official JS-rendered supporting reference. No current rate, public table, tax table, product ranking, or market quote is embedded.
- Files changed:
  - `docs/calculator-backlog.md`
  - `docs/calculator-plans/investimento.md`
  - `lib/calculators/investimento.ts`
  - `lib/calculators/investimento.test.ts`
  - `lib/url-state/investimento.ts`
  - `lib/url-state/investimento.test.ts`
  - `lib/url-state/index.ts`
  - `components/calculators/investimento/calculator-form.tsx`
  - `components/calculators/investimento/investimento-calculator-client.tsx`
  - `components/calculators/investimento/projection-details.tsx`
  - `components/calculators/investimento/results-summary.tsx`
  - `app/[locale]/calculadoras/investimento/layout.tsx`
  - `app/[locale]/calculadoras/investimento/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/investimento.spec.ts`
- Validation:
  - `pnpm test -- lib/calculators/investimento.test.ts lib/url-state/investimento.test.ts` failed before tests with known no-TTY dependency guard: `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
  - `./node_modules/.bin/vitest run lib/calculators/investimento.test.ts lib/url-state/investimento.test.ts` passed: 2 files, 17 tests.
  - Review-fix rerun on 2026-06-26: `./node_modules/.bin/vitest run lib/calculators/investimento.test.ts lib/url-state/investimento.test.ts` passed: 2 files, 22 tests.
  - Review-fix rerun on 2026-06-26: `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log(f + ' ok'); }"` passed.
  - Review-fix rerun on 2026-06-26: `./node_modules/.bin/eslint` passed.
  - Review-fix rerun on 2026-06-26: `git diff --check` passed.
  - `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log(f + ' ok'); }"` passed.
  - `./node_modules/.bin/eslint` passed.
  - `git diff --check` passed.
  - Second review-fix rerun on 2026-06-26: `./node_modules/.bin/vitest run lib/calculators/investimento.test.ts lib/url-state/investimento.test.ts` passed: 2 files, 25 tests.
  - Second review-fix rerun on 2026-06-26: `./node_modules/.bin/eslint` passed.
  - Second review-fix rerun on 2026-06-26: `git diff --check` passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/prisma generate` passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/next build` passed with existing `metadataBase` warnings.
  - `NEXT_DIST_DIR=.next-e2e PORT=3108 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3108" ./node_modules/.bin/playwright test tests/e2e/investimento.spec.ts` was attempted with local binaries but blocked before page load by Chromium sandbox/MachPort permission errors (`bootstrap_check_in ... Permission denied (1100)`) for all six focused tests.
- Tester validation handoff:
  - 2026-06-26 05:59 -03: Used `$calculator-tester` after review gate. Inspected the plan, e2e guidance, route, field ids, result labels/test ids, URL params, share/save behavior, source links, and focused Playwright spec.
  - Targeted e2e was run first as `pnpm run test:e2e -- tests/e2e/investimento.spec.ts`; it failed before Playwright with the known no-TTY pnpm dependency guard (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).
  - Local binary Playwright rerun with `NEXT_DIST_DIR=.next-e2e PORT=3109 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3109" ./node_modules/.bin/playwright test tests/e2e/investimento.spec.ts` reached Chromium launch but all six tests were blocked before page load by `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`.
  - Browser-capable rerun initially found test-only strict locator drift. Updated only `tests/e2e/investimento.spec.ts` to use exact headings/scoped result cards and to add missing assertions for Microsoft EFFECT, no-tax/no-current-rate warnings, explicit zero URL restore, the reviewed overflow URL/input validation, and EN/ES labels/disclaimers.
  - Browser-capable focused e2e passed 8/8 with `NEXT_DIST_DIR=.next-e2e PORT=3111 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3111" ./node_modules/.bin/playwright test tests/e2e/investimento.spec.ts`.
  - Covered PT-BR route load/no redirect, default projection summary/chart/table/source badge `sv=2026-06-26`, no-advice/no-tax/no-current-rate warnings, EFFECT source link, required-contribution result around R$ 435,31, time-to-goal result around 60 months, share restore, unauthenticated save callback query preservation, stale `sv` default restore/warning, explicit zero URL state, high-rate overflow validation with no non-finite output, mobile 390px no horizontal overflow, and EN/ES localized title/form-label/disclaimer/Save/Share smoke checks. No unexpected console/page errors remained in passing browser checks.
- Playwright scenarios:
  - Focused test for default projection.
  - Focused test for contribution-to-goal mode.
  - Focused test for time-to-goal mode and unreachable warning.
  - Focused test for share/restore/save callback.
  - Focused mobile and EN/ES smoke tests.
- Lint/build commands:
  - `pnpm test -- lib/calculators/investimento.test.ts lib/url-state/investimento.test.ts`
  - `pnpm lint`
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build`
  - `pnpm run test:e2e -- tests/e2e/investimento.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - Formula fixtures pass within cent-level tolerance.
  - URL share/restore and save callback preserve full state.
  - UI copy does not imply advice, current rates, tax inclusion, or guaranteed returns.
  - Creator revalidates source links on implementation day and updates `sv` if source/formula copy changes.

## Implementation Notes

- Status updates:
  - 2026-06-26: Planned by Daily Calculator Backlog Builder automation. Sources/formulas validated for creator handoff.
- Files changed:
  - `docs/calculator-plans/investimento.md`
- Validation results:
  - Plan-only run; no app code, messages, tests, or backlog edited.
  - `git diff --check -- docs/calculator-plans/investimento.md` should pass before handoff.
- Tester findings:
  - 2026-06-26: Tester validation passes. Only test coverage and validation notes were changed; no production calculator code was modified.
- Final status:
  - `verified`; backlog rank 16 marked `Done` with route validation reference pending draft PR URL replacement.
