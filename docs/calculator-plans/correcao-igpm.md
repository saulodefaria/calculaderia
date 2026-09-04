---
slug: "correcao-igpm"
backlogRank: 0
primaryKeyword: "calculadora IGP-M"
decision: "new"
targetRoute: "/calculadoras/correcao-igpm"
status: "verified"
createdAt: "2026-08-29"
updatedAt: "2026-08-29"
---

# Calculadora de Correção IGP-M Plan

## Backlog Row

- Rank: not applicable; this is a direct user request, not a selected backlog row.
- Original status: not applicable.
- Slug: `correcao-igpm`.
- Primary keyword: `calculadora IGP-M`.
- Cluster keywords: `calcular IGP-M acumulado`, `corrigir valor pelo IGP-M`, `correção monetária IGP-M`, `valor corrigido IGP-M`, `IGP-M acumulado entre datas`, `atualizar valor de imóvel`, `quanto valeria meu imóvel pelo IGP-M`.
- Opportunity score: not available; no Ubersuggest metrics were supplied.
- Idea type: `New`, explicitly requested by the user.
- Notes: the user wants to enter a property's historical purchase price and purchase date and see the amount corrected through the latest official monthly IGP-M observation. The requested result must be framed as monetary correction, not an appraisal or claim about actual property appreciation.
- Done ref: not applicable.
- Coordination exception: Docker is stopped and the local `agent_backlog` database is unavailable. The parent agent explicitly authorized planning this user-directed request outside a claimed automated backlog row. The user's brief is authoritative. The planner must not query, claim, or update a backlog item, and the orchestrator must not call backlog mark scripts for this plan.

## Decision

- Decision: `new`.
- Target route: `/calculadoras/correcao-igpm`.
- Target calculator id: `correcao-igpm`.
- Category mapping: existing `calculadoras` family and existing `moradia-patrimonio` category. No new `ToolFamilyId` or `ToolCategoryId` is needed.
- Rationale:
  - The route directly describes the defensible job: correcting an amount by IGP-M. It avoids an SEO slug such as `valor-imovel-hoje`, which would overpromise a market appraisal.
  - The H1 and introductory copy can still meet the property-use intent with wording such as “atualize pelo IGP-M o valor que você pagou por um imóvel.”
  - The broad primary keyword `calculadora IGP-M` and the explanatory content can serve both the property-specific query and adjacent correction-between-dates queries without turning the tool into a generic appraisal product.
- Creator may proceed: yes. The official sources agree, Banco Central SGS series `28655` is available through August 2026, and the formula contract below matches the Banco Central Calculadora do Cidadão convention.

## Similarity Check

- Existing calculators/routes checked:
  - `/calculadoras/alugar-vs-comprar` estimates a buy-versus-rent scenario using user-entered property appreciation and rent correction assumptions; it does not contain an official historical IGP-M series.
  - `/calculadoras/financiamento` estimates financing, future property value from a user-entered annual appreciation rate, and optional rent correction; it is not historical monetary correction.
  - `/calculadoras/consorcio` uses user-entered annual correction assumptions for installments/rent; it does not calculate official IGP-M accumulation.
  - `/calculadoras/investimento`, `/calculadoras/juros-compostos`, and `/calculadoras/investimento-cdi` demonstrate compounding, URL-state, source-version, share, and save patterns, but have different user jobs and data contracts.
  - No existing `/calculadoras/correcao-igpm`, `/calculadoras/igpm`, or equivalent official historical correction route exists.
- Related modules/translations checked:
  - `lib/constants.ts` already defines the `moradia-patrimonio` calculator category and registers related housing calculators.
  - `lib/utils/aluguel.ts`, `lib/url-state/alugar-vs-comprar.ts`, `lib/url-state/financiamento.ts`, and housing calculator copy mention IGP-M only as a user-entered annual assumption.
  - `lib/calculators/investimento-cdi.ts` and `lib/url-state/investimento-cdi.ts` provide the nearest source metadata and compact query-state conventions.
  - Calculator copy is split across `messages/pt-br/calculators`, `messages/en/calculators`, and `messages/es/calculators`.
- Prior plans checked:
  - All files under `docs/calculator-plans`, especially `financiamento.md`, `investimento.md`, and `investimento-cdi.md`.
  - No prior IGP-M correction plan exists.
- Text search checked: `IGP-M`, `IGPM`, `imóvel`, `imobiliário`, `correção monetária`, and property appreciation terms across `app`, `components`, `lib`, `messages`, and plan directories.
- Overlap conclusion: build a new focused route. Do not merge it into the housing scenario calculators: those need forward-looking assumptions, while this tool compounds a published historical index and has a materially different source, date, and disclaimer contract.

## User Intent And Scope

