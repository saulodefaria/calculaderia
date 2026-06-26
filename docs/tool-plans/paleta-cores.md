---
slug: "paleta-cores"
familyId: "cores"
primaryCategoryId: "paletas-cores"
backlogRank: 10
primaryKeyword: "gerador de paleta de cores"
decision: "new"
targetRoute: "/cores/paleta-cores"
status: "verified"
createdAt: "2026-06-25"
updatedAt: "2026-06-25"
---

# Gerador de Paleta de Cores Plan

## Backlog Row

- Rank: 10
- Original status: Backlog
- Slug: `paleta-cores`
- Primary keyword: `gerador de paleta de cores`
- Cluster keywords: `paleta de cores online`; `color palette generator`; `cores hex`
- Family/category: backlog family hint `cores`; planned family `cores`; planned category `paletas-cores`
- Opportunity score: 78
- Idea type: New
- Notes: May justify a new colors family.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/cores/paleta-cores`
- Rationale: Ranks 1-7 are already `Done` locally, and automation memory records ranks 8 and 9 (`unix-timestamp` and `uuid`) as recently planned/implemented or in progress even though this worktree's backlog still shows them as `Backlog`. Rank 10 is therefore the highest-ranked eligible `New` row. There is no existing color family, palette route, color tool module, or prior palette plan. The color backlog contains several future tools (`conversor-cores`, `contraste-wcag`, `gerador-gradiente-css`, `conta-gotas-cor`), so a dedicated `cores` family is better than forcing the tool into `dev`, `geradores`, or `texto`.

## Similarity Check

- Existing routes checked: all current `app/[locale]` route files, including `dev`, `geradores`, `texto`, `validadores`, `datas`, `matematica`, and shared category route `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`. No `/cores`, `/cores/paleta-cores`, or palette route exists.
- Registry/categories checked: `lib/constants.ts` currently has `ToolFamilyId` values `calculadoras`, `geradores`, `validadores`, `matematica`, `datas`, `texto`, and `dev`. It has no `cores` family and no color category. The creator should add a new `ToolFamilyId` value `cores`, a `toolFamilies` entry with href `/cores`, and a `ToolCategoryId` value such as `paletas-cores` with href `/cores/categorias/paletas-cores`.
- Related modules/translations checked: `lib/tools` has helpers for QR code, generators, text, dates, math, documents, JSON, Base64, and email, but no general color module. `lib/tools/qr-code.ts` has local hex color validation and contrast helpers for QR readability, but those are QR-specific and should not be treated as an existing palette tool. `components/tools` has no `colors` or `cores` component folder. `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have no `cores`, `paleta-cores`, or color-tool translation keys beyond QR Code style labels.
- Prior plans checked: `docs/tool-plans` contains plans for QR Code, character counter, JSON formatter, Base64, name drawer, case converter, and email validator. No duplicate palette/color plan exists. `docs/calculator-plans` has no overlapping color utility plan.
- Text search checked: `paleta`, `palette`, `cores`, `color`, `hex`, `rgb`, `hsl`, `contraste`, `wcag`, `gradient`, and `gradiente` across app, lib, components, messages, and prior plans. Only QR Code color settings and generic CSS color usage overlapped.
- Overlap conclusion: Build a new route. Reuse shared tool layout, metadata helpers, URL-state helpers, message structure, category directory behavior, copy/share button patterns, and focused Vitest/Playwright conventions. Do not merge into QR Code or JSON/dev tooling.

## User Intent And Scope

- Target user: Designers, developers, content creators, small-business owners, and students who need a quick color palette with copyable HEX/RGB/HSL values for web, slides, social posts, or branding drafts.
- User job: Pick or generate a base color, choose a palette harmony style, inspect swatches, copy individual colors or the full palette, and share a URL that recreates the same settings.
- In scope:
  - Browser-only palette generation from a seed color.
  - Manual seed input via color picker and HEX text input.
  - Random seed generation button.
  - Palette modes: `analogica`, `complementar`, `triadica`, `monocromatica`, and `tons`.
  - Palette size control from 3 to 8 colors, with mode-aware defaults.
  - Output each swatch as HEX, RGB, and HSL.
  - Copy individual color values, copy all HEX values, and copy a CSS variables snippet.
  - Query/share state for seed, mode, and size.
  - Related links to QR Code now and future color tools when built.
