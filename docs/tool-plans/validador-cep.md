---
slug: "validador-cep"
familyId: "validadores"
primaryCategoryId: "enderecos"
backlogRank: 21
primaryKeyword: "validador de cep"
decision: "new"
targetRoute: "/validadores/validador-cep"
status: "verified"
createdAt: "2026-07-05"
updatedAt: "2026-07-05"
---

# Validador de CEP Plan

## Backlog Row

- Rank: 21
- Original status: `In Progress`, stage `planning`
- Slug: `validador-cep`
- Primary keyword: `validador de cep`
- Cluster keywords: `validar cep`; `cep valido`; `consultar cep`
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `enderecos`
- Opportunity score: 71
- Idea type: New
- Notes: Syntax can be offline; lookup needs external API and caching policy.
- Done ref: -
- Claim branch: `codex/validador-cep-tool`
- Claim expires at: `2026-07-07T12:26:43.486375+00:00`

## Decision

- Decision: `new`
- Target route: `/validadores/validador-cep`
- Rationale: The claimed row asks for a CEP validator and the target route matches the primary keyword directly. Existing validator routes cover CPF, CNPJ, CPF/CNPJ formatting, email syntax, and card numbers; none validates or formats Brazilian postal codes. Build a new route focused on CEP syntax and mask normalization. Do not merge into contact/email or document validators because CEP is address/postal data, not identity, contact deliverability, payment, or document validation.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx`, `app/[locale]/validadores/validador-email/page.tsx`, `app/[locale]/validadores/validador-cartao/page.tsx`, dynamic category routes under `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`, and current tool family routes under `app/[locale]`. There is no `/validadores/validador-cep` route.
- Registry/categories checked: `lib/constants.ts` already defines the `validadores` family and validator categories `documentos`, `contato`, and `pagamentos`. CEP does not fit those categories cleanly. Add a new validator category `enderecos` with href `/validadores/categorias/enderecos`; use a location/address icon such as `MapPin` if the creator adds a lucide import, or fall back to `BadgeCheck`.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/email.ts`, `lib/tools/payment-card.ts`, `components/tools/validators/*`, `components/tools/url-state.ts`, `messages/{pt-br,en,es}/directories.json`, `messages/{pt-br,en,es}/catalog/tools.json`, and current `messages/{locale}/tools/*.json`. No CEP helper, component, catalog entry, or tool message namespace exists.
- Prior plans checked: all current `docs/tool-plans/*.md` and `docs/calculator-plans/*.md`. `docs/tool-plans/validador-email.md` and `docs/tool-plans/formatador-cpf-cnpj.md` mention `/validadores/validador-cep` only as a future related backlog candidate.
- Text search checked: `validador-cep`, `validador de cep`, `CEP`, `código postal`, `codigo postal`, and `postal` across routes, registry, helpers, components, messages, e2e tests, tool plans, calculator plans, and automation memory. Matches are future references or unrelated email/card copy.
- Overlap conclusion: Build a new browser-only tool. Keep it separate from `/validadores/validador-email` even though both involve user-entered contact/address data, and separate from `/validadores/formatador-cpf-cnpj` because CEP has no check digit or Brazilian document semantics.

## User Intent And Scope

- Target user: People filling Brazilian forms, preparing ecommerce checkout data, cleaning spreadsheets, QA testers, support teams, and developers who need to check whether a CEP string has the expected shape before using it elsewhere.
- User job: Type or paste one CEP, quickly see whether it has eight numeric digits, copy the normalized `00000-000` format or raw digits, understand why malformed input failed, and access the official Correios search when they need address existence or street/locality details.
- In scope:
  - Single Brazilian CEP syntax and mask validation.
  - Accept raw eight-digit input such as `01001000` and formatted input such as `01001-000`.
  - Normalize copy output to `00000-000` plus raw eight digits.
  - Progressive mask preview for incomplete numeric input.
  - Clear status for empty, incomplete, valid format, invalid format, and attention states.
  - Diagnostics for digit count, allowed separators, hyphen position, extra characters, pasted labels such as `CEP:`, and official-lookup limitation.
  - Optional structural explanation of the five-digit prefix and three-digit suffix based on Correios copy.
  - Copy formatted CEP, copy raw digits, clear input, example fill, and safe share.
  - Link users to the official Correios Busca CEP page for address lookup.
