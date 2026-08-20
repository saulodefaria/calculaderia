---
slug: "financiar-ou-juntar-dinheiro"
backlogRank: 101
primaryKeyword: "financiar ou juntar dinheiro para comprar imóvel"
decision: "new"
targetRoute: "/calculadoras/financiar-ou-juntar-dinheiro"
status: "verified"
createdAt: "2026-08-20"
updatedAt: "2026-08-20"
---

# Financiar ou juntar dinheiro para comprar imóvel

## Backlog Row

- Kind: `calculator`.
- Rank: `101`.
- Original status/stage: `In Progress` / `planning`.
- Slug: `financiar-ou-juntar-dinheiro`.
- Primary keyword: `financiar ou juntar dinheiro para comprar imóvel`.
- Cluster keywords: `financiamento vs juntar dinheiro`; `comprar imóvel à vista ou financiado`; `quanto tempo para comprar imóvel à vista`.
- Idea type: `New`.
- Opportunity score, notes, and done ref: not supplied in the authoritative row.
- Branch: `codex/financiar-ou-juntar-dinheiro-calculator`.
- Plan path: `docs/calculator-plans/financiar-ou-juntar-dinheiro.md`.
- Target route: `/calculadoras/financiar-ou-juntar-dinheiro`.

## Decision

- Decision: `new`.
- Target route: `/calculadoras/financiar-ou-juntar-dinheiro`.
- Rationale: create a focused decision aid for financing the property now versus continuing to rent while investing the same starting capital and a user-declared monthly amount until the appreciated cash price can be paid. It answers the waiting-time/shortfall question and summarizes the alternative loan; it does not choose a universal winner.

## Similarity Check

- Existing routes checked: `financiamento`, `financiamento-minha-casa-minha-vida`, `alugar-vs-comprar`, `juros-compostos`, `investimento`, `renda-fixa`, `comparativo`, and `consorcio` under `app/[locale]/calculadoras`.
- `alugar-vs-comprar` compares month-by-month net worth for a financed owner and a renter who invests the difference between installment and rent. This route instead projects a dedicated cash-purchase fund against a moving property-price target and finds the first affordable month.
- `financiamento` already owns the generic SAC/Price schedule. Reuse `calcularFinanciamento` and its `MetodoAmortizacao`/schedule result; do not fork the amortization formulas.
- Related modules checked: `lib/calculators/financiamento.ts`, `lib/calculators/alugar-vs-comprar.ts`, their `lib/url-state` modules, `components/calculators/*`, `lib/constants.ts`, and localized calculator messages.
- Existing registry taxonomy fits: family `calculadoras`, primary category `moradia-patrimonio`, secondary categories `financiamento-credito` and `investimentos-rendimentos`; no new family/category is needed.
- No route, logic module, translation namespace, or prior plan was found for this slug. The target route matches the keyword and is distinct enough to keep.

## User Intent And Scope

- Target user: someone with capital for an entry payment who is deciding between buying a home with a loan now and renting while building enough invested cash to buy later.
- User job: understand the loan's nominal cost, whether the cash fund reaches the rising property price inside a chosen horizon, the first affordable month when it does, and the remaining shortfall when it does not.
- In scope:
  - One property, one starting-capital amount used as down payment in the finance scenario and as initial investment in the wait scenario.
  - SAC or Price loan with a fixed annual effective rate and fixed term.
  - Compound property appreciation, compound net investment return, a constant end-of-month net saving contribution, rent and rent growth, and a finite projection horizon.
  - Finance summary, cash-fund timeline, first affordable month, horizon shortfall/surplus, reached status, and a conservative proof-only `never reached under these assumptions` status.
- Out of scope: credit approval, affordability from income, CET, insurance, taxes, closing/registry/brokerage/moving/maintenance costs, FGTS/subsidies, inflation or tax on investments, liquidity/volatility/default risk, rent deposit, a post-purchase wealth comparison, and individualized buy/finance/invest advice.
- Important interpretation: `monthly savings after rent` is the amount the user can invest after paying that month's rent. Rent is therefore tracked for context and total occupancy cost but is not subtracted from the contribution again. The contribution stays nominally constant; users must change it if they expect rising rent to reduce future savings.

## Calculator Contract

### Inputs and defaults

