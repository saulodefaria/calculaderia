---
slug: "url-encode-decode"
familyId: "dev"
primaryCategoryId: "codificacao"
backlogRank: 14
primaryKeyword: "url encode decode"
decision: "new"
targetRoute: "/dev/url-encode-decode"
status: "verified"
createdAt: "2026-06-28"
updatedAt: "2026-06-28"
---

# URL Encode Decode Plan

## Backlog Row

- Rank: 14
- Original status: `In Progress`
- Stage: `testing`
- Branch: `codex/url-encode-decode-tool`
- Slug: `url-encode-decode`
- Primary keyword: `url encode decode`
- Cluster keywords: not provided in the claimed item JSON.
- Family/category: backlog family `dev`; planned family `dev`; planned category `codificacao`.
- Opportunity score: not provided in the claimed item JSON.
- Idea type: `New`
- Plan path: `docs/tool-plans/url-encode-decode.md`
- Target route: `/dev/url-encode-decode`
- Notes: not provided in the claimed item JSON.
- Done ref: not provided in the claimed item JSON.

## Decision

- Decision: `new`
- Target route: `/dev/url-encode-decode`
- Rationale: Build a new browser-only developer utility for percent-encoding and decoding URL components, full URI strings, and form/query values. The repo already has the `dev` family and the `codificacao` category through `/dev/conversor-base64`, but Base64, JSON formatting, and regex testing solve different jobs. The claimed slug and route are a clear fit for a separate encoding tool under `/dev`.

## Similarity Check

- Existing routes checked:
  - Generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and category routing under `app/[locale]`.
  - Current dev routes: `app/[locale]/dev/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, `app/[locale]/dev/conversor-base64/page.tsx`, and `app/[locale]/dev/regex-tester/page.tsx`.
  - No `/dev/url-encode-decode` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `dev`.
  - `lib/constants.ts` already defines the `codificacao` dev category with href `/dev/categorias/codificacao`.
  - Existing dev tools are `formatador-json`, `conversor-base64`, and `regex-tester`; no `url-encode-decode` tool entry exists.
- Related modules/translations checked:
  - `lib/tools` has helpers for Base64, JSON, regex, dates, documents, email, generators, math, QR code, colors, and text, but no URL percent-encoding helper.
  - `components/tools/dev` has JSON, Base64, and regex clients, but no URL encode/decode client.
  - `components/tools/url-state.ts` provides the existing query-string replacement and share URL helpers used by dev tools.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have `toolFamilies.dev`, `toolCategories.codificacao`, and tool namespaces for JSON/Base64/regex, but no URL encode/decode namespace.
- Prior plans checked:
  - `docs/tool-plans/formatador-json.md`, `docs/tool-plans/conversor-base64.md`, `docs/tool-plans/regex-tester.md`, `docs/tool-plans/qr-code.md`, and `docs/tool-plans/uuid.md` mention `/dev/url-encode-decode` only as a future related tool.
  - No duplicate `url-encode-decode` plan exists in `docs/tool-plans` or `docs/calculator-plans`.
  - Per instruction, archived markdown backlog files were not used as source of truth.
- Text search checked:
  - `url-encode-decode`, `url encode decode`, `percent-encod`, `encodeURIComponent`, `decodeURIComponent`, `conversor-base64`, and `formatador-json` across `app`, `lib`, `components`, `messages`, `tests`, `docs/tool-plans`, and `docs/calculator-plans`.
  - Existing `encodeURIComponent`/`decodeURIComponent` references are URL-state/test implementation details, not a user-facing URL encoding tool.
- Overlap conclusion:
  - Build this as a new route at `/dev/url-encode-decode`.
  - Reuse the existing `dev` family and `codificacao` category.
  - Keep it separate from `/dev/conversor-base64` because percent-encoding is URL syntax encoding, not binary-to-text encoding.
  - Keep it separate from `/dev/formatador-json` and `/dev/regex-tester`; link to them as related developer utilities.

## User Intent And Scope

- Target user: Developers, QA analysts, support engineers, API integrators, students, and technical writers who need to encode or decode URL pieces without sending potentially sensitive links or payloads to a server.
- User job: Paste text, a URL component, a query value, or a full URL string; encode or decode it in the browser; understand which URL context was used; copy or download the result; and optionally share settings without exposing pasted content.
- In scope:
  - Browser-only percent-encode and percent-decode for URL components using JavaScript `encodeURIComponent` and `decodeURIComponent`.
  - Full URI encode/decode mode using `encodeURI` and `decodeURI` for users who need delimiters such as `:`, `/`, `?`, `#`, and `&` preserved.
  - `application/x-www-form-urlencoded` value mode for query/form values where spaces serialize as `+` and literal plus signs serialize as `%2B`.
  - Optional strict RFC 3986 component output that additionally percent-encodes `!`, `'`, `(`, `)`, and `*` after `encodeURIComponent`.
  - Malformed percent sequence diagnostics, invalid UTF-8 diagnostics, unpaired-surrogate diagnostics for encoding, and too-large input guardrails.
  - Copy result, copy diagnostics, clear, use output as input, swap operation, download TXT, and example loading.
  - Safe settings-only live URL state and explicit hash-only content sharing.