- Out of scope:
  - Official DNE lookup, Correios API scraping, ViaCEP or other third-party lookup, address autofill, geocoding, street/city/state inference, map display, bulk CSV validation, file upload, account save, local history, server actions, API endpoints, and caching.
  - Proof that the CEP exists, belongs to a specific address, is deliverable today, or is accepted by Correios for a shipment.
  - Broad postal-code validation for other countries.
- Sensitive-topic caveats:
  - A CEP can identify a small locality, street segment, building, business, mailbox, or rural area. Keep the typed value out of default live query strings, storage, analytics, server logs, and account data.
  - Avoid the phrase `CEP válido` when it could imply official existence. Prefer `formato válido` or `estrutura válida`.
  - If product later adds live lookup, require an explicit API/caching/privacy decision and a new plan update before implementation.

## Tool Contract

- Inputs:
  - `cep`: one free-form text field for a Brazilian CEP.
  - `saida`: primary output mode, `formatado` or `digitos`; default `formatado`.
  - `conteudo`: optional explicit share flag used only for content-bearing URL fragments.
- Defaults:
  - `cep` empty.
  - `saida=formatado`.
  - `conteudo` absent, so live URL and default share URL omit the typed CEP.
- Validation rules:
  - Empty input shows a neutral empty state.
  - Trim leading/trailing ASCII whitespace for processing and show an attention issue if trimming changed the value.
  - Allow only digits, ASCII spaces around the value, and one optional hyphen after the fifth digit. Do not silently accept letters, emoji, slashes, dots, underscores, or repeated hyphens.
  - Be helpful with common pasted prefixes: `CEP 01001-000` or `CEP: 01001-000` may produce an attention state with a cleaned value if the creator chooses; otherwise return an explicit unsupported-prefix issue. Do not make this ambiguous.
  - Remove one correctly positioned hyphen for raw digit extraction.
  - Valid-format result requires exactly eight digits and, if a hyphen is present, the shape `00000-000`.
  - Incomplete result covers one to seven digits after accepted separators.
  - Attention result covers more than eight digits if the first eight can be formatted, while making ignored extras visible. Prefer not to auto-copy a truncated value without a warning.
  - Invalid result covers letters, misplaced hyphen, multiple hyphens, unsupported punctuation, embedded whitespace between digits, and malformed fragments/query params.
  - Do not reject by numeric range beyond basic eight-digit shape unless the creator finds an authoritative Correios rule. `00000-000` should not be called officially nonexistent without a lookup source.
  - No check-digit calculation exists for CEP; do not invent one.
- Outputs:
  - Status: `empty`, `incomplete`, `validFormat`, `invalid`, or `attention`.
  - Raw digits when available.
  - Formatted CEP in `00000-000` shape when at least one accepted digit exists.
  - Length summary such as `5 de 8 dígitos`.
  - Issue list for unsupported characters, misplaced hyphen, too few digits, extra digits, trimmed spaces, prefix removed, and syntax-only limitation.
  - Optional structure summary: first five digits as prefix/divisor area and last three digits as suffix, without inferring address.
  - Copyable formatted CEP and raw digits.
- Result explanations:
  - Explain that the tool validates local format only.
  - Explain that Correios defines CEP as eight numeric digits used to route postal objects.
  - Explain that a format-valid CEP still may not exist in the current Correios database or may not identify a unique street.
  - Explain that official address lookup belongs to Correios Busca CEP and may require captcha/manual interaction.
- URL params:
  - Safe live query params: `saida` only when not default.
  - Do not write `cep` to `window.location.search` during normal editing.
  - Optional explicit content share may use hash-only `#conteudo=1&cep=...`.
  - Read `cep` only from the fragment/hash when `conteudo=1` is present.
  - After hydrating a content-bearing fragment, sanitize the address bar back to safe query params and clear the hash.
  - Cap fragment size around 128 characters because this is a single short input.
