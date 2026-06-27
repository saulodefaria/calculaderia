---
slug: "ferias"
backlogRank: 3
primaryKeyword: "calculadora ferias"
decision: "new"
targetRoute: "/calculadoras/ferias"
status: "verified"
createdAt: "2026-06-07"
updatedAt: "2026-06-07"
---

# Calculadora de Ferias Plan

## Backlog Row

- Rank: 3.
- Original status: Ready.
- Slug: `ferias`.
- Primary keyword: `calculadora ferias`.
- Cluster keywords: `calculadora ferias online`; `calculadora ferias 2025`.
- Opportunity score: 85.
- Idea type: New.
- Notes: Seasonal labor calculator with 1/3 constitutional bonus and abono option.
- Done ref: `-`.

## Decision

- Decision: `new`; approved/buildable as a new calculator route.
- Target route: `/calculadoras/ferias`.
- Rationale: the backlog row is Ready, has a distinct high-volume search intent, and there is no dedicated ferias route, calculator module, URL-state helper, translation namespace, or prior plan. The existing `rescisao-trabalhista` calculator includes vacation items only as termination verbas; it does not cover the common user job of estimating vacation pay, abono pecuniario, active-contract deductions, and the cash impact of sold days.

## Similarity Check

- Existing calculators/routes checked: `rescisao-trabalhista`, `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, and `renda-fixa` under `app/[locale]/calculadoras`.
- Related modules/translations checked: `lib/constants.ts`, `lib/calculators`, `lib/url-state`, `components/calculators`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
- Prior plans checked: `docs/calculator-plans/_template.md` and `docs/calculator-plans/rescisao-trabalhista.md`; no `ferias` plan exists yet.
- Search terms checked: `ferias`, accented source/backlog spelling of ferias, `abono`, `constitucional`, `vencidas`, `dobro`, `proporcionais`, `rescisao`, `INSS`, and `IRRF`.
- Overlap conclusion: build a new core ferias calculator. Backlog rows `ferias-proporcionais`, `ferias-vencidas`, and `salario-apos-ferias` should be handled as modes/SEO sections in this route first. Rows `ferias-coletivas`, `ferias-domestica`, and `ferias-estagiario` should remain future specialized pages because they need different rules or framing.

## User Intent And Scope

- Target user: Brazilian CLT employees, HR/payroll assistants, and small employers who need an educational estimate before reviewing a vacation notice, vacation receipt, payroll slip, accountant calculation, eSocial data, or collective-agreement rule.
- User job: enter salary, variable pay, vacation days, absences, abono option, acquisition/reference dates, and optional deduction settings to estimate gross vacation pay, 1/3 constitutional, abono pecuniario, estimated deductions, net vacation receipt, and cash-flow notes.
- In scope:
  - Individual CLT monthly-salary vacation estimates.
  - Full acquired vacation, proportional accrual estimate, overdue/vencidas estimate, and double-pay warning/estimate when the concession period was missed.
  - Absence-based vacation entitlement table from CLT art. 130.
  - 1/3 constitutional on vacation pay.
  - Abono pecuniario up to one-third of the vacation entitlement, with a separate explanation for salary paid later for sold/worked days.
  - Optional 2026 INSS and IRRF estimates for active-contract vacation pay, with visible table versions and manual override fields.
  - Clear source/date, deduction, and legal/payroll disclaimers.
- Out of scope for the first build:
  - Domestic worker vacation rules, intern/student recesso, public servants, maritime/rural/temporary/apprentice-specific rules, part-time edge cases, collective vacations, union-specific premiums, vacation scheduling approvals, payroll filing, eSocial event generation, and court/legal claim valuation.
  - Exact employer-side FGTS, employer INSS, accounting entries, DCTFWeb/eSocial rubrics, or official payroll compliance.
  - Detailed termination entitlement disputes; direct users to `/calculadoras/rescisao-trabalhista` for termination scenarios.
- Sensitive-topic caveats:
  - Labor/payroll estimates can differ because of collective agreements, variable-pay averaging, absences, leave periods, prior advances, payroll competence, deductions already consumed by monthly salary, and employer eSocial setup.
  - The calculator must not state that it decides legal entitlement, validates payroll, or replaces professional review.

## Calculator Contract

- Inputs:
  - `salarioMensal`: monthly base salary in BRL.
  - `mediaVariavelMensal`: optional average monthly variable remuneration, such as commissions, habitual overtime, night premium, or other habitual additional pay.
  - `modo`: `gozo`, `proporcional`, or `vencidas`.
  - `dataInicioPeriodoAquisitivo`: first day of the acquisition period for the vacation being estimated.
  - `dataReferencia`: date used to count proportional avos or check concession status; default today.
  - `dataInicioFerias`: first planned vacation day for `gozo` and `vencidas`.
  - `faltasInjustificadas`: unjustified absences in the acquisition period, integer 0 to 33.
  - `diasFerias`: days of vacation to be taken/rested in this receipt, integer 0 to 30.
  - `converterAbono`: boolean for selling part of the vacation period.
  - `diasAbono`: sold vacation days, integer 0 to one-third of the entitlement.
  - `incluirSalarioDiasVendidos`: boolean, default true when `diasAbono > 0`, to display the ordinary salary for sold/worked days as separate cash flow.
  - `dependentesIr`: integer dependents for IRRF estimate.
  - `pensaoAlimenticia`: optional deductible alimony amount for IRRF estimate.
  - `outrosDescontos`: optional manual payroll deductions or advances.
  - `outrosAcrescimos`: optional manual extra vacation credits.
  - `calcularDescontosLegais`: boolean, default true, using versioned 2026 INSS/IRRF assumptions.
- Defaults:
  - Salary: 3000.
  - Variable average: 0.
  - Mode: `gozo`.
  - Acquisition start: 12 months before today.
  - Reference date: today.
  - Vacation start: today plus 30 days.
  - Unjustified absences: 0.
  - Vacation days: 30 when no abono; 20 when abono is enabled with a 30-day entitlement.
  - Abono disabled by default; when enabled, default `diasAbono` to one-third of the entitlement.
  - Dependents, alimony, manual discounts, and manual credits: 0.
  - Legal deductions: enabled for `gozo`; disabled or warning-only for proportional/vencidas modes when deduction bases are uncertain.
- Validation rules:
  - Monetary inputs must be finite, non-negative, and defensively capped, for example BRL 0 to BRL 10,000,000.
  - Dates must be valid ISO dates.
  - `dataReferencia` and `dataInicioFerias` must be on or after `dataInicioPeriodoAquisitivo`.
  - `faltasInjustificadas` must be an integer 0 to 33; 33 represents "33 or more" and yields no vacation entitlement.
  - `diasDireito` from absences must be 30, 24, 18, 12, or 0.
  - `diasFerias` must be 0 to `diasDireito - diasAbono` for normal gozo.
  - `diasAbono` must be 0 to `diasDireito / 3` and must be disabled when `diasDireito` is 0.
  - In `proporcional` mode, `avosProporcionais` computed from dates must be 0 to 12 and should count a month when the worked fraction is at least 15 days.
  - In `vencidas` mode, show a warning if the concession period boundary cannot be determined from dates.
  - Dependents must be integer 0 to 20.
  - Invalid URL state must return null and fall back to defaults without crashing.
- Outputs:
  - Summary cards: gross vacation receipt, estimated legal deductions, estimated net vacation receipt, 1/3 constitutional, abono pecuniario, and separate cash-flow note for salary on sold/worked days.
  - Breakdown rows:
    - Vacation days taken/rested.
    - 1/3 on vacation days taken/rested.
    - Abono pecuniario days sold.
    - 1/3 on abono pecuniario.
    - Proportional vacation amount when applicable.
    - Double-pay additional amount when applicable.
    - Manual credits, INSS estimate, IRRF estimate, and manual discounts.
  - Entitlement panel: absence bracket, entitled days, sold days limit, rested days, proportional avos, concession deadline, and double-pay status.
  - Source/date note: "Regras CLT/Constituicao e tabelas INSS/IRRF 2026 consultadas em 2026-06-07."
  - Warnings for abono timing, proportional estimates, late concession, deduction freshness, and cases that should be reviewed by payroll/union/accountant/lawyer.
- Result explanations:
  - Explain that the vacation receipt is separate from ordinary monthly salary.
  - For abono, state that sold days are converted into cash in the vacation calculation and that salary for days actually worked is an ordinary payroll item shown separately, not a second vacation verba.
  - For `vencidas`/`dobro`, explain that this estimator uses the legal concession-period boundary and does not decide disputes.
  - For deductions, explain which bases were included and which were excluded.
- URL params:
  - Use compact params consistent with existing calculators: `s` salary, `mv` variable average, `m` mode, `ai` acquisition start, `ref` reference date, `fi` vacation start, `fa` unjustified absences, `df` vacation days, `ab` abono enabled, `da` abono days, `sv` include sold-day salary, `dep` dependents, `pa` alimony, `od` other discounts, `oc` other credits, and `dl` legal deductions enabled.
  - Mode codes: `g` for `gozo`, `p` for `proporcional`, and `v` for `vencidas`.
  - Booleans should use `1`/`0`.
  - Encoding should omit zero/blank optional values where sensible.
- Share/save behavior:
  - Implement `encodeFeriasState`, `decodeFeriasState`, and `generateFeriasShareUrl`.
  - Add `calculatorId="ferias"` to `SaveButton`.
  - Shared URLs must restore every field and immediately show results when valid query params are present.
  - Save should preserve the canonical localized route and query string and redirect unauthenticated users through the existing sign-in flow.

## Formulas And Sources

- Formula summary:
  - `remuneracaoBase = salarioMensal + mediaVariavelMensal`.
  - Absence entitlement:
    - 0 to 5 unjustified absences: `diasDireito = 30`.
    - 6 to 14: `diasDireito = 24`.
    - 15 to 23: `diasDireito = 18`.
    - 24 to 32: `diasDireito = 12`.
    - 33 or more: `diasDireito = 0`.
  - `valorDia = remuneracaoBase / 30`.
  - Normal gozo:
    - `diasAbonoMax = diasDireito / 3`.
    - `diasAbono = converterAbono ? min(inputDiasAbono, diasAbonoMax) : 0`.
    - `diasGozados = min(inputDiasFerias, diasDireito - diasAbono)`.
    - `feriasGozadas = valorDia * diasGozados`.
    - `tercoFeriasGozadas = feriasGozadas / 3`.
    - `abonoPecuniario = valorDia * diasAbono`.
    - `tercoAbono = abonoPecuniario / 3`.
    - `brutoReciboFerias = feriasGozadas + tercoFeriasGozadas + abonoPecuniario + tercoAbono + outrosAcrescimos`.
    - `salarioDiasVendidos = incluirSalarioDiasVendidos ? valorDia * diasAbono : 0`; display separately as ordinary salary for worked sold days, not as part of the vacation receipt.
  - Proportional mode:
    - `avosProporcionais = count months in the acquisition period with at least 15 worked days between dataInicioPeriodoAquisitivo and dataReferencia`, capped at 12.
    - `proporcaoFaltas = diasDireito / 30`.
    - `feriasProporcionais = remuneracaoBase * avosProporcionais / 12 * proporcaoFaltas`.
    - `tercoProporcional = feriasProporcionais / 3`.
    - First build should disable abono in `proporcional` mode unless a complete vacation period is being granted; otherwise it is only an accrual estimate.
  - Vencidas/dobro mode:
    - `dataFimAquisitivo = addMonths(dataInicioPeriodoAquisitivo, 12) - 1 day`.
    - `dataLimiteConcessivo = addMonths(dataFimAquisitivo, 12)`.
    - `feriasVencidasSimples = valorDia * diasDireito`.
    - `tercoVencidas = feriasVencidasSimples / 3`.
    - `emDobro = dataInicioFerias > dataLimiteConcessivo`.
    - `brutoVencidas = (feriasVencidasSimples + tercoVencidas) * (emDobro ? 2 : 1)`.
    - If the planned vacation starts inside the concession period but ends after the limit, show a warning and either compute a conservative full double estimate or defer partial-day double logic until a sourced helper is added.
    - Do not apply double pay merely because payment occurs less than two days before vacation; STF ADPF 501 invalidated the old TST Sumula 450 expansion for late payment.
  - Optional INSS estimate for active vacation gozo:
    - `baseInssFerias = feriasGozadas + tercoFeriasGozadas`.
    - Exclude `abonoPecuniario` and `tercoAbono` from INSS base.
    - Apply the 2026 progressive employee/domestic/avulso table to the vacation base, respecting the ceiling. If payroll combines other monthly bases before applying the ceiling, show a caveat and allow manual discounts.
  - Optional IRRF estimate for active vacation gozo:
    - P&R IRPF 2026 says vacation plus 1/3 is taxed in the month of payment and separately from other monthly income.
    - `baseIrrfFerias = max(0, feriasGozadas + tercoFeriasGozadas - inssFerias - dependentesIr * 189.59 - pensaoAlimenticia)`.
    - Compare legal deductions with the 2026 simplified monthly discount limit when implemented, then apply the 2026 monthly table and the 2026 reduction table.
    - Exclude abono pecuniario from IRRF base. If implementation cannot verify current Receita/P&R treatment for the additional 1/3 on abono, keep it excluded and show source text, or disable automatic IRRF with a warning.
  - `descontosEstimados = inssFerias + irrfFerias + outrosDescontos`.
  - `liquidoReciboFerias = brutoReciboFerias - descontosEstimados`.
  - `fluxoCaixaBrutoComDiasVendidos = brutoReciboFerias + salarioDiasVendidos`; label this as gross cash-flow view before ordinary payroll deductions on worked days.
  - Round currency outputs to two decimals only at output/breakdown boundaries; keep internal helpers in numbers.
- Data tables or assumptions:
  - INSS 2026 employee/domestic/avulso progressive brackets: up to R$ 1,621.00 at 7.5%; R$ 1,621.01 to R$ 2,902.84 at 9%; R$ 2,902.85 to R$ 4,354.27 at 12%; R$ 4,354.28 to R$ 8,475.55 at 14%.
  - IRRF 2026 monthly table: base up to R$ 2,428.80 exempt; 7.5% less R$ 182.16; 15% less R$ 394.16; 22.5% less R$ 675.49; 27.5% less R$ 908.73; dependent deduction R$ 189.59; simplified monthly discount limit R$ 607.20.
  - IRRF 2026 monthly reduction table: up to R$ 5,000.00 reduces the tax to zero up to R$ 312.89; R$ 5,000.01 to R$ 7,350.00 uses `978.62 - 0.133145 * taxable monthly earnings`; zero reduction from R$ 7,350.00 upward.
  - Dates use local calendar dates, not time zones.
  - The first build should not calculate employer FGTS deposits because they are not an employee vacation receipt item.
- Official sources:
  - CLT consolidated text, especially arts. 129, 130, 134, 137, 142, 143, 145, 146, and 147: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm
  - Brazilian Constitution art. 7, XVII: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
  - FAT/MTE ferias anuais e coletivas FAQ with practical vacation, absence, payment, abono, and collective vacation notes: https://portalfat.trabalho.gov.br/programas-e-acoes-2/programa-de-protecao-do-emprego-ppe/perguntas-frequentes/ferias-anuais-e-coletivas/
  - Receita Federal contribution incidence table for vacation, 1/3, abono pecuniario, and indemnified vacation bases: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/emissao-e-pagamento-de-darf-das-gps-e-dae/calculo-de-contribuicoes-previdenciarias-e-emissao-de-gps/tabela-de-incidencia-de-contribuicao
  - INSS 2026 contribution table: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
  - Receita Federal 2026 IRPF/IRRF tables: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
  - Receita Federal P&R IRPF 2026 for vacation taxation and abono pecuniario non-taxation: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf/view
  - STF ADPF 501 news note on invalidating TST Sumula 450 for double vacation pay by late payment alone: https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=492245&ori=1
- Source access dates: 2026-06-07 for all links above.
- Rule/table effective dates:
  - CLT/Constitution vacation rules are current consolidated/legal sources as accessed on 2026-06-07.
  - INSS table applies from competency January 2026 and is sourced from Portaria Interministerial MPS/MF No. 13, 2026-01-09.
  - Receita Federal IRPF/IRRF 2026 page was updated on 2026-04-27 and applies from January 2026 for monthly incidence and exercise 2027/year-calendar 2026 for annual incidence.
  - Receita Federal P&R IRPF 2026 PDF is version 1.00 dated 2026-04-23 and updated on gov.br on 2026-04-27.
  - STF ADPF 501 decision news is from 2022 and remains relevant to the "late payment alone does not create double vacation pay" boundary unless later law/case law changes it.
- Freshness or maintenance risk:
  - High for INSS/IRRF tables and payroll incidence guidance; use explicit constants such as `INSS_EMPREGADO_2026`, `IRRF_MENSAL_2026`, and `FERIAS_SOURCE_VERSION_2026_06_07`.
  - Medium for CLT vacation rules; statutory text is stable, but jurisprudence and collective agreements can change how disputed cases are handled.
  - High for deductions in `vencidas`/`dobro` mode; if current Receita/eSocial incidence for the double component is not implemented confidently, show gross estimate plus manual deductions instead of a misleading net figure.
- Estimator limitations:
  - The calculator estimates; payroll may differ because of prior advances, payroll competence, other salaries in the month, ceiling already used for INSS, variable-pay averages, absences, leaves, collective agreements, company policy, eSocial rubrics, and judicial interpretation.
  - It should not produce vacation notices, receipts, eSocial files, tax filings, or legal conclusions.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de Ferias".
  - PT-BR description: "Estime ferias CLT com 1/3 constitucional, abono pecuniario, descontos de INSS/IRRF e memoria de calculo transparente."
  - EN/ES pages may preserve the Brazil-specific calculator and explain that the rules are Brazilian CLT rules.
- Main form sections:
  - Remuneracao: salary and variable average.
  - Tipo de calculo: normal gozo, proporcional, or vencidas/dobro.
  - Periodo e direito: acquisition start, reference/vacation start dates, unjustified absences, entitled days.
  - Dias e abono: vacation days, abono toggle, sold days, separate salary-for-sold-days toggle.
  - Descontos: legal deduction toggle, dependents, alimony, manual credits/discounts.
- Results sections:
  - High-level totals.
  - Vacation entitlement and date-status panel.
  - Breakdown table with gross items and deductions.
  - Abono explanation panel separating vacation receipt from ordinary salary for worked sold days.
  - Source/table-version note and disclaimer.
- SEO sections:
  - Como calcular ferias CLT.
  - O que e o 1/3 constitucional de ferias.
  - Como funciona o abono pecuniario e a venda de 10 dias.
  - Ferias proporcionais, vencidas e em dobro.
  - Quais descontos podem aparecer nas ferias.
  - Por que o valor do recibo pode diferir do holerite.
- FAQ topics:
  - Como calcular ferias com 1/3?
  - Vender 10 dias aumenta quanto eu recebo?
  - Abono pecuniario paga INSS ou IRRF?
  - Ferias vencidas sempre sao pagas em dobro?
  - O atraso no pagamento gera dobra automaticamente?
  - Faltas injustificadas reduzem as ferias?
  - Ferias proporcionais sao iguais a rescisao?
  - A calculadora mostra o valor liquido exato?
- Disclaimer:
  - Must be visible near results and in SEO content. Use direct language: educational estimate, not legal, tax, accounting, or payroll advice; official payroll/eSocial/collective agreement/professional review prevails.
- Related calculator links:
  - Existing: `/calculadoras/rescisao-trabalhista` for termination vacation items, `/calculadoras/juros-compostos`, and `/calculadoras/renda-fixa`.
  - Future/backlog: `salario-liquido`, `decimo-terceiro`, `fgts`, `inss`, `imposto-de-renda`, `ferias-proporcionais`, `ferias-vencidas`, and `salario-apos-ferias`.
- Translation guidance:
  - Add `calculators.ferias` namespace to `pt-br`, `en`, and `es`.
  - Keep Brazilian legal terms recognizable where needed: "CLT", "1/3 constitucional", "abono pecuniario", "ferias vencidas".
  - In EN/ES, explain terms in helper copy, for example "abono pecuniario (cash conversion of up to one-third of Brazilian vacation days)".
  - Avoid claiming the calculator applies outside Brazil.
  - Format BRL and dates through existing locale utilities/patterns.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/ferias.ts` with typed inputs/results, mode enum, source/table constants, absence entitlement helper, date helpers, proportional avos helper, deduction helpers, and rounded BRL outputs.
  - Add focused tests in `lib/calculators/ferias.test.ts`.
