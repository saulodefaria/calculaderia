---
slug: "jwt-decoder"
familyId: "dev"
primaryCategoryId: "codificacao"
backlogRank: 18
primaryKeyword: "jwt decoder"
decision: "new"
targetRoute: "/dev/jwt-decoder"
status: "verified"
createdAt: "2026-07-04"
updatedAt: "2026-07-04"
---

# JWT Decoder Plan

## Backlog Row

- Rank: 18
- Original status: `In Progress`
- Claimed stage: `implementation`
- Branch: `codex/jwt-decoder-tool`
- Slug: `jwt-decoder`
- Primary keyword: `jwt decoder`
- Cluster keywords: Not provided in the claimed item JSON.
- Family/category: backlog family hint `dev`; planned family `dev`; planned category `codificacao`
- Opportunity score: Not provided in the claimed item JSON; row selection was already done by the orchestrator.
- Idea type: `New`
- Notes: Not provided in the claimed item JSON.
- Done ref: Not provided in the claimed item JSON.
- Plan path: `docs/tool-plans/jwt-decoder.md`
- Target route: `/dev/jwt-decoder`
- Claim owner: `019f2d15-1837-70f3-9c3e-b4852c33ba3d`
- Claim expires at: `2026-07-06T00:24:05.265708+00:00`

## Decision

- Decision: `new`
- Status: `in_progress`
- Target route: `/dev/jwt-decoder`
- Rationale: Build a new browser-only developer utility for decoding and inspecting JWT compact tokens. The current repo has developer tools for JSON formatting, Base64/Base64URL conversion, and JavaScript regex testing, but no route, registry entry, helper module, UI component, translation namespace, e2e spec, or plan for JWT token inspection. JWT decoding is related to Base64URL and JSON, but users expect JWT-specific token-part parsing, registered-claim explanations, NumericDate rendering, and strong warnings that decoded claims are not verified or trusted.

## Similarity Check

