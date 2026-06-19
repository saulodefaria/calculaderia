---
slug: "seguro-desemprego"
backlogRank: 6
primaryKeyword: "calculadora seguro desemprego"
decision: "new"
targetRoute: "/calculadoras/seguro-desemprego"
status: "verified"
createdAt: "2026-06-19"
updatedAt: "2026-06-19"
---

# Calculadora de Seguro-Desemprego Plan

## Backlog Row

- Rank: 6.
- Original status: Ready.
- Slug: `seguro-desemprego`.
- Primary keyword: `calculadora seguro desemprego`.
- Cluster keywords: `calculadora seguro desemprego 2025`; `calculadora seguro desemprego online`.
- Opportunity score: 75.
- Idea type: New.
- Notes: Requires current salary bands and eligibility disclaimers.
- Done ref: `-`.

## Decision

- Decision: `new`; approved/buildable as a new calculator route.
- Target route: `/calculadoras/seguro-desemprego`.
- Rationale: the backlog row is Ready, has distinct benefit-estimate intent, and there is no existing seguro-desemprego route, calculator module, URL-state helper, translation namespace, or prior plan. The route should use the backlog slug because it matches the primary keyword and can absorb the lower-ranked `seguro-desemprego-online` backlog row as SEO/supporting copy.
- Buildability: buildable, with a strict source contract. The first build should estimate the trabalhador formal/CLT modalidade only, using the MTE 2026 table and CODEFAT/Lei 7.998 parcel and eligibility rules. Other modalities should be linked/explained, not calculated.

## Similarity Check

