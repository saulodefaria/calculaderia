---
slug: "decimo-terceiro"
backlogRank: 4
primaryKeyword: "calculadora decimo terceiro"
decision: "new"
targetRoute: "/calculadoras/decimo-terceiro"
status: "verified"
createdAt: "2026-06-18"
updatedAt: "2026-06-18"
---

# Calculadora de Decimo Terceiro Plan

## Backlog Row

- Rank: 4
- Original status: Ready
- Slug: decimo-terceiro
- Primary keyword: calculadora decimo terceiro
- Cluster keywords: calculadora decimo terceiro proporcional; calculadora decimo terceiro 2025
- Opportunity score: 78
- Idea type: New
- Notes: Strong seasonal payroll calculator; include proportional months and deductions.
- Done ref: -

## Decision

- Decision: `new`.
- Target route: `/calculadoras/decimo-terceiro`.
- Rationale: build a focused payroll calculator for 13th salary, payment split, proportional avos, and optional 2026 INSS/IRRF estimates. The concept is related to the `rescisao-trabalhista` calculator, but that route answers termination settlement questions and only exposes 13th salary as one component. A standalone route is justified by the high-volume keyword cluster and seasonal user intent.
- Buildability: buildable. The plan has a deterministic formula contract and current official source links for the 13th salary rule family and 2026 deduction tables. Creator should re-open the Planalto legal URLs during implementation if exact article text is needed, because local curl from this automation timed out for those pages on 2026-06-18.

## Similarity Check

- Existing calculators/routes checked:
  - `app/[locale]/calculadoras` has `rescisao-trabalhista`, `ferias`, `financiamento`, `juros-compostos`, `renda-fixa`, `consorcio`, `comparativo`, `alugar-vs-comprar`, and `tir`; no `decimo-terceiro` route exists.
  - `components/calculators` has no `decimo-terceiro` component folder.
  - `lib/calculators` has no `decimo-terceiro.ts`.
  - `lib/url-state` has no `decimo-terceiro.ts`.
