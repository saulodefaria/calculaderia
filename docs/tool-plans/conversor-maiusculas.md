---
slug: "conversor-maiusculas"
familyId: "texto"
primaryCategoryId: "transformacao-texto"
backlogRank: 6
primaryKeyword: "converter maiúsculas minúsculas"
decision: "new"
targetRoute: "/texto/conversor-maiusculas"
status: "verified"
createdAt: "2026-06-22"
updatedAt: "2026-06-22"
---

# Conversor de Maiúsculas e Minúsculas Plan

## Backlog Row

- Rank: 6
- Original status: Backlog
- Slug: `conversor-maiusculas`
- Primary keyword: `converter maiúsculas minúsculas`
- Cluster keywords: `texto maiusculo minusculo`; `converter texto`; `capitalizar texto`
- Family/category: backlog family `texto`; planned family `texto`; planned category `transformacao-texto`
- Opportunity score: 82
- Idea type: New
- Notes: Multiple case transforms in one page.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/texto/conversor-maiusculas`
- Rationale: The backlog row is a new browser-only text utility. The app already has the `texto` family and `/texto/contador-caracteres`, but no route, registry entry, component, helper, translation block, test, or prior plan for converting text case. A dedicated route matches the primary keyword and keeps case conversion separate from counting, accent removal, slug generation, and broader cleanup tools.

## Similarity Check

- Existing routes checked:
  - Generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current text routes: `app/[locale]/texto/page.tsx` and `app/[locale]/texto/contador-caracteres/page.tsx`.
  - Other current family routes under `app/[locale]`: `geradores`, `validadores`, `matematica`, `datas`, and `dev`.
  - No `/texto/conversor-maiusculas` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "texto"`.
  - `lib/constants.ts` defines text category `contagem-texto`, currently used by `contador-caracteres`.
  - Case conversion is a text transformation, not a counting task. Add a new category such as `transformacao-texto` instead of overloading `contagem-texto`.
  - No `conversor-maiusculas` tool entry exists.
