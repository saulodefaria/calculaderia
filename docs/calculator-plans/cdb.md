---
slug: "cdb"
backlogRank: 15
primaryKeyword: "calculadora cdb"
decision: "new"
targetRoute: "/calculadoras/cdb"
status: "verified"
createdAt: "2026-06-26"
updatedAt: "2026-06-26"
---

# Calculadora CDB Plan

## Backlog Row

- Rank: 15
- Original status: Backlog
- Slug: cdb
- Primary keyword: calculadora cdb
- Cluster keywords: calculadora investimento cdb; calculadora cdb online
- Opportunity score: 65
- Idea type: New
- Notes: Could share logic with renda fixa but deserve focused CDB landing.
- Done ref: -

## Decision

- Decision: `new`.
- Target route: `/calculadoras/cdb`.
- Rationale: build a focused CDB estimator for users comparing a single CDB offer, with clear gross/net values, IR, IOF, and CDI assumptions. The existing `/calculadoras/renda-fixa` route is a broader multi-product comparator for Pre, CDI, IPCA+, and Selic; it does not give the CDB-specific explanation, URL contract, FGC caveat, and SEO fit required for `calculadora cdb`.
- Creator may proceed: yes, after revalidating the official source links on implementation day and preserving the no-current-rate/no-advice scope.

## Similarity Check

- Existing calculators/routes checked:
  - `/calculadoras/renda-fixa`: broad fixed-income comparator with Pre, CDI, IPCA+, Selic, IR/IOF, inflation, and ranking.
  - `/calculadoras/juros-compostos`: general compound-interest projection, no CDB tax table or CDB-specific content.
  - `/calculadoras/tir`: cash-flow return calculator, not a CDB estimator.
  - No existing `/calculadoras/cdb` route found.