- Target user: someone in Brazil who knows the BRL amount and month/year of a property purchase and wants to express that historical amount in IGP-M-corrected terms using the latest published full month.
- User job:
  - Enter the amount paid and the month/year of purchase.
  - See the amount after official monthly IGP-M correction through the latest available month.
  - Understand the accumulated factor, percentage change, months included, data freshness, and distinction from market value.
- In scope:
  - BRL amounts from July 1994 onward.
  - Monthly correction using the official higher-precision Banco Central SGS series `28655`.
  - An initial and final reference month, both included in the product, matching Banco Central methodology.
  - The final month defaults to the latest bundled observation; an advanced “corrigir até” month makes shared/historical calculations reproducible.
  - Corrected value, nominal difference, cumulative factor/rate, applied-month count, and yearly breakdown.
  - A static, version-controlled JSON snapshot and deterministic monthly updater; no database is needed.
- Out of scope:
  - Actual sale-price appraisal, broker valuation, comparable-property analysis, FipeZAP or cartório transaction prices.
  - Forecasting future IGP-M or future property value.
  - Property attributes such as location, floor area, rooms, condition, renovations, neighborhood demand, taxes, commissions, or liquidity.
  - Legal/contractual debt correction, rent-contract interpretation, penalties, interest, capital-gains tax, ITBI, financing balance, or accounting advice.
  - Pre-July-1994 currency conversion. Although the source series begins in June 1989, the product accepts only BRL purchase values and therefore must not interpret values originally paid in cruzados/cruzeiros as reais.
- Sensitive-topic caveats:
  - Label the primary result “valor corrigido pelo IGP-M,” never “valor de mercado,” “preço atual,” or “quanto seu imóvel vale hoje” without an immediate qualifier.
  - The result is a monetary-correction reference, not an appraisal, offer, accounting value, legal settlement, or guarantee.
  - IGP-M is a broad price index. FGV describes the IGP family as 60% IPA, 30% IPC, and 10% INCC; it is not an index of residential sale prices.

## Calculator Contract

- Inputs:
  - `valorOriginal`: BRL amount paid or base amount to correct.
  - `mesInicial`: purchase/base month in `YYYY-MM`.
  - `mesFinal`: ending reference month in `YYYY-MM`; defaults to the latest bundled full month and appears under an advanced period control.
- Defaults for the August 2026 snapshot:
  - `valorOriginal`: `500000`.
  - `mesInicial`: `2020-01`.
  - `mesFinal`: `2026-08` (latest bundled observation, not a hard-coded permanent default).
  - Formula/schema version: `1`.
- Validation rules:
  - `valorOriginal`: finite, `0.01` through `1000000000000`; store/calculate as a number, do not round before the final display boundary.
  - `mesInicial`: valid `YYYY-MM`, not earlier than `1994-07`, not later than `mesFinal`, and present in the bundled series.
  - `mesFinal`: valid `YYYY-MM`, not earlier than `mesInicial`, not later than the latest bundled observation, and present in the bundled series.
  - Reject any missing month in the inclusive interval rather than silently skipping it.
  - Reject unsupported formula versions, non-finite factors, a monthly factor `<= 0`, and non-finite outputs.
  - Same-month ranges are valid and apply that month's rate, matching the Banco Central convention; helper copy must make this explicit.
- Outputs:
  - `valorCorrigido`: `valorOriginal * fatorAcumulado`.
  - `diferencaNominal`: `valorCorrigido - valorOriginal`; may be negative for a deflationary interval.
  - `fatorAcumulado` at full calculation precision and formatted to at least 8 decimal places in the detail view.
  - `variacaoAcumuladaPercentual`: `(fatorAcumulado - 1) * 100`.
  - `quantidadeMeses`: count of observations in the inclusive interval.
  - `mesInicialUsado`, `mesFinalUsado`, latest source month, series code, retrieval date, and freshness status.
  - `resumoAnual`: for each calendar year intersecting the period, show months applied, compounded factor, and compounded percentage for those months; never sum monthly percentages.
- Result explanations:
  - “Este é o valor original corrigido pela variação acumulada do IGP-M entre os meses selecionados, incluindo o mês inicial e o final.”
  - “Não é uma estimativa do preço de venda do imóvel. O mercado pode variar de forma diferente do IGP-M.”
  - “Hoje” means the latest fully published and bundled IGP-M month, shown as `agosto de 2026` for this source snapshot; do not imply intramonth/live pricing.