- Share behavior:
  - Default share link includes only route plus safe settings.
  - If include-content sharing is implemented, require an explicit `incluir CEP no link` control and show that anyone with the URL can read the CEP.
  - Enabling include-content must not mutate the live address bar; it only changes the URL returned by the share action.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store typed CEP, formatted output, raw digits, copied summary, or issue details in localStorage, sessionStorage, IndexedDB, cookies, analytics events, server requests, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/cep.ts` with result types, issue codes, diagnostics, formatting helpers, safe search-param helpers, and optional hash-only content share helpers.
  - Implement deterministic browser-only functions: `normalizeCepInput`, `formatCepDigits`, `validateCepFormat`, `readCepValidatorStateFromParams`, `buildCepValidatorSearchParams`, `buildCepValidatorShareUrl`, and `readCepValidatorContentFromFragment`.
  - Keep user-facing text out of helper returns; return structured issue codes for translations.
  - Keep all validation local and synchronous. Do not fetch Correios, ViaCEP, browser geolocation, maps, or server APIs in v1.
  - Use simple character/digit parsing instead of a broad permissive regex so diagnostics can distinguish misplaced hyphen, unsupported characters, extra digits, and embedded whitespace.
- Data tables or assumptions:
  - A CEP has eight numeric digits in the current public Correios description.
  - Display mask uses five digits, a hyphen, and three digits: `00000-000`.
  - The first five digits describe postal structure up to divisor/subsetor; the last three digits are the suffix. Use this only as explanatory copy, not as an address inference engine.
  - Correios Busca CEP supports searches by CEP/address and exposes result fields such as logradouro/nome, bairro/distrito, localidade/UF, and CEP, but the public form is captcha-backed and not suitable for silent in-app validation.
- Official or authoritative sources:
  - Correios, `Tudo sobre CEP`: https://www.correios.com.br/enviar/precisa-de-ajuda/tudo-sobre-cep
  - Correios, `Busca CEP - Por CEP`: https://buscacepinter.correios.com.br/app/cep/index.php
  - Correios, `Busca CEP - Por Endereço ou CEP`: https://buscacepinter.correios.com.br/app/endereco/index.php
  - Codebase source inspected: validator routes/components/helpers, `lib/constants.ts`, `components/tools/url-state.ts`, `messages/{locale}/directories.json`, `messages/{locale}/catalog/tools.json`, existing tool message namespaces, and prior tool plans.
- Source access dates:
  - Correios `Tudo sobre CEP` checked on 2026-07-05.
  - Correios `Busca CEP - Por CEP` checked on 2026-07-05.
  - Correios `Busca CEP - Por Endereço ou CEP` checked on 2026-07-05.
  - Codebase checked on 2026-07-05.
- Rule/table effective dates:
  - Correios page content observed on 2026-07-05; page footer shows Correios copyright 2026.
  - No separate effective-date table is required for syntax-only validation.
  - If official lookup or regional ranges are added later, record source publication/update dates and freshness policy before implementation.
- Freshness or maintenance risk:
  - Low for the eight-digit mask and local syntax validation.
  - Moderate for any address lookup or regional/range interpretation because Correios postal data changes and public lookup uses captcha/manual flows.
  - Moderate product-risk around user expectations for `consultar cep`; copy must distinguish `validar formato` from official lookup.
  - Low privacy risk if CEP stays out of default URLs, storage, analytics, and network calls.
- Estimator or privacy limitations:
  - This is not an estimator, official database lookup, or delivery guarantee.
  - Format validation cannot prove the CEP exists, is current, maps to a specific street, or is deliverable.
  - Browser-only processing reduces intentional server exposure, but copied values, screenshots, explicit content-bearing links, browser extensions, and official external searches can expose the CEP.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de CEP`
  - PT-BR meta title: `Validador de CEP online grátis`
  - PT-BR description: `Confira o formato de um CEP brasileiro, copie em 00000-000 e veja avisos claros sem consultar bases externas.`
- Main form sections:
  - Input card with CEP text input, browser-only privacy note, clear and example actions.
  - Output mode segmented control: `Formatado` and `Somente dígitos`.
  - Result card with status, formatted CEP, raw digits, length summary, and issue list.
  - Details panel explaining local format validation, the five-plus-three mask, and Correios lookup boundary.
  - Share/privacy section with safe default share and optional explicit include-content control.
