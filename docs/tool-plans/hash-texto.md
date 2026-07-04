---
slug: "hash-texto"
familyId: "dev"
primaryCategoryId: "hashes"
backlogRank: 17
primaryKeyword: "gerador de hash"
decision: "new"
targetRoute: "/dev/hash-texto"
status: "in_progress"
createdAt: "2026-07-03"
updatedAt: "2026-07-03"
---

# Gerador de Hash de Texto Plan

## Backlog Row

- Rank: 17
- Original status: `In Progress`
- Original stage: `planning`
- Slug: `hash-texto`
- Primary keyword: `gerador de hash`
- Cluster keywords: `md5 hash`; `sha256 online`; `hash generator`
- Family/category: backlog family `dev`; planned family `dev`; planned category `hashes`
- Opportunity score: 73
- Idea type: New
- Notes: Include SHA-256/SHA-1/MD5 labels and security caveats.
- Done ref: -
- Claim branch: `codex/hash-texto-tool`
- Plan path: `docs/tool-plans/hash-texto.md`
- Target route: `/dev/hash-texto`

## Decision

- Decision: `new`
- Target route: `/dev/hash-texto`
- Rationale: The app has a first-class `dev` family and adjacent developer utilities, but no text hash generator route, helper module, UI component, translations, e2e spec, registry entry, or prior plan for `hash-texto`. Build this as a browser-only developer/security-adjacent utility at the claimed target route.

## Similarity Check