- URL params:
  - `sv=1`: formula/schema version.
  - `v`: `valorOriginal` as an unformatted decimal.
  - `i`: `mesInicial` in `YYYY-MM`.
  - `f`: `mesFinal` in `YYYY-MM`.
  - Example: `/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08`.
  - Encode `f` even when it was the latest month. This preserves the shared result after a later monthly data update.
  - A restored URL whose `f` is older than the latest bundled month remains valid and shows a non-blocking “há dados mais recentes” action. A future/unavailable `f` is invalid and must not be silently clamped.
  - Ignore unknown future params safely. Missing/invalid required params restore defaults with a clear invalid-link notice; an unsupported `sv` restores defaults with a formula-version notice.
- Share/save behavior:
  - Share the complete active state including `sv` and both dates.
  - Save with `calculatorId="correcao-igpm"` and preserve the generated query in unauthenticated sign-in callbacks.
  - Shared links expose a financial amount and dates. They contain no required name, address, registration number, or property details, but privacy copy should still say anyone with the URL can see the entered scenario.

## Formulas And Sources

### Formula contract

- Let `r_m` be the monthly percent value from SGS `28655` for month `m`.
- Use the inclusive month set `M = {m | mesInicial <= m <= mesFinal}`.
- `fatorMensal_m = 1 + r_m / 100`.
- `fatorAcumulado = product(fatorMensal_m for m in M)`.
- `valorCorrigido = valorOriginal * fatorAcumulado`.
- `variacaoAcumuladaPercentual = (fatorAcumulado - 1) * 100`.
- `diferencaNominal = valorCorrigido - valorOriginal`.
- Keep full IEEE-754 number precision through the product and round only formatted currency output to cents. Store API decimals as strings in JSON so source precision is not lost during ingestion.
- Inclusive endpoints are deliberate: the Banco Central methodology states that both the initial and final month indices are used, and equal initial/final months apply one monthly index.

### Static data contract

- Add `data/indices/igpm.json` with a documented schema such as:

```json
{
  "seriesCode": 28655,
  "seriesName": "IGP-M - monthly variation consistent with index number",
  "unit": "percentPerMonth",
  "source": "Banco Central do Brasil SGS / FGV",
  "sourceUrl": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.28655/dados?formato=json&dataInicial=01%2F06%2F1989&dataFinal=31%2F08%2F2026",
  "retrievedAt": "2026-08-29",
  "firstObservation": "1989-06",
  "lastObservation": "2026-08",
  "observations": [
    { "month": "1989-06", "ratePercent": "19.6800000000" },
    { "month": "2026-08", "ratePercent": "-0.2248645646" }
  ]
}
```

- Snapshot verified on `2026-08-29` America/Sao_Paulo:
  - 447 contiguous monthly observations.
  - Full provenance range: June 1989 through August 2026.
  - First value: June 1989 = `19.6800000000%`.
  - Latest value: August 2026 = `-0.2248645646%`.
  - Calculable BRL UI range: July 1994 through August 2026; keep the earlier observations only for complete source provenance and updater integrity.
- Do not use SGS `189` as the calculation table. Series `189` is the rounded monthly publication series (August 2026 = `-0.22%`). Banco Central says its Calculadora do Cidadão has used `28655` since 2021-04-12 because it is consistent with FGV monthly index numbers at higher precision. Series `189` and the FGV press release may be used only as a rounded latest-month audit.

### Source-derived fixtures

- Inclusive `2020-01` through `2026-08` (80 months): factor `1.5898800177008408`; R$ 100,000.00 -> R$ 158,988.00; accumulated change `58.988001770084075%` before display rounding.
- Inclusive `2025-09` through `2026-08` (12 months): factor `1.0216088284005878`; R$ 100,000.00 -> R$ 102,160.88; accumulated change `2.1608828400587754%`, which rounds to the FGV headline `2.16%` over 12 months.
- Inclusive `2026-08` through `2026-08` (1 month): factor `0.997751354354`; R$ 100,000.00 -> R$ 99,775.14, proving the inclusive same-month/deflation contract.
- Inclusive `1994-07` through `2026-08` (386 months): factor `13.087663723098457`; R$ 100,000.00 -> R$ 1,308,766.37.
- Default current fixture: R$ 500,000.00 from `2020-01` through `2026-08` -> R$ 794,940.01 after currency display rounding.

### Official sources

- Banco Central do Brasil, Calculadora do Cidadão methodology: `https://www3.bcb.gov.br/CALCIDADAO/publico/metodologiaCorrigirIndice.do?method=metodologiaCorrigirIndice`
  - Defines the accumulated-product formula, includes both endpoint months, documents the April 2021 IGP-M precision change, and identifies series `28655` as the IGP-M correction series.