- Results sections:
  - Empty state before input.
  - Incomplete state with progressive mask and remaining digit count.
  - Valid-format state with formatted/raw copy actions and explicit syntax-only note.
  - Invalid state with primary issue and checklist.
  - Attention state for trimmed value, accepted prefix cleanup, or extra digits.
  - Official lookup CTA linking to Correios Busca CEP in a new tab when the user needs address details.
- SEO sections:
  - What a CEP validator checks.
  - Difference between validating format and consulting an official CEP/address database.
  - CEP mask examples: `01001-000` and raw `01001000`.
  - Why a format-valid CEP may still need Correios lookup.
  - Privacy note for address-related data.
- FAQ topics:
  - `O CEP é enviado para o servidor?`
  - `Este validador confirma se o CEP existe?`
  - `Qual é o formato correto de CEP?`
  - `Posso usar CEP sem hífen?`
  - `A ferramenta consulta endereço, bairro ou cidade?`
  - `Posso compartilhar um link com o CEP preenchido?`
- Disclaimer or privacy copy:
  - The tool checks and formats CEP syntax in the browser.
  - It does not consult Correios, DNE, ViaCEP, maps, geocoding, or delivery systems.
  - Use Correios Busca CEP for official address search.
  - Do not include a CEP in a shared link unless everyone with the URL may see it.
- Related tool links:
  - Existing: `/validadores/validador-email`, `/validadores/formatador-cpf-cnpj`, `/validadores/cpf`, `/validadores/cnpj`, `/dev/formatador-json`, `/texto/contador-caracteres`.
  - Future backlog candidates: `/validadores/validador-telefone`, `/validadores/validador-pis-pasep`, address formatter/autofill tools only if a lookup/caching/privacy policy is approved later.
- Translation guidance:
  - Add category `toolCategories.enderecos` in `messages/pt-br/directories.json`, `messages/en/directories.json`, and `messages/es/directories.json`.
  - Suggested category names: PT-BR `Endereços`; EN `Addresses`; ES `Direcciones`.
  - Add catalog metadata in `messages/{locale}/catalog/tools.json`.
  - Add dedicated namespaces in `messages/pt-br/tools/validador-cep.json`, `messages/en/tools/validador-cep.json`, and `messages/es/tools/validador-cep.json`.
  - Suggested tool names: PT-BR `Validador de CEP`; EN `Brazilian ZIP/CEP Validator`; ES `Validador de CEP brasileño`.
  - Keep `CEP`, `Correios`, `Busca CEP`, `DNE`, and route slug `/validadores/validador-cep` stable. Explain `CEP` as Brazilian postal code in EN/ES copy.
  - Translate issue codes, diagnostics, result statuses, copy actions, share warnings, SEO sections, FAQ, and official-lookup disclaimers.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/cep.ts` with result/status types, issue codes, diagnostics, format/raw helpers, default state, safe query parsing/serialization, and optional hash-only content sharing helpers.
  - Add `lib/tools/cep.test.ts` with deterministic coverage for valid raw/formatted CEPs, incomplete inputs, invalid separators, unsupported characters, extra digits, prefix handling, copy normalization, and URL/share helpers.
- URL state:
  - Use `components/tools/url-state.ts` for safe live query replacement.
  - Sync only safe settings such as `saida`.
  - Never write `cep` to `window.location.search` during normal editing.
  - Use hash-only `conteudo=1&cep=...` only for explicit content sharing.
  - Sanitize the address bar after hydrating a content-bearing hash.
- UI components:
  - Create `components/tools/validators/cep-validator-client.tsx`.
  - Use existing UI primitives and lucide icons such as `MapPin`, `BadgeCheck`, `CheckCircle`, `AlertTriangle`, `XCircle`, `Copy`, `Trash2`, `ShieldCheck`, and `ExternalLink`.
  - Use stable test ids for input, output mode, status, formatted output, raw output, length summary, issue list, copy formatted, copy raw, clear, example, include-content share control, share button, and official Correios link.
  - Keep layout dense and utilitarian; avoid a marketing hero.
  - Ensure long pasted strings wrap/truncate and never force horizontal overflow on mobile.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-cep/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "validador-cep")`.