- Existing routes checked:
  - Generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current family routes under `app/[locale]`: `dev`, `geradores`, `validadores`, `matematica`, `datas`, `texto`, and `cores`.
  - Current dev routes in this worktree: `app/[locale]/dev/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, `app/[locale]/dev/conversor-base64/page.tsx`, and `app/[locale]/dev/regex-tester/page.tsx`.
  - No `/dev/jwt-decoder` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `dev`.
  - Current dev categories are `dados-estruturados`, `expressoes-regulares`, and `codificacao`.
  - Use existing category `codificacao` for this first build because JWT compact tokens are URL-safe Base64URL parts containing JSON. Do not add a new category unless later backlog volume justifies a broader `tokens` or `seguranca-dev` category.
  - No `jwt-decoder` tool entry exists in `tools`.
- Related modules/translations checked:
  - `lib/tools/base64.ts` already implements browser-side Base64/Base64URL decoding, UTF-8 byte handling, safe query helpers, and fragment helpers for the Base64 converter.
  - `lib/tools/json.ts` already implements JSON parse/format patterns and stable error shaping for the JSON formatter.
  - `components/tools/dev/base64-converter-client.tsx`, `components/tools/dev/json-formatter-client.tsx`, and `components/tools/dev/regex-tester-client.tsx` provide the closest developer-tool UI and privacy patterns.
  - `components/tools/url-state.ts` provides generic search-param helpers, but JWT token input should not be synced into query or hash state in the first build.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have dev family/category/tool keys for JSON, Base64, and regex, but no JWT decoder namespace.
- Prior plans checked:
  - `docs/tool-plans/formatador-json.md`
  - `docs/tool-plans/conversor-base64.md`
  - `docs/tool-plans/regex-tester.md`
  - Other available non-calculator plans in `docs/tool-plans` for route/category/message/test conventions.
  - Available calculator plans in `docs/calculator-plans` only for plan-format consistency.
  - No duplicate `jwt-decoder` plan exists in `docs/tool-plans` or `docs/calculator-plans`.
- Text search checked:
  - `jwt`, `JWT`, `json web token`, `token`, `base64`, `base64url`, `conversor-base64`, `formatador-json`, `regex-tester`, `dev`, `share`, and `url-state` across `app/[locale]`, `components/tools`, `lib`, `messages`, `docs/tool-plans`, `docs/calculator-plans`, and `tests`.
- Overlap conclusion:
  - Build a new route at `/dev/jwt-decoder`.
  - Keep this separate from `/dev/conversor-base64` because JWT decoding needs compact-token part splitting, JOSE header handling, registered-claim interpretation, NumericDate rendering, and trust warnings.
  - Keep this separate from `/dev/formatador-json` because users paste a JWT compact string, not arbitrary JSON.
  - Keep this separate from `/dev/regex-tester` because regex testing is unrelated beyond developer audience.
  - Automation memory records prior work on `/dev/hash-texto`; keep that separate because hashing text is not JWT decoding or token inspection.
  - A future JWT verifier, JWKS inspector, OAuth token introspection tool, or JWE decryptor should be separate unless product requirements explicitly expand this route.

## User Intent And Scope

- Target user: Developers, QA analysts, support engineers, API integrators, students, and technical writers who need to inspect a JWT-like token locally without uploading it.
- User job: Paste a JWT, see the decoded JOSE header and claims payload, understand common registered claims and time-based status, copy decoded JSON, and know clearly that the token has not been verified.
- In scope:
  - Browser-only parsing of compact JWS-style JWTs with three period-separated parts: header, payload, and signature.
  - Optional paste normalization for a leading `Bearer ` prefix, with a visible warning that the prefix was ignored.
  - Base64URL decoding of the protected header and payload with UTF-8 decoding and strict JSON parsing.
  - Pretty-printed decoded header JSON and payload JSON.
  - Compact/raw segment metadata: part count, encoded segment lengths, decoded byte counts, signature segment present/empty, and detected token type (`JWS`, unsecured JWS, or unsupported `JWE`).
  - Registered JWT claim explanations for `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, and `jti`.
  - Time interpretation for NumericDate claims using the browser's current time, rendered as UTC ISO plus localized display when useful.
  - Warnings for expired tokens, `nbf` in the future, `iat` in the future, non-numeric time claims, `alg=none`, missing `alg`, missing/ambiguous `typ`, `crit` header presence, and any claim/header parsing limitation.
  - Copy actions for decoded header JSON, decoded payload JSON, and a short diagnostic summary.
  - Clear/reset action and optional "load safe example" action that uses a non-secret sample token.
  - Strong privacy copy that token input stays in the browser and is never intentionally saved or sent to the server.
- Out of scope:
  - Signature verification, HMAC/secret input, public-key verification, JWKS fetching, OAuth introspection, token revocation checks, audience/issuer trust decisions, authorization advice, token generation, token signing, token refresh, JWE decryption, nested JWT processing beyond detection, file upload, saved history, account favorites, server-side parsing, and analytics capture of token content.
  - Claiming that a decoded token is valid, authentic, safe, unexpired for a specific service, or acceptable for production authentication.
- Sensitive-topic caveats:
  - A JWT can be an active bearer credential. Treat the entire token, decoded claims, and copied output as sensitive.
  - Decoding is not verification. Anyone can alter an unsigned or incorrectly verified token; only the application with the right keys and policy can decide trust.
  - JWS payloads are encoded, not encrypted. Anyone with the token can decode visible header and payload claims.
  - JWE payloads are encrypted; this first build must not imply it can decrypt them.

## Tool Contract

- Inputs:
  - `token`: textarea value containing a bare JWT compact token or `Bearer <token>`.
  - `nowMs`: optional pure-helper dependency for tests; UI uses current browser time for claim status and can expose a refresh-current-time action.
  - `loadExample`: UI action only, not a URL param, for loading a safe synthetic token.
- Defaults:
  - `token` empty.
  - Reference time is the current browser time at processing/render time.
  - No query params are read for token content.
  - No hash/fragment params are read for token content.
  - No include-token-in-share option in the first build.