- Out of scope:
  - Full WCAG contrast checker, accessibility pass/fail claims, color blindness simulation, image color extraction, eyedropper-only workflows, gradient generation, brand-system audits, AI-generated naming, palette persistence, accounts/favorites storage, file uploads, or exporting image files.
  - Professional design advice or guarantees that a palette is accessible, brand-safe, printable, or visually optimal.
- Sensitive-topic caveats:
  - This is a design utility, not legal, medical, financial, tax, public-rate, or government-program guidance.
  - Avoid claiming WCAG compliance in this first tool. Link future `/cores/contraste-wcag` when that tool exists.
  - If a simple black/white text preview is included, frame it as preview guidance only, not a contrast certification.

## Tool Contract

- Inputs:
  - `cor`: seed color as HEX, accepting `#RRGGBB`, `RRGGBB`, `#RGB`, or `RGB`.
  - `modo`: one of `analogica`, `complementar`, `triadica`, `monocromatica`, or `tons`.
  - `quantidade`: integer from 3 to 8.
  - Random action: creates a new valid seed color and updates the current palette.
- Defaults:
  - `cor=#2f80ed`
  - `modo=analogica`
  - `quantidade=5`
- Validation rules:
  - Normalize valid 3-digit HEX to 6-digit HEX and preserve output in uppercase `#RRGGBB`.
  - Reject invalid HEX input with an inline validation message and keep the last valid generated palette visible if possible.
  - Clamp query/input `quantidade` to 3-8 and fall back to default when parsing fails.
  - Fall back to defaults for unknown `modo` values.
  - Keep generated RGB channels in integer range 0-255, HSL hue in 0-359, and saturation/lightness in 0-100.
  - Avoid rendering white-on-white or black-on-black labels by choosing stable UI text colors independent of the swatch value or by placing labels outside high-risk swatch backgrounds.
- Outputs:
  - Palette swatches with stable cards and copy buttons.
  - For each swatch: HEX, RGB string such as `rgb(47, 128, 237)`, and HSL string such as `hsl(214, 83%, 56%)`.
  - Full palette copy formats: newline HEX list and CSS variables, for example `--color-1: #2F80ED;`.
  - Summary text explaining mode and seed color.
  - Share URL for the current seed/mode/size.
- Result explanations:
  - Explain that harmony modes are deterministic transformations around the HSL hue wheel.
  - Explain that `tons` varies lightness around the same hue, while `monocromatica` varies saturation and lightness.
  - Explain that random palettes use a random seed and then the same deterministic mode logic.
- URL params:
  - `cor`: normalized 6-digit HEX without `#` or with `%23` if the implementation chooses to keep the hash encoded; prefer without `#` for compact query strings.
  - `modo`: palette mode.
  - `quantidade`: palette size.
  - Invalid or missing params should fall back safely without throwing.
- Share behavior:
  - Use normal query-state sharing because palette settings are not sensitive personal data.
  - Share URL should recreate the same palette exactly.
  - Do not include clipboard history or any generated metadata beyond seed/mode/size.
- Save/favorites behavior:
  - No account save or favorites in the first build.
  - Do not write palettes to localStorage or server storage.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper module such as `lib/tools/colors.ts` with types for palette modes, color representations, parsing/normalization, RGB/HSL conversion, palette generation, query-state normalization, and copy-format builders.
  - Convert the normalized seed HEX to RGB and HSL.
  - Generate harmony colors by rotating hue and adjusting saturation/lightness in bounded ranges:
    - `analogica`: seed hue plus evenly spaced nearby offsets, for example around -40 to +40 degrees.
    - `complementar`: seed plus opposite hue at 180 degrees, with additional tints/shades when more than two colors are requested.
    - `triadica`: seed plus hue offsets 120 and 240 degrees, with repeats varied by lightness/saturation for larger sizes.
    - `monocromatica`: same hue, varied saturation and lightness.
    - `tons`: same hue/saturation, varied lightness from dark to light.
  - Normalize hue with modulo 360 and clamp saturation/lightness to safe ranges that avoid unreadable extremes by default.
  - Random seed generation should be injectable for tests. It does not need cryptographic randomness because this is not a security tool.
