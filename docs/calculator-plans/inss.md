---
slug: "inss"
backlogRank: 9
primaryKeyword: "calculadora inss"
decision: "new"
targetRoute: "/calculadoras/inss"
status: "verified"
createdAt: "2026-06-24"
updatedAt: "2026-06-24"
---

# Calculadora de INSS Plan

## Backlog Row

- Rank: 9.
- Original status: Ready.
- Slug: `inss`.
- Primary keyword: `calculadora inss`.
- Cluster keywords: `calculadora inss 2025`; `calculadora inss sobre salario`.
- Volume: 27100.
- SEO difficulty: 36.
- CPC: R$ 0.30.
- Intent: 2.
- Opportunity score: 72.
- Idea type: New.
- Notes: Needs progressive INSS table by year and clear table-source date.
- Done ref: `-`.
- Selection source: selected only from `docs/calculator-backlog.md`, per automation constraint. `docs/tool-backlog.md` was not used.

## Decision

- Decision: `new`; approved/buildable as a new calculator route.
- Target route: `/calculadoras/inss`.
- Rationale: `inss` is the highest-ranked eligible calculator row after skipping Done, Rejected, Existing, and Enhancement rows. A dedicated INSS calculator is distinct from `/calculadoras/salario-liquido`: it answers the narrower "quanto desconto de INSS sobre este salario" job, surfaces the progressive contribution memo, ceiling, effective rate, and source date without forcing IRRF or net salary assumptions.
- Buildability: buildable. Current official INSS sources validate the 2026 progressive employee/domestic/avulso table and social-security framing. No contradiction was found for the first-build formula. The creator can proceed if the implementation pins table year `2026` and source access date `2026-06-24`.

## Similarity Check

- Existing calculators/routes checked:
  - Existing routes under `app/[locale]/calculadoras`: `salario-liquido`, `fgts`, `ferias`, `decimo-terceiro`, `seguro-desemprego`, `rescisao-trabalhista`, `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, and `renda-fixa`.
  - No `app/[locale]/calculadoras/inss` route exists.
  - No `components/calculators/inss` folder exists.
  - No `lib/calculators/inss.ts` or `lib/url-state/inss.ts` exists.
- Related modules/translations checked:
  - `lib/constants.ts` already has the `calculadoras` family plus `trabalho-salario-beneficios` and `impostos-governo` categories; no new family/category is needed.
  - `lib/calculators/payroll-2026.ts` already contains `PAYROLL_INSS_EMPREGADO_2026` and `calcularInssEmpregado2026` with the same 2026 brackets. The creator should reuse or extend this helper instead of adding a second table implementation.
  - `lib/calculators/salario-liquido.ts` uses the payroll helper as part of a broader salary-net flow with IRRF and manual deductions. It is related, not a duplicate of a focused INSS contribution calculator.
  - Existing payroll/labor calculators also mention INSS in `rescisao-trabalhista`, `ferias`, and `decimo-terceiro`, but those use event-specific bases.
  - `lib/url-state/index.ts` and existing URL-state modules establish the query-state/share pattern.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` include INSS copy inside existing calculators, but there is no standalone `calculators.inss` namespace.
- Prior plans checked:
  - `docs/calculator-plans/salario-liquido.md`, `docs/calculator-plans/fgts.md`, `docs/calculator-plans/ferias.md`, `docs/calculator-plans/decimo-terceiro.md`, `docs/calculator-plans/seguro-desemprego.md`, and `docs/calculator-plans/rescisao-trabalhista.md`.
  - No prior `docs/calculator-plans/inss.md` existed before this plan.
