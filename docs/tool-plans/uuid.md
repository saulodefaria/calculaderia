---
slug: "uuid"
familyId: "geradores"
primaryCategoryId: "codigos-links"
backlogRank: 9
primaryKeyword: "gerador de uuid"
decision: "new"
targetRoute: "/geradores/uuid"
status: "verified"
createdAt: "2026-06-26"
updatedAt: "2026-06-26"
---

# Gerador de UUID Plan

## Backlog Row

- Rank: 9
- Original status: Backlog
- Slug: `uuid`
- Primary keyword: `gerador de uuid`
- Cluster keywords: `uuid generator`; `gerar uuid online`; `uuid v4`
- Family/category: backlog family `geradores`; planned family `geradores`; planned category `codigos-links`
- Opportunity score: 79
- Idea type: New
- Notes: Tiny implementation; add copy and bulk generation.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/geradores/uuid`
- Rationale: The backlog row is a new non-calculator generator, Rank 8 `unix-timestamp` is already complete on branch `codex/unix-timestamp-tool` with PR #23, and this worktree has no UUID route, registry entry, helper, UI component, messages, tests, or local plan file. Build a dedicated browser-only UUIDv4 generator under the existing `geradores` family.

## Similarity Check

- Existing routes checked:
  - `app/[locale]/geradores/page.tsx`
  - `app/[locale]/geradores/senha/page.tsx`
  - `app/[locale]/geradores/qr-code/page.tsx`
  - `app/[locale]/geradores/numeros-aleatorios/page.tsx`
  - `app/[locale]/geradores/sorteador-nomes/page.tsx`
  - Generic family/category routes: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`
  - No `/geradores/uuid` route exists in this worktree.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "geradores"`.
  - Existing generator categories are `seguranca`, `aleatorios`, and `codigos-links`.
  - Existing generator entries are `senha`, `qr-code`, `numeros-aleatorios`, and `sorteador-nomes`; no UUID entry exists.
  - Use existing category `codigos-links` because UUIDs are identifiers/codes. Do not add a new family or category.
- Related modules/translations checked:
  - `lib/tools/generators.ts` contains password, random-number, and name-drawer helpers, but no UUID helpers.
  - `lib/tools/generators.test.ts` has the right unit-test home for small generator helpers.
  - `components/tools/generators/*` has password, random-number, QR code, and name drawer clients, but no UUID client.
  - `components/tools/url-state.ts` supports safe query/share URLs for settings-only tools.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have `toolFamilies.geradores`, `toolCategories.codigos-links`, and existing generator namespaces, but no `tools.uuid`.
  - Current e2e coverage has generator examples in `tests/e2e/tools-hub.spec.ts` and `tests/e2e/name-drawer.spec.ts`, but no UUID spec.
- Prior plans checked:
  - Local `docs/tool-plans`: `_template.md`, `qr-code.md`, `contador-caracteres.md`, `formatador-json.md`, `conversor-base64.md`, `sorteador-nomes.md`, `conversor-maiusculas.md`, and `validador-email.md`.
  - Local `docs/tool-plans/uuid.md` did not exist before this plan.
  - Local calculator plans under `docs/calculator-plans` do not overlap.
  - Automation memory records a prior UUID plan/implementation on branch `codex/uuid-tool`, but the current branch `codex/uuid-generator-tool` has no UUID files. This plan keeps the same target route requested for this worktree rather than inventing a duplicate slug.
- Text search checked:
  - `uuid`, `gerador de uuid`, `uuid generator`, `gerar uuid online`, `uuid v4`, `randomUUID`, `crypto.randomUUID`, and `getRandomValues`.
- Overlap conclusion:
  - Build `/geradores/uuid` as a new tool.
  - Do not merge into `/geradores/numeros-aleatorios`; UUIDs have a standard text format, version/variant bits, copy-focused workflow, and developer intent beyond generic number generation.
  - Do not merge into `/geradores/senha`; UUIDs are identifiers, not passwords, and the tool must not imply UUIDs are authentication secrets.
  - Keep future Rank 35 `gerador-token` separate because tokens need configurable byte length/encoding and stronger security copy.
  - Keep future Rank 43 `uuid-validator` separate or as a later enhancement because validation/parsing is a different search intent from generation.

## User Intent And Scope

- Target user: Developers, QA analysts, product/support teams, students, and API users who need UUIDs for fixtures, database records, request IDs, mocks, tests, or documentation examples.
- User job: Generate one or many UUIDv4 values in the browser, choose a common output format, copy one value or the whole batch, and share only generation settings.
- In scope:
  - Generate UUID version 4 values only.
  - Bulk generation with a bounded count.
  - Output formats: canonical hyphenated UUID, no-hyphen compact UUID, and `urn:uuid:` prefix.
  - Uppercase toggle for systems that prefer uppercase display.
  - Copy one UUID, copy all UUIDs, clear/regenerate, and settings-only share link.
  - Client-side generation using Web Crypto APIs.
  - Unsupported-browser state when secure random UUID generation is unavailable.
  - Short educational explanation of UUIDv4, version/variant bits, and practical limitations.
- Out of scope:
  - UUIDv1/v3/v5/v6/v7/v8 generation, namespace/name hashing, timestamp-ordered UUIDs, MAC/time-based IDs, deterministic IDs, UUID validation, GUID byte-order conversion, ULID/CUID/Nano ID generation, database migration advice, server-side generation, saved history, account favorites, or audit logs.
- Sensitive-topic caveats:
  - UUIDs are identifiers, not passwords, API tokens, authorization secrets, or proof of identity.
  - UUIDv4 collision risk is very low for ordinary use, but not mathematically impossible.
  - Generated values should remain ephemeral unless the user copies them; the app should not store or send them.

## Tool Contract

- Inputs:
  - `quantidade`: integer count of UUIDs to generate.
  - `formato`: output format enum: `padrao`, `sem-hifens`, or `urn`.
  - `maiusculas`: boolean display toggle.
  - A generate/regenerate action that creates a fresh batch.
- Defaults:
  - `quantidade=5`
  - `formato=padrao`
  - `maiusculas=false`
  - Generate the default batch on first client render if Web Crypto is available.
- Validation rules:
  - Clamp `quantidade` to `1..100`. Invalid, empty, decimal, negative, `NaN`, or very large query values fall back to the default or clamp safely.
  - Unknown `formato` falls back to `padrao`.
  - `maiusculas` accepts only explicit truthy values such as `1` or `true`; otherwise false.
  - If `crypto.randomUUID` is available, use it as the primary generator.
  - If `crypto.randomUUID` is unavailable but `crypto.getRandomValues` is available, generate 16 bytes, set UUIDv4 version bits on byte 6 and RFC variant bits on byte 8, then serialize to lowercase canonical format.
  - Do not fall back to `Math.random` for UUID generation.
  - If neither Web Crypto path is available, show an unsupported-browser message and disable generation/copy actions.
  - Generated UUID strings must match the selected format and case:
    - `padrao`: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`, where `y` is one of `8`, `9`, `a`, or `b` before uppercase transformation.
    - `sem-hifens`: 32 hex digits.
    - `urn`: `urn:uuid:` plus canonical hyphenated UUID.
  - Query params must not create unbounded work or memory use.
- Outputs:
  - List of generated UUID strings.
  - Batch summary: count, version `v4`, format, and whether uppercase is enabled.
  - Copyable single UUID rows.
  - Copy-all output with one UUID per line.
  - Status/warning for clamped count, unsupported browser, and "new batch generated".
- Result explanations:
  - Explain that UUIDv4 is random and does not encode time, user data, or machine information.
  - Explain that no-hyphen and uppercase modes are display formats over the same generated value.
  - Explain that `urn:uuid:` is useful when a URN form is required.
  - Explain that regenerating creates new values; shared URLs preserve only settings, not UUIDs.
- URL params:
  - Safe live query params: `quantidade`, `formato`, and `maiusculas`.
  - Never put generated UUID values, copy buffers, or prior batches in `window.location.search` or `window.location.hash`.
  - Sanitize invalid query values by normalizing the live URL back to safe params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only `quantidade`, `formato`, and `maiusculas`.
  - No include-content option is needed because generated UUID batches are intentionally ephemeral.
  - The shared URL must generate a fresh batch for the recipient, not reproduce the sender's UUIDs.
- Save/favorites behavior:
  - No favorites, no account save, no localStorage/sessionStorage history, and no server persistence for generated UUIDs.
  - Do not send generated UUID values in analytics events. Existing GA pageview behavior should not include hashes; this route should avoid hashes entirely.

## Logic, Data, And Sources

- Logic summary:
  - Add UUID-specific types and helpers in `lib/tools/generators.ts` unless the file becomes too broad; a focused `lib/tools/uuid.ts` is acceptable if the creator prefers separation.
  - Suggested types: `UuidFormat`, `UuidGeneratorState`, `UuidGenerationResult`, and `UuidGeneratorIssue`.
  - Provide pure helpers for:
    - normalizing search params,
    - building safe search params,
    - formatting canonical UUIDs into `padrao`, `sem-hifens`, and `urn`,
    - applying uppercase transformation,
    - generating canonical UUID from 16 random bytes,
    - validating generated UUID shape for tests.
  - Keep browser-specific random access in the client or behind an injected generator function so unit tests can use deterministic byte arrays.
  - Prefer `crypto.randomUUID()` and fallback to `crypto.getRandomValues()` with explicit bit setting. Avoid `Math.random`.
- Data tables or assumptions:
  - No external data table is required.
  - Initial build supports UUIDv4 only because the backlog cluster explicitly includes `uuid v4` and Web Crypto directly supports v4 generation.
  - Browser runtime assumptions:
    - Production is served over HTTPS, satisfying secure-context requirements for `crypto.randomUUID`.
    - Localhost development can still be verified with modern browser support.
    - `getRandomValues` should be treated as the fallback secure random byte source.
- Official or authoritative sources:
  - RFC 9562, "Universally Unique IDentifiers (UUIDs)", IETF, published May 2024: https://www.rfc-editor.org/rfc/rfc9562.html
  - W3C Web Cryptography Level 2, `Crypto` interface, `getRandomValues`, and `randomUUID`: https://www.w3.org/TR/webcrypto/
  - MDN Web Docs, `Crypto.randomUUID()` browser/runtime reference: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
  - Codebase source checked on 2026-06-26: current generator routes, registry, helper modules, URL state helper, messages, tests, and prior local plans.
- Source access dates:
  - RFC 9562 checked on 2026-06-26.
  - W3C Web Cryptography Level 2 checked on 2026-06-26.
  - MDN `Crypto.randomUUID()` checked on 2026-06-26.
  - Codebase checked on 2026-06-26.
- Rule/table effective dates:
  - RFC 9562 was published in May 2024 and obsoletes RFC 4122.
  - Web Cryptography Level 2 is a W3C working draft; use it for runtime API behavior and record the access date because it can evolve.
- Freshness or maintenance risk:
  - Low for UUIDv4 format and bit layout.
  - Low for `crypto.randomUUID` in modern browsers, but keep the `getRandomValues` fallback and unsupported-browser state.
  - Moderate product risk if users expect UUIDv7 or deterministic namespace UUIDs; keep scope text clear and consider separate backlog work later.
- Estimator or privacy limitations:
  - Generation is exact, not an estimate.
  - UUIDv4 values are not suitable as secrets. The tool does not assess collision probability for a user's full system, guarantee uniqueness across all possible systems, or provide a server-side uniqueness check.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de UUID`
  - PT-BR meta title: `Gerador de UUID online gratis`
  - PT-BR description: `Gere UUIDs v4 no navegador, copie em lote e compartilhe apenas as configuracoes.`
- Main form sections:
  - Settings card with count input, format segmented control, uppercase toggle, and generate/regenerate action with a `RefreshCw` icon.
  - Results section with fixed-width/scroll-safe UUID rows, copy-one buttons with `Copy` icon, copy-all action, and summary.
  - Privacy/share section with `ShareButton` and explicit copy that links preserve only settings.
  - Unsupported-browser alert if Web Crypto UUID generation is unavailable.
- Results sections:
  - UUID list rendered in monospace, with wrapping or horizontal-safe rows on mobile.
  - Summary chips for `v4`, count, selected format, and uppercase state.
  - Copy-all textarea or hidden string should be newline-delimited.
  - Empty/unsupported state should not show fake UUIDs.
- SEO sections:
  - What a UUID is.
  - What UUIDv4 means.
  - How to generate multiple UUIDs online.
  - Difference between canonical, no-hyphen, uppercase, and URN formats.
  - Privacy note: generation happens in the browser and generated values are not included in the shared URL.
  - Limitation note: UUIDs are identifiers, not secrets.
- FAQ topics:
  - `O que e um UUID?`
  - `Qual versao de UUID esta ferramenta gera?`
  - `Os UUIDs sao enviados para o servidor?`
  - `Posso gerar varios UUIDs de uma vez?`
  - `UUID serve como senha ou token secreto?`
  - `Qual a diferenca entre UUID com hifens, sem hifens e URN?`
- Disclaimer or privacy copy:
  - The generation happens in the browser using Web Crypto when available.
  - Generated UUIDs are not saved, not sent to the server by this tool, and not included in shared links.
  - UUIDs should not be used as passwords, bearer tokens, or access-control secrets.
- Related tool links:
  - Existing: `/geradores/senha`, `/geradores/numeros-aleatorios`, `/geradores/qr-code`, `/geradores/sorteador-nomes`, and `/dev/conversor-base64`.
  - Future backlog candidates: `/validadores/uuid-validator`, `/geradores/gerador-token`, `/dev/hash-texto`, `/dev/jwt-decoder`, and `/dev/url-encode-decode`.
- Translation guidance:
  - Add `tools.uuid` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested titles:
    - PT-BR: `Gerador de UUID`
    - EN: `UUID Generator`
    - ES: `Generador de UUID`
  - Translate metadata, settings labels, format names, generation/copy actions, unsupported-browser message, clamp warning, result summary, privacy/share copy, SEO text, and FAQ.
  - Existing `toolFamilies.geradores` and `toolCategories.codigos-links` keys already exist in all locales. Update category description only if product wants UUIDs explicitly mentioned.
  - Keep the stable route slug `/geradores/uuid` across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Add UUID state, format, issue/result types.
  - Add `defaultUuidGeneratorState`.
  - Add `normalizeUuidGeneratorStateFromParams` and `buildUuidGeneratorSearchParams`.
  - Add `formatUuid(canonicalUuid, options)`.
  - Add `createUuidV4FromBytes(bytes)` that sets version/variant bits and serializes lower-case canonical UUID.
  - Add `generateUuidBatch(count, generator)` with injected generation for tests.
  - Add no `Math.random` UUID path.
- URL state:
  - Use `components/tools/url-state.ts` for `getInitialSearchParams`, `replaceQueryString`, and `getShareUrlFromParams` if settings-only params are enough.
  - Sync only `quantidade`, `formato`, and `maiusculas`.
  - Generated UUIDs must remain out of query and hash.
- UI components:
  - Create `components/tools/generators/uuid-generator-client.tsx`.
  - Use existing UI primitives and lucide icons such as `RefreshCw`, `Copy`, and a registry icon such as `Braces`, `KeyRound`, or `Hash` if imported.
  - Use stable test ids for settings, generate, copy-one, copy-all, result list, unsupported state, and share button.
  - Keep rows responsive with `min-w-0`, `break-all`, or horizontal-safe monospace containers.
  - Avoid nested cards inside cards; use sections or simple bordered groups inside the tool surface.
- Route and metadata:
  - Add `app/[locale]/geradores/uuid/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "uuid")`.
- Registry/family/category:
  - Add a `tools` entry with:
    - `id: "uuid"`
    - `href: "/geradores/uuid"`
    - `familyId: "geradores"`
    - `primaryCategoryId: "codigos-links"`
    - `categoryIds: ["codigos-links"]`
    - `available: true`
    - `stateMode: "query"`
    - `seoApplicationCategory: "DeveloperApplication"` or `UtilityApplication`; prefer `DeveloperApplication` because UUID generation is primarily dev/API work.
    - `sitemapPriority` around `0.76`
    - `recentRank` if the product wants the new route surfaced.
  - No new `ToolFamilyId` or `ToolCategoryId` is needed.
- Messages:
  - Add PT-BR, EN, and ES `tools.uuid` translations for metadata, form controls, validation/status, result copy, share/privacy copy, FAQ, and SEO sections.
- Unit tests:
  - Extend `lib/tools/generators.test.ts` or add a focused UUID test file.
  - Cover byte-to-v4 canonical generation, version nibble `4`, variant nibble `8|9|a|b`, formatting modes, uppercase transformation, count clamping, invalid params, safe params, batch generation, and no generated values in share/search params.
- E2E hooks/tests:
  - Add `tests/e2e/uuid-generator.spec.ts`.
  - Cover default route load, generate/regenerate changes, count clamp, format changes, uppercase toggle, copy one, copy all, settings-only share URL, reload from share settings generating a fresh batch, unsupported Web Crypto mock/state, locale smoke in EN/ES, discovery via `/geradores` and category page, sitemap exposure, and mobile no-overflow.
- Backlog updates:
  - Do not mark `docs/tool-backlog.md` `In Progress` during planning.
  - Creator should mark the row only when implementation begins and later fill Done Ref after review/test/PR.

## Test Plan

- Unit scenarios:
  - `createUuidV4FromBytes` produces canonical 36-character lowercase UUIDs.
  - Byte 6 version bits are set to `4`; byte 8 variant bits serialize as `8`, `9`, `a`, or `b`.
  - `crypto.randomUUID` outputs are normalized/formatted without changing random content except case/hyphen/URN display.
  - `formato=sem-hifens` removes hyphens and keeps 32 hex chars.
  - `formato=urn` prefixes `urn:uuid:` and keeps canonical hyphenation.
  - Uppercase applies to hex chars while preserving `urn:uuid:` prefix casing as specified by product; prefer keeping prefix lowercase and UUID uppercase unless messages say otherwise.
  - Count normalization clamps to `1..100`.
  - Search params include only `quantidade`, `formato`, and `maiusculas`.
  - Invalid params fall back safely.
- URL-state scenarios:
  - Live editing settings updates query params.
  - Generated UUID strings never appear in `window.location.search`, `window.location.hash`, default share URL, or copied share link.
  - Shared URL with settings loads those settings and generates a fresh batch.
  - Invalid deep links sanitize to valid params after hydration.
- Browser scenarios:
  - Visit `/geradores/uuid` in PT-BR and confirm title, settings, generate action, results, copy actions, privacy text, SEO, and FAQ render.
  - Change count to a realistic bulk value such as 25 and confirm 25 unique-looking rows render without layout shift.
  - Toggle formats and uppercase and confirm visible rows and copy-all output match the selected settings.
  - Regenerate and confirm a new batch is shown.
  - Copy one and copy all with clipboard permissions.
  - Share settings and reload from copied URL.
  - Mock/remove `crypto.randomUUID` to exercise `getRandomValues` fallback if practical in Playwright.
  - Mock/remove both Web Crypto paths to verify unsupported-browser UI.
  - Check `/geradores`, `/geradores/categorias/codigos-links`, `/ferramentas`, and `/sitemap.xml` discovery.
  - Check EN and ES smoke routes.
  - Check mobile viewport for no horizontal overflow despite long UUID strings.
- Playwright scenarios:
  - Focused e2e spec should cover generation, copy, share privacy, format toggles, reload, unsupported state, and mobile overflow.
  - If this host still requires elevated Chromium due macOS sandbox issues, record that in the implementation notes and rerun elevated.
- Lint/build commands:
  - `pnpm test -- lib/tools/generators.test.ts lib/constants.test.ts` or direct Vitest equivalent if the local pnpm wrapper blocks.
  - `pnpm lint` or targeted ESLint for touched files.
  - `pnpm build` with required placeholder env if Prisma/Auth env is needed.
  - Focused Playwright: `pnpm run test:e2e -- tests/e2e/uuid-generator.spec.ts` or the repo's direct Playwright command if needed.
  - `git diff --check`.
- Acceptance criteria:
  - `/geradores/uuid` is discoverable through registry, family/category pages, metadata, and sitemap.
  - UUID generation is browser-only, uses Web Crypto, and has no `Math.random` UUID fallback.
  - Generated UUIDs are never persisted or shared by default.
  - Copy actions work for one UUID and all UUIDs.
  - Settings are shareable and reload correctly.
  - PT-BR, EN, and ES messages render without missing keys or ICU errors.
  - UI remains usable on mobile and long UUID strings do not overflow the page.

## Implementation Notes

- Status updates:
  - 2026-06-26: Planner selected `new` and wrote this buildable plan for `/geradores/uuid`.
  - 2026-06-26: Creator started implementation; backlog Rank 9 and plan status set to `In Progress`.
  - 2026-06-26: Creator implemented `/geradores/uuid` with UUIDv4-only browser generation, settings-only query/share state, localized copy, registry wiring, unit coverage, and focused e2e coverage.
  - 2026-06-26: Review-fix handoff addressed accepted PR-review findings for fractional quantity warnings, pre-analytics UUID query sanitization, and Web Crypto fallback/unsupported browser coverage.
- Files changed:
  - `docs/tool-backlog.md`
  - `docs/tool-plans/uuid.md`
  - `lib/tools/generators.ts`
  - `lib/tools/generators.test.ts`
  - `lib/analytics/ga4.ts`
  - `lib/analytics/ga4.test.ts`
  - `components/tools/generators/uuid-generator-client.tsx`
  - `app/[locale]/geradores/uuid/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/uuid-generator.spec.ts`
- Validation results:
  - `node -e 'for (const file of ["messages/pt-br.json","messages/en.json","messages/es.json"]) { JSON.parse(require("node:fs").readFileSync(file, "utf8")); console.log(file + " ok"); }'` passed.
  - `pnpm test -- lib/tools/generators.test.ts lib/constants.test.ts` was blocked by the pnpm wrapper dependency/build-approval gate before Vitest ran; direct local Vitest was used after dependencies were present.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/generators.test.ts lib/constants.test.ts` passed: 2 files, 28 tests.
  - `./node_modules/.bin/eslint lib/tools/generators.ts lib/tools/generators.test.ts lib/constants.ts components/tools/generators/uuid-generator-client.tsx 'app/[locale]/geradores/uuid/page.tsx' tests/e2e/uuid-generator.spec.ts` passed.
  - `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed for local e2e server setup.
  - Initial sandboxed Playwright failed before page execution due macOS Chromium Mach port permission denial; rerun elevated as planned.
  - `env CI=true DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_DIST_DIR=.next-e2e PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3100' ./node_modules/.bin/playwright test tests/e2e/uuid-generator.spec.ts --project=chromium` passed: 4 tests.
  - `git diff --check` passed.
- PR-review findings addressed:
  - `issue(validation)`: `normalizeUuidGeneratorCount` now reports `quantityClamped` when fractional quantities such as `2.9` are truncated, with unit coverage.
  - `security(privacy)`: GA pageview sanitization now normalizes `/geradores/uuid`, `/pt-br/geradores/uuid`, `/en/geradores/uuid`, and `/es/geradores/uuid` to settings-only params (`quantidade`, `formato`, `maiusculas`) before calling `gtag`; unit coverage proves raw `uuid`/extra params and hashes are omitted.
  - `test-gap(browser)`: `tests/e2e/uuid-generator.spec.ts` now covers the deterministic `crypto.getRandomValues` fallback when `crypto.randomUUID` is unavailable and the unsupported-browser UI when neither Web Crypto path is available.
- Review-fix validation results:
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/generators.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` passed: 3 files, 33 tests.
  - `./node_modules/.bin/eslint lib/tools/generators.ts lib/tools/generators.test.ts lib/analytics/ga4.ts lib/analytics/ga4.test.ts tests/e2e/uuid-generator.spec.ts components/tools/generators/uuid-generator-client.tsx 'app/[locale]/geradores/uuid/page.tsx' lib/constants.ts` passed.
  - `./node_modules/.bin/tsc --noEmit --pretty false` passed.
  - First elevated Playwright rerun exposed a flaky strict locator in the new unsupported-browser assertion; the spec was tightened and rerun.
  - `env CI=true DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_DIST_DIR=.next-e2e PORT=3105 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3105' ./node_modules/.bin/playwright test tests/e2e/uuid-generator.spec.ts --project=chromium` passed: 6 Chromium tests.
  - `git diff --check` passed.
- Tester findings:
  - 2026-06-26 06:01 -03: Tester read `.agents/skills/calculator-tester/references/e2e-checks.md`, reviewed the plan/route/client/helper/spec, and added missing focused Playwright coverage in `tests/e2e/uuid-generator.spec.ts` for generated UUID privacy in request URLs/storage and absence of save/favorites behavior.
  - Browser/Playwright coverage passed for route load/no redirect, realistic UUID generation/uniqueness, count clamp to 100, standard/no-hyphen/URN formats, uppercase toggle, copy one/all, settings-only share URL, reload-from-share fresh batch, `crypto.getRandomValues` fallback, unsupported-browser state, EN/ES smoke routes, `/geradores` and `/geradores/categorias/codigos-links` discovery, sitemap entries, mobile no-overflow, console/page errors, no generated UUIDs in live/share URL/hash/storage/request URLs, and no SaveButton/favorites API exposure.
  - Sandboxed Chromium failed before page execution with macOS Mach port permission denial (`bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`); the same Playwright command was rerun elevated and passed.
  - The pnpm wrapper command was blocked by the dependency build-approval gate before Playwright ran; local project binaries were used for the actual browser/unit/lint checks.
- Tester validation commands:
  - `env CI=true DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_DIST_DIR=.next-e2e PORT=3106 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3106' pnpm run test:e2e -- tests/e2e/uuid-generator.spec.ts --project=chromium` blocked before Playwright by `[ERR_PNPM_IGNORED_BUILDS]`.
  - `node scripts/clean-e2e-next-cache.mjs` passed.
  - `./node_modules/.bin/eslint tests/e2e/uuid-generator.spec.ts` passed.
  - `env CI=true DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_DIST_DIR=.next-e2e PORT=3106 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3106' ./node_modules/.bin/playwright test tests/e2e/uuid-generator.spec.ts --project=chromium` failed in sandbox with the known macOS Chromium Mach port permission error.
  - Elevated rerun of `env CI=true DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_DIST_DIR=.next-e2e PORT=3106 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3106' ./node_modules/.bin/playwright test tests/e2e/uuid-generator.spec.ts --project=chromium` passed: 6 Chromium tests.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/generators.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` passed: 3 files, 33 tests.
  - `git diff --check` passed.
  - Final orchestrator check `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed.
  - Final orchestrator check `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/next build` passed and listed `/[locale]/geradores/uuid`; only existing `metadataBase` warnings were emitted.
- Residual risks:
  - Full e2e suite and production build were not rerun in this tester pass; validation was scoped to the UUID route, relevant unit coverage, and the focused browser workflow requested by the orchestrator.
  - Initial inbound URLs can contain arbitrary user-supplied query params before client sanitization; tester coverage verifies generated UUIDs produced by the tool are not persisted, shared, copied into URLs/hashes, stored, or sent in subsequent browser request URLs.
- Final status:
  - Verified; tester validation passed for the requested UUID scope, and the backlog is ready to be marked `Done` with the draft PR reference after PR creation.
