---
slug: "validador-telefone"
familyId: "validadores"
primaryCategoryId: "contato"
backlogRank: 22
primaryKeyword: "validador de telefone"
decision: "new"
targetRoute: "/validadores/validador-telefone"
status: "verified"
createdAt: "2026-07-06"
updatedAt: "2026-07-06"
---

# Validador de Telefone Plan

## Backlog Row

- Rank: 22
- Original status: `In Progress`
- Stage: `planning` at planner time; confirmed `implementation` before creator app edits.
- Slug: `validador-telefone`
- Branch: `codex/validador-telefone-tool`
- Primary keyword: `validador de telefone`
- Cluster keywords: not provided in the claimed DB row.
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `contato`
- Opportunity score: not provided in the claimed DB row.
- Idea type: `New`
- Notes: not provided in the claimed DB row.
- Done ref: not provided in the claimed DB row.
- Plan path: `docs/tool-plans/validador-telefone.md`
- Target route: `/validadores/validador-telefone`

## Decision

- Decision: `new`
- Target route: `/validadores/validador-telefone`
- Buildability: buildable.
- Rationale: The current worktree has no phone validator route, registry entry, helper module, client component, translation namespace, focused e2e spec, or prior plan. The target route matches the claimed primary keyword and belongs in the existing `validadores` family. Use the existing `contato` category because `validador-email` already established contact-data validation and current directory copy already describes validators for emails, phone numbers, and contact data without external lookup.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx`, `app/[locale]/validadores/validador-email/page.tsx`, `app/[locale]/validadores/validador-cartao/page.tsx`, dynamic family/category routes, and current top-level tool routes under `calculadoras`, `geradores`, `matematica`, `datas`, `texto`, `cores`, and `dev`.
- Registry/categories checked: `lib/constants.ts` already defines `ToolFamilyId: "validadores"` and validator categories `documentos`, `contato`, and `pagamentos`. Existing validator entries are `cpf`, `cnpj`, `formatador-cpf-cnpj`, `validador-email`, and `validador-cartao`. No `validador-telefone` entry exists.
- Related modules/translations checked: `lib/tools/email.ts`, `lib/tools/documents.ts`, `lib/tools/payment-card.ts`, `components/tools/validators/*`, `components/tools/url-state.ts`, split tool messages under `messages/*/tools`, catalog/directory messages under `messages/*`, and focused e2e specs for email, card, and CPF/CNPJ formatter privacy patterns.
- Prior plans checked: current `docs/tool-plans` and `docs/calculator-plans`. Adjacent plans mention `/validadores/validador-telefone` only as a future candidate; no duplicate plan exists.
- Text search checked: `validador-telefone`, `validador de telefone`, `telefone`, `phone`, `celular`, `whatsapp`, `E.164`, `Código Nacional`, and `nSAPN` across routes, registry, tool modules, components, messages, tests, and plan directories, excluding archived backlog snapshots.
- Overlap conclusion: Build a new route. Reuse the contact-validator privacy model from `validador-email` and the hostile URL cleanup posture from `validador-cartao`, but keep phone validation separate from email, CEP, CPF/CNPJ, payment card, QR/WhatsApp link generation, and any telecom lookup or ownership verification.

## User Intent And Scope

- Target user: People cleaning signup forms, CRM exports, support records, spreadsheets, landing-page leads, QA fixtures, and contact data before pasting it into another system.
- User job: Paste or type one phone number, see whether it has a plausible Brazilian phone shape or E.164 international shape, get a normalized display/copy format, and understand what the result can and cannot prove.
- In scope:
  - Single phone-number syntax and numbering-shape validation in the browser.
  - Default Brazil mode for common fixed-line and mobile numbers.
  - Optional international/E.164 structural mode for numbers written with `+` and digits.
  - Normalization of common separators such as spaces, parentheses, hyphen, dot, and non-breaking spaces.
  - Recognition of Brazilian country code `+55` and national significant numbers with 2-digit `Código Nacional`/DDD plus 8-digit fixed or 9-digit mobile access code.
  - Detection of local-only Brazilian numbers that omit DDD as `attention`, not fully valid national numbers.
  - Detection of common Brazilian dialing prefixes such as leading `0`, `00`, CSP, and collect-call prefixes as dialing notation, with a warning that they are not part of the normalized contact number.
  - Basic recognition of Brazilian public utility short codes and non-geographic prefixes as special-service numbers, without presenting them as ordinary personal/contact phone numbers.
  - Copy formatted national number, copy E.164 when possible, copy digits-only value, copy validation summary, clear input, and settings-only default share.
- Out of scope:
  - Carrier lookup, portability lookup, line ownership, subscriber identity, CPF/account association, address lookup, WhatsApp/account existence, spam-risk scoring, fraud detection, caller ID reputation, CNAM, reverse lookup, reachability/dial test, SMS verification, OTP sending, bulk CSV validation, API endpoint, or server-side validation.
  - Maintaining a full global phone-number metadata database in v1.
  - Confirming that a DDD/city mapping is current unless the implementation uses a reviewed official Anatel PGCN source.
  - Producing `wa.me` links or WhatsApp deep links; that belongs to a future generator/link tool.
  - Saving contact lists, favorites, account data, or validation history.
- Sensitive-topic caveats:
  - Phone numbers can be personal data. Default live URLs, default share URLs, analytics payloads, storage, logs, and favorites must not include the typed number.
  - A syntactically plausible number does not prove that the line exists, is active, is assigned, belongs to a person, receives calls/SMS, or can be used for WhatsApp.
  - Telecom numbering rules can change. Keep copy explicit that the tool is an offline format validator and source-backed numbering-shape checker, not an Anatel/nSAPN live query.

## Tool Contract

- Inputs:
  - `telefone`: single free-form text input held in client state only.
  - `pais`: visible mode or internal setting. Default `br`; optional `internacional` for E.164 structural validation.
  - `saida`: output format setting. Default `formatado`; optional `e164` and `digitos` when those outputs are available.
  - `conteudo`: optional fragment-only explicit share flag if product chooses to allow content-bearing share links.
- Defaults:
  - Empty phone input.
  - `pais=br`.
  - `saida=formatado`.
  - No query params when defaults are selected.
  - Content-bearing share disabled.
- Validation rules:
  - Trim leading/trailing ASCII whitespace for validation and add a warning if trimming changed the input.
  - Reject letters, emoji, URL characters, `@`, `<`, `>`, and unsupported punctuation. Detect extension markers such as `ramal`, `ext`, or `x123` as `attention`/unsupported extension; do not include extensions in E.164 output.
  - Normalize accepted separators without changing the live input: spaces, non-breaking spaces, parentheses, hyphen, en dash, em dash, dot, slash only if intentionally accepted, and a single leading `+`.
  - Reject more than one `+`, `+` not at the start, and any non-ASCII digit unless the creator intentionally implements digit-script normalization with tests.
  - Brazil mode:
    - Accept a normalized Brazilian national significant number of 10 digits as fixed/STFC or SCM-like shape: 2-digit `Código Nacional` followed by an 8-digit access code whose first local digit is `2` through `6`, based on Anatel Resolução 749/2022.
    - Accept a normalized Brazilian national significant number of 11 digits as mobile/SMP-like shape: 2-digit `Código Nacional` followed by a 9-digit access code whose first local digit is `7`, `8`, or `9`, based on Anatel Resolução 749/2022. Copy should note this is a mobile numbering-shape check, not line activation.
    - Recognize `+55` followed by 10 or 11 Brazilian national digits and produce E.164 output.
    - Recognize `55` without `+` followed by 10 or 11 Brazilian national digits as `attention`: likely country code typed without plus; offer normalized `+55...`.
    - Recognize local-only 8- or 9-digit numbers without DDD as `attention`: local shape may be plausible, but a full national contact number needs DDD.
    - Recognize leading `0` national dialing notation with DDD, and optionally `0` + 2-digit CSP + DDD, as `attention` or `validWithDialingPrefix`; strip the dialing prefix for normalized contact outputs.
    - Recognize `00` international dialing notation as a dialing prefix, not E.164. Prefer `+` for normalized international output.
    - Recognize Brazilian public utility short codes in the `1NN` family as `special`, not ordinary contact numbers.
    - Recognize non-geographic service numbers in common marked forms such as `0300`, `0303`, `0500`, `0800`, and `0900` followed by the expected remaining digits as `special` or `attention`, and do not produce personal-contact copy.
    - Use a fixed reviewed `VALID_BRAZIL_DDDS` allowlist only if the creator rechecks a current official Anatel PGCN source during implementation. If the source cannot be reliably extracted, make DDD validation an `attention` note instead of rejecting by DDD.
  - International mode:
    - Require `+` for `valid` E.164 output; digits without `+` should be `attention`.
    - Accept only `+` followed by digits with no trunk prefix, separators stripped for validation, and a maximum of 15 digits according to ITU-T E.164.
    - Use a practical minimum such as 8 digits for `validStructure` to avoid implying that very short strings are callable international numbers.
    - Do not claim country-specific validity without a metadata library or source table.
  - Invalid query or fragment params must fall back to defaults without crashing.
- Outputs:
  - Overall status: `empty`, `valid`, `attention`, `special`, or `invalid`.
  - Detected kind: `brFixed`, `brMobile`, `brLocalOnly`, `brSpecialUtility`, `brNonGeographic`, `internationalE164`, `dialingNotation`, or `unknown`.
  - Parsed pieces when available: country code, DDD/Código Nacional, local/access code, extension warning, dialing prefix warning.
  - Formatted national output such as `(11) 2345-6789` or `(11) 91234-5678`.
  - E.164 output such as `+5511912345678` when possible.
  - Digits-only national output when useful.
  - Diagnostics list with stable issue codes for tests/translations: input, country/DDD, length, local prefix, E.164, special service, normalization, and privacy.
  - Copyable normalized phone and copyable summary that never claims existence, assignment, or ownership.
- Result explanations:
  - Valid Brazil fixed/mobile copy should say the number has a plausible numbering format for Brazil and can be normalized, not that it exists or is active.
  - E.164 copy should say the number has a structurally valid international format, not that it is valid in the destination country.
  - Attention copy should explain omitted DDD, dialing prefixes, missing plus sign, local-only number, extension marker, or source-table limitation.
  - Special-service copy should explain that short/non-geographic numbers are not personal contact numbers and may have specific dialing/service rules.
- URL params:
  - Safe live query params: `pais` only when not default; `saida` only when not default.
  - Never write `telefone`, normalized digits, DDD, E.164 output, extension, or validation result to `window.location.search` during normal editing.
  - Content-bearing share links, if implemented, may include `#conteudo=1&telefone=...` only after explicit opt-in, with a clear privacy warning and a length budget such as 1,800 characters.
  - On initial load, read phone content only from hash when `conteudo=1` is present, then sanitize the address bar back to safe query params and clear the hash.
  - Remove hostile query/hash params such as `telefone`, `phone`, `celular`, `whatsapp`, `numero`, `q`, `conteudo`, and unknown params from the live URL unless the route is hydrating an explicit hash share.
- Share behavior:
  - Default share URL includes only the route and safe settings.
  - Explicit include-content sharing is optional. If included, it must be hash-only, opt-in, length-limited, and sanitized after hydration.
  - Share copy must warn that anyone with a content-bearing link can read the phone number.
- Save/favorites behavior:
  - No SaveButton and no favorites integration.
  - Do not store phone input, normalized output, validation result, or copied summary in localStorage, sessionStorage, IndexedDB, cookies, account data, API calls, server actions, analytics events, or logs.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/phone.ts` with validation result types, issue codes, default state, parser/normalizer helpers, search-param helpers, and optional fragment share helpers.
  - Implement deterministic helpers:
    - `normalizePhoneInput(input)` for trimming, separator removal, plus handling, unsupported character detection, and extension detection.
    - `parseBrazilPhone(input)` for `+55`, optional `55`, DDD, fixed/mobile access-code shape, local-only shape, dialing prefixes, public utility short codes, and non-geographic service numbers.
    - `parseInternationalE164(input)` for `+` and 15-digit maximum structural checks.
    - `formatBrazilPhone(parts)` and `formatE164(parts)` for display/copy outputs.
    - `buildPhoneValidatorSearchParams(state)` and `readPhoneValidatorSearchParams(params)` for safe settings only.
    - Optional `buildPhoneValidatorShareUrl(originPath, state, options)` using fragment-only explicit content sharing.
  - Return stable issue codes from logic; keep localized strings in messages.
  - Do not make network calls. Do not query Anatel, nSAPN, carrier APIs, WhatsApp, SMS gateways, contact databases, or server routes at runtime.
- Data tables or assumptions:
  - Brazil country code: `55`.
  - Brazil `Código Nacional`/DDD has 2 digits.
  - Brazil fixed/STFC/SCM-like user access code has 8 digits and first local digit `2` to `6`.
  - Brazil mobile/SMP-like user access code has 9 digits and first local digit `7`, `8`, or `9`.
  - Brazil public utility service codes are 3 numeric characters and generally in the `1NN` family; treat as special, not ordinary contact numbers.
  - Non-geographic Brazilian service numbers such as `0300`, `0303`, `0500`, `0800`, and `0900` are service numbers; treat as special/attention, not personal contact numbers.
  - E.164 structural output has a maximum of 15 digits after `+`.
  - If hardcoding a DDD allowlist, use only a current official Anatel PGCN source and record the exact source/version in implementation notes.
- Official or authoritative sources:
  - Anatel, "Numeração": https://www.gov.br/anatel/pt-br/regulado/numeracao. Accessed `2026-07-06 America/Sao_Paulo`; page says Anatel manages numbering plans and numbering resources for telecom services.
  - Anatel, Resolução nº 749, de 15 de março de 2022: https://informacoes.anatel.gov.br/legislacao/component/content/article/157-resolucoes/2022/1641-resolucao-749. Accessed `2026-07-06 America/Sao_Paulo`; current page last updated `2026-01-05`; source covers the Regulamento de Numeração dos Serviços de Telecomunicações, E.164 reference, Código Nacional format, 8- and 9-digit access-code destinations, dialing procedures, public utility codes, and Brazil country-code dialing from abroad.
  - Anatel, Ato nº 12712, de 04 de setembro de 2024: https://informacoes.anatel.gov.br/legislacao/atos-de-numeracao/2140-ato-12712. Accessed `2026-07-06 America/Sao_Paulo`; page last updated `2026-05-07`; source covers attribution/designation of numbering resources, nSAPN, code states, non-geographic/service numbering procedures, and current administrative context.
  - Anatel, Resolução nº 755, de 11 de outubro de 2022: https://informacoes.anatel.gov.br/legislacao/component/content/article/157-resolucoes/2022/1745-resolucao-755. Accessed `2026-07-06 America/Sao_Paulo`; page points to current PGCN publication material, including Despacho Decisório nº 17/2025/PRRE/SPR published `2025-11-13`, and defines Área de Numeração as a geographic area identified by a Código Nacional.
  - ITU-T Recommendation E.164, "The international public telecommunication numbering plan": https://www.itu.int/rec/T-REC-E.164/en. Accessed `2026-07-06 America/Sao_Paulo`; official recommendation page for international numbering and 15-digit E.164 maximum.
  - ITU-T Recommendation E.123, "Notation for national and international telephone numbers, e-mail addresses and web addresses": https://www.itu.int/rec/T-REC-E.123/en. Accessed `2026-07-06 America/Sao_Paulo`; use for display notation guidance such as `+` and spacing, not for country-specific validity.
  - Codebase inspection on `2026-07-06 America/Sao_Paulo`: current validator routes, registry entries, contact category, URL-state helpers, split messages, focused e2e specs, and prior tool plans.
- Source access dates:
  - All web sources above were checked on `2026-07-06 America/Sao_Paulo` (`2026-07-07 UTC`).
- Rule/table effective dates:
  - Resolução 749/2022 entered into force in 2022 and the Anatel source page was last updated on `2026-01-05`.
  - Ato 12712/2024 states the procedure takes effect from `2024-12-03`; source page last updated on `2026-05-07`.
  - PGCN reference on the Resolução 755/2022 source page points to Despacho Decisório nº 17/2025/PRRE/SPR, published `2025-11-13`; creator must recheck if using DDD allowlist data.
  - ITU-T E.164 is a stable recommendation page; creator should record the current recommendation version if implementation rechecks it.
- Freshness or maintenance risk:
  - Low for E.164 maximum length and `+` notation.
  - Moderate for Brazilian numbering categories, non-geographic/service-code treatment, DDD/PGCN data, and special codes because Anatel can update numbering resources.
  - Moderate product risk if users expect WhatsApp, ownership, reachability, carrier, or city lookup. Keep metadata and result copy explicit that this is offline validation.
  - Privacy risk is controlled only if the implementation never writes phone numbers to live query params, storage, server APIs, analytics, or favorites by default.
- Estimator or privacy limitations:
  - This is not an estimator, identity verifier, carrier lookup, spam checker, reachability checker, or legal/compliance tool.
  - The result cannot prove assignment, activation, ownership, consent to contact, WhatsApp availability, SMS deliverability, or call completion.
  - Browser-only processing reduces intentional server exposure, but user actions such as explicit content sharing, screenshots, copied output, browser extensions, or shared devices can still expose a phone number.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de Telefone`
  - PT-BR meta title: `Validador de telefone online gratis`
  - PT-BR description: `Valide e formate numeros de telefone no navegador, com modo Brasil e E.164, sem consultar operadora, WhatsApp ou salvar dados.`
  - EN title: `Phone Number Validator`
  - ES title: `Validador de Teléfono`
- Main form sections:
  - Single phone input with `inputMode="tel"` and `autoComplete="off"` to avoid contact autofill.
  - Mode control for `Brasil` and `Internacional/E.164`.
  - Output format segmented control for formatted, E.164, and digits-only when relevant.
  - Result area with status, parsed pieces, normalized outputs, copy actions, and diagnostics.
  - Privacy/share area with safe default sharing and optional explicit content-share control if implemented.
  - Source/scope note explaining local validation and no operator/WhatsApp lookup.
- Results sections:
  - Empty state before input.
  - Valid Brazil fixed/mobile result with formatted national and E.164 output.
  - Valid E.164 structural result for international mode.
  - Attention result for missing DDD, `55` without `+`, dialing prefixes, extension markers, local-only input, and unsupported DDD-table certainty.
  - Special result for public utility and non-geographic numbers.
  - Invalid result with primary issue and diagnostic checklist.
  - Long outputs must wrap on mobile without horizontal overflow.
- SEO sections:
  - What a phone validator checks.
  - Difference between formatting, E.164 structure, DDD, and line existence.
  - Brazilian phone formats: fixed, mobile, DDD, `+55`, and dialing prefixes.
  - Why WhatsApp, carrier, owner, spam, and activation checks are out of scope.
  - Privacy note for pasted phone numbers.
- FAQ topics:
  - `O telefone e enviado para o servidor?`
  - `Este validador confirma se a linha existe?`
  - `O validador verifica WhatsApp ou operadora?`
  - `Qual a diferenca entre DDD, +55 e E.164?`
  - `Por que um numero sem DDD aparece com aviso?`
  - `Posso validar ramal ou telefone 0800?`
  - `Posso compartilhar um link com o telefone preenchido?`
- Disclaimer or privacy copy:
  - The tool validates and formats numbering structure in the browser.
  - It does not query Anatel, nSAPN, telecom carriers, WhatsApp, SMS providers, reverse-lookup databases, or any server API.
  - A valid-looking phone number does not prove the line exists, is active, belongs to someone, or can receive calls/messages.
  - Do not include a phone number in a shared link unless everyone with the link may see it.
- Related tool links:
  - Existing: `/validadores/validador-email`, `/validadores/formatador-cpf-cnpj`, `/validadores/cpf`, `/validadores/cnpj`, `/dev/regex-tester`, `/texto/contador-caracteres`.
  - Future candidates: `/validadores/validador-cep`, `/geradores/link-whatsapp`, `/geradores/qr-code`, `/validadores/uuid-validator`, and any future contact-list cleaner only if scoped separately.
- Translation guidance:
  - Add `messages/pt-br/tools/validador-telefone.json`, `messages/en/tools/validador-telefone.json`, and `messages/es/tools/validador-telefone.json` using the current split-message pattern.
  - Add catalog/tool-card keys in `messages/*/catalog/tools.json` if required by the current registry/message pattern.
  - Reuse existing `toolCategories.contato` copy unless implementation discovers missing catalog keys; it already mentions phone numbers in PT-BR, EN, and ES.
  - `pt-br`: use `telefone`, `celular`, `DDD`, `Código Nacional`, `+55`, `formato E.164`, `nao confirma existencia da linha`.
  - `en`: use `phone number`, `area code`, `Brazil country code +55`, `E.164 format`, `does not confirm the line exists`.
  - `es`: use `telefono`, `celular/movil` where natural, `codigo de area`, `codigo de pais +55`, `formato E.164`, `no confirma que la linea exista`.
  - Keep `E.164`, `Anatel`, `nSAPN`, `DDD`, `SMP`, and `STFC` as source/standards terms with short explanations rather than over-translating.
  - Keep route slug `/validadores/validador-telefone` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Add `lib/tools/phone.ts` with pure validation helpers, stable issue codes, parsed-parts types, default state, formatting helpers, safe search/share helpers, and no runtime network/API calls.
  - Add `lib/tools/phone.test.ts` with deterministic coverage for Brazil fixed/mobile, `+55`, E.164, local-only, dialing prefixes, unsupported characters, special-service numbers, URL state, and privacy helpers.
  - If adding a DDD allowlist, recheck current official Anatel PGCN material first and document the exact source/date in implementation notes.
- URL state:
  - Use `components/tools/url-state.ts`.
  - Sync only safe settings such as `pais` and `saida`.
  - Never write phone input or normalized outputs to live query params.
  - Sanitize hostile query/hash params on mount.
  - Implement explicit hash-only content share only if the UI includes a clear opt-in and hydration cleanup.
- UI components:
  - Add `components/tools/validators/phone-validator-client.tsx`.
  - Use existing form/card/button patterns, `ShareButton`, and lucide icons such as `Phone`, `BadgeCheck`, `AlertTriangle`, `Copy`, `Trash2`, and `Info` where available.
  - Use `inputMode="tel"` and `autoComplete="off"`; avoid `name="phone"`, `tel`, `mobile`, or other autocomplete hints that encourage browser contact autofill.
  - Add stable test ids for input, mode control, output format control, result status, formatted output, E.164 output, diagnostics, copy buttons, clear button, include-content control if present, share button, privacy text, and related links.
  - Keep the experience dense and tool-first; do not create a marketing hero.
  - Ensure long phone strings, source labels, and warnings wrap cleanly on mobile.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-telefone/page.tsx`.
  - Use `ToolPageLayout` and `generateToolPageMetadata(locale, "validador-telefone")`.