- Related modules/translations checked:
  - `lib/calculators/rescisao-trabalhista.ts` already has helper precedent for `contarAvosDecimoTerceiro`, separate 2026 INSS on 13th salary, and separate IRRF on 13th salary.
  - `lib/calculators/ferias.ts` has the current shared-style 2026 INSS and IRRF constants and reduction-table treatment.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` mention 13th salary only inside rescisao and future/backlog copy.
  - `lib/constants.ts` has an existing calculator category `trabalho-salario-beneficios`, which is the right registry category; no new family or category is needed.
- Prior plans checked:
  - `docs/calculator-plans/rescisao-trabalhista.md` includes 13th salary as severance component.
  - `docs/calculator-plans/ferias.md` links to future `decimo-terceiro`.
  - No prior `docs/calculator-plans/decimo-terceiro.md` existed before this plan.
- Search terms checked: `decimo`, `decimo-terceiro`, `terceiro`, `13th`, `a13`.
- Overlap conclusion: do not merge into `rescisao-trabalhista`. Reuse or extract tested helper logic where practical, but expose a standalone annual/proportional 13th salary workflow.

## User Intent And Scope

- Target user: Brazilian CLT employee, payroll assistant, HR/generalist, or accountant-adjacent user estimating 13th salary for the current year.
- User job:
  - Estimate gross 13th salary by avos.
  - Understand first installment, second installment, previous advance, deductions, and net expected receipt.
  - Check why a partial year generates fewer than 12 avos.
- In scope:
  - CLT employee 13th salary estimate for a selected calendar year.
  - Full-year and proportional modes using admission date and reference/payment date.
  - Salary plus user-provided habitual variable-pay average.
  - Month counting where each month with at least 15 employed days counts as one avo.
  - Optional legal deduction estimate using 2026 INSS and IRRF tables.
  - First-installment estimate, already-advanced value, second-installment gross, deductions, net amount, and a month-by-month avo memo.
- Out of scope:
  - eSocial events, payslip generation, TRCT generation, official payroll closing, FGTS Digital, SEFIP/GFIP, or accounting exports.
  - Union/CCT-specific rules, employer policy variations, payroll rubrics, court-disputed salary nature, and exact historical averages for commissions/overtime.
  - Public servant rules, domestic-worker special operational flows beyond the shared INSS employee/domestic table, apprentices, intermittent work edge cases, and international 13th salary rules.
- Sensitive-topic caveats:
  - Display as educational estimate, not legal/payroll advice.
  - Official payroll, eSocial, collective agreements, and professional review prevail.
  - Deductions are table-driven and year-sensitive; show an explicit "Tabelas 2026" source badge.

## Calculator Contract

- Inputs:
  - `salarioMensal`: gross monthly salary in BRL.
  - `mediaVariavelMensal`: habitual monthly average for commissions, overtime, additional pay, bonuses that user considers salary/remuneration, default `0`.
  - `anoReferencia`: calendar year, default `2026`; first build may support only `2026` for automatic deductions and still allow gross-only years.
  - `dataAdmissao`: employment start date.
  - `dataReferencia`: date through which avos are counted; default current local date for proportional mode and `YYYY-12-31` for full-year projection mode.
  - `modoCalculo`: `projecaoAnual` or `proporcionalAteData`.
  - `adiantamentoJaRecebido`: 13th advance already paid, default `0`.
  - `calcularPrimeiraParcela`: boolean, default `true`, for showing an estimated 50% advance.
  - `dependentesIr`: integer dependents for IRRF, default `0`.
  - `pensaoAlimenticia`: deductible court/agreement pension value for IRRF estimate, default `0`.
  - `outrosDescontos`: manual payroll discounts, default `0`.
  - `outrosAcrescimos`: manual taxable/non-taxable payroll additions for presentation, default `0`; if taxable inclusion is ambiguous, keep out of automatic deduction base unless user opts in.
  - `calcularDescontosLegais`: boolean, default `true` for 2026.
- Defaults:
  - `salarioMensal`: `3000`.
  - `mediaVariavelMensal`: `0`.
  - `anoReferencia`: current local year, but UI copy/test fixtures for this plan should use `2026`.
  - `dataAdmissao`: January 1 of `anoReferencia`.
  - `dataReferencia`: December 31 of `anoReferencia` in annual projection mode.
  - `adiantamentoJaRecebido`: `0`.
  - `dependentesIr`, `pensaoAlimenticia`, `outrosDescontos`, `outrosAcrescimos`: `0`.
- Validation rules:
  - Money fields must be finite, non-negative, and at most `10_000_000`.
  - `anoReferencia` must be a four-digit year; automatic legal deductions are enabled only for supported table year `2026`.
  - Dates must be valid ISO dates.
  - `dataAdmissao` cannot be after `dataReferencia`.
  - `dataReferencia` must fall inside `anoReferencia`; clamp display guidance to Jan 1 through Dec 31 rather than silently accepting another year.
  - `dependentesIr` must be an integer from `0` to `20`.
  - `adiantamentoJaRecebido` cannot reduce the second installment below zero; if it exceeds gross 13th, cap the applied advance at gross 13th and show a warning.
- Outputs:
  - `remuneracaoBase = salarioMensal + mediaVariavelMensal`.
  - `avos`: integer from `0` to `12`.
  - `decimoBruto`.
  - `primeiraParcelaEstimada`.
  - `adiantamentoAplicado`.
  - `segundaParcelaBrutaAntesDescontos`.
  - `inssDecimoTerceiro`.
  - `irrfDecimoTerceiro`.
  - `outrosDescontos`.
  - `liquidoEstimado`.
  - `breakdown`: rows for base, avos, gross 13th, advance, INSS, IRRF, manual discounts, net.
  - `monthMemo`: 12 rows showing days considered and whether each month generated an avo.
  - `warnings`: table year, unsupported year gross-only, advance capped, variable-pay limitation, source freshness.
- Result explanations:
  - Explain the 1/12 formula and the 15-day month rule.
  - Explain that the first installment is an estimate/advance, while legal deductions are normally concentrated when finalizing the 13th salary.
  - Explain that INSS and IRRF are estimated separately from regular monthly salary.
  - Show exact source/table version in the result footer.
- URL params:
  - Compact query params consistent with existing calculators:
    - `s` salary.
    - `mv` variable average.
    - `y` year.
    - `ad` admission date.
    - `rd` reference date.
    - `m` mode (`pa` annual projection, `pd` proportional to date).
    - `aa` advance already received.
    - `dep` dependents.
    - `pa` pension amount.
    - `od` other discounts.
    - `oa` other additions.
    - `dl` legal deductions enabled.
  - Omit defaults from serialized URL state, except always persist `y` so shared 13th-salary URLs keep their selected reference year when decoded in later calendar years.
- Share/save behavior:
  - Use the existing query-state pattern and share button.
  - `stateMode: "query"` in registry.
  - Save/favorites should store the current query URL when the user is authenticated; unauthenticated users follow the existing sign-in redirect behavior.

## Formulas And Sources

- Formula summary:
  - Use local calendar dates, not time-zone instants.
  - `start = max(dataAdmissao, Jan 1 of anoReferencia)`.
  - `end = min(dataReferencia, Dec 31 of anoReferencia)`.
  - For each month in `anoReferencia`, count employed days between `start` and `end` inside that month. If days >= 15, that month contributes one avo.
  - `avos = clamp(countEligibleMonths, 0, 12)`.
  - `remuneracaoBase = salarioMensal + mediaVariavelMensal`.
  - `decimoBruto = round2(remuneracaoBase * avos / 12)`.
  - `primeiraParcelaEstimada = calcularPrimeiraParcela ? round2(decimoBruto / 2) : 0`.
  - `adiantamentoAplicado = min(adiantamentoJaRecebido, decimoBruto)`.
  - `segundaParcelaBrutaAntesDescontos = max(0, decimoBruto - adiantamentoAplicado)`.
  - Optional INSS estimate:
    - Apply 2026 progressive employee/domestic/avulso table to `decimoBruto` as a separate salary-contribution base, capped at the table ceiling.
    - `inssDecimoTerceiro = calcularInss2026(decimoBruto)`.
  - Optional IRRF estimate:
    - Use 2026 monthly IRRF table on the 13th salary base separately.
    - `baseIrrfPadrao = max(0, decimoBruto - inssDecimoTerceiro - dependentesIr * 189.59 - pensaoAlimenticia)`.
    - `baseIrrfSimplificada = max(0, decimoBruto - 607.20)`.
    - `baseIrrfUsada = min(baseIrrfPadrao, baseIrrfSimplificada)` when simplified discount is enabled; otherwise `baseIrrfPadrao`.
    - `irrfAntesReducao = max(0, baseIrrfUsada * aliquota - parcelaDeduzir)`.
    - Apply the 2026 monthly reduction rule against `decimoBruto`, matching existing payroll helpers: reduce to zero up to R$ 5,000.00 of monthly taxable earnings; between R$ 5,000.01 and R$ 7,350.00, use `978.62 - 0.133145 * decimoBruto`, capped between zero and `irrfAntesReducao`; above R$ 7,350.00, no reduction.
    - `irrfDecimoTerceiro = round2(max(0, irrfAntesReducao - reducaoMensal))`.
  - `liquidoEstimado = max(0, segundaParcelaBrutaAntesDescontos - inssDecimoTerceiro - irrfDecimoTerceiro - outrosDescontos + outrosAcrescimos)`.
  - Round currency at output and breakdown boundaries; keep internal math as numbers.
- Data tables or assumptions:
  - INSS 2026 employee/domestic/avulso progressive brackets: up to R$ 1,621.00 at 7.5%; R$ 1,621.01 to R$ 2,902.84 at 9%; R$ 2,902.85 to R$ 4,354.27 at 12%; R$ 4,354.28 to R$ 8,475.55 at 14%.
  - Receita IRRF 2026 monthly table: base up to R$ 2,428.80 exempt; R$ 2,428.81 to R$ 2,826.65 at 7.5% less R$ 182.16; R$ 2,826.66 to R$ 3,751.05 at 15% less R$ 394.16; R$ 3,751.06 to R$ 4,664.68 at 22.5% less R$ 675.49; above R$ 4,664.68 at 27.5% less R$ 908.73.
  - Receita IRRF 2026 deductions/reduction: dependent deduction R$ 189.59; simplified monthly discount limit R$ 607.20; monthly reduction up to R$ 5,000.00 and phase-out through R$ 7,350.00.
  - Variable remuneration is represented as a user-supplied average. The first build should not infer overtime/commission averages from monthly history.
  - Payment timing output is explanatory, not a payroll calendar service.
- Official sources:
  - Brazilian Constitution art. 7, VIII on 13th salary right: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
  - Law 4.090/1962 on gratificacao de Natal / 13th salary: https://www.planalto.gov.br/ccivil_03/leis/l4090.htm
  - Law 4.749/1965 on 13th salary payment dates/advance: https://www.planalto.gov.br/ccivil_03/leis/l4749.htm
  - Decree 57.155/1965 regulating 13th salary laws: https://www.planalto.gov.br/ccivil_03/decreto/1950-1969/d57155.htm
  - INSS 2026 contribution table: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
  - Receita Federal 2026 IRPF/IRRF tables: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
  - Receita Federal contribution incidence table, including 13th salary contribution incidence: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/emissao-e-pagamento-de-darf-das-gps-e-dae/calculo-de-contribuicoes-previdenciarias-e-emissao-de-gps/tabela-de-incidencia-de-contribuicao
  - Receita Federal P&R IRPF 2026 PDF landing page for annual tax guidance context: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf/view
- Source access dates:
  - All source links above recorded for this plan on 2026-06-18.
  - The INSS, Receita IRRF table, Receita contribution incidence page, and Receita P&R landing page were accessible in the browser on 2026-06-18.
  - Local curl to the Planalto legal URLs timed out on 2026-06-18; keep the canonical links and have creator/tester re-open them during implementation if exact article quoting is needed.
- Rule/table effective dates:
  - Law 4.090/1962: 1962-07-13.
  - Law 4.749/1965: 1965-08-12.
  - Decree 57.155/1965: 1965-11-03.
  - INSS table: valid from competency January 2026; INSS page updated 2026-01-13 and states values from Portaria Interministerial MPS/MF No. 13, 2026-01-09.
  - Receita IRRF table: monthly incidence from January 2026; page updated 2026-04-27.
  - Receita P&R IRPF 2026 PDF landing page: version file dated 2026-04-23; page updated 2026-04-27.
- Freshness or maintenance risk:
  - High for INSS and IRRF constants; they change by year and can change mid-year.
  - Medium for 13th salary statutory rules; stable, but interpretation of variable pay, leaves, union agreements, and payroll rubrics can change the official value.
  - Medium for IRRF reduction/simplified-discount details on 13th salary; if creator cannot verify separate 13th IRRF treatment in current Receita/RIR materials during implementation, keep IRRF as an optional estimate with a strong caveat and allow manual discount override.
- Estimator limitations:
  - Exact payroll can differ because of prior advances, salary changes during the year, actual variable-pay averages, absences/leaves, multiple employment links, INSS ceiling already used in other bases, pension orders, payroll competence, and employer/union rules.
  - The result should not be used as a payslip, official tax filing, or legal conclusion.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de Decimo Terceiro".
  - PT-BR description: "Estime 13o salario bruto e liquido, avos proporcionais, primeira parcela, adiantamentos e descontos de INSS/IRRF com tabelas 2026."
  - EN/ES pages should keep the Brazil-specific context clear: Brazilian 13th salary / decimo tercer salario under Brazilian labor rules.
- Main form sections:
  - Salario e ano: salary, variable average, year, calculation mode.
  - Periodo trabalhado: admission date, reference/payment date, annual projection switch.
  - Parcelas: first installment estimate and advance already received.
  - Descontos: dependents, pension, legal-deduction toggle, manual discounts/additions.
- Results sections:
  - Main net estimate and gross 13th salary.
  - Avos badge, base remuneration, and selected table year.
  - Parcel split card: first installment, already advanced, second installment before discounts.
  - Deductions card: INSS, IRRF, manual discounts, net.
  - Month-by-month memo table.
  - Source/disclaimer panel.
- SEO sections:
  - Como calcular o decimo terceiro.
  - O que sao avos do 13o salario.
  - Primeira e segunda parcela do 13o.
  - Decimo terceiro proporcional para quem entrou no ano.
  - Como INSS e IRRF entram no 13o.
  - Limites da calculadora.
- FAQ topics:
  - Como calcular decimo terceiro proporcional?
  - Mes com menos de 15 dias conta?
  - Quando recebo a primeira e a segunda parcela?
  - O INSS do 13o e separado do salario?
  - A calculadora mostra valor liquido exato?
  - Como entram comissoes, horas extras ou salario variavel?
- Disclaimer:
  - Required near results and in SEO content: educational payroll estimate, not legal/accounting advice; official payroll and professional review prevail.
- Related calculator links:
  - Existing: `/calculadoras/rescisao-trabalhista`, `/calculadoras/ferias`, `/calculadoras/juros-compostos`, `/calculadoras/renda-fixa`.
  - Future/backlog: `salario-liquido`, `inss`, `imposto-de-renda`, `fgts`, `decimo-terceiro-proporcional`, `decimo-terceiro-horas-extras`, `decimo-terceiro-pensao`.
- Translation guidance:
  - Add `calculators.decimo-terceiro` namespaces in `pt-br`, `en`, and `es`.
  - Preserve legal Brazilian terms when necessary: `decimo terceiro`, `13o salario`, `avos`, `INSS`, `IRRF`.
  - EN copy should say "Brazilian 13th salary" and avoid implying US applicability.
  - ES copy should say "decimo tercer salario brasileno" and avoid implying Latin America-wide applicability.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/decimo-terceiro.ts`.
  - Reuse/extract `roundMoney`, ISO date parsing, month counting, `calcularInss2026`, and `calcularIrrf2026` patterns from `rescisao-trabalhista` only when it keeps behavior consistent.
  - Export table/source version constant such as `DECIMO_TERCEIRO_SOURCE_VERSION_2026_06_18`.