- Related modules/translations checked:
  - `lib/calculators/renda-fixa.ts` already has reusable concepts for annual-to-daily rate conversion, IR regressivo, IOF table, gross/net values, and evolution series.
  - `lib/url-state/renda-fixa.ts` uses compact query params but has no source-version param; CDB should use its own versioned URL state.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` mention CDB inside guides and `renda-fixa`, but have no dedicated CDB calculator copy.
  - `lib/constants.ts` has category `investimentos-rendimentos`, which is the right existing category.
- Prior plans checked:
  - Existing plans in `docs/calculator-plans` cover labor/tax/payroll calculators already built in this worktree. No `docs/calculator-plans/cdb.md` existed before this planner run.
- Overlap conclusion:
  - Decision remains `new`, not `enhancement`, because the user intent is a single CDB product estimate and the backlog explicitly says CDB can deserve a focused landing page. Implementation may reuse/refine pure helper patterns from `renda-fixa`, but should not alter the broad comparator as part of this plan.

## User Intent And Scope

- Target user: Brazilian retail investor evaluating one CDB offer from a bank/brokerage and wanting a transparent estimate before investing or comparing manually.
- User job: enter principal, term, rate type, and tax assumptions to understand estimated gross value, IOF, IR, net value, and net yield for a CDB.
- In scope:
  - Single-application CDB estimate.
  - Two rate modes:
    - `pos-cdi`: CDB pays a percentage of CDI, with CDI annual expectation entered by the user.
    - `pre`: CDB pays a fixed annual effective rate entered by the user.
  - 252-business-day compounding convention for rate accrual.
  - Calendar-day term for IR regressivo and IOF regressivo.
  - Deterministic IR, IOF, gross return, net return, and annualized net return.
  - Optional display of estimated business days from calendar days using `round(prazoDiasCorridos * 252 / 365)`, plus an advanced override for exact business days when the user has the contract calendar.
  - Source/version badge: `sv=2026-06-26`.
  - FGC caveat as informational content only.
- Out of scope:
  - Automatic fetching of current CDI, bank CDB offers, spreads, or product rankings.
  - Investment advice, suitability analysis, recommendation of banks/products, or promise of yield/guarantee.
  - LCI/LCA comparison, IPCA+ CDB, Selic-only products, Tesouro Direto prices, or inflation-adjusted returns.
  - Credit-risk pricing, probability of bank default, FGC claim timing, liquidity restrictions, mark-to-market pricing, secondary-market sale, fees, brokerage-specific settlement, and come-cotas/fund taxation.
  - Holiday calendars. The calculator uses either the estimated business-day count or the user-entered business-day count.
- Sensitive-topic caveats:
  - Copy must state that results are estimates based on user-entered assumptions, not an investment recommendation.
  - FGC copy must not imply that every CDB is risk-free, instantly reimbursed, or always covered in full.
  - CDI copy must say the calculator does not fetch or update current rates automatically.

## Calculator Contract

- Inputs:
  - `modo`: `pos-cdi` or `pre`.
  - `valorInicial`: amount applied in BRL.
  - `prazoDiasCorridos`: days from application to redemption/maturity, counted in calendar days.
  - `diasUteis`: optional/advanced business-day count used for compounding. Default is derived from calendar days with `round(prazoDiasCorridos * 252 / 365)` and minimum `1`.
  - `percentualCdi`: only for `pos-cdi`; percentage of CDI paid by the CDB.
  - `cdiAnual`: only for `pos-cdi`; annual CDI expectation entered by the user.
  - `taxaPreAnual`: only for `pre`; fixed annual effective rate entered by the user.
- Defaults:
  - `modo`: `pos-cdi`.
  - `valorInicial`: `10000`.
  - `prazoDiasCorridos`: `365`.
  - `diasUteis`: derived as `252`.
  - `percentualCdi`: `100`.
  - `cdiAnual`: `10` as an editable example assumption, with helper copy telling users to replace it with their own CDI expectation.
  - `taxaPreAnual`: `12` as an editable example assumption for pre-fixed mode.
- Validation rules:
  - `valorInicial`: finite BRL value, `>= 0.01`, recommended max `100000000`.
  - `prazoDiasCorridos`: integer, `1` to `3650` by default. Allow future expansion only with tests for finite outputs.
  - `diasUteis`: integer, `1` to `2520`; must not exceed `ceil(prazoDiasCorridos * 260 / 365) + 5` unless the creator intentionally chooses a simpler max-only rule and explains it.
  - `percentualCdi`: finite, `0` to `300`.
  - `cdiAnual`: finite percent, `0` to `100`.
  - `taxaPreAnual`: finite percent, `0` to `100`.
  - Reject unsupported `modo`, missing required values, stale/unknown `sv`, and any combination that produces non-finite money/rate outputs.
  - Do not compute tax on negative or zero gross yield; with current validation rates are non-negative, but pure functions should still guard `rendimentoBruto <= 0`.
- Outputs:
  - `valorFinalBruto`.
  - `rendimentoBruto`.
  - `iofAliquota` and `iofValor`.
  - `irAliquota`, `baseIr`, and `irValor`.
  - `valorFinalLiquido`.
  - `rendimentoLiquido`.
  - `rentabilidadeBrutaPercent`.
  - `rentabilidadeLiquidaPercent`.
  - `taxaEfetivaLiquidaAnualPercent`, annualized from calendar days.
  - `diasUteisUsados` and whether they were estimated or user-entered.
  - Optional monthly/yearly evolution sampled from day `0` to `prazoDiasCorridos`, with tax shown at the final redemption point rather than implying daily liquidation.
- Result explanations:
  - Explain that CDB yield accrues according to the selected annual rate assumption over business days.
  - Explain IOF is applied before IR for short redemptions and only on positive gross yield.
  - Explain IR regressivo depends on calendar days held.
  - Explain that CDI-linked results depend heavily on the user-entered CDI expectation.
  - Explain that FGC coverage, when applicable, has limits and does not change the yield calculation.
- URL params:
  - Required source version: `sv=2026-06-26`.
  - `m`: `cdi` or `pre`.
  - `v`: principal.
  - `dc`: calendar days.
  - `du`: business days. Encode it even when derived so shared URLs are stable.
  - `pc`: percentage of CDI.
  - `cdi`: annual CDI expectation.
  - `pre`: fixed annual rate.
  - Optional future params must be ignored safely when unknown.
- Share/save behavior:
  - Share button should generate a canonical localized route URL with all active inputs and `sv=2026-06-26`.
  - Save button should use `calculatorId="cdb"` and preserve the generated query string in unauthenticated callback URLs.
  - If `sv` is missing or stale, restore defaults, show a non-blocking "source assumptions updated" warning, and regenerate share URL with the current `sv`.

## Formulas And Sources

- Source version:
  - `CDB_SOURCE_VERSION = "2026-06-26"`.
  - Source access date for all links below: 2026-06-26, America/Sao_Paulo.
- Formula summary:
  - `diasUteisEstimados = max(1, round(prazoDiasCorridos * 252 / 365))`.
  - `diasUteisUsados = diasUteis` from URL/form when valid, otherwise `diasUteisEstimados`.
  - Pre-fixed annual effective rate:
    - `taxaDia = (1 + taxaPreAnual / 100) ** (1 / 252) - 1`.
    - `valorFinalBruto = valorInicial * (1 + taxaDia) ** diasUteisUsados`.
  - CDI-linked rate:
    - `taxaCdiDia = (1 + cdiAnual / 100) ** (1 / 252) - 1`.
    - `taxaCdbDia = taxaCdiDia * (percentualCdi / 100)`.
    - `valorFinalBruto = valorInicial * (1 + taxaCdbDia) ** diasUteisUsados`.
  - `rendimentoBruto = max(0, valorFinalBruto - valorInicial)` for taxes; retain money outputs rounded to cents only after calculation.
  - IOF:
    - Use calendar days (`prazoDiasCorridos`) and the Decreto 6.306/2007 Anexo table.
    - If `prazoDiasCorridos` is `1..30`, `iofAliquota` is table value; if `> 30`, `0`.
    - `iofValor = rendimentoBruto * iofAliquota / 100`.
  - IR:
    - `baseIr = max(0, rendimentoBruto - iofValor)`.
    - IR aliquot by calendar days:
      - `<= 180`: `22.5%`.
      - `181..360`: `20%`.
      - `361..720`: `17.5%`.
      - `> 720`: `15%`.
    - `irValor = baseIr * irAliquota / 100`.
  - Net result:
    - `rendimentoLiquido = rendimentoBruto - iofValor - irValor`.
    - `valorFinalLiquido = valorInicial + rendimentoLiquido`.
    - `rentabilidadeLiquidaPercent = rendimentoLiquido / valorInicial * 100`.
    - `taxaEfetivaLiquidaAnualPercent = ((valorFinalLiquido / valorInicial) ** (365 / prazoDiasCorridos) - 1) * 100`.
- IOF table to embed from Decreto 6.306/2007 Anexo:
  - Day 1: 96%; 2: 93%; 3: 90%; 4: 86%; 5: 83%; 6: 80%; 7: 76%; 8: 73%; 9: 70%; 10: 66%.
  - Day 11: 63%; 12: 60%; 13: 56%; 14: 53%; 15: 50%; 16: 46%; 17: 43%; 18: 40%; 19: 36%; 20: 33%.
  - Day 21: 30%; 22: 26%; 23: 23%; 24: 20%; 25: 16%; 26: 13%; 27: 10%; 28: 6%; 29: 3%; 30: 0%.
- Data tables or assumptions:
  - IR and IOF are deterministic tables versioned by source date.
  - CDI is not embedded and is not fetched. `cdiAnual` is a user-entered estimate.
  - 252 business days/year is a market convention assumption used for deterministic CDB/CDI compounding; no official holiday calendar is embedded.
  - If creator later adds optional CDI lookup, it must be explicitly scoped, show the Banco Central observation date, require a freshness warning when the latest observation is older than two business days, and keep the user able to override the value.
- Official sources:
  - Planalto, Lei nº 11.033/2004, art. 1º and art. 23: IR regressivo for applications/operations from 2005-01-01. Link: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm
  - Planalto, Decreto nº 6.306/2007, art. 32 and Anexo: IOF over fixed-income operations, limited to yield by term table. Link: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm
  - Banco Central do Brasil, SGS time series API, series 12 (`bcdata.sgs.12`) for CDI daily reference. Link: https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/3?formato=json
  - Banco Central do Brasil, SGS/statistics landing page for source context. Link: https://www.bcb.gov.br/estatisticas/sgs
  - FGC, "Sobre garantia FGC": CDB/RDB listed among guaranteed products and coverage summary. Link: https://www.fgc.org.br/sobre-garantia-fgc
  - FGC FAQ: coverage details, including CDB/RDB and limits. Link: https://www.fgc.org.br/faq
- Source access dates:
  - All sources above accessed on 2026-06-26 America/Sao_Paulo.
  - Banco Central SGS series 12 API was reachable during planning and returned latest observations dated 2026-06-22, 2026-06-23, and 2026-06-24. These observations are not embedded as calculator constants.
- Rule/table effective dates:
  - IR table: Lei nº 11.033/2004, effective for relevant applications/operations from 2005-01-01 per art. 23. Planalto page referenced MPV nº 1.303/2025 with "vigência encerrada"; creator must revalidate before coding.
  - IOF source: Decreto nº 6.306/2007, DOU 2007-12-17 and retified 2008-01-08; art. 32 and Anexo table verified on access date.
  - FGC limits: official site text verified on access date states coverage up to R$ 250,000 per CPF/CNPJ per financial institution/conglomerate and maximum R$ 1 million over four years. Treat as caveat copy only, not a formula.
- Freshness or maintenance risk:
  - High for IOF and FGC because they can change by regulation/site update.
  - Medium/high for IR because tax rules can change, even though this table is long-lived.
  - High for CDI if any current-rate helper is added; no current CDI is embedded in this plan.
  - The source version must be bumped and stale URL behavior updated when any formula table/caveat changes.
- Estimator limitations:
  - Results are not quotes from a bank, not a guarantee of future CDI, and not advice.
  - CDB liquidity restrictions, penalties, and actual business-day counts may differ by issuer/contract.
  - Taxes are estimated on redemption/maturity; intermediate chart points are illustrative.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de CDB".
  - PT-BR meta description: "Calcule o rendimento bruto e líquido de um CDB prefixado ou atrelado ao CDI, com IR regressivo, IOF e premissas transparentes."
  - EN title: "CDB Calculator".
  - ES title: "Calculadora de CDB".
- Main form sections:
  - Investment: amount, calendar term, business-day method/override.
  - Rate type segmented control: `% do CDI` and `Pré-fixado`.
  - CDI mode fields: `% do CDI`, expected CDI per year.
  - Pre-fixed mode fields: fixed annual rate.
  - Assumptions/source disclosure: compact badge for `sv=2026-06-26`, 252-day convention, user-entered CDI.
- Results sections:
  - Summary cards: final net value, net yield, gross yield, total taxes.
  - Breakdown table: principal, gross yield, IOF, IR, net yield, final net value.
  - Rate details: gross/net percent and annualized net rate.
  - Tax explanation: selected IR bracket and IOF bracket.
  - Optional evolution chart/table sampled by term; keep it secondary and avoid implying daily liquidity.
- SEO sections:
  - "Como calcular o rendimento de um CDB".
  - "CDB prefixado x CDB atrelado ao CDI".
  - "IR e IOF no CDB".
  - "O que significa 100% do CDI".
  - "FGC no CDB: o que observar".
- FAQ topics:
  - Como calcular CDB 100% do CDI?
  - A calculadora usa o CDI atual?
  - Quando o IOF deixa de ser cobrado?
  - Qual IR incide no CDB?
  - CDB tem garantia do FGC?
  - CDB prefixado e pós-fixado usam a mesma fórmula?
- Disclaimer:
  - "Esta ferramenta faz uma estimativa com base nas taxas informadas por você. Ela não busca ofertas, não recomenda investimentos e não substitui a leitura do contrato, informe de rendimentos ou orientação profissional."
  - "FGC tem limites e condições; confira a fonte oficial antes de investir."
- Related calculator links:
  - `/calculadoras/renda-fixa`
  - `/calculadoras/juros-compostos`
  - `/calculadoras/tir`
  - `/guias/renda-fixa-cdi-ipca-selic`
- Translation guidance:
  - `pt-br`: use Brazilian tax/investment terminology directly: "CDB", "CDI", "IR", "IOF", "dias úteis", "dias corridos", "prefixado", "pós-fixado".
  - `en`: keep CDB/CDI as Brazilian product/index names and explain them as Brazilian bank CD/fixed-income terms; do not translate IR/IOF into US tax concepts.
  - `es`: keep CDB/CDI names and explain as Brazilian fixed-income product/index; avoid Spain/LatAm tax analogies.
  - All locales must include no-advice and no-current-rate copy.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/cdb.ts` with pure functions, constants, and exported source version.
  - Keep IR/IOF helper functions local or shared only if the creator intentionally refactors without changing existing `renda-fixa` behavior. Since this task scope is CDB, local helpers are acceptable.
  - Ensure money rounding happens at output boundaries; keep internal calculations unrounded where practical.
  - Guard non-finite results.