- Registry/family/category:
  - Reuse existing family `validadores`.
  - Reuse existing category `contato`.
  - Import `Phone` from `lucide-react` in `lib/constants.ts` if used.
  - Add a `tools` entry:
    - `id: "validador-telefone"`
    - `title: "Validador de Telefone"`
    - `description: "Valide e formate telefones no navegador, sem consulta a operadora ou WhatsApp."`
    - `href: "/validadores/validador-telefone"`
    - `familyId: "validadores"`
    - `primaryCategoryId: "contato"`
    - `categoryIds: ["contato"]`
    - `available: true`
    - `sitemapPriority` around `0.74`
    - `stateMode: "query"`
    - `seoApplicationCategory: "UtilityApplication"`
- Messages:
  - Add PT-BR, EN, and ES tool message files with metadata, labels, actions, status text, issue-code text, diagnostics, privacy/share warnings, source/scope copy, SEO sections, FAQ, and related links.
  - Update catalog/directory messages only where required by current message validation.
  - Avoid copy that implies line existence, WhatsApp availability, carrier lookup, spam reputation, or owner identity.
- Unit tests:
  - Cover Brazil fixed examples such as `(11) 2345-6789`.
  - Cover Brazil mobile examples such as `(11) 91234-5678` and `+55 11 91234-5678`.
  - Cover `55` without plus, local-only 8/9 digits, leading `0` dialing notation, and optional CSP prefix.
  - Cover E.164 valid/invalid structural cases, including 15-digit maximum and misplaced plus signs.
  - Cover unsupported letters, emoji, multiple plus signs, extensions/ramal, empty input, too short, too long, and non-ASCII digits.
  - Cover public utility and non-geographic service-number classification if implemented.
  - Cover search/share helpers proving live params never include phone content and explicit content share is hash-only.
  - Cover constants/registry tests for the new tool entry.