- Existing calculators/routes checked: `rescisao-trabalhista`, `ferias`, `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, and `renda-fixa` under `app/[locale]/calculadoras`.
- Related modules/translations checked: `lib/constants.ts`, `lib/calculators`, `lib/url-state`, `components/calculators`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
- Prior plans checked: `docs/calculator-plans/_template.md`, `docs/calculator-plans/rescisao-trabalhista.md`, and `docs/calculator-plans/ferias.md`. Automation memory says `decimo-terceiro` was completed in draft PR https://github.com/saulodefaria/calculaderia/pull/12 on 2026-06-18, even though this worktree backlog is stale.
- Search terms checked: `seguro-desemprego`, `seguro desemprego`, `desemprego`, `salario`, `beneficio`, `rescisao`, `ferias`, `decimo`, `fgts`, and `inss`.
- Overlap conclusion: build a new calculator in the existing `trabalho-salario-beneficios` category. The closest overlap is the termination/labor family, but `rescisao-trabalhista` estimates severance amounts and explicitly leaves unemployment-insurance requests/calculation out of scope. `seguro-desemprego-online` should be treated as an SEO cluster for this route rather than a separate first build.

## User Intent And Scope

- Target user: Brazilian formal CLT workers recently dismissed or checking a likely dismissal, plus HR/payroll assistants who need an educational estimate before the official gov.br/Carteira de Trabalho Digital result.
- User job: enter recent salaries, request count, months worked, dismissal/request context, and eligibility declarations to estimate the monthly benefit amount, number of parcels, total estimated benefit, and whether the scenario appears eligible.
- In scope:
  - Trabalhador formal seguro-desemprego only.
  - Dismissal without cause and indirect termination as potentially eligible reasons.
  - Salary-average calculation from the last three monthly salaries before dismissal, with fallback when the user has only one or two salary values.
  - 2026 MTE benefit table effective from 2026-01-11.
  - Minimum benefit floor equal to the 2026 minimum wage stated by MTE for this table.
  - Eligibility checks based on request ordinal, salary-receipt months in the legally relevant window, unemployment at request, no own sufficient income, and no incompatible continuous previdenciary benefit.
  - Parcel-count estimate based on months worked in the 36 months before the dismissal, with first/second/third-or-later request rules.
  - Request-window warning for trabalhador formal: from the 7th through the 120th day after dismissal.
  - Clear flags for "eligible estimate", "not eligible by informed data", and "needs official verification".
- Out of scope:
  - Empregado domestico, pescador artesanal/seguro defeso, trabalhador resgatado, bolsa de qualificacao profissional, exceptional regional/sector parcel extensions, judicial disputes, appeals, blocked requests, reissue of unpaid parcels, official payment dates, SINE vacancy matching, and employer submission workflows.
  - Exact CNIS/eSocial validation, automated government-system decisions, fraud/falsity/cancellation analysis, or legal advice.
  - Predicting future-year tables before an official MTE update is published.
- Sensitive-topic caveats:
  - The calculator must say it is an educational estimate and cannot confirm entitlement. The official gov.br/Carteira de Trabalho Digital/MTE system, CNIS/eSocial data, employer transmission, and administrative review prevail.
  - For indirect termination, explain that monetary rules can be simulated only if the official/judicial recognition exists or is accepted by the competent process; the calculator does not decide that entitlement.
  - For stale-source risk, visibly show "Tabela MTE 2026, vigente desde 11/01/2026, consultada em 19/06/2026".

## Calculator Contract

- Inputs:
  - `salarioUltimo`: last monthly salary before dismissal, BRL.
  - `salarioPenultimo`: penultimate monthly salary before dismissal, BRL, optional.
  - `salarioAntepenultimo`: antepenultimate monthly salary before dismissal, BRL, optional.
  - `numeroSolicitacao`: `primeira`, `segunda`, or `terceiraOuMais`.
  - `mesesComSalarioElegibilidade`: months with salary in the relevant eligibility window:
    - first request: months in the last 18 months before dismissal;
    - second request: months in the last 12 months before dismissal;
    - third or later request: consecutive months immediately before dismissal.
  - `mesesTrabalhados36`: months worked in the 36 months before dismissal for parcel count.
  - `motivoDispensa`: `semJustaCausa`, `rescisaoIndireta`, `pedidoDemissao`, `justaCausa`, `acordo`, `pdv`, or `outro`.
  - `dataDispensa`: dismissal date, optional but recommended.
  - `dataRequerimento`: intended request date, optional and default today.
  - `desempregadoNoRequerimento`: boolean, default true.
  - `semRendaPropriaSuficiente`: boolean, default true.
  - `semBeneficioContinuadoIncompativel`: boolean, default true.
  - `tabelaAno`: fixed internal/source value `2026` for the first build.
- Defaults:
  - Last three salaries: BRL 3,000.00 each.
  - Request ordinal: first request.
  - Eligibility months: 12.
  - Months worked in last 36: 12.
  - Dismissal reason: dismissal without cause.
  - Dismissal date: blank.
  - Request date: today.
  - Declarations: true for unemployed/no sufficient own income/no incompatible continuous benefit, with helper text explaining that these are user declarations.
  - Table year: 2026 and always visible in result/source copy.
- Validation rules:
  - Monetary inputs must be finite, non-negative, and capped defensively, for example BRL 0 to BRL 10,000,000.
  - Require at least one positive salary. Ignore blank optional salaries; reject negative or non-finite salaries.
  - `numeroSolicitacao` must be one of the supported enum values.
  - `mesesComSalarioElegibilidade` must be an integer 0 to 36; adaptive helper text should show the relevant legal window for the selected request ordinal.
  - `mesesTrabalhados36` must be an integer 0 to 36.
  - If both date fields are present, `dataRequerimento` must be on or after `dataDispensa`; show a warning when the request date is before day 7 or after day 120 counted from the day after dismissal.
  - `motivoDispensa` values other than `semJustaCausa` and `rescisaoIndireta` should produce a not-eligible result, not a generic validation error.
  - If any declaration boolean is false, produce a not-eligible or needs-official-review result with a plain explanation.
  - Invalid URL state must return null and fall back to defaults without crashing.
- Outputs:
  - Summary cards: estimated parcel value, estimated number of parcels, estimated total benefit, salary average used, and eligibility status.
  - Formula panel: salary average, salary band, floor/teto application, and parcel-count rule used.
  - Eligibility panel: dismissal reason, request ordinal, months threshold, months worked in last 36, request window, declarations, and official-verification notes.
  - Source badge: "Tabela MTE 2026 - vigencia 11/01/2026 - acesso 19/06/2026".
  - Warnings:
    - "Estimativa, nao substitui consulta oficial no gov.br/Carteira de Trabalho Digital."
    - "O sistema oficial valida CNIS/eSocial e vinculos ja usados em periodos aquisitivos anteriores."
    - "A pagina formal do MTE ainda exibe a tabela 2024; use a noticia MTE 2026 para constantes atuais."
- Result explanations:
  - Explain that the formal-worker benefit is based on the arithmetic average of the last salary values available from the last three months before dismissal.
  - Explain the 2026 three-band calculation and that the parcel cannot be below R$ 1,621.00 nor above R$ 2,518.65 under the sourced 2026 table.
  - Explain how the number of parcels depends on request ordinal and months worked in the 36 months before dismissal.
  - When ineligible, keep the amount visible as a "formula-only reference" only if useful, but lead with the ineligibility reason.
- URL params:
  - Use compact params consistent with existing calculators: `s1` last salary, `s2` penultimate salary, `s3` antepenultimate salary, `sol` request ordinal, `me` eligibility months, `m36` months worked in 36 months, `mt` dismissal reason, `dd` dismissal date, `rq` request date, `de` unemployed declaration, `sr` no sufficient income declaration, `bp` no incompatible benefit declaration, and `tb` table year.
  - Request ordinal codes: `1`, `2`, `3`.
  - Dismissal reason codes: `sjc`, `ri`, `pd`, `jc`, `ac`, `pdv`, `ot`.
  - Booleans should use `1`/`0`.
  - Generated share URLs must include `tb=2026` even when all other values are defaults, so saved/shared estimates remain auditable after future table updates.
- Share/save behavior:
  - Implement `encodeSeguroDesempregoState`, `decodeSeguroDesempregoState`, and `generateSeguroDesempregoShareUrl`.
  - Add `calculatorId="seguro-desemprego"` to `SaveButton`.
  - Shared URLs must restore all fields and immediately show results when valid query params are present.
  - Save should preserve localized route and query string, and unauthenticated users should follow the existing sign-in redirect/callback behavior.
  - No name, CPF, PIS/NIS, employer identifier, or document number should be requested or encoded.

## Formulas And Sources

- Formula summary:
  - `salariosValidos = positive salaries among salarioUltimo, salarioPenultimo, salarioAntepenultimo`.
  - `salarioMedio = arithmetic average of salariosValidos`.
  - Use full monthly salary values. If a recent month was not worked/paid as a complete month, helper copy should tell users to use the last complete monthly salary or the salary of contribution shown in the official records/contracheque.
  - 2026 formal-worker table:
    - If `salarioMedio <= 2222.17`, `parcelaBruta = salarioMedio * 0.8`.
    - If `2222.18 <= salarioMedio <= 3703.99`, `parcelaBruta = ((salarioMedio - 2222.17) * 0.5) + 1777.74`.
    - If `salarioMedio > 3703.99`, `parcelaBruta = 2518.65`.
  - `valorParcela = min(2518.65, max(1621.00, roundCurrency(parcelaBruta)))`.
  - Eligibility by request ordinal:
    - first request: needs at least 12 salary months in the last 18 months before dismissal.
    - second request: needs at least 9 salary months in the last 12 months before dismissal.
    - third or later request: needs each of the 6 months immediately before dismissal.
  - Parcel count by `numeroSolicitacao` and `mesesTrabalhados36`:
    - first request: 4 parcels for 12 to 23 months; 5 parcels for 24 or more months.
    - second request: 3 parcels for 9 to 11 months; 4 parcels for 12 to 23 months; 5 parcels for 24 or more months.
    - third or later request: 3 parcels for 6 to 11 months; 4 parcels for 12 to 23 months; 5 parcels for 24 or more months.
    - Below the threshold for the selected ordinal, return 0 parcels and an ineligibility reason.
  - `totalEstimado = valorParcela * quantidadeParcelas` when eligible; otherwise 0 with an explanatory status.
  - Request window warning:
    - For formal workers, compare request date with dismissal date. The request can be made from the 7th to the 120th day counted after dismissal. Treat this as a warning/eligibility flag, not a date arithmetic substitute for official processing.
  - Final status:
    - `eligibleEstimate` when reason, months, request window, and declarations all pass.
    - `notEligibleByInputs` when a known rule fails.
    - `needsOfficialReview` when input is incomplete, date is missing, indirect termination needs recognition, or source/system validation cannot be reproduced locally.
- Data tables or assumptions:
  - Table year: 2026.
  - Table effective date: 2026-01-11.
  - Minimum/floor: R$ 1,621.00.
  - Upper salary band threshold: R$ 3,703.99.
  - Benefit teto: R$ 2,518.65.
  - INPC used by MTE for 2026 adjustment: 3.90% accumulated in the prior 12 months, as stated in the MTE 2026 article.
  - Dates use local calendar dates, not time zones.
  - This calculator does not model exceptional extensions to 6 or 7 parcels, because those depend on CODEFAT/MTE decisions for specific sectors/regions or calamity situations.
- Official sources:
  - MTE 2026 benefit table article, published 2026-01-12: https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/janeiro/mte-reajusta-valores-do-beneficio-seguro-desemprego
  - gov.br service page "Solicitar o Seguro-Desemprego", last modified 2025-12-15, with eligibility, service flow, and links to law/CODEFAT: https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego
  - MTE "Seguro-Desemprego Formal" page, updated 2024-03-25, for modality explanation, parcel count, salary-average fallback text, documents, and request notes; do not use its 2024 table for current constants: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/seguro-desemprego/seguro-desemprego-formal
  - CODEFAT Resolucao No. 957, 2022-09-21, especially arts. 3, 4, 11, 17, 19, 35, 36, 39, and 41: https://portalfat.mte.gov.br/wp-content/uploads/2022/09/Resolucao-no-957-de-21-de-setembro-de-2022.pdf
  - Lei No. 7.998/1990, Programa do Seguro-Desemprego and FAT, official Planalto link as referenced by gov.br service page: https://www.planalto.gov.br/ccivil_03/leis/L7998.htm
  - Constituicao Federal art. 7, II, official Planalto text for the constitutional unemployment-insurance right: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
- Source access dates: 2026-06-19 for all links above.
- Rule/table effective dates:
  - 2026 MTE benefit table: effective from 2026-01-11.
  - MTE 2026 article: published 2026-01-12.
  - CODEFAT Resolucao No. 957: dated 2022-09-21 and still used by MTE's current service page as the governing resolution link.
  - gov.br service page: last modified 2025-12-15.
  - MTE formal page: updated 2024-03-25 and contains an explicitly 2024 table; treat as stale only for current table values.
- Freshness or maintenance risk:
  - High. Benefit salary bands, minimum wage floor, and teto are annual/table-driven and must be updated when MTE publishes a new table.
  - Medium-high for eligibility and parcel rules: statutory/resolution rules are stable but can be changed by law, CODEFAT resolution, emergency extension, or system-processing norm.
  - Use explicit constants such as `SEGURO_DESEMPREGO_TABLE_2026`, `SEGURO_DESEMPREGO_SOURCE_VERSION_2026_06_19`, and tests that fail loudly when the table year is changed.
  - The creator must not copy the 2024 table from the MTE formal page into current logic. The plan intentionally uses the newer MTE 2026 article for current constants.
- Estimator limitations:
  - The result cannot verify CNIS/eSocial, employer-submitted information, request history, prior periods already used, sufficient-income analysis, incompatible benefits, fraud/falsity/cancellation situations, or administrative appeals.
  - The result cannot confirm whether an indirect termination is recognized.
  - The official result may differ because MTE/Caixa/gov.br use official records and processing rules not available to this calculator.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de Seguro-Desemprego".
  - PT-BR description: "Estime o valor da parcela, quantidade de parcelas e total do seguro-desemprego formal com a tabela MTE 2026 e avisos de elegibilidade."
  - EN/ES pages may preserve the Brazil-specific calculator and explain that it uses Brazilian formal-worker unemployment-insurance rules.
- Main form sections:
  - Salarios recentes: last, penultimate, and antepenultimate monthly salary fields with helper text for complete monthly salaries.
  - Solicitacao e vinculo: request ordinal, salary months in the relevant eligibility window, and months worked in the last 36 months.
  - Demissao e requerimento: dismissal reason, dismissal date, and request date.
  - Declaracoes de elegibilidade: unemployed at request, no sufficient own income, no incompatible continuous benefit.
- Results sections:
  - Summary cards for parcel value, parcel count, total estimate, and status.
  - Calculation memory table with salary average, salary band, floor/teto, and table source.
  - Eligibility checklist with pass/fail/warning icons.
  - Source/disclaimer panel.
  - Related official links panel to gov.br request and MTE information.
- SEO sections:
  - Como calcular o seguro-desemprego em 2026.
  - Tabela do seguro-desemprego 2026.
  - Quantas parcelas posso receber.
  - Quem tem direito ao seguro-desemprego formal.
  - Por que o resultado oficial pode ser diferente.
  - Quando solicitar pelo gov.br ou Carteira de Trabalho Digital.
- FAQ topics:
  - Qual e o valor minimo e maximo do seguro-desemprego em 2026?
  - Quais salarios entram na media?
  - Quantas parcelas recebo na primeira, segunda ou terceira solicitacao?
  - Pedido de demissao ou acordo tem direito?
  - Rescisao indireta da direito ao seguro-desemprego?
  - Posso receber se tenho outra renda ou beneficio do INSS?
  - A calculadora substitui o resultado do gov.br?
  - O seguro-desemprego domestico segue esta mesma tabela?
- Disclaimer:
  - Must be visible near results and in SEO content. Use direct language: estimate only; not legal, payroll, administrative, or government-benefit advice; official MTE/gov.br/Carteira de Trabalho Digital/CNIS/eSocial processing prevails.
- Related calculator links:
  - Existing: `/calculadoras/rescisao-trabalhista`, `/calculadoras/ferias`, `/calculadoras/juros-compostos`, and `/calculadoras/renda-fixa`.
  - Future/backlog or memory-completed: `/calculadoras/decimo-terceiro` once the stale worktree catches up, `salario-liquido`, `fgts`, `inss`, and `imposto-de-renda`.
- Translation guidance:
  - Add `calculators.seguro-desemprego` namespace to `pt-br`, `en`, and `es`.
  - Keep "seguro-desemprego", "CLT", "MTE", "CODEFAT", "CNIS", and "eSocial" recognizable where needed.
  - EN helper copy should explain "seguro-desemprego" as Brazilian formal-worker unemployment insurance.
  - ES helper copy should explain it as "seguro de desempleo de Brasil para trabajador formal".
  - Avoid claiming the calculator applies outside Brazil.
  - Format BRL and dates through existing locale utilities/patterns.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/seguro-desemprego.ts` with typed inputs/results, request ordinal enum, dismissal reason enum, source/table constants, salary-average helper, benefit-value helper, eligibility helper, parcel-count helper, request-window helper, and rounded BRL outputs.
  - Keep table constants named and versioned for 2026.
  - Return structured warnings and source metadata in the result object.
