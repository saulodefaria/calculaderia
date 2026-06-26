---
slug: "financiamento-veiculo"
backlogRank: 11
primaryKeyword: "simulador financiamento veículo"
decision: "new"
targetRoute: "/calculadoras/financiamento-veiculo"
status: "verified"
createdAt: "2026-06-25"
updatedAt: "2026-06-26"
---

# Simulador de Financiamento de Veiculo Plan

## Backlog Row

- Rank: 11.
- Original status: Ready.
- Slug: `financiamento-veiculo`.
- Primary keyword: `simulador financiamento veículo`.
- Cluster keywords: `simulador financiamento carro`; `simulador financiamento de veículos`.
- Volume: 33100.
- SEO difficulty: 66.
- CPC: R$ 7.58.
- Intent: 2.
- Opportunity score: 70.
- Idea type: New.
- Notes: Generic vehicle financing can absorb bank/brand variants.
- Done ref: `-`.
- Selection source: selected only from `docs/calculator-backlog.md`, per automation constraint. `docs/tool-backlog.md` was not inspected.
- Rank-10 discrepancy: `docs/calculator-backlog.md` still lists rank 10 `hp-12c-online` as `Backlog`, but automation memory and the user-provided remote-refresh context say it was completed in draft PR #22 on branch `origin/codex/calculadora-financeira-online`. Treat rank 10 as already-completed automation work and ineligible for this run; do not repeat it.

## Decision

- Decision: `new`; approved/buildable as a dedicated vehicle-financing calculator route.
- Target route: `/calculadoras/financiamento-veiculo`.
- Rationale: the existing `/calculadoras/financiamento` route is a mortgage-oriented financing calculator with property appreciation, rent, IRR, and real-estate SEO copy. Vehicle financing has a distinct search intent, shorter terms, car/motorcycle examples, down-payment emphasis, financed/upfront fee assumptions, and Price-first UX. A dedicated route can reuse or wrap the existing SAC/Price amortization math while keeping vehicle copy and defaults focused.
- Buildability: buildable. The formula contract only needs user-entered principal, down payment, optional costs, term, and fixed interest rate. No official bank-rate table, IOF table, CET calculation, brand financing condition, or vehicle-price data is required for the first build. Source validation confirms stable annuity/payment math and official Brazilian credit-context references; variable taxes, fees, insurance, tariffs, and bank conditions remain explicit user assumptions or out of scope.

## Similarity Check