- Banco Central SGS API, source series `28655`: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.28655/dados?formato=json&dataInicial=01%2F06%2F1989&dataFinal=31%2F08%2F2026`
- Banco Central SGS series metadata/chart: `https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?hdOidSeriesSelecionadas=28655&method=consultarGraficoPorId`
- Banco Central FAQ, correction calculator scope/limitations: `https://www.bcb.gov.br/meubc/faqs/p/qual-o-objetivo-do-calculo-de-correcao-de-valores`
- FGV IBRE, IGP-M methodology (updated April 2021): `https://portalibre.fgv.br/metodologia/metodologia-igp-m-1`
- FGV IBRE, price indices and IGP-M collection/reference description: `https://portalibre.fgv.br/indices-de-precos`
- FGV IBRE, IGP composition: `https://portalibre.fgv.br/igp`
- FGV IBRE, August 2026 release: `https://portalibre.fgv.br/noticias/igp-m-cai-022-em-agosto`
  - Confirms August 2026 = `-0.22%`, 2026 year-to-date = `1.85%`, and 12 months = `2.16%` at publication precision.
- FGV IBRE publication calendar: `https://portalibre.fgv.br/calendario-de-divulgacao`

### Source dates, limitations, and maintenance

- All sources accessed on `2026-08-29` America/Sao_Paulo.
- FGV methodology page date: `2021-04-22`; methodology marked updated April 2021.
- Banco Central precision-series methodology effective for calculator runs since `2021-04-12`, including corrections for earlier periods.
- Latest FGV release date: `2026-08-28`; August 2026 is the latest full reference month available on the planning date.
- Add `scripts/update-igpm.mjs` and a package script such as `pnpm update:data:igpm`:
  - Fetch full SGS `28655` history from June 1989 through the current date using server-side Node `fetch`; never fetch from the browser at calculation time.
  - Normalize dates to `YYYY-MM` and preserve each decimal value as a string.
  - Validate series code, chronological order, uniqueness, monthly continuity, finite rates greater than `-100%`, metadata/last-observation agreement, and at least the current known count/range.
  - Compare all previously stored observations. Append new months automatically, but fail with a printed diff if an existing historical value changes so a maintainer explicitly reviews upstream revisions.
  - Do not overwrite the last verified JSON if the API is unavailable, malformed, discontinuous, or unexpectedly shorter.
  - Write deterministic formatted JSON. Change `retrievedAt` only when accepted source content changes, avoiding no-op churn.
  - Add `--check` mode for CI that validates the committed file without network access.
- Maintenance cadence:
  - Run the updater monthly after FGV publishes the closed IGP-M observation (normally near the end of the reference month) and commit the JSON diff.
  - Display “Dados oficiais até <month>” beside the result.
  - Treat a snapshot older than 45 days relative to runtime/build date as stale and show a visible non-blocking warning/link to the official source. Tests should inject a clock rather than depend on the wall clock.
  - A data update must update source metadata and latest-month fixtures/e2e expectations in the same commit. It must not change the formula `sv` unless calculation semantics change.
- Freshness risk: medium. One small new observation arrives monthly; the tool remains mathematically valid when stale but no longer answers “latest available” accurately, so freshness must be visible and maintained.
- Estimator limitations:
  - The SGS API republishes an FGV-origin series; Banco Central warns about lag/errors in third-party-origin data. The updater's rounded cross-check against the current FGV release reduces accidental ingestion risk.
  - A result can differ slightly from calculations based on rounded SGS `189` monthly rates. This is expected and is why `28655` is required.
  - Monthly correction cannot represent an exact purchase day inside the initial month. The inclusive-month convention is a published Banco Central calculator convention, not a day-level proration.
  - The result does not establish a property's fair market value.

## UI, SEO, And Content

- PT-BR H1: `Calculadora IGP-M: atualize o valor pago por um imóvel`.
- PT-BR meta title: `Calculadora IGP-M: corrija o valor do imóvel | Calculaderia`.
- PT-BR meta description: `Informe o valor e a data da compra para calcular a correção acumulada pelo IGP-M oficial. Veja fator, variação e série usada. Não é avaliação de mercado.`
- Main form sections:
  - `Valor e data da compra`: BRL amount and purchase/base month.
  - `Período da correção`: latest source badge and an advanced final-month selector defaulting to the latest observation.
  - Helper: both endpoint months are included; values before July 1994 are not supported because the input is in reais.
  - Actions: calculate, reset, share, save.
- Results sections:
  - Primary card: `Valor corrigido pelo IGP-M até agosto de 2026`.
  - Secondary cards: nominal difference, compounded percentage, correction factor, and month count.
  - Prominent adjacent notice: `Correção monetária, não avaliação de mercado` with a short explanation.
  - Source/freshness badge: FGV-origin series via Banco Central SGS `28655`, retrieval date, latest observation, and official links.
  - Yearly compounded breakdown, collapsed on small screens and accessible as a semantic table.
  - “Há dados mais recentes” action when a restored shared link intentionally ends before the latest month.