- URL state:
  - Add `lib/url-state/seguro-desemprego.ts`.
  - Export it from `lib/url-state/index.ts`.
  - Add URL-state tests for full, minimal/default, invalid, and future table-year params.
  - Generated share URLs must include `tb=2026`.
- UI components:
  - Add `components/calculators/seguro-desemprego/seguro-desemprego-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, and an eligibility/checklist or breakdown component.
  - Use existing calculator patterns with `useSearchParams`, `SaveButton`, `ShareButton`, and restored state from valid params.
  - Use currency inputs, numeric inputs/steppers, date inputs, segmented/select controls for request/reason, and checkboxes/toggles for declarations.
  - Use accessible warnings and avoid requesting personal identifiers.
- Route and metadata:
  - Add `app/[locale]/calculadoras/seguro-desemprego/page.tsx` with static SEO content, FAQ JSON-LD, breadcrumbs, official links, Suspense fallback, and source/disclaimer copy.
  - Add `app/[locale]/calculadoras/seguro-desemprego/layout.tsx` with localized metadata, canonical URL, and alternates.
- Registry:
  - Add the calculator to `lib/constants.ts` with `familyId: "calculadoras"`, `primaryCategoryId: "trabalho-salario-beneficios"`, `stateMode: "query"`, `seoApplicationCategory: "FinanceApplication"`, and a suitable lucide icon such as `BriefcaseBusiness`, `BadgeCheck`, or `Calculator`.
- Messages:
  - Add complete `pt-br`, `en`, and `es` message namespaces for form labels, helpers, validation errors, result copy, warnings, SEO sections, FAQ, source labels, and disclaimer.
- Unit tests:
  - Cover all 2026 salary bands, floor/teto, salary average with one/two/three salaries, all request ordinal parcel thresholds, all ineligible dismissal reasons, false declaration flags, request-window boundaries, and rounding.
- E2E hooks/tests:
  - Add stable labels/IDs for Playwright form filling and result assertions.
  - Add dedicated `tests/e2e/seguro-desemprego.spec.ts`.
  - Extend generic calculator share-state coverage if the repo has a shared spec pattern.
- Backlog updates:
  - Do not mark the backlog in this planning task.
  - The creator should mark `seguro-desemprego` In Progress only when implementation starts and Done only after acceptance passes.

## Test Plan

- Unit scenarios:
  - Salary average below floor: BRL 1,900 average calculates BRL 1,520.00 before floor and returns BRL 1,621.00.
  - First band upper edge: BRL 2,222.17 average returns BRL 1,777.74.
  - Second band example: BRL 3,000.00 average returns BRL 2,166.66 after currency rounding.
  - Second band upper edge: BRL 3,703.99 average returns BRL 2,518.65.
  - Above teto: BRL 3,704.00 and BRL 10,000.00 averages return BRL 2,518.65.
  - One salary only, two salaries only, and three salaries all average correctly.
  - First request: 11 months not eligible; 12 to 23 months gives 4 parcels; 24 months gives 5 parcels.
  - Second request: 8 months not eligible; 9 to 11 months gives 3 parcels; 12 to 23 gives 4; 24 gives 5.
  - Third or later request: 5 months not eligible; 6 to 11 gives 3; 12 to 23 gives 4; 24 gives 5.
  - Dismissal reason `pedidoDemissao`, `justaCausa`, `acordo`, `pdv`, and `outro` return not eligible with reason-specific copy.
  - `rescisaoIndireta` returns `needsOfficialReview` or eligible estimate with recognition warning, depending on chosen result model.
  - False declarations for unemployment, own income, or incompatible benefit produce not-eligible/official-review statuses.
  - Request date exactly day 7 passes; day 6 warns/fails; day 120 passes; day 121 warns/fails.
  - Invalid negative salaries, unknown enums, non-integer months, and impossible dates return validation errors/null decoded state.
- URL-state scenarios:
  - Encoding includes `tb=2026` for defaults and full state.
  - Decoding restores salaries, ordinal, months, reason, dates, booleans, and table year.
  - Unknown table years, unsupported enum codes, negative money, and impossible month counts return null.
  - Shared URL immediately renders results and source badge.
- Browser scenarios:
  - Desktop and mobile route load with no console errors.
  - User changes salary values and sees updated parcel value, total, and formula band.
  - User changes request ordinal/months and sees parcel-count/eligibility status update.
  - Ineligible reason shows clear not-eligible copy while keeping formula explanation readable.
  - Share copies/restores a URL including `tb=2026`.
  - Save redirects unauthenticated users to sign-in with callback URL.
  - Source/disclaimer panel is visible near results.
  - No horizontal overflow at 390px mobile width.
- Playwright scenarios:
  - Focused spec for an eligible first-request case with BRL 3,000 average, 12 months, 4 parcels, BRL 2,166.66 parcel, BRL 8,666.64 total.
  - Focused spec for salary below floor.
  - Focused spec for teto.
  - Focused spec for ineligible `pedidoDemissao`.
  - Focused spec for share URL restore with `tb=2026`.
  - Smoke checks for `/en/calculadoras/seguro-desemprego` and `/es/calculadoras/seguro-desemprego`.
- Lint/build commands:
  - `pnpm lint`.
  - Focused Vitest for `seguro-desemprego` calculator and URL-state files.
  - Full non-e2e `pnpm test` when risk/budget allows.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build` if the project still needs a database URL for build.