- URL state:
  - Add `lib/url-state/ferias.ts`.
  - Export it from `lib/url-state/index.ts`.
  - Add URL-state tests for full, minimal, invalid, and blank optional params.
- UI components:
  - Add `components/calculators/ferias/ferias-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, `breakdown-table.tsx`, and an entitlement/status panel.
  - Use the existing calculator pattern with `useSearchParams`, `SaveButton`, `ShareButton`, and client-side restore from valid params.
  - Use date inputs, currency inputs, segmented controls/selects for mode, checkbox/toggle for abono/legal deductions, steppers or number inputs for days/absences/dependents, and accessible warnings.
- Route and metadata:
  - Add `app/[locale]/calculadoras/ferias/page.tsx` with static SEO content, FAQ JSON-LD, breadcrumbs, and Suspense fallback.
  - Add `app/[locale]/calculadoras/ferias/layout.tsx` with localized metadata, canonical URL, and alternates.
- Registry:
  - Add the calculator to `lib/constants.ts` with `familyId: "calculadoras"`, `primaryCategoryId: "trabalho-salario-beneficios"`, `stateMode: "query"`, and a relevant lucide icon such as `CalendarDays`, `BriefcaseBusiness`, or `CalendarRange`.
- Messages:
  - Add full `pt-br`, `en`, and `es` message namespaces for UI, SEO sections, FAQ, result labels, warnings, validation copy, source/table notes, and disclaimer.
- Unit tests:
  - Cover absence brackets, abono limits, normal gozo, proportional avos, vencidas/dobro boundary, INSS 2026 brackets, IRRF 2026 table/reduction behavior, abono exclusion from deduction bases, and rounding.
- E2E hooks/tests:
  - Add stable labels/IDs for Playwright form filling.
  - Extend `tests/e2e/calculator-share-state.spec.ts`.
  - Add a dedicated `tests/e2e/ferias.spec.ts`.
- Backlog updates:
  - Do not mark the backlog in this planning task. The creator should mark `ferias` In Progress when implementation starts and Done only after acceptance passes.

## Test Plan

- Unit scenarios:
  - Salary R$ 3,000, 30-day entitlement, no abono: vacation R$ 3,000, 1/3 R$ 1,000, gross R$ 4,000 before deductions.
  - Salary R$ 3,000, 20 days gozo plus 10 days abono: vacation R$ 2,000, 1/3 on gozo R$ 666.67, abono R$ 1,000, 1/3 on abono R$ 333.33, gross vacation receipt R$ 4,000, plus separate sold-day salary note R$ 1,000.
  - Absence brackets at 5/6, 14/15, 23/24, 32/33 absences.
  - Abono max for 30, 24, 18, and 12 days of entitlement.
  - Proportional mode with fewer than 15 days in a month, exactly 15 days, 11/12, and 12/12.
  - Vencidas mode before, on, and after concession deadline; late payment alone does not set `emDobro`.
  - INSS 2026 bracket boundaries and ceiling.
  - IRRF 2026 exempt, bracket, dependent, simplified discount, and reduction-table cases.
  - Abono and 1/3 on abono are excluded from automatic INSS/IRRF base.
  - Invalid money/date/day inputs throw or return validation errors without NaN outputs.
- URL-state scenarios:
  - Encoding omits zero/blank optional values where sensible.
  - Decoding restores dates, mode code, booleans, days, absences, and money values.
  - Invalid dates, negative money, unknown mode codes, impossible abono days, or impossible ranges return null.
  - Shared URL immediately renders results.
- Browser scenarios:
  - Desktop and mobile form submission for normal vacation.
  - Abono toggle changes day constraints and shows separate sold-day salary note.
  - Mode switch to proportional and vencidas updates visible fields and warnings.
  - Deduction toggle changes net estimate and source/table note remains visible.
  - Share copies a URL and restore works in a new page.
  - Save redirects unauthenticated users to sign-in with callback URL.
  - No horizontal overflow at 390px mobile width.
- Playwright scenarios:
  - Dedicated happy path for 30-day vacation with share/restore.
  - Abono 20+10 path with expected breakdown labels and sold-day salary note.
  - Vencidas/dobro warning path.
  - Mobile viewport path.
  - Add shared-state fixture similar to `/calculadoras/ferias?s=3000&m=g&ai=2025-06-01&fi=2026-07-01&fa=0&df=20&ab=1&da=10&sv=1&dep=0&dl=1`.
- Lint/build commands:
  - `pnpm test`.
  - `pnpm lint`.
  - `pnpm build` with required environment variables documented if the existing Prisma/Auth setup needs them.
  - `pnpm run test:e2e -- tests/e2e/ferias.spec.ts tests/e2e/calculator-share-state.spec.ts`.
- Acceptance criteria:
  - The route `/calculadoras/ferias` exists in all locales and is listed in the calculator registry.
  - A user can estimate normal vacation, vacation with abono, proportional accrual, and vencidas/dobro warning scenarios without console errors.
  - Results show gross receipt, 1/3, abono, estimated deductions, net receipt, entitlement details, and calculation memory.
  - Abono output separates the vacation receipt from ordinary salary for sold/worked days.
  - Every source-sensitive result shows the source/table version date and an estimate disclaimer.
  - Share/save behavior matches existing calculators.
  - URL restoration works from query params.
  - Unit tests cover formula branches and date/deduction edge cases.
  - E2E tests cover submit/share/restore/save and mobile overflow.
  - `pnpm test`, `pnpm lint`, `pnpm build`, and focused e2e tests pass or any failure is documented with a fix plan.

## Implementation Notes

- Status updates: Planner created this buildable `new` plan on 2026-06-07. Creator started implementation on 2026-06-07 and moved the backlog row to `In Progress`; keep it out of `Done` until tester/browser validation passes.
- Files changed:
  - `docs/calculator-backlog.md`
  - `docs/calculator-plans/ferias.md`
  - `lib/calculators/ferias.ts`
  - `lib/calculators/ferias.test.ts`
  - `lib/url-state/ferias.ts`
  - `lib/url-state/ferias.test.ts`
  - `lib/url-state/index.ts`
  - `components/calculators/ferias/ferias-calculator-client.tsx`
  - `components/calculators/ferias/calculator-form.tsx`
  - `components/calculators/ferias/results-summary.tsx`
  - `components/calculators/ferias/entitlement-panel.tsx`
  - `components/calculators/ferias/breakdown-table.tsx`
  - `app/[locale]/calculadoras/ferias/page.tsx`
  - `app/[locale]/calculadoras/ferias/layout.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/ferias.spec.ts`
  - `tests/e2e/calculator-share-state.spec.ts`
- Validation results:
  - Planner-only source validation completed on 2026-06-07 against CLT/Constitution, FAT/MTE vacation FAQ, Receita contribution incidence guidance, INSS 2026 table, Receita IRPF/IRRF 2026 tables, Receita P&R IRPF 2026, and STF ADPF 501 note.
  - `PATH=/Users/saulodefaria/.nvm/versions/node/v22.21.1/bin:$PATH pnpm test -- lib/calculators/ferias.test.ts lib/url-state/ferias.test.ts lib/constants.test.ts`: passed, 24 test files / 277 tests. The worker default Node 20.9.0 is below the repo engine requirement and cannot run Vitest because `node:util.styleText` is missing, so validation used local Node 22.21.1.
  - `PATH=/Users/saulodefaria/.nvm/versions/node/v22.21.1/bin:$PATH pnpm lint`: passed.
  - `PATH=/Users/saulodefaria/.nvm/versions/node/v22.21.1/bin:$PATH DATABASE_URL='postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public' pnpm build`: passed. A build without `DATABASE_URL` stops at `prisma generate`, so the example Postgres URL from `.env.example` was supplied for compile validation.
  - `PATH=/Users/saulodefaria/.nvm/versions/node/v22.21.1/bin:$PATH pnpm test`: passed, 24 test files / 277 tests.
  - `PATH=/Users/saulodefaria/.nvm/versions/node/v22.21.1/bin:$PATH pnpm run test:e2e -- tests/e2e/ferias.spec.ts tests/e2e/calculator-share-state.spec.ts`: blocked before page interaction because Playwright Chromium cannot launch in this sandbox (`MachPortRendezvousServer ... Permission denied (1100)`). Re-run in a browser-capable environment; the added tests cover abono submit/share/restore/save, vencidas/dobro restore, mobile overflow, and shared-state restore.
  - Tester update on 2026-06-07 11:42 -03: added e2e coverage for proportional avos/warnings and legal-deduction toggle in `tests/e2e/ferias.spec.ts`.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm test -- lib/calculators/ferias.test.ts lib/url-state/ferias.test.ts`: passed, 24 test files / 277 tests.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm lint`: passed after the tester e2e spec update.
  - `source ~/.nvm/nvm.sh && nvm use && pnpm test:e2e -- tests/e2e/ferias.spec.ts tests/e2e/calculator-share-state.spec.ts`: blocked before page interaction in this sandbox for all 14 focused specs because Playwright Chromium still cannot launch (`MachPortRendezvousServer ... Permission denied (1100)`).
  - `source ~/.nvm/nvm.sh && nvm use && pnpm run test:e2e -- tests/e2e/ferias.spec.ts tests/e2e/calculator-share-state.spec.ts`: passed with elevated browser permissions on 2026-06-07 after tightening ambiguous e2e selectors, 14 focused Chromium tests.
  - Browser validation with `source ~/.nvm/nvm.sh && nvm use && AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3100 NEXTAUTH_URL=http://localhost:3100 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3100`: passed for route load, desktop form interaction, share/restore, unauthenticated save redirect, proportional mode, vencidas/dobro mode, deduction toggle, mobile viewport, and locale smoke checks.