- Data tables or assumptions:
  - No external data table is required.
  - Color harmonies are deterministic design heuristics, not authoritative design rules.
  - First build should stay in sRGB/HSL for broad browser and CSS familiarity. Oklab/OKLCH can be deferred unless the creator intentionally expands scope and tests gamut behavior.
- Official or authoritative sources:
  - W3C CSS Color Module Level 4, latest published version checked 2026-06-25: https://www.w3.org/TR/css-color-4/
  - MDN `<color>` reference checked 2026-06-25 for practical authoring terminology and common CSS color formats: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value
  - Codebase references checked 2026-06-25: `lib/tools/qr-code.ts` for existing local HEX validation/contrast patterns, `components/tools/url-state.ts` for query/share helpers, and `lib/constants.ts` for family/category registry shape.
- Source access dates: 2026-06-25.
- Rule/table effective dates:
  - W3C CSS Color Module Level 4 page observed as Candidate Recommendation Draft dated 2026-06-18.
  - No public-rate, legal, tax, government, or table-effective date applies.
- Freshness or maintenance risk:
  - Low for HEX/RGB/HSL basics.
  - Medium if expanding into newer color spaces such as Oklab/OKLCH because browser and CSS serialization behavior can evolve.
  - Low SEO freshness risk; palette search intent is evergreen.
- Estimator or privacy limitations:
  - The tool estimates visually useful palettes using simple harmony rules; it does not guarantee accessibility, brand quality, print fidelity, or perceptual uniformity.
  - Palette data is non-sensitive and can safely live in query params, but the implementation should still avoid unnecessary storage.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de Paleta de Cores`
  - PT-BR meta title: `Gerador de paleta de cores online grátis`
  - PT-BR description: `Crie paletas de cores a partir de uma cor base, copie HEX, RGB, HSL e variáveis CSS direto no navegador.`
- Main form sections:
  - Seed color area with color input, HEX text input, and random color button.
  - Mode segmented control for analogous, complementary, triadic, monochromatic, and tones.
  - Palette size stepper/select from 3 to 8.
  - Copy format actions for all HEX values and CSS variables.
- Results sections:
  - Stable responsive swatch grid.
  - Per-swatch values and copy buttons with accessible labels.
  - Palette summary with seed, mode, and count.
  - Share button using the current query params.
- SEO sections:
  - What a color palette generator does.
  - How to create a palette from a base color.
  - Differences between HEX, RGB, and HSL.
  - Privacy note: generated locally and not saved.
- FAQ topics:
  - `Como escolher uma cor base?`
  - `Qual a diferença entre HEX, RGB e HSL?`
  - `A paleta é acessível para texto?`
  - `O site salva minhas cores?`
  - `Posso usar as cores em CSS?`
- Disclaimer or privacy copy:
  - Palettes are generated in the browser from color settings and are not saved.
  - The result is a design starting point, not an accessibility audit or brand recommendation.
  - For accessibility validation, use a dedicated contrast checker when available.
- Related tool links:
  - Existing: `/geradores/qr-code` because it already uses configurable colors.
  - Future: `/cores/conversor-cores`, `/cores/contraste-wcag`, `/cores/gerador-gradiente-css`, and `/cores/conta-gotas-cor` when implemented.
- Translation guidance:
  - Add `toolFamilies.cores` in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add `toolCategories.paletas-cores` in all three locale files.
  - Add `tools.paleta-cores` keys for title, description, metadata, form labels, modes, validation messages, copy actions, result labels, SEO sections, and FAQ.
  - Suggested locale names:
    - PT-BR: `Gerador de Paleta de Cores`
    - EN: `Color Palette Generator`
    - ES: `Generador de Paleta de Colores`
  - Keep route slug `paleta-cores` stable across locales unless the project later introduces localized route slugs.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/colors.ts` with color parsing, normalization, RGB/HSL conversion, hue rotation, mode generation, query-state helpers, and copy-format builders.
  - Add `lib/tools/colors.test.ts` with deterministic cases for each mode, edge hues, 3-digit HEX expansion, invalid input, clamping, and copy snippets.