- Out of scope:
  - URL validation, URL normalization/canonicalization, DNS/network checks, request fetching, redirect inspection, link safety scoring, malware/phishing detection, HTML entity decoding, Base64 decoding, JWT decoding, file upload, saved history, account favorites, and server-side processing.
  - Claims that a decoded URL is safe, trusted, reachable, canonical, or semantically equivalent to another URL.
- Sensitive-topic caveats:
  - Treat pasted URLs and query strings as potentially containing tokens, signatures, API keys, session IDs, customer identifiers, emails, or private paths.
  - Decoding a URL can expose hidden query values; copy and share actions must make this privacy boundary clear.
  - The tool should not prefetch, validate, open, or otherwise send pasted URLs anywhere.

## Tool Contract

- Inputs:
  - `entrada`: raw text, URL component, full URI string, query value, or form value.
  - `modo`: `codificar` or `decodificar`.
  - `contexto`: `componente`, `uri`, or `form`.
  - `estrito`: optional boolean for strict RFC 3986 component output. Applies only when `modo=codificar` and `contexto=componente`.
  - `conteudo`: optional hash/fragment flag (`1`) for explicit content-bearing share links.
- Defaults:
  - `entrada`: empty.
  - `modo`: `codificar`.
  - `contexto`: `componente`.
  - `estrito`: `0`.
  - `conteudo`: absent, so the live URL and default share URL omit the pasted input.
- Validation rules:
  - Empty input returns neutral `empty` status.
  - Cap input length at a practical browser-safe limit such as 1,000,000 characters; return `tooLarge` without attempting conversion.
  - Encoding must catch or pre-detect unpaired UTF-16 surrogates and return `invalidUnicode` instead of crashing.
  - Decoding must validate percent triplets before calling decode APIs. Any `%` not followed by two ASCII hex digits returns `malformedPercent`.
  - Decoding must catch `URIError` from invalid UTF-8 byte sequences and return `invalidUtf8`.
  - `form` decode must convert `+` to U+0020 space before percent-decoding. Other contexts must keep `+` as a literal plus sign.
  - Invalid `modo`, `contexto`, `estrito`, or hash params must fall back to defaults.
  - Do not recursively decode by default. If the decoded result still contains percent triplets, show a non-blocking `possibleDoubleEncoding` warning rather than silently decoding again.
  - If encoding input already contains percent triplets, show a non-blocking `possibleAlreadyEncoded` warning because encoding again will turn `%` into `%25`.
- Outputs:
  - `status`: `empty`, `valid`, `malformedPercent`, `invalidUtf8`, `invalidUnicode`, or `tooLarge`.
  - `output`: converted string when valid.
  - `normalizedInput`: for form decode, the internal plus-to-space value before percent decoding; otherwise the original input.
  - `inputMetrics` and `outputMetrics`: characters, UTF-8 bytes, lines, and percent-triplet count.
  - `warnings`: `possibleAlreadyEncoded`, `possibleDoubleEncoding`, `plusAsSpace`, `strictRfc3986Applied`, and `reservedDelimitersPreserved`.
  - `error`: stable app-owned code plus localized explanation and optional browser diagnostic text.