- Acceptance criteria:
  - Route exists at `/calculadoras/seguro-desemprego`.
  - Formula uses the MTE 2026 values in this plan and never the stale 2024 table from the older MTE formal page.
  - Eligibility and parcel-count results match CODEFAT/MTE rules for trabalhador formal.
  - Source/date/freshness disclaimer is visible and localized.
  - URL share/save behavior is deterministic and table-year pinned.
  - Tests cover formula boundaries, eligibility thresholds, URL state, and browser share restore.

## Implementation Notes

- Status updates:
  - 2026-06-19: Planner created buildable `new` plan for rank 6 `seguro-desemprego`, targeting `/calculadoras/seguro-desemprego`.
  - 2026-06-19: Creator marked backlog rank 6 `In Progress` and plan status `in_progress` before app implementation.
  - 2026-06-19: Creator implemented the planned trabalhador formal/CLT calculator and left tester/browser acceptance pending.
  - 2026-06-19: Review-fix creator verified the accepted PR-review findings after the branch was fast-forwarded to `origin/main`; no app-code changes were needed in this pass.
  - 2026-06-19: Tester completed browser and focused e2e validation; plan/backlog intentionally left `in_progress`/`In Progress` for orchestrator finalization.
  - 2026-06-19: Orchestrator marked the plan `verified` and backlog row `Done` after implementation, review fixes, and tester validation passed.