- URL state:
  - Add `lib/url-state/decimo-terceiro.ts` and tests.
  - Register in `lib/url-state/index.ts` if current pattern requires it.
- UI components:
  - Add `components/calculators/decimo-terceiro/decimo-terceiro-calculator-client.tsx`.
  - Add form, results summary, breakdown table, and avos memo components as needed.
  - Use existing `ShareButton`, `SaveButton`, input/select/table components, and consistent calculator layout.
- Route and metadata:
  - Add `app/[locale]/calculadoras/decimo-terceiro/page.tsx`.
  - Add `layout.tsx` only if existing calculator route pattern requires per-route metadata.
  - Include localized metadata, JSON-LD, FAQ, and breadcrumbs consistent with existing calculators.
- Registry:
  - Add tool definition in `lib/constants.ts` with:
    - `id: "decimo-terceiro"`.
    - `familyId: "calculadoras"`.
    - `primaryCategoryId: "trabalho-salario-beneficios"`.
    - `stateMode: "query"`.
    - `seoApplicationCategory: "FinanceApplication"`.
- Messages:
  - Add complete namespaces to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Keep concise result labels so they fit mobile cards.
- Unit tests:
  - Add `lib/calculators/decimo-terceiro.test.ts`.
  - Cover full 12/12, admission mid-year, month with 14 days not counted, month with 15 days counted, advance capped, INSS ceiling, IRRF examples around reduction thresholds, gross-only unsupported year, and validation errors.
