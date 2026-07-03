---
slug: "removedor-acentos"
familyId: "texto"
primaryCategoryId: "transformacao-texto"
backlogRank: 15
primaryKeyword: "remover acentos"
decision: "new"
targetRoute: "/texto/removedor-acentos"
status: "verified"
createdAt: "2026-07-02"
updatedAt: "2026-07-02"
---

# Removedor de Acentos Plan

## Backlog Row

- Rank: 15
- Original status: `In Progress`
- Kind: `tool`
- Slug: `removedor-acentos`
- Primary keyword: `remover acentos`
- Cluster keywords: not provided in claimed JSON.
- Family/category: backlog family `texto`; planned family `texto`; planned category `transformacao-texto`
- Opportunity score: not provided in claimed JSON.
- Idea type: New
- Branch: `codex/removedor-acentos-tool`
- Target route from row: `/texto/removedor-acentos`
- Plan path from row: `docs/tool-plans/removedor-acentos.md`
- Claimed by: `019f255b-410c-7b83-b85a-46084a06368b`
- Claim expires at: `2026-07-04T12:24:36.449265+00:00`
- Notes: not provided in claimed JSON.
- Done ref: not provided in claimed JSON.

## Decision

- Decision: `new`
- Target route: `/texto/removedor-acentos`
- Rationale: The claimed row is a new browser-only text utility. The app already has a first-class `texto` family and the `transformacao-texto` category, but no route, registry entry, helper, component, translation block, e2e spec, or prior plan for accent removal. A dedicated route matches the primary keyword and keeps accent removal separate from case conversion, character counting, slug generation, and broader text cleanup.

## Similarity Check

- Existing routes checked:
  - Text family routes: `app/[locale]/texto/page.tsx`, `app/[locale]/texto/contador-caracteres/page.tsx`, and `app/[locale]/texto/conversor-maiusculas/page.tsx`.
  - Generic family/category routes: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Other tool family routes under `app/[locale]`, including `dev`, `geradores`, `validadores`, `matematica`, `datas`, and `cores`.
  - No `/texto/removedor-acentos` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "texto"`.
  - `lib/constants.ts` already defines text categories `contagem-texto` and `transformacao-texto`.
  - Current text tools are `contador-caracteres` and `conversor-maiusculas`; no `removedor-acentos` tool entry exists.
  - Accent removal fits the existing `transformacao-texto` category; no new family or category is needed.
- Related modules/translations checked:
  - `lib/tools/text.ts` contains character counting, case conversion, URL-state, and share-fragment helpers. It has no accent-removal contract.
  - `components/tools/text/character-counter-client.tsx` and `components/tools/text/case-converter-client.tsx` are the nearest UI/privacy patterns for textarea text tools.
  - `components/tools/url-state.ts` provides generic query replacement and share URL helpers.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` contain `toolFamilies.texto`, `toolCategories.transformacao-texto`, `tools.contador-caracteres`, and `tools.conversor-maiusculas`, but no `tools.removedor-acentos`.
- Prior plans checked:
  - `docs/tool-plans/contador-caracteres.md` lists `/texto/removedor-acentos` as a future text utility.
  - `docs/tool-plans/conversor-maiusculas.md` explicitly keeps Rank 15 `removedor-acentos` separate because accent removal changes characters, not only casing.
  - No duplicate `docs/tool-plans/removedor-acentos.md` existed before this plan.
- Text search checked:
  - `removedor-acentos`, `remover acentos`, `remove accents`, `accent remover`, `sem acentos`, `acentos`, `diacrit`, `normalize`, `normalização`, and related Portuguese/English/Spanish terms across allowed route, constants, helper, component, message, test, and plan paths.
- Overlap conclusion:
  - Build a new tool page.
  - Reuse the existing `texto` family and `transformacao-texto` category.
  - Keep `/texto/conversor-maiusculas` separate because casing preserves letters and diacritics.
  - Keep future `/texto/gerador-slug` separate because slug generation also lowercases, removes punctuation, applies separators, and enforces URL-safe output.
  - Keep future `limpar-texto`, `ordenar-linhas`, `remover-duplicados`, and `diff-texto` ideas separate because they transform structure or compare text rather than removing diacritics.