- Files changed:
  - `docs/calculator-plans/seguro-desemprego.md`.
  - `docs/calculator-backlog.md`.
  - `lib/calculators/seguro-desemprego.ts`.
  - `lib/calculators/seguro-desemprego.test.ts`.
  - `lib/url-state/seguro-desemprego.ts`.
  - `lib/url-state/seguro-desemprego.test.ts`.
  - `lib/url-state/index.ts`.
  - `components/calculators/seguro-desemprego/calculator-form.tsx`.
  - `components/calculators/seguro-desemprego/results-summary.tsx`.
  - `components/calculators/seguro-desemprego/eligibility-panel.tsx`.
  - `components/calculators/seguro-desemprego/seguro-desemprego-calculator-client.tsx`.
  - `app/[locale]/calculadoras/seguro-desemprego/page.tsx`.
  - `app/[locale]/calculadoras/seguro-desemprego/layout.tsx`.
  - `lib/constants.ts`.
  - `messages/pt-br.json`.
  - `messages/en.json`.
  - `messages/es.json`.
  - `tests/e2e/seguro-desemprego.spec.ts`.
- Validation results:
  - Planner-only validation: backlog row selected, overlap checked, official source contract validated from MTE/gov.br/CODEFAT/Planalto references, and no app code edited.
  - Creator validation passed: `pnpm test -- lib/calculators/seguro-desemprego.test.ts lib/url-state/seguro-desemprego.test.ts` (Vitest reported 26 files / 302 tests passed because the project runner includes the non-e2e suite).
  - Creator validation passed: `pnpm lint`.
  - Plain `pnpm build` failed before app build because Prisma requires `DATABASE_URL`.
  - Creator validation passed: `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build`; route `/[locale]/calculadoras/seguro-desemprego` appeared in build output.
  - Review-fix validation passed: `pnpm test -- lib/calculators/seguro-desemprego.test.ts lib/url-state/seguro-desemprego.test.ts` (Vitest reported 29 files / 333 tests passed).
  - Tester sandbox e2e attempt failed before page interaction: `pnpm test:e2e -- tests/e2e/seguro-desemprego.spec.ts` hit Chromium `MachPortRendezvousServer ... Permission denied (1100)` on macOS.
  - Tester browser-capable e2e passed: `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm run test:e2e -- tests/e2e/seguro-desemprego.spec.ts` (7/7 passed).
  - Tester validation passed: `pnpm lint`.
  - Tester validation passed: `git diff --check`.