- Registry/family/category:
  - Extend `ToolCategoryId` with `enderecos`.
  - Add a `toolCategories` entry with `familyId: "validadores"`, slug `enderecos`, href `/validadores/categorias/enderecos`, and sitemap priority around `0.72`.
  - Add a `tools` entry for `validador-cep` with `available: true`, `familyId: "validadores"`, `primaryCategoryId: "enderecos"`, `categoryIds: ["enderecos"]`, `stateMode: "query"`, `sitemapPriority` around `0.74`, and `seoApplicationCategory: "UtilityApplication"`.
  - Do not change existing `documentos`, `contato`, or `pagamentos` tools except if directory copy needs to mention address validators.
- Messages:
  - Add PT-BR, EN, and ES tool files, catalog entries, and directory category entries.
  - Keep copy precise: `formato válido`, `CEP formatado`, `somente dígitos`, and `consulta oficial nos Correios`; avoid `CEP existe` unless explicitly negated.
- Unit tests:
  - Cover `01001000` -> `01001-000` and raw `01001000`.
  - Cover `01001-000` accepted with same output.
  - Cover partial values like `01001` and `0100100`.
  - Cover invalid values like `0100-1000`, `01001--000`, `01001 000`, `01001.000`, `01001/000`, `abc01001000`, and emoji.
  - Cover extra values like `010010000` with attention/extra issue.
  - Cover optional prefix behavior for `CEP: 01001-000`.
  - Cover malformed query/hash params and content share length limits.
- E2E hooks/tests:
  - Add focused `tests/e2e/cep-validator.spec.ts`.
  - Cover route load, raw CEP formatting, formatted CEP acceptance, incomplete and invalid diagnostics, copy formatted/raw, clear/example actions, safe live URL without typed CEP, default share without typed CEP, explicit hash share/hydration/sanitization if implemented, Correios outbound link presence, EN/ES smoke, and mobile no-overflow.
  - Update `tests/e2e/tools-hub.spec.ts` only if it asserts visible tools/categories.
- Backlog updates:
  - Planner must not edit DB status or backlog markdown.
  - Creator should keep the DB row `In Progress` while implementing and let the orchestrator advance stages with SQL helpers.
  - Creator should update this plan status to `in_progress`, `implemented`, then tester to `verified` as the workflow proceeds.

## Test Plan

- Unit scenarios:
  - `01001000` produces `validFormat`, formatted `01001-000`, raw `01001000`, no lookup claim.
  - `01001-000` produces the same outputs.
  - ` 01001-000 ` produces attention for trimmed whitespace while preserving valid output.
  - `01001`, `010010`, and `0100100` produce incomplete states with progressive masks.
  - `010010000` produces attention for extra digit and does not silently copy a truncated value without warning.
  - `0100-1000`, `01001--000`, `01001 000`, `01001/000`, `01001.000`, `abc01001000`, and `01001-00🙂` produce invalid states with specific issue codes.
  - `CEP: 01001-000` follows the chosen prefix policy and is covered either as attention-cleaned or invalid unsupported prefix.
  - Invalid `saida` query values fall back to `formatado`.
  - Hash content is read only when `conteudo=1`.
- URL-state scenarios:
  - Empty URL loads default state.
  - Changing output mode updates only `saida` in the live query string.
  - Typing a CEP never writes it to `window.location.search`.
  - Default share URL contains no `cep`.
  - Explicit include-content share uses hash-only content, respects the small fragment limit, and warns if content is omitted.
  - Loading `#conteudo=1&cep=01001000` pre-fills the input and then clears the hash from the address bar.
- Browser scenarios:
  - Desktop route renders with no console or page errors.
  - Mobile route has no horizontal overflow with long invalid input.
  - Copy buttons work after a valid-format result and are disabled or safe in invalid/empty states.
  - Official Correios link opens the expected external URL and is visually labeled as external lookup.
  - EN and ES routes render localized title, metadata, core form labels, and FAQ without missing ICU keys.
- Playwright scenarios:
  - PT-BR main flow: fill raw `01001000`, assert status, formatted output, raw output, and local-only disclaimer.
  - Invalid diagnostics flow: fill `0100-1000` and assert misplaced-hyphen issue.
  - Privacy flow: type `01001-000`, assert `page.url()` search does not include the CEP, default share has no CEP, storage/cookies/IndexedDB do not contain the CEP, and no request URL/body after typing contains the CEP.
  - Explicit share flow if implemented: include content, copy/share URL contains hash-only CEP, load it, assert hydration, then assert hash sanitization.
  - Mobile flow: long pasted value does not overflow.
