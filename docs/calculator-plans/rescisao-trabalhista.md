---
slug: "rescisao-trabalhista"
backlogRank: 1
primaryKeyword: "calculadora rescisao"
decision: "new"
targetRoute: "/calculadoras/rescisao-trabalhista"
status: "verified"
createdAt: "2026-05-31"
updatedAt: "2026-05-31"
---

# Calculadora de Rescisao Trabalhista Plan

## Backlog Row

- Rank: 1.
- Original status: Ready.
- Slug: `rescisao-trabalhista`.
- Primary keyword: `calculadora rescisao`.
- Cluster keywords: `calculadora rescisao de trabalho`; `calculadora rescisao trabalhista`.
- Opportunity score: 96.
- Idea type: New.
- Notes: High-volume labor calculator; requires current CLT rules and disclaimer.
- Done ref: `-`.

## Decision

- Decision: `new`; approved/buildable as a new calculator route.
- Target route: `/calculadoras/rescisao-trabalhista`.
- Rationale: this is the highest-ranked Ready backlog item and there is no existing labor/rescisao calculator route, module, URL-state file, translation namespace, or prior plan. The route should use the backlog slug because it matches the labor-specific cluster and leaves shorter/specialized variants available for SEO copy or future pages.

## Similarity Check

- Existing calculators/routes checked: `financiamento`, `consorcio`, `comparativo`, `alugar-vs-comprar`, `tir`, `juros-compostos`, and `renda-fixa` under `app/[locale]/calculadoras`.
- Related modules/translations checked: `lib/constants.ts`, `lib/calculators`, `lib/url-state`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
- Prior plans checked: only `docs/calculator-plans/_template.md` exists; no rescisao plan exists yet.
- Search terms checked: `rescis`, `trabalhista`, `CLT`, `fgts`, `ferias`, `férias`, `decimo`, and `décimo`.
- Overlap conclusion: build a new core rescisao calculator. Backlog variants such as `rescisao-clt`, `rescisao-contrato`, `rescisao-fgts-multa`, `rescisao-sem-fgts`, `rescisao-pedido-demissao`, `rescisao-sem-justa-causa`, and variable-pay rescisao rows should be handled as modes, FAQ sections, or later long-tail pages after this core route exists.

## User Intent And Scope

- Target user: Brazilian CLT employees, payroll/HR assistants, and small employers who need a quick educational estimate of termination amounts before checking an official TRCT, eSocial, FGTS Digital, accountant, union, or labor lawyer.
- User job: enter salary, dates, termination reason, notice situation, vacation state, FGTS balance, and optional advances to estimate gross severance, possible FGTS fine/withdrawal, deductions, and a net amount.
- In scope:
  - Indefinite-term CLT employment, monthly salary basis.
  - Termination reasons: dismissal without cause, resignation, dismissal with cause, mutual agreement under CLT art. 484-A, and indirect termination as an estimate that requires judicial recognition.
  - Salary balance, notice pay/discount, proportional 13th salary, overdue/proportional vacation plus one-third, FGTS rescisory deposit estimate, FGTS fine estimate, manual credits, manual deductions, and optional INSS/IRRF estimates for 2026 tables.
  - Clear breakdown by verba so the user can see which items are included or excluded by termination reason.
- Out of scope for the first build:
  - Domestic workers, apprentices, interns, temporary workers, fixed-term/experience-contract indemnities, public servants, rural-specific exceptions, intermitente-specific rules, collective bargaining rules, stability/reintegration, court-awarded values, penalties, homologation workflow, and unemployment-insurance value calculation.
  - Exact FGTS Digital/employer calculation when the user does not know the official FGTS base/history.
  - Legal advice, payroll filing guidance, or claims that the result replaces TRCT/eSocial/FGTS Digital.