- PR-review findings addressed:
  - `blocking(diff-scope)`: verified the branch is now `codex/seguro-desemprego-calculator` with tracked diff against `origin/main` limited to the seguro backlog/registry/message changes, while new seguro files remain untracked for final staging. Backlog remains `In Progress`; no mainline `decimo-terceiro`, `texto`, or `contador-caracteres` files are reverted by this diff.
  - `blocking(url-state)`: verified `lib/url-state/seguro-desemprego.ts` encodes zero-valued salary params (`s1`, `s2`, `s3`) and `lib/url-state/seguro-desemprego.test.ts` covers one-salary and two-salary roundtrips so generated share/save URLs do not restore blank optional salaries as BRL 3,000 defaults.
  - Review-fix files changed in this pass: `docs/calculator-plans/seguro-desemprego.md` only.
- Implementation notes:
  - Used only the MTE 2026 constants from this plan: effective 2026-01-11, accessed 2026-06-19, floor/minimum wage R$ 1,621.00, bands R$ 2,222.17 / R$ 3,703.99, addend R$ 1,777.74, teto R$ 2,518.65.
  - `rescisaoIndireta` is modeled as `needsOfficialReview`; the formula reference stays visible, but `totalEstimado` remains zero until entitlement is officially recognized.
  - Share URL generation always includes `tb=2026`; decoder rejects missing/unsupported table years and invalid enum/range/date values.
  - `SaveButton` uses `calculatorId="seguro-desemprego"` and the existing unauthenticated redirect behavior.