- E2E hooks/tests:
  - Add `tests/e2e/phone-validator.spec.ts`.
  - Cover route load, PT-BR default, valid Brazil fixed, valid Brazil mobile, invalid characters/length, local-only attention, E.164 international mode, safe live URL, default share without phone, explicit hash share if implemented, hash hydration/sanitization, clear action, copy actions, EN/ES smoke, discovery/category/sitemap, and mobile no-overflow.
- Backlog updates:
  - Planner does not update the local Postgres DB, app code, tests, messages, constants, or archived markdown backlog files.
  - Orchestrator should mark the claimed DB row planned after accepting this plan.

## Test Plan

- Unit scenarios:
  - `11912345678` and `(11) 91234-5678` classify as Brazilian mobile shape.
  - `1123456789` and `(11) 2345-6789` classify as Brazilian fixed/STFC/SCM-like shape.
  - `+5511912345678` outputs E.164 and formatted BR output.
  - `5511912345678` warns about missing `+` and offers `+5511912345678`.
  - `91234-5678` warns that DDD is missing.
  - `0 11 91234-5678` and `0 15 11 91234-5678` strip dialing prefixes only for normalized contact output.
  - `+1234567890123456` fails E.164 maximum length.
  - `+55 (11) 91234-5678 ramal 123` warns that extension is unsupported for E.164 output.
  - `0800...`, `0303...`, and `190` classify as special/attention if service-number support is implemented.
  - Hostile query params and hash content do not hydrate phone input unless explicit `#conteudo=1` support is enabled.
