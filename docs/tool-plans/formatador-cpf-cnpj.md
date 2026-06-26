---
slug: "formatador-cpf-cnpj"
familyId: "validadores"
primaryCategoryId: "documentos"
backlogRank: 12
primaryKeyword: "formatador cpf cnpj"
decision: "new"
targetRoute: "/validadores/formatador-cpf-cnpj"
status: "verified"
createdAt: "2026-06-26"
updatedAt: "2026-06-26"
---

# Formatador de CPF e CNPJ Plan

## Backlog Row

- Rank: 12
- Original status: Backlog
- Slug: `formatador-cpf-cnpj`
- Primary keyword: `formatador cpf cnpj`
- Cluster keywords: `formatar cpf`; `formatar cnpj`; `mascara cpf cnpj`
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `documentos`
- Opportunity score: 76
- Idea type: New
- Notes: Reuse existing document helpers; avoid duplicating validator pages.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/validadores/formatador-cpf-cnpj`
- Rationale: The backlog asks for a formatter/masker, while the existing `/validadores/cpf` and `/validadores/cnpj` routes validate check digits. A dedicated formatter route matches the primary keyword, lets users convert between raw and masked document strings, and can link to the validator pages without repeating their check-digit result flow. Use the existing `validadores` family and `documentos` category because CPF/CNPJ are already represented there. Do not mark the backlog `In Progress`; this is a planner-only handoff.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, `app/[locale]/validadores/validador-email/page.tsx`, dynamic category routes under `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`, and current family routes under `app/[locale]`. There is no `/validadores/formatador-cpf-cnpj` route.
- Registry/categories checked: `lib/constants.ts` already defines `ToolFamilyId: "validadores"` and `ToolCategoryId: "documentos"` with CPF and CNPJ tools. No new family or category is needed. Add a new `tools` entry with `id: "formatador-cpf-cnpj"`, `href: "/validadores/formatador-cpf-cnpj"`, `familyId: "validadores"`, `primaryCategoryId: "documentos"`, `categoryIds: ["documentos"]`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/documents.test.ts`, `components/tools/validators/document-validator-client.tsx`, `components/tools/url-state.ts`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. Current helpers include `onlyDigits`, `formatCpf`, `validateCpf`, `formatCnpj`, and `validateCnpj`; the validator client uses `formatCpf`/`formatCnpj` for progressive display and validation status.
- Prior plans checked: all current `docs/tool-plans/*.md` and `docs/calculator-plans/*.md`. No prior `formatador-cpf-cnpj` plan exists. `validador-email` documents the validator-family split between document validators and contact validators. `formatador-json`, `conversor-base64`, `conversor-maiusculas`, and `sorteador-nomes` document the current privacy-safe hash-only content sharing pattern for pasted values.
- Text search checked: `formatador-cpf-cnpj`, `formatador cpf cnpj`, `formatar cpf`, `formatar cnpj`, `mascara cpf`, `cpf cnpj`, `cpf`, and `cnpj` across routes, registry, helper modules, components, locale messages, tests, and plans.
- Overlap conclusion: Build a new route. Reuse and extend document helpers, but keep the page scoped to formatting, masking, unmasking, copying, and explaining input shape. Do not show "CPF valido", "CNPJ valido", Receita cadastral status, or check-digit diagnostics on this page. Link to `/validadores/cpf` and `/validadores/cnpj` for validation.

## User Intent And Scope