- Search terms checked: `inss`, `previdencia`, `contribuicao`, `salario-liquido`, `salario liquido`, `calculadora inss`, and `calculadora inss sobre salario`.
- Overlap conclusion:
  - Build a standalone `/calculadoras/inss` route.
  - Do not merge into `salario-liquido`, because net salary includes IRRF and paycheck assumptions that are outside the narrower INSS query.
  - Treat backlog rows `inss-irrf`, `inss-autonomo`, `inss-pro-labore`, `inss-em-atraso`, `aposentadoria-inss`, and salary variants as future related routes or modes, not blockers for this employee contribution calculator.

## User Intent And Scope

- Target user: Brazilian CLT employee, domestic employee, trabalhador avulso, HR/payroll assistant, small employer, or accountant-adjacent user estimating the employee-side INSS contribution for a monthly salary-contribution base.
- User job:
  - Enter a monthly salary/remuneration amount.
  - See the estimated employee INSS discount using the current 2026 progressive table.
  - Understand which salary slices used each rate, where the ceiling applies, and why official payroll can differ.
- In scope:
  - Monthly INSS contribution estimate for `empregado`, `empregado domestico`, and `trabalhador avulso`, because the official 2026 table covers these categories together.
  - One informed monthly salary-contribution base for the competence, plus an optional "outras remuneracoes da competencia" field that the user can use for taxable additions or summed concurrent employment values.
  - Progressive slice calculation, contribution ceiling, total estimated contribution, effective rate, and bracket-by-bracket memo.
  - Visible source/table badge: `Tabela INSS 2026`, effective from competence January 2026, sources accessed `2026-06-24`.
  - Warnings for values below the 2026 minimum/reference salary, values above the ceiling, possible multiple employment links, 13th salary being separate, and estimate-only limitations.
- Out of scope:
  - Individual contributor, facultative contributor, MEI, autonomous worker, pro-labore, GPS/DAS/DAE emission, contribution in arrears, interest/fines, regularization, complement to minimum, eSocial filing, DCTFWeb, DARF, employer-side INSS, RAT/FAP/third-party payroll charges, FGTS, IRRF, net salary, payslip generation, or benefit/retirement simulation.
  - Automatic classification of every payroll rubric as salary-contribution or non-contribution. The user supplies the base; the calculator may link to the Receita incidence table as a reference but does not issue legal/payroll classification advice.
  - 13th salary calculation. Official guidance says 13th salary is not summed with monthly remuneration for table framing; use the existing `decimo-terceiro` calculator for that scenario.
  - Legal, accounting, or payroll closing advice.
- Sensitive-topic caveats:
  - The calculator is an educational estimate only.
  - Official payroll, eSocial records, employer rubrics, collective agreements, concurrent employment declarations, and professional review prevail.
  - Current constants are table-driven and freshness-sensitive. The UI must disclose the table year and source access date.

## Calculator Contract

- Inputs:
  - `salarioContribuicao`: monthly salary/remuneration base in BRL.
  - `outrasRemuneracoes`: optional additional salary-contribution amounts in the same monthly competence, default `0`.
  - `categoriaSegurado`: `empregado`, `domestico`, or `avulso`; default `empregado`. This changes labels/disclaimer only, because the official table is the same for these categories.
  - `tabelaAno`: fixed supported table year `2026`.
- Defaults:
  - `salarioContribuicao`: `3000`.
  - `outrasRemuneracoes`: `0`.
  - `categoriaSegurado`: `empregado`.
  - `tabelaAno`: `2026`.
- Validation rules:
  - Money fields must be finite, non-negative, and at most `10_000_000`.
  - `salarioContribuicao` must be greater than `0`.
  - `outrasRemuneracoes` may be `0`.
  - `categoriaSegurado` must be one of the supported categories.
  - `tabelaAno` must equal `2026`; unsupported decoded URLs must return `null` and fall back to defaults without crashing.
  - If the combined base is below `1621.00`, calculate anyway and show a minimum/reference warning rather than making a legal conclusion.
  - If the combined base exceeds `8475.55`, cap the contribution base at the ceiling and show a ceiling warning.