- URL-state scenarios:
  - Empty route loads defaults with no query.
  - Changing mode/output syncs only safe params.
  - Typing a phone number never changes the URL to include the phone, DDD, digits, or E.164 output.
  - Loading `/validadores/validador-telefone?telefone=11912345678&phone=...#conteudo=1&telefone=...` sanitizes the URL and follows the explicit-fragment rule if implemented.
  - Default share URL omits phone content.
  - Explicit content share, if present, uses hash-only content, respects the length limit, hydrates once, and clears hash.
- Browser scenarios:
  - Desktop and mobile route renders with no console/page errors.
  - Result updates immediately while typing and remains accessible to screen readers.
  - Copy formatted/copy E.164/copy summary actions work or show graceful fallback.
  - No phone content appears in request URLs, analytics payloads, local/session storage, IndexedDB, cookies, favorites API calls, or default share URL.
  - Long pasted strings and long diagnostics do not cause horizontal scroll on mobile.
  - EN and ES routes render translated metadata, labels, status text, and privacy copy.
- Playwright scenarios:
  - Navigate to `/validadores/validador-telefone`.
  - Assert breadcrumb/family/category links.
  - Validate a Brazil mobile number and assert formatted and E.164 outputs.
  - Validate a Brazil fixed number and assert fixed-line diagnostics.
  - Validate malformed input such as `abc`, `+55+11`, too-short, too-long, and extension marker.
  - Assert live URL remains content-free after typing.
  - Assert default share URL contains no phone digits.
  - If include-content is implemented, assert generated URL uses fragment, hydrates, and sanitizes.
  - Check EN/ES route smoke.
  - Check `/validadores`, `/validadores/categorias/contato`, and `sitemap.xml` expose the route.
  - Check a 390px mobile viewport for no horizontal overflow.