- URL state:
  - Add `lib/url-state/cdb.ts` and tests.
  - Include required `sv=2026-06-26`.
  - Encode explicit zero values where valid so shared URLs round-trip.
  - Decode stale/missing `sv` as defaults plus warning state, not silent wrong formulas.
  - Export through `lib/url-state/index.ts`.
- UI components:
  - Add `components/calculators/cdb/*` client, form, results summary, and breakdown table using existing calculator component patterns.
  - Use tabs/segmented control for mode, inputs for rates/amounts/days, tooltip/popover for CDI/FGC/source explanations.
  - Include share and save buttons.
- Route and metadata:
  - Add `app/[locale]/calculadoras/cdb/page.tsx` and `layout.tsx`.
  - Add metadata, JSON-LD, canonical route, FAQ content, source section, and disclaimer.
- Registry:
  - Add entry in `lib/constants.ts` with:
    - `id: "cdb"`.
    - `href: "/calculadoras/cdb"`.
    - `familyId: "calculadoras"`.
    - `primaryCategoryId: "investimentos-rendimentos"`.
    - `stateMode: "query"`.
    - `seoApplicationCategory: "FinanceApplication"`.
- Messages:
  - Add `calculators.cdb` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Include source/disclaimer strings and stale-source warning in every locale.
