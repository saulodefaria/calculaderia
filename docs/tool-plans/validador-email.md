---
slug: "validador-email"
familyId: "validadores"
primaryCategoryId: "contato"
backlogRank: 7
primaryKeyword: "validador de email"
decision: "new"
targetRoute: "/validadores/validador-email"
status: "verified"
createdAt: "2026-06-24"
updatedAt: "2026-06-24"
---

# Validador de Email Plan

## Backlog Row

- Rank: 7
- Original status: Backlog
- Slug: `validador-email`
- Primary keyword: `validador de email`
- Cluster keywords: `validar email`; `verificar email valido`; `email validator`
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `contato`
- Opportunity score: 81
- Idea type: New
- Notes: Validate syntax only unless an external DNS/email check is planned.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/validadores/validador-email`
- Rationale: The selected backlog row is the next eligible non-calculator tool after skipping Rank 6 `conversor-maiusculas`, which automation memory records as already completed in draft PR #19 on 2026-06-22. No existing route, registry entry, helper module, translation namespace, or prior plan implements email-address validation. A dedicated `/validadores/validador-email` route matches the primary keyword and should stay separate from CPF/CNPJ document validators because email is contact syntax, not a Brazilian document number.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, current family/category directory routes, and current top-level tool routes under `calculadoras`, `geradores`, `matematica`, `datas`, `texto`, and `dev`. There is no `/validadores/validador-email` route.
- Registry/categories checked: `lib/constants.ts` already defines `ToolFamilyId: "validadores"` and a validator category `documentos` used by `cpf` and `cnpj`. Existing validator entries are document check-digit tools. No email validator entry or contact/email category exists.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/documents.test.ts`, `components/tools/validators/document-validator-client.tsx`, `components/tools/url-state.ts`, `lib/tools/json.ts`, `components/tools/dev/json-formatter-client.tsx`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. Existing validators validate CPF/CNPJ digits only. Email text appears only in account/header UI, backlog rows, and unrelated future ideas.
- Prior plans checked: `docs/tool-plans/_template.md`, `docs/tool-plans/qr-code.md`, `docs/tool-plans/contador-caracteres.md`, `docs/tool-plans/formatador-json.md`, `docs/tool-plans/conversor-base64.md`, `docs/tool-plans/sorteador-nomes.md`, and calculator plans under `docs/calculator-plans`. No duplicate `validador-email` plan exists in this worktree. Automation memory notes `docs/tool-plans/conversor-maiusculas.md` exists on the completed Rank 6 branch, but it is not present locally and is not overlap.
- Text search checked: `validador-email`, `validador de email`, `email`, `e-mail`, `validar email`, `verificar email valido`, `validadores`, and `validator` across docs, routes, registry, tool modules, components, and messages.
- Overlap conclusion: Build a new tool page. Keep CPF/CNPJ under `documentos`. Plan a new `contato` validator category so email and future Rank 22 `validador-telefone` can share a coherent contact-data category. Keep future Rank 86 `assinatura-email` separate because it is a document/content generator, not syntax validation.

## User Intent And Scope

- Target user: People validating signup forms, spreadsheets, contact lists, support inputs, CRM exports, QA data, and simple email fields before submission or cleanup.
- User job: Paste or type one email address, immediately see whether its syntax looks acceptable for common web forms, understand why an address failed, copy a normalized version, and share safe tool settings without exposing private email addresses by default.
- In scope:
  - Single-address syntax validation for common web form usage.
  - Immediate browser-only result for empty, valid, invalid, and unsupported/attention states.
  - Clear checks for one `@`, non-empty local part, non-empty domain, ASCII whitespace/control characters, domain label structure, label length, and common malformed dot/hyphen cases.
  - Practical validation based primarily on the WHATWG HTML `type=email` email-state definition, with explicit product choices where the formal RFC syntax is broader than common forms.
  - Optional normalization for copied output: trim leading/trailing ASCII whitespace, lowercase the domain, and punycode-normalize internationalized domain labels when the platform can do so safely. Do not lowercase the local part.
  - Explanation that quoted local parts, comments, display names, domain literals, and many RFC edge cases are intentionally not accepted in v1 because users expect common signup-form syntax.
  - Attention state for non-ASCII local parts: these can be valid under SMTPUTF8 but are not universally supported and should not be marked as deliverable.
  - Copy normalized email, copy validation summary, clear input, and share safe settings.