- Lint/build commands:
  - `pnpm test -- lib/tools/phone.test.ts lib/constants.test.ts`
  - `pnpm run validate:messages`
  - `pnpm lint`
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build`
  - `PORT=<free-port> pnpm run test:e2e -- tests/e2e/phone-validator.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - `/validadores/validador-telefone` exists in all supported locales through the App Router locale segment.
  - The tool validates one phone number locally with Brazil-first and E.164 structural behavior.
  - The UI clearly says it does not verify carrier, owner, line existence, activation, reachability, SMS delivery, WhatsApp, spam reputation, or consent.
  - Default URL/share behavior never includes the typed phone number.
  - Optional content sharing, if implemented, is explicit, hash-only, length-limited, and sanitized after hydration.
  - No SaveButton/favorites/storage/server/API/analytics path receives phone content.
  - PT-BR, EN, and ES messages are complete and pass message validation.
  - Unit, URL-state, browser/e2e, lint, build, and whitespace checks pass.

## Implementation Notes

- Status updates:
  - 2026-07-06: Planner created this plan only. Decision `new`; status `planned`; existing `validadores` family and existing `contato` category. No app code, tests, messages, constants, DB rows, or archived backlog markdown files were edited.
  - 2026-07-06: Creator implemented the browser-only phone validator for `/validadores/validador-telefone`. Plan status is now `in_progress`; local DB row was confirmed as `In Progress` / `implementation` before app edits and was left unchanged. No archived backlog snapshots were touched and the DB was not marked `Done`.
  - 2026-07-06: Review-fix handoff addressed accepted reviewer findings only. The DB row remains `In Progress` with stage `review`; no Done/verified status was set.
  - 2026-07-06: Independent tester validation passed after review gate. Plan status is now `verified`; DB row was read as `In Progress` / `testing` and was not edited by the tester.
  - 2026-07-06: Draft PR created at https://github.com/saulodefaria/calculaderia/pull/56 on branch `codex/validador-telefone-tool`. Orchestrator finalization records this PR URL in the local backlog DB.