| Field | Type/unit | Default | Validation |
| --- | --- | --- | --- |
| Property value today | BRL | `500000` | finite, `> 0`, max `1e12` |
| Starting capital / down payment | BRL | `100000` | finite, `>= 0`, `<= property value`, max `1e12` |
| Amortization method | enum | `sac` | `sac` or `price` |
| Financing annual effective interest | percent p.a. | `10` | finite, `>= 0`, `<= 100` |
| Financing term | whole months | `360` | integer, `1..600` |
| Property appreciation | percent p.a. | `5` | finite, `0..50` |
| Net monthly savings after rent | BRL/month | `3000` | finite, `>= 0`, max `1e9` |
| Net investment return | percent p.a. | `8` | finite, `0..100` |
| Rent in month 1 | BRL/month | `2500` | finite, `>= 0`, max `1e9` |
| Annual rent growth | percent p.a. | `5` | finite, `0..50` |
| Projection horizon | whole months | `360` | integer, `1..1200` |

- Accept localized display input but normalize to plain finite numbers before calling pure logic. Do not accept `NaN`, infinity, scientific-notation surprises, negative zero, partial parses, or silently clamp invalid values.
- When starting capital equals property value, return `already-affordable` at month `0` and mark financing as unnecessary; do not call the shared engine with principal zero.
- Use full-precision numbers for recurrence/comparison and round only display/currency outputs to cents. A valid result never contains `NaN` or infinity.

### Outputs

- `financeNow`:
  - financed principal (`property value - down payment`), method, term, first and last installment, total interest, sum of installments, total acquisition cash outflow (`down payment + installments`), and projected property value at the end of the loan term;
  - for Price, first and last installments are equal within the engine's cent-rounding behavior; for SAC, show the decreasing range;
  - label interest-only math clearly: these figures are not CET and exclude taxes, insurance, fees, and indexation.
- `waitForCash`:
  - status: `already-affordable`, `reached-within-horizon`, `not-reached-within-horizon`, or `never-reached-under-assumptions`;
  - first affordable month and approximate years/months only for the first two statuses;
  - invested balance, projected cash property price, and `max(price - balance, 0)` shortfall at the horizon (plus surplus when applicable);
  - accumulated rent through the first affordable month, or through the horizon when not reached; month-1 and final considered rent;
  - a sparse yearly timeline plus the exact crossing/horizon row, not an unbounded 1,200-row default table.
- Comparison copy explains the trade-off without declaring a recommendation: financing provides access now with interest/omitted costs; waiting avoids loan interest but exposes the target to appreciation and requires continued rent and disciplined saving.

### Monthly timing contract

- Month `0` is today. Starting investment is `S_0 = C`; cash property price is `P_0 = V`. Test affordability at month `0` before any loan or projection.
- Convert every annual effective rate to a monthly factor: `I = (1 + investmentRateAnnual / 100)^(1/12)`, `G = (1 + appreciationAnnual / 100)^(1/12)`, and `L = (1 + rentGrowthAnnual / 100)^(1/12)`.
- For each month `m >= 1`, the existing balance earns first, then the net saving `A` is deposited at the end of the month: `S_m = S_(m-1) * I + A`.
- The cash price at the end of month `m` is `P_m = V * G^m`. The first affordable month is the smallest integer `m` in `[0, horizon]` for which unrounded `S_m >= P_m`.
- Rent for month `m` is `Rent_m = Rent_1 * L^(m-1)` and is paid during that month. It does not change `S_m`, because `A` is explicitly net of rent. Sum rent only through the considered endpoint.
- Financing uses down payment at month `0` and shared SAC/Price installments at months `1..term`. Property appreciation is informational and never changes the fixed-rate payment schedule.

### URL state and share/save

- Add a versioned, compact, calculator-specific query codec. Encode all fields so a shared default scenario remains stable across later default changes: `sv=1`, `vi` (value), `cp` (capital), `mt=s|p`, `jf` (finance annual rate), `pf` (finance months), `ai` (appreciation), `ap` (monthly saving), `ri` (investment annual return), `al` (rent), `ra` (rent annual growth), and `h` (horizon).
- Decoder behavior: accept only the version and complete valid state; map `s/p` to `sac/price`; ignore unknown keys; return `null` atomically for missing, duplicated, malformed, out-of-range, or non-finite known values so the UI falls back to defaults with a localized notice. Never partially mix a bad URL with defaults.
- Share uses the locale route plus the encoded state, preserves no result-derived values, and provides copied/success/error feedback. Canonical/metadata URLs omit query parameters.
- Save/favorite uses `calculatorId="financiar-ou-juntar-dinheiro"`. For unauthenticated users, the sign-in callback must preserve locale, route, and the complete compact query; returning restores and recalculates the same state.

## Formulas And Sources

### Pure formula contract