- Out of scope:
  - DNS lookup, MX lookup, SMTP mailbox probing, disposable-domain detection, typo suggestions, enrichment, bounce prediction, spam-risk scoring, bulk list validation, CSV upload, account save, server-side validation, API endpoints, and sending verification emails.
  - Proof that an inbox exists, accepts mail, belongs to a person, or is safe to contact.
  - Full RFC parser for obsolete syntax, comments, route addresses, display-name mailboxes, quoted local parts, or domain literals in the first build.
- Sensitive-topic caveats:
  - Email addresses can be personal data. Default live URL and default share URL must not include the email address.
  - Browser-only syntax checking reduces server exposure, but shared links, clipboard contents, screenshots, browser history, analytics instrumentation, and manual copy/paste can still expose addresses.
  - Avoid deliverability claims. Say "sintaxe valida" or "formato aceito por formularios comuns", not "email existe" or "caixa postal verificada".

## Tool Contract

- Inputs:
  - `email`: single free-form text input.
  - `modo`: validation mode, default `comum`. The first build can expose no visible mode and still keep this internal/defaulted; if a visible advanced option is added, use `comum` for web-form syntax and `relatorio` for more detailed diagnostics.
  - `conteudo`: optional explicit share flag used only for links that include the email address in the URL fragment.
- Defaults:
  - `email` empty.
  - `modo=comum`.
  - `conteudo` absent, so live URLs and default share links omit the email address.
- Validation rules:
  - Trim leading/trailing ASCII whitespace for validation and normalized copy, while showing an attention note if trimming changed the input.
  - Reject empty input with a neutral empty state, not a red error.
  - Reject line breaks, tabs, spaces inside the address, and other ASCII control characters.
  - Require exactly one `@`.
  - Require a non-empty local part and non-empty domain.
  - Local part for v1 common syntax: allow ASCII letters, digits, and common `atext` punctuation from WHATWG/RFC 5322, including dot, plus, hyphen, underscore, apostrophe, slash, equals, question mark, caret, braces, vertical bar, tilde, and backtick; reject local parts that start or end with `.`, contain consecutive dots, or exceed a practical local-part budget such as 64 characters.
  - Domain: split on dots; require at least one dot for the primary `valid` result; require each label to start and end with an ASCII letter or digit after punycode conversion; allow internal hyphen; reject empty labels, leading/trailing dot, labels over 63 ASCII characters, and total ASCII domain length over 253 characters.
  - Accept uppercase letters but normalize the domain to lowercase in copied output. Preserve local-part case because local-part interpretation is domain-dependent.
  - For internationalized domains, attempt browser/runtime IDNA handling through a structured API such as `new URL("https://" + domain)` or a dependency already accepted by the creator. If conversion fails, return invalid or attention with a clear message.
  - For non-ASCII local parts, return `attention` or `unsupported` instead of `valid` in v1, explaining that SMTPUTF8 can allow them but many forms and mail systems may not.
  - Reject display names like `Name <name@example.com>`, comma-separated lists, quoted strings like `"a b"@example.com`, comments, source routes, and domain literals like `user@[192.0.2.1]` in v1 with explanation copy.
  - Enforce a practical input length guard such as 320 characters for UI responsiveness and clear diagnostics, without claiming that this alone proves standards compliance.
  - Invalid query or fragment params must fall back to defaults without crashing.