- Related modules/translations checked:
  - `lib/tools/text.ts` contains character-count analysis and character-counter URL helpers. It has no case conversion helpers.
  - `components/tools/text/character-counter-client.tsx` is the closest UI and privacy pattern for a text textarea tool.
  - `components/tools/url-state.ts` provides generic query/share helpers.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` contain password-generator labels for uppercase/lowercase and `tools.contador-caracteres`, but no `tools.conversor-maiusculas` keys.
- Prior plans checked:
  - `docs/tool-plans/contador-caracteres.md`, `docs/tool-plans/formatador-json.md`, `docs/tool-plans/conversor-base64.md`, `docs/tool-plans/sorteador-nomes.md`, `docs/tool-plans/qr-code.md`, and calculator plans under `docs/calculator-plans`.
  - `contador-caracteres` mentions `/texto/conversor-maiusculas` only as a future related tool.
  - No duplicate `conversor-maiusculas` plan exists.
- Text search checked: `conversor-maiusculas`, `converter maiúsculas minúsculas`, `maiúsculas`, `minúsculas`, `maiusculas`, `minusculas`, `uppercase`, `lowercase`, and `case converter`.
- Overlap conclusion:
  - Build a new tool page.
  - Keep Rank 15 `removedor-acentos` separate because accent removal changes characters, not only casing.
  - Keep Rank 16 `gerador-slug` separate because slug generation combines casing, accent removal, separator rules, and URL-safe normalization.
  - Keep Rank 52 `limpar-texto`, Rank 50 `ordenar-linhas`, and Rank 51 `remover-duplicados` separate because they transform structure/whitespace/lists rather than letter case.

## User Intent And Scope

- Target user: Students, writers, marketers, support teams, developers, content editors, and office users who need to quickly convert pasted text between uppercase, lowercase, title-like capitalization, sentence case, or inverse case without uploading it.
- User job: Paste or type text, pick a case transformation, preview the converted text immediately, copy or download the result, and optionally share safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only textarea input.
  - Case modes:
    - `maiusculas`: convert to uppercase.
    - `minusculas`: convert to lowercase.
    - `frase`: sentence case, lowercasing text first and uppercasing the first letter after sentence boundaries.
    - `titulo`: title case for common headings, capitalizing words while keeping short connector words lowercase where locale rules allow.
    - `capitalizar-palavras`: capitalize the first letter of every word.
    - `alternado`: alternating uppercase/lowercase letters for casual text.
    - `inverter`: invert existing letter case.
  - Locale-aware casing using the current app locale where browser APIs support it.
  - Output preview, copy result, use output as input, clear, and download `.txt`.
  - Basic metrics for input/output characters and UTF-8 bytes, reusing existing text helpers where useful.
  - Privacy-aware sharing that keeps pasted text out of the live URL unless the user explicitly includes it in a share link.
- Out of scope:
  - Accent removal, transliteration, slug generation, whitespace cleanup, duplicate-line removal, sorting, regex replacement, grammar/spell checking, AI rewriting, file upload conversion, rich-text preservation, account history, saved drafts, and server-side text processing.
  - A guarantee that title case follows every style guide such as ABNT, APA, Chicago, headline style, or sentence-style editorial policies.
- Sensitive-topic caveats:
  - Treat pasted text as potentially sensitive. The UI should say conversion happens in the browser and text is not intentionally sent to the server by the tool.
  - Shared links with included text are public to anyone who receives the URL.
  - Case conversion can alter meaning for abbreviations, names, brand spellings, legal text, code, and identifiers; users should review important output before publishing.

## Tool Contract

- Inputs:
  - `texto`: free-form string entered in a textarea.
  - `modo`: one of `maiusculas`, `minusculas`, `frase`, `titulo`, `capitalizar-palavras`, `alternado`, or `inverter`.
  - `preservarQuebras`: boolean; default `true`. When true, preserve line breaks exactly in output.
  - `conteudo`: optional explicit share flag used only for links that include `texto`.
- Defaults:
  - `texto` empty.
  - `modo=maiusculas`.
  - `preservarQuebras=true`.
  - `conteudo` absent, so live URLs and default share links omit pasted text.
- Validation rules:
  - Empty text is valid and should show a neutral "paste text" state, not an error.
  - Invalid `modo` values fall back to `maiusculas`.
  - Invalid boolean params fall back to defaults.
  - Keep the original input untouched; all transformations produce a separate output.
  - Enforce a practical input guardrail such as 500,000 characters to avoid browser freezes, with a clear localized warning when exceeded.
  - Do not trim input before conversion. Leading/trailing spaces and line breaks should remain unless a specific mode documents otherwise.
  - Preserve line endings and spacing by default. If implementation normalizes CRLF internally, output should remain visually equivalent.
  - Modes that operate on words should skip digits, punctuation, emoji, and whitespace without crashing.
  - Title case should be deterministic and documented as a practical heading helper, not as a formal style-guide engine.
  - Casing should use `toLocaleUpperCase(locale)` and `toLocaleLowerCase(locale)` where appropriate. Unit tests should pin behavior for Portuguese accents, Spanish punctuation, English apostrophes, emoji, combining marks, and mixed scripts as best-effort browser behavior.
- Outputs:
  - `status`: `empty`, `converted`, or `tooLarge`.
  - `output`: converted text when valid.
  - `modeApplied`: normalized mode id.
  - `inputMetrics`: characters and UTF-8 bytes.
  - `outputMetrics`: characters and UTF-8 bytes.
  - `changedCharacters`: optional count of grapheme positions whose text changed, useful as a small feedback metric.
  - `warnings`: optional flags such as `titleCaseApproximation`, `largeInput`, or `noLetterChanges`.
- Result explanations:
  - Explain what each mode changes.
  - Explain that locale-aware casing handles common accents but browser behavior can differ for some languages and scripts.
  - Explain that "capitalizar palavras" changes every word, while "frase" only capitalizes starts of sentences.
  - Explain that "titulo" is a practical heading helper and may need manual review for names, acronyms, and style guides.
- URL params:
  - Safe live query params: `modo` and `preservarQuebras` when not default.
  - Do not sync `texto` into `window.location.search` during normal editing.
  - Preferred content-bearing share format: put `texto` behind explicit opt-in in the URL fragment/hash as `#conteudo=1&texto=...`, so pasted content is not sent as a request query string.
  - If reusing existing text-counter query behavior instead of a hash fragment, read `texto` only when `conteudo=1`, prefill client-side, then sanitize the live address bar immediately after hydration.
  - Invalid query or fragment params should fall back safely without crashing.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings, usually `modo` and non-default `preservarQuebras`.
  - Provide an explicit "incluir texto no link compartilhado" control before share links can contain content.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a content share budget around 1,800 encoded characters. If the content is too long, omit `texto` from the share link and show a warning.
  - Warn that anyone with a content-bearing link can read the pasted text.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input or output in localStorage, sessionStorage, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Extend `lib/tools/text.ts` with pure case-conversion helpers rather than creating a duplicate text utility module, unless the file becomes too broad and a focused `lib/tools/text-case.ts` is clearer.
  - Add types such as `TextCaseMode`, `TextCaseState`, `TextCaseResult`, and `TextCaseWarning`.
  - Implement `convertTextCase(input, options)` as a deterministic pure function.
  - Use locale-aware `String` casing methods for whole-string uppercase/lowercase.
  - For grapheme/word-aware transforms, reuse or expose the existing `Intl.Segmenter` pattern from `analyzeText`; fall back to `Array.from` and Unicode letter/number regexes when unavailable.
  - Sentence case should identify sentence starts after `.`, `!`, `?`, `…`, inverted Spanish punctuation, and line boundaries, while preserving punctuation and spacing.
  - Title case should capitalize meaningful words and keep a small localized connector-word list lowercase when not first/last, for example PT-BR `de`, `da`, `do`, `das`, `dos`, `e`, `em`, `para`, `por`; EN `a`, `an`, `and`, `as`, `at`, `but`, `by`, `for`, `in`, `of`, `on`, `or`, `the`, `to`; ES `de`, `del`, `la`, `las`, `los`, `y`, `en`, `para`, `por`.
  - Inverse case should transform only letters and leave numbers, symbols, emoji, whitespace, and punctuation untouched.
  - Alternating case should alternate across letters only, not punctuation or whitespace, so output is predictable.
  - Keep all logic independent from React so it can be unit-tested directly.