- Sensitive-topic caveats:
  - Labor termination is legal/payroll-sensitive. Every result screen must state that values are estimates and can differ because of collective agreements, variable pay averages, absences, prior payments, stability, judicial recognition, and official employer declarations.
  - For indirect termination, show a stronger note that the calculator only simulates the same verba family as dismissal without cause after recognition; it does not determine entitlement.

## Calculator Contract

- Inputs:
  - `salarioMensal`: monthly base salary in BRL.
  - `mediaVariavelMensal`: optional average monthly variable remuneration, such as commissions, habitual overtime, or additional pay, included in the remuneration base when informed.
  - `dataAdmissao`: admission date.
  - `dataDesligamento`: effective termination/last-service date.
  - `motivo`: `semJustaCausa`, `pedidoDemissao`, `justaCausa`, `acordo`, or `rescisaoIndireta`.
  - `avisoPrevio`: `trabalhado`, `indenizado`, `dispensado`, `descontado`, or `naoSeAplica`; available options should adapt to the selected reason.
  - `diasTrabalhadosMes`: auto-filled from `dataDesligamento` day and editable from 0 to 30.
  - `feriasVencidasPeriodos`: integer count of full overdue vacation periods not yet paid, default 0.
  - `saldoFgts`: optional current FGTS balance/base for this employment contract.
  - `saldoFgtsIncluiVerbasRescisorias`: boolean, default false.
  - `dependentesIr`: integer dependents for IRRF estimate, default 0.
  - `adiantamentoDecimoTerceiro`: optional 13th already paid in the year.
  - `adiantamentoFerias`: optional vacation/one-third already paid or to deduct.
  - `outrosCreditos`: optional user-entered extra credits.
  - `outrosDescontos`: optional user-entered extra deductions.
  - `calcularDescontosLegais`: boolean, default true, using versioned 2026 INSS/IRRF tables.
- Defaults:
  - Salary: 3000.
  - Variable average: 0.
  - Admission date: one year before today.
  - Termination date: today.
  - Reason: dismissal without cause.
  - Notice: indemnified for dismissal without cause and indirect termination; discounted for resignation only when explicitly selected; not applicable for with-cause dismissal.
  - Vacation overdue periods, FGTS balance, advances, credits, deductions, and dependents: 0 or blank as appropriate.
- Validation rules:
  - Monetary inputs must be finite, non-negative, and capped defensively, for example BRL 0 to BRL 10,000,000.
  - Dates must be valid ISO dates; `dataDesligamento` must be on or after `dataAdmissao`.
  - Employment duration should be capped to a practical UI range, for example 0 to 50 years.
  - `diasTrabalhadosMes` must be 0 to 30; if the date day is 31, cap the default at 30.
  - `feriasVencidasPeriodos` should be integer 0 to 5.
  - Dependents should be integer 0 to 20.
  - Invalid URL state must return null and fall back to defaults without crashing.
- Outputs:
  - Summary cards: total gross estimate, estimated deductions, estimated net amount, FGTS fine, FGTS withdrawal eligibility/amount, and notice days.
  - Breakdown table grouped by proventos, FGTS estimates, and descontos.
  - Scenario explanation listing which rights were included for the selected reason.
  - Source/date note for legal rules and tax tables.
  - Warnings when FGTS balance is missing, when indirect termination is selected, or when legal deductions use annual tables that may need updates.
- Result explanations:
  - Explain salary balance, notice, proportional 13th, vacation plus one-third, FGTS deposits/fine, and optional taxes in short plain Portuguese.
  - When an item is zero because of the selected reason, show "Nao se aplica neste motivo" or equivalent translated text rather than hiding it entirely.
- URL params:
  - Use compact params consistent with existing calculators: `s` salary, `mv` variable average, `ad` admission date, `dd` termination date, `mt` motive, `av` notice, `dt` worked days, `fv` overdue vacation periods, `fg` FGTS balance, `fi` FGTS balance includes rescisory values, `dep` dependents, `a13`, `af`, `oc`, `od`, and `dl` for legal deductions enabled.
  - Motive codes: `sjc`, `pd`, `jc`, `ac`, `ri`.
  - Notice codes: `trab`, `ind`, `disp`, `desc`, `na`.