- Validation rules:
  - Empty input shows a neutral "paste a JWT" state, not an error.
  - Trim leading/trailing ASCII whitespace.
  - If the input starts with case-insensitive `Bearer ` followed by one token-shaped value, parse the value and return a `bearerPrefixIgnored` warning.
  - Reject inputs with internal whitespace, newlines inside the token, multiple bearer values, or surrounding HTTP header text beyond the optional simple prefix.
  - Enforce a practical client-side size cap such as 20,000 characters to avoid UI freezes and accidental huge-token handling.
  - Split on literal `.` characters.
  - Part count `3` is the normal compact JWS/JWT path.
  - Part count `5` should return `unsupportedJwe` after decoding the protected header when possible; explain that encrypted JWT payloads cannot be decoded without decryption keys.
  - Any other part count returns `invalidPartCount`.
  - Header and payload segments must be non-empty for the 3-part path.
  - Signature segment may be empty only when the header declares `alg: "none"`; show an unsecured-token warning. If signature is empty with another `alg`, show a strong warning.
  - Decode header and payload using Base64URL rules. Missing padding may be inferred. Standard Base64-only characters (`+`, `/`) should be rejected. Trailing `=` padding may be accepted only as non-standard input with a warning, or rejected consistently if the helper stays strict; document the chosen behavior in tests.
  - Decode Base64URL bytes as UTF-8 using fatal decoding. Invalid bytes return a stable `invalidUtf8` error.
  - Parse decoded header and payload with `JSON.parse`.
  - Header must parse to a JSON object.
  - Payload must parse to a JSON object for JWT claim interpretation. If a JWS payload is valid JSON but not an object, report `invalidPayloadShape` for JWT mode rather than pretending it is a claims set.
  - Invalid query, hash, or unknown URL params must never prefill token input and should be sanitized from the visible URL when the client hydrates.
- Outputs:
  - `status`: `empty`, `valid`, `unsupportedJwe`, `invalidPartCount`, `invalidBase64url`, `invalidUtf8`, `invalidJson`, `invalidHeaderShape`, `invalidPayloadShape`, or `tooLarge`.
  - `tokenKind`: `jws`, `unsecuredJws`, `jweUnsupported`, or `unknown`.
  - `parts`: array metadata for header, payload, signature, and JWE-only parts when detected.
  - `headerJson`: decoded header value as an object when valid.
  - `payloadJson`: decoded claims object when valid.
  - `formattedHeader`: pretty JSON string for copy/display.
  - `formattedPayload`: pretty JSON string for copy/display.
  - `registeredClaims`: normalized rows for `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, and `jti` when present.
  - `timeClaims`: UTC ISO/local render/status for NumericDate claims; include seconds value and relative status.
  - `algorithmInfo`: value of `alg`, broad family label when known (`HMAC`, `RSA`, `ECDSA`, `RSA-PSS`, `none`, `unknown`), and a "not verified" note.
  - `warnings`: stable warning codes such as `notVerified`, `bearerPrefixIgnored`, `algNone`, `missingAlg`, `emptySignature`, `nonStandardPadding`, `expired`, `notYetValid`, `issuedInFuture`, `invalidNumericDate`, `critNotInterpreted`, `jweHeaderOnly`, and `payloadVisibleNotEncrypted`.
  - `error`: stable app-owned error code plus localized explanation and optional diagnostic location/part name. Do not show raw exceptions as the primary message.
- Result explanations:
  - Always show that the tool decodes only and does not verify the signature.
  - Explain that `exp`, `nbf`, and `iat` are NumericDate seconds from the Unix epoch in UTC.
  - Explain that `aud` may be a string or an array.
  - Explain that `iss`, `sub`, and `jti` are strings whose meaning depends on the issuing system.
  - Explain that `alg=none` means an unsecured JWT and must not be accepted unless a system is specifically designed for it.
  - Explain that `kid`, `typ`, `cty`, and `crit` are header values, not proof of trust.
  - Explain that a valid-looking decoded payload can still be forged or stale without verification.
- URL params:
  - First build should have no live query params for token state.
  - Do not accept `token`, `jwt`, `entrada`, `conteudo`, `header`, `payload`, or similar content params from `window.location.search`.
  - Do not accept token content from `window.location.hash`.
  - If a user lands on `/dev/jwt-decoder?token=...` or `#token=...`, ignore the token and sanitize the URL back to the route path after hydration.
  - If the creator needs a registry `stateMode`, prefer `stateMode: "none"` because the first build has no safe durable state. If existing registry assumptions make `query` necessary, keep generated query params empty and test that no token-like value is emitted.
