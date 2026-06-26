---
slug: "uuid"
familyId: "geradores"
primaryCategoryId: "codigos-links"
backlogRank: 9
primaryKeyword: "gerador de uuid"
decision: "new"
targetRoute: "/geradores/uuid"
status: "verified"
createdAt: "2026-06-25"
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
- Rationale: Rank 9 is the next highest-ranked eligible non-calculator `New` row after skipping Rank 8 `unix-timestamp`, which automation memory records as completed today in draft PR #23 even though this worktree still shows it as `Backlog`. The app has no UUID route, registry entry, helper, component, messages, or prior plan. A dedicated generator page matches the primary keyword and can provide browser-only UUIDv4 generation plus bulk copy without overlapping the existing password, QR code, random-number, or name-drawer generators.

## Similarity Check

- Existing routes checked:
  - Current generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current generator routes: `app/[locale]/geradores/page.tsx`, `app/[locale]/geradores/senha/page.tsx`, `app/[locale]/geradores/qr-code/page.tsx`, `app/[locale]/geradores/numeros-aleatorios/page.tsx`, and `app/[locale]/geradores/sorteador-nomes/page.tsx`.
  - Current top-level family routes: `calculadoras`, `geradores`, `validadores`, `matematica`, `datas`, `texto`, and `dev`.
  - No `/geradores/uuid` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "geradores"`.
  - Existing generator categories are `seguranca`, `aleatorios`, and `codigos-links`.
  - `codigos-links` is the closest current category because UUIDs are generated identifier codes. No new family or category is required for this first build.
  - Existing generator tool entries are `senha`, `qr-code`, `numeros-aleatorios`, and `sorteador-nomes`; no UUID entry exists.
- Related modules/translations checked:
  - `lib/tools/generators.ts` and `lib/tools/generators.test.ts` contain password, random-number, and name-drawer helpers. No UUID helper exists.
  - `lib/tools/base64.ts`, `lib/tools/json.ts`, `lib/tools/text.ts`, `lib/tools/dates.ts`, `lib/tools/email.ts`, and `lib/tools/qr-code.ts` do not provide UUID behavior.
  - `components/tools/generators/*` contains password, QR code, random-number, and name-drawer clients. No UUID client exists.
  - `components/tools/url-state.ts` supports safe query-state and share-link helpers that fit this page.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have generator family/category keys and existing generator tool keys, but no `tools.uuid` keys.
- Prior plans checked:
  - Non-calculator plans under `docs/tool-plans`: `qr-code`, `contador-caracteres`, `formatador-json`, `conversor-base64`, `sorteador-nomes`, `conversor-maiusculas`, and `validador-email`.
  - Calculator plans under `docs/calculator-plans` for overlap only. No UUID plan exists there.
- Text search checked:
  - `uuid`, `gerador de uuid`, `gerar uuid`, `uuid v4`, `uuid generator`, `randomUUID`, and `crypto.randomUUID`.
  - Matches found only in `docs/tool-backlog.md` Rank 9, `docs/tool-backlog.md` Rank 43 `uuid-validator`, and a future-related-tool mention in `docs/tool-plans/validador-email.md`.
- Overlap conclusion:
  - Build a new generator at `/geradores/uuid`.
  - Keep `/geradores/senha` separate because passwords are user-facing secrets with configurable character pools, while UUIDs are structured identifiers.
  - Keep `/geradores/numeros-aleatorios` separate because it generates numeric ranges, not RFC-formatted identifiers.
  - Keep `/dev/conversor-base64`, future `/dev/hash-texto`, and future `/dev/gerador-token` separate because those solve encoding, digest, and arbitrary-token jobs.
  - Treat Rank 43 `uuid-validator` as a future merge candidate. The generator can explain UUIDv4 format, but this plan should not build a full validator flow unless the product owner later chooses to merge that backlog row into this route.

## User Intent And Scope

- Target user: Developers, QA analysts, support engineers, product teams, students, and anyone who needs one or many UUIDs for test data, database seed rows, mock API payloads, local scripts, or documentation examples.
- User job: Open the page, generate UUIDv4 values in the browser, choose how many to create, copy one UUID or the full list, and understand that UUIDs are identifiers rather than passwords or access tokens.
- In scope:
  - Browser-only UUIDv4 generation.
  - Single and bulk generation.
  - Copy one UUID, copy all UUIDs, regenerate, clear/regenerate list, and download/copy newline-separated output if the existing UI pattern supports it cleanly.
  - Output format options: standard hyphenated lowercase UUID, no-hyphen UUID, and `urn:uuid:` prefix.
  - Optional uppercase display transform for systems that prefer uppercase hexadecimal text.
  - Count, format, and uppercase settings in safe URL query params.
  - Concise explanation of UUIDv4 layout, version/variant markers, collision limits, and security caveats.
- Out of scope:
  - UUIDv1/v3/v5/v6/v7/v8 generation, namespace-based UUIDs, MAC/time-based UUIDs, sortable identifiers, ULID/CUID/KSUID, arbitrary random token generation, password generation, UUID validation as a separate workflow, server-side generation, saved history, analytics events containing generated UUIDs, and account favorites.
- Sensitive-topic caveats:
  - UUIDs are useful identifiers, but they should not be treated as secrets, passwords, invitation tokens, bearer tokens, or authorization capabilities.
  - Random UUID collisions are extremely unlikely for ordinary use, but uniqueness is probabilistic and depends on a good random source.
  - Generated values may become sensitive after a user assigns them to real records or private systems, so the tool should keep generated values out of URLs, storage, analytics, and server requests.

## Tool Contract

- Inputs:
  - `quantidade`: integer number of UUIDs to generate; default `1`.
  - `formato`: output format; allowed values `padrao`, `sem-hifens`, and `urn`; default `padrao`.
  - `maiusculas`: boolean display transform; default `false`.
  - Generation action: clicking generate/regenerate produces a fresh list.
- Defaults:
  - `quantidade=1`.
  - `formato=padrao`.
  - `maiusculas=false`.
  - No generated UUID is placed in the URL or persisted after page reload.
- Validation rules:
  - Invalid query params must fall back to defaults without crashing.
  - Clamp `quantidade` to a practical range such as 1 to 500. If a user enters a larger value, use the cap and show a localized warning.
  - Reject or warn on unsupported browser crypto instead of silently falling back to `Math.random`.
  - Each generated base UUID must be canonical UUIDv4 before display transforms:
    - 36 characters in the `8-4-4-4-12` hyphenated layout.
    - Lowercase hexadecimal base output.
    - Version nibble `4` in the third group.
    - RFC variant bits represented by first hexadecimal digit `8`, `9`, `a`, or `b` in the fourth group.
  - `sem-hifens` removes hyphens only after canonical generation.
  - `urn` prefixes `urn:uuid:` to the canonical hyphenated UUID.
  - `maiusculas=true` uppercases hexadecimal letters and the `URN:UUID:` prefix only if the UI intentionally presents the whole output as uppercase; otherwise keep `urn:uuid:` lowercase and uppercase only the UUID value. Choose one behavior and cover it in tests.
- Outputs:
  - Generated UUID list in stable visible rows.
  - Plain newline-separated output for copy-all.
  - Per-row copy action and copy-all action.
  - Stats: generated count, format label, and UUID version.
  - Warning state for capped quantity or unavailable Web Crypto.
  - No generated result should be written to search params, hash fragments, local storage, session storage, analytics, or server state.
- Result explanations:
  - Explain that UUIDv4 uses random bits with fixed version and variant markers.
  - Explain that UUIDs are identifiers, not encryption and not proof of authorization.
  - Explain that the same settings in a shared link will generate a fresh list on load/regeneration, not reproduce the same UUIDs.
- URL params:
  - Safe live query params: `quantidade`, `formato`, and `maiusculas`.
  - Do not sync generated UUID values into `window.location.search` or `window.location.hash`.
  - Do not support content-bearing share links for generated UUIDs in this first build.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Shared settings should regenerate fresh UUIDs for the recipient.
  - Copy/share UI copy should state that generated UUIDs are not included in the link.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store generated UUIDs in localStorage, sessionStorage, cookies, analytics events, or database records.

## Logic, Data, And Sources

- Logic summary:
  - Add UUID helper functions to `lib/tools/generators.ts` if the file remains manageable, or create `lib/tools/uuid.ts` if the creator wants a focused module.
  - Provide a pure `generateUuidV4(randomBytes)` helper that accepts deterministic bytes for unit tests and returns a canonical lowercase UUIDv4 string.
  - In the client, prefer `crypto.randomUUID()` when available.
  - If `crypto.randomUUID()` is unavailable but `crypto.getRandomValues()` is available, generate 16 random bytes, set the UUIDv4 version and RFC variant bits, and format the bytes as lower hexadecimal.
  - Do not use `Math.random` for UUID generation. If Web Crypto is unavailable, show an unsupported-browser state.
  - Add `formatUuidOutput(uuid, options)` for `padrao`, `sem-hifens`, `urn`, and uppercase display variants.
  - Add safe URL-state helpers to read, normalize, and build query params for `quantidade`, `formato`, and `maiusculas`.
  - Keep generated values in React state only and refresh them when the user clicks generate/regenerate or when initial client state is created.
- UUIDv4 byte contract:
  - Generate 16 random bytes.
  - Set byte 6 high nibble to `0100` for version 4.
  - Set byte 8 high bits to `10` for the RFC variant.
  - Format as `xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`.
  - Use lowercase hexadecimal for canonical output before display transforms.
- Data tables or assumptions:
  - No external data tables are required.
  - The first build supports UUIDv4 only because it is the common browser-native random UUID use case and matches the backlog cluster `uuid v4`.
  - Bulk generation is not reproducible from the URL because no seed is stored.
- Official or authoritative sources:
  - RFC 9562, "Universally Unique IDentifiers (UUIDs)", RFC Editor / IETF, published May 2024: https://www.rfc-editor.org/rfc/rfc9562
  - W3C Web Cryptography Level 2 First Public Working Draft, `Crypto.randomUUID()` and `getRandomValues()` algorithms, published 2025-04-22: https://www.w3.org/TR/webcrypto/
  - Codebase source checked on 2026-06-25: routes under `app/[locale]`, registry in `lib/constants.ts`, tool modules in `lib/tools`, URL helpers in `components/tools/url-state.ts`, generator components under `components/tools/generators`, messages in `messages/*.json`, and prior plans in `docs/tool-plans` / `docs/calculator-plans`.
- Source access dates:
  - RFC 9562 checked on 2026-06-25.
  - W3C Web Cryptography Level 2 checked on 2026-06-25.
  - Codebase checked on 2026-06-25.
- Rule/table effective dates:
  - RFC 9562 was published in May 2024 and obsoletes RFC 4122.
  - W3C Web Cryptography Level 2 randomUUID text is a working draft, so implementation should feature-detect browser APIs and keep the RFC 9562 fallback helper covered by tests.
- Freshness or maintenance risk:
  - Low for UUIDv4 layout and variant/version bits.
  - Low for `crypto.randomUUID()` and `crypto.getRandomValues()` in modern secure browser contexts, but keep an unsupported-browser message for older or restricted environments.
  - Moderate security-risk if users treat UUIDs as unguessable access grants; keep security caveats visible.
- Estimator or privacy limitations:
  - UUID generation is exact formatting over random bytes, not an estimate.
  - The tool cannot prove global uniqueness after values leave the browser and cannot check collisions against user systems.
  - Browser-only generation avoids intentional server exposure, but clipboard use, screenshots, browser extensions, and user sharing can still expose generated identifiers.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de UUID`
  - PT-BR meta title: `Gerador de UUID online grátis`
  - PT-BR description: `Gere UUIDs v4 no navegador, copie um ou vários identificadores e escolha o formato com ou sem hífens.`
- Main form sections:
  - Generation settings card with quantity stepper/input, format segmented control, uppercase toggle, and generate/regenerate button with an icon such as `RefreshCw`.
  - Result card with generated UUID rows in monospace, copy-one buttons, copy-all button, and optional download `.txt` action if consistent with existing text tools.
  - Share/settings card or inline share action using `ShareButton`, explicitly saying the link shares settings only.
  - Browser/security note explaining that generation happens locally and requires Web Crypto.
- Results sections:
  - Empty/initial state should generate one UUID automatically on client load or show a clear primary "Gerar UUID" action. Prefer auto-generating the default one because it matches quick generator intent.
  - Bulk output should use a fixed-height or responsive scrollable area for large counts to avoid layout jumps.
  - Long no-hyphen and URN strings must wrap safely on mobile.
  - Warnings for capped quantity and unsupported Web Crypto.
- SEO sections:
  - What a UUID is.
  - What UUIDv4 means.
  - How to generate one or many UUIDs online.
  - Difference between UUIDs, passwords, tokens, and sequential IDs.
  - When to use standard, no-hyphen, or URN formats.
- FAQ topics:
  - `O que é um UUID?`
  - `O gerador cria UUID v4?`
  - `Os UUIDs são enviados para o servidor?`
  - `Posso usar UUID como senha ou token secreto?`
  - `Qual é a diferença entre UUID com hífens, sem hífens e URN?`
  - `O link compartilhado inclui os UUIDs gerados?`
- Disclaimer or privacy copy:
  - The UUIDs are generated in the browser and are not intentionally sent to the server by this tool.
  - A UUID is an identifier, not a password, encryption key, or authorization token.
  - Generated values are not included in shared links; copy them only into systems where they should be used.
- Related tool links:
  - Existing: `/geradores/senha`, `/geradores/numeros-aleatorios`, `/geradores/qr-code`, `/dev/conversor-base64`, and `/dev/formatador-json`.
  - Future backlog candidates: `/validadores/uuid-validator`, `/dev/hash-texto`, `/geradores/gerador-token`, `/dev/jwt-decoder`, and `/dev/url-encode-decode`.
- Translation guidance:
  - Add `tools.uuid` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested names: PT-BR `Gerador de UUID`; EN `UUID Generator`; ES `Generador de UUID`.
  - Translate metadata, form labels, format labels, generate/regenerate/copy actions, copied states, capped quantity warning, unsupported-browser warning, stats, share-settings-only copy, SEO text, FAQ headings, and security/privacy caveats.
  - Existing `toolFamilies.geradores` and `toolCategories.codigos-links` keys already exist in all locales. Updating descriptions is optional, but helpful if the creator wants directory text to mention identifiers in addition to QR codes and links.
  - Keep route slug `/geradores/uuid` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Add UUID types and helpers to `lib/tools/generators.ts` or a focused `lib/tools/uuid.ts`.
  - Implement deterministic UUIDv4 formatting from 16 bytes.
  - Implement browser random-byte generation using `crypto.randomUUID()` first, then `crypto.getRandomValues()` fallback, and no `Math.random` fallback.
  - Implement format transforms for standard, no-hyphen, URN, and uppercase output.
  - Implement count clamp and URL param normalization.
- URL state:
  - Use `components/tools/url-state.ts` for safe query read/write.
  - Sync only `quantidade`, `formato`, and `maiusculas`.
  - Never put generated UUIDs in query params, hash fragments, or default share URLs.
  - Ensure shared settings regenerate fresh UUIDs rather than replaying a copied list.
- UI components:
  - Create `components/tools/generators/uuid-generator-client.tsx`.
  - Follow existing generator UI primitives: `Card`, `Button`, `Input`, `Label`, `ShareButton`, and lucide icons.
  - Add accessible labels and stable test ids for quantity, format, uppercase, generate, copy one, copy all, share, result list, capped warning, and unsupported-browser state.
  - Keep the result area responsive and safe for long strings on mobile.
- Route and metadata:
  - Add `app/[locale]/geradores/uuid/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "uuid")`.
- Registry/family/category:
  - Add a `tools` entry for `uuid` with `available: true`, `familyId: "geradores"`, `primaryCategoryId: "codigos-links"`, `categoryIds: ["codigos-links"]`, an appropriate icon such as `Fingerprint`, `KeyRound`, `Code2`, or another available lucide icon, `sitemapPriority` around `0.74`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"` or `UtilityApplication`.
  - No new `ToolFamilyId` or `ToolCategoryId` is needed.
- Messages:
  - Add PT-BR, EN, and ES translations for tool metadata, settings, output formats, actions, validation/warning states, copy feedback, SEO text, FAQ content, and privacy/security caveats.
- Unit tests:
  - Cover byte-to-UUID formatting with deterministic bytes.
  - Cover version nibble and RFC variant bits.
  - Cover count clamping, invalid param fallback, format transforms, uppercase transform, and unsupported random-source handling.
  - Cover query param read/write helpers and ensure generated UUID values are never serialized.
- E2E hooks/tests:
  - Add stable selectors or accessible names for key controls and result actions.
  - Add a focused `tests/e2e/uuid-generator.spec.ts` if the implementation scope includes e2e in the creator run.
  - Update any hub/directory e2e coverage only if existing tests assert available tool lists.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark Rank 9 `uuid` as `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Deterministic 16-byte input formats as canonical UUIDv4 with the version nibble set to `4`.
  - Deterministic byte input sets RFC variant bits so the fourth group starts with `8`, `9`, `a`, or `b`.
  - `crypto.randomUUID()` path is accepted when injected/mocked.
  - `crypto.getRandomValues()` fallback path formats valid UUIDv4 values.
  - Missing Web Crypto returns an unsupported state and does not call `Math.random`.
  - Quantity normalization clamps below 1 to 1 and above the cap to the cap.
  - Invalid `formato` and `maiusculas` query values fall back to defaults.
  - Standard, no-hyphen, URN, and uppercase formatting produce expected strings.
  - Safe query params contain only settings and never generated UUID values.
- URL-state scenarios:
  - `?quantidade=10&formato=sem-hifens&maiusculas=1` initializes controls correctly.
  - Changing quantity/format/uppercase updates only safe query params.
  - Clicking generate/regenerate does not add generated values to search params or hash.
  - Copying one or all UUIDs does not mutate the URL.
  - Default share URL includes settings only.
  - Opening a shared settings URL generates a fresh list, not the sender's generated UUIDs.
- Browser scenarios:
  - Visit `/geradores/uuid` in PT-BR and confirm title, description, settings, generated result, copy actions, share action, and SEO sections render.
  - Generate one UUID and verify visible format resembles `xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`.
  - Generate a bulk list, copy all, and confirm newline-separated output.
  - Switch to no-hyphen and URN formats and verify visible output transforms without console errors.
  - Toggle uppercase and verify output changes consistently.
  - Enter an oversized quantity and confirm cap warning plus capped result count.
  - Check mobile width for long UUID/URN strings, buttons, and warning text with no horizontal overflow.
- Playwright scenarios:
  - Add focused coverage for initial generation, regenerate changes output, bulk count, format switching, uppercase toggle, safe URL behavior, share settings, copy all, and mobile smoke.
  - Mock Web Crypto only if needed for deterministic assertions; otherwise assert UUID regex rather than exact values.
- Lint/build commands:
  - Run focused unit tests for the UUID helper module.
  - Run focused Playwright spec for the UUID generator when added.
  - Run message JSON parse check.
  - Run targeted lint on changed files, then the repo lint/build commands used by the creator workflow.
  - Run `git diff --check`.
- Acceptance criteria:
  - `/geradores/uuid` exists and is discoverable through registry, family page, category page, and sitemap logic.
  - The tool generates valid UUIDv4 values in the browser.
  - Bulk generation, copy-one, copy-all, format transforms, and safe share behavior work.
  - Generated UUID values are not stored or sent by the tool.
  - PT-BR, EN, and ES messages are complete.
  - Focused unit and e2e/browser validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-25: Planner selected Rank 9 `uuid` after skipping Rank 8 `unix-timestamp` because automation memory records it as completed in draft PR #23. Wrote this plan only; did not edit app code or mark the backlog row `In Progress`.
  - 2026-06-25: Creator marked backlog Rank 9 `uuid` as `In Progress`, set this plan to `in_progress`, and implemented the first app surface for `/geradores/uuid`. Generated UUID values are held only in client React state; safe query/share state contains only `quantidade`, `formato`, and `maiusculas`.
  - 2026-06-26: PR review gate passed with no blocking, issue, security, material test-gap, question, suggestion, or nit findings. Tester validation found a real hydration mismatch for query-param URLs; fixed the UUID client to render default SSR/client state first, read query params asynchronously after mount, delay URL sync until settings are hydrated, and generate after hydrated settings are available. Repeat review accepted the hydration fix and noted one non-blocking e2e selector gap; e2e was hardened to assert unique UUID controls.
- Files changed:
  - `docs/tool-backlog.md`
  - `docs/tool-plans/uuid.md`
  - `lib/tools/generators.ts`
  - `lib/tools/generators.test.ts`
  - `components/tools/generators/uuid-generator-client.tsx`
  - `app/[locale]/geradores/uuid/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/uuid-generator.spec.ts`
- Validation results:
  - PASS: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/generators.test.ts` (24 tests) covered deterministic UUIDv4 byte formatting, version/variant markers, randomUUID preference, getRandomValues fallback, unsupported Web Crypto state, quantity clamping, output formats, uppercase URN behavior, and settings-only URL params.
  - PASS: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/constants.test.ts` (6 tests).
  - PASS: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/generators.test.ts lib/constants.test.ts` (30 tests) after tester hydration fix.
  - PASS: `node -e "for (const file of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(file, 'utf8')); console.log(file + ' ok'); }"`.
  - PASS after one fix: `./node_modules/.bin/eslint lib/tools/generators.ts lib/tools/generators.test.ts lib/constants.ts components/tools/generators/uuid-generator-client.tsx 'app/[locale]/geradores/uuid/page.tsx'`. Initial run flagged synchronous state updates inside the UUID generation effect; creator moved client generation into a browser timer callback and reran cleanly.
  - PASS after tester fix: `./node_modules/.bin/eslint components/tools/generators/uuid-generator-client.tsx tests/e2e/uuid-generator.spec.ts`.
  - PASS after tester fix: `./node_modules/.bin/eslint tests/e2e/uuid-generator.spec.ts`.
  - PASS: `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-secret NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/prisma generate`.
  - PASS: `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-secret NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build`; route list includes `/[locale]/geradores/uuid`. Build emitted existing metadataBase warnings.
  - PASS after tester fix: `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-secret NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build`; route list includes `/[locale]/geradores/uuid`. Build emitted existing metadataBase warnings.
  - PASS: elevated `env PORT=3154 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3154' NEXT_DIST_DIR=.next-e2e ./node_modules/.bin/playwright test tests/e2e/uuid-generator.spec.ts` (6 Chromium tests). Coverage: route load, no console/page errors, UUIDv4 regex, regeneration freshness, generated UUIDs omitted from URL/hash, bulk quantity and 500 cap warning, standard/no-hyphen/URN formats, uppercase transform, copy-one/copy-all clipboard output, settings-only share URL, fresh UUIDs on reload/shared settings, unsupported Web Crypto state, directory/category/sitemap discovery, unique control selectors, and mobile no-overflow.
  - PASS: `git diff --check`.
  - PASS with expected no-index diff exit code 1 and no warning output: `git diff --check --no-index /dev/null components/tools/generators/uuid-generator-client.tsx`, `git diff --check --no-index /dev/null 'app/[locale]/geradores/uuid/page.tsx'`, `git diff --check --no-index /dev/null tests/e2e/uuid-generator.spec.ts`, and `git diff --check --no-index /dev/null docs/tool-plans/uuid.md`.
  - Note: Used direct underlying Prisma/Next commands instead of `pnpm build` because automation memory records this environment's known pnpm ignored-builds gate.
  - Note: Plain `pnpm run test:e2e -- tests/e2e/uuid-generator.spec.ts` was blocked before Playwright by the local pnpm dependency-status/install prompt. Direct Playwright was used. The first direct sandboxed browser run failed with the known macOS `MachPortRendezvousServer` Chromium permission issue; elevated direct Playwright passed.
- Tester findings:
  - PASS after fix. Browser validation originally exposed hydration errors for non-default query params (`formato`, capped `quantidade`, and mobile URN state). Production client hydration was fixed and rerun successfully.
  - PR review after the hydration fix found one non-blocking e2e gap: unique controls were selected with `.first()`. The spec now asserts unique controls and reran cleanly.
- Final status:
  - Verified. Backlog Rank 9 is ready to be marked `Done`; draft PR URL should be recorded after PR creation.
