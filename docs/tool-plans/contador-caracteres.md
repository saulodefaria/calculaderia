---
slug: "contador-caracteres"
familyId: "texto"
primaryCategoryId: "contagem-texto"
backlogRank: 2
primaryKeyword: "contador de caracteres"
decision: "new"
targetRoute: "/texto/contador-caracteres"
status: "verified"
createdAt: "2026-06-18"
updatedAt: "2026-06-18"
---

# Contador de Caracteres Plan

## Backlog Row

- Rank: 2
- Original status: Backlog
- Slug: `contador-caracteres`
- Primary keyword: `contador de caracteres`
- Cluster keywords: `contador de palavras`; `contar caracteres online`; `contador texto`
- Family/category: backlog family `texto`; planned family `texto`; planned category `contagem-texto`
- Opportunity score: 86
- Idea type: New
- Notes: Simple, evergreen, privacy-friendly text utility.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/texto/contador-caracteres`
- Rationale: The selected backlog row is a new non-calculator text utility and no existing route, registry entry, logic module, translation key, or prior plan covers character/word counting. The route should use the backlog family hint because several planned text tools (`conversor-maiusculas`, `removedor-acentos`, `diff-texto`, `limpar-texto`, `contador-linhas`) justify a first-class `texto` family rather than forcing this into `geradores`, `validadores`, `matematica`, or `datas`.

## Similarity Check

- Existing routes checked: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, all current top-level family routes under `app/[locale]`, and current tool pages under `geradores`, `validadores`, `matematica`, and `datas`. No `/texto` or `/texto/contador-caracteres` route exists.
- Registry/categories checked: `lib/constants.ts` currently defines `ToolFamilyId` values `calculadoras`, `geradores`, `validadores`, `matematica`, and `datas`. It has no `texto` family, no text category, and no `contador-caracteres` tool entry.
- Related modules/translations checked: `lib/tools`, `components/tools`, `components/tools/url-state.ts`, `lib/url-state`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. Existing text references are QR text mode labels, password character-set copy, and `contador-de-dias`; none count free-form text.
- Prior plans checked: `docs/tool-plans/qr-code.md`, `docs/tool-plans/_template.md`, and calculator plans under `docs/calculator-plans`. No duplicate character counter plan exists.
- Overlap conclusion: Build a new tool. Absorb the future `contador-linhas` enhancement idea into this page by including line and paragraph counts, but do not create or mark a separate backlog item.

## User Intent And Scope

- Target user: Writers, students, marketers, developers, support teams, and anyone who needs a fast browser-only count for pasted text.
- User job: Paste or type text and immediately see character, word, line, paragraph, sentence, and byte counts, with optional limit feedback for form fields or content requirements.
- In scope:
  - Large textarea for free-form text.
  - Live counts for characters with spaces, characters without spaces, words, lines, non-empty lines, paragraphs, sentences, and UTF-8 bytes.
  - Optional custom character limit with remaining/exceeded feedback.
  - Copy text, clear text, and copy summary actions.
  - Privacy-aware sharing that does not put pasted text into the URL unless explicitly requested.
- Out of scope:
  - Grammar/spell checking, AI rewriting, plagiarism checks, tone analysis, SEO scoring, social network limit tables, file uploads, account history, saved drafts, or server-side text processing.
  - A separate `/texto/contador-linhas` route in the first build.
- Sensitive-topic caveats:
  - Treat pasted text as potentially sensitive. The UI should say counting happens in the browser and text is not sent to the server.
  - Shared links with included text are public to anyone who receives the URL.

## Tool Contract

- Inputs:
  - `texto`: free-form string entered in a textarea.
  - `limite`: optional positive integer character limit.
  - `conteudo`: optional explicit URL flag (`1`) that allows `texto` to be loaded from and included in the query string.
- Defaults:
  - `texto` empty.
  - `limite` empty/no limit.
  - `conteudo` absent; default share URL should omit text content.
- Validation rules:
  - Empty text is valid and should show zero counts, not an error state.
  - Trim no user text before counting; counts must reflect the exact textarea value.
  - Clamp `limite` to a practical range such as 1 to 1,000,000. Invalid or missing limits should behave as no limit.
  - Keep textarea input responsive for large text. If implementation needs a guardrail, use a high client-side cap such as 500,000 characters and show a clear message.
  - If `conteudo=1&texto=...` exceeds a safe URL length budget, ignore or truncate only during share-link creation with a visible warning; never mutate the textarea silently.
- Outputs:
  - Character count with spaces.
  - Character count without whitespace.
  - Word count.
  - Sentence count.
  - Line count.
  - Non-empty line count.
  - Paragraph count.
  - UTF-8 byte count.
  - Optional limit result: remaining characters, exceeded characters, and percentage of limit used.
  - Readable summary text suitable for copy.
- Result explanations:
  - Explain that "caracteres" means user-visible characters/grapheme clusters when supported by the browser.
  - Explain that whitespace-free characters remove spaces, tabs, and line breaks.
  - Explain that byte count is useful for systems with storage or payload limits and can be larger than the character count for accents and emoji.
- URL params:
  - `limite`: synced automatically when valid.
  - `conteudo=1`: explicit opt-in to include text in URLs generated by the share action and to load text from shared links.
  - `texto`: read only when `conteudo=1`; generated only for the explicit `ShareButton` URL and never synced into the live address bar.
  - Invalid query params should fall back to defaults without crashing.
- Share behavior:
  - Default `ShareButton` URL should include only safe params, usually just `limite`.
  - Provide an explicit "incluir texto no link" control before `ShareButton` generates `conteudo=1&texto=...`; toggling the control must not mutate the address bar.
  - Loading `?conteudo=1&texto=...` should prefill the textarea, then sanitize the live address bar back to safe params after hydration.
  - Surface that a link with text can expose the full pasted content.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not use localStorage/sessionStorage for the pasted text in the first build.
  - Do not send text to server components, analytics events, logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/text.ts` with `analyzeText(input, options)` returning deterministic count fields.
  - Count user-visible characters by grapheme cluster with `Intl.Segmenter` when available; fall back to `Array.from(input)` code point counting.
  - Count whitespace-free characters by filtering grapheme clusters whose text is not only Unicode whitespace.
  - Count words with `Intl.Segmenter(locale, { granularity: "word" })` and `isWordLike` when available; fall back to Unicode letter/number token matching.
  - Count sentences with `Intl.Segmenter(locale, { granularity: "sentence" })` when available; fallback may count non-empty punctuation-delimited spans.
  - Count lines by normalizing CRLF/CR/LF separators; empty input should return 0 lines, non-empty text should return line breaks + 1.
  - Count paragraphs as non-empty blocks separated by one or more blank lines.
  - Count UTF-8 bytes with `TextEncoder`.