- SEO sections:
  - `Como corrigir um valor pelo IGP-M`.
  - `Quanto valeria pelo IGP-M o valor pago por um imóvel?` using conditional language.
  - `IGP-M não é valorização de imóvel`.
  - `Como o IGP-M acumulado entre datas é calculado`.
  - `Qual IGP-M a calculadora usa?` explaining SGS `28655` versus rounded `189` without overloading the hero.
  - `Por que a correção começa em julho de 1994?`.
  - `Dados até <latest month>` and maintenance/source disclosure.
- FAQ topics:
  - A calculadora mostra quanto meu imóvel vale hoje?
  - O IGP-M mede a valorização de imóveis?
  - O mês da compra entra no cálculo?
  - Por que o resultado pode cair em um período de IGP-M negativo?
  - Por que o resultado pode diferir de outra calculadora IGP-M?
  - Qual é o último IGP-M usado?
  - Posso corrigir valores anteriores ao Plano Real?
  - Posso usar o resultado em contrato, processo, aluguel ou imposto?
- Disclaimer:
  - `Esta ferramenta faz uma correção monetária educativa com a série histórica IGP-M indicada. O resultado não é avaliação de mercado, laudo, preço de venda, cálculo contratual ou orientação jurídica, contábil ou tributária. Localização, características, reformas, conservação, oferta e demanda podem fazer o preço real do imóvel variar de forma muito diferente. Para decisões importantes, consulte profissionais e as fontes oficiais.`
- Privacy guidance: calculation is local against bundled public data. No property address, owner identity, registration, or API request is required. Shared/saved URLs include the entered amount and period.
- Related calculator links:
  - `/calculadoras/alugar-vs-comprar`
  - `/calculadoras/financiamento`
  - `/calculadoras/financiamento-minha-casa-minha-vida`
  - `/calculadoras/juros-compostos`
- Structured data/metadata:
  - Use the registry's `FinanceApplication` category and existing calculator metadata pattern.
  - FAQ structured data may mirror visible FAQ content only; do not encode the result as a property valuation or investment return.
- Translation guidance:
  - Add matching `messages/pt-br/calculators/correcao-igpm.json`, `messages/en/calculators/correcao-igpm.json`, and `messages/es/calculators/correcao-igpm.json` with identical key shape.
  - `pt-br`: prefer `correção monetária`, `valor corrigido`, `mês inicial/final`, `dados oficiais até`, and `não é avaliação de mercado`. Use `IGP-M` consistently in user copy; include `IGPM` only naturally in SEO aliases if needed.
  - `en`: title `IGP-M Correction Calculator: Update a Property Purchase Price`. Keep IGP-M as a Brazilian FGV index, BRL currency, and Brazilian date context; do not substitute CPI or imply an English-language market appraisal.
  - `es`: title `Calculadora de corrección IGP-M: actualiza el precio de compra de un inmueble`. Keep the Brazilian index/BRL context; do not map it to a local CPI or housing index.
  - All locales must retain the inclusive-month explanation, July 1994 minimum, official source/freshness label, monetary-correction limitation, and market-appraisal disclaimer.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/correcao-igpm.ts` with typed inputs/results, snapshot metadata access, validation error codes, source/stale warnings, month-range enumeration, full-precision product, and yearly breakdown helpers.
  - Add `data/indices/igpm.json` from SGS `28655` with the exact 447-observation snapshot described above.
  - Add a JSON schema/type assertion or runtime validator used by tests/updater; a malformed/gapped static table must fail fast during validation rather than produce a partial result.
  - Keep display formatting outside pure calculator logic.
- Data updater:
  - Add `scripts/update-igpm.mjs`, `pnpm update:data:igpm`, and offline `--check` coverage as specified above.
  - Document the monthly command and upstream-revision review behavior in the script header or repository maintenance docs.
- URL state:
  - Add `lib/url-state/correcao-igpm.ts` and tests; export from `lib/url-state/index.ts`.
  - Implement `sv`, `v`, `i`, and `f` exactly as defined. Preserve older valid final months and distinguish stale shared data from invalid links.
- UI components:
  - Add `components/calculators/correcao-igpm/correcao-igpm-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, and `yearly-breakdown-table.tsx` following neighboring calculator composition.
  - Use accessible month/year controls, Brazilian money parsing, inline validation, source/freshness badge, `ShareButton`, and `SaveButton`.
  - Add stable `data-testid` hooks for corrected value, accumulated percent, factor, source badge, disclaimer, period, stale-data action, and yearly table.
- Route and metadata:
  - Add `app/[locale]/calculadoras/correcao-igpm/page.tsx` and `layout.tsx` using existing locale/metadata patterns.
  - Keep the calculator interactive client bounded within server-rendered explanatory/SEO sections.