- Unit tests:
  - Add `lib/calculators/cdb.test.ts`.
  - Add `lib/url-state/cdb.test.ts`.
- E2E hooks/tests:
  - Add `tests/e2e/cdb.spec.ts` with stable selectors for amount, term, mode, rate inputs, share, save, source badge, and stale URL warning.
- Backlog updates:
  - Creator should mark backlog rank 15 and this plan `In Progress` only when implementation starts. This planner run must not edit `docs/calculator-backlog.md`.

## Test Plan

- Unit scenarios:
  - Pre-fixed one-year fixture: `valorInicial=10000`, `taxaPreAnual=12`, `prazoDiasCorridos=365`, `diasUteis=252` should produce gross `11200`, gross yield `1200`, IR bracket `17.5%`, IOF `0`, IR `210`, net final `10990`.
  - CDI one-year fixture: `valorInicial=10000`, `percentualCdi=100`, `cdiAnual=10`, `prazoDiasCorridos=365`, `diasUteis=252` should produce gross `11000`, IR `175`, net final `10825`.
  - CDI percentage fixture: 110% of 10% CDI should be higher than 100% using daily scaled CDI rate.
  - IR boundary tests for days `180`, `181`, `360`, `361`, `720`, `721`.
  - IOF boundary tests for days `1`, `2`, `29`, `30`, `31`.
  - Zero-yield scenario (`taxaPreAnual=0` or `cdiAnual=0`) should have no IOF/IR and final equals principal.
  - Derived business-day estimate: `365` calendar days gives `252`; short terms never produce below `1`.
  - Reject non-finite and out-of-range inputs.