- Outputs:
  - `baseInformada = salarioContribuicao + outrasRemuneracoes`.
  - `baseInss = min(baseInformada, 8475.55)`.
  - `inss = round2(sum(progressive slice contribution))`.
  - `aliquotaEfetiva = inss / baseInformada` when `baseInformada > 0`.
  - `tetoInss = 8475.55`.
  - `margemAteTeto = max(0, 8475.55 - baseInformada)`.
  - Slice rows with `from`, `to`, `rate`, `amount`, and `contribution`.
  - Warnings for table year/source, below-reference salary, ceiling reached, multiple-vinculo limitation, 13th separate treatment, and estimate-only scope.
  - `sourceVersion` with table year `2026`, source access date `2026-06-24`, and effective competence `2026-01`.
- Result explanations:
  - Explain that INSS for these categories is progressive by salary-contribution slices.
  - Explain the salary-contribution ceiling and show whether the user's base hit it.
  - Explain that when the worker has more than one employment link, remunerations should be considered together for the monthly table and ceiling; this calculator estimates from the total base the user enters and does not allocate withholding among employers.
  - Explain that 13th salary is treated separately from monthly remuneration.
  - Explain that the estimate depends on the user choosing the correct salary-contribution base.
- URL params:
  - `tb`: table year, always set to `2026`.
  - `s`: salary-contribution amount.
  - `o`: other salary-contribution remuneration in the same competence.
  - `cat`: category, compact values `e`, `d`, or `a`.
  - Generated share URLs must include `tb=2026` even if all other inputs are default.
- Share/save behavior:
  - Implement `encodeInssState`, `decodeInssState`, and `generateInssShareUrl`.
  - Add the module to `lib/url-state/index.ts`.
  - Use the existing query-state, `ShareButton`, and `SaveButton` pattern.
  - Add `calculatorId="inss"` to `SaveButton`.
  - Shared URLs must restore all fields and immediately show results when valid params are present.
  - Save/favorites should preserve localized route and query string; unauthenticated users should follow the current sign-in redirect/callback behavior.
  - Do not request or encode CPF, NIT/PIS/PASEP, employer name, eSocial receipt, bank data, or any payroll document.

## Formulas And Sources

- Formula summary:
  - Use BRL numeric values and the existing payroll round-money pattern.
  - `baseInformada = round2(max(0, salarioContribuicao) + max(0, outrasRemuneracoes))`.
  - `baseInss = round2(min(baseInformada, 8475.55))`.
  - Apply progressive brackets by marginal slice:
    - up to `1621.00` at `7.5%`;
    - `1621.01` to `2902.84` at `9%`;
    - `2902.85` to `4354.27` at `12%`;
    - `4354.28` to `8475.55` at `14%`.
  - `inss = round2(sum(sliceAmount * sliceRate))`.
  - `aliquotaEfetiva = round4(inss / baseInformada)` when the combined base is positive.
  - `margemAteTeto = round2(max(0, 8475.55 - baseInformada))`.
  - Reuse `calcularInssEmpregado2026` from `lib/calculators/payroll-2026.ts` where possible. Add a dedicated `lib/calculators/inss.ts` wrapper for category labels, source version, warnings, defaults, and route-specific result shape.
- Deterministic expected examples for unit tests:
  - Salary `3000`, no additions: INSS `248.60`; effective rate approximately `8.2867%`.
  - Salary `6000`, no additions: INSS `641.51`; effective rate approximately `10.6918%`.
  - Salary `9000`, no additions: base capped at `8475.55`; INSS `988.09`; ceiling warning present.
  - Salary `1621`: INSS `121.58`.
  - Salary `2902.84`: INSS `236.94`.
  - Salary `4354.27`: INSS `411.11`.
  - Salary `8475.55`: INSS `988.09`.
  - Salary `1500`: INSS `112.50`; below-reference warning present.