- Share/save behavior:
  - Implement `encodeRescisaoTrabalhistaState`, `decodeRescisaoTrabalhistaState`, and `generateRescisaoTrabalhistaShareUrl`.
  - Add `calculatorId="rescisao-trabalhista"` to `SaveButton`.
  - Shared URLs must restore all fields and immediately show results when valid query params are present.

## Formulas And Sources

- Formula summary:
  - `remuneracaoBase = salarioMensal + mediaVariavelMensal`.
  - `saldoSalario = remuneracaoBase / 30 * diasTrabalhadosMes`.
  - `anosCompletos = full years between dataAdmissao and dataDesligamento`.
  - `diasAvisoProporcional = min(90, 30 + max(0, anosCompletos) * 3)`, with less than one full year still returning 30. Unit tests must pin the exact anniversary behavior.
  - Dismissal without cause and indirect termination: if notice is indemnified, `avisoCredito = remuneracaoBase / 30 * diasAvisoProporcional`; if worked, no separate notice credit because the user-entered termination date should already represent the final worked date.
  - Mutual agreement: if notice is indemnified, credit 50% of the indemnified notice value; if worked, no separate notice credit.
  - Resignation: if notice is discounted, `avisoDesconto = remuneracaoBase / 30 * 30`; do not apply proportional notice against the employee by default.
  - With-cause dismissal: no notice credit, no proportional 13th, no proportional vacation, no FGTS fine/withdrawal.
  - `avosDecimoTerceiro`: count months in the termination calendar year where the employment interval has at least 15 days; include projected indemnified notice where applicable and document this in a helper test.
  - `decimoTerceiroProporcional = remuneracaoBase * avosDecimoTerceiro / 12`, minus `adiantamentoDecimoTerceiro`.
  - `feriasVencidas = feriasVencidasPeriodos * remuneracaoBase * 4 / 3`.
  - `avosFeriasProporcionais`: count months in the current acquisition period where the employment interval has at least 15 days; include projected indemnified notice where applicable. Cap at 11/12 for proportional vacation because a full period should be represented by `feriasVencidasPeriodos`.
  - `feriasProporcionais = remuneracaoBase * avosFeriasProporcionais / 12 * 4 / 3`, minus `adiantamentoFerias`; omit for with-cause dismissal.
  - `fgtsRescisorioEstimado = 8% * (saldoSalario + decimoTerceiroProporcional + avisoCreditoIndenizadoElegivel)`, excluding vacation indemnity and non-remuneratory/manual credits.
  - If `saldoFgts` is informed: `baseMultaFgts = saldoFgts + (saldoFgtsIncluiVerbasRescisorias ? 0 : fgtsRescisorioEstimado)`.
  - If `saldoFgts` is blank: estimate historic FGTS as `8% * remuneracaoBase * mesesContrato`, plus rescisory FGTS, and mark the FGTS fine as a rough estimate because salary history/corrections/deposits may differ.
  - FGTS fine: 40% for dismissal without cause and indirect termination after recognition; 20% for mutual agreement; 0% for resignation and with-cause dismissal.
  - FGTS withdrawal display: 100% of eligible balance for dismissal without cause/indirect termination, up to 80% for mutual agreement, no immediate withdrawal for resignation/with-cause in this calculator.
  - Optional INSS estimate: use the 2026 progressive employee table for salary/remuneratory base and calculate 13th separately.
  - Optional IRRF estimate: use the Receita Federal 2026 monthly table, dependent deduction, simplified discount limit, and reduction table if implemented; calculate monthly and 13th bases separately after INSS. If the implementation cannot confidently model the 2026 reduction table, show gross and manual deductions only and mark automatic IRRF as deferred.
