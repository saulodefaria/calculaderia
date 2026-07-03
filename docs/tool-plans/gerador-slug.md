---
slug: "gerador-slug"
familyId: "texto"
primaryCategoryId: "transformacao-texto"
backlogRank: 16
primaryKeyword: "gerador de slug"
decision: "new"
targetRoute: "/texto/gerador-slug"
status: "verified"
createdAt: "2026-07-03"
updatedAt: "2026-07-03"
---

# Gerador de Slug Plan

## Backlog Row

- Rank: 16
- Original status: `In Progress`
- Original stage: `planning`
- Slug: `gerador-slug`
- Kind: `tool`
- Branch: `codex/gerador-slug-tool`
- Primary keyword: `gerador de slug`
- Cluster keywords: not present in the authoritative claimed DB item JSON.
- Family/category: backlog family hint `texto`; planned family `texto`; planned category `transformacao-texto`.
- Opportunity score: not present in the authoritative claimed DB item JSON.
- Idea type: `New`
- Notes: not present in the authoritative claimed DB item JSON.
- Done ref: not present in the authoritative claimed DB item JSON.
- Plan path: `docs/tool-plans/gerador-slug.md`
- Target route: `/texto/gerador-slug`

## Decision

- Decision: `new`
- Target route: `/texto/gerador-slug`
- Rationale: The claimed item is a distinct browser-only text transformation. Existing text tools count text and convert letter case, while prior plans mention slug generation only as future work. Slug generation combines lowercasing, accent/mark handling, separator rules, reserved-character cleanup, duplicate-separator collapse, length trimming, copy/share behavior, and URL-safe result explanations. A dedicated route matches the primary keyword and the claimed target route.

## Similarity Check

- Existing routes checked:
  - Generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current text routes: `app/[locale]/texto/page.tsx`, `app/[locale]/texto/contador-caracteres/page.tsx`, and `app/[locale]/texto/conversor-maiusculas/page.tsx`.
  - Other current family routes under `app/[locale]`: `geradores`, `validadores`, `matematica`, `datas`, `cores`, and `dev`.
  - No `/texto/gerador-slug` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "texto"`.
  - `lib/constants.ts` already defines text categories `contagem-texto` and `transformacao-texto`.
  - Current text tools are `contador-caracteres` in `contagem-texto` and `conversor-maiusculas` in `transformacao-texto`.
  - No `gerador-slug` tool entry exists.
  - Use existing `transformacao-texto`; no new family or category is needed.
- Related modules/translations checked:
  - `lib/tools/text.ts` contains character counting and case-conversion helpers, URL/query builders, and hash-only content sharing helpers for case conversion. It has no slug generator helper.
  - `components/tools/text/character-counter-client.tsx` and `components/tools/text/case-converter-client.tsx` provide textarea, privacy, copy, output, and safe share patterns.
  - `components/tools/url-state.ts` provides shared query helpers.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` define the text family/category and current text tool message blocks, but no `tools.gerador-slug` keys.
  - `tests/e2e/case-converter.spec.ts` gives the closest Playwright pattern for text transformation, hash-only content sharing, URL sanitization, and mobile overflow.
- Prior plans checked:
  - `docs/tool-plans/contador-caracteres.md` lists `/texto/gerador-slug` as a future text candidate.
  - `docs/tool-plans/conversor-maiusculas.md` explicitly keeps Rank 16 `gerador-slug` separate because slug generation combines casing, accent removal, separator rules, and URL-safe normalization.
  - Current `docs/tool-plans` has no `gerador-slug.md`.
  - `docs/calculator-plans` are calculator-specific and do not overlap.
- Text search checked: `gerador de slug`, `gerador-slug`, `slug generator`, `slugify`, `gerador.*slug`, and `slug.*generator`.
- Overlap conclusion:
  - Build a new text tool at the claimed route.
  - Do not merge into `/texto/conversor-maiusculas`; case conversion is only one sub-step.
  - Do not wait for `/texto/removedor-acentos`; a slug generator can own the accent-removal behavior needed for slugs while still linking to a future standalone accent tool.
  - Do not place this under `/geradores`; the output is a text transformation of user input, and the claimed target route is under `texto`.

## User Intent And Scope