- Target user: People cleaning spreadsheets, filling forms, preparing imports, QA testers, support teams, accountants, and developers who need CPF/CNPJ strings in the expected mask or as raw characters.
- User job: Paste or type a CPF/CNPJ, choose or auto-detect the document type, get a masked output and a raw output immediately, copy either result, and understand whether the input is incomplete, too long, or using unsupported characters.
- In scope:
  - Single-value CPF/CNPJ formatter and unformatter.
  - Auto detection plus explicit `CPF` and `CNPJ` selection.
  - CPF numeric mask: `000.000.000-00`.
  - Existing numeric CNPJ mask: `00.000.000/0000-00`.
  - Alphanumeric CNPJ mask shape for new CNPJ numbers planned by Receita Federal from July 2026: 14 positions, first 12 alphanumeric and final 2 numeric, displayed with the same punctuation pattern.
  - Raw output without punctuation.
  - Progressive mask preview while the value is incomplete.
  - Clear messages for empty, incomplete, complete, extra characters, unsupported letters in CPF, and unsupported letters in the final two CNPJ check-digit positions.
  - Copy masked value, copy raw value, paste/clear actions, and related links to CPF/CNPJ validators.
- Out of scope:
  - Check-digit validation, check-digit generation, fake CPF/CNPJ generation, Receita Federal lookup, cadastral status, company/person identity checks, bulk CSV import, file upload, server-side API endpoints, account save, and local history.
  - Legal, accounting, tax, KYC, anti-fraud, or identity advice.
  - Replacing `/validadores/cpf` or `/validadores/cnpj`; those remain the validation pages.
- Sensitive-topic caveats:
  - CPF is personal data and CNPJ can be business-identifying data. Default live URLs and default share URLs must not include the entered document value.
  - Formatting is not proof that a number exists, belongs to a person/company, has valid check digits, or is regular before Receita Federal.
  - Keep copy precise: "formatado" and "mascarado", not "valido", "regular", "oficialmente confirmado", or "verificado".

## Tool Contract

- Inputs:
  - `entrada`: one free-form text field for CPF or CNPJ.
  - `tipo`: `auto`, `cpf`, or `cnpj`; default `auto`.
  - `saida`: preferred primary output mode for the UI, `mascara` or `limpar`; default `mascara`.
  - `conteudo`: optional explicit share flag used only for content-bearing URL fragments.
- Defaults:
  - `entrada` empty.
  - `tipo=auto`.
  - `saida=mascara`.
  - `conteudo` absent, so live URL and default share URL keep document content out.
- Validation rules:
  - Empty input shows a neutral empty state.
  - Normalize by trimming leading/trailing whitespace and removing common separators for parsing: `.`, `-`, `/`, spaces, tabs, and line breaks.
  - CPF accepts digits only. Letters in CPF mode should produce an unsupported-character issue, not a silently valid CPF result.
  - CPF target length is 11 digits. Show incomplete count before 11 and extra-character warning after 11; format only the first 11 normalized digits for the masked output while making ignored extras visible in the explanation.
  - Numeric CNPJ accepts 14 digits and formats as `00.000.000/0000-00`.
  - Alphanumeric CNPJ accepts uppercase `A-Z` and digits in the first 12 positions, plus digits in the final two positions. Lowercase input should be uppercased in normalized output.
  - CNPJ target length is 14 normalized characters. Show incomplete count before 14 and extra-character warning after 14; format only the first 14 normalized characters while making ignored extras visible.
  - In `auto` mode, choose CPF when the normalized value is all digits and length is 11 or fewer. Choose CNPJ when the normalized value has any letter or length is greater than 11. If the input is empty, show no detected type.
  - Reject or warn on symbols other than common separators and alphanumeric characters. Do not quietly remove unknown punctuation such as `@`, `#`, emoji, or accent characters.
  - Do not call `validateCpf` or `validateCnpj` to label the document valid/invalid. Optional related CTA text may say "validar os digitos" and link to the validator route.
  - Invalid query or fragment params fall back to defaults without crashing.
- Outputs:
  - Detected/selected type: `CPF`, `CNPJ`, or empty.
  - Normalized raw value: digits only for CPF and uppercase alphanumeric for CNPJ.
  - Masked value: progressive mask for incomplete values and full mask for complete values.
  - Status: `empty`, `incomplete`, `complete`, or `attention`.
  - Length summary such as `9 de 11 digitos` or `14 de 14 caracteres`.
  - Issue list for unsupported characters, extra normalized characters, CPF letters, CNPJ check-digit letters, and ambiguous auto detection.
  - Copyable masked output and raw output.