- Implement a new pure orchestrator such as `calcularFinanciarOuJuntarDinheiro(inputs)`. It calls `calcularFinanciamento({ valorEmprestimo: V, valorEntrada: C, taxaJurosAnual, meses: term, correcaoAnualImovel: appreciation }, method)` for a positive financed principal and adapts its result; no SAC/Price formula duplication.
- The shared financing engine converts an annual effective rate with the repository math helper. Creator must add/reuse a zero-interest branch for both methods if the current Price helper cannot handle `0%`: payment/amortization is `principal / n`, interest is zero, and final balance is zero after cent-safe final-row adjustment.
- Closed-form check for the end-of-month savings recurrence:
  - if `I != 1`, `S_m = C * I^m + A * (I^m - 1) / (I - 1)`;
  - if `I = 1`, `S_m = C + m * A`.
- Generate visible timeline values iteratively under the timing contract, while tests cross-check the recurrence against the closed form. Make the final amortization/savings comparisons with unrounded internal values; currency formatting is presentation only.
- Shortfall at month `m`: `max(P_m - S_m, 0)`; surplus: `max(S_m - P_m, 0)`.
- Total rent through month `n`: iterative sum or, for a test oracle, `Rent_1 * (L^n - 1) / (L - 1)` when `L != 1`, otherwise `n * Rent_1`.

### Conservative never-reached proof

- Never infer `never` merely because no crossing occurs inside the selected horizon. First enumerate months `0..H`. If none crosses, apply only the following proof under the validated nonnegative rates/contributions; otherwise return `not-reached-within-horizon`.
- Let `q_m = S_m / P_m`, with positive `P_m`. If `C = 0` and `A = 0`, the fund stays zero: return `never-reached-under-assumptions`.
- If `G < I` and either `C` or `A` is positive, the fund can eventually outgrow the property; do not return `never`. If `G = I = 1` and `A > 0`, the linear contributions eventually cross; do not return `never`.
- If `G = I > 1`, `q_m` increases toward `q_infinity = (C + A / (I - 1)) / V`. Return `never` only when that analytical upper limit is strictly below `1` by the numeric safety tolerance. At equality/near equality, fall back to `not-reached-within-horizon`; with `A = 0`, the same rule reduces to the constant ratio `C / V`.
- If `G > I`, the ratio is unimodal because `q_(m+1) <= q_m` exactly when `S_m >= T`, where `T = A / (G - I)`. Find the first integer `k >= H` satisfying that threshold (use the closed form/inverse, then correct adjacent integers against the inequality; for `I = 1`, use the linear solution). The maximum ratio from `H` onward is at `k`. Return `never` only if the exact candidates around the corrected turning index prove `q_k < 1` by tolerance; otherwise return `not-reached-within-horizon`.
- Use a documented small relative tolerance only to avoid a false `never` from floating-point error (for example, require an upper bound `< 1 - 1e-12`). Equality or numerical ambiguity always yields `not-reached-within-horizon`. Unit tests must independently cover each growth-order branch and near-equality fallback.

### Official educational sources

- Banco Central do Brasil, financial citizenship/education material on interest and financial planning: https://www.bcb.gov.br/cidadaniafinanceira — accessed `2026-08-20`. Use for Brazilian educational context only; it does not prescribe this decision model or forecast rates/property prices.
- Investor.gov, Compound Interest Calculator: https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator — accessed `2026-08-20`. Supports compound-growth plus recurring-contribution concepts; it does not cover Brazilian investment taxes, inflation, or property appreciation.
- Microsoft Support, FV function: https://support.microsoft.com/en-us/office/fv-function-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3 — accessed `2026-08-20`. Supports future-value timing and recurring-payment math; sign conventions differ from the positive-balance UI.
- Microsoft Support, PMT function: https://support.microsoft.com/en-us/office/pmt-function-0214da64-9a63-4996-bc20-214433fa6441 — accessed `2026-08-20`. Supports fixed-payment annuity math and explicitly does not add taxes/fees; SAC is supplied by the repository's existing tested engine rather than this source.
- Consumer Financial Protection Bureau, mortgage loan options/explainer: https://www.consumerfinance.gov/owning-a-home/loan-options/ — accessed `2026-08-20`. Supports explaining term/rate/payment trade-offs and omitted ownership costs; it is US educational material, not a statement of Brazilian lending rules or eligibility.
- No rule/table effective date applies: all rates, appreciation, rent growth, and contributions are user assumptions. Freshness risk is low for the math and moderate for explanatory links; review links/copy periodically without silently changing saved inputs.

## UI, SEO, And Content

