---
slug: "conversor-base64"
familyId: "dev"
primaryCategoryId: "codificacao"
backlogRank: 4
primaryKeyword: "conversor base64"
decision: "new"
targetRoute: "/dev/conversor-base64"
status: "verified"
createdAt: "2026-06-20"
updatedAt: "2026-06-20"
---

# Conversor Base64 Plan

## Backlog Row

- Rank: 4
- Original status: Backlog
- Slug: `conversor-base64`
- Primary keyword: `conversor base64`
- Cluster keywords: `base64 decode`; `base64 encode`; `decodificar base64`
- Family/category: backlog family `dev`; planned family `dev`; planned category `codificacao`
- Opportunity score: 84
- Idea type: New
- Notes: Lightweight encoder/decoder; keep all processing client-side.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/dev/conversor-base64`
- Rationale: Rank 4 is the highest-ranked eligible non-calculator `New` row after Rank 1 `qr-code`, Rank 2 `contador-caracteres`, and Rank 3 `formatador-json` were completed. The repo now has a `dev` family and `/dev/formatador-json`, but no Base64 route, helper, UI, messages, tests, or prior plan. Build this as a new browser-only developer utility.

## Similarity Check

- Existing routes checked:
  - Current generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current family routes: `geradores`, `validadores`, `matematica`, `datas`, `texto`, and `dev`.
  - Current dev routes: `app/[locale]/dev/page.tsx` and `app/[locale]/dev/formatador-json/page.tsx`.
  - No `/dev/conversor-base64` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `dev`.
  - `lib/constants.ts` already defines dev category `dados-estruturados`, currently used by `formatador-json`.
  - Base64 is an encoding/decoding utility rather than structured-data formatting. Add a new dev category such as `codificacao` instead of overloading `dados-estruturados`.
- Related modules/translations checked:
  - `lib/tools` contains existing helpers for generators, dates, documents, JSON, math, QR code, and text. No Base64 helper exists.
  - `components/tools/dev/json-formatter-client.tsx` is the closest UI/privacy pattern for a developer text tool.
  - `components/tools/url-state.ts` provides generic search-param/share helpers, but Base64 should likely follow the JSON formatter's hash-fragment content sharing pattern.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` already have `toolFamilies.dev`, `toolCategories.dados-estruturados`, and `tools.formatador-json`, but no Base64 keys.
- Prior plans checked:
  - `docs/tool-plans/qr-code.md`, `docs/tool-plans/contador-caracteres.md`, and `docs/tool-plans/formatador-json.md`.
  - No duplicate Base64 plan exists.
- Text search checked:
  - `conversor-base64`, `base64`, `Base64`, `base 64`, `base64 decode`, `base64 encode`, `codificador`, and `decodificador`.
- Overlap conclusion:
  - Build a new tool.
  - Keep Rank 18 `jwt-decoder` separate because JWT needs token-part parsing and signature caveats, though it can later link to this tool.
  - Keep Rank 14 `url-encode-decode` and Rank 47 `html-entities` separate because they use different encoding rules.
  - Keep Rank 67 `imagem-base64` separate because it needs file handling, size warnings, and data URI output.

## User Intent And Scope

- Target user: Developers, QA analysts, support teams, students, API users, and technical writers who need to encode text to Base64 or decode Base64 back to readable UTF-8 text without uploading payloads.
- User job: Paste text or a Base64 string, choose encode or decode, get an immediate result, understand errors, copy the output, and optionally share only safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only text-to-Base64 encoding using UTF-8 bytes.
  - Browser-only Base64-to-text decoding with strict malformed-input handling.
  - Standard Base64 and Base64URL alphabets.
  - Optional padding control for encoded output.
  - Decode normalization for copied strings with surrounding whitespace and line breaks.
  - Metrics for input/output characters and UTF-8 bytes.
  - Clear, copy, swap input/output, and download `.txt` actions.
  - Privacy-aware sharing that keeps pasted content out of the live query string.
- Out of scope:
  - File upload/download conversion, images to data URI, streaming large files, cryptographic signing, encryption, compression, JWT parsing, URL encoding, HTML entity conversion, hash generation, server-side conversion, saved history, and account favorites.
  - Claims that Base64 is encryption or protection.