- Result explanations:
  - Component mode is for a value inside a path segment, query value, fragment value, or API parameter and encodes delimiters like `&`, `=`, `/`, and `?`.
  - URI mode is for an already structured URI string and preserves URI delimiters; it is not a URL validator.
  - Form mode follows `application/x-www-form-urlencoded` value behavior where spaces become `+`.
  - Strict RFC 3986 component mode encodes extra characters that `encodeURIComponent` leaves unescaped.
  - Percent-encoded hex digits should be emitted uppercase for consistency.
  - Decoding follows JavaScript/browser UTF-8 behavior and may reject malformed byte sequences.
- URL params:
  - Safe params synced automatically in `window.location.search`: `modo`, `contexto`, and `estrito` only.
  - Do not sync `entrada` to the live query string.
  - Explicit content params must live only in the URL fragment/hash, for example `?modo=decodificar&contexto=form#conteudo=1&entrada=nome%3DJoao%2BMaria`.
  - Read `entrada` from the hash only when `conteudo=1`.
  - After loading a content-bearing hash URL, prefill the editor client-side and sanitize the live address bar back to safe query params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only route plus safe settings.
  - Provide an explicit "include input in shared link" control.
  - Enabling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the generated share URL.
  - Apply a fragment length budget such as 1,800 characters. If content is too large, omit the input and show a localized warning.
  - Warn that anyone with a content-bearing link can read the pasted URL or value.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input, output, diagnostics, or share content in localStorage, sessionStorage, cookies, IndexedDB, analytics events, server logs beyond the initial navigation path, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add pure helpers such as `lib/tools/url-encoding.ts` for state defaults, mode/context normalization, metrics, validation, conversion, warnings, URL-state helpers, hash-fragment helpers, share URL generation, and typed result statuses.
  - Implement `componente` encode with `encodeURIComponent(input)`.
  - Implement strict RFC 3986 component encode by post-processing `encodeURIComponent` output for `!`, `'`, `(`, `)`, and `*` with uppercase hex escapes.
  - Implement `uri` encode with `encodeURI(input)`.
  - Implement `form` encode with `URLSearchParams`-compatible value serialization or an explicit UTF-8 percent-encoding routine that encodes spaces as `+` and literal plus as `%2B`.
  - Implement `componente` decode with `decodeURIComponent(input)` after percent-triplet validation.
  - Implement `uri` decode with `decodeURI(input)` after percent-triplet validation.
  - Implement `form` decode by replacing `+` with space and then applying component decode.
  - Use uppercase hex in generated percent escapes.
  - Never call `fetch`, create an image/link probe, navigate to, or otherwise request the pasted URL.
- Data tables or assumptions:
  - No external data tables are required.
  - Conversion uses the current browser's JavaScript URI encoding/decoding APIs and UTF-8 behavior.
  - Form mode is for a single value/body fragment, not for parsing or rebuilding a whole query object.
  - Character counts should use `Array.from(value).length`; byte counts should use `TextEncoder`.
- Official or authoritative sources:
  - RFC 3986, URI Generic Syntax, sections 2.1, 2.2, 2.3, and 6.2.2.2: https://www.rfc-editor.org/rfc/rfc3986
  - WHATWG URL Standard, percent-encoded bytes and percent-encode sets: https://url.spec.whatwg.org/#percent-encoded-bytes and https://url.spec.whatwg.org/#percent-encode
  - WHATWG URL Standard, `application/x-www-form-urlencoded` serializing: https://url.spec.whatwg.org/#urlencoded-serializing
  - TC39 ECMA-262, `encodeURI`, `decodeURI`, `encodeURIComponent`, and `decodeURIComponent`: https://tc39.es/ecma262/multipage/global-object.html#sec-encodeuricomponent-uricomponent and https://tc39.es/ecma262/multipage/global-object.html#sec-decodeuricomponent-encodeduricomponent
  - Codebase source checked on 2026-06-28: routes, `lib/constants.ts`, `lib/tools`, `components/tools`, URL-state helpers, messages, tests, and prior tool/calculator plans.