- Tester findings:
  - Browser validation passed against `http://localhost:3101`: `/calculadoras/seguro-desemprego` loads without redirect loop, the realistic first-request flow with salaries BRL 3,000.00 / 3,000.00 / 3,000.00, 12 months, dismissal 2026-06-01, and request 2026-06-08 shows R$ 2.166,66, 4 parcelas, R$ 8.666,64, and the MTE 2026 source badge.
  - Share/save validation passed: generated share URLs include `tb=2026`; restored URLs show state/results; one-salary case encodes `s2=0&s3=0` and restores optional salary fields blank; unauthenticated save redirects to `/entrar?callbackUrl=...`.
  - Eligibility validation passed: `rescisaoIndireta` shows `Precisa de verificação oficial`, formula reference, and official-recognition warning; `pedidoDemissao` shows `Não elegível pelos dados` and the not-eligible reason.
  - Request-window validation passed: day 6 shows before-window not-eligible warning; day 7 is eligible; day 120 is eligible; day 121 shows after-window not-eligible warning.
  - Responsive/localized validation passed: 390px mobile has no horizontal overflow; `/en/calculadoras/seguro-desemprego` and `/es/calculadoras/seguro-desemprego` load with localized titles, result summaries, and save/share controls.
  - Console/page monitoring passed with no hydration errors, page errors, or unexpected console errors. The e2e monitor filters expected unauthenticated Auth.js/session noise from rapid test navigation.
  - Tester files changed: `tests/e2e/seguro-desemprego.spec.ts` and `docs/calculator-plans/seguro-desemprego.md` only; no production code changed.
- Final status:
  - `verified`; route `/calculadoras/seguro-desemprego` passed implementation checks, PR-review gate, browser validation, and focused e2e. Backlog row is `Done` with route/validation reference pending draft PR URL.