- Outputs:
  - Status: `empty`, `valid`, `invalid`, or `attention`.
  - Normalized email when syntax is valid or attention-worthy and normalization is possible.
  - Checklist diagnostics: local part, `@`, domain labels, unsupported syntax, whitespace/control characters, IDN/punycode note, and privacy note.
  - Main result message in plain language.
  - Copyable normalized address and copyable summary.
  - No generated result and no email address should be written to the live query string by default.
- Result explanations:
  - Explain that the tool validates syntax only.
  - Explain that valid syntax does not mean the domain exists, has MX records, accepts mail, or that the mailbox exists.
  - Explain that RFC 5322 allows some unusual forms that the tool intentionally rejects because common web forms do not accept them.
  - Explain that SMTPUTF8/internationalized addresses have uneven support, especially for non-ASCII local parts.
- URL params:
  - Safe live query params: `modo` only if needed. Omit `email` from `window.location.search` during normal editing.
  - Content-bearing share links may include `#conteudo=1&email=...` only after explicit opt-in, following the JSON formatter and name drawer privacy pattern.
  - On initial load, read `email` only from the fragment/hash when `conteudo=1` is present.
  - After hydrating a content-bearing shared link, sanitize the live address bar back to safe query params and clear the hash.
  - Enforce a fragment length budget such as 1,800 characters for consistency with prior content-sharing tools.
- Share behavior:
  - Default `ShareButton` URL includes only the route and safe settings.
  - Provide an explicit "incluir email no link compartilhado" checkbox or equivalent control only if product wants content-bearing sharing.
  - Enabling include-content must not mutate the address bar; it only changes the URL returned by the share action.
  - Show a warning that anyone with a content-bearing URL can read the email address.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store the email address, normalized output, validation result, or copied summary in localStorage, sessionStorage, analytics events, server logs, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/email.ts` with types for validation status, issue codes, normalized output, diagnostics, URL/search params, and fragment share helpers.
  - Implement `validateEmailSyntax(input)` as a deterministic, browser-only helper. The helper should return structured issue codes rather than user-facing strings.
  - Base the common syntax on WHATWG HTML `type=email` email-state behavior, then apply app-owned stricter diagnostics for consecutive local dots, local leading/trailing dot, required dot in the domain, and explicit unsupported forms.
  - Split validation into small helpers: trim/character guard, `@` split, local-part check, domain normalization/check, unsupported syntax detection, and result summarization.
  - Preserve local-part case in normalized output and lowercase only the normalized domain.
  - Prefer structured parsing/encoding APIs for IDN domains over ad hoc Unicode manipulation. If runtime behavior is inconsistent, keep IDN domain support as attention state until tested in supported browsers.
  - Do not make network calls. Do not use DNS, MX, SMTP, third-party APIs, or server actions.
- Data tables or assumptions:
  - No external data tables are required.
  - The tool validates a single address, not a list.
  - V1 uses common web-form syntax, not a complete mail transport implementation.
  - Domain label checks are syntactic. They do not prove that a TLD exists or accepts mail.
  - Non-ASCII local parts are treated as attention/unsupported in v1 because SMTPUTF8 support is not universal and cannot be verified offline.
- Official or authoritative sources:
  - RFC 5322, Section 3.4.1, `addr-spec`: https://www.rfc-editor.org/rfc/rfc5322#section-3.4.1
  - RFC 6531, Section 3.3, SMTPUTF8 extended mailbox syntax: https://www.rfc-editor.org/rfc/rfc6531#section-3.3
  - WHATWG HTML Living Standard, Email state (`type=email`), including valid email address definition and practical regex: https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)
  - RFC 1034, Section 3.5, preferred name syntax and label length assumptions referenced by HTML email-state rules: https://www.rfc-editor.org/rfc/rfc1034#section-3.5
  - Codebase source checked on 2026-06-24: current validator routes, registry entries, document validator helpers/tests, URL helpers, JSON/name-drawer privacy patterns, translations, and prior tool plans.
- Source access dates:
  - RFC 5322 checked on 2026-06-24.
  - RFC 6531 checked on 2026-06-24.
  - WHATWG HTML checked on 2026-06-24; page reported "Last Updated 23 June 2026" during planning.
  - RFC 1034 checked on 2026-06-24.
  - Codebase checked on 2026-06-24.
- Rule/table effective dates:
  - RFC 5322 published October 2008.
  - RFC 6531 published February 2012.
  - RFC 1034 published November 1987.
  - WHATWG HTML is a living standard; record observed last-updated date in implementation notes if creator rechecks.
- Freshness or maintenance risk:
  - Low-to-moderate for basic common email syntax.
  - Moderate for WHATWG living-standard details and browser IDN/punycode behavior; recheck if tests expose cross-browser differences.
  - Moderate product-risk if users expect deliverability verification; keep copy and metadata explicit that this is syntax-only.
  - Low privacy risk if email is never written to live query params, storage, analytics, or server APIs by default.
- Estimator or privacy limitations:
  - This is not an estimator and not a deliverability verifier.
  - The result cannot prove mailbox existence, domain ownership, permission to contact, bounce risk, disposable status, or anti-spam compliance.
  - Browser-only processing reduces intentional server exposure, but user actions such as sharing a content-bearing URL or copying output can still expose the address.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de Email`
  - PT-BR meta title: `Validador de email online gratis`
  - PT-BR description: `Valide a sintaxe de um email no navegador, com avisos claros e sem verificar DNS, dominio ou caixa postal.`