- Data tables or assumptions:
  - No external data tables are required.
  - Connector-word lists for title case are small product-owned heuristics, not official grammar tables.
  - Browser locale can come from the active app locale (`pt-br`, `en`, `es`).
  - The tool operates on plain text, not HTML, Markdown semantics, or rich text spans.
- Official or authoritative sources:
  - No government, legal, financial, public-rate, check-digit, security, file-processing, or table source is required.
  - Codebase source checked on 2026-06-22: current text route, registry, text helpers/tests, URL helpers, translations, e2e specs, and prior tool plans.
  - Implementation may rely on standard browser and ECMAScript APIs such as `Intl.Segmenter`, `String.prototype.toLocaleUpperCase`, `String.prototype.toLocaleLowerCase`, `TextEncoder`, `URLSearchParams`, Clipboard API, and History API.
- Source access dates:
  - Codebase checked on 2026-06-22.
  - External rule/table sources are not applicable.
- Rule/table effective dates:
  - Not applicable.
- Freshness or maintenance risk:
  - Low for basic uppercase/lowercase conversion.
  - Moderate for title and sentence case because editorial expectations differ across languages and style guides.
  - Moderate browser-compatibility risk around `Intl.Segmenter`; keep fallbacks and unit tests.
  - Low-to-moderate privacy risk if shared links include pasted content; keep content sharing explicit, visible, and length-limited.