- Data tables or assumptions:
  - No external data tables are required.
  - The browser locale can come from the current app locale (`pt-br`, `en`, `es`) for word/sentence segmentation.
  - Word and sentence counts are best-effort linguistic segmentation, not grammar validation.
- Official or authoritative sources:
  - No government, legal, financial, public-rate, or table source is required.
  - The implementation relies on standard browser APIs (`Intl.Segmenter`, `TextEncoder`) and should verify current support/API behavior during implementation if browser targets change.
  - Codebase source checked on 2026-06-18: current tool layout, registry, URL helper, routes, and translations.
- Source access dates: Codebase checked on 2026-06-18.
- Rule/table effective dates: Not applicable.
- Freshness or maintenance risk:
  - Low. Counts are deterministic and client-side.
  - Moderate browser-compatibility risk around `Intl.Segmenter`; keep fallbacks and unit tests for emoji, accents, combining marks, and punctuation.
- Estimator or privacy limitations:
  - Word/sentence segmentation can differ from editors, social platforms, and search tools.
  - Browser-only processing reduces exposure but does not make shared links or copied summaries private.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Contador de Caracteres`
  - PT-BR meta title: `Contador de caracteres online gratis`
  - PT-BR description: `Conte caracteres, palavras, linhas, paragrafos e bytes no navegador, sem enviar o texto para o servidor.`
- Main form sections:
  - Text input card with textarea, clear action, copy text action, and privacy note.
  - Optional limit control with numeric input and progress/remaining indicator.
  - Share controls with a clear default safe link and explicit include-content option.
- Results sections:
  - Primary metric cards: characters, characters without spaces, words, lines.
  - Secondary metric cards: non-empty lines, paragraphs, sentences, UTF-8 bytes.
  - Limit feedback block when `limite` is set.
  - Copy summary action.
- SEO sections:
  - What the character counter counts.
  - Difference between characters, words, lines, paragraphs, and bytes.
  - Privacy note for pasted text.
  - Why counts may differ between tools because of emoji, accents, and segmentation rules.
- FAQ topics:
  - `O texto e enviado para o servidor?`
  - `Qual e a diferenca entre caracteres com e sem espacos?`
  - `Emoji conta como um caractere?`
  - `Por que a contagem de palavras pode variar?`
  - `Posso compartilhar um texto ja preenchido?`
- Disclaimer or privacy copy:
  - The tool analyzes text in the browser.
  - Do not include confidential text in a shared URL unless every recipient is allowed to read it.
  - Counts are informational and can differ from external platforms with proprietary counting rules.
- Related tool links:
  - Existing: `/ferramentas` and, after family creation, `/texto`.
  - Future backlog candidates: `/texto/conversor-maiusculas`, `/texto/removedor-acentos`, `/texto/gerador-slug`, `/texto/diff-texto`, `/texto/limpar-texto`.
  - Treat `/texto/contador-linhas` as merged into this tool unless a later plan needs a separate advanced line utility.
- Translation guidance:
  - Add `toolFamilies.texto` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add `toolCategories.contagem-texto` keys in all locales.
  - Add `tools.contador-caracteres` keys for title, description, metadata, form labels, result labels, actions, validation/warnings, SEO text, and FAQ content.
  - Suggested names: PT-BR `Contador de Caracteres`; EN `Character Counter`; ES `Contador de Caracteres`.
  - Keep route slug `/texto/contador-caracteres` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/text.ts` with `analyzeText`, count types, limit helpers, and segmentation fallbacks.
  - Add focused unit tests in `lib/tools/text.test.ts`.