- PT-BR title: `Financiar ou juntar dinheiro para comprar imovel?`.
- PT-BR meta description: `Compare o custo de financiar agora com o tempo para juntar e investir ate comprar um imovel a vista, considerando valorizacao, aluguel e aportes.`
- Form sections: `Imovel e capital inicial`, `Financiamento agora`, `Alugar e juntar`, and `Horizonte e premissas`; show annual-effective-rate helpers and the end-of-month contribution convention near the fields.
- Results sections: status hero; `Financiar agora` summary; `Juntar para comprar a vista` summary; horizon/crossing timeline; assumptions and omitted costs; methodology/sources.
- Status language must be literal: `atinge em X meses`, `nao atinge dentro de H meses`, or `nao atinge em nenhum mes sob estas premissas (prova matematica)`. Never turn the latter into a real-world certainty.
- SEO body: explain cash-price target versus investment balance, how appreciation and compound return compete, how SAC differs from Price, why rent is not double-counted, what the horizon means, and costs omitted by a simplified simulation.
- FAQ topics:
  - E melhor financiar ou esperar para comprar a vista?
  - Como calcular quanto tempo falta para comprar um imovel a vista?
  - A valorizacao do imovel pode superar meus investimentos?
  - SAC ou Price muda a simulacao de juntar dinheiro?
  - O aluguel e descontado do aporte mensal?
  - A simulacao inclui CET, impostos e custos de compra?
  - O que significa `nunca atinge sob estas premissas`?
- Disclaimer: educational deterministic estimate, not financial/investment/credit advice or a promise of returns, appreciation, rent, approval, or future price. Encourage users to compare actual CET, fees, taxes, insurance, liquidity, risk, and household budget with qualified professionals.
- Privacy: calculation and query-state sharing are client-side and require no server submission of financial inputs. Warn that a shared URL contains the entered amounts; saving follows the existing account/favorite privacy behavior and must not introduce analytics payloads with raw financial fields.
- Related links: `/calculadoras/financiamento`, `/calculadoras/alugar-vs-comprar`, `/calculadoras/juros-compostos`, `/calculadoras/investimento`, and `/calculadoras/renda-fixa`.
- Translation guidance:
  - Add complete `pt-br`, `en`, and `es` namespaces with identical keys; no hard-coded result/validation/metadata strings.
  - PT-BR: use `entrada`, `aporte mensal liquido depois do aluguel`, `valorizacao`, `saldo investido`, `a vista`, `SAC`, `Price`, and `CET`.
  - EN: explain Brazilian `SAC` and `CET` on first use; use `cash purchase`, `down payment`, `monthly savings after rent`, and `property appreciation`. Do not imply CFPB rules apply in Brazil.
  - ES: use `compra al contado`, `cuota inicial`, `ahorro mensual despues del alquiler`, `valorizacion del inmueble`, and explain `SAC`/`CET`; do not translate financial labels into false local equivalences.
  - Localize currency, percentages, pluralized month/year labels, decimal separators, validation, status, share/save feedback, source limitations, disclaimer, FAQs, and metadata.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/financiar-ou-juntar-dinheiro.ts` and `.test.ts` with typed inputs/results, validation, recurrence, crossing search, rent totals, never-proof helper, and adapter to the shared financing engine.
  - Reuse `lib/calculators/financiamento.ts`; if necessary, make the smallest shared zero-rate/final-cent fix with regression tests for existing financing consumers.
- URL state:
  - Add `lib/url-state/financiar-ou-juntar-dinheiro.ts` and `.test.ts`; export from `lib/url-state/index.ts`.
- UI components:
  - Add `components/calculators/financiar-ou-juntar-dinheiro/financiar-ou-juntar-dinheiro-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, and `projection-table.tsx` (or equivalent small composition).
  - Reuse existing form, currency/percent formatting, result-card, share, save, source, and responsive-table patterns. Add stable accessible labels, descriptions, validation links, headings, live result status, and `data-testid` hooks only where semantic selectors are insufficient.
- Route and metadata:
  - Add `app/[locale]/calculadoras/financiar-ou-juntar-dinheiro/page.tsx` and `layout.tsx`; use localized metadata, canonical/hreflang conventions, and calculator structured data already used by calculator routes.
- Registry:
  - Add the calculator to `lib/constants.ts` with `familyId: "calculadoras"`, `primaryCategoryId: "moradia-patrimonio"`, `categoryIds: ["moradia-patrimonio", "financiamento-credito", "investimentos-rendimentos"]`, `stateMode: "query"`, `seoApplicationCategory: "FinanceApplication"`, and no invented popularity rank.
- Messages:
  - Add `messages/pt-br/calculators/financiar-ou-juntar-dinheiro.json`, `messages/en/calculators/financiar-ou-juntar-dinheiro.json`, and `messages/es/calculators/financiar-ou-juntar-dinheiro.json`; update message-loading/type manifests only if the repository pattern requires it.