- URL-state scenarios:
  - Current `sv=2026-06-26` round-trips both `m=cdi` and `m=pre`.
  - Explicit zero rates round-trip where valid.
  - Missing/stale `sv` returns default state with stale warning.
  - Unsupported mode or invalid numbers return null/default warning according to local pattern.
  - Share URL includes `sv`, `m`, `v`, `dc`, `du`, and the active rate fields.
- Browser scenarios:
  - PT-BR default route loads without unexpected console errors.
  - Changing amount/term/rate updates gross/net/tax values.
  - Switching between `% CDI` and `Pré-fixado` keeps layout stable and only shows relevant fields.
  - Short redemption shows IOF explanation and table bracket.
  - Source section shows access/source version and no-current-rate disclaimer.
  - FGC caveat visible but not presented as recommendation/guarantee of full recovery.
  - Share URL restores all values.
  - Unauthenticated save preserves generated callback query.
  - Stale `sv` URL shows warning and default/current source version.
  - 390px mobile viewport has no horizontal overflow or overlapping text.
  - EN and ES smoke routes show localized title, form labels, source/disclaimer, Share/Save.
- Playwright scenarios:
  - Focused e2e for default CDI fixture and pre-fixed fixture.
  - Focused e2e for IOF short-term fixture.
  - Focused e2e for share/save/stale-source/mobile/EN/ES smoke.