- Result explanations:
  - Explain that the tool formats masks and removes punctuation.
  - Explain that CPF has 11 numeric digits and CNPJ has 14 positions.
  - Explain that new CNPJ inscriptions are planned to support letters and numbers from July 2026, while existing CNPJs stay valid.
  - Explain that this page does not validate check digits or Receita registration status.
- URL params:
  - Safe live query params: `tipo` and `saida`.
  - Do not write `entrada` to `window.location.search` during normal editing.
  - Optional explicit content share may use a hash-only fragment such as `#conteudo=1&entrada=...`.
  - Read `entrada` only from the fragment/hash when `conteudo=1` is present.
  - After hydrating a content-bearing fragment, sanitize the address bar back to safe query params and clear the hash.
  - Enforce a fragment length budget, for example 512 characters for this single-value tool.
- Share behavior:
  - Default share link includes only route plus safe settings.
  - If include-content sharing is implemented, require an explicit "incluir documento no link" control and show a warning that anyone with the link can read the document string.
  - Enabling include-content must not mutate the live address bar; it only changes the URL returned by the share action.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store `entrada`, masked output, raw output, or issue details in localStorage, sessionStorage, analytics events, server logs, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Extend `lib/tools/documents.ts` instead of creating a parallel document-normalization module unless the creator finds the file getting too broad.
  - Reuse existing `onlyDigits`, `formatCpf`, and numeric `formatCnpj` behavior where the contract matches the formatter.
  - Add pure formatter helpers with structured results, for example `formatCpfCnpjInput`, `detectCpfCnpjType`, `normalizeCpfInput`, `normalizeCnpjInput`, `formatCnpjAlphanumeric`, and safe URL/share helpers.
  - Keep helpers deterministic and browser-only; no network calls, server actions, or external APIs.
  - Return structured issue codes and let translations provide user-facing strings.
  - For alphanumeric CNPJ formatting, apply the same visible punctuation positions as the numeric CNPJ mask: positions 2, 5, 8, 12, and 14 become `AA.AAA.AAA/AAAA-00` in display shape. This is formatting only; do not calculate or validate the DV on this page.
- Data tables or assumptions:
  - CPF mask uses 11 numeric digits and the existing app convention `000.000.000-00`.
  - Numeric CNPJ mask uses 14 numeric digits and the existing app convention `00.000.000/0000-00`.
  - Alphanumeric CNPJ source rules from Receita Federal state 14 positions, first 8 root positions alphanumeric, next 4 establishment positions alphanumeric, and final 2 check-digit positions numeric.
  - Accepted alphanumeric letters for CNPJ should be ASCII `A-Z` only unless Receita documentation later expands the permitted alphabet.
  - The tool formats one value at a time. Bulk formatting is a future enhancement only if SEO/product evidence justifies it.
- Official or authoritative sources:
  - Receita Federal, `Meu CPF`, confirms CPF as the citizen identity and a unique/definitive number for each citizen: https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf
  - Receita Federal, `Informacoes Gerais` for CNPJ, confirms CNPJ is administered by RFB and contains cadastral information for entities: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj/informacoes-gerais-sobre-o-cnpj
  - Receita Federal news, `CNPJ tera letras e numeros a partir de julho de 2026`, describes the alphanumeric transition, 14 positions, existing CNPJs remaining unchanged, and final two numeric check-digit positions: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2024/outubro/cnpj-tera-letras-e-numeros-a-partir-de-julho-de-2026
  - Receita Federal, `CNPJ Alfanumerico`, states alphanumeric CNPJ is assigned from July 2026 only to new registrations and existing numbers remain valid: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico
  - Codebase source checked on 2026-06-26: `lib/tools/documents.ts`, `lib/tools/documents.test.ts`, `components/tools/validators/document-validator-client.tsx`, `components/tools/url-state.ts`, `lib/constants.ts`, `messages/*.json`, current validator routes, and prior tool plans.