- Target user: Content editors, SEO writers, marketers, developers, product teams, students, and site owners who need to turn titles, names, headings, or labels into readable URL/path slugs.
- User job: Paste or type a title, generate a clean slug immediately, adjust separator and length options, copy the result, and optionally share safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only textarea or single-line input for the source text.
  - Default ASCII-friendly slug generation for Portuguese, English, Spanish, and common Latin-script text.
  - Lowercase normalization by default.
  - Accent/diacritic removal for Latin text where standard Unicode normalization plus a small product-owned fallback map can handle it.
  - Separator options: hyphen (`-`) default, underscore (`_`), and compact/no separator if the UI can expose it without clutter.
  - Duplicate separator collapse and edge separator trimming.
  - Optional maximum slug length with a word-boundary-friendly trim when possible.
  - Primary output plus useful actions: copy slug, copy as path segment (`/slug`), use slug as input, clear, and download `.txt` only if consistent with current text tools.
  - Warnings for empty output, unsupported/removed characters, trimmed output, and approximation limits.
  - Safe URL/share behavior that keeps source text out of the live URL unless explicitly included in a hash fragment.
- Out of scope:
  - Checking whether a slug is available in a CMS, filesystem, route table, database, DNS, social handle, or marketplace.
  - Creating canonical URLs, redirects, metadata, or SEO scores.
  - Server-side generation, API endpoints, account history, saved drafts, favorites, or storage.
  - Transliteration for every writing system. Non-Latin scripts may be removed in ASCII mode and should produce a clear warning.
  - URL encoding/decoding, Base64, UUID generation, QR code creation, title-case conversion, broad text cleanup, grammar/spell checking, AI rewriting, file renaming, or batch CSV processing.
- Sensitive-topic caveats:
  - Treat pasted titles and internal campaign names as potentially sensitive.
  - The tool should state that generation happens in the browser and source text is not intentionally sent to the server.
  - Content-bearing share links expose the source text to anyone who receives the URL.
  - Generated slugs are suggestions; users must still confirm CMS uniqueness and editorial rules.

## Tool Contract

- Inputs:
  - `texto`: free-form source text, typed or pasted by the user.
  - `separador`: one of `hifen`, `underscore`, or `nenhum`; default `hifen`.
  - `minusculas`: boolean; default `true`.
  - `limite`: optional positive integer maximum output length; empty means no explicit max beyond the global safety cap.
  - `conteudo`: explicit share flag used only for content-bearing shared links.
- Defaults:
  - `texto` empty.
  - `separador=hifen`.
  - `minusculas=true`.
  - `limite` empty/no output cap.
  - `conteudo` absent; live URLs and default shared links omit source text.
- Validation rules:
  - Empty text is valid and should show a neutral "paste a title" state, not an error.
  - Invalid `separador` values fall back to `hifen`.
  - Invalid boolean values fall back to defaults.
  - Invalid, zero, negative, non-integer, or oversized `limite` values fall back to no limit or clamp to a documented range such as 1 to 200 characters.
  - Enforce a practical input guardrail such as 500,000 characters to avoid browser freezes, with a localized warning and no expensive full scan when exceeded.
  - Do not trim the raw input before showing it; generation may trim only the derived slug.
  - Normalize line breaks and whitespace runs as separator boundaries.
  - Lowercase with locale-aware browser APIs when `minusculas=true`, using the active locale (`pt-br`, `en`, or `es`) where useful.
  - Default ASCII slug algorithm:
    - Normalize to a decomposition form such as `NFKD` or `NFD`.
    - Remove combining marks targeted at Latin accent removal.
    - Apply a small, tested product-owned fallback map only for common Latin letters that normalization does not decompose well, for example `ß -> ss`, `æ -> ae`, `œ -> oe`, `ø -> o`, `đ -> d`, and `ł -> l`.
    - Keep ASCII letters and digits.
    - Treat any run of other characters, punctuation, whitespace, emoji, symbols, slashes, dots, and reserved URL characters as a separator boundary.
    - Collapse repeated separators and trim separators from both ends.
  - The generated output must not be `.` or `..`; the default allowed-character set should already prevent this, but keep an explicit guard if compact/no-separator options change later.
  - If the result becomes empty after normalization, show a localized warning and disable copy actions.
  - If `limite` is applied, trim to the maximum length, remove trailing separators, and prefer cutting at the last separator within the limit when that still leaves a non-empty slug.