- Data tables or assumptions:
  - Table year: `2026`.
  - Source access date for this plan: `2026-06-24` in `America/Sao_Paulo`.
  - INSS employee/domestic/avulso progressive table and ceiling apply from competence January 2026.
  - Minimum/reference salary value in the table is `R$ 1,621.00`.
  - Maximum salary-contribution ceiling is `R$ 8,475.55`.
  - The calculator estimates only the segurado contribution for employee/domestic/avulso categories; employer-side costs are not included.
  - Salary-contribution base classification is user supplied. The calculator should not decide whether a specific bonus, benefit, reimbursement, allowance, or legal settlement item integrates the base.
- Official sources:
  - INSS monthly contribution table: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
  - Portaria Interministerial MPS/MF No. 13, dated 2026-01-09, linked from the INSS table page: https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/PortariaInterministerialMPSMF13de9dejaneirode2026.pdf
  - INSS contribution and salary-contribution framing: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/contribuicao-previdenciaria-e-salario-de-contribuicao
  - Receita Federal contribution incidence table for explaining why rubric classification is outside the calculator's automatic scope: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/emissao-e-pagamento-de-darf-das-gps-e-dae/calculo-de-contribuicoes-previdenciarias-e-emissao-de-gps/tabela-de-incidencia-de-contribuicao
- Source access dates:
  - All source links above were checked on 2026-06-24.
  - INSS contribution table page was accessible on 2026-06-24 and shows updated timestamp `2026-01-13 13h50`.
  - INSS salary-contribution framing page was accessible on 2026-06-24 and shows updated timestamp `2023-12-06 12h11`.
  - Receita incidence table page was accessible on 2026-06-24 and shows updated timestamp `2016-11-08 08h13`.
- Rule/table effective dates:
  - INSS table: valid from competence January 2026.
  - Portaria Interministerial MPS/MF No. 13: dated 2026-01-09.
  - INSS page states the table values were extracted from that Portaria and apply to contributions from competence January 2026.
  - Salary-contribution framing page describes salary contribution as the contribution base and notes employer/contractor responsibility for employee/domestic/avulso-style collection and eSocial reporting.
  - Receita incidence table is not a rate table; it is used only as a limitation/source link for payroll-rubric classification.
- Source validation result:
  - Buildable. The official INSS table page validates the required 2026 progressive rates and ceiling for `empregado`, `empregado domestico`, and `trabalhador avulso`.
  - The official INSS salary-contribution page validates the base/ceiling framing and the need to consider monthly remuneration and contribution limits.
  - The official INSS table page explicitly warns that concurrent employment remunerations should be summed for the monthly table and that 13th salary is not summed with monthly remuneration. The plan reflects both caveats.
  - No contradictory official/current source was found for the first-build employee/domestic/avulso formula.
- Freshness or maintenance risk:
  - High annual freshness risk. INSS brackets, salary minimum/reference, and ceiling are table-driven and should be reviewed whenever a new competence-year table is published.
  - Medium interpretation risk for salary-contribution base composition. Rubric incidence can depend on legal rules, employer setup, agreements, and professional interpretation.
  - The implementation should pin constants and UI copy to `2026`, add a source version such as `INSS_SOURCE_VERSION_2026_06_24`, and make tests fail if a future table year is introduced without URL/message/source updates.
- Estimator limitations:
  - Exact payroll can differ because of multiple employment links, prior withholding in the same competence, employer declarations, eSocial setup, salary-contribution rubric classification, absences, partial months, court/legal treatment, and professional interpretation.
  - The calculator is not a GPS/DAE/DARF generator, official payroll record, CNIS/extrato substitute, benefit simulator, or legal/accounting conclusion.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de INSS".
  - PT-BR description: "Calcule uma estimativa do desconto de INSS sobre salario com tabela progressiva 2026, teto previdenciario e memoria por faixas."
  - EN title: "Brazil INSS Contribution Calculator".
  - EN description should make the Brazil employee contribution scope explicit.
  - ES title: "Calculadora de INSS de Brasil".
  - ES description should make the Brazil employee contribution scope explicit.