- Registry:
  - Add an available `correcao-igpm` entry to `lib/constants.ts`, `Home` or `TrendingUp` icon, `familyId: "calculadoras"`, `primaryCategoryId/categoryIds: ["moradia-patrimonio"]`, `stateMode: "query"`, and `seoApplicationCategory: "FinanceApplication"`.
  - Add catalog translations/metadata in the existing locale catalog structure if the registry/catalog loader requires them.
- Messages:
  - Add all three calculator locale files with parity; run the repository message validator.
- Unit tests:
  - Add `lib/calculators/correcao-igpm.test.ts`, updater/data-integrity tests, and `lib/url-state/correcao-igpm.test.ts`.
- E2E hooks/tests:
  - Add `tests/e2e/correcao-igpm.spec.ts` for default result, custom period, same-month deflation, invalid pre-Real date, old shared final month, share/save restoration, locale routes, source/disclaimer visibility, and mobile overflow.
- Backlog updates: none for this coordination exception. Do not call backlog SQL scripts unless a future orchestrator explicitly associates the plan with a real claimed DB row.

## Test Plan

- Unit scenarios:
  - Data snapshot has exactly 447 unique contiguous months from `1989-06` through `2026-08`; August 2026 is `-0.2248645646` and series code is `28655`.
  - Calculation rejects a BRL start before `1994-07` even though earlier provenance observations exist.
  - Verify all four source-derived fixtures above at full factor precision and currency display rounding.
  - Verify Banco Central endpoint parity: initial and final months included, including one-month ranges.
  - Verify a negative rate/interval can produce a negative difference and is not clamped to zero.
  - Verify each yearly breakdown compounds the same underlying months and the product of yearly factors matches the overall factor within floating-point tolerance.
  - Reject start after end, final after the dataset, missing/gapped observations, duplicate months, invalid rates, `-100%` or lower rates, non-finite values, and unsupported formula version.
  - Verify no intermediate currency rounding changes the final fixture.
  - Data updater normalization is deterministic, accepts one valid appended month, rejects a truncated response, and flags historical revisions instead of silently overwriting.
  - Staleness helper behaves deterministically with an injected `now` at 44/45/46 days.
- URL-state scenarios:
  - Round-trip `sv=1&v=500000&i=2020-01&f=2026-08` without locale-format leakage.
  - Preserve zero-free valid decimals and old valid `f` months.
  - Unknown params ignored; invalid/missing `v/i/f`, pre-Real `i`, future `f`, start-after-end, and unsupported `sv` produce the documented safe state/warning.
  - Share URL and unauthenticated save callback preserve the exact active query.
- Browser scenarios:
  - PT-BR default page shows R$ 794,940.01, 58.9880% (per chosen display precision), `80 meses`, source series `28655`, “dados até agosto de 2026,” and the market-appraisal disclaimer.
  - Changing amount/date recalculates; a same-month August 2026 example visibly yields R$ 99,775.14 from R$ 100,000.00 and explains the included initial month.
  - A shared range ending before latest stays reproducible and offers an explicit update-to-latest action without auto-changing the result.
  - Pre-July-1994 selection is unavailable in normal controls; a forged query receives visible validation/default handling.
  - Yearly table is keyboard/screen-reader usable and does not overflow at 390 px width.
  - English and Spanish routes retain Brazilian IGP-M/BRL context and the same numerical result.
  - No browser call to BCB/FGV occurs; calculation works offline from the bundled JSON.
  - No unexpected console errors, hydration errors, or horizontal overflow.
- Playwright scenarios:
  - Default calculation and official source/disclaimer assertions.
  - Custom/source-derived fixture.
  - Share, restore, old final-month notice, update-to-latest action, and save callback.
  - Validation, locale parity, and mobile viewport.