- Outputs:
  - `status`: `empty`, `generated`, `emptyAfterNormalization`, or `tooLarge`.
  - `slug`: primary generated slug.
  - `pathSegment`: `/${slug}` when non-empty.
  - `modeApplied`: normalized separator and lowercase settings.
  - `inputMetrics`: characters and UTF-8 bytes.
  - `outputMetrics`: slug characters and UTF-8 bytes.
  - `removedCharacters`: approximate count of input graphemes/characters not represented in the final slug.
  - `warnings`: flags such as `accentApproximation`, `unsupportedCharactersRemoved`, `trimmedToLimit`, `emptyAfterNormalization`, `tooLarge`, and `noChanges`.
- Result explanations:
  - Explain that the default slug is designed for readable URL path segments using lowercase ASCII letters, digits, and the selected separator.
  - Explain that accents are approximated for common Latin text; this is not complete transliteration for every language.
  - Explain that punctuation, symbols, emoji, slashes, dots, and reserved URL characters become boundaries or are removed to avoid unsafe path segments.
  - Explain that the generated slug does not guarantee uniqueness or ranking benefits.
- URL params:
  - Safe live query params: `sep` for non-default separator, `max` for a valid max length, and `minusculas=0` only if lowercase is disabled.
  - Do not sync `texto` into `window.location.search` during normal editing.
  - Preferred content-bearing share format: keep settings in query and source text in the hash fragment, for example `?sep=underscore&max=80#conteudo=1&texto=...`.
  - Read hash content only when `conteudo=1`, prefill client-side, and sanitize the live address bar after hydration so the hash is removed.
  - Invalid query or fragment params should fall back safely without crashing.
- Share behavior:
  - Default share link includes only safe settings and never includes source text.
  - Provide an explicit "incluir texto no link compartilhado" control before shared links can contain source text.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a content share budget around 1,800 encoded characters. If too long, omit `texto` from the shared link and show a warning.
  - Warn that anyone with a content-bearing link can read the source text.
- Save/favorites behavior:
  - No `SaveButton`, favorites, account save, localStorage, sessionStorage, IndexedDB, cookies, API calls, or server processing for source text or generated slugs.

## Logic, Data, And Sources

- Logic summary:
  - Implement pure slug-generation helpers either in `lib/tools/text.ts` to follow existing text tool consolidation, or in a focused `lib/tools/slug.ts` if the creator decides `text.ts` is becoming too broad. Keep all logic independent from React.
  - Suggested types: `SlugSeparator`, `SlugGeneratorState`, `SlugGeneratorResult`, `SlugGeneratorWarning`, `SlugGeneratorSearchParamsResult`, `SlugGeneratorContentFragmentResult`, and `SlugGeneratorShareUrlResult`.
  - Suggested constants: `SLUG_GENERATOR_MAX_INPUT_LENGTH`, `SLUG_GENERATOR_MAX_OUTPUT_LENGTH`, and `SLUG_GENERATOR_SHARE_FRAGMENT_LIMIT`.
  - Use `TextEncoder` and the existing grapheme/metrics helpers where practical.
  - Reuse the case converter's hash-fragment sharing model rather than the character counter's query-content model.
  - Keep the transliteration/normalization table small, explicit, and unit-tested. Do not claim complete language coverage.
  - Build URL params with `URLSearchParams` and update the live address with the existing `replaceQueryString` helper.
- Data tables or assumptions:
  - No external data table is required.
  - The Latin fallback map is product-owned and should remain small enough to understand and test.
  - The default allowed output alphabet is ASCII lowercase/uppercase letters depending on `minusculas`, digits, and the selected separator.
  - The active locale can influence lowercasing but should not change route slugs or translation namespaces.
- Official or authoritative sources:
  - RFC 3986, Uniform Resource Identifier (URI): Generic Syntax: https://www.rfc-editor.org/rfc/rfc3986. Accessed `2026-07-03`. Used for URI/path terminology, reserved/unreserved-character boundaries, and path-segment caution.
  - WHATWG URL Standard: https://url.spec.whatwg.org/. Accessed `2026-07-03`. Used for modern browser URL/path segment context and the distinction between path, query, and fragment.
  - Unicode Standard Annex #15, Unicode Normalization Forms: https://www.unicode.org/reports/tr15/. Accessed `2026-07-03`. Used for normalization assumptions and stability caveats.
  - TC39 ECMA-262 text processing sections: https://tc39.es/ecma262/multipage/text-processing.html. Accessed `2026-07-03`. Used for `String.prototype.normalize`, `toLowerCase`, and related string-processing behavior.
  - Codebase source checked on `2026-07-03`: current routes, registry, `lib/tools/text.ts`, URL helpers, messages, e2e specs, and prior tool plans.