- Existing calculators/routes checked:
  - Existing routes under `app/[locale]/calculadoras`: `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, `renda-fixa`, `rescisao-trabalhista`, `ferias`, `decimo-terceiro`, `seguro-desemprego`, `salario-liquido`, `fgts`, and `inss`.
  - No `app/[locale]/calculadoras/financiamento-veiculo` route exists.
  - No `components/calculators/financiamento-veiculo` folder exists.
  - No `lib/calculators/financiamento-veiculo.ts` or `lib/url-state/financiamento-veiculo.ts` exists.
- Related modules/translations checked:
  - `lib/calculators/financiamento.ts` already implements SAC and Price schedules, extra amortization helpers, and annual-rate conversion for the mortgage calculator.
  - `lib/url-state/financiamento.ts` already establishes compact query params for financing, but its field names/defaults are property-focused.
  - `components/calculators/financiamento/*` has reusable table/result patterns, but the form includes property appreciation and rent fields that should not be copied into the vehicle route.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have `calculators.financiamento` copy focused on real-estate financing and do not have a vehicle-financing namespace.
  - `lib/constants.ts` already has the `calculadoras` family and `financiamento-credito` category; no new family/category is needed. The new calculator should use primary category `financiamento-credito` and may omit `moradia-patrimonio`.
- Prior plans checked:
  - Existing calculator plans: `rescisao-trabalhista`, `ferias`, `decimo-terceiro`, `seguro-desemprego`, `salario-liquido`, `fgts`, and `inss`.
  - No prior `docs/calculator-plans/financiamento-veiculo.md` existed before this plan.
- Search terms checked: `financiamento-veiculo`, `financiamento veiculo`, `simulador financiamento veículo`, `simulador financiamento carro`, `simulador financiamento de veículos`, `financiamento-moto`, `financiamento-sem-entrada`, `financiamento-banco-generico`, `financiamento`, `SAC`, `Price`, and `CET`.
- Overlap conclusion:
  - Build `/calculadoras/financiamento-veiculo` as a new, focused calculator.
  - Do not merge into `/calculadoras/financiamento`, because that route's current form and SEO are real-estate specific.
  - Treat backlog rows `financiamento-moto`, `financiamento-sem-entrada`, and `financiamento-banco-generico` as future presets/content clusters that this route can absorb through examples or FAQ copy.
  - Treat existing `/calculadoras/consorcio`, `/calculadoras/comparativo`, and guide `financiamento-vs-consorcio` as related links, not duplicates.

## User Intent And Scope

- Target user: Brazilian buyer comparing financing scenarios for a car, motorcycle, or other vehicle before talking to a bank, dealer, fintech, or credit broker.
- User job:
  - Enter vehicle price, down payment, optional financed/upfront costs, monthly interest rate, term, and amortization method.
  - Estimate monthly installment profile, total interest, total paid, financed principal, and remaining balance.
  - Compare Price versus SAC and understand why the bank/dealer proposal can differ because of CET, IOF, tariffs, insurance, registration, guarantees, and contract-specific conditions.
- In scope:
  - Fixed-rate vehicle-financing estimator for user-supplied terms.
  - Vehicle value, down payment, optional financed costs, optional upfront costs, monthly interest rate, term in months, and amortization method.
  - Price schedule with constant end-of-period installments.
  - SAC schedule with constant principal amortization and decreasing installments.
  - Total installments, total interest, total cash cost including down payment/upfront costs, effective annual rate derived from the monthly rate, and month-by-month amortization table.
  - Optional comparison toggle or summary that calculates both Price and SAC for the same inputs.
  - Source/version badge such as `Formula version 2026-06-25`; no public-rate table is embedded.
- Out of scope:
  - Official bank quotes, dealer offers, approval odds, credit score analysis, brand-specific rates, bank-specific tariffs, loan preapproval, refinancing, portability, consorcio bids, leasing/arrendamento mercantil, balloon/residual payments, grace periods, variable rates, inflation/indexed contracts, depreciated resale value, insurance recommendation, vehicle documentation fees by state, automatic IOF calculation, and legal/tax/accounting advice.
  - Automatic scraping or display of Banco Central rate rankings. Link users to official BCB rate pages if needed, but require them to enter the rate used in their proposal.
  - Official CET calculation. The UI may explain that CET can include additional costs and should be compared in the lender proposal, but the first build must not claim to compute regulatory CET unless a later, separately sourced plan adds the complete cash-flow model and current regulatory source validation.
- Sensitive-topic caveats:
  - Results are educational estimates, not credit advice or a financing recommendation.
  - The calculator does not replace the bank/dealer proposal, contract schedule, CET disclosure, or professional financial advice.
  - If the user enters only the nominal interest rate and ignores fees/taxes/insurance, the calculated cost will usually be lower than the contractual total.

## Calculator Contract

- Inputs:
  - `valorVeiculo`: vehicle cash price in BRL.
  - `entrada`: down payment in BRL.
  - `custosFinanciados`: optional fees/taxes/insurance amount added to principal; default `0`.
  - `custosAVista`: optional fees/taxes/insurance amount paid upfront; default `0`.
  - `taxaJurosMensal`: monthly interest rate in percent; primary rate input to match common Brazilian vehicle-financing proposals.
  - `prazoMeses`: number of monthly installments.
  - `metodo`: `price` or `sac`; default `price` because fixed installments are common in vehicle-financing user expectations, while SAC remains available for comparison.
  - Optional comparison mode: show the alternate method summary without changing the main schedule.
- Defaults:
  - `valorVeiculo`: `80000`.
  - `entrada`: `20000`.
  - `custosFinanciados`: `0`.
  - `custosAVista`: `0`.
  - `taxaJurosMensal`: `1.49`.
  - `prazoMeses`: `48`.
  - `metodo`: `price`.
  - Defaults are illustrative and must not be presented as market averages or recommended terms.
- Validation rules:
  - `valorVeiculo` must be greater than `0`.
  - `entrada`, `custosFinanciados`, and `custosAVista` must be `>= 0`.
  - `entrada` must be lower than `valorVeiculo + custosFinanciados`; otherwise there is no amount to finance.
  - `taxaJurosMensal` may be `0` for no-interest scenarios and should reject negative or implausibly high values. Suggested UI cap: `20% a.m.` with a warning above `10% a.m.`.
  - `prazoMeses` must be an integer from `1` to `120`; warn above `84` because vehicle terms that long are higher-risk assumptions, but keep build logic deterministic.
  - `custosFinanciados + custosAVista` above `50%` of vehicle value should show a warning, not a hard failure.
- Outputs:
  - `valorFinanciado = valorVeiculo + custosFinanciados - entrada`.
  - `totalEntradaECustosAVista = entrada + custosAVista`.
  - Main installment: fixed installment for Price, or first/last installment for SAC.
  - `totalJuros`, `totalParcelas`, `totalGeral = entrada + custosAVista + totalParcelas`.
  - `taxaEfetivaAnual = (1 + taxaMensalDecimal)^12 - 1`.
  - Amortization table: month, starting balance, interest, amortization, installment, ending balance.
  - Optional method comparison: Price total interest/payment versus SAC total interest/payment, first/last installment, and difference.
  - Warnings for missing fees/CET, high rate, long term, low/no down payment, and upfront/financed-cost assumptions.
- Result explanations:
  - Explain that Price keeps installments constant while the interest share decreases and amortization share increases.
  - Explain that SAC keeps amortization constant and installments generally decrease because interest is charged on a falling balance.
  - Explain that BCB/bank/dealer figures can differ if the lender uses CET, taxes, tariffs, insurance, payment dates, grace periods, rounded cents, or non-standard cash flows.
- URL params:
  - Use query state with compact keys and explicit source/formula version, for example: `sv=2026-06-25`, `vv`, `en`, `cf`, `ca`, `tm`, `pm`, `mt`, and optional comparison flag `cmp`.
  - Decode must reject missing/invalid required params and fall back to defaults without throwing.
  - Encode all numeric fields, including zeros, so share/save roundtrips do not silently restore defaults for optional costs.
- Share/save behavior:
  - Share button copies a URL that fully restores inputs, method, comparison flag, and source/formula version.
  - Save button uses `calculatorId="financiamento-veiculo"` and preserves the generated query string in unauthenticated sign-in callback.
  - No personal data or vehicle identification data should be requested or stored.

## Formulas And Sources

- Formula summary:
  - Let `P = valorVeiculo + custosFinanciados - entrada`, `i = taxaJurosMensal / 100`, and `n = prazoMeses`.
  - Price fixed installment:
    - If `i = 0`, `parcela = P / n`.
    - Otherwise, `parcela = P * i / (1 - (1 + i)^(-n))`.
    - For each month, `juros = saldoInicial * i`, `amortizacao = parcela - juros`, and `saldoFinal = saldoInicial - amortizacao`, with final-month rounding adjustment to avoid residual cents.
  - SAC:
    - `amortizacaoConstante = P / n`.
    - For each month, `juros = saldoInicial * i`, `parcela = amortizacaoConstante + juros`, and `saldoFinal = saldoInicial - amortizacaoConstante`, with final-month rounding adjustment.
  - Effective annual rate display: `taxaEfetivaAnual = (1 + i)^12 - 1`.
  - Totals are sums of rounded schedule rows, with final-row correction so the ending balance is exactly zero.
- Data tables or assumptions:
  - No public table is embedded.
  - The user supplies the monthly interest rate from their quote or scenario.
  - Optional costs are user-entered amounts; the calculator does not calculate IOF, CET, insurance, tariffs, registration, or bank fees automatically.
  - Payments are modeled as end-of-month/end-of-period payments with no grace period and no balloon/residual installment.
- Official/stable sources:
  - Microsoft Support, PMT function: https://support.microsoft.com/en-us/excel/functions/pmt-function. Accessed `2026-06-25`; HTTP 200 verified after the legacy `/office/<slug-guid>` URL redirected to this canonical path. Used to validate the fixed-rate, constant-payment annuity contract and the limitation that PMT excludes taxes, reserve payments, and fees.
  - Microsoft Support, IPMT function: https://support.microsoft.com/en-us/excel/functions/ipmt-function. Accessed `2026-06-25`; HTTP 200 verified after the legacy `/office/<slug-guid>` URL redirected to this canonical path. Used to validate period interest for constant-rate schedules.
  - Microsoft Support, PPMT function: https://support.microsoft.com/en-us/excel/functions/ppmt-function. Accessed `2026-06-25`; HTTP 200 verified after the legacy `/office/<slug-guid>` URL redirected to this canonical path. Used to validate principal/amortization decomposition for constant-rate schedules.
  - Banco Central do Brasil, Calculadora do Cidadao: https://www.bcb.gov.br/meubc/calculadoradocidadao. Accessed `2026-06-25`; HTTP 200 verified, but command-line/web text access returns a JavaScript shell. Use as an official external calculator reference only; do not scrape it.
  - Banco Central do Brasil, Taxas de juros: https://www.bcb.gov.br/estatisticas/txjuros. Accessed `2026-06-25`; HTTP 200 verified, but command-line/web text access returns a JavaScript shell. Link only as an external reference for market-rate lookup; do not embed or auto-fetch current rates in the first build.
  - Banco Central do Brasil, Resolucao CMN No. 3.517 PDF: https://www.bcb.gov.br/pre/normativos/res/2007/pdf/res_3517_v1_O.pdf. Accessed `2026-06-25`; HTTP 200 verified. Use only as credit-cost/CET context and do not quote current legal obligations without checking consolidated current norms.
- Source access dates:
  - All sources above accessed on `2026-06-25` in timezone `America/Sao_Paulo`.
- Rule/table effective dates:
  - Formula/source version date: `2026-06-25`.
  - No official public rate table, tax table, vehicle-fee table, or annual government table is part of the calculator.
  - CET context source date: Resolucao CMN No. 3.517 dated `2007-12-06`; current consolidated regulatory language should be rechecked before any future CET auto-calculation or detailed legal copy.
- Source-derived validation fixtures:
  - Price fixture from Microsoft PMT example adapted to BRL/sign convention: `P=10000`, `n=10`, monthly rate `8%/12`, no fees, no entry -> installment approximately `1037.03` and total installments approximately `10370.30`.
  - Price begin-of-period examples from Microsoft are out of scope because this calculator models end-of-period payments only.
  - SAC deterministic fixture: `P=1000`, `i=3% a.m.`, `n=4` -> installments `280.00`, `272.50`, `265.00`, `257.50`, total interest `75.00`, ending balance `0.00`.
  - Zero-interest fixture: `P=12000`, `i=0`, `n=12` -> `1000.00` per month in Price, SAC also `1000.00` per month, total interest `0.00`.
- Freshness or maintenance risk:
  - Low for Price/SAC formulas.
  - Medium for BCB URL shapes because they are JavaScript-rendered and can move.
  - High if future work attempts automatic IOF, CET, bank rates, dealer tariffs, insurance, state registration costs, or public rate rankings. Those require new source validation and likely versioned source dates.
- Estimator limitations:
  - Contractual bank schedules can differ because of day-count conventions, first due date, payment dates, grace periods, upfront versus financed costs, tax/fee inclusion, insurance, CET, rebates, renegotiation, and rounding.
  - A lower displayed installment does not imply a better credit choice; users must compare total cost and official CET in lender proposals.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Simulador de financiamento de veículo`.
  - PT-BR description: `Simule parcelas de financiamento de carro ou moto com Price ou SAC, entrada, prazo, taxa mensal e custos opcionais.`
  - EN title: `Vehicle Financing Simulator`.
  - ES title: `Simulador de Financiamiento de Vehiculo`.
- Main form sections:
  - Vehicle and entry: vehicle price, down payment, financed costs, upfront costs.
  - Financing terms: monthly interest rate, term, method segmented control `Price` / `SAC`.
  - Optional comparison: toggle or checkbox to compare both methods.
  - Use existing currency/percent input helpers and stable field IDs for e2e.
- Results sections:
  - Summary cards for financed amount, installment profile, total interest, total paid, and annual equivalent rate.
  - Method explanation panel.
  - Cost assumption warning panel for CET/taxes/fees/insurance.
  - Method comparison table when enabled.
  - Amortization table with pagination/collapse after the first 12 rows or existing table pattern.
- SEO sections:
  - How to use the vehicle financing simulator.
  - Price vs SAC for vehicle financing.
  - How entry and term change total interest.
  - What CET means and why bank/dealer proposals can differ.
  - Financing car, motorcycle, and no-entry scenarios as examples, without separate routes yet.
- FAQ topics:
  - How to calculate vehicle financing installments?
  - What rate should I use, monthly rate or annual rate?
  - Does the simulator include IOF, CET, insurance, and dealer fees?
  - What is better for a car loan, Price or SAC?
  - How does a larger down payment change total interest?
  - Can I use this for motorcycle financing?
  - Why is my bank proposal different from the simulation?
- Disclaimer:
  - Educational estimate only.
  - Does not provide credit, legal, tax, bank, dealer, insurance, or vehicle-purchase advice.
  - Does not calculate official CET or guarantee approval/contract values.
- Related calculator links:
  - `/calculadoras/financiamento` for mortgage-style financing.
  - `/calculadoras/consorcio`.
  - `/calculadoras/comparativo`.
  - `/calculadoras/juros-compostos`.
  - `/calculadoras/tir`.
- Translation guidance:
  - `pt-br`: use Brazilian finance terms: `entrada`, `taxa mensal`, `prazo`, `parcela`, `saldo devedor`, `amortizacao`, `CET`, `IOF`, `seguro`, `tarifas`.
  - `en`: translate as educational Brazil-context calculator; keep `CET` expanded as Brazilian total effective cost where mentioned.
  - `es`: use neutral Spanish with Brazil-context caveat; `CET` and `IOF` should be explained as Brazilian terms, not localized to another country's rules.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/financiamento-veiculo.ts` with pure types, validation, Price/SAC schedules, totals, comparison helper, warnings, and deterministic rounding.
  - Reuse proven helpers from `lib/calculators/financiamento.ts` only if extraction avoids property-specific fields. Do not import mortgage IRR/property/rent concepts into the vehicle module.
  - Export source metadata with `formulaVersion: "2026-06-25"` and source links.
- URL state:
  - Add `lib/url-state/financiamento-veiculo.ts` and export through `lib/url-state/index.ts`.
  - Include explicit `sv=2026-06-25` and encode zero optional costs.
  - Add URL-state tests for defaults, zeros, invalid params, method selection, and share URL roundtrip.
- UI components:
  - Add `components/calculators/financiamento-veiculo/*` using the existing calculator component style.
  - Prefer a compact, workflow-first form; avoid property-appreciation/rent UI from the existing financing calculator.
  - Include source/disclaimer copy near results and in SEO content.
- Route and metadata:
  - Add `app/[locale]/calculadoras/financiamento-veiculo/page.tsx` and `layout.tsx` following existing localized calculator route patterns.
  - Add FAQ JSON-LD and breadcrumb JSON-LD.
- Registry:
  - Add `financiamento-veiculo` to `lib/constants.ts` with `familyId: "calculadoras"`, `primaryCategoryId: "financiamento-credito"`, `categoryIds: ["financiamento-credito"]`, `stateMode: "query"`, and `seoApplicationCategory: "FinanceApplication"`.
  - Suggested icon: `Car` if imported from `lucide-react`; otherwise use `CircleDollarSign` or `Calculator`.
- Messages:
  - Add localized `calculators.financiamentoVeiculo` or similar namespace to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Keep source/disclaimer text localized and avoid unsupported claims about average bank rates.
- Unit tests:
  - Add formula tests for Price, SAC, zero interest, down payment/cost composition, annual equivalent rate, warnings, rounding/final balance, and invalid inputs.
- E2E hooks/tests:
  - Add focused Playwright coverage for default calculation, Price fixture, SAC fixture, zero-cost URL roundtrip, share/save callback preservation, high-rate warning, mobile layout, and EN/ES smoke routes.
- Backlog updates:
  - Creator may mark backlog `In Progress` only when implementation starts.
  - This planner run must not edit `docs/calculator-backlog.md`.

## Test Plan

- Unit scenarios:
  - Price PMT fixture: `P=10000`, `n=10`, `taxaMensal=0.6666666667%`, no entry/costs -> installment around `1037.03`, no ending balance.
  - SAC fixture: `P=1000`, `n=4`, `taxaMensal=3%` -> installments `280.00`, `272.50`, `265.00`, `257.50`, total interest `75.00`.
  - Zero-interest: `P=12000`, `n=12`, `taxaMensal=0` -> monthly `1000.00`, total interest `0.00`.
  - Costs: `valorVeiculo=80000`, `entrada=20000`, `custosFinanciados=2000`, `custosAVista=1500` -> financed principal `62000`, upfront cash `21500`, total general includes upfront cash plus installments.
  - Validation: entry equal/higher than financed base rejects; negative values reject; high rate/long term produce warnings.
- URL-state scenarios:
  - Encode/decode required state with `sv=2026-06-25`.
  - Preserve `0` for `custosFinanciados` and `custosAVista`.
  - Roundtrip `price` and `sac`.
  - Reject wrong `sv`, missing required params, invalid numeric values, and unsupported method.
  - Generate share URL for `/calculadoras/financiamento-veiculo`.
- Browser scenarios:
  - PT-BR route loads with no unexpected console errors.
  - Default calculation displays financed amount, installment, total interest, annual equivalent rate, disclaimer, source date, and amortization rows.
  - Switch to SAC and verify first/last installment behavior.
  - Share URL restores all values including zero optional costs.
  - Save unauthenticated callback preserves generated query.
  - Mobile viewport around 390px has no text overlap or horizontal overflow.
  - EN and ES routes load with localized title, form labels, and disclaimer.
- Playwright scenarios:
  - Focused spec at `tests/e2e/financiamento-veiculo.spec.ts` covering default Price flow, SAC fixture, share/save, warnings, mobile, and EN/ES smoke.
- Lint/build commands:
  - `pnpm test -- lib/calculators/financiamento-veiculo.test.ts lib/url-state/financiamento-veiculo.test.ts`.
  - `pnpm lint`.
  - `git diff --check`.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build`.
  - Focused Playwright command after browser-capable server setup.
- Acceptance criteria:
  - Formula outputs match source-derived fixtures within cent-level rounding.
  - URL state is deterministic and source-versioned.
  - No vehicle-specific taxes, rates, CET, or insurance are silently assumed.
  - Page copy clearly says estimates can differ from bank/dealer proposals.
  - No app code or backlog status is changed by this planner run.

## Implementation Notes

- Status updates:
  - Planner selected rank 11 after treating rank 10 as ineligible due completed automation work recorded outside the unmerged `origin/main` backlog status.
  - Plan created as `planned` on `2026-06-25`.
  - Creator set `docs/calculator-backlog.md` rank 11 to `In Progress` and this plan status to `in_progress` before app edits.
  - Backlog rank 11 marked `Done` and this plan marked `verified` after implementation, review gate, and tester validation passed.
- Files changed:
  - `docs/calculator-plans/financiamento-veiculo.md`.
  - `docs/calculator-backlog.md` rank 11 status only.
  - `lib/calculators/financiamento-veiculo.ts`.
  - `lib/calculators/financiamento-veiculo.test.ts`.
  - `lib/url-state/financiamento-veiculo.ts`.
  - `lib/url-state/financiamento-veiculo.test.ts`.
  - `lib/url-state/index.ts`.
  - `components/calculators/financiamento-veiculo/amortization-table.tsx`.
  - `components/calculators/financiamento-veiculo/calculator-form.tsx`.
  - `components/calculators/financiamento-veiculo/financiamento-veiculo-calculator-client.tsx`.
  - `components/calculators/financiamento-veiculo/results-summary.tsx`.
  - `app/[locale]/calculadoras/financiamento-veiculo/layout.tsx`.
  - `app/[locale]/calculadoras/financiamento-veiculo/page.tsx`.
  - `lib/constants.ts` registry addition.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` calculator copy.
  - `tests/e2e/financiamento-veiculo.spec.ts`.
- Validation results:
  - Overlap check completed against existing routes, `lib/calculators`, `lib/url-state`, `components/calculators`, `messages`, `lib/constants.ts`, and existing calculator plans.
  - Formula/source validation completed with stable Price/SAC formula contract and explicit exclusions for current-rate/tax/CET automation.

## Tester Validation - 2026-06-26

- Status: passed. Backlog rank 11 marked `Done`; this plan marked `verified`.
- Playwright coverage:
  - Updated `tests/e2e/financiamento-veiculo.spec.ts` to explicitly assert default Price summary values (`R$ 60.000,00`, `R$ 1.758,74`, `R$ 24.419,51`, `19,42%`), source/disclaimer copy, first amortization row values, full share query params, restored form values, restored `price` method, restored comparison flag, visible comparison table, and save callback preservation.
  - Command passed: `CI=true PLAYWRIGHT_WEB_SERVER_COMMAND='node node_modules/next/dist/bin/next dev --hostname localhost --port 3100' node node_modules/@playwright/test/cli.js test tests/e2e/financiamento-veiculo.spec.ts` - 5 passed.
  - Note: `pnpm run test:e2e -- tests/e2e/financiamento-veiculo.spec.ts` did not reach Playwright in this worktree because pnpm attempted dependency repair and stopped on unresolved `allowBuilds` entries in `pnpm-workspace.yaml`. No dependency policy files were changed.
- Browser coverage:
  - PT-BR default route loaded with expected heading/form, no redirect loop, no document horizontal overflow, and no clean-tab console errors or hydration-error text.
  - Default Price flow displayed financed amount, installment, total interest, total paid, annual equivalent rate, formula/source copy, disclaimer copy, comparison table, and amortization rows.
  - SAC query fixture restored `sv=2026-06-25&vv=1000&en=0&cf=0&ca=0&tm=3&pm=4&mt=sac&cmp=1`, selected SAC, kept comparison enabled, displayed `R$ 280,00 / R$ 257,50`, total interest `R$ 75,00`, and the four expected amortization rows.
  - Unauthenticated save redirected to `/entrar` and preserved callback query `sv=2026-06-25`, `vv=80000`, `en=20000`, `cf=0`, `ca=0`, `tm=1.49`, `pm=48`, `mt=price`, and `cmp=1`.
  - High-rate, long-term, and low-entry warning copy appeared for `tm=10.01`, `pm=85`, and zero entry.
  - Mobile 390px viewport had no document-level horizontal overflow; primary form/result controls stayed within the viewport. The amortization table remains intentionally horizontally scrollable.
  - EN and ES smoke routes loaded localized headings/results, source badges, save/share controls, and no console errors.
  - In-app browser clipboard interaction was not used as evidence because the background document was not focused; the focused Playwright spec verifies share copy with clipboard permissions.
- Additional checks:
  - `node node_modules/eslint/bin/eslint.js tests/e2e/financiamento-veiculo.spec.ts` - passed.
  - `git diff --check` - passed.
  - `node node_modules/vitest/vitest.mjs run lib/calculators/financiamento-veiculo.test.ts lib/url-state/financiamento-veiculo.test.ts` - 2 files passed, 11 tests passed.
  - Orchestrator source check corrected unreachable Microsoft `/excel/functions/<slug-guid>` planner links to the reachable canonical Microsoft Support function URLs above; BCB JavaScript-shell pages and the BCB Resolution PDF were reachable on `2026-06-25`.
  - Initial `pnpm test -- lib/calculators/financiamento-veiculo.test.ts lib/url-state/financiamento-veiculo.test.ts` did not reach Vitest because the local pnpm wrapper hit `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/calculators/financiamento-veiculo.test.ts lib/url-state/financiamento-veiculo.test.ts` passed: 2 files, 11 tests.
  - Message JSON parse check passed for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - `./node_modules/.bin/eslint` passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/prisma generate` passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/next build` passed; only existing `metadataBase` warnings appeared.
  - `PORT=3102 NEXT_DIST_DIR=.next-e2e PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3102" ./node_modules/.bin/playwright test tests/e2e/financiamento-veiculo.spec.ts` passed 5/5 in browser-capable execution.
  - `git diff --check` passed.
- Tester findings:
  - Tester should independently verify PT-BR default flow, Price PMT fixture, SAC fixture, zero optional-cost URL restoration, unauthenticated save callback, high-rate/long-term/low-entry warnings, 390px mobile overflow, and EN/ES localized routes.
  - Confirm copy continues to avoid bank rates, IOF/CET automation, insurance/dealer-fee assumptions, credit advice, and official-contract claims.
- Final status:
  - Verified after implementation, review gate, and tester validation passed.
  - Draft PR created: https://github.com/saulodefaria/calculaderia/pull/29.
  - Backlog Done Ref set to the draft PR URL.