## User Intent And Scope

- Target user: Students, editors, marketers, developers, spreadsheet users, support teams, and office users who need a quick plain-text version without accents for forms, imports, search keys, filenames, legacy systems, or manual cleanup.
- User job: Paste text, remove accents and cedilla-like diacritics in the browser, review the transformed output, copy or download it, and optionally share safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only textarea input and output.
  - Default accent removal for Latin text by decomposing Unicode text and removing combining diacritical marks.
  - Portuguese examples such as `ação`, `Àrvore`, `coração`, `pão`, `João`, `Müller`, and `Crème brûlée`.
  - Preserve original casing, punctuation, spacing, tabs, and line breaks by default.
  - Convert common accented Latin letters and cedilla after decomposition, for example `ç` to `c`, `á` to `a`, `ã` to `a`, `é` to `e`, `ñ` to `n`, and `ü` to `u`.
  - Optional compatibility mode for users who explicitly want broader Unicode compatibility decomposition, such as ligatures or fullwidth forms, with warning copy that this goes beyond accent removal.
  - Output preview, copy output, copy input, use output as input, clear, and download `.txt`.
  - Metrics for input/output characters, UTF-8 bytes, changed characters, and removed mark count.
  - Privacy-aware sharing that keeps pasted text out of the live URL unless the user explicitly includes it in a hash-only share link.
- Out of scope:
  - Slug generation, separator replacement, lowercase conversion, whitespace cleanup, punctuation removal, emoji stripping, transliteration for letters without Unicode decompositions, phonetic romanization, language detection, grammar/spell checking, AI rewriting, rich text preservation, file upload conversion, account history, saved drafts, and server-side text processing.
  - Guaranteeing that every non-ASCII letter becomes ASCII. Examples such as `ø`, `ß`, `æ`, `ð`, `þ`, and many non-Latin scripts may remain unchanged unless compatibility decomposition covers them.
- Sensitive-topic caveats:
  - Treat pasted text as potentially sensitive. The UI should say transformation happens in the browser and the tool should not intentionally send text to the server.
  - Shared links with included content are readable by anyone who receives the URL.
  - Removing accents can change names, addresses, legal text, passwords, codes, identifiers, and words in languages where diacritics distinguish meaning. Users should review important output before publishing or importing it.

## Tool Contract

- Inputs:
  - `texto`: free-form string entered in a textarea.
  - `modo`: `acentos` or `compatibilidade`; default `acentos`.
  - `conteudo`: optional explicit share flag used only in the URL fragment/hash for links that include `texto`.
- Defaults:
  - `texto` empty.
  - `modo=acentos`.
  - `conteudo` absent, so live URLs and default share links omit pasted text.
- Validation rules:
  - Empty text is valid and should show a neutral "paste text" state, not an error.
  - Invalid `modo` values fall back to `acentos`.
  - Do not trim input before transformation.
  - Preserve casing, punctuation, whitespace, tabs, and line breaks.
  - Enforce a practical input guardrail such as 500,000 characters to avoid browser freezes; oversized input should return a clear localized warning without expensive transformation.
  - Do not apply broad `\p{M}` removal to arbitrary text by default if it would strip emoji variation selectors or essential marks from non-Latin scripts. The default should be Latin-focused accent removal using Unicode decomposition plus a combining-diacritical-mark range.
  - Compatibility mode must be opt-in and clearly labeled because it can change symbols and formatting distinctions beyond accent removal.
  - Invalid query or fragment params should fall back safely without crashing.
