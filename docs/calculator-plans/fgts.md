---
slug: "fgts"
backlogRank: 8
primaryKeyword: "calculadora fgts"
decision: "new"
targetRoute: "/calculadoras/fgts"
status: "verified"
createdAt: "2026-06-22"
updatedAt: "2026-06-22"
---

# Calculadora de FGTS Plan

## Backlog Row

- Rank: 8.
- Original status: Ready.
- Slug: `fgts`.
- Primary keyword: `calculadora fgts`.
- Cluster keywords: `calculadora fgts mensal`; `calculadora fgts e multa`.
- Volume: 22200.
- SEO difficulty: 34.
- CPC: R$ 0.30.
- Intent: 2.
- Opportunity score: 73.
- Idea type: New.
- Notes: Build monthly deposit plus optional termination fine scenarios.
- Done ref: `-`.
- Selection source: selected only from `docs/calculator-backlog.md`, per request. `docs/tool-backlog.md` was not used.

## Decision

- Decision: `new`; approved/buildable as a new calculator route.
- Target route: `/calculadoras/fgts`.
- Rationale: FGTS has a distinct high-intent monthly deposit and termination-fine job. The existing rescisao calculator estimates FGTS only inside a termination workflow, while salario liquido explicitly excludes employer FGTS deposits. A dedicated route can answer "quanto deposita por mes?", "quanto acumula no periodo?" and "qual seria a multa?" without forcing the user through a full severance calculation.
- Buildability: buildable. Official sources validate the standard monthly FGTS deposit rate, coverage groups, apprenticeship exception, and FGTS Digital treatment of 40%/20% termination indemnity bases. Domestic-worker FGTS is intentionally out of scope for the first build because it has a separate LC 150/eSocial 3.2% monthly indemnity contribution flow.

## Similarity Check