- Share behavior:
  - Default share copies only the route URL, with no token, no decoded header, and no decoded payload.
  - Do not add an "include token in shared link" checkbox in the first build. JWTs are commonly bearer credentials, and the safer first version should avoid token-bearing URLs even in fragments.
  - Copy actions may copy decoded JSON to the clipboard only after the user clicks a copy button.
  - Warn that screenshots, clipboard contents, and manually shared decoded JSON can expose claims or credentials.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store token input, decoded header, decoded payload, warnings, or errors in localStorage, sessionStorage, IndexedDB, cookies, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/jwt.ts` with state defaults, tokenizer, Base64URL byte decode, UTF-8 decode, JSON parse, claim normalization, NumericDate analysis, warning/error codes, and copyable formatted outputs.
  - Reuse or extract shared Base64URL behavior from `lib/tools/base64.ts` only if it stays independent of the Base64 converter UI state. Do not couple JWT parsing to `Base64ConverterState`.
  - Use `TextDecoder("utf-8", { fatal: true })` to reject malformed UTF-8 bytes.
  - Use `JSON.parse` and `JSON.stringify(value, null, 2)` for strict JSON parsing and deterministic display.
  - For 3-part compact JWS, decode header and payload only. Do not verify the signature.
  - For 5-part compact JWE, decode the protected header if possible and return an unsupported/decryption-required result. Do not attempt to decode encrypted key, IV, ciphertext, or tag as plaintext.
  - NumericDate display should treat values as seconds since `1970-01-01T00:00:00Z`, allowing finite numeric values including fractional seconds if present.
  - Use an injected `nowMs` option in unit tests so `exp`, `nbf`, and `iat` statuses are deterministic.
  - Keep all parsing deterministic and independent from React.
- Data tables or assumptions:
  - No external data tables are required.
  - Known JWS `alg` labels can be grouped from RFC 7518 for user-friendly display, but the tool must not decide whether an algorithm is acceptable for a specific application.
  - First-build algorithm labels may include `none`, `HS256`, `HS384`, `HS512`, `RS256`, `RS384`, `RS512`, `ES256`, `ES384`, `ES512`, `PS256`, `PS384`, and `PS512`; unknown labels should remain visible as unknown, not rejected solely by label.
  - Claims outside the registered set should be displayed as custom/private claims without interpretation.
  - Timezone display is explanatory only; JWT NumericDate is UTC-based.
- Official or authoritative sources:
  - RFC 7519, "JSON Web Token (JWT)", published May 2015: https://www.rfc-editor.org/rfc/rfc7519
  - RFC 7515, "JSON Web Signature (JWS)", published May 2015: https://www.rfc-editor.org/rfc/rfc7515
  - RFC 7518, "JSON Web Algorithms (JWA)", published May 2015: https://www.rfc-editor.org/rfc/rfc7518
  - RFC 8725, "JSON Web Token Best Current Practices", published February 2020: https://www.rfc-editor.org/rfc/rfc8725
  - WHATWG Encoding Standard for browser `TextDecoder`/UTF-8 behavior, living standard last updated 2026-05-21 when checked: https://encoding.spec.whatwg.org/
  - OWASP JSON Web Token for Java Cheat Sheet for common JWT security issues and warning copy: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
  - Codebase source checked on 2026-07-04: routes, `lib/constants.ts`, `lib/tools`, `components/tools`, URL-state helper, messages, tests, tool plans, calculator plans, and automation memory.
- Source access dates:
  - RFC 7519 checked on 2026-07-04.
  - RFC 7515 checked on 2026-07-04.
  - RFC 7518 checked on 2026-07-04.
  - RFC 8725 checked on 2026-07-04.
  - WHATWG Encoding Standard checked on 2026-07-04.
  - OWASP JWT cheat sheet checked on 2026-07-04.
  - Codebase checked on 2026-07-04.
- Rule/table effective dates:
  - RFC 7519, RFC 7515, and RFC 7518 were published in May 2015.
  - RFC 8725 was published in February 2020 and updates JWT security guidance.
  - WHATWG Encoding is a living standard; record access date in this plan.
- Freshness or maintenance risk:
  - Low for compact JWT/JWS part structure, Base64URL decoding, and NumericDate semantics.
  - Moderate for JWT best-practice/security wording because operational guidance can evolve; revisit if this route grows into verification or OAuth-specific advice.
  - Moderate for algorithm registry labels because new algorithms can appear; show unknown labels gracefully.
  - Moderate for browser `TextDecoder` support only if project browser support changes.
- Estimator or privacy limitations:
  - This is exact decoding for compact tokens, not an estimate.
  - The tool does not validate cryptographic operations, key material, issuer, audience, revocation, authorization, user identity, or server acceptance.
  - Browser-only processing reduces intentional server exposure, but the token can still be exposed through clipboard use, screenshots, browser extensions, crash reports, manual sharing, or developer tools.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `JWT Decoder`
  - PT-BR meta title: `JWT decoder online`
  - PT-BR description: `Decodifique header e payload de JWT no navegador, veja claims, datas e avisos de seguranca sem enviar o token ao servidor.`
  - EN title: `JWT Decoder`
  - ES title: `JWT Decoder`
- Main form sections:
  - Token textarea with placeholder for a JWT compact token and a visible browser-only privacy note.
  - Primary actions: decode happens live or on paste, clear, load safe example, copy diagnostic summary.
  - Status banner that always includes "decoded, not verified" when a token parses.
  - Share/privacy row with default route-only share and explicit note that token-bearing links are not supported in this first build.
- Results sections:
  - Structure summary: token kind, part count, segment lengths, Base64URL status, signature segment present/empty, and unsupported JWE detection.
  - Header JSON panel with copy action.
  - Payload/claims JSON panel with copy action.
  - Registered claims table with labels, raw values, decoded date values for NumericDate claims, and short explanations.
  - Time status cards for `exp`, `nbf`, and `iat`: expired/valid/not-yet-valid/issued-in-future/unknown.
  - Warnings panel for `alg=none`, missing `alg`, unverified signature, non-standard padding, unsupported JWE, `crit` not interpreted, and invalid claim shapes.
  - Error panel with part-specific diagnostics for invalid Base64URL, invalid UTF-8, invalid JSON, wrong part count, and oversized input.
- SEO sections:
  - What a JWT decoder does.
  - Header, payload, and signature parts explained.
  - Difference between decoding and verifying.
  - What `exp`, `nbf`, `iat`, `iss`, `sub`, `aud`, and `jti` mean.
  - Why JWT payloads are visible and should not contain secrets unless encrypted.
  - Why this tool does not verify signatures or fetch JWKS.
- FAQ topics:
  - `O token e enviado para o servidor?`
  - `Decodificar um JWT valida a assinatura?`
  - `O que significam header, payload e signature?`
  - `Como interpretar exp, nbf e iat?`
  - `Por que alg=none e perigoso?`
  - `Por que nao consigo decodificar um JWE?`
  - `Posso compartilhar um JWT preenchido?`
- Disclaimer or privacy copy:
  - The decoder runs in the browser and should not intentionally send token input to the server.
  - Do not paste production access tokens unless you understand the risk.
  - Decoded claims are not proof of identity, authorization, freshness, or signature validity.
  - This tool does not replace server-side JWT validation.
- Related tool links:
  - Existing in this worktree: `/dev`, `/dev/conversor-base64`, `/dev/formatador-json`, `/dev/regex-tester`, `/texto/contador-caracteres`.
  - Prior automation memory: `/dev/hash-texto` is a separate hash utility if/when present on the branch.
  - Future candidates: `/dev/jwt-verifier`, `/dev/jwks-inspector`, `/dev/url-encode-decode`, `/dev/uuid`, `/dev/cron-parser`, `/dev/conversor-csv-json`.
- Translation guidance:
  - Add `tools.jwt-decoder` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Keep technical tokens recognizable across locales: `JWT`, `JWS`, `JWE`, `JOSE`, `Base64URL`, `header`, `payload`, `signature`, `claim`, `NumericDate`, `alg`, `kid`, `typ`, `cty`, `crit`, `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, and `jti`.
  - Suggested PT-BR tool name: `JWT Decoder` or `Decodificador JWT`; prefer `JWT Decoder` if keyword alignment matters.
  - Suggested EN tool name: `JWT Decoder`.
  - Suggested ES tool name: `JWT Decoder` or `Decodificador JWT`; prefer `JWT Decoder` if keyword alignment matters.
  - Translate form labels, actions, statuses, warning codes, error codes, claim descriptions, time-status labels, copy feedback, privacy notices, SEO sections, and FAQ content.
  - Existing `toolCategories.codificacao` copy can remain, but may need a small wording update from "Base64, Base64URL" to "Base64, Base64URL, JWT and other encoding/token formats" if product wants category text to mention JWT.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/jwt.ts` with parser types, default state, error/warning unions, Base64URL decode helpers, UTF-8 decode helpers, JSON formatting, registered-claim normalization, NumericDate helpers, and deterministic `processJwtDecoder(state, { nowMs })`.
  - Add `lib/tools/jwt.test.ts` with focused deterministic tests.
  - Consider extracting a shared low-level Base64URL decoder from `lib/tools/base64.ts` only if it remains UI-agnostic.
- URL state:
  - Do not read token content from query or hash.
  - Do not write token content, decoded JSON, warnings, or errors to query or hash.
  - Sanitize route URL when token-like query/hash params are present.
  - Keep default share route-only.
- UI components:
  - Create `components/tools/dev/jwt-decoder-client.tsx`.
  - Use existing UI primitives and lucide icons such as `Fingerprint`, `Code2`, `ShieldCheck`, `AlertTriangle`, `Copy`, `Trash2`, and `RefreshCw` if available.
  - Use stable responsive dimensions for token textarea, JSON panels, claim tables, and warning panels so long token strings cannot cause horizontal overflow.
  - Add stable test ids for token input, clear, example, share button, status, structure summary, header output, payload output, claim table, time status, warning panel, error panel, copy header, copy payload, and copy diagnostics.
- Route and metadata:
  - Add `app/[locale]/dev/jwt-decoder/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "jwt-decoder")`.
  - Keep route slug `/dev/jwt-decoder` stable across locales.
- Registry/family/category:
  - Add `jwt-decoder` to `tools` with `available: true`, `familyId: "dev"`, `primaryCategoryId: "codificacao"`, `categoryIds: ["codificacao"]`, `sitemapPriority` around `0.76`, `stateMode: "none"` unless the creator proves a safe non-content query state is needed, and `seoApplicationCategory: "DeveloperApplication"`.
  - Use `Fingerprint`, `Code2`, or another existing lucide icon after verifying import availability. `Fingerprint` is already imported in the current `lib/constants.ts`.
  - Do not add a new family.
  - Do not add a new category in the first build.
- Messages:
  - Add PT-BR, EN, and ES translations for metadata, form labels, actions, statuses, warnings, errors, structure labels, claim descriptions, time statuses, SEO article text, FAQ, disclaimer, and privacy copy.
  - Keep message key parity across all three locale files.
- Unit tests:
  - Cover valid compact JWS with `HS256`, header/payload formatting, registered claims, and NumericDate rendering.
  - Cover leading `Bearer ` prefix.
  - Cover `alg=none` with empty signature.
  - Cover empty signature with non-`none` algorithm warning.
  - Cover expired `exp`, future `nbf`, future `iat`, invalid non-numeric date claims, `aud` string and array.
  - Cover malformed part counts, five-part JWE unsupported, invalid Base64URL characters, non-standard padding behavior, invalid UTF-8 bytes, invalid JSON, non-object header, non-object payload, and oversized input.
  - Cover no query/hash token hydration.
- E2E hooks/tests:
  - Add `tests/e2e/jwt-decoder.spec.ts`.
  - Cover route load, privacy copy, example token decode, paste token decode, copy header/payload, warning text, clear action, no token in live URL, share route-only, ignored query/hash token params, localized EN/ES smoke routes, `/dev` and `/dev/categorias/codificacao` discovery, sitemap exposure, mobile no-horizontal-overflow, and no non-auth console/page errors.
- Backlog updates:
  - Do not update DB item status directly from the creator or planner.
  - Orchestrator should mark the claimed item planned after this planner run.

## Test Plan

- Unit scenarios:
  - `processJwtDecoder` returns `empty` for blank input.
  - Valid 3-part JWT decodes header and payload as JSON objects.
  - `Bearer <jwt>` parses and returns `bearerPrefixIgnored`.
  - Registered claims produce stable labels and raw values.
  - NumericDate values render deterministic ISO strings and status with injected `nowMs`.
  - Expired, not-yet-valid, issued-in-future, and non-numeric time claims produce expected warning/status codes.
  - `alg=none` plus empty signature returns an unsecured-token warning.
  - Five-part JWE returns unsupported with header-only diagnostics.
  - Invalid part count, invalid Base64URL, invalid UTF-8, invalid JSON, wrong JSON shape, and too-large input return stable errors.
  - Unknown custom claims are preserved without interpretation.
- URL-state scenarios:
  - Visiting `/dev/jwt-decoder?token=secret` does not prefill the textarea and sanitizes/removes the query.
  - Visiting `/dev/jwt-decoder#token=secret` does not prefill the textarea and sanitizes/removes the hash.
  - Live typing/pasting never writes token, header, payload, or warnings to `window.location.search` or `window.location.hash`.
  - Share URL contains only the route and locale path, with no token-like params and no hash.
  - No localStorage, sessionStorage, IndexedDB names, cookies, or request URLs/bodies contain the token or decoded claims during e2e checks.