- Sensitive-topic caveats:
  - Treat pasted content as potentially containing API tokens, credentials, customer data, or secrets.
  - State that Base64 is reversible encoding, not encryption.
  - Shared links with included content expose the decoded or encoded text to anyone who receives the URL.

## Tool Contract

- Inputs:
  - `entrada`: raw user text in a textarea. In encode mode this is normal text. In decode mode this is Base64/Base64URL text.
  - `modo`: `codificar` or `decodificar`; default `codificar`.
  - `alfabeto`: `base64` or `base64url`; default `base64` for encode mode. Decode mode may offer `auto` in the UI, but the helper should normalize to a detected alphabet before decoding.
  - `padding`: `1` or `0`; default `1`. Applies to encode output. For decode, accept missing padding when length can be repaired, and report that padding was inferred if useful.
  - `ignorarEspacos`: `1` or `0`; default `1`. Applies to decode. When enabled, remove ASCII whitespace and line breaks before validation. When disabled, whitespace is invalid.
  - `conteudo`: optional explicit fragment/hash flag (`1`) that allows `entrada` to be loaded from and included in generated share links.
- Defaults:
  - `entrada` empty.
  - `modo=codificar`.
  - `alfabeto=base64`.
  - `padding=1`.
  - `ignorarEspacos=1`.
  - `conteudo` absent, so default live URLs and default share URLs omit pasted content.
- Validation rules:
  - Empty input should show a neutral "paste text or Base64" state, not an error.
  - Enforce a practical input guardrail such as 1,000,000 characters to avoid browser freezes.
  - Invalid query or fragment params must fall back to defaults without crashing.
  - Encode mode must accept any JavaScript string and convert it to UTF-8 bytes with `TextEncoder` before Base64 encoding.
  - Encode mode must not pass arbitrary Unicode text directly to `btoa`, because browser `btoa` accepts only byte-like code points in the U+0000 to U+00FF range.
  - Standard Base64 output uses alphabet `A-Z`, `a-z`, `0-9`, `+`, `/`, with `=` padding when enabled.
  - Base64URL output uses `-` and `_` instead of `+` and `/`, and may omit padding when `padding=0`.
  - Decode mode must reject characters outside the selected alphabet after optional whitespace removal.
  - Decode mode must reject mixed standard and URL-safe symbols in the same string unless the input contains only the shared alphanumeric/padding subset.
  - Decode mode must reject padding in the middle, more than two padding characters, and normalized lengths where `length % 4 === 1`.
  - Decode mode may infer missing padding when `length % 4` is `2` or `3`.
  - Decode mode must decode to bytes first, then decode bytes as UTF-8 using `TextDecoder("utf-8", { fatal: true })`.
  - If Base64 is syntactically valid but bytes are not valid UTF-8, return a distinct `invalidUtf8` error instead of replacing characters silently.
- Outputs:
  - `status`: `empty`, `valid`, `invalidBase64`, `invalidUtf8`, or `tooLarge`.
  - `output`: encoded or decoded text when valid.
  - `normalizedInput`: decode-mode input after whitespace removal and padding repair, for diagnostics only.
  - `alphabetUsed`: `base64` or `base64url`.
  - `inputMetrics`: input characters and UTF-8 byte count.
  - `outputMetrics`: output characters and UTF-8 byte count when valid.
  - `warnings`: optional flags such as `whitespaceIgnored`, `paddingInferred`, or `paddingOmitted`.
  - `error`: stable app-owned error code plus localized explanation, not raw browser exception text as the primary message.
- Result explanations:
  - Explain that encode mode uses UTF-8, so accents and emoji are supported.
  - Explain that decode mode expects the decoded bytes to be valid UTF-8 text. Binary data may be valid Base64 but not displayable as text in this first build.
  - Explain the difference between Base64 and Base64URL.
  - Explain that padding (`=`) can be required by some systems, while URL-safe strings often omit it.
  - Explain that Base64 is reversible and does not hide secrets.