- Source access dates:
  - Receita Federal CPF page checked on 2026-06-26.
  - Receita Federal CNPJ general page checked on 2026-06-26.
  - Receita Federal CNPJ alphanumeric news page checked on 2026-06-26.
  - Receita Federal CNPJ Alfanumerico program page checked on 2026-06-26.
  - Codebase checked on 2026-06-26.
- Rule/table effective dates:
  - CNPJ alphanumeric change: Receita Federal article published 2024-10-16, program page schedule says implementation in July 2026.
  - Existing CNPJ numbers remain valid and unchanged according to Receita Federal source.
  - CPF/CNPJ punctuation masks are app-owned formatting conventions backed by existing helper behavior and common Brazilian display patterns, not proof of registration status.
- Freshness or maintenance risk:
  - Moderate because the alphanumeric CNPJ rollout starts in July 2026. The creator should support alphanumeric CNPJ formatting in the first build or explicitly document why product deferred it.
  - Low for CPF numeric masking.
  - Low for privacy if document values remain out of default query strings, storage, analytics, and server calls.
  - Moderate product-risk if users expect validation. Keep title, result labels, and SEO copy focused on formatting and link to validators for check-digit validation.
- Estimator or privacy limitations:
  - This is not an estimator and not a validator.
  - Formatting cannot prove that a CPF/CNPJ exists, is regular, belongs to the user, has valid check digits, or is accepted by any Receita Federal service.
  - Browser-only processing reduces intentional server exposure, but copied values, screenshots, browser extensions, and explicit content-bearing links can still expose document data.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Formatador de CPF e CNPJ`
  - PT-BR meta title: `Formatador de CPF e CNPJ online`
  - PT-BR description: `Formate CPF e CNPJ com mascara, remova pontuacao e copie o resultado no navegador, sem validar cadastro ou consultar a Receita Federal.`
- Main form sections:
  - Input card with document input, `tipo` segmented control (`Auto`, `CPF`, `CNPJ`), and `saida` segmented control (`Com mascara`, `Somente caracteres`).
  - Privacy note near the input saying formatting happens in the browser and the document is not included in the URL by default.
  - Result card with detected type, masked output, raw output, length summary, and issue list.
  - Action row with copy masked, copy raw, paste if available through standard browser behavior, clear, and share.
- Results sections:
  - Empty state before input.
  - Incomplete state with partial mask and remaining character count.
  - Complete state with copyable masked/raw outputs and neutral language.
  - Attention state for unsupported characters, extras, CPF letters, CNPJ final-position letters, or ambiguous auto detection.
  - Related validation prompt: "Quer conferir os digitos verificadores?" with links to `/validadores/cpf` and `/validadores/cnpj`.
- SEO sections:
  - What a CPF/CNPJ formatter does.
  - Difference between formatting, removing punctuation, and validating.
  - CPF mask and CNPJ mask examples.
  - CNPJ alphanumeric note for new inscriptions from July 2026.
  - Privacy note for pasted document numbers.
- FAQ topics:
  - `O CPF ou CNPJ e enviado para o servidor?`
  - `Formatar e o mesmo que validar CPF ou CNPJ?`
  - `Qual e a mascara de CPF?`
  - `Qual e a mascara de CNPJ?`
  - `O formatador aceita CNPJ com letras?`
  - `Posso compartilhar um link com o documento preenchido?`
- Disclaimer or privacy copy:
  - The tool only applies/removes masks in the browser.
  - It does not check Receita Federal registration status and does not prove check digits are valid.
  - Do not include CPF/CNPJ values in shared links unless every recipient may see them.
- Related tool links:
  - Existing: `/validadores/cpf`, `/validadores/cnpj`, `/validadores/validador-email`.
  - Recent or planned automation tools from memory: `/dev/regex-tester`, `/geradores/uuid`, `/datas/unix-timestamp`, `/cores/paleta-cores` when those branches are available in the target worktree.
  - Future backlog candidates: `/validadores/validador-cep`, `/validadores/validador-telefone`, `/validadores/validador-pis-pasep`, `/geradores/gerador-cpf-teste`, and `/geradores/gerador-cnpj-teste`.
- Translation guidance:
  - Add `tools.formatador-cpf-cnpj` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested tool names: PT-BR `Formatador de CPF e CNPJ`; EN `CPF and CNPJ Formatter`; ES `Formateador de CPF y CNPJ`.
  - Translate metadata, input labels, segmented controls, result statuses, issue codes, copy actions, share privacy, SEO sections, FAQ, and related validator CTA.
  - Keep `CPF`, `CNPJ`, Receita Federal, and route slug untranslated.
  - Use careful wording in all locales: "format" or "mask", not "validate" except when linking to the separate validator pages.

## Implementation Checklist

- Tool logic:
  - Extend `lib/tools/documents.ts` with formatter result types, issue codes, CPF/CNPJ detection, CPF normalization, CNPJ alphanumeric normalization, progressive mask helpers, raw/masked output helpers, safe query parser/serializer, and optional hash-only content sharing helpers.
  - Keep existing `validateCpf` and `validateCnpj` behavior unchanged for existing validator routes.
  - Add `lib/tools/documents.test.ts` coverage for new formatter helpers without weakening existing CPF/CNPJ validator tests.
- URL state:
  - Use `components/tools/url-state.ts` for safe initial params and `replaceQueryString`.
  - Sync only `tipo` and `saida` in the live query string.
  - Keep `entrada` out of live query params.
  - If explicit content sharing is implemented, use hash-only `conteudo=1&entrada=...`, sanitize after hydration, and cap fragment size.
- UI components:
  - Create `components/tools/validators/cpf-cnpj-formatter-client.tsx`.
  - Use existing UI primitives and lucide icons such as `BadgeCheck`, `Copy`, `Eraser`, `AlertTriangle`, `CheckCircle`, and `Shield`.
  - Use stable test ids for input, type control, output mode control, detected type, masked output, raw output, issue list, copy masked, copy raw, clear, include-content share control if present, and share button.
  - Ensure long pasted strings wrap and never cause horizontal overflow on mobile.
- Route and metadata:
  - Add `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "formatador-cpf-cnpj")`.
- Registry/family/category:
  - Add a `tools` entry for `formatador-cpf-cnpj` under existing `validadores` and `documentos`.
  - No new `ToolFamilyId` or `ToolCategoryId` is required.
  - Use an icon already imported in `lib/constants.ts` when possible, such as `BadgeCheck` or `FileText`; add a lucide import only if needed.
  - Consider `sitemapPriority` around `0.74` and no `popularRank` unless product ranking is updated consistently.
- Messages:
  - Add PT-BR, EN, and ES tool metadata, form labels, status labels, issue messages, result labels, copy/share actions, privacy/disclaimer copy, SEO text, FAQ, and related-link CTA.
  - Do not alter existing `tools.cpf` and `tools.cnpj` validator translations except for optional related-link copy if reused safely.
- Unit tests:
  - Cover CPF masking, CPF raw output, partial CPF input, extra CPF digits, CPF letters issue, and common punctuation removal.
  - Cover numeric CNPJ masking, CNPJ raw output, partial CNPJ input, extra CNPJ chars, lowercase-to-uppercase alphanumeric CNPJ, CNPJ letters in final two positions issue, and unsupported symbols.
  - Cover auto detection for 11 digits, 14 digits, alphanumeric CNPJ, incomplete values, forced type override, and invalid query/fragment params.
- E2E hooks/tests:
  - Add focused `tests/e2e/cpf-cnpj-formatter.spec.ts`.
  - Cover route load, CPF mask/raw copy, numeric CNPJ mask/raw copy, alphanumeric CNPJ mask, forced CPF/CNPJ mode, safe live URL without document value, default share URL without document value, explicit hash share/hydration/sanitization if implemented, related validator links, EN/ES smoke, and mobile no-overflow.
  - Update `tests/e2e/tools-hub.spec.ts` if the hub asserts route/category discovery.
- Backlog updates:
  - Creator should mark `docs/tool-backlog.md` Rank 12 `In Progress` only when implementation starts.
  - Planner must not edit `docs/tool-backlog.md`.

## Test Plan

- Unit scenarios:
  - `52998224725` -> `529.982.247-25` and raw `52998224725`.
  - `529.982.247-25` -> same masked output and raw `52998224725`.
  - `529982247` -> partial mask and incomplete status.
  - `5299822472500` -> first 11 formatted plus extra-character issue.
  - `04.252.011/0001-10` -> same masked output and raw `04252011000110`.
  - `04252011000110` -> `04.252.011/0001-10`.
  - `ab12cd34efgh56` in CNPJ mode -> uppercase alphanumeric CNPJ mask with final numeric positions.
  - `ab12cd34efghij` in CNPJ mode -> issue for letters in final two positions.
  - Auto detection picks CPF for 11 digits, CNPJ for 14 digits, and CNPJ for any alphanumeric letter.
  - Invalid query params fall back to defaults.
- URL-state scenarios:
  - Live URL updates only `tipo` and `saida`.
  - Normal editing never writes `entrada` to query.
  - Content-bearing hash share, if implemented, requires explicit opt-in and sanitizes after load.
  - Oversized or malformed fragments do not crash and do not preserve unsafe state.
- Browser scenarios:
  - PT-BR route loads without redirect loops.
  - Typing, pasting, clearing, and switching type/mode keeps outputs coherent.
  - Copy masked/raw actions produce the expected clipboard text.
  - Related links navigate to CPF and CNPJ validator pages.
  - No non-auth console errors or page errors.
  - Mobile viewport has no horizontal overflow with long pasted values.
- Playwright scenarios:
  - Focused e2e for CPF, numeric CNPJ, alphanumeric CNPJ, URL privacy, share behavior, locale smoke, related links, and mobile layout.
  - Use stable test ids rather than localized text where possible.
- Lint/build commands:
  - `pnpm test -- lib/tools/documents.test.ts lib/constants.test.ts`
  - `pnpm lint`
  - `pnpm build` with the repo's required placeholder env when needed.
  - `pnpm run test:e2e -- tests/e2e/cpf-cnpj-formatter.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - The route exists at `/validadores/formatador-cpf-cnpj`.
  - The page formats and unmasks CPF and CNPJ without validating or querying external services.
  - Alphanumeric CNPJ formatting is supported or an explicit implementation note records a product decision to defer it before July 2026.
  - Default URLs and default share links do not expose document values.
  - Existing CPF/CNPJ validator routes continue to work.
  - PT-BR, EN, and ES translations are complete and JSON parses.
  - Unit, focused e2e, lint, build, and whitespace checks pass or blockers are documented.