- Main form sections:
  - Base de contribuicao: salary/remuneration amount and optional other remuneration in the same competence.
  - Categoria: segmented control or select for `empregado`, `domestico`, and `avulso`, with copy that the table is the same for these categories.
  - Tabela legal: visible `INSS 2026` badge and source access date.
- Results sections:
  - Summary cards for estimated INSS, salary-contribution base used, effective rate, and ceiling status.
  - Bracket memo table with each applied slice, rate, amount, and contribution.
  - Source/disclaimer panel with the exact table year, effective competence, and source links.
  - Warnings panel for below-reference salary, ceiling, multiple employment, 13th salary, and estimate-only limitations.
- SEO sections:
  - "Como calcular INSS sobre salario em 2026".
  - "Tabela progressiva do INSS 2026".
  - "Teto do INSS e aliquota efetiva".
  - "INSS com mais de um vinculo".
  - "O que esta fora desta calculadora".
- FAQ topics:
  - "Qual tabela do INSS esta sendo usada?"
  - "A calculadora serve para empregado domestico?"
  - "A calculadora serve para MEI/autonomo/contribuinte individual?"
  - "Como tratar mais de um emprego?"
  - "Decimo terceiro entra junto no calculo mensal?"
  - "Por que meu holerite pode ter valor diferente?"
- Disclaimer:
  - Educational estimate based on official 2026 sources accessed on 2026-06-24.
  - Official payroll, eSocial, employer records, applicable agreements, and professional review prevail.
  - The user is responsible for informing the correct salary-contribution base.
- Related calculator links:
  - Existing: `/calculadoras/salario-liquido`, `/calculadoras/decimo-terceiro`, `/calculadoras/ferias`, `/calculadoras/rescisao-trabalhista`, and `/calculadoras/fgts`.
  - Future/backlog: `inss-irrf`, `inss-autonomo`, `inss-pro-labore`, `inss-em-atraso`, `aposentadoria-inss`, and `imposto-de-renda`.