- Lint/build commands:
  - `corepack pnpm test -- lib/tools/cep.test.ts lib/constants.test.ts`
  - `corepack pnpm lint`
  - `corepack pnpm build` with required placeholder env if the local workspace needs it.
  - `PORT=<free-port> corepack pnpm run test:e2e -- tests/e2e/cep-validator.spec.ts` when browser permissions are available.
  - `git diff --check`
- Acceptance criteria:
  - `/validadores/validador-cep` exists in all locales through the locale route wrapper.
  - The helper validates and formats CEP syntax without network calls.
  - Typed CEP never appears in default query params, storage, analytics, server requests, or account save paths.
  - Copy and share behavior is explicit, bounded, and covered by tests.
  - UI copy clearly distinguishes local format validation from Correios official lookup.
  - Registry, directory category, catalog metadata, messages, sitemap discovery, unit tests, e2e tests, lint, and build expectations are satisfied.

## Implementation Notes

- Status updates:
  - 2026-07-05: Planner decision `new`; wrote this plan from the claimed DB row only. Did not edit app code or backlog markdown.
  - 2026-07-05: Creator confirmed the DB row is `In Progress` with stage `implementation` using `scripts/backlog/get_item.sql`, accepted the orchestrator handoff, and moved this plan to `in_progress` before app edits.
  - 2026-07-05: Creator implemented the browser-only CEP validator route and left the DB row `In Progress` with stage `implementation` for review/tester handoff. No Correios/DNE/ViaCEP lookup, server API, address autofill, favorites, storage persistence, or default CEP query persistence was added.
  - 2026-07-05: Review gate found one blocking privacy issue: `autoComplete="postal-code"` requested browser address autofill despite the no-autofill contract. Fixed by changing the CEP input to `autoComplete="off"` in `components/tools/validators/cep-validator-client.tsx`.
  - 2026-07-05: Tester confirmed the DB row is `In Progress` with stage `testing`, validated the route and privacy contract, and moved this plan to `verified`. No production code or e2e files were changed by the tester.
  - 2026-07-05: Orchestrator moved the DB row to `In Progress` with stage `verified` after review and tester validation passed. The row will be marked `Done` only after the draft PR URL is recorded.
  - 2026-07-05: Draft PR created at https://github.com/saulodefaria/calculaderia/pull/52. Label application was attempted, but the repo does not currently have the `codex` label. The DB row was marked `Done` with stage `pr` after the PR URL was recorded.
- Files changed:
  - `docs/tool-plans/validador-cep.md`
  - `lib/tools/cep.ts`
  - `lib/tools/cep.test.ts`
  - `components/tools/validators/cep-validator-client.tsx`
  - `app/[locale]/validadores/validador-cep/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br/catalog/tools.json`
  - `messages/en/catalog/tools.json`
  - `messages/es/catalog/tools.json`
  - `messages/pt-br/directories.json`
  - `messages/en/directories.json`
  - `messages/es/directories.json`
  - `messages/pt-br/tools/validador-cep.json`
  - `messages/en/tools/validador-cep.json`
  - `messages/es/tools/validador-cep.json`
  - `tests/e2e/cep-validator.spec.ts`