- Browser scenarios:
  - PT-BR route renders title, token textarea, decode status, privacy note, disclaimer, FAQ/SEO content, and related links.
  - A realistic sample JWT shows decoded header, decoded payload, claim table, `exp` date, and "not verified" warning.
  - Invalid token diagnostics remain readable and part-specific.
  - JWE-like five-part input explains that encrypted payloads are unsupported.
  - Copy buttons write the expected decoded JSON or diagnostic text.
  - Clear action removes token and outputs.
  - Long unbroken token strings stay contained on desktop and mobile.
- Playwright scenarios:
  - `tests/e2e/jwt-decoder.spec.ts` should cover the browser scenarios above.
  - Include localized smoke checks for `/en/dev/jwt-decoder` and `/es/dev/jwt-decoder`.
  - Verify `/ferramentas`, `/dev`, `/dev/categorias/codificacao`, and `/sitemap.xml` include the new route in all locales.
  - Verify no non-auth console errors or page errors.
- Lint/build commands:
  - `pnpm test -- lib/tools/jwt.test.ts lib/constants.test.ts`
  - Targeted message JSON parse/key parity check for `tools.jwt-decoder`.
  - `pnpm lint`
  - `pnpm build` with the repo's required placeholder DB/auth env if needed.
  - `pnpm run test:e2e -- tests/e2e/jwt-decoder.spec.ts` or the direct Playwright command pattern used by recent tool runs when the local pnpm wrapper prompts.
  - `git diff --check`