- Lint/build commands:
  - `./node_modules/.bin/vitest run lib/calculators/cdb.test.ts lib/url-state/cdb.test.ts`
  - `./node_modules/.bin/eslint`
  - `git diff --check`
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/next build`
  - `pnpm run test:e2e -- tests/e2e/cdb.spec.ts` when browser environment allows.
- Acceptance criteria:
  - Deterministic formula contract matches this plan.
  - No automatic current-rate fetching.
  - Source version and official links are visible.
  - All result math is finite and tested at IR/IOF boundaries.
  - Share/save URL preserves user-entered assumptions.
  - Backlog is only marked when creator starts implementation, not during planning.

## Implementation Notes

- Status updates:
  - 2026-06-26: Planned by automation worker from `docs/calculator-backlog.md` rank 15 only. `docs/tool-backlog.md` was not used.
  - 2026-06-26: Creator implementation started; backlog rank 15 marked `In Progress` before app code edits.
  - 2026-06-26: Tester run added missing CDB e2e coverage for manual business-day override, missing/stale/unsupported source-version warnings, and unsupported current-source mode handling.
  - 2026-06-26: Orchestrator completed in-app browser validation after sandbox Chromium was blocked, then marked this plan `verified` and backlog rank 15 `Done`.
- Files changed:
  - `docs/calculator-backlog.md` rank 15 status/notes.
  - `docs/calculator-plans/cdb.md` status and implementation notes.
  - `lib/calculators/cdb.ts` and `lib/calculators/cdb.test.ts`.
  - `lib/url-state/cdb.ts`, `lib/url-state/cdb.test.ts`, and `lib/url-state/index.ts`.
  - `components/calculators/cdb/calculator-form.tsx`.
  - `components/calculators/cdb/results-summary.tsx`.
  - `components/calculators/cdb/breakdown-table.tsx`.
  - `components/calculators/cdb/cdb-calculator-client.tsx`.
  - `app/[locale]/calculadoras/cdb/page.tsx` and `layout.tsx`.
  - `lib/constants.ts` CDB registry entry.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` CDB keys.
  - `tests/e2e/cdb.spec.ts`.