- Source access dates:
  - RFC 3986 checked on 2026-06-28.
  - WHATWG URL Standard checked on 2026-06-28.
  - TC39 ECMA-262 links checked on 2026-06-28.
  - Codebase checked on 2026-06-28.
- Rule/table effective dates:
  - RFC 3986 was published in January 2005 and remains the generic URI syntax reference.
  - WHATWG URL and TC39 ECMA-262 are living standards; use links and access dates rather than pinning a static rule table.
- Freshness or maintenance risk:
  - Low for core percent-encoding syntax and `encodeURIComponent`/`decodeURIComponent`.
  - Moderate for exact browser error messages and any future URL Standard clarifications around form serialization.
  - Low operational risk because this tool has no public-rate, legal, tax, labor, financial, government, check-digit, or table-driven freshness dependency.
- Estimator or privacy limitations:
  - The tool is not a URL validator, canonicalizer, sanitizer, or security scanner.
  - Browser-only execution reduces server exposure, but explicit content-bearing links, clipboard contents, screenshots, extensions, browser history, and initial navigation paths can still expose pasted data.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `URL Encode Decode`
  - PT-BR meta title: `URL encode decode online grátis`
  - PT-BR description: `Codifique e decodifique componentes de URL, URIs e valores de formulário no navegador, sem enviar o conteúdo para o servidor.`
- Main form sections:
  - Input textarea with monospace font, clear label, placeholder examples, and browser-only privacy note.
  - Operation segmented control for `codificar` and `decodificar`.
  - Context selector for `componente`, `uri`, and `form`.
  - Strict RFC 3986 toggle shown only for component encoding or clearly disabled outside that context.
  - Share/privacy section with default safe link and explicit include-content option.
- Results sections:
  - Status panel for neutral, valid, malformed percent, invalid UTF-8, invalid Unicode, or too-large states.
  - Output textarea or code block with copy, use-output-as-input, swap-operation, and TXT download actions.
  - Metrics panel for characters, UTF-8 bytes, lines, percent triplets, and output size change.
  - Warning panel for plus-as-space form decoding, possible double encoding, preserved URI delimiters, and strict RFC 3986 mode.
  - Small examples table: component value with spaces/accent, full URL with query delimiters, and form value with `+`.
- SEO sections:
  - What URL encoding and percent-encoding do.
  - Difference between URL component, full URI, and form/query value encoding.
  - Why spaces can become `%20` or `+`.
  - How malformed `%` sequences and invalid UTF-8 are handled.
  - Privacy guidance for signed URLs, tokens, and API keys.
- FAQ topics:
  - `O texto e enviado para o servidor?`
  - `Qual e a diferenca entre encodeURI e encodeURIComponent?`
  - `Quando o espaco vira + em vez de %20?`
  - `Por que %25 aparece no resultado?`
  - `Por que a decodificacao falhou?`
  - `Isso valida se uma URL e segura ou existe?`
  - `Posso compartilhar uma entrada ja preenchida?`
- Disclaimer or privacy copy:
  - The conversion happens in the browser and should not intentionally send input to the server.
  - Do not paste tokens, signed URLs, passwords, customer data, or private logs unless the current browser environment is appropriate for that data.
  - Content-bearing share links expose the input to anyone who receives the URL.
  - Decoded URLs are not safety-checked and should not be clicked or trusted automatically.
- Related tool links:
  - Existing: `/dev`, `/dev/conversor-base64`, `/dev/formatador-json`, `/dev/regex-tester`, `/texto/contador-caracteres`, and `/geradores/qr-code`.
  - Future backlog candidates: `/dev/html-entities`, `/dev/hash-texto`, `/dev/jwt-decoder`, `/dev/validador-yaml`, and `/dev/conversor-csv-json`.