- Files changed:
  - `docs/tool-plans/validador-telefone.md`
  - `lib/tools/phone.ts`
  - `lib/tools/phone.test.ts`
  - `components/tools/validators/phone-validator-client.tsx`
  - `app/[locale]/validadores/validador-telefone/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br/tools/validador-telefone.json`
  - `messages/en/tools/validador-telefone.json`
  - `messages/es/tools/validador-telefone.json`
  - `messages/pt-br/catalog/tools.json`
  - `messages/en/catalog/tools.json`
  - `messages/es/catalog/tools.json`
  - `tests/e2e/phone-validator.spec.ts`
- PR-review findings addressed:
  - `blocking(phone)`: `lib/tools/phone.ts` now recognizes Brazilian collect-call dialing notation before national length validation for `90 + DDD + number` and `90 + CSP + DDD + number`, returning `attention` / `dialingNotation` with normalized contact outputs such as `+5511912345678`.
  - `test-gap(phone)`: `lib/tools/phone.test.ts` covers both collect-call forms, and `tests/e2e/phone-validator.spec.ts` now covers fixed-line output plus collect-call dialing notation in the browser.
  - `test-gap(privacy)`: the primary Playwright privacy flow now asserts typed phone content and normalized outputs do not appear in request URLs, `localStorage`, `sessionStorage`, cookies, or IndexedDB metadata.