- Main form sections:
  - Input card with one email input, browser-only privacy note, clear action, and optional paste hint.
  - Result card with status icon, normalized email, and checklist diagnostics.
  - Explanation panel for syntax-only scope, unsupported RFC edge cases, and internationalized email caveat.
  - Share/privacy section with safe default share link and optional explicit include-email control.
- Results sections:
  - Empty state before input.
  - Valid state: "sintaxe valida para formularios comuns" plus normalized copy action.
  - Invalid state: primary issue and checklist of failed checks.
  - Attention state: syntax may be internationalized or uncommon; do not treat as deliverability verified.
  - Diagnostics with stable dimensions so long local parts/domains do not overflow on mobile.
- SEO sections:
  - What an email validator checks.
  - Difference between syntax validation, domain/MX validation, and mailbox verification.
  - Why some unusual RFC-valid addresses may be rejected by common forms.
  - Internationalized emails and SMTPUTF8 support caveat.
  - Privacy note for pasted email addresses.
- FAQ topics:
  - `O email e enviado para o servidor?`
  - `Este validador confirma se a caixa postal existe?`
  - `O validador verifica DNS ou MX?`
  - `Por que um email com acento ou caracteres Unicode aparece com aviso?`
  - `Por que enderecos com aspas, comentarios ou nome de exibicao sao recusados?`
  - `Posso compartilhar o link com um email preenchido?`
- Disclaimer or privacy copy:
  - The tool validates syntax in the browser and does not intentionally send the email address to the server.
  - Syntax validation does not prove that the domain exists, that the mailbox exists, or that the address can receive messages.
  - Do not include an email address in a shared link unless everyone with the link may see it.
- Related tool links:
  - Existing: `/validadores/cpf`, `/validadores/cnpj`, `/dev/formatador-json`, `/dev/conversor-base64`, `/texto/contador-caracteres`.
  - Future backlog candidates: `/validadores/validador-telefone`, `/validadores/validador-cep`, `/validadores/uuid-validator`, `/documentos/assinatura-email` if a documents family is later added, and `/dev/regex-tester`.