- Estimator or privacy limitations:
  - Conversion is deterministic but not an editorial proofreader.
  - Locale-aware casing can still differ from specific editors, databases, and platforms.
  - Browser-only processing reduces server exposure, but clipboard data, shared links, screenshots, downloads, and browser extensions can still expose content.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Conversor de Maiúsculas e Minúsculas`
  - PT-BR meta title: `Converter maiúsculas e minúsculas online grátis`
  - PT-BR description: `Converta texto para maiúsculas, minúsculas, frase, título e capitalização no navegador, sem enviar o conteúdo para o servidor.`
- Main form sections:
  - Text input card with textarea, clear action, copy input action, and browser-only privacy note.
  - Mode control as a segmented control or compact button group for the seven modes.
  - Options card for preserving line breaks if the implementation exposes that option.
  - Privacy/share section with safe default share link and explicit include-content option.
  - Primary output actions: copy result, use result as input, download `.txt`.
- Results sections:
  - Output textarea or preformatted block with the converted text.
  - Empty state before text is entered.
  - Warning/status block for large input, title-case approximation, or no visible letter changes.
  - Small metrics row for input/output characters and bytes.
  - Optional "alterações" metric when `changedCharacters` is implemented.
- SEO sections:
  - What the case converter does.
  - Difference between uppercase, lowercase, sentence case, title case, and capitalize words.
  - Privacy note for pasted text.
  - Why capitalization may need manual review for names, acronyms, brand spellings, and style guides.
- FAQ topics:
  - `O texto é enviado para o servidor?`
  - `Qual é a diferença entre frase, título e capitalizar palavras?`
  - `A ferramenta respeita acentos e emoji?`
  - `Por que o resultado pode diferir de um editor de texto?`
  - `Posso compartilhar um texto já preenchido?`
  - `Isso remove acentos ou cria slugs?`
- Disclaimer or privacy copy:
  - The conversion runs in the browser and the tool should not intentionally send input to the server.
  - Do not include confidential text in shared links unless every recipient may read it.
  - Title/sentence capitalization is a practical helper and should be reviewed for formal writing, names, acronyms, code, and legal text.
- Related tool links:
  - Existing: `/texto`, `/texto/contador-caracteres`, `/dev/formatador-json`, and `/dev/conversor-base64`.
  - Future backlog candidates: `/texto/removedor-acentos`, `/texto/gerador-slug`, `/texto/limpar-texto`, `/texto/ordenar-linhas`, `/texto/remover-duplicados`, and `/texto/diff-texto`.
- Translation guidance:
  - Add `toolCategories.transformacao-texto` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested category names: PT-BR `Transformação de texto`; EN `Text transformation`; ES `Transformación de texto`.
  - Add `tools.conversor-maiusculas` keys for title, description, metadata, form labels, modes, options, result states, metrics, validation/warnings, actions, share/privacy warnings, SEO article text, and FAQ content.
  - Suggested tool names: PT-BR `Conversor de Maiúsculas e Minúsculas`; EN `Uppercase and Lowercase Converter`; ES `Conversor de Mayúsculas y Minúsculas`.
  - Keep route slug `/texto/conversor-maiusculas` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Extend `lib/tools/text.ts` or add a focused `lib/tools/text-case.ts` with mode constants, default state, conversion helpers, metrics, warning codes, safe query helpers, and content share helpers.
  - Add or extend `lib/tools/text.test.ts` with deterministic case-conversion coverage.
- URL state:
  - Use `components/tools/url-state.ts` for safe query read/write where possible.
  - Sync only safe settings in the live query string: `modo` and non-default `preservarQuebras`.
  - Never put `texto` in the live URL during normal typing.
  - Generate content-bearing links only from the explicit share callback and preferably only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing shared link.
  - Enforce a share URL length budget and show a warning when content is omitted.
- UI components:
  - Create `components/tools/text/case-converter-client.tsx`.
  - Follow the `CharacterCounterClient` layout and privacy pattern, but make the output preview the primary result instead of metric cards.
  - Use existing UI primitives, `ShareButton`, lucide icons for copy/clear/swap/download/status actions, accessible labels, stable test ids, and responsive textareas.
  - Keep long words, long lines, and long button labels from causing horizontal overflow on mobile.
- Route and metadata:
  - Add `app/[locale]/texto/conversor-maiusculas/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "conversor-maiusculas")`.
  - Reuse existing `app/[locale]/texto/page.tsx`.
- Registry/family/category:
  - Reuse existing `texto` family.
  - Add `transformacao-texto` to `ToolCategoryId`, `toolCategories`, and translations with href `/texto/categorias/transformacao-texto`.
  - Add a `tools` entry for `conversor-maiusculas` with `available: true`, `familyId: "texto"`, `primaryCategoryId: "transformacao-texto"`, `categoryIds: ["transformacao-texto"]`, an appropriate icon such as `FileText` or another text icon already available in `lucide-react`, `sitemapPriority` around `0.78`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
- Messages:
  - Add PT-BR, EN, and ES translations for tool metadata, form controls, mode names, warnings, actions, privacy/share states, result copy, SEO text, and FAQ content.
- Unit tests:
  - Cover empty input, uppercase, lowercase, sentence case, title case, capitalize words, inverse case, alternating case, accents, combining marks, emoji, punctuation, apostrophes, acronyms, Spanish inverted punctuation, CRLF/LF preservation, invalid modes, input caps, safe params, and explicit content share params.
- E2E hooks/tests:
  - Add stable selectors or accessible labels for input textarea, output textarea/block, mode controls, preserve-breaks control if present, copy result, use result as input, clear, download, include-content control, share button, status/warning, and metrics.
  - Add a focused `tests/e2e/case-converter.spec.ts`.
  - Extend `tests/e2e/tools-hub.spec.ts` only if it verifies available tool listings.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark Rank 6 `conversor-maiusculas` as `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Empty input returns neutral status and empty output.
  - `Olá Mundo` converts to `OLÁ MUNDO` in uppercase and `olá mundo` in lowercase.
  - Sentence case converts `olá mundo. tudo bem? sim!` to `Olá mundo. Tudo bem? Sim!`.
  - Sentence case handles line starts and Spanish inverted punctuation without throwing.
  - Title case capitalizes meaningful words and leaves localized connector words lowercase when not first/last.
  - Capitalize words uppercases the first letter of every word while preserving punctuation and spacing.
  - Inverse case turns `AbC 123!` into `aBc 123!`.
  - Alternating case alternates letters while ignoring spaces, punctuation, numbers, and emoji.
  - Accents, combining marks, emoji, apostrophes, acronyms, tabs, CRLF, and LF are handled deterministically.
  - Invalid modes and invalid params fall back to defaults.
  - Oversized input returns `tooLarge` without attempting expensive conversion.
  - Safe query params omit `texto`; explicit share params include `conteudo=1&texto=...` only when opted in and under budget.