- Translation guidance:
  - `pt-br`: use Brazilian payroll terms: `salario de contribuicao`, `teto previdenciario`, `aliquota progressiva`, `competencia`, and `estimativa`.
  - `en`: keep Brazil-specific terms and explain them in plain English; do not imply US/social-security rules.
  - `es`: keep Brazil-specific terms and avoid implying Spanish/LatAm social-security rules.
  - All locales must disclose table year `2026`, source access date `2026-06-24`, and estimate limitations.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/inss.ts`.
  - Reuse `PAYROLL_INSS_EMPREGADO_2026`, `PAYROLL_TABLE_YEAR_2026`, `PAYROLL_MONEY_MAX`, `calcularInssEmpregado2026`, `roundPayrollMoney`, and `roundPayrollRate` from `lib/calculators/payroll-2026.ts` where practical.
  - Add route-specific defaults, validation, categories, warnings, source version, and result shape.
  - Add `lib/calculators/inss.test.ts` with boundary and deterministic examples.
- URL state:
  - Add `lib/url-state/inss.ts`.
  - Export it from `lib/url-state/index.ts`.
  - Add `lib/url-state/inss.test.ts`.
  - Require `tb=2026` in generated/restored URLs.
- UI components:
  - Add `components/calculators/inss/inss-calculator-client.tsx`.
  - Add form, results summary, and bracket memo components under `components/calculators/inss`.
  - Follow existing calculator form/result patterns; include stable `data-testid` hooks for e2e.
- Route and metadata:
  - Add `app/[locale]/calculadoras/inss/page.tsx`.
  - Add `app/[locale]/calculadoras/inss/layout.tsx`.
  - Add localized metadata, canonical path, structured data, FAQ schema if existing patterns support it, and official source links.
- Registry:
  - Add a `tools` entry in `lib/constants.ts` with id `inss`, href `/calculadoras/inss`, `familyId: "calculadoras"`, primary category `trabalho-salario-beneficios`, category IDs `["trabalho-salario-beneficios", "impostos-governo"]`, `stateMode: "query"`, and `seoApplicationCategory: "FinanceApplication"`.
  - Pick an existing imported icon such as `Landmark`, `BriefcaseBusiness`, or `CircleDollarSign`; no new icon import is required unless the creator chooses differently.
- Messages:
  - Add `calculators.inss` namespaces to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Include form labels, result labels, bracket table labels, warnings, source note, SEO copy, FAQ, disclaimer, and related-link copy.
- Unit tests:
  - Cover default, boundaries, ceiling, below-reference warning, additional remuneration, each category label, and invalid inputs.
- E2E hooks/tests:
  - Add `tests/e2e/inss.spec.ts`.
  - Cover PT-BR default calculation, R$ 6,000 scenario, ceiling scenario, share restore with `tb=2026`, unauthenticated save callback retaining query, mobile width, and EN/ES smoke routes.
- Backlog updates:
  - Creator should mark `docs/calculator-backlog.md` row 9 `In Progress` only when implementation starts.
  - Planner did not edit the backlog.

## Test Plan

- Unit scenarios:
  - Default salary `3000` gives `inss = 248.60`, correct slices, effective rate, and source version `2026-06-24`.
  - Salary `6000` gives `inss = 641.51`.
  - Salary `9000` caps base at `8475.55`, gives `inss = 988.09`, and shows ceiling warning.
  - Boundary salaries `1621`, `1621.01`, `2902.84`, `2902.85`, `4354.27`, `4354.28`, `8475.55`, and above ceiling stay stable.
  - Salary below `1621` calculates and shows a below-reference warning.
  - Additional remuneration changes the combined base and slices.
  - Categories `empregado`, `domestico`, and `avulso` share formula but produce valid labels.
  - Invalid money, unsupported table year, and invalid category are rejected.
- URL-state scenarios:
  - Minimal default share URL includes `tb=2026`.
  - Full state round-trips `s`, `o`, `cat`, and `tb`.
  - Missing or unsupported `tb` decodes to `null`.
  - Invalid money/category params decode to `null`.
  - Generated share URL is stable across calendar year changes because the table year is explicit.
- Browser scenarios:
  - `/calculadoras/inss` loads in PT-BR with no unexpected console errors.
  - Default calculation shows INSS `R$ 248,60`, table badge/source date, and progressive breakdown.
  - R$ 6,000 calculation shows INSS `R$ 641,51`.
  - Above-ceiling input shows capped base `R$ 8.475,55`, INSS `R$ 988,09`, and ceiling warning.
  - Share button copies/restores a URL containing `tb=2026`.
  - Save button redirects unauthenticated users with a callback that preserves the generated query string.
  - Mobile width around 390px has no horizontal overflow or text overlap.
  - `/en/calculadoras/inss` and `/es/calculadoras/inss` smoke routes render localized title, form, results, and disclaimer.
- Playwright scenarios:
  - Focused e2e spec should cover default, boundary/ceiling, share restore, save callback, mobile, and EN/ES smoke.
  - Use precise `data-testid` hooks to avoid strict locator conflicts.
- Lint/build commands:
  - `pnpm test -- lib/calculators/inss.test.ts lib/url-state/inss.test.ts`
  - `pnpm lint`
  - `git diff --check`
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm build`
  - `pnpm run test:e2e -- tests/e2e/inss.spec.ts` in a browser-capable environment.
- Acceptance criteria:
  - Formula matches official 2026 INSS table and deterministic examples.
  - Source badge/copy includes table year, access date `2026-06-24`, and effective competence January 2026.
  - Share/save preserve table year and input state.
  - Existing salary/liquid payroll helper behavior is not regressed.
  - All planned PT-BR, EN, and ES content paths render without missing translation keys.