- URL params:
  - Safe params synced automatically in `window.location.search`: `modo`, `alfabeto`, `padding`, and `ignorarEspacos`.
  - Explicit content params must live only in the URL fragment/hash: `#conteudo=1&entrada=...`.
  - Read `entrada` only from the fragment/hash when `conteudo=1`.
  - Generate `entrada` only inside the explicit share callback when the include-content control is enabled.
  - After loading a content-bearing fragment URL, prefill the textarea client-side and sanitize the live address bar back to safe query params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Provide an explicit "include input in shared link" checkbox or equivalent confirmation.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a fragment length budget such as 1,800 characters. If content is too large, omit `entrada` from the share URL and show a warning.
  - Warn that anyone with a content-bearing link can read or decode the payload.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input/output in localStorage, sessionStorage, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/base64.ts` with state, result, metrics, validation, byte conversion, URL-state, and share-fragment helpers.
  - Use `TextEncoder` to convert encode-mode text into UTF-8 bytes.
  - Convert bytes to Base64 in browser-safe chunks to avoid call-stack issues on large arrays. A custom byte-array encoder is acceptable if it follows RFC 4648 alphabets and padding exactly.
  - For decode, normalize according to selected alphabet, optional whitespace handling, and padding repair.
  - Decode Base64 to bytes, then use `TextDecoder("utf-8", { fatal: true })` to produce text or return `invalidUtf8`.
  - Keep all transformation logic deterministic and independent from React so it can be unit-tested directly.
- Malformed input handling:
  - `empty`: input length is zero or decode input is only whitespace after normalization.
  - `invalidCharacter`: characters outside the active alphabet.
  - `mixedAlphabet`: input combines standard-only symbols (`+`, `/`) with URL-safe-only symbols (`-`, `_`).
  - `invalidPadding`: padding appears before the end, there are more than two `=`, or padding conflicts with the normalized length.
  - `invalidLength`: normalized length modulo 4 is 1.
  - `decodeFailed`: browser/custom decoder reports invalid Base64 after prior validation.
  - `invalidUtf8`: Base64 bytes decode successfully but cannot be decoded as UTF-8 text.
  - `inputTooLarge`: input exceeds the configured client-side cap.
- Unicode handling:
  - Encode text as UTF-8 bytes before Base64. Example unit cases should include `Ola`, `Ola mundo`, `Ola com acento` using an accented sample, and emoji/combining marks.
  - Decode Base64 bytes as UTF-8 with fatal error handling. Do not silently replace malformed bytes with U+FFFD.
  - Count output characters with `Array.from` or a shared grapheme helper only for metrics; Base64 logic itself should operate on bytes.
- Data tables or assumptions:
  - No external data tables are required.
  - The tool targets textual UTF-8 payloads, not arbitrary binary file conversion.
  - The first build may display a concise binary limitation note rather than a hex viewer.
- Official or authoritative sources:
  - RFC 4648, "The Base16, Base32, and Base64 Data Encodings", published October 2006: https://www.rfc-editor.org/rfc/rfc4648
  - WHATWG HTML Standard, Base64 utility methods `atob()` and `btoa()`: https://html.spec.whatwg.org/multipage/webappapis.html#base64-utility-methods
  - WHATWG Encoding Standard, `TextEncoder` and `TextDecoder`: https://encoding.spec.whatwg.org/
  - Codebase source checked on 2026-06-20: current tool layout, registry, URL helper, routes, messages, and prior plans.
- Source access dates:
  - RFC 4648 checked on 2026-06-20.
  - WHATWG HTML Standard checked on 2026-06-20.
  - WHATWG Encoding Standard checked on 2026-06-20.
  - Codebase checked on 2026-06-20.
- Rule/table effective dates:
  - RFC 4648 was published in October 2006 and defines the standard Base64 and Base64URL alphabets.
  - WHATWG HTML and Encoding are living standards; record access date in implementation comments only if behavior changes materially.
- Freshness or maintenance risk:
  - Low for Base64 alphabets and padding rules.
  - Low for `TextEncoder`/`TextDecoder` availability in supported modern browsers.
  - Moderate for relying directly on `atob`/`btoa` quirks, so prefer explicit validation and UTF-8 byte handling.
  - Moderate performance risk for very large pasted strings; keep the size cap and chunk byte conversions.
- Estimator or privacy limitations:
  - Base64 conversion is exact, not an estimate.
  - The tool does not encrypt, redact, inspect secrets, validate API schemas, or certify payload safety.
  - Browser-only processing reduces server exposure, but clipboard data, shared links, screenshots, downloads, and browser extensions can still expose content.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Conversor Base64`
  - PT-BR meta title: `Conversor Base64 online gratis`
  - PT-BR description: `Codifique e decodifique Base64 no navegador, com suporte a UTF-8, Base64URL e avisos de privacidade.`