- Source access dates:
  - External standards and current codebase: `2026-07-03`.
- Rule/table effective dates:
  - RFC 3986 is dated January 2005.
  - WHATWG URL and TC39 ECMA-262 are living/current standards pages; pin behavior with local tests rather than relying on prose alone.
  - Unicode normalization behavior is designed for stability, but newly assigned characters and browser engine behavior still warrant regression tests.
- Freshness or maintenance risk:
  - Low for ASCII separator cleanup.
  - Moderate for Unicode, transliteration, and locale-aware casing because browsers and editorial expectations differ.
  - Moderate privacy risk if content-sharing is implemented incorrectly; keep source text out of query strings and analytics by default.
- Estimator or privacy limitations:
  - Generated slugs are deterministic suggestions, not SEO guarantees.
  - Accent removal and transliteration are approximate.
  - Browser-only processing reduces server exposure, but copied text, downloaded files, shared URLs, screenshots, browser extensions, and clipboard history can still expose content.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de Slug`
  - PT-BR meta title: `Gerador de slug online grátis`
  - PT-BR description: `Transforme títulos e textos em slugs limpos para URLs, com hífen, underscore, remoção de acentos e cópia rápida no navegador.`
- Main form sections:
  - Source text section with textarea/input, browser-only privacy note, copy input action, and clear action.
  - Options section with segmented separator control, lowercase toggle, optional max-length numeric input, and a compact explanation of the selected rule.
  - Share/privacy section with safe default share and explicit include-content checkbox.
  - Result section with generated slug in a readonly field, copy slug, copy path segment, use output as input, and optional `.txt` download.
- Results sections:
  - Primary slug output.
  - Optional path segment preview (`/meu-slug`).
  - Metrics: source characters/bytes, slug characters/bytes, and removed/changed character estimate.
  - Warnings for empty result, unsupported characters removed, accents approximated, and trimmed output.
  - Optional examples list showing how spaces, accents, punctuation, and emoji are handled.
- SEO sections:
  - What a slug is and why readable URL slugs are useful.
  - How the generator handles accents, spaces, punctuation, uppercase, and separators.
  - Difference between slug generation and URL encoding.
  - Privacy note for pasted titles and internal campaign names.
  - Reminder that CMS uniqueness and redirects must be handled in the user's system.
- FAQ topics:
  - `O texto é enviado para o servidor?`
  - `O que é um slug?`
  - `A ferramenta remove acentos?`
  - `Qual separador devo usar: hífen ou underscore?`
  - `Isso substitui URL encode/decode?`
  - `O slug gerado fica disponível no meu site automaticamente?`
  - `Posso compartilhar um slug já preenchido?`
- Disclaimer or privacy copy:
  - Generation runs in the browser and the tool should not intentionally send source text to the server.
  - Do not include confidential titles or campaign names in shared links unless every recipient may read them.
  - The output is a formatting suggestion and does not check uniqueness, redirects, SEO ranking, or CMS constraints.
- Related tool links:
  - Existing: `/texto`, `/texto/contador-caracteres`, `/texto/conversor-maiusculas`, `/dev/url-encode-decode` when merged into this branch/main, `/dev/formatador-json`, and `/geradores/qr-code`.
  - Future or adjacent text candidates: `/texto/removedor-acentos`, `/texto/limpar-texto`, `/texto/ordenar-linhas`, `/texto/remover-duplicados`, and `/texto/diff-texto`.
- Translation guidance:
  - Add `tools.gerador-slug` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested tool names: PT-BR `Gerador de Slug`; EN `Slug Generator`; ES `Generador de Slug`.
  - Keep `slug` as a borrowed technical term in PT-BR/ES copy, with a short explanation in the SEO and FAQ sections.
  - Reuse existing `toolFamilies.texto` and `toolCategories.transformacao-texto`; update category descriptions only if needed to mention slugs naturally.
  - Add localized labels for separator values, lowercase toggle, max length, copy slug, copy path, source text, result statuses, warnings, share/privacy states, SEO copy, and FAQ content.
  - Keep route slug `/texto/gerador-slug` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Add pure slug helper types/constants and functions in `lib/tools/text.ts` or a focused `lib/tools/slug.ts`.
  - Implement `generateSlug(input, options)` with deterministic normalization, lowercasing, separator handling, warnings, metrics, and max-length trimming.
  - Implement safe query, hash-fragment, and share-URL helper functions analogous to the case converter.
  - Add focused unit tests in `lib/tools/text.test.ts` or a new `lib/tools/slug.test.ts` if using a focused module.
- URL state:
  - Use `components/tools/url-state.ts` helpers for initial params, live query replacement, and share URLs where applicable.
  - Sync only safe settings in the live query string: `sep`, `max`, and non-default lowercase setting.
  - Never put `texto` in the live query during typing.
  - Generate content-bearing links only from the explicit share callback and keep content in the hash fragment.
  - Sanitize hash content after hydration.
  - Enforce the share fragment budget and show a warning when content is omitted.
- UI components:
  - Create `components/tools/text/slug-generator-client.tsx`.
  - Follow the existing `CaseConverterClient` layout and privacy pattern, with a stronger result-copy focus.
  - Use existing UI primitives, `ShareButton`, lucide icons for copy/clear/download/status actions, accessible labels, stable test ids, and responsive textareas/fields.
  - Prefer a segmented control for separator mode and a toggle/checkbox for lowercase.
  - Keep long source text, long generated slugs, and localized button labels from causing mobile horizontal overflow.
- Route and metadata:
  - Add `app/[locale]/texto/gerador-slug/page.tsx`.
  - Use `ToolPageLayout` and `generateToolPageMetadata(locale, "gerador-slug")`.
  - Reuse existing `app/[locale]/texto/page.tsx`.
- Registry/family/category:
  - Reuse existing `texto` family.
  - Reuse existing `transformacao-texto` category.
  - Add a `tools` entry for `gerador-slug` with `available: true`, `familyId: "texto"`, `primaryCategoryId: "transformacao-texto"`, `categoryIds: ["transformacao-texto"]`, an appropriate icon such as `FileText` or a link/text icon from `lucide-react`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"` or `DeveloperApplication` if product positioning favors developer utility.