- Data tables or assumptions:
  - INSS 2026 employee/domestic/avulso progressive brackets: up to R$ 1,621.00 at 7.5%; R$ 1,621.01 to R$ 2,902.84 at 9%; R$ 2,902.85 to R$ 4,354.27 at 12%; R$ 4,354.28 to R$ 8,475.55 at 14%.
  - IRRF 2026 monthly table: base up to R$ 2,428.80 exempt; 7.5% less R$ 182.16; 15% less R$ 394.16; 22.5% less R$ 675.49; 27.5% less R$ 908.73; dependent deduction R$ 189.59; simplified monthly discount limit R$ 607.20; monthly reduction table from Receita Federal 2026 page.
  - FGTS standard deposit assumption: 8% of remuneration for CLT workers, with 2% apprenticeship out of scope.
  - Dates use local calendar dates, not time zones.
- Official sources:
  - CLT consolidated text: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm
  - Brazilian Constitution art. 7 rights: https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm
  - Law 12.506/2011 on proportional notice: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12506.htm
  - Law 4.090/1962 on 13th salary: https://www.planalto.gov.br/ccivil_03/leis/l4090.htm
  - Law 8.036/1990 on FGTS: https://www.planalto.gov.br/ccivil_03/leis/l8036compilada.htm
  - Law 13.467/2017, including mutual agreement termination: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm
  - MTE rural contracting booklet with termination-mode summary: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/trabalho-sustentavel/cartilhas/formalizacao_contrato_de_trabalho
  - MTE FGTS overview: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/fgts/fundo-de-garantia-do-tempo-de-servico-fgts
  - MTE FGTS Digital base/fine guidance: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/comunicados/informando-o-valor-base-para-fins-rescisorios-no-fgts-digital/
  - MTE FGTS Digital FAQ: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/perguntas-frequentes
  - INSS 2026 contribution table: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal
  - Receita Federal 2026 IRPF tables: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
- Source access dates: 2026-05-31 for all links above.
- Rule/table effective dates:
  - CLT, Constitution, notice, 13th, FGTS, and mutual-agreement rules are current consolidated/legal sources as accessed on 2026-05-31.
  - INSS table applies from competency January 2026.
  - Receita Federal IRPF table applies from January 2026 for monthly incidence and exercise 2027/year-calendar 2026 for annual incidence.
- Freshness or maintenance risk:
  - High. INSS and IRRF tables change by year and sometimes mid-year; FGTS Digital operational guidance can change; labor-law interpretation can depend on case law, union agreements, and eSocial rubrics.
  - Add a visible "Tabelas 2026" note and a testable constant name/version so future updates are easy to find.
- Estimator limitations:
  - Exact severance depends on official payroll history, absences, variable-pay averages, prior vacation/13th payments, FGTS deposits, correction/interest, collective agreement clauses, and legal recognition of some termination reasons.
  - The calculator should not generate TRCT, GRRF/FGTS Digital guides, unemployment-insurance requests, or legal conclusions.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: "Calculadora de Rescisao Trabalhista".
  - PT-BR description: "Estime verbas de rescisao CLT, aviso previo, ferias, decimo terceiro, FGTS e descontos com uma memoria de calculo transparente."
  - EN/ES pages may preserve the Brazil-specific calculator but localize labels and explain that rules are Brazilian CLT rules.
- Main form sections:
  - Dados do contrato: salary, variable average, admission date, termination date.
  - Motivo e aviso previo: reason selector and adaptive notice selector.
  - Ferias e 13o: overdue vacation periods and advances.
  - FGTS: current FGTS balance/base and whether it includes rescisory values.
  - Descontos e ajustes: dependents, legal-deduction toggle, manual credits/deductions.
- Results sections:
  - High-level totals.
  - Verbas rescisorias breakdown table.
  - FGTS estimate panel.
  - Discount/net panel.
  - "Como chegamos nesse valor" explanation with source-date badge.
  - Disclaimer/warnings.