- Main form sections:
  - Input textarea with browser-only privacy note.
  - Operation segmented control: `Codificar` and `Decodificar`.
  - Alphabet segmented control: `Base64` and `Base64URL`; decode UI may include `Auto` if the helper supports it cleanly.
  - Padding toggle for encode output.
  - Ignore whitespace toggle for decode input.
  - Share/privacy section with default safe link and explicit include-content option.
- Results sections:
  - Output textarea/code area with copy and download actions.
  - Status block for valid, invalid Base64, invalid UTF-8, too large, and empty states.
  - Warning chips for whitespace ignored, padding inferred, or padding omitted.
  - Metrics for input/output characters and bytes.
  - Actions: copy output, clear input, swap output into input, copy diagnostic, download `.txt`.
- SEO sections:
  - What Base64 is and when it is useful.
  - Difference between encoding and encryption.
  - Difference between Base64 and Base64URL.
  - How UTF-8 support handles accents and emoji.
  - Common Base64 errors: invalid characters, padding in the wrong place, copied line breaks, and binary data that is not UTF-8 text.
- FAQ topics:
  - `Base64 e criptografia?`
  - `O texto e enviado para o servidor?`
  - `Qual a diferenca entre Base64 e Base64URL?`
  - `Por que um Base64 valido pode nao virar texto legivel?`
  - `Preciso manter o padding com =?`
  - `Posso compartilhar um texto ja preenchido?`
- Disclaimer or privacy copy:
  - The conversion runs in the browser and should not intentionally send input to the server.
  - Base64 is reversible encoding. Do not treat it as a secure way to hide passwords, tokens, or private data.
  - Include content in a shared URL only when every recipient may read it.
- Related tool links:
  - Existing: `/dev`, `/dev/formatador-json`, `/texto/contador-caracteres`, `/geradores/qr-code`.
  - Future backlog candidates: `/dev/url-encode-decode`, `/dev/jwt-decoder`, `/dev/hash-texto`, `/dev/html-entities`, `/dev/conversor-csv-json`, and `/imagens/imagem-base64` if that family is later created.
- Translation guidance:
  - Add `toolCategories.codificacao` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested category names: PT-BR `Codificacao`; EN `Encoding`; ES `Codificacion`.
  - Add `tools.conversor-base64` keys for title, description, metadata, form labels, operation labels, alphabet labels, padding/whitespace toggles, result statuses, warnings, validation errors, metrics, actions, share/privacy warnings, SEO text, and FAQ content.
  - Suggested tool names: PT-BR `Conversor Base64`; EN `Base64 Converter`; ES `Conversor Base64`.
  - Keep route slug `/dev/conversor-base64` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/base64.ts` with state defaults, mode/alphabet normalization, UTF-8 byte encode/decode helpers, Base64/Base64URL conversion, validation error codes, metrics, safe search params, content fragment/hash helpers, and share URL generation.
  - Add `lib/tools/base64.test.ts` with deterministic unit coverage for encode, decode, Unicode, Base64URL, padding, whitespace, malformed input, URL-state helpers, and content-fragment sharing.
- URL state:
  - Sync only safe settings to the live query string: `modo`, `alfabeto`, `padding`, and `ignorarEspacos`.
  - Read `entrada` only from a `conteudo=1` hash fragment.
  - Generate content-bearing links only from the explicit share callback and only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing hash.
  - Add a fragment length budget and visible too-long warning.
- UI components:
  - Create `components/tools/dev/base64-converter-client.tsx` or an equivalent dev-family component.
  - Follow the JSON formatter's client-side privacy pattern and existing UI primitives.
  - Use lucide icons for copy, clear, swap, download, alert, and success actions. Verify icon availability before importing, with `Code2` or `Braces` as safe fallbacks.
  - Keep textareas stable, responsive, and horizontally safe for long Base64 lines.
  - Add accessible labels and stable test ids for input, output, mode controls, alphabet controls, padding toggle, whitespace toggle, include-content control, share button, copy buttons, clear, swap, download, error panel, and warning chips.
- Route and metadata:
  - Add `app/[locale]/dev/conversor-base64/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "conversor-base64")`.
  - Reuse existing `app/[locale]/dev/page.tsx`.
- Registry/family/category:
  - Reuse existing `dev` family.
  - Add `codificacao` to `ToolCategoryId` under family `dev`, with href `/dev/categorias/codificacao`.
  - Add `conversor-base64` to `tools` with `available: true`, `familyId: "dev"`, `primaryCategoryId: "codificacao"`, `categoryIds: ["codificacao"]`, `sitemapPriority` around `0.78`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"`.
  - Consider a `popularRank` or `recentRank` only if the current ordering policy requires a visible directory order update.