## Implementation Notes

- Status updates:
  - 2026-06-26: Planner created the buildable plan for Rank 12 as a new route and did not edit app code or mark backlog `In Progress`.
  - 2026-06-26: Creator started implementation, set backlog Rank 12 to `In Progress`, and changed plan status to `in_progress`.
  - 2026-06-26: Creator implemented the formatter route and left it ready for independent review/tester validation, without marking the plan verified or backlog Done.
  - 2026-06-26: Independent tester validation passed; route is ready for orchestrator/backlog completion.
- Files changed:
  - `docs/tool-plans/formatador-cpf-cnpj.md`
  - `docs/tool-backlog.md`
  - `lib/tools/documents.ts`
  - `lib/tools/documents.test.ts`
  - `components/tools/validators/cpf-cnpj-formatter-client.tsx`
  - `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/cpf-cnpj-formatter.spec.ts`
- Validation results:
  - Passed: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/documents.test.ts --reporter=dot` (15 document tests).
  - Passed: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/documents.test.ts lib/constants.test.ts --reporter=dot` (21 tests).
  - Passed: `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log(f + ' ok'); }"`.
  - Passed: `./node_modules/.bin/eslint lib/tools/documents.ts lib/tools/documents.test.ts lib/constants.ts 'components/tools/validators/cpf-cnpj-formatter-client.tsx' 'app/[locale]/validadores/formatador-cpf-cnpj/page.tsx' tests/e2e/cpf-cnpj-formatter.spec.ts`.
  - Initial `./node_modules/.bin/tsc --noEmit --pretty false` failed because the local generated Prisma client did not export `PrismaClient`; after `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate`, rerun passed.
  - Passed: `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/next build`; route list includes `/[locale]/validadores/formatador-cpf-cnpj`; only existing `metadataBase` warnings appeared.
  - Sandboxed Playwright failed before assertions with the known macOS Chromium `MachPortRendezvousServer` permission error.
  - Passed elevated: `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` (6 Chromium tests).
  - Passed: `git diff --check`.
  - Passed no-index whitespace checks for new untracked files: route page, client component, plan, and focused e2e spec.