- E2E hooks/tests:
  - Add stable `data-testid` values for salary, dates, mode, advance, legal deductions, share, save, net result, and avos memo.
  - Add focused Playwright spec for route load, calculation, share restore, legal-deduction toggle, save redirect, and mobile layout.
- Backlog updates:
  - Creator may mark row In Progress when implementation starts.
  - Planner did not edit `docs/calculator-backlog.md`.

## Test Plan

- Unit scenarios:
  - Salary R$ 3,000, admission 2026-01-01, reference 2026-12-31 => 12 avos and gross R$ 3,000.
  - Salary R$ 3,000, admission 2026-03-17, reference 2026-12-31 => March does not count if fewer than 15 worked days; expected avos based on month memo.
  - Salary R$ 3,000, admission 2026-03-16, reference 2026-12-31 => March counts with 16 days.
  - Reference 2026-06-14 for employee since Jan 1 => June does not count yet; reference 2026-06-15 counts June.
  - Advance larger than gross caps at gross and warns.
  - INSS progressive table caps at R$ 8,475.55 base.
  - IRRF table applies dependent deduction, simplified discount, and 2026 reduction table.
  - Automatic deductions disabled returns gross/advance/manual-only view.
- URL-state scenarios:
  - Defaults omitted.
  - Full non-default query serializes and parses exactly.
  - Invalid dates/numbers fall back to defaults without throwing in client route.