- URL state:
  - Use `components/tools/url-state.ts`.
  - Read initial `cor`, `modo`, and `quantidade` on mount.
  - Replace query params after valid settings change.
  - Generate a share URL that recreates the palette exactly.
- UI components:
  - Create `components/tools/colors/color-palette-client.tsx` or the local folder naming convention the creator chooses for the new family.
  - Use existing UI primitives and lucide icons for palette/random/copy/share actions.
  - Keep swatch card dimensions stable and ensure long copied strings wrap or stay in monospaced fixed-width rows without mobile overflow.
  - Include stable accessible labels and/or test ids for seed input, random button, mode control, count control, copy actions, and share action.
- Route and metadata:
  - Add `app/[locale]/cores/page.tsx` using `ToolFamilyDirectoryPage`.
  - Add `app/[locale]/cores/paleta-cores/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "paleta-cores")`.
- Registry/family/category:
  - Add a lucide icon import such as `Palette` after verifying the installed icon name.
  - Add `cores` to `ToolFamilyId` and `toolFamilies` with href `/cores`.
  - Add `paletas-cores` to `ToolCategoryId` and `toolCategories` under `cores`.
  - Add a `tools` entry for `paleta-cores`, `available: true`, `familyId: "cores"`, `primaryCategoryId: "paletas-cores"`, `categoryIds: ["paletas-cores"]`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "DesignApplication"` or `UtilityApplication` if schema validation prefers a safer generic value.
- Messages:
  - Add PT-BR, EN, and ES family/category/tool translations.
  - Include concise SEO and FAQ copy, validation text, copy labels, and privacy/disclaimer text.
- Unit tests:
  - Cover HEX parsing, RGB/HSL round trips within rounding tolerance, each palette mode, query parsing, and copy formats.
- E2E hooks/tests:
  - Add a focused Playwright spec such as `tests/e2e/color-palette.spec.ts`.
  - Cover route load, mode switching, count changes, seed normalization, random generation, copy buttons, share/restore, category/directory links, mobile layout, and console errors.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark the row `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - `#abc`, `abc`, `#AABBCC`, and `aabbcc` normalize to uppercase 6-digit HEX.
  - Invalid HEX strings return validation errors and do not create invalid swatches.
  - RGB/HSL conversion handles black, white, gray, red, green, blue, and near-boundary hues.
  - Hue wrapping works for negative offsets and values above 359.
  - Each mode returns the requested count within 3-8 colors.
  - Copy builders produce stable HEX lists and CSS variable snippets.
  - Query parser falls back safely for bad `cor`, unknown `modo`, and out-of-range `quantidade`.
- URL-state scenarios:
  - Initial URL `?cor=2f80ed&modo=complementar&quantidade=6` restores the same palette.
  - Editing seed/mode/count updates only the three safe query params.
  - Share URL recreates the same seed, mode, and count after reload.
  - Invalid query params do not crash and are replaced by defaults after interaction.
- Browser scenarios:
  - Page loads in PT-BR without redirect or server error.
  - Color picker and text HEX input stay synchronized.
  - Random button creates a valid new seed and visible palette.
  - Mode segmented control changes visible swatches.
  - Copy individual HEX, copy all HEX, and copy CSS variables use the clipboard and show localized feedback.
  - Directory links expose `/cores`, `/cores/categorias/paletas-cores`, and `/cores/paleta-cores`.
  - Mobile viewport has no horizontal overflow and swatch labels remain readable.
- Playwright scenarios:
  - Focused spec for route load, deterministic seed palette, mode/count query restore, copy actions, share URL restore, and mobile layout.
  - Existing tools hub/category specs should continue passing or be updated to include the new family/category only where needed.