- Translation guidance:
  - Reuse existing `toolFamilies.dev` and `toolCategories.codificacao` messages in `pt-br`, `en`, and `es`.
  - Add `tools.url-encode-decode` keys for metadata, form labels, operation labels, context labels, strict-mode copy, result statuses, metrics, warnings, errors, actions, share/privacy warnings, SEO text, and FAQ content.
  - Suggested names:
    - PT-BR: `URL Encode Decode` or `Codificador e Decodificador de URL`; keep the SEO keyword in title/meta.
    - EN: `URL Encode Decode`.
    - ES: `Codificador y decodificador de URL`.
  - Use localized explanations rather than literal English technical text where possible, but keep API names like `encodeURI`, `encodeURIComponent`, and `application/x-www-form-urlencoded` unchanged.
  - Keep route slug `/dev/url-encode-decode` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/url-encoding.ts` with typed state, defaults, mode/context normalization, conversion helpers, decode validation, warning detection, metrics, and share URL helpers.
  - Add `lib/tools/url-encoding.test.ts` with deterministic unit coverage for component, URI, form, strict mode, invalid percent triplets, invalid UTF-8, unpaired surrogate handling, size limits, metrics, warnings, URL state, and hash sharing.
- URL state:
  - Sync only safe params to the live query string: `modo`, `contexto`, and `estrito`.
  - Read `entrada` only from a `conteudo=1` hash fragment.
  - Generate content-bearing links only from the explicit share callback and only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing hash.
  - Add a fragment length budget and visible too-long warning.
- UI components:
  - Create `components/tools/dev/url-encode-decode-client.tsx`.
  - Follow the JSON/Base64/regex client privacy pattern for safe query state and explicit hash-only content sharing.
  - Use lucide icons for encode/decode, copy, clear, warning, success, share, download, and reset actions. Prefer `Link2`, `Code2`, or another existing lucide icon that fits without introducing a custom SVG.
  - Keep input/output editors responsive with stable dimensions, contained long-line overflow, and stable test ids.
  - Add accessible labels for textarea, operation tabs, context selector, strict toggle, status panel, copy actions, share controls, and warnings.
- Route and metadata:
  - Add `app/[locale]/dev/url-encode-decode/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "url-encode-decode")`.
  - Reuse existing `app/[locale]/dev/page.tsx`.
- Registry/family/category:
  - Reuse `familyId: "dev"` and `primaryCategoryId: "codificacao"`.
  - Add `url-encode-decode` to `tools` with `available: true`, href `/dev/url-encode-decode`, `categoryIds: ["codificacao"]`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"`.
  - No new family or category is needed.
- Messages:
  - Add `tools.url-encode-decode` to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Preserve JSON parse validity and avoid untranslated fallback keys.
- Unit tests:
  - Cover conversion outputs:
    - `cafe com acucar` component encodes spaces as `%20`.
    - Accented text and emoji encode as UTF-8 percent bytes and decode back.
    - Component mode encodes `&`, `=`, `/`, and `?`; URI mode preserves URI delimiters.
    - Form mode encodes space as `+` and literal plus as `%2B`.
    - Strict mode encodes `!`, `'`, `(`, `)`, and `*`.
  - Cover invalid decode inputs such as `%`, `%G0`, `%E0%A4%A`, and `%C3%28`.
  - Cover unpaired surrogate input for encode.
  - Cover possible double-encoding warnings and fragment length omission.
- E2E hooks/tests:
  - Add `tests/e2e/url-encode-decode.spec.ts` covering route load, component encode/decode, URI mode delimiter preservation, form mode plus handling, strict toggle, invalid percent errors, copy result, copy diagnostics, use output as input, default safe share URL, explicit hash content sharing, hash hydration/sanitization, oversized share omission, localized EN/ES smoke, `/dev` discovery, category discovery, sitemap entry, and mobile no-horizontal-overflow.
- Backlog updates:
  - Creator/orchestrator should update the DB item stage/status only outside this planner handoff.
  - Do not update archived markdown backlog files.

## Test Plan

- Unit scenarios:
  - Pure conversion helpers for all modes/contexts.
  - Error handling for malformed percent triplets, invalid UTF-8, unpaired surrogates, and too-large input.
  - Warning generation for possible already-encoded input, possible double-encoded output, plus-as-space, strict mode, and preserved delimiters.
  - URL-state helper normalization for bad params and defaults.
  - Hash-fragment share generation, explicit content loading, and over-budget content omission.