- Browser scenarios:
  - `/calculadoras/decimo-terceiro` loads in `pt-br` with no console errors.
  - Result updates as salary/date/advance changes.
  - Month memo expands/collapses or remains readable on mobile.
  - Share URL restores all values.
  - Save redirects unauthenticated user consistently with other calculators.
  - `/en/calculadoras/decimo-terceiro` and `/es/calculadoras/decimo-terceiro` smoke-load with localized content.
- Playwright scenarios:
  - Fill a proportional case and assert gross, avos, INSS/IRRF labels, and net are visible.
  - Toggle legal deductions off and assert deductions clear/update.
  - Set an advance and assert second installment changes.
  - Mobile viewport at 390px has no horizontal overflow or overlapping text.
- Lint/build commands:
  - `pnpm lint`
  - `pnpm test -- lib/calculators/decimo-terceiro.test.ts lib/url-state/decimo-terceiro.test.ts`
  - Full `pnpm test` when practical.
  - `pnpm build` with required project environment.
  - `pnpm run test:e2e -- tests/e2e/decimo-terceiro.spec.ts` in browser-capable environment.
- Acceptance criteria:
  - Standalone route is available and registered.
  - Deterministic formula matches source contract and tests.
  - URL state and share restore work.
  - Legal source/table dates are visible in UI copy.
  - Disclaimer is visible near results.
  - PT-BR, EN, and ES messages compile and route metadata is localized.