- Translation guidance:
  - Add `toolCategories.contato` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add `tools.validador-email` keys in all three locale files.
  - Suggested category names: PT-BR `Contato`; EN `Contact`; ES `Contacto`.
  - Suggested tool names: PT-BR `Validador de Email`; EN `Email Validator`; ES `Validador de Email` or `Validador de correo electronico`.
  - Translate metadata, input labels, validation statuses, issue codes, checklist labels, normalization copy, privacy/share warnings, syntax-only disclaimer, SEO content, and FAQ content.
  - Keep source names like RFC, SMTPUTF8, DNS, MX, and WHATWG untranslated or lightly explained in localized body copy.
  - Keep the route slug `/validadores/validador-email` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/email.ts` with validation result types, issue codes, default state, local/domain validators, IDN domain normalization helper, copy-normalization helper, safe search-param helpers, and optional fragment share helpers.
  - Add `lib/tools/email.test.ts` with deterministic coverage for valid common addresses, invalid syntax, unsupported RFC edge cases, internationalized address behavior, normalization, query params, and share fragments.
- URL state:
  - Use `components/tools/url-state.ts` for safe query read/write.
  - Sync only safe settings such as `modo` in the live query string.
  - Never write `email` to `window.location.search` during normal editing.
  - Read and write content-bearing `email` only behind explicit `conteudo=1` fragment/hash support.
  - Sanitize the address bar after hydrating a content-bearing fragment.
- UI components:
  - Create `components/tools/validators/email-validator-client.tsx`.
  - Use existing UI primitives, `ShareButton`, lucide icons such as `BadgeCheck`, `CheckCircle`, `XCircle`, `AlertTriangle`, `Copy`, `Trash2`, and accessible labels.
  - Add stable test ids for email input, result status, normalized output, diagnostics checklist, copy normalized action, copy summary action, clear button, include-content control, and share button.
  - Keep the primary experience dense and useful; avoid a marketing hero.
  - Ensure long email strings wrap or truncate gracefully without horizontal overflow on mobile.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-email/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "validador-email")`.
- Registry/family/category:
  - Add a new `ToolCategoryId` value `contato` under `validadores` with href `/validadores/categorias/contato`, icon `BadgeCheck` or a contact/mail-appropriate lucide icon if already available.
  - Add a `tools` entry for `validador-email` with `available: true`, `familyId: "validadores"`, `primaryCategoryId: "contato"`, `categoryIds: ["contato"]`, `sitemapPriority` around `0.74`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
  - Keep existing `documentos` category and CPF/CNPJ entries unchanged.
- Messages:
  - Add PT-BR, EN, and ES translations for category metadata, tool metadata, form labels, issue messages, statuses, diagnostics, actions, privacy/share states, SEO text, and FAQ content.
  - Do not reuse CPF/CNPJ document wording for email deliverability.
- Unit tests:
  - Cover `user@example.com`, `first.last+tag@example.com`, uppercase domain normalization, subdomains, hyphenated labels, and IDN domain behavior.
  - Cover empty, missing `@`, multiple `@`, missing local part, missing domain, spaces, newlines, consecutive dots, local leading/trailing dot, domain leading/trailing hyphen, empty domain label, too-long label, too-long input, display name, quoted local part, domain literal, comma-separated list, non-ASCII local part, and invalid fragment params.
- E2E hooks/tests:
  - Add focused `tests/e2e/email-validator.spec.ts`.
  - Cover route load, valid common address, invalid address diagnostics, attention state for internationalized local part if supported by UI, normalized copy, clear action, safe live URL without email, default share URL without email, explicit content share if implemented, hash hydration/sanitization, and mobile no-horizontal-overflow.
  - Update `tests/e2e/tools-hub.spec.ts` if the hub verifies visible tools/categories.
- Backlog updates:
  - Creator should mark `docs/tool-backlog.md` Rank 7 `In Progress` only when implementation starts.
  - Creator should update this plan status to `in_progress`, `implemented`, and `verified` as the implementation/tester workflow proceeds.

## Test Plan