- SEO sections:
  - Como calcular rescisao trabalhista.
  - O que entra na rescisao sem justa causa.
  - Pedido de demissao vs dispensa sem justa causa.
  - Aviso previo trabalhado, indenizado e descontado.
  - Como estimar ferias, 13o e FGTS na rescisao.
  - Limites da calculadora e quando procurar contador/advogado.
- FAQ topics:
  - A calculadora mostra o valor liquido exato?
  - Como calcular rescisao sem justa causa?
  - Pedido de demissao recebe multa de FGTS?
  - Rescisao por acordo recebe quanto de FGTS?
  - Aviso previo proporcional conta no calculo?
  - Ferias vencidas entram mesmo na justa causa?
  - O que muda com salario variavel, horas extras ou comissoes?
- Disclaimer:
  - Must be present near results and in SEO content. Use direct language: educational estimate, not legal/payroll advice; official TRCT/eSocial/FGTS Digital and professional review prevail.
- Related calculator links:
  - Existing: `/calculadoras/juros-compostos` and `/calculadoras/renda-fixa` for planning/investing received funds.
  - Future/backlog: `fgts`, `salario-liquido`, `ferias`, `decimo-terceiro`, `seguro-desemprego`, `rescisao-clt`, and `rescisao-sem-justa-causa`.
- Translation guidance:
  - Add `calculators.rescisao-trabalhista` namespace to `pt-br`, `en`, and `es`.
  - Keep legal terms recognizable in Portuguese where needed, with localized helper copy in EN/ES, for example "FGTS (Brazilian severance fund)".
  - Avoid claiming the calculator applies outside Brazil.
  - Format BRL and dates through existing locale utilities/patterns.

## Implementation Checklist

- Calculator logic:
  - Add `lib/calculators/rescisao-trabalhista.ts` with typed inputs/results, reason/notice enums, table constants, helper functions for date avos, progressive tax brackets, and rounded BRL outputs.
  - Add focused tests in `lib/calculators/rescisao-trabalhista.test.ts`.
- URL state:
  - Add `lib/url-state/rescisao-trabalhista.ts`.
  - Export it from `lib/url-state/index.ts`.
  - Add URL-state tests for full, minimal, invalid, and blank optional params.
- UI components:
  - Add `components/calculators/rescisao-trabalhista/rescisao-trabalhista-calculator-client.tsx`, `calculator-form.tsx`, `results-summary.tsx`, and a breakdown table component.
  - Use the existing calculator pattern with `useSearchParams`, `SaveButton`, `ShareButton`, and client-side restore from valid params.
  - Use controls appropriate to the app: date inputs, currency inputs, segmented/select controls for reason/notice, checkbox/toggle for legal deductions, and accessible warnings.
- Route and metadata:
  - Add `app/[locale]/calculadoras/rescisao-trabalhista/page.tsx` with static SEO content, FAQ JSON-LD, breadcrumbs, and Suspense fallback.
  - Add `app/[locale]/calculadoras/rescisao-trabalhista/layout.tsx` with localized metadata, canonical URL, and alternates.
- Registry:
  - Add the calculator to `lib/constants.ts` with an appropriate lucide icon such as `BriefcaseBusiness`, `FileText`, or `ReceiptText`.
- Messages:
  - Add full `pt-br`, `en`, and `es` message namespaces for calculator UI, SEO sections, FAQ, result labels, warnings, and validation copy.
- Unit tests:
  - Cover all termination reasons, notice modes, 13th/vacation avos edge cases, FGTS informed vs estimated, 2026 INSS brackets, optional IRRF behavior if implemented, and rounding.
- E2E hooks/tests:
  - Add stable labels/IDs for Playwright form filling.
  - Extend `tests/e2e/calculator-share-state.spec.ts`.
  - Add a dedicated `tests/e2e/rescisao-trabalhista.spec.ts`.
- Backlog updates:
  - Do not mark the backlog in this planning task. The creator should mark `rescisao-trabalhista` In Progress when implementation starts and Done only after acceptance passes.

## Test Plan