- Lint/build commands:
  - `pnpm test -- lib/tools/colors.test.ts lib/constants.test.ts`
  - Message JSON parse check for all locale files.
  - `pnpm lint`
  - `pnpm build` with the repository's required environment variables if plain build needs them.
  - `PORT=<free-port> pnpm run test:e2e -- tests/e2e/color-palette.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - `/cores/paleta-cores` renders a usable browser-only palette generator in all supported locales.
  - Seed/mode/count query state is stable and shareable.
  - No palette data is stored in favorites, localStorage, or server state.
  - Registry, metadata, sitemap/category discovery, messages, unit tests, and focused e2e coverage are wired.
  - UI remains usable on mobile and desktop with no console errors.

## Implementation Notes

- Status updates: Creator implementation completed on 2026-06-25 and left this plan `in_progress` for independent review/tester validation. Rank 10 in `docs/tool-backlog.md` is `In Progress`; do not mark `Done` until tester/browser validation is accepted.
- Files changed:
  - `docs/tool-backlog.md`
  - `docs/tool-plans/paleta-cores.md`
  - `lib/tools/colors.ts`
  - `lib/tools/colors.test.ts`
  - `components/tools/colors/color-palette-client.tsx`
  - `app/[locale]/cores/page.tsx`
  - `app/[locale]/cores/paleta-cores/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/color-palette.spec.ts`
- Implemented behavior:
  - Browser-only sRGB/HSL palette generation from a seed HEX color.
  - Modes `analogica`, `complementar`, `triadica`, `monocromatica`, and `tons`, with sizes clamped from 3 to 8.
  - HEX normalization for `#RRGGBB`, `RRGGBB`, `#RGB`, and `RGB`; invalid text input keeps the last valid palette visible and does not write invalid query state.
  - Copy actions for individual HEX/RGB/HSL values, full HEX list, and CSS variables.
  - Share/query state includes only `cor`, `modo`, and `quantidade`.
  - No `SaveButton`, favorites, localStorage, server storage, file export, image extraction, or WCAG compliance claim was added.
  - New `/cores` family, `/cores/categorias/paletas-cores` category discovery, and `/cores/paleta-cores` route are wired.
- Validation results:
  - `pnpm test -- lib/tools/colors.test.ts lib/constants.test.ts` failed before running tests because the local pnpm wrapper attempted an install/status check and aborted on a no-TTY modules purge prompt.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/colors.test.ts lib/constants.test.ts` passed: 2 files, 13 tests.
  - `node -e "JSON.parse(...)"` for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` passed.
  - `./node_modules/.bin/eslint lib/tools/colors.ts lib/tools/colors.test.ts lib/constants.ts components/tools/colors/color-palette-client.tsx app/[locale]/cores/page.tsx app/[locale]/cores/paleta-cores/page.tsx tests/e2e/color-palette.spec.ts` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed.
  - `NEXT_TELEMETRY_DISABLED=1 DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-test-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 ./node_modules/.bin/next build` passed and listed `/[locale]/cores` plus `/[locale]/cores/paleta-cores`.
  - Elevated `PORT=3161 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3161" ./node_modules/.bin/playwright test tests/e2e/color-palette.spec.ts` passed: 4 Chromium tests.
  - `git diff --check` passed.