- Tester findings:
  - `/calculadoras/ferias` loaded in the in-app browser without a redirect loop or captured console/hydration errors.
  - Normal 20+10 abono path with salary R$ 3.000,00 showed gross receipt R$ 4.000,00, estimated deductions R$ 215,69, net receipt R$ 3.784,31, abono + 1/3 R$ 1.333,33, sold-day salary R$ 1.000,00, gross cash-flow note R$ 5.000,00, source note, and educational disclaimer.
  - Share copied a compact `/calculadoras/ferias?...` URL and restored salary, days, abono checkbox, visible results, and no overflow in a new browser tab.
  - Save redirected unauthenticated users to `/entrar?callbackUrl=...` with the "Entre para salvar favoritos" prompt.
  - Proportional shared URL restored 6 absences, 24 vacation days, 5/12 avos, R$ 1.333,33 gross result, proportional warning, and deduction-base warning.
  - Vencidas/dobro shared URL restored R$ 8.000,00 gross result, "Adicional de dobra", "Dobra estimada: Sim", and the conservative double-pay warning.
  - Deduction toggle path showed INSS/IRRF rows while enabled for salary R$ 6.000,00, then removed legal deduction rows and set gross/net to R$ 8.000,00 after disabling automatic legal deductions.
  - Mobile validation at 390px completed the abono path, showed results, kept the sold-days field usable, and had no horizontal document overflow.
  - Locale smoke checks for `/en/calculadoras/ferias` and `/es/calculadoras/ferias` loaded localized headings/forms with no captured console errors.
- Final status:
  - Orchestrator marked the plan `verified` and backlog row `Done` on 2026-06-07 after creator implementation and tester browser validation passed for `/calculadoras/ferias`. Focused Playwright e2e later passed with elevated browser permissions on 2026-06-07 after strict locator fixes in `tests/e2e/ferias.spec.ts`.