- Acceptance criteria:
  - `/dev/jwt-decoder` is discoverable from the dev family, `codificacao` category, tools hub, sitemap, and localized routes.
  - Token decoding runs entirely in the browser.
  - Header and payload are decoded accurately for valid compact JWS JWTs.
  - Time claims are interpreted correctly and deterministically in unit tests.
  - The UI states clearly that decoding is not signature verification.
  - No token content enters query strings, hash fragments, persistent browser storage, analytics payloads, server requests, or favorites/save flows.
  - Unsupported JWE and malformed tokens fail with clear localized diagnostics.
  - PT-BR, EN, and ES messages are complete.
  - Unit, lint, build, and focused e2e checks pass or have explicit environment blockers documented by the tester.

## Implementation Notes

- Status updates:
  - 2026-07-04: Planner created this plan for the claimed Rank 18 row. Decision `new`; status `planned`.
  - 2026-07-04: Creator confirmed orchestrator handoff says the DB item is `In Progress` stage `implementation`; plan status moved to `in_progress`.
  - 2026-07-04 10:00 -0300: Independent tester validation passed; plan status moved to `verified`. DB item was provided as `In Progress` stage `testing` and should remain there until orchestrator finalization.
- Files changed:
  - `lib/tools/jwt.ts`
  - `lib/tools/jwt.test.ts`
  - `components/tools/dev/jwt-decoder-client.tsx`
  - `app/[locale]/dev/jwt-decoder/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/jwt-decoder.spec.ts`
  - `docs/tool-plans/jwt-decoder.md`