- URL state:
  - Use `components/tools/url-state.ts` helpers for initial params, `replaceQueryString`, and share URLs.
  - Sync only `limite` by default; sync `texto` only with explicit `conteudo=1`.
  - Enforce a share URL size guard and show a user-facing warning if content is too long for link sharing.
- UI components:
  - Create `components/tools/text/character-counter-client.tsx` or an equivalent folder that matches existing family-specific component patterns.
  - Use existing UI primitives, lucide icons for copy/clear/share actions, stable result-card dimensions, and accessible labels/test ids.
  - Keep the textarea and result grid usable on mobile without horizontal overflow.
- Route and metadata:
  - Add `app/[locale]/texto/page.tsx` using `ToolFamilyDirectoryPage` and `generateToolFamilyMetadata(locale, "texto")`.
  - Add `app/[locale]/texto/contador-caracteres/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "contador-caracteres")`.
- Registry/family/category:
  - Add `texto` to `ToolFamilyId`, `toolFamilies`, visible family translations, sitemap, and directory support through existing registry helpers.
  - Add a text-oriented lucide icon import, such as `LetterText` or another available text icon.
  - Add `contagem-texto` to `ToolCategoryId` under family `texto`, href `/texto/categorias/contagem-texto`.
  - Add `contador-caracteres` to `tools` with `available: true`, `familyId: "texto"`, `primaryCategoryId: "contagem-texto"`, `categoryIds: ["contagem-texto"]`, `popularRank: 2`, `sitemapPriority` around `0.8`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
- Messages:
  - Add PT-BR, EN, and ES translations for the family, category, tool, form, results, URL/share privacy messages, SEO article, and FAQ content.