- Outputs:
  - `status`: `empty`, `converted`, `unchanged`, or `tooLarge`.
  - `output`: transformed text when valid.
  - `modeApplied`: normalized mode id.
  - `inputMetrics`: characters and UTF-8 bytes.
  - `outputMetrics`: characters and UTF-8 bytes.
  - `changedCharacters`: count of grapheme or code point positions whose text changed, as a best-effort metric.
  - `removedMarks`: count of removed combining diacritical marks.
  - `warnings`: optional flags such as `noAccentMarks`, `largeInput`, `compatibilityMode`, and `limitedTransliteration`.
- Result explanations:
  - Explain that default mode removes common Latin accents and cedilla by Unicode normalization, while preserving case and spacing.
  - Explain that compatibility mode may also alter ligatures, fullwidth forms, circled numbers, superscripts, and other compatibility characters.
  - Explain that the tool is not a complete transliterator and some letters may remain unchanged.
  - Explain that browser Unicode support and future Unicode versions can affect edge cases, but the common Portuguese/Latin cases should be deterministic.
- URL params:
  - Safe live query params: `modo` only when not default.
  - Do not sync `texto` into `window.location.search` during normal editing.
  - Preferred content-bearing share format: `#conteudo=1&texto=...` only when the user opts in.
  - On load, read hash content only when `conteudo=1`, prefill client-side, then sanitize the live address bar after hydration so text is not retained in `window.location.search` or visible hash.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Provide an explicit "incluir texto no link compartilhado" control before a generated link can contain content.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a content share budget around 1,800 encoded characters. If the content is too long, omit `texto` from the share link and show a warning.
  - Warn that anyone with a content-bearing link can read the pasted text.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input, output, result metrics, or copied summaries in localStorage, sessionStorage, analytics events, server logs, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Add pure helper logic for accent removal either by extending `lib/tools/text.ts` or by adding a focused text helper if that keeps the module clearer. Match the existing text-tool pattern with typed state, result, warning, URL/search param, fragment, and share URL helpers.
  - Suggested types: `AccentRemovalMode`, `AccentRemovalState`, `AccentRemovalStatus`, `AccentRemovalWarning`, `AccentRemovalMetrics`, and `AccentRemovalResult`.
  - Default mode should call `input.normalize("NFD")`, remove combining diacritical mark code points in the standard combining diacritical mark ranges, then normalize the output back to `NFC`.
  - Compatibility mode should call `input.normalize("NFKD")`, remove the same diacritical marks, then normalize output to `NFC`; label it as broader cleanup, not plain accent removal.
  - Prefer explicit combining-diacritical-mark ranges over removing every Unicode `Mark` category so emoji variation selectors and script-essential marks are not stripped unintentionally.
  - Keep all transformation logic independent from React so it can be unit-tested directly.
  - Reuse existing text helper patterns for `TextEncoder`, grapheme metrics with `Intl.Segmenter` fallback, URL-safe settings, explicit content fragment handling, and share URL generation.
- Data tables or assumptions:
  - No government, legal, financial, public-rate, check-digit, security, file-processing, or table-driven source is required.
  - The tool operates on plain Unicode strings, not HTML, Markdown semantics, rich text spans, or files.
  - Default accent removal is optimized for Latin-script text, especially Portuguese/Spanish/French-like examples, not universal romanization.
  - Compatibility mode is an advanced normalization option and may erase formatting distinctions.
- Official or authoritative sources:
  - Unicode Standard Annex #15, Unicode Normalization Forms, latest version opened 2026-07-02: https://unicode.org/reports/tr15/. The opened version was Unicode 17.0.0, dated 2025-07-30.
  - Unicode Standard Annex #44, Unicode Character Database, latest version opened 2026-07-02: https://www.unicode.org/reports/tr44/. The opened version was Unicode 17.0.0, dated 2025-08-27.
  - ECMA-262 `String.prototype.normalize`, accessed 2026-07-02: https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize.
  - ECMA-262 Unicode property escapes and supported Unicode property aliases, accessed 2026-07-02: https://tc39.es/ecma262/multipage/text-processing.html#sec-runtime-semantics-compiletocharset and https://tc39.es/ecma262/multipage/text-processing.html#table-binary-unicode-properties.
  - Codebase source checked on 2026-07-02: current text routes, registry, text helpers/tests, URL helpers, translations, e2e specs, and prior text tool plans.