- Unit scenarios:
  - Dismissal without cause, one-year employee, indemnified notice, no overdue vacation, with FGTS balance informed.
  - Resignation with notice discount: includes salary balance, proportional 13th, vacation, and notice discount; excludes FGTS fine/withdrawal.
  - With-cause dismissal: includes salary balance and overdue vacation only; excludes proportional 13th, proportional vacation, notice, and FGTS fine.
  - Mutual agreement with indemnified notice: applies 50% notice and 20% FGTS fine, with 80% FGTS withdrawal display.
  - Indirect termination: same monetary family as without-cause dismissal, plus stronger warning flag.
  - Date edge cases: admission/termination same month with fewer than 15 days, exactly 15 days, anniversary date, leap day, and termination day 31 capped to 30 salary days.
  - FGTS blank vs informed balance.
  - INSS 2026 bracket boundaries and teto.
  - IRRF 2026 bracket/dependent/simplified discount behavior if automatic IRRF is implemented.
- URL-state scenarios:
  - Encoding omits zero/blank optional values where sensible.
  - Decoding restores dates, enum codes, booleans, and money values.
  - Invalid dates, negative money, unknown enum codes, or impossible ranges return null.
  - Shared URL immediately renders results.
- Browser scenarios:
  - Desktop and mobile form submission.
  - Reason selector changes available notice options and recalculates explanations.
  - FGTS warning appears when no balance is informed.
  - Share copies a URL and restore works in a new page.
  - Save redirects unauthenticated users to sign-in with callback URL.
  - No horizontal overflow at 390px mobile width.
- Playwright scenarios:
  - Dedicated happy path for dismissal without cause with shared/restored URL.
  - Mobile viewport path.
  - Add shared-state fixture with path similar to `/calculadoras/rescisao-trabalhista?s=5000&ad=2024-01-10&dd=2026-05-20&mt=sjc&av=ind&dt=20&fv=0&fg=9000&dl=1`.
- Lint/build commands:
  - `pnpm test -- --runInBand` is not the project pattern; use `pnpm test`.
  - `pnpm lint`.
  - `pnpm build`.
  - `pnpm test:e2e` after the dev/build environment is ready.
- Acceptance criteria:
  - The route `/calculadoras/rescisao-trabalhista` exists in all locales and is listed in the calculator registry.
  - A user can estimate dismissal without cause, resignation, with-cause dismissal, mutual agreement, and indirect termination without console errors.
  - Results show gross, deductions, net estimate, FGTS estimate, and itemized calculation memory.
  - Every source-sensitive result shows the source/table version date and an estimate disclaimer.
  - Share/save behavior matches existing calculators.
  - URL restoration works from query params.
  - Unit tests cover formula branches and date edge cases.
  - E2E tests cover submit/share/restore/save and mobile overflow.
  - `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e` pass or any failure is documented with a fix plan.

## Implementation Notes