- E2E:
  - Add `tests/e2e/financiar-ou-juntar-dinheiro.spec.ts`.
- Backlog/status changes remain orchestrator-owned; creator/tester must not edit the DB from this plan.

## Test Plan

### Unit scenarios

- Month timing: verify `S_0=C`; month 1 earns on `C` then adds `A`; `P_1=V*G`; month-1 rent is exactly the entered rent; first crossing is the smallest qualifying integer month.
- Closed-form/iterative agreement for zero and positive investment rates, including a known FV fixture and long horizons without `NaN`/infinity.
- `already-affordable` when `C=V`; no zero-principal finance-engine call.
- Reached fixture within horizon and exact-boundary equality fixture; verify first month, horizon balance/price, shortfall/surplus, and rent summed only to crossing.
- Not reached within horizon but eventually possible when `I>G`; must not be mislabeled `never`.
- Never proof: `C=A=0`; `G=I>1` with analytical limit below one; `G>I` with a corrected future turning point whose maximum ratio is below one.
- Conservative fallbacks: equal/near-equal upper bound, maximum ratio near one, and `G>I` whose future maximum can cross all return `not-reached-within-horizon`.
- Rent growth affects rent totals only, not investment balance; zero rent and zero rent growth work.
- Finance adapter matches direct `calcularFinanciamento` SAC and Price results for the same inputs; zero-interest SAC/Price have zero interest and close at zero balance.
- Validation boundaries for every field, whole months, capital greater than value, invalid enum, non-finite values, and maximum horizon.

### URL-state scenarios

- Full default and non-default `encode -> decode` round trips for both methods, zeros, maximum valid values, locale-independent decimals, and `sv=1`.
- Every required key is encoded, including defaults, so later default changes cannot alter an old shared URL.
- Missing/duplicated/malformed/out-of-range/non-finite known values and unknown version return `null` atomically; unknown unrelated keys are ignored.
- Share URL retains the locale path, contains no display/result fields, and recalculates the exact same result after reload.

### Browser and Playwright scenarios

- Default PT-BR route renders all sections, computes finite SAC and wait summaries, explains that savings are already net of rent, and exposes disclaimer/source links.
- Change to Price and verify the finance summary changes while the cash-purchase crossing path does not.
- Deterministic reached, horizon-only, and analytically proven never fixtures render the exact localized status and never overstate a horizon miss.
- Share/copy/reload restores all inputs and results. Save while signed out redirects to login with an encoded callback; return restores state. Verify signed-in favorite behavior with existing fixtures if available.
- Invalid query falls back as a whole with notice; browser back/forward remains stable and no URL update loop occurs.
- Mobile at about 390 px: no horizontal page overflow; form order, cards, timeline overflow treatment, touch targets, and long EN/ES status text remain usable.
- EN and ES smoke routes show localized metadata, labels, validation/status/disclaimer text, currency/percent formatting, and no missing-key output.
- No unexpected console errors, hydration warnings, failed resource requests, or raw financial inputs sent in analytics/network requests.

### Commands and acceptance criteria

- Focused unit/URL tests: `pnpm test -- lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts lib/calculators/financiamento.test.ts`.
- Lint changed files: `pnpm exec eslint app/[locale]/calculadoras/financiar-ou-juntar-dinheiro components/calculators/financiar-ou-juntar-dinheiro lib/calculators/financiar-ou-juntar-dinheiro.ts lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` (quote the glob-like route path if required by the shell).
- Full build: `pnpm build` with the repository-required environment.
- E2E: `pnpm run test:e2e -- tests/e2e/financiar-ou-juntar-dinheiro.spec.ts`.
- Final diff hygiene: `git diff --check`.
- Acceptance requires all three locales, registry/route discoverability, deterministic share/save restore, direct shared SAC/Price reuse, exact monthly timing, source/disclaimer/privacy content, focused unit and URL tests, Playwright desktop/mobile/locales, lint, and production build to pass without regressions to `financiamento` or `alugar-vs-comprar`.

## Implementation Notes

- Plan status: `in_progress`; the orchestrator confirmed the authoritative DB item is `In Progress` with stage `implementation` before app code changed.
- DB status: unchanged by creator and intentionally remains `In Progress`; tester/orchestrator own final validation and the transition to `Done`.
- Files changed by creator:
  - pure logic/tests: `lib/calculators/financiar-ou-juntar-dinheiro.ts`, `lib/calculators/financiar-ou-juntar-dinheiro.test.ts`, plus the smallest zero-interest/final-cent fix and regression coverage in `lib/calculators/financiamento.ts` and `.test.ts`;
  - URL state/tests: `lib/url-state/financiar-ou-juntar-dinheiro.ts`, `.test.ts`, and the export in `lib/url-state/index.ts`;
  - UI/routes: `components/calculators/financiar-ou-juntar-dinheiro/*` and `app/[locale]/calculadoras/financiar-ou-juntar-dinheiro/{page,layout}.tsx`;
  - discoverability/localization: `lib/constants.ts`, the three localized calculator JSON files, and the matching entries in the three calculator catalogs;
  - browser coverage: `tests/e2e/financiar-ou-juntar-dinheiro.spec.ts`;
  - implementation handoff: this plan.