## Implementation Notes

- Status updates:
  - 2026-06-18: Planner selected rank 4 `decimo-terceiro`; wrote buildable `new` calculator plan. Backlog left unchanged.
  - 2026-06-18: Creator started implementation; marked backlog row `In Progress` and plan status `in_progress`.
  - 2026-06-18: Creator implemented the standalone `/calculadoras/decimo-terceiro` calculator, localized route, formula module, URL state, focused unit tests, and e2e harness. Backlog remains `In Progress`; plan remains `in_progress` and not verified.
  - 2026-06-18: Review-fix worker addressed accepted findings for year-stable URL state, conditional legal-table badge, localized source-version display copy, and localized `/en`/`/es` e2e smoke coverage. Backlog remains `In Progress`; tester validation still pending.
  - 2026-06-18: Second-review test-gap fixed by pinning `y=2026` in the two handwritten shared/restored Playwright URLs for legal-deduction toggle and proportional advance-cap scenarios. No production behavior changed.
  - 2026-06-18: Tester completed browser and focused e2e validation. Existing port 3100 server returned HTTP 200 but failed browser hydration because client chunks returned 500, so tester left that pre-existing process running and started a separate built server on port 3101. Browser/manual coverage and focused Playwright passed after one e2e-only strict-locator fix.
  - 2026-06-18: Orchestrator marked plan `verified` and backlog row `Done` after review fixes, browser/manual validation, focused Playwright, unit tests, lint, and build passed. Draft PR URL pending.
- Files changed:
  - `docs/calculator-plans/decimo-terceiro.md`
  - `docs/calculator-backlog.md`
  - `lib/calculators/decimo-terceiro.ts`
  - `lib/calculators/decimo-terceiro.test.ts`
  - `lib/url-state/decimo-terceiro.ts`
  - `lib/url-state/decimo-terceiro.test.ts`
  - `lib/url-state/index.ts`
  - `components/calculators/decimo-terceiro/decimo-terceiro-calculator-client.tsx`
  - `components/calculators/decimo-terceiro/calculator-form.tsx`
  - `components/calculators/decimo-terceiro/results-summary.tsx`
  - `components/calculators/decimo-terceiro/breakdown-table.tsx`
  - `components/calculators/decimo-terceiro/month-memo-table.tsx`
  - `app/[locale]/calculadoras/decimo-terceiro/page.tsx`
  - `app/[locale]/calculadoras/decimo-terceiro/layout.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/decimo-terceiro.spec.ts`
- Validation results:
  - `pnpm test -- lib/calculators/decimo-terceiro.test.ts lib/url-state/decimo-terceiro.test.ts` passed after implementation: 26 files / 296 tests passed.
  - `pnpm lint` passed.
  - `pnpm build` without environment failed at `prisma generate`: `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build` passed; Next listed `/[locale]/calculadoras/decimo-terceiro`.
  - `pnpm exec next dev --port 3100` started but was unusable in this environment because Watchpack logged repeated `EMFILE: too many open files, watch` warnings and existing calculator routes returned 404.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm exec next start --port 3100` served the built app; `curl -I http://localhost:3100/calculadoras/decimo-terceiro` returned 200 and a content smoke check found the title, form title, and `Tabelas INSS/IRRF 2026`.