- Validation results:
  - Review-fix `corepack pnpm test -- lib/tools/phone.test.ts lib/constants.test.ts` passed: 67 files, 780 tests.
  - Review-fix `corepack pnpm lint` passed.
  - Review-fix `corepack pnpm run validate:messages` was not run because messages were not changed in this handoff.
  - Review-fix sandboxed `CI=true PORT=3225 corepack pnpm run test:e2e -- tests/e2e/phone-validator.spec.ts --project=chromium` reached browser launch but failed before assertions with the known macOS Chromium `MachPortRendezvousServer` sandbox permission error.
  - Review-fix elevated `CI=true PORT=3226 corepack pnpm run test:e2e -- tests/e2e/phone-validator.spec.ts --project=chromium` passed: 7/7 Chromium tests.
  - Review-fix `git diff --check` passed.
  - Review-fix DB status/stage was taken from the orchestrator handoff as `In Progress` / `review`; the DB was not edited and the item was not marked Done.
  - `git diff --check --no-index /dev/null docs/tool-plans/validador-telefone.md` produced no whitespace warnings. Exit code `1` is expected for a new-file diff against `/dev/null`.
  - Earlier creator DB check `psql postgresql://postgres:postgres@localhost:5438/calculaderia -Atc "select status, stage, slug, target_route, plan_path from agent_backlog.items where kind='tool' and slug='validador-telefone';"` returned `In Progress|implementation|validador-telefone|/validadores/validador-telefone|docs/tool-plans/validador-telefone.md`.
  - `pnpm test -- lib/tools/phone.test.ts lib/constants.test.ts` did not reach Vitest because pnpm aborted on the non-TTY modules purge prompt.
  - `CI=true pnpm test -- lib/tools/phone.test.ts lib/constants.test.ts` recreated dependencies but did not reach Vitest because pnpm stopped on the ignored-builds approval gate.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/phone.test.ts lib/constants.test.ts --reporter=dot` passed: 2 files, 17 tests.
  - `pnpm run validate:messages` did not reach the validator because pnpm stopped on the ignored-builds approval gate.
  - `node scripts/validate-messages.mjs` passed.
  - `./node_modules/.bin/eslint` passed.
  - `CI=true PORT=3223 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3223' ./node_modules/.bin/playwright test tests/e2e/phone-validator.spec.ts --project=chromium` reached browser launch but failed before assertions with the known macOS Chromium `MachPortRendezvousServer` sandbox permission error.
  - Elevated `CI=true PORT=3224 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3224' ./node_modules/.bin/playwright test tests/e2e/phone-validator.spec.ts --project=chromium` passed: 6/6 Chromium tests.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/next build` first failed because the recreated install had skipped Prisma Client generation.
  - Sandboxed `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` failed with Prisma cache `EPERM`; elevated rerun passed.
  - After elevated Prisma generation, `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/next build` passed.
  - `git diff --check` passed.
  - Tester DB read `psql postgresql://postgres:postgres@localhost:5438/calculaderia -v kind=tool -v slug=validador-telefone -f scripts/backlog/get_item.sql` passed and returned `status=In Progress`, `stage=testing`, `targetRoute=/validadores/validador-telefone`, and `planPath=docs/tool-plans/validador-telefone.md`.
  - Tester `CI=true PORT=3230 pnpm run test:e2e -- tests/e2e/phone-validator.spec.ts --project=chromium` did not reach Playwright because pnpm stopped on the ignored-builds gate.
  - Tester `CI=true PORT=3230 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3230' ./node_modules/.bin/playwright test tests/e2e/phone-validator.spec.ts --project=chromium` reached browser launch but failed before assertions with the known macOS Chromium `MachPortRendezvousServer` sandbox permission error.
  - Tester elevated `CI=true PORT=3231 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3231' ./node_modules/.bin/playwright test tests/e2e/phone-validator.spec.ts --project=chromium` passed: 7/7 Chromium tests.
  - Tester `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/phone.test.ts lib/constants.test.ts --reporter=dot` passed: 2 files, 17 tests.
  - Tester `node scripts/validate-messages.mjs` passed.
  - Tester `./node_modules/.bin/eslint` passed.
  - Tester `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/next build` passed; warnings were limited to existing `metadataBase` and edge-runtime/static-generation notices.
  - Tester `git diff --check` passed.
  - Tester live browser validation used `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3232 NEXTAUTH_URL=http://localhost:3232 WATCHPACK_POLLING=true NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname localhost --port 3232`, then stopped the server after validation.
  - Tester in-app/Node browser launch hit the same macOS `MachPortRendezvousServer` permission error, so the live browser sweep was rerun as an elevated one-off Playwright script against the dev server and passed.
  - Tester browser coverage passed for route load with no redirect, `inputMode="tel"`, `autoComplete="off"`, no tool-level SaveButton/favorites control, Brazil mobile/fixed/`+55`, local-only missing DDD, dialing-prefix and collect-call notation, special utility and non-geographic numbers, invalid characters, extension warning, international/E.164 mode and missing-plus attention, safe live URL/default share, explicit opt-in hash-only share, too-long content omission, hydration sanitization, request/storage/cookie/API privacy during normal typing/share, EN/ES smoke, mobile no horizontal overflow, and no console/page/request errors.
  - Tester screenshots captured for reference: `/private/tmp/validador-telefone-tester-desktop.png` and `/private/tmp/validador-telefone-tester-mobile.png`.
- Tester findings:
  - Passed independent tester validation. Existing `tests/e2e/phone-validator.spec.ts` already covered the required focused browser cases after review fixes, so no e2e edits were needed.
  - Privacy validation passed for normal typing/share: live query/default share omit phone content; explicit content share is opt-in, hash-only, length-limited, and sanitized after hydration; no phone content was found in request URLs or bodies, local/session storage, cookies, IndexedDB metadata, favorites API calls, or tool-level save/favorites controls.
  - Browser validation passed for PT-BR primary flow, EN/ES smoke, and 390px mobile no-overflow with no console/page/request errors.
- Final status:
  - Verified by tester at `/validadores/validador-telefone`. Draft PR: https://github.com/saulodefaria/calculaderia/pull/56. Orchestrator moved the DB item to `In Progress` with stage `verified` after tester validation passed, then finalizes the claimed row as `Done` / `pr` with the draft PR URL and done ref.