- Validation results:
  - `git diff --check --no-index /dev/null docs/tool-plans/validador-cep.md` produced no whitespace warnings; exit code 1 was expected for a new-file no-index diff.
  - `set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-cep -f scripts/backlog/get_item.sql`: passed before implementation and again after implementation; DB row is `In Progress`, stage `implementation`, target route `/validadores/validador-cep`, plan path `docs/tool-plans/validador-cep.md`, branch `codex/validador-cep-tool`.
  - `corepack pnpm test -- lib/tools/cep.test.ts`: passed (Vitest reported 67 files / 780 tests through the repo test runner).
  - `corepack pnpm test -- lib/tools/cep.test.ts lib/constants.test.ts`: passed (Vitest reported 67 files / 780 tests through the repo test runner).
  - `node -e "..."` JSON parse check for edited PT-BR/EN/ES catalog, directory, and CEP tool message files: passed.
  - `corepack pnpm run validate:messages`: passed.
  - `corepack pnpm lint`: passed.
  - `git diff --check`: passed.
  - Review-fix rerun after disabling CEP input autocomplete: `corepack pnpm test -- lib/tools/cep.test.ts lib/constants.test.ts`, `corepack pnpm run validate:messages`, and `git diff --check` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=placeholder NEXTAUTH_SECRET=placeholder AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 corepack pnpm build`: sandboxed run failed on Prisma cache `EPERM` under `~/.cache/prisma`; elevated retry passed with only existing metadataBase and edge-runtime warnings.
  - `PORT=3210 corepack pnpm run test:e2e -- tests/e2e/cep-validator.spec.ts`: sandboxed Chromium failed before assertions with the known macOS `MachPortRendezvousServer` permission issue.
  - `PORT=3211 corepack pnpm run test:e2e -- tests/e2e/cep-validator.spec.ts`: elevated retry passed 6/6 Chromium tests.
  - Tester DB read: `set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-cep -f scripts/backlog/get_item.sql` passed; source row is `In Progress`, stage `testing`, route `/validadores/validador-cep`, plan path `docs/tool-plans/validador-cep.md`, branch `codex/validador-cep-tool`.
  - Tester inspection confirmed `components/tools/validators/cep-validator-client.tsx` uses `autoComplete="off"`, no CEP-specific production file imports `SaveButton`, and the CEP helper serializes typed CEP only in explicit content fragments.
  - Tester Browser/browser-use notes: a direct ad-hoc dev server without `WATCHPACK_POLLING=true` hit local `EMFILE` watcher failures and served 404s, so it was discarded as an environment-invalid target. A polling dev server on port 3215 served `/validadores/validador-cep` and `/en/validadores/validador-cep` with HTTP 200. In-app Browser checks exercised route load, `autoComplete="off"`, no save UI, raw and formatted CEP states, incomplete/invalid/attention diagnostics, settings-only live URL state, explicit share toggle not mutating the live hash, fresh default privacy state, hash hydration/sanitization, EN/ES headings, mobile no-overflow, storage/resource privacy probes, and no lookup resource URLs. Clipboard assertions in the background in-app tab were not reliable because the document was not focused, so clipboard copy/share behavior is covered by the focused Playwright spec.
  - `corepack pnpm test -- lib/tools/cep.test.ts lib/constants.test.ts`: passed (Vitest reported 67 files / 780 tests through the repo test runner).
  - `corepack pnpm run validate:messages`: passed.
  - `corepack pnpm lint`: passed.
  - `git diff --check`: passed.
  - `PORT=3213 corepack pnpm run test:e2e -- tests/e2e/cep-validator.spec.ts`: sandboxed Chromium failed before assertions with the known macOS `MachPortRendezvousServer` permission issue; this was not an app assertion failure.
  - `PORT=3214 corepack pnpm run test:e2e -- tests/e2e/cep-validator.spec.ts`: elevated retry passed 6/6 Chromium tests. Coverage includes PT-BR route load, raw CEP formatting, copy formatted/raw, default share without typed CEP, explicit hash-only content share, Correios link, incomplete/invalid/prefix/extra-digit diagnostics, hash hydration and sanitization, no typed CEP in URL/requests/storage/cookies/default share, no SaveButton, EN/ES smoke, mobile no-overflow, and zero console/page errors.
  - Draft PR creation: `gh pr create --draft --title "Add CEP validator tool" --body-file /private/tmp/validador-cep-pr-body.md` returned https://github.com/saulodefaria/calculaderia/pull/52.
- Tester findings:
  - Tester pass complete. No blocking failures, production-code changes, or e2e coverage gaps remain. Residual environment notes: sandboxed Chromium needs elevated permissions on this macOS host, and ad-hoc dev servers need `WATCHPACK_POLLING=true` to avoid local watcher `EMFILE` route failures.
- Final status:
  - `verified`; DB item is `Done` with stage `pr`; draft PR is https://github.com/saulodefaria/calculaderia/pull/52.