- Unit tests:
  - Cover empty text, ASCII, Portuguese accents, emoji, combining marks, CRLF/LF line endings, blank lines, whitespace-only input, punctuation, byte length, and limit feedback.
- E2E hooks/tests:
  - Add stable accessible labels and/or test ids for textarea, clear, copy text, copy summary, limit input, include-content control, primary count cards, and share button.
  - Extend `tests/e2e/tools-hub.spec.ts` or add a focused `character-counter.spec.ts`.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark the row `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Empty input returns zero for every count.
  - `Ola mundo` returns expected character, no-space, word, line, paragraph, byte, and limit values.
  - Accented words and emoji do not crash and follow grapheme/code-point fallback expectations.
  - CRLF and LF line endings produce consistent line and non-empty-line counts.
  - Blank-line-separated text produces expected paragraph counts.
  - Whitespace-only input counts characters/bytes but zero words and paragraphs.
  - Invalid, zero, negative, and oversized limits are handled deterministically.
- URL-state scenarios:
  - `?limite=280` initializes the limit and preserves it in the address bar.
  - Typing text does not add `texto` to `window.location.search` by default.
  - Enabling include-content does not add `conteudo` or `texto` to `window.location.search`.
  - Clicking share with include-content enabled copies a URL with `conteudo=1` and `texto`.
  - Loading `?conteudo=1&texto=...` pre-fills the textarea and then sanitizes the live address bar.
  - Invalid query values fall back safely.
- Browser scenarios:
  - `/texto/contador-caracteres` renders the correct title, breadcrumb, textarea, result cards, and privacy note.
  - Pasting multiline Portuguese text updates all counts live.
  - Clear resets counts and text.
  - Copy summary works and includes the main metrics.
  - Limit feedback shows remaining and exceeded states.
  - Mobile viewport has no horizontal overflow and keeps long text/count labels readable.
- Playwright scenarios:
  - Navigate to `/texto/contador-caracteres` and assert heading `Contador de Caracteres`.
  - Fill text and assert visible counts for characters, words, lines, and bytes.
  - Assert the current URL does not contain pasted text by default.
  - Enable include-content, assert the live URL remains safe, share, and assert the copied URL includes `conteudo=1` and encoded `texto`.
  - Visit a shared content URL and assert it prefills text while sanitizing the live URL after hydration.
  - Visit `/texto` and assert the family directory lists `Contador de Caracteres`.
  - Assert `/sitemap.xml` includes `/texto` and `/texto/contador-caracteres`.
- Lint/build commands:
  - Run the repo unit test command for `lib/tools/text.test.ts`.
  - Run the relevant Playwright e2e command.
  - Run the repo lint command.
  - Run the repo build command.
- Acceptance criteria:
  - New text family, category, route, and tool page are discoverable through the tools hub and sitemap.
  - Counts update live and match the documented contract.
  - Pasted text remains client-side and is not placed in URLs by default.
  - Explicit share-with-content behavior is clear and tested.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, and build validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-18: Planner selected `new` and wrote this buildable plan for `/texto/contador-caracteres`.
  - 2026-06-18: Creator started implementation and marked the backlog row `In Progress`.
  - 2026-06-18: Review-fix pass addressed accepted privacy, validation, and e2e clipboard findings while preserving the original plan scope.
  - 2026-06-18: Tester validated `/texto/contador-caracteres` after the repeated review gate passed and marked this plan `verified`.
  - 2026-06-18: Orchestrator marked the backlog row `Done` after implementation, review fixes, and tester validation passed.
  - 2026-06-18: Draft PR opened at https://github.com/saulodefaria/calculaderia/pull/11 and recorded in the backlog Done Ref.
- Files changed:
  - `docs/tool-plans/contador-caracteres.md`
  - `docs/tool-backlog.md`
  - `lib/tools/text.ts`
  - `lib/tools/text.test.ts`
  - `components/tools/text/character-counter-client.tsx`
  - `app/[locale]/texto/page.tsx`
  - `app/[locale]/texto/contador-caracteres/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/character-counter.spec.ts`
- Validation results:
  - `pnpm test -- lib/tools/text.test.ts` passed on 2026-06-18.
  - `pnpm lint` passed on 2026-06-18.
  - `pnpm build` initially failed before Next.js because `DATABASE_URL` was not set for `prisma generate`; `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed on 2026-06-18.
  - `pnpm test:e2e -- tests/e2e/character-counter.spec.ts` failed in the sandbox because Chromium could not register `MachPortRendezvousServer`; `pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` passed outside the sandbox on 2026-06-18.
  - Review-fix rerun: `pnpm test -- lib/tools/text.test.ts` passed on 2026-06-18.
  - Review-fix rerun: `pnpm lint` passed on 2026-06-18.
  - Review-fix sandbox fresh-port rerun: `env PORT=3101 pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` failed before tests because Chromium could not register `MachPortRendezvousServer` (`Permission denied (1100)`).
  - Review-fix elevated fresh-port rerun: `env PORT=3101 pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` passed on 2026-06-18 with 4 tests.
  - Review-fix rerun: `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed on 2026-06-18.
  - Tester coverage update: `tests/e2e/character-counter.spec.ts` now fails on browser console errors and uncaught page errors, asserts the privacy note and textarea visibility, and verifies both remaining and exceeded limit feedback.
  - Tester sandbox note: `pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` on the default port reused an existing stale server on port 3100, showing 404/AuthJS noise, so it was rerun on a fresh port.
  - Tester sandbox fresh-port rerun: `env PORT=3105 pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` failed before assertions because Chromium could not register `MachPortRendezvousServer` (`Permission denied (1100)`) and reported `kill EPERM` during cleanup.
  - PASS: Tester elevated fresh-port rerun `env PORT=3106 pnpm run test:e2e -- tests/e2e/character-counter.spec.ts` passed on 2026-06-18 with 4 tests in 6.4s.
  - PASS: Tester rerun `pnpm lint` passed after the focused e2e coverage update.
- PR-review findings addressed:
  - `security(privacy)`: live history updates now write only safe params (`limite`), shared content is generated only inside the explicit share callback, and shared content links are sanitized after hydration while still prefilling the textarea.
  - `issue(validation)`: `normalizeCharacterLimit` now accepts only positive integer numeric callers and plain positive integer string params/input; decimal, exponent, and hex-like strings behave as no limit.
  - `test-gap(e2e)`: clipboard URL checks now use `expect.poll`, and e2e coverage asserts both safe live URLs and content-bearing copied share URLs.
- Tester findings:
  - PASS: Browser validation through the focused Playwright spec verified route load without redirect loops, title `Contador de Caracteres`, breadcrumb links, visible textarea, visible result cards, and the browser-only privacy note.
  - PASS: Realistic multiline Portuguese text `Olá mundo\nLinha 2` produced 17 characters, 14 non-whitespace characters, 4 words, 2 lines, and 18 UTF-8 bytes. Limit feedback showed 3 remaining at limit 20 and 7 above the limit at limit 10.
  - PASS: Default live URL and default share URL excluded pasted text. Enabling include-content left the live URL safe and copied a share URL with `conteudo=1&texto=...`. Visiting a shared content URL prefilled the textarea and sanitized `texto`/`conteudo` from the live URL after hydration.
  - PASS: `/ferramentas` listed the `texto` family, `/texto` listed `Contador de Caracteres`, and `/sitemap.xml` contained `/texto` and `/texto/contador-caracteres`.
  - PASS: Mobile viewport at 390px stayed usable with no horizontal overflow.
  - PASS: Console/page-error guard stayed empty during the elevated browser run, so no hydration errors or uncaught exceptions were observed.
  - No implementation failures found and no production-code fix handoff required.
- Final status:
  - `verified`
  - Plan validation is complete for `/texto/contador-caracteres`; backlog row is `Done` with draft PR https://github.com/saulodefaria/calculaderia/pull/11 in Done Ref.