- Messages:
  - Add PT-BR, EN, and ES translations for metadata, form labels, option labels, result states, warnings, actions, privacy/share messages, SEO article text, related links if message-driven, and FAQ content.
- Unit tests:
  - Cover empty input, ASCII title, Portuguese accents and cedilla, decomposed combining marks, Spanish accents, uppercase/lowercase behavior, punctuation, apostrophes, slashes, dots, emoji, repeated separators, leading/trailing separators, numbers, underscore separator, compact/no-separator mode if exposed, max-length trimming, invalid params, too-large input, empty-after-normalization, unsupported-character warning, and share-fragment helpers.
- E2E hooks/tests:
  - Add stable selectors or accessible labels for source input, slug output, copy slug, copy path, clear, separator controls, lowercase toggle, max length input, include-content checkbox, share button, warning/status area, and metrics.
  - Add `tests/e2e/slug-generator.spec.ts`.
  - Extend discovery checks only if current suite expects every available tool in hub/category/sitemap coverage.
- Backlog updates:
  - Planner must not edit DB state, app code, tests, translations, or markdown backlog files.
  - Orchestrator should run `scripts/backlog/mark_planned.sql` for the claimed `tool`/`gerador-slug` row after this plan is accepted.
  - Creator should move the DB item to implementation only when implementation starts.

## Test Plan

- Unit scenarios:
  - Empty input returns `empty` with no slug and copy actions disabled by the UI.
  - `Olá, mundo! Café com açúcar` generates `ola-mundo-cafe-com-acucar`.
  - `ação e reação` generates `acao-e-reacao`.
  - Decomposed input such as `cafe\u0301 com ac\u0327ucar` generates `cafe-com-acucar`.
  - `Curso de Next.js: página #1` generates `curso-de-next-js-pagina-1`.
  - Punctuation, slashes, dots, emoji, and symbols are converted to boundaries and collapsed.
  - Leading/trailing punctuation does not leave leading/trailing separators.
  - Underscore mode generates `curso_de_next_js`.
  - Compact/no-separator mode, if exposed, generates `cursodenextjs`.
  - Lowercase disabled preserves allowed ASCII case while still normalizing unsafe characters.
  - Max length trims to the limit, prefers a prior separator, and removes trailing separators.
  - Non-Latin-only input in ASCII mode produces `emptyAfterNormalization` with a clear warning.
  - Invalid query params fall back to defaults.
  - Content share helpers keep text in the hash fragment and omit text beyond the budget.