- URL-state scenarios:
  - `?modo=minusculas` initializes lowercase mode with empty text.
  - Typing text does not add `texto` to `window.location.search`.
  - Changing mode updates only safe settings in the live URL.
  - Enabling include-content does not mutate the address bar.
  - Share URL without include-content contains only safe settings.
  - Share URL with include-content stores text in the fragment/hash or explicit content format and shows a public-link warning.
  - Loading a content-bearing shared link prefills text and sanitizes the live URL afterward.
  - Oversized content-bearing share omits text and shows a warning.
- Browser scenarios:
  - Visit `/texto/conversor-maiusculas` in PT-BR and confirm title, description, textarea, mode controls, output, actions, privacy note, SEO sections, and FAQ render.
  - Paste multiline Portuguese text, switch through all modes, and verify output updates live without console errors.
  - Copy output and use-output-as-input actions work.
  - Clear resets input, output, warnings, and metrics.
  - Safe share and include-content share flows behave as documented.
  - Mobile viewport has no horizontal overflow and keeps long text/output readable.
- Playwright scenarios:
  - Add `tests/e2e/case-converter.spec.ts` for uppercase/lowercase conversion, sentence/title/capitalize mode smoke coverage, safe URL behavior, include-content share behavior, content-bearing link hydration/sanitization, copy/use-output actions, and mobile smoke coverage.
  - Extend tools hub/directory coverage only if existing e2e expects every available tool to appear.
- Lint/build commands:
  - Run focused unit tests for text helpers, for example `pnpm test -- lib/tools/text.test.ts`.
  - Run focused Playwright spec for the case converter.
  - Run the repo lint command.
  - Run the repo build command.
  - Run `git diff --check`.
- Acceptance criteria:
  - `/texto/conversor-maiusculas` is discoverable through `/texto`, category directory, tools hub, and sitemap.
  - The tool converts text live across all planned modes and keeps the original input separate from output.
  - Pasted text remains client-side and is not placed in URLs by default.
  - Explicit share-with-content behavior is clear, length-limited, privacy-warned, and tested.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, build, and diff validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-22: Planner selected `new` and wrote this buildable plan for `/texto/conversor-maiusculas`.
  - 2026-06-22: Creator marked the plan and backlog row `In Progress` before app implementation.
  - 2026-06-22: Review-fix pass addressed accepted PR-review findings for Unicode combining marks and focused Playwright coverage.
  - 2026-06-22: Narrow review-fix handoff normalized only the title-case connector lookup key so decomposed accented connectors still match while output preserves user text normalization.
  - 2026-06-22: Orchestrator marked the plan `verified` after implementation, review fixes, elevated Playwright, and browser validation passed.