- Unit scenarios:
  - Pure helper tests for accepted common syntax and every issue code.
  - Normalization tests preserving local-part case and lowercasing/punycode-normalizing domain.
  - Unsupported syntax tests for display names, quoted local parts, comments, domain literals, and non-ASCII local parts.
  - URL-state tests proving live params never include `email` and fragment parsing requires `conteudo=1`.
- URL-state scenarios:
  - Empty URL loads default state.
  - Invalid `modo` falls back to default.
  - Editing an email does not mutate the query string with the email address.
  - Default share URL contains no `email`.
  - Explicit include-content share uses fragment/hash only, respects the length limit, and warns when omitted.
  - Loading `#conteudo=1&email=...` pre-fills the input and then clears the hash from the address bar.
- Browser scenarios:
  - Desktop and mobile route renders with no console errors.
  - Result changes immediately as the user edits.
  - Long input wraps/truncates cleanly and does not force horizontal scrolling.
  - Copy actions work or show graceful fallback if clipboard permission is unavailable.
  - Privacy and syntax-only copy are visible near the input/result, not hidden only in FAQ.
- Playwright scenarios:
  - Navigate to `/validadores/validador-email` for the default PT-BR locale.
  - Validate `Usuario+tag@Example.COM` and assert valid status plus normalized domain.
  - Validate malformed examples such as `usuario@@example.com`, `usuario@example..com`, `usuario@-example.com`, `Name <usuario@example.com>`, and `usuario exemplo@example.com`.
  - Assert live URL does not contain the typed email after editing.
  - Assert default share URL omits the email address.
  - If include-content is implemented, assert the generated URL uses `#conteudo=1&email=...`, hydration works, and the hash is sanitized.
  - Run a mobile viewport check for no horizontal overflow.