- URL-state scenarios:
  - `?sep=underscore&max=60` initializes settings and preserves them in the live URL.
  - Typing source text does not add `texto` or `conteudo` to `window.location.search`.
  - Changing options updates only safe query params.
  - Enabling include-content does not mutate the live URL.
  - Clicking share with include-content enabled copies a URL with safe query params and `#conteudo=1&texto=...`.
  - Loading a content-bearing hash URL prefills text client-side and sanitizes the hash after hydration.
  - Invalid or malicious query/hash values cannot crash rendering or preserve unsafe live URL content.
- Browser scenarios:
  - `/texto/gerador-slug` renders the correct heading, breadcrumb, text input, options, result output, privacy note, and FAQ/SEO sections.
  - Realistic Portuguese title with accents generates the expected slug live.
  - Copy slug and copy path segment write expected clipboard values.
  - Clear resets text, slug, warnings, and share omitted state.
  - Max length and separator controls update the slug and safe query params.
  - Default share omits source text; explicit content share includes it only in the hash fragment.
  - EN and ES localized routes render translated copy while keeping the canonical route slug.
  - `/texto`, `/texto/categorias/transformacao-texto`, `/ferramentas`, and `/sitemap.xml` include the new tool after registry wiring.
  - Mobile viewport has no horizontal overflow with a very long source title and long generated slug.
  - No non-auth console errors or page errors.
- Playwright scenarios:
  - Navigate to `/texto/gerador-slug` and assert heading `Gerador de Slug`.
  - Fill `Olá, mundo! Café com açúcar` and assert output `ola-mundo-cafe-com-acucar`.
  - Assert the live URL omits the source text by default.
  - Switch separator to underscore and assert output plus `sep=underscore` query behavior.
  - Set max length and assert trim/warning behavior.
  - Copy slug and path segment through clipboard permissions.
  - Share default safe URL and explicit hash-content URL.
  - Visit a hash-content URL, assert input hydration, output generation, and hash sanitization.
  - Smoke EN and ES localized route content.
  - Assert directory/category/sitemap discovery.
  - Assert mobile no-overflow.