- Implemented contract notes: month-end contributions use unrounded recurrence comparisons; the shared SAC/Price engine is reused; timeline rows include month 0, annual rows, the exact crossing, and the horizon with rent frozen after crossing; invalid/duplicated/incomplete query state falls back atomically; browser back/forward remounts the controlled form from the complete query; the conservative never proof falls back on equality or numeric ambiguity.
- PR-review findings addressed:
  - fixed the `G > I > 1`, `A = 0` never-proof branch by treating its non-positive turning threshold as already reached, with a positive-capital/positive-return regression fixture;
  - added the localized, pluralized financing term to the finance summary and ICU plural rules for duration/term in all three locales, including a deterministic `1 ano e 1 mês` browser assertion;
  - added ICU plural branches for the outer reached/not-reached month count in all three locales, with deterministic reached-at-one-month and horizon-one-month browser assertions for PT-BR, English, and Spanish;
  - connected the first validation error to a stable alert id, `aria-invalid`, `aria-describedby`, and programmatic focus for every mapped control, including the Radix method trigger;
  - added positive-rate awkward-principal/term accounting invariants for shared SAC and Price schedules.
- Validation results:
  - `pnpm run validate:messages` — passed after aligning the calculator catalog title/description metadata with the detail files in all three locales;
  - `pnpm exec vitest run lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts lib/calculators/financiamento.test.ts` — passed, 3 files / 94 tests;
  - focused ESLint command from the plan (including the shared financing files) — passed;
  - `pnpm exec tsc --noEmit` — passed;
  - `pnpm run test:e2e -- tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed, 8 Chromium tests, including exact one-month status copy in all three locales;
  - `pnpm build` — passed after rerunning with network access for `next/font` Google Fonts; the first sandboxed attempt failed only because font download access was unavailable;
  - `git diff --check` — passed.
- Remaining tester focus: independent review of near-equality/turning-point never-proof fixtures, signed-in favorite behavior if an authenticated fixture is available, responsive table interaction on a real mobile browser, and final regression/browser validation before the orchestrator marks the DB item `Done`.
- Tester finding before the privacy fix (2026-08-20): **failed / release-blocked on analytics privacy; DB remained `In Progress` / `testing`.** Calculator math, URL restoration, localized UI, build, and the authored browser scenarios passed, but a network-level check proved that GA4 received the complete financial query string on page views.
- Tester DB verification:
  - `set -a; source .env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=calculator -v slug=financiar-ou-juntar-dinheiro -f scripts/backlog/get_item.sql` — passed after sandbox escalation and returned rank `101`, status `In Progress`, stage `testing`, branch `codex/financiar-ou-juntar-dinheiro-calculator`, plan path and target route matching this plan. Tester made no DB update.
- Tester automated verification:
  - `pnpm exec vitest run lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts lib/calculators/financiamento.test.ts lib/calculators/alugar-vs-comprar.test.ts` — passed, 4 files / 104 tests. This independently covered the new recurrence/never-proof branches, complete/atomic URL codec, shared SAC/Price behavior, and the adjacent rent-vs-buy regression.
  - `pnpm run validate:messages` — passed.
  - focused ESLint over the route, components, calculator/URL/shared-financing files, and focused e2e spec — passed before the final diagnostic-only request filter refinement.
  - `pnpm exec tsc --noEmit` — passed.
  - production `pnpm build` — first sandboxed run failed only because `next/font` could not reach Google Fonts; the network-enabled rerun passed and emitted the PT-BR, EN, and ES route variants. Existing `metadataBase` and edge-runtime warnings remained.
  - initial focused Playwright run — passed 8/8 Chromium tests. Covered default PT-BR SAC, Price switch with unchanged cash path, reached/horizon-only/proven-never exact copy, one-month pluralization in all locales, validation focus/ARIA, share reload, unauthenticated save callback, invalid URL atomic fallback, browser back navigation, EN/ES smoke, and 390 px no-page-overflow.
  - tester expanded only `tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` to cover failed responses/requests, the complete callback query, forward navigation, inner-table horizontal scrolling, and unexpected financial state in non-document/non-save requests. The diagnostic rerun reached all UI assertions but finished `2 passed / 6 failed` because GA/GTM requests were now observable; the failures are evidence of the privacy blocker below, not calculator rendering or formula failures. A final narrowing of the fake-ID request-failure filter was not rerun because the orchestrator requested immediate stop; the explicit decoded financial-request assertion remains in the spec.
- Tester browser/manual coverage:
  - Built-app PT-BR realistic scenario (`R$ 845.000`, `R$ 185.000` capital, `R$ 5.200` monthly saving, `9,5%` return, `6,2%` appreciation, `R$ 3.200` rent, 480-month horizon) restored every visible input and reported `Atinge em 128 meses (aproximadamente 10 anos e 8 meses)` with finite financing/wait values and the exact crossing row.
  - Visible methodology, rent-not-double-counted explanation, SAC/Price explanation, conservative-never explanation, all five source links, CFPB limitation, privacy notice, disclaimer, FAQs, and related links were present.
  - At `390 x 844`, visual inspection showed usable stacked fields/cards and result text. Measured document width stayed `390 / 390` with no page-level overflow; the projection table was intentionally scroll-contained (`308 px` client width / `815 px` scroll width) with the localized swipe hint. Browser warning/error logs were empty.
  - EN/ES route, label, currency, CET-limit, long status, and mobile smoke coverage passed in the initial focused Playwright run. No signed-in favorite fixture was available; unauthenticated save and full callback restoration were covered.
- Original release-blocking production finding and exact reproduction:
  1. Configure `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (the local test value was `G-XXXXXXXXXX`) and open `/calculadoras/financiar-ou-juntar-dinheiro?sv=1&vi=1200&cp=0&mt=s&jf=0&pf=12&ai=0&ap=100&ri=0&al=10&ra=0&h=24`.
  2. Inspect the request to `https://www.google-analytics.com/g/collect`.
  3. Its `dp` and `dl` values decode to the full route plus `vi`, `cp`, `jf`, `pf`, `ai`, `ap`, `ri`, `al`, `ra`, and `h`; therefore property value, capital, savings, rent, rates, term, and horizon are transmitted to analytics.
  - Likely owner files: `components/analytics/google-analytics-pageview.tsx` intentionally constructs `pathname + search`; `lib/analytics/ga4.ts` sanitizes only the payment-card validator before assigning `page_path` and `page_location`; matching regression coverage belongs in `lib/analytics/ga4.test.ts`. Production code was left read-only as required.