- Validation results:
  - Local overlap check found no existing CDB route/plan in this worktree.
  - Official source links revalidated on 2026-06-26 America/Sao_Paulo for IR, IOF, CDI source handling, and FGC caveat. Planalto Lei 11.033/2004 still exposed the IR brackets 22.5%/20%/17.5%/15% by term; Planalto Decreto 6.306/2007 still exposed art. 32/Anexo IOF table values; Banco Central SGS series 12 endpoint returned latest observations dated 2026-06-22, 2026-06-23, and 2026-06-24, which are not embedded; FGC guarantee/FAQ pages still listed CDB/RDB and the R$ 250,000 plus R$ 1 million/four-year caveats. Source version remains `2026-06-26`; no live CDI lookup or investment advice was added.
  - `./node_modules/.bin/vitest run lib/calculators/cdb.test.ts lib/url-state/cdb.test.ts`: passed 2 files / 16 tests.
  - Message JSON parse for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`: passed.
  - `./node_modules/.bin/eslint`: passed.
  - `git diff --check`: passed.
  - Initial `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/next build` compiled but failed typecheck because Prisma Client was not generated in this worktree; after `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public ./node_modules/.bin/prisma generate`, the same build command passed with existing metadataBase warnings only.
  - `pnpm run test:e2e -- tests/e2e/cdb.spec.ts`: blocked before Playwright by the known no-TTY pnpm dependency guard.
  - Direct Playwright against built server on `http://localhost:3112` was blocked before page load by Chromium MachPort `bootstrap_check_in ... Permission denied (1100)`; no CDB page assertions executed in this sandbox.
  - Tester `./node_modules/.bin/vitest run lib/calculators/cdb.test.ts lib/url-state/cdb.test.ts`: passed 2 files / 16 tests.
  - Tester `./node_modules/.bin/eslint tests/e2e/cdb.spec.ts`: passed.
  - Tester `git diff --check`: passed.
  - Tester `./node_modules/.bin/playwright test --list tests/e2e/cdb.spec.ts`: passed discovery, 9 CDB tests listed.
  - Tester `pnpm run test:e2e -- tests/e2e/cdb.spec.ts`: blocked before Playwright by `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY`.
  - Tester direct Playwright command `PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3100" NEXT_DIST_DIR=.next-e2e ./node_modules/.bin/playwright test tests/e2e/cdb.spec.ts`: started the web server, but all 5 then-existing Chromium cases failed before page load with `FATAL:base/apple/mach_port_rendezvous_mac.cc:159 ... bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`. No CDB browser assertions executed. An unsandboxed retry was requested and rejected by approval policy, so no bypass was attempted.
  - Tester alternate HTTP smoke with `NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true NEXT_DIST_DIR=.next-e2e AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3114 NEXTAUTH_URL=http://localhost:3114 ./node_modules/.bin/next dev --hostname localhost --port 3114`: server started cleanly; `curl -L` returned `200` and `redirects=0` for `/calculadoras/cdb`, `/en/calculadoras/cdb?sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10`, `/es/calculadoras/cdb?sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10`, stale `sv=2026-06-25`, missing `sv`, and unsupported `sv=unsupported` URLs. Server-rendered HTML contained localized titles plus source/disclaimer/no-advice text. This HTTP smoke does not validate hydration, console errors, clipboard, save redirect, form interaction, or mobile overflow.
  - Orchestrator in-app browser validation on `http://localhost:3115`: passed PT-BR default CDI calculation (`R$ 10.825,00`, gross `R$ 1.000,00`, IR `R$ 175,00`), source/no-current-CDI/FGC/no-advice copy, visible Save/Share controls, unauthenticated save redirect with generated callback `/calculadoras/cdb?sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10`, generated URL restore, prefixado result (`R$ 10.990,00`, IR `R$ 210,00`), short IOF result (`R$ 10.008,31`, IOF `R$ 20,81`, IR `R$ 2,41`), manual business-day override (`du=240`, net `R$ 10.783,91`), stale/missing/unsupported `sv` default restore, unsupported current-source mode no-result handling, 390px mobile no horizontal overflow, EN/ES localized result and Save/Share controls, and no unexpected browser console errors.
- Tester findings:
  - Non-browser checks passed for the deterministic CDB formula and URL-state contract, including the requested default CDI fixture (`R$ 10.825,00`, gross `R$ 1.000,00`, IR `R$ 175,00`), prefixado fixture (`R$ 10.990,00`), short IOF fixture, and missing/stale/unknown `sv` default restore behavior.
  - HTTP smoke passed for PT-BR, EN, ES, stale, missing, and unsupported source-version URLs with no redirect loop and localized server-rendered title/source/disclaimer text.
  - Browser-capable validation passed through the in-app browser for hydration-level interaction, calculations, stale source handling, generated URL restore via save callback, mobile overflow, EN/ES routes, and console errors.
  - Direct ShareButton clipboard copying could not be validated in the in-app browser because that runtime denies `navigator.clipboard.writeText` even after the browser is made visible. The generated share URL semantics are covered by URL-state unit tests, focused e2e coverage, and the SaveButton callback browser check, which uses the same `generateCdbShareUrl` path.
  - E2E coverage now exists for default CDI/share/save restore, prefixado, short IOF, manual business-day override, stale/missing/unsupported `sv`, unsupported current-source mode, 390px mobile, and EN/ES smoke.
- Final status:
  - `verified`; backlog rank 15 marked `Done` with draft PR https://github.com/saulodefaria/calculaderia/pull/33 recorded in `Done Ref`. Remaining environment caveat: sandbox Playwright/Chromium cannot launch here, and the in-app browser blocks clipboard writes, so direct share-button clipboard success should still be exercised by CI/browser-capable Playwright.