## Implementation Notes

- Status updates:
  - 2026-06-24 planner run: selected rank 9 `inss` from `docs/calculator-backlog.md`; decision `new`; target `/calculadoras/inss`; source validation buildable.
  - 2026-06-24 creator run: marked backlog row 9 `In Progress` and plan status `in_progress` before app implementation.
  - 2026-06-24 creator run: implemented `/calculadoras/inss` and left backlog/plan as `In Progress`/`in_progress` for tester validation.
  - 2026-06-24 PR review gate: passed with no blocking, issue, security, question, suggestion, nit, or material test-gap findings.
  - 2026-06-24 tester run: passed focused e2e, manual/browser coverage, lint, and diff check.
  - 2026-06-24 orchestrator finalization: marked plan `verified` and backlog row `Done` after implementation, review gate, and tester validation passed.
  - 2026-06-24 draft PR created: https://github.com/saulodefaria/calculaderia/pull/20.
- Files changed:
  - `docs/calculator-backlog.md`
  - `docs/calculator-plans/inss.md`
  - `lib/calculators/inss.ts`
  - `lib/calculators/inss.test.ts`
  - `lib/url-state/inss.ts`
  - `lib/url-state/inss.test.ts`
  - `lib/url-state/index.ts`
  - `components/calculators/inss/inss-calculator-client.tsx`
  - `components/calculators/inss/calculator-form.tsx`
  - `components/calculators/inss/results-summary.tsx`
  - `components/calculators/inss/bracket-memo-table.tsx`
  - `app/[locale]/calculadoras/inss/page.tsx`
  - `app/[locale]/calculadoras/inss/layout.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/inss.spec.ts`
- Validation results:
  - Read-only overlap inspection completed for backlog, existing calculator routes, constants, calculator logic modules, URL state, messages, and prior calculator plans.
  - Official source validation completed on 2026-06-24 using current INSS and Receita pages.
  - `pnpm test -- lib/calculators/inss.test.ts lib/url-state/inss.test.ts` passed; runner reported 38 files and 420 tests.
  - `pnpm lint` passed.
  - `git diff --check` passed.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm build` passed.
  - Initial sandboxed `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm run test:e2e -- tests/e2e/inss.spec.ts` was blocked by Chromium `MachPortRendezvousServer ... Permission denied (1100)`.
  - Escalated browser-capable rerun of `DATABASE_URL=postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public pnpm run test:e2e -- tests/e2e/inss.spec.ts` passed 5/5.
  - Read-only PR review gate passed with no blocking, issue, security, question, suggestion, nit, or material test-gap findings.
- Tester findings:
  - 2026-06-24 tester run: read calculator-tester guidance and e2e reference, inspected route selectors/field IDs/share/save behavior, and completed independent validation after review gate pass.
  - Focused `pnpm run test:e2e -- tests/e2e/inss.spec.ts` passed 5/5 directly in this environment; no MachPort/browser-capable rerun was needed.
  - Browser/manual validation passed against `http://localhost:3101` with auth placeholder env: PT-BR route loaded, default showed `R$ 248,60`, salary `R$ 6.000,00` showed `R$ 641,51`, above-ceiling `R$ 9.000,00` showed `R$ 988,09`, capped base `R$ 8.475,55`, and the ceiling warning.
  - Browser/manual validation confirmed source/date/Portaria copy, multiple-vinculo warning, 13th warning, `tb=2026&s=6000` share restore, unauthenticated save redirect callback preserving `/calculadoras/inss?tb=2026&s=6000`, 390px mobile no-horizontal-overflow, EN smoke route, ES smoke route, and no unexpected console/page errors.
  - No production code or e2e test changes were needed; dev server was stopped after validation.
- Final status:
  - Backlog row 9 is `Done`; plan status is `verified`.
  - Done Ref: https://github.com/saulodefaria/calculaderia/pull/20.