- Tester files changed: `tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` and this plan only. The temporary browser tab, viewport override, isolated Next cache, and tester-started servers were cleaned up/stopped.
- Tester-fix implementation (2026-08-20):
  - `lib/analytics/ga4.ts` now recognizes only the unprefixed PT-BR and `/en`/`/es` calculator routes, with optional trailing slash, and strips the complete query and fragment before setting GA `page_path` or `page_location`;
  - generic routes continue to retain their query string, and the payment-card validator continues to retain only `mascarado=0` when explicitly selected;
  - `lib/analytics/ga4.test.ts` covers sanitizer output for all six exact route shapes and actual pageview configuration for all three locale forms, asserting that no financial query key reaches GA;
  - the strengthened Playwright request monitor remains fail-closed for analytics and other non-document requests, while narrowly allowing the expected first-party GET/fetch to `/entrar` whose calculator callback state is separately asserted.
- Tester-fix validation:
  - `pnpm exec vitest run lib/analytics/ga4.test.ts lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts lib/calculators/financiamento.test.ts` — passed, 4 files / 106 tests;
  - `pnpm exec eslint lib/analytics/ga4.ts lib/analytics/ga4.test.ts tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed;
  - `pnpm exec tsc --noEmit` — passed;
  - `pnpm run test:e2e -- tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed, 8 Chromium tests with the fake GA id and network financial-state assertion active;
  - `git diff --check` — passed after the final note update.
- Focused analytics-oracle review fix (2026-08-20):
  - production analytics code stayed unchanged; only the calculator Playwright spec and these handoff notes changed;
  - the request guard now resolves the application origin from Playwright's configured `baseURL`, falling back safely to the page origin, and grants document/favorite/sign-in exemptions only to same-origin requests so matching third-party paths remain visible;
  - bounded decoding handles nested and malformed percent encoding without throwing, then checks URL and post data for every compact calculator key (`sv`, `vi`, `cp`, `mt`, `jf`, `pf`, `ai`, `ap`, `ri`, `al`, `ra`, and `h`);
  - the privacy assertion now runs in `afterEach` for every monitored page in every one of the eight scenarios, including PT-BR, English, Spanish, navigation, and the restored share page;
  - `pnpm exec vitest run lib/analytics/ga4.test.ts` — passed, 1 file / 12 tests;
  - `pnpm exec eslint tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed;
  - `pnpm exec tsc --noEmit` — passed;
  - `pnpm run test:e2e -- tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed, 8 Chromium tests with the fake GA id and strengthened per-test network oracle active;
  - `git diff --check` — passed after the final note update.