- Source access dates:
  - External standards checked on 2026-07-02.
  - Codebase checked on 2026-07-02.
- Rule/table effective dates:
  - Unicode normalization sources opened as Unicode 17.0.0 latest annex versions.
  - ECMA-262 source is the current TC39 multipage specification site at access time.
- Freshness or maintenance risk:
  - Low for common Latin accent removal.
  - Low-to-moderate for Unicode edge cases because browser engines and Unicode versions can differ.
  - Moderate if compatibility mode is enabled because compatibility decomposition intentionally changes more than accents.
  - Moderate privacy risk if shared links include pasted content; keep content sharing explicit, hash-only, visible, and length-limited.
- Estimator or privacy limitations:
  - The tool is deterministic text transformation, not an estimator.
  - It is not a complete transliterator and cannot guarantee ASCII-only output.
  - Browser-only processing reduces server exposure, but clipboard data, downloads, screenshots, shared links, browser extensions, and user-installed software can still expose content.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Removedor de Acentos`
  - PT-BR meta title: `Remover acentos online grátis`
  - PT-BR description: `Remova acentos e cedilha de textos no navegador, preservando maiúsculas, pontuação e quebras de linha.`
- Main form sections:
  - Text input area with textarea, copy input, clear action, and browser-only privacy note.
  - Options section with a compact segmented control for `acentos` and `compatibilidade`.
  - Privacy/share section with safe default share link and explicit include-content option.
  - Output area with transformed textarea/pre block and actions: copy result, use result as input, download `.txt`.
- Results sections:
  - Status message for empty, converted, unchanged, too-large, and compatibility-mode states.
  - Output preview with stable height and long-line wrapping.
  - Metrics row for input/output characters, input/output bytes, changed characters, and removed marks.
  - Warning panel for no accents found, compatibility mode, or limited transliteration.
- SEO sections:
  - What accent removal does.
  - Examples before/after: `ação` -> `acao`, `São Paulo` -> `Sao Paulo`, `Crème brûlée` -> `Creme brulee`.
  - Difference between removing accents, changing case, cleaning text, and generating slugs.
  - Privacy note for pasted text.
  - Limitations for names, identifiers, non-Latin scripts, and characters without decomposition.
- FAQ topics:
  - `O texto é enviado para o servidor?`
  - `A ferramenta remove cedilha?`
  - `Ela transforma o texto em minúsculas?`
  - `Isso cria slugs para URLs?`
  - `Por que alguns caracteres continuam iguais?`
  - `Posso compartilhar um texto já preenchido?`
  - `O modo compatibilidade muda o quê?`
- Disclaimer or privacy copy:
  - Transformation runs in the browser and should not intentionally send input to the server.
  - Do not include confidential text in shared links unless every recipient may read it.
  - Review names, documents, identifiers, passwords, code, and legal text after removing accents because meaning or validity can change.
- Related tool links:
  - Existing: `/texto`, `/texto/conversor-maiusculas`, and `/texto/contador-caracteres`.
  - Future backlog candidates: `/texto/gerador-slug`, `/texto/limpar-texto`, `/texto/ordenar-linhas`, `/texto/remover-duplicados`, and `/texto/diff-texto`.
- Translation guidance:
  - Reuse existing `toolFamilies.texto` and `toolCategories.transformacao-texto` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add `tools.removedor-acentos` keys for metadata, form labels, mode labels, mode descriptions, result states, metrics, warnings, actions, share/privacy copy, SEO content, related links, and FAQ content.
  - Suggested tool names: PT-BR `Removedor de Acentos`; EN `Accent Remover`; ES `Eliminador de Acentos`.
  - Suggested mode names: PT-BR `Remover acentos` / `Compatibilidade`; EN `Remove accents` / `Compatibility`; ES `Quitar acentos` / `Compatibilidad`.
  - Keep route slug `/texto/removedor-acentos` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Extend `lib/tools/text.ts` or add a focused text helper with accent-removal mode constants, default state, transformation helper, metrics, warning codes, safe query helpers, hash-fragment helpers, and share URL generation.
  - Add deterministic tests in `lib/tools/text.test.ts` or a focused companion test file if the helper is split.
  - Cover default NFD-based accent removal, optional NFKD compatibility mode, output NFC normalization, metrics, warnings, input caps, invalid modes, and privacy-safe params.
- URL state:
  - Use the existing URL-state/share patterns from `components/tools/text/case-converter-client.tsx`.
  - Sync only safe settings in the live query string: `modo` when not default.
  - Never put `texto` in the live URL during normal typing.
  - Generate content-bearing links only from the explicit share callback and only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing shared link.
  - Enforce a share URL length budget and show a warning when content is omitted.
- UI components:
  - Create `components/tools/text/accent-remover-client.tsx`.
  - Follow the case-converter layout and privacy pattern, but make accent-removal output and metrics the primary result.
  - Use existing UI primitives, `ShareButton`, lucide icons for copy/clear/use-output/download/status actions, accessible labels, stable test ids, and responsive textareas.
  - Keep long words, long lines, and translated button labels from causing horizontal overflow on mobile.
- Route and metadata:
  - Add `app/[locale]/texto/removedor-acentos/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "removedor-acentos")`.
  - Reuse existing `app/[locale]/texto/page.tsx`.
- Registry/family/category:
  - Reuse existing `texto` family.
  - Reuse existing `transformacao-texto` category.
  - Add a `tools` entry for `removedor-acentos` with `available: true`, `familyId: "texto"`, `primaryCategoryId: "transformacao-texto"`, `categoryIds: ["transformacao-texto"]`, an existing text icon such as `FileText`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
- Messages:
  - Add PT-BR, EN, and ES translations for tool metadata, form controls, mode names, warnings, actions, privacy/share states, result copy, SEO text, and FAQ content.
- Unit tests:
  - Cover empty input, common Portuguese accents, cedilla, mixed case preservation, Spanish/French examples, decomposed combining input, emoji preservation, punctuation/line break preservation, compatibility-mode examples, unchanged text, invalid modes, oversized input, safe query params, and explicit content share fragments.
- E2E hooks/tests:
  - Add stable selectors or accessible labels for input textarea, output textarea/block, mode controls, copy input, copy output, use output as input, clear, download, include-content control, share button, status/warning, and metrics.
  - Add a focused `tests/e2e/accent-remover.spec.ts`.
  - Extend tools hub/directory coverage only if existing e2e expects every available tool to appear.
- Backlog updates:
  - Planner must not edit app code, translations, tests, constants, or DB state.
  - Orchestrator should record this planner decision in the DB.
  - Creator should not update DB state directly unless orchestrator instructions for later stages explicitly require it.

## Test Plan

- Unit scenarios:
  - Empty input returns neutral status and empty output.
  - `ação em São Paulo` returns `acao em Sao Paulo`.
  - `Àrvore, coração, pão, João, lingüiça, Müller` returns expected unaccented output while preserving case and punctuation.
  - Decomposed `e\u0301 a\u0303 c\u0327` returns `e a c`.
  - `Crème brûlée` returns `Creme brulee`.
  - Emoji and emoji variation selectors remain visually stable in default mode.
  - Non-Latin sample text does not lose script-essential marks through broad `\p{M}` stripping in default mode.
  - Compatibility mode changes a fixture such as a ligature or fullwidth text only when selected.
  - Characters without decomposition, such as `ø`, `ß`, or `æ`, are documented and tested as unchanged unless the selected mode transforms them.
  - Invalid `modo` values fall back to `acentos`.
  - Oversized input returns `tooLarge` without expensive transformation.
  - Safe query params omit `texto`; explicit share params include `conteudo=1&texto=...` only when opted in and under budget.
- URL-state scenarios:
  - `/texto/removedor-acentos` initializes default mode with empty text.
  - `?modo=compatibilidade` initializes compatibility mode with empty text.
  - Typing text does not add `texto` to `window.location.search`.
  - Changing mode updates only safe settings in the live URL.
  - Enabling include-content does not mutate the address bar.
  - Default share URL contains only safe settings.
  - Share URL with include-content stores text in the hash fragment and shows a public-link warning.
  - Loading a content-bearing hash link prefills text and sanitizes the live URL afterward.
  - Oversized content-bearing share omits text and shows a warning.
- Browser scenarios:
  - Visit `/texto/removedor-acentos` in PT-BR and confirm title, description, textarea, mode controls, output, actions, privacy note, SEO sections, and FAQ render.
  - Paste multiline Portuguese text, confirm output updates live, and verify line breaks remain.
  - Switch compatibility mode and confirm warning copy appears.
  - Copy output, copy input, use-output-as-input, download, and clear actions work.
  - Safe share and include-content share flows behave as documented.
  - EN and ES localized routes render without missing keys.
  - `/texto`, `/texto/categorias/transformacao-texto`, `/ferramentas`, and sitemap discovery include the new tool.
  - Mobile viewport has no horizontal overflow and keeps long text/output readable.
- Playwright scenarios:
  - Add `tests/e2e/accent-remover.spec.ts` for route load, default accent removal, cedilla handling, mode switching, safe URL behavior, include-content hash share, content-bearing link hydration/sanitization, copy/use-output/download actions, localized smoke, directory/sitemap discovery, and mobile smoke coverage.
  - Assert current URL never contains pasted text in search params during normal typing or default sharing.
- Lint/build commands:
  - Run focused unit tests for text helper changes, for example `pnpm test -- lib/tools/text.test.ts`.
  - Run focused Playwright spec for the accent remover.
  - Run message JSON parse or the repo's existing i18n/key parity checks if available.
  - Run the repo lint command.
  - Run the repo build command.
  - Run `git diff --check`.
- Acceptance criteria:
  - `/texto/removedor-acentos` is discoverable through `/texto`, the transformation category directory, tools hub, and sitemap.
  - Common Portuguese/Latin accent removal works live and preserves case, punctuation, spacing, and line breaks.
  - Compatibility mode is opt-in, visibly warned, and tested.
  - Pasted text remains client-side and is not placed in URLs by default.
  - Explicit share-with-content behavior is clear, hash-only, length-limited, privacy-warned, and tested.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, build, and diff validation pass.

## Implementation Notes

- Status updates:
  - 2026-07-02: Planner selected `new` and wrote this buildable plan for `/texto/removedor-acentos`.
  - 2026-07-02: Creator confirmed DB item is `In Progress` with stage `implementation` and moved plan status to `in_progress`.
  - 2026-07-02: Implementation completed for helper logic, route/client, registry, translations, and focused e2e coverage. DB item remains `In Progress` with stage `implementation` until review and tester validation pass.
  - 2026-07-02: Tester confirmed DB item is `In Progress` with stage `testing`, validated the implementation, and marked this plan `verified`. DB finalization remains an orchestrator action.
- Files changed:
  - `docs/tool-plans/removedor-acentos.md`
  - `lib/tools/text.ts`
  - `lib/tools/text.test.ts`
  - `components/tools/text/accent-remover-client.tsx`
  - `app/[locale]/texto/removedor-acentos/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/accent-remover.spec.ts`
- Validation results:
  - 2026-07-02: Planner-only validation passed for `git diff --check -- docs/tool-plans/removedor-acentos.md`.
  - 2026-07-02: PASS `node -e "for (const f of ['messages/pt-br.json','messages/en.json','messages/es.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('messages json ok')"`
  - 2026-07-02: PASS `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/text.test.ts lib/constants.test.ts` (2 files, 42 tests).
  - 2026-07-02: PASS `git diff --check`.
  - 2026-07-02: PASS targeted ESLint for `lib/tools/text.ts`, `lib/tools/text.test.ts`, `components/tools/text/accent-remover-client.tsx`, `app/[locale]/texto/removedor-acentos/page.tsx`, `tests/e2e/accent-remover.spec.ts`, and `lib/constants.ts`.
  - 2026-07-02: Initial `./node_modules/.bin/tsc --noEmit` failed because generated Prisma client types were missing; `prisma generate` first needed `DATABASE_URL`, then elevated cache write permission for `/Users/saulodefaria/.cache/prisma`.
  - 2026-07-02: PASS after elevated Prisma generate with local `DATABASE_URL`, then `./node_modules/.bin/tsc --noEmit`.
  - 2026-07-02: `DATABASE_URL=... pnpm build` was blocked by the known non-interactive pnpm modules purge prompt before Next ran.
  - 2026-07-02: PASS `DATABASE_URL=... ./node_modules/.bin/next build`; route `/texto/removedor-acentos` appeared in the build output. Existing `metadataBase` warnings only.
  - 2026-07-02: PR-review finding addressed: default combining-mark regex now excludes the combining-symbols block so keycap emoji remain stable; added unit regression for `1️⃣ café`.
  - 2026-07-02: PASS DB read with `AGENT_BACKLOG_DATABASE_URL='postgresql://postgres:postgres@localhost:5438/calculaderia' psql 'postgresql://postgres:postgres@localhost:5438/calculaderia' -v kind=tool -v slug=removedor-acentos -f scripts/backlog/get_item.sql`; row returned status `In Progress`, stage `testing`, target route `/texto/removedor-acentos`, and branch `codex/removedor-acentos-tool`.
  - 2026-07-02: `pnpm run test:e2e -- tests/e2e/accent-remover.spec.ts` was blocked before Playwright by the local non-interactive pnpm modules purge prompt.
  - 2026-07-02: PASS `node scripts/clean-e2e-next-cache.mjs`.
  - 2026-07-02: Direct sandboxed Playwright reached browser launch but failed before page interaction with the known macOS Chromium `MachPortRendezvousServer` permission error.
  - 2026-07-02: PASS elevated `PORT=3196 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3196' NEXT_DIST_DIR=.next-e2e DATABASE_URL='postgresql://postgres:postgres@localhost:5438/calculaderia' ./node_modules/.bin/playwright test tests/e2e/accent-remover.spec.ts` (7 Chromium tests).
  - 2026-07-02: PASS `./node_modules/.bin/eslint tests/e2e/accent-remover.spec.ts`.
  - 2026-07-02: PASS `git diff --check`.
  - 2026-07-02: PASS `lsof -nP -iTCP:3196 -sTCP:LISTEN` returned no listener after Playwright shutdown.
- Browser coverage:
  - PT-BR route loads without redirect, document title and H1 render, form/output/privacy copy render, metrics and FAQ/SEO sections are visible, and no non-auth console/page errors were recorded.
  - Accent removal covered realistic Portuguese/French text, cedilla, decomposed combining marks, compatibility mode warning, and keycap emoji stability.
  - URL privacy covered typed text omitted from live search params, default share without content, explicit include-content hash-only share, and hash hydration followed by visible URL sanitization.
  - Actions covered copy input, copy output, use output as input, TXT download, and clear.
  - EN and ES localized routes render expected H1s.
  - Discovery covered `/texto`, `/texto/categorias/transformacao-texto`, `/ferramentas` via the Texto family card plus ItemList JSON-LD, and `/sitemap.xml`.
  - Mobile viewport `390x900` has no horizontal overflow and controls remain usable.
- Tester findings:
  - PASS. No production-code failures found. Tester changed only validation-owned `tests/e2e/accent-remover.spec.ts` plus this plan note.
- DB finalization:
  - Expected orchestrator action: move the DB item from `In Progress` stage `testing` to the workflow's verified/done/PR final state. Tester did not mutate DB state.
- Final status:
  - `verified`