- Existing calculators/routes checked:
  - Existing routes under `app/[locale]/calculadoras`: `rescisao-trabalhista`, `salario-liquido`, `ferias`, `decimo-terceiro`, `seguro-desemprego`, `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, and `renda-fixa`.
  - No `app/[locale]/calculadoras/fgts` route exists.
  - No `components/calculators/fgts` folder exists.
  - No `lib/calculators/fgts.ts` or `lib/url-state/fgts.ts` exists.
- Related modules/translations checked:
  - `lib/constants.ts` already has the `calculadoras` family and `trabalho-salario-beneficios` category; no new family/category is needed.
  - `lib/calculators/rescisao-trabalhista.ts` estimates FGTS rescisorio, base de multa, multa de 40%/20%, and saque display for termination reasons.
  - `lib/calculators/salario-liquido.ts` excludes employer-side FGTS from monthly net salary scope.
  - `lib/calculators/payroll-2026.ts` is unrelated except for shared money validation/rounding style.
  - `lib/url-state/*`, `components/ui/share-button.tsx`, and `components/ui/save-button.tsx` establish query-state share/save patterns.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` mention FGTS inside rescisao and related/future copy, but no `calculators.fgts` namespace exists.
- Prior plans checked:
  - `docs/calculator-plans/rescisao-trabalhista.md`, `docs/calculator-plans/ferias.md`, `docs/calculator-plans/decimo-terceiro.md`, `docs/calculator-plans/seguro-desemprego.md`, and `docs/calculator-plans/salario-liquido.md`.
  - No prior `docs/calculator-plans/fgts.md` existed before this plan.
- Search terms checked: `fgts`, `calculadora fgts`, `fundo de garantia`, `multa fgts`, `rescisao`, `saldoFgts`, `fgtsRescisorio`, and `fgts mensal`.
- Overlap conclusion:
  - Build a standalone FGTS calculator focused on monthly deposits, period accumulation, optional rescisory deposit base, and fine scenarios.
  - Do not merge into `rescisao-trabalhista`, because that route solves full severance with many non-FGTS verbas.
  - Treat backlog rows `fgts-mensal`, `rescisao-fgts-multa`, `rescisao-sem-fgts`, `fgts-atrasado`, `fgts-saque-aniversario`, and `emprestimo-fgts` as related future variants. The first route should absorb `fgts-mensal` and basic `fgts e multa` SEO, but not delayed-payment correction, saque-aniversario, or FGTS-backed credit.

## User Intent And Scope

- Target user: Brazilian employee, HR/payroll assistant, small employer, or payroll-adjacent user estimating FGTS deposits and a possible termination fine from known remuneration/base values.
- User job:
  - Enter a monthly FGTS base and number of months.
  - Add optional 13th salary or rescisory FGTS bases.
  - Optionally enter an official FGTS balance/base.
  - See monthly deposit, total estimated deposits, base used for fine, fine estimate, and explanatory limitations.
- In scope:
  - Standard non-domestic FGTS deposit estimate using 8% of the remuneration/base informed by the user.
  - Optional advanced apprenticeship deposit rate at 2%, with a warning that apprenticeship termination rules may require separate review.
  - Optional 13th salary FGTS base and optional rescisory FGTS base as user-entered amounts.
  - Optional official FGTS balance/base input to improve termination-fine estimates.
  - Fine scenarios: no termination, dismissal without cause, indirect termination recognized, mutual agreement under CLT art. 484-A, judicially recognized culpa reciproca/forca maior, resignation, and dismissal with cause.
  - Educational withdrawal display for the common scenarios: 100% displayed for dismissal without cause/recognized indirect termination, up to 80% for mutual agreement, and no immediate withdrawal display for resignation/with cause.
- Out of scope:
  - Domestic-worker FGTS/DAE/eSocial calculations, including the LC 150 3.2% monthly indemnity contribution.
  - Exact FGTS Digital guide generation, eSocial event filing, SEFIP/GFIP, DAE, GRRF, TRCT, or employer compliance workflow.
  - Automatic salary rubric classification, overtime/adicional averages, absences, leaves, multiple contracts, collective agreement effects, stability, court-awarded values, or legal entitlement decisions.
  - FGTS delayed-payment penalties, late deposit interest/fines, correction by TR/IPCA/JAM, profit distribution, saque-aniversario, housing withdrawal rules, loans secured by FGTS, or official account reconciliation.
- Sensitive-topic caveats:
  - FGTS is labor/legal/payroll-sensitive. Results must state that official payroll/eSocial/FGTS Digital values and professional review prevail.
  - When no official FGTS balance/base is entered, the fine base is only an approximation from user-entered deposits and excludes account correction/interest/profits.
  - Domestic workers are covered by FGTS, but not by this first formula. The UI must not imply that the same calculation covers domestic DAE or the 3.2% domestic indemnity contribution.

## Calculator Contract

- Inputs:
  - `baseMensalFgts`: monthly remuneration/base subject to FGTS in BRL.
  - `meses`: integer number of months to estimate.
  - `tipoDeposito`: `padrao8` or `aprendiz2`; default `padrao8`.
  - `baseDecimoTerceiro`: optional 13th salary/gratificacao natalina base subject to FGTS in BRL.
  - `baseVerbasRescisoriasFgts`: optional rescisory/remuneratory base subject to FGTS, such as salary balance, proportional 13th, and eligible indemnified notice values when the user knows them.
  - `depositosExtrasInformados`: optional already-known extra FGTS deposits in BRL.
  - `saldoFgtsInformado`: optional official current FGTS balance/base for the employment contract.
  - `saldoIncluiDepositosEstimados`: boolean, default false; when true, the entered saldo/base already includes the deposits estimated by this form.
  - `motivoRescisao`: `semRescisao`, `semJustaCausa`, `rescisaoIndiretaReconhecida`, `acordo484A`, `culpaReciprocaForcaMaior`, `pedidoDemissao`, or `justaCausa`.
  - `mostrarSaqueEstimado`: boolean, default true, for displaying eligible withdrawal amount/rate as an educational scenario.
  - `sourceVersion`: fixed supported source version `2026-06-22`.
- Defaults:
  - `baseMensalFgts`: 3000.
  - `meses`: 12.
  - `tipoDeposito`: `padrao8`.
  - `baseDecimoTerceiro`: 3000.
  - `baseVerbasRescisoriasFgts`: 0.
  - `depositosExtrasInformados`: 0.
  - `saldoFgtsInformado`: blank.
  - `saldoIncluiDepositosEstimados`: false.
  - `motivoRescisao`: `semRescisao`.
  - `mostrarSaqueEstimado`: true.
  - `sourceVersion`: `2026-06-22`.
- Validation rules:
  - Money fields must be finite, non-negative, and at most `10_000_000`.
  - `baseMensalFgts` must be greater than `0`.
  - `meses` must be an integer from `0` to `600` (50 years).
  - `tipoDeposito` and `motivoRescisao` must be known enum values.
  - `sourceVersion` must equal `2026-06-22`; invalid or future source versions must reject URL state and fall back to defaults.
  - If `saldoFgtsInformado` is blank and a fine scenario is selected, show `saldoAusente` and `baseEstimadaSemCorrecao` warnings.
  - If `tipoDeposito` is `aprendiz2` and a fine scenario is selected, show an apprenticeship-specific warning that termination entitlement depends on the apprenticeship contract and official review.
  - Invalid URL state must return `null` and never crash the route.
- Outputs:
  - `aliquotaDeposito`: `0.08` for `padrao8`, `0.02` for `aprendiz2`.
  - `depositoMensal`.
  - `depositosMensaisPeriodo`.
  - `depositoDecimoTerceiro`.
  - `depositoVerbasRescisorias`.
  - `totalDepositosEstimados`.
  - `baseMultaFgts`.
  - `aliquotaMulta`.
  - `multaFgts`.
  - `percentualSaqueExibido`.
  - `saqueFgtsExibido`.
  - `warnings`.
  - Breakdown rows for monthly deposits, 13th deposit, rescisory deposit, extra deposits, official balance/base, fine base, fine, and withdrawal display.
- Result explanations:
  - Explain that the monthly deposit is calculated from the FGTS base typed by the user.
  - Explain that standard deposit uses 8% and apprenticeship uses 2% when selected.
  - Explain that 13th salary is an additional base when entered; the calculator does not decide which payroll rubrics are FGTS-incidental.
  - Explain that the fine estimate is based on the entered official balance/base or on estimated deposits without correction when no official balance is entered.
  - Explain that correction/interest/profit distribution and official FGTS Digital history are excluded.
- URL params:
  - Use compact params consistent with existing calculators:
    - `sv` source version, always `2026-06-22`.
    - `s` monthly FGTS base.
    - `m` months.
    - `tp` deposit type: `p8` for `padrao8`, `a2` for `aprendiz2`.
    - `d13` 13th salary FGTS base.
    - `vr` rescisory FGTS base.
    - `ex` extra known deposits.
    - `fg` official FGTS balance/base.
    - `fi` official balance/base includes estimated deposits (`1`/`0`).
    - `mt` termination scenario: `none`, `sjc`, `ri`, `ac`, `cfm`, `pd`, `jc`.
    - `sq` show withdrawal display (`1`/`0`).
  - Generated share URLs must include `sv=2026-06-22` even when all other values are default, so saved/shared estimates remain auditable after future legal/source updates.
- Share/save behavior:
  - Implement `encodeFgtsState`, `decodeFgtsState`, and `generateFgtsShareUrl`.
  - Add `calculatorId="fgts"` to `SaveButton`.
  - Use the existing query-state, `ShareButton`, and `SaveButton` pattern.
  - Shared URLs must restore all valid fields and immediately show results.
  - Save/favorites should preserve localized route and query string; unauthenticated users should follow the existing sign-in redirect/callback behavior.
  - Do not request or encode CPF, PIS/NIS, employer name, worker name, account number, bank data, payslip image, or any identifying employment document.

## Formulas And Sources

- Deterministic formula summary:
  - Use BRL currency numbers and round to cents with the repo's existing round-money style.
  - `aliquotaDeposito = tipoDeposito === "aprendiz2" ? 0.02 : 0.08`.
  - `depositoMensal = round2(baseMensalFgts * aliquotaDeposito)`.
  - `depositosMensaisPeriodo = round2(depositoMensal * meses)`.
  - `depositoDecimoTerceiro = round2(baseDecimoTerceiro * aliquotaDeposito)`.
  - `depositoVerbasRescisorias = round2(baseVerbasRescisoriasFgts * aliquotaDeposito)`.
  - `totalDepositosEstimados = round2(depositosMensaisPeriodo + depositoDecimoTerceiro + depositoVerbasRescisorias + depositosExtrasInformados)`.
  - If `saldoFgtsInformado` is provided:
    - `baseMultaFgts = round2(saldoFgtsInformado + (saldoIncluiDepositosEstimados ? 0 : totalDepositosEstimados))`.
  - If `saldoFgtsInformado` is blank:
    - `baseMultaFgts = totalDepositosEstimados`.
    - Add warning `baseEstimadaSemCorrecao`.
  - `aliquotaMulta`:
    - `0.40` for `semJustaCausa` and `rescisaoIndiretaReconhecida`.
    - `0.20` for `acordo484A`.
    - `0.20` for `culpaReciprocaForcaMaior`, with warning that recognition is required.
    - `0` for `semRescisao`, `pedidoDemissao`, and `justaCausa`.
  - `multaFgts = round2(baseMultaFgts * aliquotaMulta)`.
  - `percentualSaqueExibido`:
    - `1` for `semJustaCausa` and `rescisaoIndiretaReconhecida`.
    - `0.8` for `acordo484A`.
    - `0` for `semRescisao`, `pedidoDemissao`, and `justaCausa`.
    - `0` for `culpaReciprocaForcaMaior` in the first build unless the creator validates a clear official withdrawal display rule; show a "review required" warning instead.
  - `saqueFgtsExibido = mostrarSaqueEstimado ? round2(baseMultaFgts * percentualSaqueExibido) : 0`.
  - Deterministic examples for unit tests:
    - Standard salary/base R$ 3,000, 12 months, R$ 3,000 13th, no balance, no termination: monthly deposit R$ 240.00; monthly-period deposits R$ 2,880.00; 13th deposit R$ 240.00; total deposits R$ 3,120.00; fine R$ 0.00.
    - Same data with dismissal without cause and no balance: base fine R$ 3,120.00; fine R$ 1,248.00; withdrawal display R$ 3,120.00; warning that base excludes correction/official history.
    - Official balance/base R$ 10,000, `saldoIncluiDepositosEstimados=true`, mutual agreement: fine R$ 2,000.00; withdrawal display R$ 8,000.00.
    - Apprenticeship base R$ 1,500, 6 months, no 13th: monthly deposit R$ 30.00; period deposits R$ 180.00; warning if a fine scenario is selected.
- Data tables or assumptions:
  - Source version: `2026-06-22`.
  - Standard monthly FGTS rate: 8% of the remuneration/base paid or due in the previous month, as user-entered.
  - Apprenticeship monthly FGTS rate: 2%; first build includes this only as an advanced deposit-rate mode with warning.
  - Domestic workers are covered by FGTS but excluded from first-build formulas because domestic employers have a separate LC 150/eSocial monthly indemnity contribution flow.
  - Fine percentages are scenario multipliers on the FGTS base; the calculator does not decide legal entitlement.
  - User-entered official balance/base may already include correction, interest, and previous deposits. Estimated deposits do not.
  - Dates are not used for due-date calculation in the first build.
- Official sources:
  - MTE FGTS overview, coverage, standard 8% rate, apprenticeship 2% rate, and page update timestamp: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/fgts/fundo-de-garantia-do-tempo-de-servico-fgts
  - MTE FGTS Digital value-base guidance for rescisory indemnity, including automatic 40%/20% fine calculation and missing remuneration history handling: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/comunicados/informando-o-valor-base-para-fins-rescisorios-no-fgts-digital/
  - Law 8.036/1990 on FGTS legal regime, deposits, account correction/interest, withdrawals, and termination indemnity: https://www.planalto.gov.br/ccivil_03/leis/l8036compilada.htm
  - Decree 99.684/1990 regulating FGTS: https://www.planalto.gov.br/ccivil_03/decreto/D99684.htm
  - CLT consolidated text, including art. 484-A mutual agreement termination reference: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm
  - Complementary Law 150/2015 for domestic-worker-specific FGTS/indemnity rules, used only to justify first-build exclusion: https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp150.htm
- Source access dates:
  - All source links above recorded for this plan on 2026-06-22.
  - MTE FGTS overview accessible on 2026-06-22; page shows published `2015-08-24` and updated `2025-04-10`.
  - MTE FGTS Digital rescisory-base page accessible on 2026-06-22; page shows published `2024-04-26` and updated `2024-04-26`.
- Rule/table effective dates:
  - Law 8.036/1990 and Decree 99.684/1990 are current legal source anchors as accessed on 2026-06-22.
  - CLT art. 484-A mutual agreement source comes from Law 13.467/2017 and is used for the 20% fine/80% withdrawal display scenario.
  - MTE public FGTS overview update date: 2025-04-10.
  - MTE FGTS Digital rescisory-base guidance update date: 2024-04-26.
  - No annual tax/rate table is used; the source version is date-pinned because labor and FGTS Digital guidance can change.
- Source validation result:
  - Buildable. The MTE overview validates standard 8% monthly deposits and 2% apprenticeship deposits, and lists domestic workers among covered worker groups.
  - Buildable for non-domestic standard/apprenticeship deposit estimates and optional 40%/20% fine multiplication.
  - Domestic worker mode is intentionally not buildable in this first plan without a separate LC 150/eSocial DAE contract because the monthly 3.2% indemnity contribution changes both UX and formula semantics.
  - No contradiction blocks the amount formula. Any operational due-date difference between older overview copy and FGTS Digital practice is outside first-build scope because the calculator does not compute payment deadlines.
- Freshness or maintenance risk:
  - Medium to high. FGTS rates are legally stable compared with INSS/IRRF tables, but FGTS Digital operational guidance, domestic/eSocial flows, and judicial/account-correction rules can change.
  - Use explicit constants such as `FGTS_SOURCE_VERSION_2026_06_22`, `FGTS_STANDARD_RATE_2026_06_22`, and `FGTS_APPRENTICE_RATE_2026_06_22`.
  - Unit tests should fail loudly if source version, supported worker type, or fine scenario enum changes without updating messages, URL state, and source copy.
- Estimator limitations:
  - The calculator does not calculate TR, JAM, IPCA floor effects, FGTS profit distributions, or late-payment charges.
  - The calculator does not validate which salary rubrics are FGTS-incidental; users must enter the base they want to estimate.
  - The calculator does not decide eligibility for termination fine, withdrawal, or domestic-worker rights.
  - Official FGTS Digital/eSocial/CAIXA balances and employer declarations prevail.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de FGTS".
  - PT-BR description: "Estime depositos mensais de FGTS, base de multa e cenarios de 40% ou 20% com memoria de calculo transparente."
  - EN/ES pages should preserve Brazil-specific FGTS terminology and explain that the rules are Brazilian labor/payroll rules.
- Main form sections:
  - Base de FGTS: monthly base, months, deposit type (`8% padrao` or `2% aprendiz`).
  - Bases adicionais: 13th salary base, rescisory FGTS base, and extra known deposits.
  - Saldo oficial: optional FGTS balance/base and checkbox for whether it already includes estimated deposits.
  - Cenario de rescisao: termination scenario selector and withdrawal display toggle.
- Results sections:
  - Summary cards: monthly deposit, total estimated deposits, fine base, fine amount, withdrawal display.
  - Breakdown table for each deposit/fine component.
  - Warnings panel for estimated base, apprenticeship, indirect termination, culpa reciproca/forca maior, and domestic-worker exclusion.
  - Source/version note with access date `2026-06-22`.
  - Disclaimer near results.
- SEO sections:
  - Como calcular o FGTS mensal.
  - FGTS sobre decimo terceiro e verbas rescisorias.
  - Como estimar a multa de 40% ou 20% do FGTS.
  - Quando informar o saldo oficial do FGTS.
  - O que a calculadora nao faz: correcao, juros, saque-aniversario e domestico.
  - Fontes oficiais do FGTS.
- FAQ topics:
  - Qual e a aliquota mensal do FGTS?
  - FGTS incide sobre decimo terceiro?
  - Como calcular a multa de 40% do FGTS?
  - Rescisao por acordo tem multa de 20%?
  - Posso calcular FGTS de empregado domestico aqui?
  - A calculadora corrige o saldo do FGTS por juros ou TR/IPCA?
  - Preciso informar o saldo oficial?
  - A calculadora substitui o FGTS Digital?
- Disclaimer:
  - Must be present near results and in SEO content. Use direct language: educational estimate, not legal/payroll advice; official FGTS Digital/eSocial/CAIXA balances, TRCT, employer declarations, and professional review prevail.
- Related calculator links:
  - Existing: `/calculadoras/rescisao-trabalhista`, `/calculadoras/salario-liquido`, `/calculadoras/decimo-terceiro`, `/calculadoras/ferias`, and `/calculadoras/seguro-desemprego`.
  - Future/backlog: `fgts-mensal`, `rescisao-fgts-multa`, `fgts-atrasado`, `fgts-saque-aniversario`, `emprestimo-fgts`, `inss`, and `imposto-de-renda`.
- Translation guidance:
  - Add `calculators.fgts` namespace to `pt-br`, `en`, and `es`.
  - Keep "FGTS" untranslated. In EN/ES, add short helper copy like "Brazilian severance fund".
  - Keep Brazilian legal terms recognizable: "CLT", "FGTS Digital", "rescisao por acordo", "multa de 40%".
  - Avoid claims that the calculator applies outside Brazil.
  - Format BRL and dates with existing locale utilities.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/fgts.ts` with typed inputs/results, source constants, deposit type enum, termination scenario enum, validation helper, warning codes, fine/withdrawal helpers, and rounded BRL outputs.
  - Add focused tests in `lib/calculators/fgts.test.ts`.
- URL state:
  - Add `lib/url-state/fgts.ts`.
  - Export it from `lib/url-state/index.ts`.
  - Add `lib/url-state/fgts.test.ts` for minimal, full, invalid, source-version, enum, and optional-balance states.
- UI components:
  - Add `components/calculators/fgts/fgts-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, `breakdown-table.tsx`, and a warnings/source panel if not handled inside summary.
  - Use existing calculator pattern with `useSearchParams`, `SaveButton`, `ShareButton`, and client-side restore from valid params.
  - Use accessible number/currency inputs, select or segmented controls for deposit type and termination scenario, and a checkbox/toggle for balance-includes-deposits and withdrawal display.
- Route and metadata:
  - Add `app/[locale]/calculadoras/fgts/page.tsx` with static SEO content, FAQ JSON-LD, breadcrumbs, source links, related links, and Suspense fallback.
  - Add `app/[locale]/calculadoras/fgts/layout.tsx` with localized metadata, canonical URL, and alternates.
- Registry:
  - Add the calculator to `lib/constants.ts` with `familyId: "calculadoras"`, `primaryCategoryId: "trabalho-salario-beneficios"`, `categoryIds: ["trabalho-salario-beneficios"]`, `stateMode: "query"`, and `seoApplicationCategory: "FinanceApplication"`.
  - A lucide icon such as `Landmark`, `PiggyBank`, `BadgeDollarSign`, or `BriefcaseBusiness` is acceptable if already imported/available.
- Messages:
  - Add full `pt-br`, `en`, and `es` message namespaces for calculator UI, SEO sections, FAQ, source notes, result labels, warnings, validation copy, and related links.
- Unit tests:
  - Cover standard 8% monthly deposit, 13th base, rescisory base, official balance included vs not included, no-balance warning, 40% no-cause fine, 20% agreement fine, no-fine resignation/with-cause, apprenticeship 2% rate, invalid ranges, and rounding.
- E2E hooks/tests:
  - Add stable labels/IDs for Playwright form filling and result assertions.
  - Add a dedicated `tests/e2e/fgts.spec.ts`.
  - Extend any generic calculator share-state coverage only if this repo pattern requires it for new calculators.
- Backlog updates:
  - Do not mark the backlog in this planning task. The creator should mark `fgts` In Progress when implementation starts and Done only after acceptance passes.

## Test Plan

- Unit scenarios:
  - Default standard estimate: R$ 3,000 base, 12 months, R$ 3,000 13th, no termination.
  - Dismissal without cause using estimated base and no official balance: fine 40%, withdrawal display 100%, warnings present.
  - Mutual agreement with official balance included: fine 20%, withdrawal display 80%, no estimated-base warning.
  - Official balance not including current estimated deposits: base includes both official balance and estimated deposits.
  - Resignation and with-cause scenarios: no fine and no withdrawal display.
  - Indirect termination recognized: same 40% monetary scenario as without cause, plus warning.
  - Culpa reciproca/forca maior: 20% fine, no withdrawal display unless separately validated, recognition warning.
  - Apprenticeship 2% deposit: monthly and period deposits use 2%, and warning appears if a fine scenario is selected.
  - Zero months with 13th/base values: monthly deposit still shown, period deposit zero, total includes other bases.
  - Rounding edge cases such as base R$ 1,234.56.
  - Invalid money, month, enum, and source-version inputs.
- URL-state scenarios:
  - Encoding always includes `sv=2026-06-22`.
  - Full URL restores every field, including false booleans and zero optional amounts where needed.
  - Invalid source version, unknown enum codes, negative money, or impossible month ranges return `null`.
  - Shared URL immediately renders results.
- Browser scenarios:
  - Desktop PT-BR route loads, calculates default result, shows source access date and disclaimer.
  - User changes base/months/deposit type and sees recalculated output.
  - Fine scenario without official balance shows estimated-base limitation.
  - Official balance + mutual agreement shows 20% fine and 80% withdrawal display.
  - Share copies a URL and restore works in a new page.
  - Save redirects unauthenticated users to sign-in with callback URL preserving query state.
  - Mobile width 390px has no horizontal overflow and controls/results remain usable.
  - EN and ES routes smoke-test localized text and preserve FGTS legal terminology.
- Playwright scenarios:
  - `tests/e2e/fgts.spec.ts` should cover default PT-BR calculation, 40% no-balance warning, official-balance mutual agreement, share/restore with `sv=2026-06-22`, unauthenticated save callback, mobile overflow, and EN/ES smoke routes.
- Lint/build commands:
  - `pnpm test -- lib/calculators/fgts.test.ts lib/url-state/fgts.test.ts`.
  - `pnpm lint`.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm build`.
  - `pnpm run test:e2e -- tests/e2e/fgts.spec.ts` in a browser-capable environment.
- Acceptance criteria:
  - The route `/calculadoras/fgts` exists in all locales and is listed in the calculator registry.
  - Formula outputs match deterministic examples above.
  - Results show source version/access date `2026-06-22`, official-source links, and limitation copy.
  - Domestic-worker exclusion is visible and cannot be mistaken for supported formula coverage.
  - URL share/save state is deterministic and source-version pinned.
  - No PII is requested or persisted.
  - Lint, unit tests, build, and focused e2e/browser checks pass or blockers are documented.

## Implementation Notes

- Status updates:
  - 2026-06-22: Planner selected backlog rank 8 `fgts` from `docs/calculator-backlog.md` only and wrote this buildable `new` calculator plan. Backlog status and app code were left unchanged.
  - 2026-06-22: Creator started implementation. Backlog row moved to `In Progress`; plan status moved to `in_progress`.
  - 2026-06-22: Creator implemented the FGTS calculator route, formula module, URL state, UI, localized SEO/messages, registry entry, focused unit tests, and Playwright harness. Backlog remains `In Progress`; plan remains `in_progress` for tester/orchestrator validation.
- Files changed:
  - `docs/calculator-plans/fgts.md`.
  - `docs/calculator-backlog.md`.
  - `lib/calculators/fgts.ts`.
  - `lib/calculators/fgts.test.ts`.
  - `lib/url-state/fgts.ts`.
  - `lib/url-state/fgts.test.ts`.
  - `lib/url-state/index.ts`.
  - `components/calculators/fgts/fgts-calculator-client.tsx`.
  - `components/calculators/fgts/calculator-form.tsx`.
  - `components/calculators/fgts/results-summary.tsx`.
  - `components/calculators/fgts/breakdown-table.tsx`.
  - `app/[locale]/calculadoras/fgts/page.tsx`.
  - `app/[locale]/calculadoras/fgts/layout.tsx`.
  - `lib/constants.ts`.
  - `messages/pt-br.json`.
  - `messages/en.json`.
  - `messages/es.json`.
  - `tests/e2e/fgts.spec.ts`.
- Validation results:
  - Source validation completed with official MTE/Planalto links and access date 2026-06-22.
  - Similarity check found no existing dedicated FGTS route, module, URL state, message namespace, or prior plan.
  - `pnpm test -- lib/calculators/fgts.test.ts lib/url-state/fgts.test.ts`: passed; Vitest reported 36 files and 405 tests passed.
  - `node -e 'for (const f of ["messages/pt-br.json","messages/en.json","messages/es.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("messages ok")'`: passed.
  - `git diff --check`: passed.
  - `pnpm lint`: passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm build`: passed; `/[locale]/calculadoras/fgts` appeared in the build output.
  - `pnpm run test:e2e -- tests/e2e/fgts.spec.ts`: passed 6/6 focused Chromium tests.
- Tester findings:
  - 2026-06-22: Independent tester validation passed. Read `$calculator-tester` guidance and `references/e2e-checks.md`; inspected the route, stable field IDs/selectors, URL params, share URL generation, and save callback wiring before browser checks.
  - Focused Playwright command: `pnpm run test:e2e -- tests/e2e/fgts.spec.ts` passed 6/6 Chromium tests directly in this environment. No workaround was needed for that configured e2e run.
  - Manual browser setup: started `pnpm dev --hostname localhost --port 3100`; initial manual run surfaced Auth.js `MissingSecret` console errors because the server was not started with e2e auth env. Restarted with `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3100 NEXTAUTH_URL=http://localhost:3100 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3100`.
  - Browser workaround note: standalone Node/REPL Chromium launches reproduced the known sandbox `MachPortRendezvousServer ... Permission denied (1100)` failure. Reran the one-off manual Playwright browser script with escalated execution, using the local Playwright browser cache, to complete browser-capable validation.
  - Manual browser coverage passed with no unexpected console errors after the auth-env restart: PT-BR route load/no redirect loop; default R$ 3.000/12 months showing R$ 240,00 monthly and R$ 3.120,00 estimated deposits; source version/access-date and disclaimer copy; domestic/DAE/eSocial exclusion; no correction/interest/TR/IPCA/JAM/profit/late-charge limitation; official-source precedence copy; apprentice 2% branch showing R$ 30,00 monthly and R$ 180,00 period deposits; 40% no-balance warning scenario showing R$ 1.248,00 fine; official balance R$ 10.000 with CLT art. 484-A showing R$ 2.000,00 fine and R$ 8.000,00 withdrawal display; share URL restores with `sv=2026-06-22`; unauthenticated save redirects to sign-in with callback preserving query state; mobile 390px has no document-level horizontal overflow; EN and ES smoke routes load localized headings/results/source copy.
  - No e2e coverage updates were required; `tests/e2e/fgts.spec.ts` already covered the requested behavior.
- Final status:
  - PR review gate passed with no blocking, issue, security, material test-gap, question, suggestion, or nit findings.
  - Tester validation passed. Plan status is `verified`; backlog rank 8 is marked `Done`.
  - Draft PR: https://github.com/saulodefaria/calculaderia/pull/18.
  - Remaining risk: FGTS legal/source guidance is date-pinned to 2026-06-22; future MTE/FGTS Digital, domestic/eSocial, correction/profit, or judicial-rule changes require a source-version review before expanding scope.