- Existing routes checked:
  - Generic directory routes: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current `dev` routes: `app/[locale]/dev/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, `app/[locale]/dev/conversor-base64/page.tsx`, and `app/[locale]/dev/regex-tester/page.tsx`.
  - Related non-dev routes: `/geradores/senha`, `/geradores/uuid`, `/texto/contador-caracteres`, and `/texto/conversor-maiusculas`.
  - No `/dev/hash-texto` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `dev`.
  - Existing dev categories are `dados-estruturados`, `codificacao`, and `expressoes-regulares`.
  - Hashing is not encoding: a hash digest is one-way and security-adjacent. Add a new dev category `hashes` with href `/dev/categorias/hashes`, using `Fingerprint` or another available security/code icon.
  - Do not reuse `geradores/seguranca`; that category currently belongs to password generation under the `geradores` family.
- Related modules/translations checked:
  - `lib/tools` contains `base64.ts`, `json.ts`, `regex.ts`, `text.ts`, `generators.ts`, `documents.ts`, `dates.ts`, `math.ts`, `colors.ts`, and related tests. No hash helper exists.
  - `components/tools/dev/base64-converter-client.tsx` and `components/tools/dev/json-formatter-client.tsx` provide the closest privacy/share pattern for pasted developer text.
  - `components/tools/url-state.ts` supports safe query-string state and default share URLs.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have dev family/category/tool keys for JSON, Base64, and regex, but no `hash-texto` or `hashes` keys.
- Prior plans checked:
  - `docs/tool-plans/formatador-json.md`, `docs/tool-plans/conversor-base64.md`, `docs/tool-plans/regex-tester.md`, `docs/tool-plans/uuid.md`, `docs/tool-plans/contador-caracteres.md`, and related text/dev plans.
  - `docs/tool-plans/conversor-base64.md` explicitly lists `/dev/hash-texto` as a separate future backlog candidate rather than Base64 scope.
  - No duplicate `hash-texto` plan exists.
- Text search checked:
  - `hash-texto`, `gerador de hash`, `hash`, `digest`, `sha`, `sha256`, and `md5` across routes, `lib`, components, messages, e2e specs, and plans, excluding archived markdown backlogs.
- Overlap conclusion:
  - Build a new tool.
  - Keep Base64, URL encode/decode, JWT decoding, UUID generation, password generation, and text transformation separate because they have different contracts and security caveats.
  - Future file hashing, HMAC, password hashing, and checksum comparison can link to this page but should not be merged into this first text-only route.

## User Intent And Scope

- Target user: Developers, QA analysts, support engineers, students, technical writers, and API users who need a quick digest/fingerprint of exact pasted text without sending it to a server.
- User job: Paste text, choose a hash algorithm and output format, get a deterministic digest, copy it, understand whether the selected algorithm is appropriate, and optionally share safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only UTF-8 text hashing.
  - Algorithms:
    - `SHA-256` default and recommended general-purpose option.
    - `SHA-384` and `SHA-512` for SHA-2 variants.
    - `SHA-1` as a legacy compatibility option with prominent "not for security" warning.
    - `MD5` as a legacy compatibility/checksum option with prominent "not for security" warning.
  - Output formats: lowercase hex default, uppercase hex toggle, Base64, and Base64URL.
  - Metrics: input characters, UTF-8 bytes, lines, algorithm output bits, output bytes, and output character length.
  - Copy hash, copy summary, copy all visible hashes if the UI shows comparison cards, clear input, download result `.txt`, and privacy-safe share controls.
  - Clear security caveats for SHA-1 and MD5.
  - Exact-text behavior: spaces, line breaks, accents, emoji, and trailing whitespace change the digest because the tool hashes the exact UTF-8 bytes.
- Out of scope:
  - File hashing, streaming large files, drag-and-drop file checksums, folders, binary input, hex-to-bytes input, secret-key HMAC, digital signatures, encryption, password hashing, salt generation, bcrypt/scrypt/Argon2/PBKDF2, token validation, malware scanning, API requests, server-side hashing, saved history, and account favorites.
  - SHA-3/SHAKE in the first build. NIST standardizes SHA-3, but Web Crypto does not expose SHA-3 algorithms in the browser APIs used by this app. Add it later only with a well-tested implementation and explicit source notes.
  - Claims of security compliance, FIPS validation, or suitability for storing passwords.
- Sensitive-topic caveats:
  - Treat pasted text as potentially containing passwords, API keys, tokens, customer data, or proprietary strings.
  - A plain hash is not encryption and is not a password-storage scheme.
  - Hash outputs can still be sensitive for low-entropy inputs because dictionary/brute-force guessing may recover the original text.
  - Browser-only processing reduces intentional server exposure, but clipboard contents, shared links, screenshots, browser extensions, and downloads can still expose input or output.

## Tool Contract

- Inputs:
  - `entrada`: raw textarea content. Hash the exact string after UTF-8 encoding; do not trim, normalize, lowercase, or otherwise transform it.
  - `algoritmo`: one of `sha-256`, `sha-384`, `sha-512`, `sha-1`, or `md5`; default `sha-256`.
  - `formato`: one of `hex`, `base64`, or `base64url`; default `hex`.
  - `maiusculas`: `1` or `0`; default `0`. Applies only to hex output.
  - `conteudo`: optional explicit fragment/hash flag (`1`) that allows `entrada` to be loaded from and included in generated share links.
- Defaults:
  - `entrada` empty.
  - `algoritmo=sha-256`.
  - `formato=hex`.
  - `maiusculas=0`.
  - `conteudo` absent, so default live URLs and default share URLs omit pasted text.
- Validation rules:
  - Empty input shows a neutral "paste text to generate a hash" state, not an error.
  - Enforce a practical text cap such as 1,000,000 JavaScript characters before hashing to avoid browser freezes and full-memory digest pressure.
  - Invalid query or fragment params fall back to defaults without crashing.
  - Use `TextEncoder` for UTF-8 bytes. Do not use legacy binary-string conversion for Unicode text.
  - Use `crypto.subtle.digest` for SHA-1, SHA-256, SHA-384, and SHA-512.
  - Detect missing `window.crypto.subtle` or insecure-context failures and show an unsupported-browser message. Production HTTPS and localhost should work.
  - Implement MD5 as an app-owned pure byte-array helper if MD5 is included. Do not represent MD5 as a secure algorithm; do not silently use a remote service or dynamic network dependency.
  - Keep SHA-1 and MD5 visually marked as legacy/insecure for collision-sensitive or security-critical use.
  - The first build should not auto-normalize Unicode. If later normalization is added, it must be opt-in and make clear that it changes the bytes and hash.
- Outputs:
  - `status`: `empty`, `hashing`, `valid`, `tooLarge`, `unsupported`, or `error`.
  - `hash`: selected digest encoded in the chosen output format.
  - `algorithm`: normalized algorithm id and display label.
  - `securityLevel`: `recommended` for SHA-256/SHA-384/SHA-512, `legacy` for SHA-1/MD5.
  - `inputMetrics`: characters, UTF-8 bytes, and lines.
  - `digestMetrics`: digest bits, digest bytes, and encoded output length.
  - `warnings`: `legacyAlgorithm`, `md5CollisionRisk`, `sha1Retired`, `exactWhitespace`, `inputTooLarge`, `subtleCryptoUnavailable`, or similar stable app-owned codes.
  - Optional comparison table: if shown, compute and display SHA-256, SHA-1, and MD5 labels/results prominently because the DB note calls out those labels. Use the selected algorithm as the primary copy target.
- Result explanations:
  - SHA-256 is the recommended default for general text fingerprints.
  - SHA-1 and MD5 are included for legacy compatibility and checksums, not for security-sensitive verification, signatures, certificates, password storage, or authenticity.
  - Hashing exact text means invisible whitespace, different line endings, and Unicode composition can produce different digests.
  - A hash cannot normally reconstruct the original text, but low-entropy inputs may be guessed.
  - This tool hashes text only; for file integrity use a future file-hash tool.
- URL params:
  - Safe params synced automatically in `window.location.search`: `alg`, `fmt`, and `upper`.
  - Do not put `entrada` or generated `hash` in query params.
  - Explicit content params live only in the URL fragment/hash: `#conteudo=1&entrada=...`.
  - Read `entrada` only from the fragment/hash when `conteudo=1`.
  - Generate `entrada` only inside the explicit share callback when the include-content control is enabled.
  - After loading a content-bearing fragment URL, prefill the textarea client-side and sanitize the live address bar back to safe query params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Provide an explicit "include input in shared link" checkbox or equivalent confirmation.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a fragment length budget such as 1,800 characters. If content is too large, omit `entrada` from the share URL and show a warning.
  - Warn that anyone with a content-bearing link can read the original input.
  - Do not include generated hashes in default share URLs. Hashes of secrets or predictable values can still be sensitive.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input text, generated hashes, or comparison results in localStorage, sessionStorage, cookies, IndexedDB, analytics events, server logs, saved app state, or API requests.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/hash-text.ts` with state defaults, algorithm metadata, UTF-8 encoding, digest execution, output encoders, metrics, URL params, content fragment helpers, and share URL generation.
  - Hash input with `new TextEncoder().encode(input)` so accents, emoji, and other Unicode text are hashed as UTF-8 bytes.
  - For SHA algorithms, call `crypto.subtle.digest(webCryptoName, bytes)` where names are `SHA-1`, `SHA-256`, `SHA-384`, and `SHA-512`.
  - For MD5, implement a deterministic byte-array algorithm from RFC 1321 or isolate a small existing dependency only if the project already has one and the lockfile/licensing tradeoff is acceptable. Prefer an app-owned implementation to avoid dependency churn.
  - Convert digest bytes to hex, Base64, or Base64URL with shared local utilities. Do not use `Uint8Array.prototype.toHex()` as the only path because older supported browsers may not have it.
  - Keep hashing deterministic and independent from React so unit tests can exercise the full contract.
- Data tables or assumptions:
  - No external runtime data tables are required.
  - `SHA-256`, `SHA-384`, `SHA-512`, and `SHA-1` behavior is delegated to the browser Web Crypto implementation.
  - MD5 behavior must be validated with RFC-known vectors and common vectors (`""`, `"abc"`, and `"The quick brown fox jumps over the lazy dog"`).
  - The tool targets textual UTF-8 input, not arbitrary binary bytes.
- Official or authoritative sources:
  - MDN `SubtleCrypto.digest()` docs: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  - W3C Web Cryptography API / Web Cryptography Level 2: https://www.w3.org/TR/webcrypto/
  - WHATWG Encoding Standard for `TextEncoder` and UTF-8 JavaScript API: https://encoding.spec.whatwg.org/
  - NIST FIPS 180-4 Secure Hash Standard: https://csrc.nist.gov/pubs/fips/180-4/upd1/final
  - NIST SHA-1 retirement notice: https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm
  - RFC 1321, The MD5 Message-Digest Algorithm: https://www.rfc-editor.org/rfc/rfc1321
  - RFC 6151, Updated Security Considerations for MD5 and HMAC-MD5: https://www.rfc-editor.org/rfc/rfc6151
  - NIST FIPS 202 SHA-3 Standard: https://csrc.nist.gov/pubs/fips/202/final
  - Codebase source checked on 2026-07-03: route tree, `lib/constants.ts`, `lib/tools`, `components/tools`, `messages/*.json`, `tests/e2e`, and existing tool plans.
- Source access dates:
  - MDN `SubtleCrypto.digest()` checked on 2026-07-03. Page observed last modified 2025-12-28.
  - W3C Web Cryptography Level 2 checked on 2026-07-03. Page observed as First Public Working Draft dated 2025-04-22.
  - WHATWG Encoding Standard checked on 2026-07-03. Page observed last updated 2026-05-21.
  - NIST FIPS 180-4 checked on 2026-07-03. Page date published August 2015; planning note dated 2023-03-07 says NIST decided to revise it.
  - NIST SHA-1 retirement notice checked on 2026-07-03. Notice released 2022-12-15 and observed updated 2026-04-08.
  - RFC 1321 checked on 2026-07-03. RFC date April 1992.
  - RFC 6151 checked on 2026-07-03. RFC date March 2011.
  - NIST FIPS 202 checked on 2026-07-03. Page date published August 2015; planning note dated 2025-03-13 says NIST decided to update it.
  - Codebase checked on 2026-07-03.
- Rule/table effective dates:
  - FIPS 180-4 update 1 is the current NIST Secure Hash Standard page available during planning, published August 2015, with a 2023 revision planning note.
  - SHA-1 transition guidance from NIST says SHA-1 should be phased out by 2030 for remaining uses and migrated to SHA-2/SHA-3 where security is relied on.
  - RFC 1321 defines MD5, but RFC 6151 supersedes its security guidance and states MD5 is not acceptable where collision resistance is required.
  - FIPS 202 defines SHA-3, but this route does not implement SHA-3 in the first build because the selected browser API does not expose it.
- Freshness or maintenance risk:
  - Moderate security-copy freshness risk: NIST is revising FIPS 180-4 and updating FIPS 202. Re-check security wording before major updates or adding SHA-3.
  - Moderate browser-API freshness risk: Web Crypto algorithm support can evolve; current browser-facing docs expose SHA-1/SHA-2 digests but not MD5/SHA-3.
  - Low digest-output risk for SHA-2 with Web Crypto because browser implementations are mature.
  - Moderate implementation risk for MD5 if implemented locally. Keep the code small, byte-oriented, and covered by known vectors.
  - Moderate performance risk for large pasted text because `SubtleCrypto.digest()` does not stream; it digests data already in memory. Keep a client-side cap.
- Estimator or privacy limitations:
  - Hash generation is exact, not an estimate.
  - The tool does not certify security, prove authenticity, verify files, sign messages, or validate whether a digest is trustworthy.
  - Browser-only processing reduces server exposure but cannot protect against compromised browsers, extensions, clipboard managers, screenshots, explicit content-bearing links, or users pasting secrets.
  - SHA-1 and MD5 outputs must not be described as secure for collision-resistant uses.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de Hash`
  - PT-BR meta title: `Gerador de hash online`
  - PT-BR description: `Gere SHA-256, SHA-512, SHA-1 e MD5 de texto no navegador, com avisos de seguranca para algoritmos legados.`
- Main form sections:
  - Textarea for input with browser-only privacy note and exact-text warning.
  - Algorithm selector with recommended group (`SHA-256`, `SHA-384`, `SHA-512`) and legacy group (`SHA-1`, `MD5`).
  - Output format selector: `Hex`, `Base64`, and `Base64URL`.
  - Uppercase hex toggle.
  - Share/privacy section with default safe link and explicit include-content option.
- Results sections:
  - Primary digest card for selected algorithm and format.
  - Security/caveat card that changes by algorithm.
  - Optional comparison cards for SHA-256, SHA-1, and MD5 to satisfy common `gerador de hash` expectations while keeping SHA-256 primary.
  - Metrics for input characters, UTF-8 bytes, lines, digest bits, digest bytes, and output length.
  - Actions: copy hash, copy summary, copy all visible hashes, download `.txt`, clear input.
  - Empty, hashing, too-large, unsupported-browser, and generic error states.
- SEO sections:
  - What a hash generator does.
  - Difference between hash, encoding, and encryption.
  - SHA-256 vs SHA-1 vs MD5.
  - Why exact whitespace and Unicode bytes matter.
  - Why this is not password hashing.
  - Privacy of browser-only hashing and share links.
- FAQ topics:
  - `O texto e enviado para o servidor?`
  - `Qual algoritmo devo escolher?`
  - `MD5 ou SHA-1 ainda sao seguros?`
  - `Hash e a mesma coisa que criptografia?`
  - `Posso usar isto para senhas?`
  - `Por que meu hash mudou com espacos, quebras de linha ou acentos?`
  - `Posso compartilhar um texto ja preenchido?`
  - `A ferramenta calcula hash de arquivos?`
- Disclaimer or privacy copy:
  - The digest is generated in the browser from the exact text entered.
  - Do not paste passwords, tokens, private keys, customer data, or confidential text unless the local browser context is trusted.
  - MD5 and SHA-1 are legacy algorithms and should not be used where collision resistance or modern security is required.
  - This tool is not a password hasher, HMAC generator, digital signature tool, or compliance-certified cryptographic module.
- Related tool links:
  - Existing: `/dev`, `/dev/conversor-base64`, `/dev/formatador-json`, `/dev/regex-tester`, `/geradores/senha`, `/geradores/uuid`, `/texto/contador-caracteres`.
  - Future candidates: `/dev/url-encode-decode`, `/dev/jwt-decoder`, `/dev/hmac`, `/dev/hash-arquivo`, `/dev/sha3`, and `/dev/verificador-checksum` if those rows are later claimed.
- Translation guidance:
  - Add `toolCategories.hashes` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested category names: PT-BR `Hashes`; EN `Hashes`; ES `Hashes`.
  - Add `tools.hash-texto` keys for title, description, metadata, form labels, algorithm groups, output formats, result labels, status messages, warnings, validation errors, metrics, actions, share/privacy warnings, SEO sections, and FAQ content.
  - Suggested tool names: PT-BR `Gerador de Hash`; EN `Hash Generator`; ES `Generador de hash`.
  - Translate "hash" consistently as a technical term; avoid implying encryption. Use localized explanatory copy for `digest`, `fingerprint`, and `checksum` where needed.
  - Keep route slug `/dev/hash-texto` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/hash-text.ts` with algorithm metadata, state defaults, TextEncoder byte conversion, Web Crypto digest adapter, MD5 helper, output encoders, metrics, safe search params, content fragment/hash helpers, and share URL builder.
  - Add `lib/tools/hash-text.test.ts` with deterministic unit coverage for empty input, SHA-256/SHA-384/SHA-512/SHA-1 known vectors, MD5 known vectors, Unicode text, line endings, output formats, uppercase hex, too-large guard, unsupported crypto branch, URL params, and content-fragment sharing.
  - Keep helper APIs independent from React.
- URL state:
  - Sync only safe settings to live query params: `alg`, `fmt`, and `upper`.
  - Read `entrada` only from `#conteudo=1&entrada=...`.
  - Generate content-bearing links only from the explicit share callback and only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing hash.
  - Add a fragment length budget and visible too-long warning.
- UI components:
  - Create `components/tools/dev/hash-text-client.tsx` or equivalent.
  - Follow the JSON/Base64 privacy pattern and existing UI primitives.
  - Use lucide icons for hash/fingerprint, copy, download, clear, shield/warning, and success states. Verify availability before importing.
  - Keep textareas and digest output stable, responsive, and horizontally safe for long SHA-512 hex strings.
  - Add accessible labels and stable test ids for input, algorithm controls, output format controls, uppercase toggle, result output, legacy warning, metrics, copy buttons, clear, download, include-content control, share button, and FAQ/SEO sections.
- Route and metadata:
  - Add `app/[locale]/dev/hash-texto/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "hash-texto")`.
  - Reuse existing `app/[locale]/dev/page.tsx`.
- Registry/family/category:
  - Reuse existing `dev` family.
  - Add `hashes` to `ToolCategoryId`, `toolCategories`, visible category translations, sitemap/category routes, and constants tests.
  - Add `hash-texto` to `tools` with `available: true`, `familyId: "dev"`, `primaryCategoryId: "hashes"`, `categoryIds: ["hashes"]`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"` or `SecurityApplication`.
  - Use `Fingerprint` if available, or a nearby lucide security/code icon already present.
- Messages:
  - Add PT-BR, EN, and ES translations for category, tool metadata, form, algorithms, output formats, statuses, warnings, metrics, copy/download/share actions, privacy guidance, SEO text, and FAQ content.
  - Keep SHA-1 and MD5 caveats prominent and localized.
- Unit tests:
  - Cover digest vectors:
    - `SHA-256("")` -> `e3b0c442...b855`.
    - `SHA-256("abc")` -> `ba7816bf...15ad`.
    - `SHA-1("abc")` -> `a9993e36...d89d`.
    - `MD5("")` -> `d41d8cd98f00b204e9800998ecf8427e`.
    - `MD5("abc")` -> `900150983cd24fb0d6963f7d28e17f72`.
  - Cover accents/emoji with UTF-8 metrics.
  - Cover exact whitespace/line endings producing different hashes.
  - Cover Base64/Base64URL output and uppercase hex.
  - Cover query param normalization and hash-fragment content sharing.
- E2E hooks/tests:
  - Add `tests/e2e/hash-text.spec.ts` or equivalent focused spec.
  - Assert PT-BR route load, input hashing, SHA-256 default vector, MD5/SHA-1 legacy warnings, copy actions, output format switching, safe live URL, default share without input/hash, explicit hash-fragment content share, hydration/sanitization, no save/favorites UI, directory/category visibility, sitemap exposure, EN/ES smoke routes, mobile no-overflow, and clean non-auth console/page errors.
- Backlog updates:
  - Do not update the DB directly in planner/creator.
  - Orchestrator should run the appropriate backlog script after planning to record decision `new`, target route, and plan path.

## Test Plan

- Unit scenarios:
  - Known vectors for SHA-2, SHA-1, and MD5.
  - Empty input neutral state.
  - Unicode text hashed as UTF-8.
  - Exact whitespace and line-ending differences.
  - Hex lowercase/uppercase, Base64, and Base64URL encoders.
  - Legacy warning metadata for MD5 and SHA-1.
  - Input cap and unsupported Web Crypto branches.
  - Query/search param normalization and explicit fragment sharing.
- URL-state scenarios:
  - `?alg=sha-512&fmt=base64&upper=1` restores safe settings.
  - Invalid `alg`, `fmt`, or `upper` values fall back to defaults.
  - Default live URL and default share URL never include `entrada` or generated hash.
  - Explicit content share uses `#conteudo=1&entrada=...`.
  - Loading a content-bearing fragment prefills input and sanitizes the live URL.
  - Oversized content share omits `entrada` and shows a warning.
- Browser scenarios:
  - `/dev/hash-texto` renders title, input, algorithm selector, output format controls, primary hash result, warnings, metrics, privacy note, share controls, SEO copy, and FAQ.
  - SHA-256 default for `abc` displays the expected hex digest.
  - Switching to MD5 and SHA-1 displays expected digest plus visible legacy/security warning.
  - Copy hash, copy summary, clear, download, and share actions work.
  - No SaveButton/favorites/account storage path is visible.
  - No input or digest appears in localStorage, sessionStorage, cookies, IndexedDB, fetch requests, analytics URLs, or default share URLs during manual privacy checks.
  - Mobile viewport around 390px has no horizontal overflow from long hashes.
- Playwright scenarios:
  - Focused PT-BR route test for SHA-256, MD5, warnings, copy/share, explicit content fragment, and hydration sanitization.
  - EN/ES smoke routes to confirm localized metadata/headings and no missing translation keys.
  - Directory/category tests for `/dev`, `/dev/categorias/hashes`, `/ferramentas`, and sitemap inclusion if existing e2e conventions cover sitemap.
  - Console/page-error guard filtering only known auth noise if present.
- Lint/build commands:
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/hash-text.test.ts lib/constants.test.ts`
  - Message JSON parse/key parity check for `tools.hash-texto` and `toolCategories.hashes`.
  - Targeted ESLint for new route/client/helper/test files.
  - `./node_modules/.bin/tsc --noEmit`
  - `pnpm build` or direct Next build with placeholder DB env if the project still requires `DATABASE_URL`.
  - `pnpm run test:e2e -- tests/e2e/hash-text.spec.ts` in a browser-capable environment.
  - `git diff --check`
- Acceptance criteria:
  - Route is `/dev/hash-texto`.
  - Tool is discoverable in `dev` and `hashes` category listings and sitemap.
  - SHA-256 is default and recommended.
  - SHA-1 and MD5 are present only with clear legacy/insecure caveats.
  - Pasted input and generated hashes are never sent to the server or stored by app code.
  - Default URL/share behavior contains only safe settings.
  - Explicit content sharing is hash-fragment-only, budgeted, and sanitized after hydration.
  - No save/favorites behavior is added.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, typecheck, build, and whitespace checks pass or blockers are documented.

## Implementation Notes

- Status updates:
  - 2026-07-03: Planned as decision `new` for `/dev/hash-texto`. App code was read-only during planning.
  - 2026-07-03: Implemented browser-only text hashing route with SHA-2/SHA-1 via Web Crypto, local MD5, safe query state, explicit hash-fragment content sharing, localized copy, registry/category wiring, unit tests, and focused Playwright coverage. DB row remains `In Progress` stage `implementation` until orchestrator review/tester gates pass.
  - 2026-07-03: Independent tester validation passed for `/dev/hash-texto`, `/en/dev/hash-texto`, and `/es/dev/hash-texto`. Tester changed only `tests/e2e/hash-text.spec.ts` and this plan, adding stronger async Web Crypto stability, privacy leakage, discovery, and non-auth console coverage.
  - 2026-07-03: Draft PR opened at https://github.com/saulodefaria/calculaderia/pull/44 for final review.
- Files changed:
  - `docs/tool-plans/hash-texto.md`
  - `lib/tools/hash-text.ts`
  - `lib/tools/hash-text.test.ts`
  - `components/tools/dev/hash-text-client.tsx`
  - `app/[locale]/dev/hash-texto/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/hash-text.spec.ts`
- Validation results:
  - 2026-07-03: `git diff --check --no-index /dev/null docs/tool-plans/hash-texto.md` produced no whitespace warnings; exit code 1 is expected for a new-file no-index diff.
  - 2026-07-03: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/hash-text.test.ts lib/constants.test.ts` passed (2 files, 16 tests).
  - 2026-07-03: Message JSON parse/key check for `tools.hash-texto` and `toolCategories.hashes` passed for PT-BR, EN, and ES.
  - 2026-07-03: `./node_modules/.bin/eslint lib/tools/hash-text.ts lib/tools/hash-text.test.ts components/tools/dev/hash-text-client.tsx 'app/[locale]/dev/hash-texto/page.tsx' tests/e2e/hash-text.spec.ts lib/constants.ts` passed.
  - 2026-07-03: `./node_modules/.bin/tsc --noEmit` passed.
  - 2026-07-03: DB row read through `scripts/backlog/get_item.sql` with `AGENT_BACKLOG_DATABASE_URL` from the project `.env`: `kind=tool`, `slug=hash-texto`, `status=In Progress`, `stage=testing`, `targetRoute=/dev/hash-texto`, `planPath=docs/tool-plans/hash-texto.md`.
  - 2026-07-03: `./node_modules/.bin/eslint tests/e2e/hash-text.spec.ts` passed after tester-only e2e edits.
  - 2026-07-03: `git diff --check -- tests/e2e/hash-text.spec.ts` passed after tester-only e2e edits.
  - 2026-07-03: `pnpm run test:e2e -- tests/e2e/hash-text.spec.ts` did not reach Playwright because the local pnpm runtime aborted a non-TTY modules purge with `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY]`.
  - 2026-07-03: `node scripts/clean-e2e-next-cache.mjs` passed.
  - 2026-07-03: Sandboxed direct Playwright command `NEXT_DIST_DIR=.next-e2e PORT=3198 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3198" ./node_modules/.bin/playwright test tests/e2e/hash-text.spec.ts` reached Chromium launch but failed with `MachPortRendezvousServer... Permission denied (1100)`, matching the known macOS sandbox issue.
  - 2026-07-03: Elevated direct Playwright command `NEXT_DIST_DIR=.next-e2e PORT=3198 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3198" ./node_modules/.bin/playwright test tests/e2e/hash-text.spec.ts` passed (6 Chromium tests).
  - 2026-07-03: Repeat `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/hash-text.test.ts lib/constants.test.ts` passed (2 files, 16 tests).
  - 2026-07-03: `lsof -nP -iTCP:3198 -sTCP:LISTEN` returned no listener after the Playwright run, confirming the dev server was stopped.
- Tester findings:
  - Pass: SHA-256 is the default and `abc` produces `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`.
  - Pass: rapid `a` -> `ab` -> `abc` input changes leave the async Web Crypto SHA-256 output stable after settling.
  - Pass: MD5 and SHA-1 produce expected `abc` digests and show visible legacy/security warnings.
  - Pass: live URL state contains only `alg`, `fmt`, and `upper`; no `entrada`, `conteudo`, generated `hash`, or fragment is present by default.
  - Pass: default share URL omits input and generated hash; explicit content share puts input only in `#conteudo=1&entrada=...`; oversized explicit content omits `entrada` and warns.
  - Pass: fragment hydration prefills input and sanitizes the address bar back to safe query params.
  - Pass: no SaveButton/favorites action is visible in the tool UI.
  - Pass: input and generated hashes were not found in localStorage, sessionStorage, cookies, IndexedDB database names, captured request URLs/bodies, or default share URLs.
  - Pass: `/ferramentas`, `/dev`, `/dev/categorias/hashes`, sitemap, `/en/dev/hash-texto`, and `/es/dev/hash-texto` discovery/localized routes are covered.
  - Pass: 390px mobile viewport has no horizontal overflow with long hash output.
  - Pass: no page errors or non-auth console errors were observed. The e2e guard filters only the known Auth.js `ClientFetchError` session-fetch noise.
  - DB handoff: tester did not update the DB. The row remains `In Progress` stage `testing`; orchestrator can finalize the passed tester gate and advance the item during PR/finalization.
- Final status:
  - `verified`
- Draft PR:
  - https://github.com/saulodefaria/calculaderia/pull/44