- Files changed:
  - `docs/tool-plans/conversor-maiusculas.md`
  - `docs/tool-backlog.md`
  - `lib/tools/text.ts`
  - `lib/tools/text.test.ts`
  - `tests/e2e/case-converter.spec.ts`
  - `components/tools/text/case-converter-client.tsx`
  - `app/[locale]/texto/conversor-maiusculas/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
- Validation results:
  - 2026-06-22: Planner-only verification passed for scoped file inspection and `git diff --check -- docs/tool-plans/conversor-maiusculas.md`.
  - 2026-06-22: Creator validation passed for `pnpm test -- lib/tools/text.test.ts` after adding case-converter unit coverage.
  - 2026-06-22: Creator validation passed for `pnpm lint`.
  - 2026-06-22: Creator validation passed for `git diff --check`.
  - 2026-06-22: `pnpm build` without environment failed at Prisma `prebuild` because `DATABASE_URL` was unset; retry with `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed and emitted `/[locale]/texto/conversor-maiusculas`.
  - 2026-06-22: Review-fix validation passed for `pnpm test -- lib/tools/text.test.ts`.
  - 2026-06-22: Review-fix validation passed for `PORT=3131 pnpm run test:e2e -- tests/e2e/case-converter.spec.ts` with 5 Chromium tests.
  - 2026-06-22: Review-fix validation passed for `pnpm lint`.
  - 2026-06-22: Review-fix validation passed for `git diff --check`.
  - 2026-06-22: Narrow review-fix validation passed for `pnpm test -- lib/tools/text.test.ts`.
  - 2026-06-22: Narrow review-fix validation passed for `git diff --check`.
  - 2026-06-22: Tester validation updated `tests/e2e/case-converter.spec.ts` with realistic multiline coverage for all seven modes.
  - 2026-06-22: Tester validation passed for `pnpm lint`.
  - 2026-06-22: Tester validation passed for `PORT=3133 pnpm run test:e2e -- tests/e2e/case-converter.spec.ts` with 6 Chromium tests. Elevated execution was required because sandboxed Chromium still fails on this host with the known `MachPortRendezvousServer` permission error.
  - 2026-06-22: Tester browser validation passed on `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3134 NEXTAUTH_URL=http://localhost:3134 pnpm dev --hostname localhost --port 3134`: route returned 200 without redirect, route/browser console errors were 0, all seven modes converted realistic multiline text, typed text stayed out of live URLs while mode and preserve-line-break settings updated, explicit include-content sharing used hash-only `conteudo=1&texto=...`, shared hash content hydrated and sanitized the address bar, copy original/result, use result as input, TXT download, clear, FAQ/SEO blocks, oversized share warning, `/texto` and category links, `/ferramentas` text family plus ItemList JSON-LD, and mobile no-horizontal-overflow all passed.
  - 2026-06-22: Tester validation passed for `git diff --check` after e2e and plan note updates.
- PR-review findings addressed:
  - Fixed case-conversion word tokenization in `lib/tools/text.ts` so Unicode combining marks stay attached to decomposed accented words during title and capitalize-words transforms.
  - Added focused regressions in `lib/tools/text.test.ts` for `titulo` and `capitalizar-palavras` with `e\u0301clair cafe\u0301` -> `E\u0301clair Cafe\u0301`.
  - Added `tests/e2e/case-converter.spec.ts` covering route load/conversion, safe live URL behavior, explicit hash-only content sharing, shared hash hydration/sanitization, copy/use-output/download smoke, and mobile no-overflow.
  - Normalized the title-case connector lookup key to NFC while returning the lowered word itself, covering `o retorno a\u0300 casa` -> `O Retorno a\u0300 Casa`.
- Tester findings:
  - Tester e2e and browser validation found no production UI failures.
  - One-off browser validation must run with auth test env; without `AUTH_SECRET`, the shared app `SessionProvider` emits expected AuthJS configuration errors unrelated to this tool.
  - The generic `/ferramentas` hub exposes this tool through the Texto family card and ItemList JSON-LD; individual visible tool cards there are limited to popular/recent tools.
- Remaining tester focus areas:
  - Tester pass covered SEO sections, FAQ, directory/category discoverability, all seven modes, copy input, metrics-visible result area, oversized content-share warning, and mobile overflow.
  - Do not mark backlog `Done` or plan `verified` from this tester handoff.
- Backlog status:
  - `Done` after implementation, review fixes, elevated Playwright, and browser validation passed. Initial Done Ref records route and validation; PR URL will be recorded after draft PR creation.
- Final status:
  - `verified`