- Post-fix handoff: the analytics privacy blocker is resolved locally and ready for independent tester/orchestrator verification; the DB remains unchanged. Signed-in favorite creation/duplicate behavior remains unverified without an authenticated fixture; the existing unauthenticated callback behavior and its intentional first-party state transfer pass.
- Final independent tester rerun (2026-08-20): **PASS / ready for orchestrator finalization.** The former GA privacy blocker is closed, all focused calculator and browser gates pass, and the authoritative DB row intentionally remains `In Progress` / `testing` for the orchestrator.
  - DB source of truth: `set -a; source .env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=calculator -v slug=financiar-ou-juntar-dinheiro -f scripts/backlog/get_item.sql` — passed and reconfirmed rank `101`, status `In Progress`, stage `testing`, expected branch, plan, and target route. Tester made no DB mutation.
  - Exact sanitizer verification: `lib/analytics/ga4.test.ts` passed for the unprefixed PT-BR, `/en`, and `/es` route shapes, each with and without a trailing slash. Query and fragment are empty in the sanitized URL; `page_path` is the locale route only; `page_location` is origin plus that route only. The generic-query pageview fixture still retains its ordinary query, while both payment-card sanitizer fixtures retain their prior behavior.
  - Focused regressions: `pnpm exec vitest run lib/analytics/ga4.test.ts lib/calculators/financiar-ou-juntar-dinheiro.test.ts lib/url-state/financiar-ou-juntar-dinheiro.test.ts lib/calculators/financiamento.test.ts lib/calculators/alugar-vs-comprar.test.ts` — passed, 5 files / 116 tests.
  - Exact messages: `pnpm run validate:messages` — passed.
  - Relevant lint: focused ESLint over the new route/components, GA sanitizer/tests, calculator/shared-financing logic/tests, URL codec/tests, and calculator Playwright spec — passed.
  - TypeScript: `pnpm exec tsc --noEmit` — passed.
  - Final browser/network gate: with `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`, isolated Next cache, one Chromium worker, and the hardened request oracle active, `pnpm run test:e2e -- tests/e2e/financiar-ou-juntar-dinheiro.spec.ts` — passed, 8/8. The per-test `afterEach` assertion inspected every monitored page, including the restored share tab. After bounded decoding, actual GA `g/collect` traffic contained none of `sv`, `vi`, `cp`, `mt`, `jf`, `pf`, `ai`, `ap`, `ri`, `al`, `ra`, or `h` in `dp`, `dl`, URL, or post data. Same-origin-only exemptions remained limited to document navigation, explicit favorite save, and the separately asserted sign-in callback.
  - The same 8/8 browser run reconfirmed default PT-BR, Price switch, reached/horizon-only/proven-never states, exact pluralized messages, validation focus/ARIA, share reload, unauthenticated save callback, invalid URL atomic fallback, back/forward, EN/ES, no console/page/hydration errors, no unexpected request/response errors, 390 px no-page-overflow, and usable inner-table horizontal scrolling.
  - Production build with the fake GA id: the sandboxed first attempt failed only because `next/font` could not reach Google Fonts; the network-enabled rerun passed, including all three localized route variants. Existing `metadataBase` and edge-runtime warnings remained unrelated.
  - No separate new in-app manual pass was necessary because the earlier built-app desktop/mobile visual pass remains applicable and the post-blocker production delta was confined to analytics sanitization; the final Playwright run repeated all interactive, locale, state, responsive, console, and network paths against the fixed code.
  - Cleanup: Playwright stopped its web server; port `3142` had no listener afterward. The tester removed the isolated generated `.next-e2e-final-tester` cache and restored Next's generated `tsconfig.json` additions. No tester-started server remains.
  - Tester files changed in this final rerun: this plan only. Production files and the already-hardened Playwright spec were read-only; no test bug was found.
  - Residual limitation: signed-in favorite creation/duplicate behavior remains unverified because no authenticated fixture is available. The unauthenticated save callback preserves the full state and passes.
- Final status: `verified`; implementation, independent review, review fixes, analytics privacy remediation, and final tester validation passed. Draft PR: https://github.com/saulodefaria/calculaderia/pull/61. The backlog row is ready for the orchestrator's `Done` transition with this PR as its done reference.