- URL-state scenarios:
  - Live URL updates only to `?modo=...&contexto=...&estrito=...`.
  - Input/output never appear in `window.location.search`.
  - Default share URL omits `entrada`.
  - Explicit share URL stores input only in the hash with `conteudo=1`.
  - Loading a hash-bearing URL hydrates input client-side and then sanitizes the visible address bar.
- Browser scenarios:
  - Navigate to `/dev/url-encode-decode`; assert heading, input, controls, privacy copy, output, FAQ, and related links render.
  - Enter a query value, encode in component mode, switch to form mode, decode back, and confirm expected results.
  - Verify invalid inputs show localized, copyable diagnostics without crashing.
  - Verify no save/favorite controls are shown and no storage/cookie/IndexedDB entries contain pasted input.
  - Verify no post-input network request, analytics page path, or share URL contains pasted content unless explicit hash sharing is used.
  - Smoke test `/en/dev/url-encode-decode` and `/es/dev/url-encode-decode`.
  - Check desktop and mobile layouts for contained long URLs and no horizontal overflow.
- Playwright scenarios:
  - Focused spec for route behavior, conversion modes, invalid decode, share privacy, hash hydration, discovery, sitemap, and mobile.
  - Run elevated Chromium on this macOS host if sandboxed Chromium hits the known permission issue.