- Review-fix validation results:
  - `pnpm test -- lib/calculators/decimo-terceiro.test.ts lib/url-state/decimo-terceiro.test.ts` passed: 26 files / 297 tests passed.
  - `pnpm lint` passed with no warnings.
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public pnpm build` passed; Next listed `/[locale]/calculadoras/decimo-terceiro`.
- Tester validation results:
  - Tester server health check: `curl -I http://localhost:3100/calculadoras/decimo-terceiro` returned 200, but browser validation against that existing server failed with client chunk 500s and `pageerror: Failed to load chunk /_next/static/chunks/0_-l7er0_gsso.js`; treated as unhealthy for browser validation.
  - Tester started a separate built server with `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public NEXT_TELEMETRY_DISABLED=1 AUTH_SECRET=manual-validation-secret AUTH_URL=http://localhost:3101 NEXTAUTH_URL=http://localhost:3101 pnpm exec next start --port 3101`.
  - Tester installed Chromium into writable temp storage with `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright pnpm exec playwright install chromium`; direct in-sandbox Chromium launch still failed with `MachPortRendezvousServer ... Permission denied (1100)`, so browser/e2e commands were run outside the sandbox.
  - Browser/manual validation passed against `http://localhost:3101`: PT-BR route loaded without redirect loop or unexpected console/page errors; salary `6.000,00`, year `2026`, admission `2026-01-01`, reference `2026-12-31`, advance `3.000,00` showed net `R$ 1.973,39`; INSS/IRRF labels, breakdown table, source note, and disclaimer were visible; share URL included `y=2026&s=6000&aa=3000` and restored form/results; unauthenticated save redirected to `/entrar?callbackUrl=%2Fcalculadoras%2Fdecimo-terceiro`; legal deductions off showed the gross/manual-only badge and net `R$ 3.000,00`; proportional shared URL `y=2026&s=3000&m=pd&ad=2026-03-18&rd=2026-06-14&aa=4000&dl=0` restored `2/12` avos and the advance cap warning; 390px mobile had document width `390/390` with usable controls; `/en/calculadoras/decimo-terceiro` and `/es/calculadoras/decimo-terceiro` smoke-loaded localized headings, form copy, and submit buttons.
  - First focused e2e run found a test-only strict-mode failure because the advance-cap warning text appears in two visible warning lists: `getByText("O adiantamento informado passou do 13º bruto") resolved to 2 elements`. Tester narrowed that assertion to `.first()` in `tests/e2e/decimo-terceiro.spec.ts`; no production code changed.
  - `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ms-playwright PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm run test:e2e -- tests/e2e/decimo-terceiro.spec.ts` passed after the e2e-only fix: 5 tests passed.
  - Tester reran `pnpm lint`; passed.
- PR-review findings addressed:
  - `blocking(url-state)`: `y` is always encoded for generated share state; URL-state tests cover a default 2026 share URL decoded under 2027 defaults and assert default share state is not empty.
  - `issue(results)`: legal-table result badge is shown only when `tabelasLegais2026` is present; gross/manual-only badge is shown otherwise.
  - `issue(i18n)`: `sourceVersion` no longer carries English display text; localized source notes now render from structured source fields.
  - `test-gap(e2e)`: focused e2e coverage now includes `/en` and `/es` smoke loads plus share URL assertion for the stable `y` parameter.
- Tester findings:
  - PASS. Browser/manual validation and the focused Playwright spec cover proportional avos boundaries, legal-deduction toggle including gross/manual-only badge, capped advance warning, share restore with `y`, unauthenticated save redirect, mobile overflow, `/en` and `/es` smoke loads, and no unexpected console/page errors on the fresh built server.
- Final status:
  - verified; app implementation complete, route build passes with required `DATABASE_URL`, browser/manual validation passed, focused e2e passed, and the only tester code change was a flaky strict locator fix in `tests/e2e/decimo-terceiro.spec.ts`. Backlog row is `Done`; draft PR URL pending.