- Review-fix notes:
  - 2026-06-26: Review-fix creator addressed accepted PR review findings `security(share-url)` and `test-gap(share-url)`.
  - Explicit content share fragments now serialize canonical formatter content instead of raw pasted text: CPF shares digits only; CNPJ shares uppercase allowed alphanumeric body positions plus digits-only check positions.
  - Explicit content fragment hydration applies the same sanitizer and passes the requested `tipo` from the URL state so forced CPF links like `tipo=cpf#conteudo=1&entrada=abc529...@` hydrate to CPF digits.
  - Default live query params remain limited to `tipo` and `saida`; `entrada` remains hash-only and opt-in for content sharing.
  - Review-fix files changed: `lib/tools/documents.ts`, `lib/tools/documents.test.ts`, `components/tools/validators/cpf-cnpj-formatter-client.tsx`, `tests/e2e/cpf-cnpj-formatter.spec.ts`, and `docs/tool-plans/formatador-cpf-cnpj.md`.
  - Review-fix validation passed: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/documents.test.ts --reporter=dot` (16 tests).
  - Review-fix validation passed: `./node_modules/.bin/eslint lib/tools/documents.ts lib/tools/documents.test.ts components/tools/validators/cpf-cnpj-formatter-client.tsx tests/e2e/cpf-cnpj-formatter.spec.ts`.
  - Review-fix message parse skipped because no locale message files were touched in this pass.
  - Review-fix e2e note: `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" pnpm run test:e2e -- tests/e2e/cpf-cnpj-formatter.spec.ts` failed before Playwright because pnpm attempted a non-interactive modules purge.
  - Review-fix e2e note: sandboxed `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` reached the known macOS Chromium `MachPortRendezvousServer` permission error.
  - Review-fix validation passed elevated: `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` (6 Chromium tests).
  - Review-fix validation passed: `git diff --check`.