- Validation results:
  - `pnpm test -- lib/tools/jwt.test.ts`: blocked before Vitest by the local non-TTY pnpm modules purge prompt.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/jwt.test.ts lib/constants.test.ts`: passed, 2 files / 17 tests.
  - Targeted message JSON parse and `tools.jwt-decoder` PT-BR/EN/ES key parity check: passed.
  - `./node_modules/.bin/eslint lib/tools/jwt.ts lib/tools/jwt.test.ts components/tools/dev/jwt-decoder-client.tsx 'app/[locale]/dev/jwt-decoder/page.tsx' tests/e2e/jwt-decoder.spec.ts lib/constants.ts`: passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate`: sandboxed run hit `/Users/saulodefaria/.cache/prisma` EPERM; elevated rerun passed.
  - `./node_modules/.bin/tsc --noEmit`: passed after Prisma client generation.
  - `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3199 ./node_modules/.bin/playwright test tests/e2e/jwt-decoder.spec.ts --project=chromium`: sandboxed Chromium failed with the known macOS MachPort permission error before tests ran.
  - Elevated focused Playwright against fresh direct Next dev server on port 3201 passed, 6/6 Chromium tests.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-test-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build`: passed with existing `metadataBase` and edge-runtime warnings.
  - `git diff --check`: passed.
- Tester findings:
  - `psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=jwt-decoder -f scripts/backlog/get_item.sql`: blocked because `AGENT_BACKLOG_DATABASE_URL` is not set in this shell; tester used the orchestrator-provided DB item source of truth (`In Progress`, stage `testing`, route `/dev/jwt-decoder`, plan path `docs/tool-plans/jwt-decoder.md`).
  - Added focused e2e assertions only in `tests/e2e/jwt-decoder.spec.ts`: broader sensitive-value request/storage sentinels, explicit no SaveButton/favorites API check, and malformed 3-part Base64URL diagnostics.
  - `./node_modules/.bin/eslint tests/e2e/jwt-decoder.spec.ts`: passed.
  - `git diff --check -- tests/e2e/jwt-decoder.spec.ts`: passed.
  - `pnpm run test:e2e -- tests/e2e/jwt-decoder.spec.ts`: blocked before Playwright by the local non-TTY pnpm modules purge prompt.
  - Direct dev server for tester validation: `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3202 NEXTAUTH_URL=http://localhost:3202 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true ./node_modules/.bin/next dev --hostname localhost --port 3202`; started successfully and was stopped after validation.
  - `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3202 ./node_modules/.bin/playwright test tests/e2e/jwt-decoder.spec.ts --project=chromium`: sandboxed Chromium failed before tests with the known macOS `MachPortRendezvousServer` permission error.
  - Elevated rerun of the same direct Playwright command against port 3202: passed, 6/6 Chromium tests.
  - Browser coverage passed for PT-BR route load/no redirect loop, realistic JWT paste with `Bearer` prefix, decoded header/payload/registered claims/time status/warnings, invalid part-count and Base64URL diagnostics, unsupported JWE header-only behavior, safe example and clear actions, route-only default share, ignored/sanitized query and hash token params, no pasted token/decoded sensitive values in live URL/storage/cookies/IndexedDB names/request URLs or bodies/default share URL/diagnostic copy, no SaveButton or favorites API requests, localized EN/ES routes, tools hub/dev family/codificacao category/sitemap discovery, mobile no horizontal overflow, and no non-auth console/page errors.
- Final status:
  - `verified`; no production fix is required. DB item should remain `In Progress` stage `testing` for orchestrator finalization, then advance through the orchestrator's PR/done flow.