- Lint/build commands:
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts lib/constants.test.ts` or the equivalent focused test files if a new slug module is created.
  - Message JSON parse for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Targeted ESLint for new/edited route, component, helper, and tests.
  - `tsc --noEmit`.
  - `next build` with required local env/Prisma setup used by the repo.
  - Focused Playwright for `tests/e2e/slug-generator.spec.ts`.
  - `git diff --check`.
- Acceptance criteria:
  - The plan implementation produces a usable browser-only `/texto/gerador-slug` tool.
  - Source text is never placed in live query params during normal use.
  - Default share URLs contain only safe options.
  - Explicit source-text share uses a bounded hash fragment and sanitizes after hydration.
  - PT-BR/EN/ES translations, registry, sitemap, directory, route metadata, unit tests, and e2e coverage are complete.

## Implementation Notes

- Status updates:
  - `2026-07-03`: Planner decision `new`; plan written from the authoritative claimed DB item JSON. No DB state was changed by the planner.
  - `2026-07-03`: Creator started implementation after orchestrator/user context confirmed DB item `In Progress` stage `implementation`; plan status moved to `in_progress`.
  - `2026-07-03`: Creator implemented the browser-only slug generator at `/texto/gerador-slug` and left DB item for review/tester handoff.
  - `2026-07-03`: Review-fix worker addressed the accepted Unicode compatibility-symbol finding while the DB item is `In Progress` stage `review`.
  - `2026-07-03`: Independent tester validated the implementation; DB item was read as `In Progress` stage `testing`, and plan status moved to `verified`.
- Files changed:
  - `docs/tool-plans/gerador-slug.md`
  - `lib/tools/text.ts`
  - `lib/tools/text.test.ts`
  - `components/tools/text/slug-generator-client.tsx`
  - `app/[locale]/texto/gerador-slug/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/slug-generator.spec.ts`
- Review-fix files changed:
  - `docs/tool-plans/gerador-slug.md`
  - `lib/tools/text.ts`
  - `lib/tools/text.test.ts`
- PR-review findings addressed:
  - `lib/tools/text.ts`: gated slug NFKD/fallback mapping to source graphemes composed only of Latin letters, decimal digits, or combining marks, so compatibility symbols such as `№`, `①`, `℠`, and `㎏` now become boundaries/removals instead of slug text.
- Validation results:
  - `git diff --check --no-index /dev/null docs/tool-plans/gerador-slug.md` produced no whitespace warnings; exit code `1` was expected for a new-file no-index diff.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts` passed: 1 file, 37 tests.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts lib/constants.test.ts` passed: 2 files, 43 tests.
  - `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('messages ok')"` passed.
  - `node -e "<gerador-slug message key parity check>"` passed for PT-BR, EN, and ES.
  - `./node_modules/.bin/eslint lib/tools/text.ts lib/tools/text.test.ts components/tools/text/slug-generator-client.tsx 'app/[locale]/texto/gerador-slug/page.tsx' lib/constants.ts tests/e2e/slug-generator.spec.ts` passed.
  - Initial `./node_modules/.bin/tsc --noEmit` failed because Prisma client had not been generated (`@prisma/client` missing `PrismaClient` export).
  - Initial `./node_modules/.bin/prisma generate` failed because `DATABASE_URL` was missing.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` first failed under sandbox on `/Users/saulodefaria/.cache/prisma/.../schema-engine`, then passed with escalation.
  - `./node_modules/.bin/tsc --noEmit` passed after Prisma generate.
  - Initial direct focused Playwright command failed under sandbox with the known macOS `MachPortRendezvousServer` Chromium permission error.
  - Elevated `PORT=3197 NEXT_DIST_DIR=.next-e2e PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3197" ./node_modules/.bin/playwright test tests/e2e/slug-generator.spec.ts` passed: 7 Chromium tests.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build` passed; only existing `metadataBase` warnings were emitted.
  - `git diff --check` passed.
  - No-index whitespace checks against `/dev/null` for the new route, client, e2e spec, and plan produced no warnings; exit code `1` was expected for new-file diffs.
  - Review-fix `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts lib/constants.test.ts` passed: 2 files, 44 tests.
  - Review-fix `git diff --check` passed.
  - Tester DB read: `psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=gerador-slug -f scripts/backlog/get_item.sql` returned `ok: true`, status `In Progress`, stage `testing`, target route `/texto/gerador-slug`, and plan path `docs/tool-plans/gerador-slug.md`.
  - Tester updated `tests/e2e/slug-generator.spec.ts` only to add PT-BR FAQ/SEO assertions, browser compatibility-symbol regression coverage, and privacy checks for absent save UI, storage/cookies, request URLs, and favorites API leakage.
  - Tester initial sandboxed focused Playwright run on port `3198` failed before assertions because Chromium could not launch with the known macOS `MachPortRendezvousServer` permission error.
  - Tester first browser-capable focused Playwright run on port `3198` executed assertions; 7/9 passed and 2 test assumptions failed (`Dúvidas rápidas` FAQ title and expected Auth.js session polling).
  - Tester corrected the e2e assertions without changing production code.
  - Tester final browser-capable focused Playwright command passed: `PORT=3199 NEXT_DIST_DIR=.next-e2e PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3199" ./node_modules/.bin/playwright test tests/e2e/slug-generator.spec.ts` ran 9 Chromium tests, 9 passed.
  - Tester `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts lib/constants.test.ts` passed: 2 files, 44 tests.
  - Tester `./node_modules/.bin/eslint tests/e2e/slug-generator.spec.ts` passed.
  - Tester `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('messages ok')"` passed.
  - Tester `git diff --check` passed.
  - Tester confirmed no listener remained on ports `3198` or `3199` after Playwright completed.
- Tester findings:
  - Passed. No production tool failure found.
  - Browser coverage included PT-BR route load, heading, form, privacy copy, output, FAQ, SEO article headings, realistic accented slug output, compatibility symbols (`№`, `①`, `℠`, `㎏`) as boundaries/removals, safe live URL behavior, default share without source text, explicit hash-only content sharing, hash hydration and sanitization, separator/lowercase/max options, copy slug, copy path, use output, download, clear, EN/ES smoke routes, `/texto`, category, `/ferramentas`, sitemap discovery, mobile no-overflow, no non-auth console/page errors, and no source-text leakage through storage/cookies/request URLs or favorites API.
- Remaining tester focus:
  - None. The implementation is ready for orchestrator finalization.
- Final status:
  - Plan is `verified`. DB item should remain `In Progress` stage `testing` for orchestrator finalization; tester did not mark DB `Done`.