- Status updates: Creator set plan `status: "in_progress"` and updated `docs/calculator-backlog.md` rank 1 row to `In Progress` before app-code edits. After tester and orchestrator validation passed, the plan was marked `verified` and the backlog row was moved to `Done`.
- Files changed:
  - `app/[locale]/calculadoras/rescisao-trabalhista/layout.tsx`
  - `app/[locale]/calculadoras/rescisao-trabalhista/page.tsx`
  - `components/calculators/rescisao-trabalhista/breakdown-table.tsx`
  - `components/calculators/rescisao-trabalhista/calculator-form.tsx`
  - `components/calculators/rescisao-trabalhista/rescisao-trabalhista-calculator-client.tsx`
  - `components/calculators/rescisao-trabalhista/results-summary.tsx`
  - `lib/calculators/rescisao-trabalhista.ts`
  - `lib/calculators/rescisao-trabalhista.test.ts`
  - `lib/url-state/rescisao-trabalhista.ts`
  - `lib/url-state/rescisao-trabalhista.test.ts`
  - `lib/url-state/index.ts`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/calculator-share-state.spec.ts`
  - `tests/e2e/rescisao-trabalhista.spec.ts`
  - `docs/calculator-backlog.md`
  - `docs/calculator-plans/rescisao-trabalhista.md`
- Validation results:
  - Creator validation:
    - `pnpm test -- lib/calculators/rescisao-trabalhista.test.ts lib/url-state/rescisao-trabalhista.test.ts`: passed; Vitest ran 16 test files / 227 tests.
    - `pnpm lint`: passed.
    - `pnpm build`: first run failed before build because `DATABASE_URL` was missing for Prisma config; rerun with `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed.
    - `pnpm run test:e2e -- rescisao-trabalhista.spec.ts calculator-share-state.spec.ts`: passed 11 Playwright tests.
  - Fix validation:
    - Added the Receita Federal 2026 monthly IRRF reduction table to `calcularIrrf2026`, because automatic IRRF was implemented and the plan required the reduction table when available.
    - `pnpm test -- lib/calculators/rescisao-trabalhista.test.ts`: passed; Vitest ran 16 test files / 228 tests.
  - Tester validation on 2026-05-31:
    - `pnpm dev --hostname localhost --port 3000`: route served, but Auth.js session polling logged `MissingSecret` because the manual dev server lacked `AUTH_SECRET`; server stopped and restarted with validation env.
    - `env AUTH_SECRET=dev-validation-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3000`: route and `/api/auth/session` returned 200 in the manual dev server; server stopped before automated checks.
    - Browser/browser-use: in-app Browser was attempted with `browser-client` against `/calculadoras/rescisao-trabalhista`; the connector repeatedly timed out waiting for the Browser webview to attach in this subagent thread. Visibility is also unsupported in subagent threads. A standalone Chromium fallback was also blocked by sandbox `mach_port_rendezvous` permissions, so browser-level validation was completed through the approved Playwright e2e runner instead.
    - Browser coverage verified by Playwright e2e: desktop route load, realistic no-cause dismissal form submission, visible summary and detailed breakdown, source/table note, result and SEO disclaimers, share URL copy/restore, unauthenticated save redirect, resignation notice options, blank-FGTS warning, with-cause/agreement/indirect-termination restore paths, indirect-termination warning, desktop overflow, mobile route load at 390px, and mobile horizontal overflow.
    - E2E coverage added in `tests/e2e/rescisao-trabalhista.spec.ts`: browser console/page-error guard for unexpected errors or hydration failures, explicit source/disclaimer assertions, desktop overflow assertion, and shared-URL coverage for with-cause, mutual agreement, and indirect termination.
    - `pnpm run test:e2e -- tests/e2e/rescisao-trabalhista.spec.ts tests/e2e/calculator-share-state.spec.ts`: passed 12 Playwright tests.
    - `pnpm test`: passed; Vitest ran 16 test files / 228 tests.
    - `pnpm lint`: passed.
    - `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build`: passed; existing Next warnings remained for edge-runtime static generation and missing `metadataBase` fallback to localhost.
    - `pnpm run test:e2e`: passed 14 Playwright tests.
    - Tester result: PASS for implemented calculator behavior and automated browser coverage. Product failures found: none. Tooling blocker: in-app Browser/browser-use could not attach in this thread, so that specific manual surface was not completed.
  - Orchestrator Browser validation on 2026-05-31:
    - Started `env AUTH_SECRET=dev-validation-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3000`.
    - In-app Browser opened `/calculadoras/rescisao-trabalhista` and verified a realistic calculation with visible summary, detailed breakdown, blank-FGTS warning, source/table note, share URL generation, share URL restore, unauthenticated save redirect to `/entrar`, no console errors, no desktop overflow, and no mobile overflow at 390px.
    - Browser screenshot capture timed out twice with `Page.captureScreenshot`; the behavioral Browser checks passed without product failures.
- Final status: Verified at `/calculadoras/rescisao-trabalhista`; backlog marked `Done` with route and validation summary.