- Messages:
  - Add PT-BR, EN, and ES translations for the category, tool metadata, form controls, results, warnings, validation errors, actions, privacy/share messages, SEO article text, and FAQ content.
- Unit tests:
  - Cover ASCII encode/decode: `Hello` to `SGVsbG8=`.
  - Cover UTF-8 encode/decode for accented text and emoji.
  - Cover standard Base64 and Base64URL output.
  - Cover padding enabled/disabled and missing-padding decode repair.
  - Cover whitespace ignored vs rejected.
  - Cover invalid characters, mixed alphabets, invalid padding, invalid length, over-limit input, and valid Base64 bytes that are invalid UTF-8.
  - Cover safe query params and hash-fragment content sharing, including oversized content omission.
- E2E hooks/tests:
  - Add a focused Playwright spec such as `tests/e2e/base64-converter.spec.ts`.
  - Assert encode and decode flows, Base64URL mode, Unicode roundtrip, malformed error display, invalid UTF-8 handling, copy output, swap output, default safe URL behavior, explicit hash content share, oversized share omission, `/dev` directory visibility, localized sitemap entry if existing e2e conventions cover it, mobile layout, and clean console/page-error guards.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark the row `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Empty input returns `empty` without error.
  - Encoding `Hello` returns `SGVsbG8=`.
  - Decoding `SGVsbG8=` returns `Hello`.
  - UTF-8 text with Portuguese accents and emoji roundtrips without `btoa` Unicode failures.
  - Base64URL maps `+` to `-`, `/` to `_`, and respects the padding toggle.
  - Decode accepts recoverable missing padding and reports `paddingInferred`.
  - Decode with whitespace removal enabled accepts wrapped Base64 and reports `whitespaceIgnored`.
  - Decode with whitespace removal disabled rejects wrapped Base64.
  - Reject `abcde` or any normalized length where modulo 4 is 1.
  - Reject invalid characters such as `%`.
  - Reject padding in the middle and more than two trailing padding characters.
  - Reject mixed standard and URL-safe alphabets.
  - Decode `/w==` as Base64 bytes and return `invalidUtf8` for text output.
  - Over-limit input returns `tooLarge` without conversion.
- URL-state scenarios:
  - `?modo=decodificar&alfabeto=base64url&padding=0&ignorarEspacos=1` initializes safe settings.
  - Invalid params fall back to defaults.
  - Typing input does not add `entrada` to `window.location.search`.
  - Enabling include-content does not mutate the address bar.
  - Default share URL contains only safe params.
  - Explicit content share URL puts `conteudo=1&entrada=...` in the hash fragment, not in query params.
  - Loading a content-bearing hash prefills the textarea and sanitizes the live URL after hydration.
  - Oversized content share omits `entrada` and shows a warning.
- Browser scenarios:
  - Desktop and mobile render without horizontal overflow from long Base64 strings.
  - Operation, alphabet, padding, and whitespace controls remain accessible by keyboard.
  - Copy, clear, swap, download, and share actions work.
  - Error states are visible and do not clear user input.
  - Privacy copy is visible near input/share controls.
  - No console errors or page errors during normal, invalid, shared-link, and mobile flows.
- Playwright scenarios:
  - Encode ASCII and Unicode text, assert exact output and metrics.
  - Decode valid Base64 and Base64URL strings.
  - Show invalid Base64 and invalid UTF-8 errors.
  - Assert live URL never includes pasted content.
  - Assert explicit share uses hash content and sanitizes on load.
  - Assert `/dev` directory includes the Base64 converter card after registry/messages are implemented.
- Lint/build commands:
  - `pnpm test -- lib/tools/base64.test.ts`
  - `pnpm lint`
  - `pnpm build` with the same placeholder environment pattern used by recent tool implementations if local DB env is unavailable.
  - `pnpm run test:e2e -- tests/e2e/base64-converter.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - The tool is browser-only and deterministic.
  - Unicode encode/decode works through UTF-8 bytes.
  - Malformed Base64 and invalid UTF-8 produce clear localized errors.
  - Default URL/share behavior never exposes input content.
  - Explicit content sharing uses only hash fragments and enforces a size budget.
  - PT-BR, EN, and ES messages cover the full UI.
  - Unit, e2e, browser, lint, and build validation pass or any environment-only blocker is documented.