- Second review-fix notes:
  - 2026-06-26: Second review-fix creator addressed repeat findings `security(share-url)` and `test-gap(share-url)` for default `tipo=auto` explicit content sharing.
  - Auto share sanitization now includes `entrada` only for clean auto CPF digits, including incomplete CPF digits, or clean complete CNPJ raw values with 14 normalized positions and numeric final positions.
  - Auto inputs that detect as CNPJ because letters/noise create issues, extra characters, incomplete CNPJ output, or check-digit-letter warnings now keep `conteudo=1` but omit `entrada` from the hash.
  - Forced `tipo=cpf` and `tipo=cnpj` sanitizer behavior from the prior review fix remains unchanged.
  - Added unit and focused e2e regression coverage for noisy default auto sharing such as `52998224725 @ Maria`, including share URL generation and content-fragment hydration.
  - Second review-fix files changed: `lib/tools/documents.ts`, `lib/tools/documents.test.ts`, `tests/e2e/cpf-cnpj-formatter.spec.ts`, and `docs/tool-plans/formatador-cpf-cnpj.md`.
  - Second review-fix validation passed: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/documents.test.ts --reporter=dot` (17 tests).
  - Second review-fix validation passed: `./node_modules/.bin/eslint lib/tools/documents.ts lib/tools/documents.test.ts tests/e2e/cpf-cnpj-formatter.spec.ts`.
  - Second review-fix e2e note: sandboxed `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` reached the known macOS Chromium `MachPortRendezvousServer` permission error before assertions.
  - Second review-fix validation passed elevated: `PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` (7 Chromium tests).
  - Second review-fix validation passed: `git diff --check`.
- Tester findings:
  - 2026-06-26: Independent tester validation passed for `/validadores/formatador-cpf-cnpj` using the Playwright-managed web server and elevated Chromium after the expected macOS sandbox launch failure.
  - Pre-test inspection confirmed stable field ids and result selectors: `cpf-cnpj-formatter-input`, `cpf-cnpj-formatter-type-auto`, `cpf-cnpj-formatter-type-cpf`, `cpf-cnpj-formatter-type-cnpj`, `cpf-cnpj-formatter-output-mascara`, `cpf-cnpj-formatter-output-limpar`, `cpf-cnpj-formatter-status`, `cpf-cnpj-formatter-detected-type`, `cpf-cnpj-formatter-length`, `cpf-cnpj-formatter-primary-output`, `cpf-cnpj-formatter-masked-output`, `cpf-cnpj-formatter-raw-output`, `cpf-cnpj-formatter-issues`, `cpf-cnpj-formatter-copy-masked`, `cpf-cnpj-formatter-copy-raw`, `cpf-cnpj-formatter-clear`, `cpf-cnpj-formatter-include-content`, and `cpf-cnpj-formatter-share-button`.
  - Pre-test inspection confirmed result labels stay formatter-only (`Tipo detectado`, `Tamanho`, `Resultado principal`, `Com mascara`, `Somente caracteres`, issue list, copy actions) and do not claim CPF/CNPJ validity, Receita status, registration status, or identity checks.
  - Pre-test inspection confirmed live/share params are limited to safe query params `tipo` and `saida` by default; content sharing is explicit, hash-only, and uses `conteudo=1&entrada=...` after canonical sanitization. The formatter route has no `SaveButton`, favorites hook, `localStorage`, `sessionStorage`, `fetch`, server action, or direct `validateCpf`/`validateCnpj` use.
  - Browser/e2e coverage passed for route load/no redirect, realistic CPF formatting/raw output/copy, numeric CNPJ formatting/raw output, alphanumeric CNPJ formatting, final-position CNPJ letter warning, forced CPF/CNPJ modes, unsupported characters, type switching, clear state, safe live URL defaults, default share without document value, explicit noisy auto share omitting content, explicit forced CPF/CNPJ share canonicalization and hydration, hash sanitization after hydration, related CPF/CNPJ validator links, validator family page discovery, `documentos` category discovery, localized sitemap entries, EN/ES route smoke, mobile long-input no-horizontal-overflow at 390px, and no non-auth console/page errors.
  - Focused e2e coverage in `tests/e2e/cpf-cnpj-formatter.spec.ts` was already sufficient; the tester did not modify the spec.
  - Initial focused command `./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` failed before browser launch because the configured `pnpm dev` web server exited with code 1.
  - Direct sandboxed command `env PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3192' ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` reached Chromium and failed before assertions with the known macOS `MachPortRendezvousServer` permission error.
  - Passed elevated: `env PORT=3192 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3192' ./node_modules/.bin/playwright test tests/e2e/cpf-cnpj-formatter.spec.ts` (7 Chromium tests).
  - Dev-server cleanup confirmed: no listener remained on ports 3192 or 3100 after the Playwright-managed run.
- Remaining tester focus areas:
  - None from tester validation.
- Final status:
  - `verified`; `docs/tool-backlog.md` Rank 12 is `Done` with route and validation summary recorded while draft PR creation is pending.