- Validation commands:
  - `pnpm update:data:igpm -- --check`
  - `pnpm validate:messages`
  - `pnpm test -- lib/calculators/correcao-igpm.test.ts lib/url-state/correcao-igpm.test.ts`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm run test:e2e -- tests/e2e/correcao-igpm.spec.ts`
- Acceptance criteria:
  - A user can enter a BRL amount and purchase month from July 1994 onward and obtain a correction through the latest bundled official IGP-M month.
  - Calculation uses SGS `28655` values, not rounded SGS `189`, includes both endpoint months, and matches the documented fixtures/Banco Central convention.
  - The committed JSON contains the exact 447-observation June 1989-August 2026 snapshot, while UI validation prevents currency-misleading pre-Real calculations.
  - The page consistently calls the result IGP-M monetary correction and visibly says it is not property market value.
  - Source series, retrieval date, latest observation, freshness state, and official links are visible.
  - URL state is reproducible across monthly data updates; share/save preserve amount and both reference months.
  - Monthly data maintenance is deterministic, validates continuity/precision, and cannot silently rewrite history or destroy the last verified snapshot.
  - PT-BR, EN, and ES message files pass parity validation; unit, URL-state, e2e, lint, and production build validations pass.

## Implementation Notes

- Status updates: implementation complete on `codex/correcao-igpm-calculator`; plan remains `in_progress` until the orchestrator/tester completes the final handoff.
- PR-review findings addressed:
  - Reset now restores every local draft field and clears inline validation before notifying the parent state; Playwright covers edited, unsubmitted, invalid drafts followed by reset.
  - URL decoding now treats unknown-only query parameters as no calculator state, missing `sv` alongside owned fields as an invalid link, and only a present unsupported `sv` as a formula-version warning.
  - The form's latest-data badge now formats the bundled month with the active locale in UTC; PT-BR, EN, and ES assertions cover the localized label.
  - Runtime snapshot validation now enforces the canonical June 1989 start, the August 2026/count minimums, non-empty provenance, and the official HTTPS `api.bcb.gov.br` SGS 28655 endpoint while accepting valid future appended months.
- Files changed:
  - Official data and maintenance: `data/indices/igpm.json`, `scripts/update-igpm.mjs`, `scripts/update-igpm.test.ts`, and the `update:data:igpm` package script.
  - Pure logic and state: `lib/calculators/correcao-igpm.ts`, its tests, `lib/url-state/correcao-igpm.ts`, its tests, and the URL-state barrel export.
  - UI and route: the four files under `components/calculators/correcao-igpm`, localized `page.tsx`/`layout.tsx`, and `tests/e2e/correcao-igpm.spec.ts`.
  - Discovery/content: `lib/constants.ts`, all three calculator catalog files, and matching PT-BR/EN/ES detail message files.
  - Plan: this implementation-note/status update; planner content was preserved.
- Validation results:
  - `pnpm update:data:igpm -- --check`: passed; series 28655, 447 contiguous observations, exact June 1989/August 2026 endpoints.
  - `pnpm validate:messages`: passed.
  - `pnpm exec vitest run lib/calculators/correcao-igpm.test.ts lib/url-state/correcao-igpm.test.ts scripts/update-igpm.test.ts`: 3 files, 19 tests passed.
  - Review-fix rerun of the same focused Vitest command: 3 files, 23 tests passed.
  - Broad package-script run: 72 files/816 tests passed; one unrelated existing suite failed because `papaparse` is declared in the lockfile/package manifest but absent from this worktree's partial `node_modules` (`lib/tools/csv-json.test.ts`).
  - Focused ESLint and final `pnpm lint`: passed after deleting the temporary custom Next cache used for isolated browser validation.
  - Focused Playwright run without the repository-wide warmup: 6/6 passed (default/share/save, same-month deflation and forged pre-Real URL, old final month/update action, custom fixture, EN/ES, and 390px overflow).
  - Review-fix focused Playwright rerun without the unrelated global warmup: 7/7 passed, including reset of invalid unsubmitted drafts and localized latest-month badges.
  - Normal `pnpm run test:e2e -- tests/e2e/correcao-igpm.spec.ts`: blocked before the focused spec by the unrelated global warmup route importing missing `papaparse`.
  - `pnpm build`: reached Next compilation but was blocked by the same missing `papaparse` dependency and sandboxed Google Fonts downloads. `pnpm exec tsc --noEmit` was likewise blocked by missing `papaparse` plus stale generated Next type references for the unrelated removed `financiar-ou-juntar-dinheiro` route.
- Remaining tester focus: rerun the normal build/full e2e command after dependencies are installed; manually confirm source links and assistive-table behavior if desired. The implemented route itself passed the focused browser scenarios with no console/page errors.
- DB coordination exception: no backlog row exists for this direct user request; Docker/backlog DB remained unavailable, no SQL or backlog mark scripts were run, and no DB status was claimed or changed.
- Final creator status: implementation complete and ready for tester/orchestrator review; keep plan/DB workflow `in_progress` until that handoff is recorded.

## Tester Validation - 2026-08-29

- Status: passed. The implementation on `codex/correcao-igpm-calculator` is verified against the full calculator contract.
- Playwright coverage:
  - `tests/e2e/correcao-igpm.spec.ts` verifies the official default result/source/disclaimer, official source-link targets, semantic yearly table, custom 12-month fixture, inclusive same-month deflation, forged pre-Real URL handling, reproducible old final month and explicit update action, share restoration, unauthenticated save callback, reset of invalid unsubmitted drafts, PT-BR/EN/ES routes, localized latest-month labels, and 390 px horizontal overflow.
  - The tester added browser request recording for every tested page. The spec fails if a request reaches a `bcb.gov.br` or `fgv.br` host, proving calculations use the bundled snapshot rather than browser-time source calls.
  - Console errors and uncaught page errors are collected on each main/restored page and asserted empty.
- Commands and results:
  - `pnpm update:data:igpm -- --check`: passed; the committed snapshot is valid.
  - `pnpm validate:messages`: passed.
  - `pnpm exec vitest run lib/calculators/correcao-igpm.test.ts lib/url-state/correcao-igpm.test.ts scripts/update-igpm.test.ts`: 3 files, 23 tests passed.
  - `pnpm run test:e2e -- tests/e2e/correcao-igpm.spec.ts`: passed twice through the standard configured harness and global setup; final strengthened run 7/7 passed in Chromium.
  - `pnpm test`: 73 files, 842 tests passed.
  - `pnpm lint`: passed.
  - `pnpm build`: the sandboxed attempt reached Next compilation but could not download Geist/Geist Mono from Google Fonts; the approved network-enabled rerun passed compilation, TypeScript, static generation of 310 pages, and emitted all three localized IGP-M routes. Existing `metadataBase` and edge-runtime warnings remain non-blocking.
- Files changed by tester:
  - `tests/e2e/correcao-igpm.spec.ts` (explicit official-link, semantic-table, and zero-BCB/FGV-browser-request assertions).
  - `docs/calculator-plans/correcao-igpm.md` (this validation record and `verified` status).
- Remaining risk:
  - The bundled August 2026 snapshot needs the documented monthly maintenance after later FGV publications. The UI exposes freshness and the deterministic updater rejects silent historical rewrites.
  - Source links were validated by visible label and exact official destination without navigating away, intentionally preserving the zero-browser-source-request guarantee during calculation tests.
- DB coordination exception: this direct user request has no backlog row; Docker/backlog DB was unavailable by instruction, no SQL or backlog scripts were run, and no DB status was claimed or changed.

## Pull Request

- Commit: `36d9b754` (`Add IGP-M correction calculator`).
- Draft PR: https://github.com/saulodefaria/calculaderia/pull/62
- Final workflow status: verified and ready for review.


## Integration validation — 2026-09-04

- Tested with current `main` (`c1a82bac`) and open PRs #53, #57, #58, #60, and #62 in an isolated checkout; shared registry, locale catalog, URL-state, and analytics conflicts preserve both additions.
- `pnpm test`: 83 files / 1,016 tests passed. `pnpm validate:messages`, `pnpm lint`, `pnpm build`, and `git diff --check` passed. The production build used Node 22.21.1, placeholder local auth/database configuration, and network access for Google Fonts.
- Focused browser regression: `correcao-igpm.spec.ts` passed 7/7; the combined five-PR plus email-validator run passed 37/37.
- `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3114 pnpm exec playwright test --reporter=line`: full suite passed 304/304 against `next start`, without retries.
- Browser inspection confirmed visible forms and expected results. Automated coverage includes locale smoke tests, mobile overflow, relevant invalid-input states, share restoration/privacy, and unauthenticated save redirects for calculators.
- Validation status: passed locally; fresh hosted CI is required before merging. No backlog DB row was claimed or changed during this review; existing backlog finalization is outside this validation pass.
- `pnpm update:data:igpm -- --check` passed, validating the bundled snapshot. This check validates local data and does not refresh the source.


## Navigation race follow-up — 2026-09-04

- Detailed hosted logs showed intermittent startup breadcrumb timeouts in the existing email and PIS/PASEP validator tests. PR #53's original failure had the same email-navigation symptom. The complete combined PR #62 run passed 304/304 without retries, but the intermediate #58/#60 runs exposed the race on retry.
- The shared `replaceQueryString` helper unconditionally called `history.replaceState` during mount. Next.js wraps this as `ACTION_RESTORE`, which discards a pending navigation. Cleanup now skips already-clean addresses and still removes private query parameters and fragments when needed.
- Added five boundary tests for clean/default/localized URLs, safe query settings, private query removal, and fragment removal. Three no-op cases failed before the fix; all five pass afterward.
- Added two browser navigation checks with CPU throttling. Sixteen repeated checks pass after the fix; the same local stress check also passed before it, so the intermittent CI timing was not reproduced deterministically locally.
- Final local validation: `pnpm test` passed 84 files / 1,021 tests; focused ESLint and the production build passed; the full production-server Playwright run passed 306/306 without retries. Shared privacy, URL restoration, and navigation coverage remained green.
- This shared fix is delivered with PR #62, the final integration PR; its new head must pass hosted CI before merging.