- Lint/build commands:
  - `pnpm test -- lib/tools/email.test.ts`
  - `pnpm lint`
  - `pnpm build` with the repo's required placeholder database env if needed.
  - `PORT=<free-port> pnpm run test:e2e -- tests/e2e/email-validator.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - `/validadores/validador-email` exists in all supported locales through the App Router locale segment.
  - The tool validates single-address common syntax offline and explains failures.
  - The UI clearly says it does not verify DNS, MX, SMTP, domain existence, or mailbox existence.
  - The email address is never synced to live query params by default.
  - Content-bearing share, if present, is explicit, hash-only, length-limited, and sanitized after hydration.
  - PT-BR, EN, and ES messages are complete and JSON-valid.
  - Unit, lint, build, and focused e2e validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-24: Planned Rank 7 `validador-email` as a new non-calculator validator after skipping Rank 6 based on automation memory.
  - 2026-06-24: Creator implementation started; corrected default PT-BR Playwright route note to `/validadores/validador-email`.
  - 2026-06-24: Creator implementation completed; backlog remains `In Progress` pending independent tester validation.
  - 2026-06-24: Review-fix handoff completed for accepted PR review findings; backlog remains `In Progress` pending independent tester validation.
  - 2026-06-24: Repeat review found one additional parser-boundary blocker for percent-encoded domains; patched directly with focused regressions.
  - 2026-06-24: Independent tester validation passed; route is ready for orchestrator/backlog completion.
  - 2026-06-24: Orchestrator marked `docs/tool-backlog.md` rank 7 `Done` with route and validation summary.
  - 2026-06-24: Draft PR opened at https://github.com/saulodefaria/calculaderia/pull/21 and recorded in `docs/tool-backlog.md`.
- Files changed:
  - `docs/tool-plans/validador-email.md`
  - `docs/tool-backlog.md`
  - `lib/tools/email.ts`
  - `lib/tools/email.test.ts`
  - `components/tools/validators/email-validator-client.tsx`
  - `app/[locale]/validadores/validador-email/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/email-validator.spec.ts`
- Validation results:
  - `pnpm test -- lib/tools/email.test.ts` passed; repo script ran the full non-e2e Vitest suite: 37 files, 417 tests.
  - `pnpm test -- lib/tools/email.test.ts lib/constants.test.ts` passed; repo script ran the full non-e2e Vitest suite: 37 files, 417 tests.
  - `node -e "for (const file of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(file, 'utf8')); console.log(file + ' ok'); }"` passed for all three message files.
  - `pnpm lint` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed; build emitted existing metadataBase warnings.
  - Elevated `PORT=3135 pnpm run test:e2e -- tests/e2e/email-validator.spec.ts` passed: 5 Chromium tests.
  - `git diff --check` passed.
- PR-review findings addressed:
  - `blocking(validation)`: rejected backslashes before domain URL parsing and added a defensive URL shape check so path/search/hash-like domain content cannot be silently discarded; added regression coverage for `user@example.com\\foo` returning invalid with no normalized output.
  - `test-gap(email-validation)`: added deterministic coverage for `domainTooLong` and URL parser failure/`domainInvalidIdn`.
  - `issue(i18n)`: broadened the `toolFamilies.validadores.metaDescription` copy in PT-BR, EN, and ES to include email/contact/common-input validators.
  - `blocking(validation)`: rejected `%` before domain URL parsing so percent-encoded host characters such as `%2e` and `%65` cannot be decoded into a different valid domain; added regression coverage for both cases.
- Review-fix validation results:
  - `pnpm test -- lib/tools/email.test.ts lib/constants.test.ts` passed; repo script ran the full non-e2e Vitest suite: 37 files, 417 tests.
  - `node -e "for (const file of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(file, 'utf8')); console.log(file + ' ok'); }"` passed for all three message files.
  - `git diff --check` passed.
  - `pnpm lint` passed.
  - After percent-encoding fix, `pnpm test -- lib/tools/email.test.ts lib/constants.test.ts`, `pnpm lint`, and `git diff --check` passed again.
- Tester findings:
  - Passed independent browser-level validation for `/validadores/validador-email`.
  - Added focused e2e coverage for copy-summary clipboard output, FAQ/SEO visibility, and actual validator family/category navigation in `tests/e2e/email-validator.spec.ts`.
  - Live browser coverage against `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3136 NEXTAUTH_URL=http://localhost:3136 WATCHPACK_POLLING=true NEXT_TELEMETRY_DISABLED=1 pnpm dev --hostname localhost --port 3136` passed 28 checks: route load/no redirect, desktop input visibility, no console/page errors, valid normalized state, malformed invalid diagnostics, SMTPUTF8 attention state, safe live URL, default share without email, explicit hash-only content share, copy normalized, copy summary, clear, FAQ/SEO/JSON-LD visibility, breadcrumb/family/category/tool navigation, hash hydration/sanitization, and mobile no-horizontal-overflow at 390px.
  - Focused e2e command `PORT=3138 pnpm run test:e2e -- tests/e2e/email-validator.spec.ts` passed: 6 Chromium tests. An earlier augmented e2e run on `PORT=3137` failed only because the tester-added FAQ selector expected a heading role for visible card-title text; the selector was corrected before the passing rerun.
  - `pnpm lint` passed after the e2e-only change.
  - `git diff --check` passed.
  - Targeted unit tests were not rerun in the tester pass because no production logic changed and prior review-fix runs already passed `pnpm test -- lib/tools/email.test.ts lib/constants.test.ts`.
- Remaining tester risks:
  - No functional blockers found. Browser and e2e validation required elevated Chromium execution on this host, consistent with prior automation memory about the macOS MachPort sandbox issue.
  - A manually started dev server without auth env vars produced Auth.js session 500 console errors; rerunning with the Playwright auth env resolved this and the final live browser pass had no console/page errors.
- Final status:
  - `verified`; `docs/tool-backlog.md` rank 7 is `Done` with draft PR https://github.com/saulodefaria/calculaderia/pull/21, route, and validation summary.