- PR-review fix notes (2026-06-25 23:40 -0300):
  - Addressed blocking input finding in `components/tools/colors/color-palette-client.tsx`: manual HEX typing now keeps draft text while the user types, commits valid 6-digit HEX values immediately, and expands valid 3-digit shorthand only on blur or Enter.
  - Addressed test-gap finding in `tests/e2e/color-palette.spec.ts`: added sequential typing coverage with `pressSequentially("#2F80ED")` before asserting final input value, URL state, and summary; shorthand coverage now commits with Enter.
  - Files changed for review fix: `components/tools/colors/color-palette-client.tsx`, `tests/e2e/color-palette.spec.ts`, and this plan note.
  - Validation after review fix:
    - `./node_modules/.bin/eslint components/tools/colors/color-palette-client.tsx tests/e2e/color-palette.spec.ts` passed.
    - `git diff --check` passed for tracked changes.
    - `git diff --check --no-index /dev/null components/tools/colors/color-palette-client.tsx`, `git diff --check --no-index /dev/null tests/e2e/color-palette.spec.ts`, and `git diff --check --no-index /dev/null docs/tool-plans/paleta-cores.md` produced no whitespace warnings; exit code 1 is expected because the files are untracked against `/dev/null`.
    - Elevated `PORT=3162 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3162" ./node_modules/.bin/playwright test tests/e2e/color-palette.spec.ts` passed: 4 Chromium tests.
  - Status remains `in_progress`; backlog remains `In Progress` because this was a narrow review-fix handoff, not independent tester sign-off.
- Tester focus:
  - Recheck `/cores/paleta-cores` in PT-BR plus EN/ES route rendering and metadata.
  - Verify color picker and text HEX input synchronization with realistic typing, not only Playwright fill.
  - Verify random seed, mode defaults, count changes, copy states, and share URL restore on desktop/mobile.
  - Confirm category/directory/sitemap discovery for `/cores`, `/cores/categorias/paletas-cores`, and `/cores/paleta-cores`.
  - Watch browser console for auth/session noise separately from palette behavior; final focused Playwright run had no palette hydration warning after switching to `useSearchParams`.
- Independent tester validation (2026-06-25 23:56 -0300):
  - Tester changed only `tests/e2e/color-palette.spec.ts` and this plan; no production code was modified.
  - Expanded focused Playwright coverage for color picker synchronization, random seed validity, sequential `#RRGGBB` typing, sequential `#RGB` blur plus `RGB` Enter normalization, invalid HEX preserving the last palette, individual HEX/RGB/HSL copy, full HEX and CSS variable copy, safe share URL reload, EN/ES smoke, mobile no horizontal overflow, and non-auth console/page error collection.
  - `./node_modules/.bin/eslint tests/e2e/color-palette.spec.ts` passed.
  - `./node_modules/.bin/tsc --noEmit --pretty false` passed.
  - Elevated `PORT=3167 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3167" ./node_modules/.bin/playwright test tests/e2e/color-palette.spec.ts` passed: 5 Chromium tests.
  - Live browser validation used direct Next dev because `pnpm dev --hostname localhost --port 3166` hit the known no-TTY pnpm modules prompt and was aborted before changing dependencies. Direct dev server command `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3166 NEXTAUTH_URL=http://localhost:3166 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true ./node_modules/.bin/next dev --hostname localhost --port 3166` started successfully and was stopped after validation.
  - Elevated one-off Chromium browser validation against `http://localhost:3166` passed 41 checks covering PT route load, query restore, realistic seed typing, `#RGB` blur/Enter normalization, invalid HEX behavior, color picker sync, random generation, mode/count changes, copy actions, share URL safety and restore, `/cores` and `/cores/categorias/paletas-cores` discovery, EN/ES route smoke, mobile no-overflow, and console/page monitoring.
  - Browser monitoring saw two known Auth.js `ClientFetchError` session-fetch console messages during locale navigation; `/api/auth/session` returned 200 in the dev server logs, and no non-auth/palette console errors or page errors were recorded.
  - `lsof -i :3166 -sTCP:LISTEN || true` produced no listener after shutdown.
  - `git diff --check` passed.
  - No screenshots were needed.
- Tester handoff status: `verified`; backlog was left `In Progress` at that point because the orchestrator owns final backlog `Done` status and PR reference.
- Orchestrator finalization (2026-06-25 23:59 -0300):
  - Rank 10 in `docs/tool-backlog.md` was marked `Done` after implementation, review fixes, repeat review gate, and independent tester validation passed.
  - Done Ref: draft PR https://github.com/saulodefaria/calculaderia/pull/24; route `/cores/paleta-cores`; review gate and elevated browser/e2e validation passed 2026-06-25.
  - Attempted to apply `codex` and `codex-automation` labels; GitHub reported label `codex` was not found.