## Implementation Notes

- Status updates:
  - 2026-06-20: Planned Rank 4 `conversor-base64` as a new `/dev/conversor-base64` ferramenta. App code, backlog status, translations, tests, constants, and routes were intentionally not edited.
  - 2026-06-20: Implementation started; backlog row marked `In Progress` and plan status set to `in_progress` before app edits.
  - 2026-06-20: Implemented browser-only UTF-8 Base64/Base64URL encode/decode with strict malformed input and invalid UTF-8 errors, safe live query params, explicit hash-fragment content sharing, and no save/favorites/storage.
- Files changed:
  - `docs/tool-plans/conversor-base64.md`
  - `docs/tool-backlog.md`
  - `lib/tools/base64.ts`
  - `lib/tools/base64.test.ts`
  - `components/tools/dev/base64-converter-client.tsx`
  - `app/[locale]/dev/conversor-base64/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/base64-converter.spec.ts`
- Validation results:
  - Passed: `pnpm test -- lib/tools/base64.test.ts` (Vitest reported 32 files / 357 tests).
  - Passed: `pnpm lint`.
  - Initial focused e2e attempt `pnpm run test:e2e -- tests/e2e/base64-converter.spec.ts` failed because Prisma client had not been generated in this worktree, causing `/api/auth/session` 500s from `Cannot find module '.prisma/client/default'`.
  - Passed: `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build`; this generated Prisma Client and built the new route.
  - Passed after build: `pnpm run test:e2e -- tests/e2e/base64-converter.spec.ts` (6 Chromium tests).
  - Passed: `git diff --check`.
- Tester findings:
  - 2026-06-20: Independent tester validation completed with the configured Playwright web server on `/dev/conversor-base64`.
  - Added focused e2e coverage for decode-mode whitespace normalization: wrapped Base64 is accepted with the `whitespaceIgnored` warning when whitespace is ignored, and rejected when the option is disabled.
  - Browser coverage passed for route load, encode/decode flows, Unicode, Base64URL, padding omitted/inferred warnings, whitespace ignored/rejected behavior, malformed Base64, invalid UTF-8, copy result, copy diagnostics, swap, clear, download, default safe share URL, explicit hash content share, hash hydration sanitization, oversized share omission warning, `/dev` visibility, `/dev/categorias/codificacao` visibility, localized sitemap entries, mobile no-overflow, and console/page-error cleanliness.
  - The first sandbox run on port 3100 hit a stale/failed localhost server and was discarded; a fresh sandbox run on port 3124 then failed before assertions because Chromium could not launch in the macOS sandbox (`MachPortRendezvousServer` permission denied). The elevated fresh-port run passed and stopped its Playwright-managed web server.
  - Passed: elevated `PORT=3124 pnpm run test:e2e -- tests/e2e/base64-converter.spec.ts` (6 Chromium tests).
  - Passed: `pnpm lint`.
  - Passed: `git diff --check`.
- Remaining tester focus areas:
  - None from tester validation.
- Backlog status:
  - `Done`; draft PR https://github.com/saulodefaria/calculaderia/pull/15 and route `/dev/conversor-base64` recorded with review gate and browser/e2e validation summary.
- Final status:
  - `verified`; draft PR https://github.com/saulodefaria/calculaderia/pull/15.