- Lint/build commands:
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/url-encoding.test.ts lib/constants.test.ts`
  - Message JSON parse for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Targeted ESLint for new helper, client, route, constants, tests, and message-impacting files.
  - `pnpm build` with the repo's required placeholder/env setup if Prisma/Auth env vars are needed.
  - `PORT=<free-port> pnpm run test:e2e -- tests/e2e/url-encode-decode.spec.ts` or direct Playwright command matching the repo's local constraints.
  - `git diff --check`.
- Acceptance criteria:
  - `/dev/url-encode-decode` is discoverable under `/dev` and `/dev/categorias/codificacao`.
  - Component, URI, and form modes produce deterministic, documented results.
  - Malformed percent escapes and invalid UTF-8 produce stable localized errors.
  - Pasted input stays out of live query params, default share URLs, app storage, and analytics page paths.
  - Explicit content sharing is hash-only, bounded, warned, and sanitized after hydration.
  - PT-BR, EN, and ES routes render without missing keys.
  - Unit, URL-state, e2e, browser, lint, build, and whitespace checks pass or have documented environment blockers.

## Implementation Notes

- Status updates:
  - 2026-06-28: Planner selected `new` and wrote this buildable plan for `/dev/url-encode-decode`.
  - 2026-06-28: Creator confirmed local DB item `url-encode-decode` is `In Progress` with stage `implementation`, then implemented the planned browser-only URL encode/decode tool.
  - 2026-06-28: Review-fix worker addressed accepted findings for strict-off component escaping, decoded literal percent-triplet preservation, and the too-large guard path. DB item remains `In Progress` with stage `review`.
  - 2026-06-28: Independent tester validation passed for `/dev/url-encode-decode`; plan status set to `verified`. DB finalization remains an orchestrator action.
- Files changed:
  - `docs/tool-plans/url-encode-decode.md`
  - `lib/tools/url-encoding.ts`
  - `lib/tools/url-encoding.test.ts`
  - `components/tools/dev/url-encode-decode-client.tsx`
  - `app/[locale]/dev/url-encode-decode/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/url-encode-decode.spec.ts`
- Review-fix files changed:
  - `docs/tool-plans/url-encode-decode.md`
  - `lib/tools/url-encoding.ts`
  - `lib/tools/url-encoding.test.ts`
- Validation results:
  - Planner overlap inspection completed for existing `/dev` routes, `lib/constants.ts`, `lib/tools`, `components/tools`, URL-state helpers, messages, tests, and prior plans.
  - Source links checked and recorded with access date 2026-06-28.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/url-encoding.test.ts lib/constants.test.ts` passed: 2 files, 19 tests.
  - Review-fix rerun `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/url-encoding.test.ts lib/constants.test.ts` passed: 2 files, 21 tests.
  - `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('messages ok')"` passed.
  - `./node_modules/.bin/eslint lib/tools/url-encoding.ts lib/tools/url-encoding.test.ts components/tools/dev/url-encode-decode-client.tsx app/'[locale]'/dev/url-encode-decode/page.tsx tests/e2e/url-encode-decode.spec.ts lib/constants.ts` passed.
  - Review-fix targeted ESLint `./node_modules/.bin/eslint lib/tools/url-encoding.ts lib/tools/url-encoding.test.ts` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed.
  - `./node_modules/.bin/tsc --noEmit` passed after Prisma client generation.
  - Elevated focused Playwright passed: `PORT=3192 AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3192 NEXTAUTH_URL=http://localhost:3192 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3192" ./node_modules/.bin/playwright test tests/e2e/url-encode-decode.spec.ts` passed 6 Chromium tests. The spec filters the known unrelated Auth.js `ClientFetchError` session-fetch console noise on directory/localized pages and still fails on non-auth console/page errors.
  - Elevated production build passed: `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3193 NEXTAUTH_URL=http://localhost:3193 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build`; output listed `/[locale]/dev/url-encode-decode` and emitted only existing `metadataBase` warnings.
  - `git diff --check` passed.
  - Review-fix rerun `git diff --check` passed.
  - Tester DB check: `printenv DATABASE_URL` and `printenv AGENT_BACKLOG_DATABASE_URL` were not available in this shell (`BACKLOG_DB_ENV_NOT_SET`), so `scripts/backlog/get_item.sql` was read but not executed. User-provided current DB context remains `kind=tool`, slug `url-encode-decode`, status `In Progress`, stage `testing`.
  - Tester implementation inspection confirmed route `app/[locale]/dev/url-encode-decode/page.tsx`, field ids in `components/tools/dev/url-encode-decode-client.tsx`, result labels, safe params `modo`/`contexto`/`estrito`, hash-only `conteudo=1&entrada=...` sharing, registry/category/sitemap wiring, and no `SaveButton`, favorites, storage, cookie, fetch, prefetch, or analytics calls in the tool implementation.
  - Tester focused Playwright passed: `PORT=3194 AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3194 NEXTAUTH_URL=http://localhost:3194 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3194" ./node_modules/.bin/playwright test tests/e2e/url-encode-decode.spec.ts` passed 6 Chromium tests.
  - Tester browser server command: `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3195 NEXTAUTH_URL=http://localhost:3195 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname localhost --port 3195`; stopped after validation, and `lsof -nP -iTCP:3195 -sTCP:LISTEN` returned no listener.
  - Tester manual browser validation passed with a one-off elevated Node/@playwright script against `http://localhost:3195`. Covered PT-BR route load/no redirect loop, component encode/decode, URI delimiter preservation, form plus handling, strict toggle, malformed percent and invalid UTF-8 states, default share excluding input, explicit include-content hash-only sharing, hash hydration followed by visible URL sanitization, no SaveButton/favorite controls, no localStorage/sessionStorage/cookie/IndexedDB entries containing pasted sensitive input, no post-input request URL containing pasted sensitive input, EN/ES route smoke, `/dev` discovery, `codificacao` category discovery, sitemap localized entries, mobile 390px no horizontal overflow, and zero non-auth console/page errors.
- Tester findings:
  - Passed independent tester validation. No production code changes were made by the tester, and no e2e coverage changes were needed because the existing focused spec already covers the required functional, share, locale, discovery, sitemap, and mobile paths.
  - Residual risk: DB row was not read directly because backlog DB env vars were not exported in this shell; use the orchestrator-provided context for DB status/stage. Runtime auth-session requests occur as part of the app shell, but they did not include pasted content and produced no non-auth browser errors.
- Final status:
  - `verified`; implementation, accepted review fixes, focused e2e, and independent browser validation passed. Expected DB state for orchestrator finalization remains `In Progress` with stage `testing` until the orchestrator advances the item; tester did not mark the DB item `Done`.
