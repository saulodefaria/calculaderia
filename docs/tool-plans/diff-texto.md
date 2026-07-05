---
slug: "diff-texto"
familyId: "texto"
primaryCategoryId: "comparacao-texto"
backlogRank: 20
primaryKeyword: "comparador de texto"
decision: "new"
targetRoute: "/texto/diff-texto"
status: "verified"
createdAt: "2026-07-05"
updatedAt: "2026-07-05"
---

# Comparador de Texto Plan

## Backlog Row

- Rank: 20
- Original status: `In Progress`
- Original stage: `planning`
- Kind: `tool`
- Slug: `diff-texto`
- Primary keyword: `comparador de texto`
- Cluster keywords: not provided in claimed JSON.
- Family/category: backlog family `texto`; planned family `texto`; planned category `comparacao-texto`
- Opportunity score: not provided in claimed JSON.
- Idea type: New
- Branch: `codex/diff-texto-tool`
- Target route from row: `/texto/diff-texto`
- Plan path from row: `docs/tool-plans/diff-texto.md`
- Claimed by: `019f323c-f9bb-7151-8bef-d4e1b064fea5`
- Claim expires at: `2026-07-07T00:25:45.259799+00:00`
- Notes: not provided in claimed JSON.
- Done ref: not provided in claimed JSON.

## Decision

- Decision: `new`
- Target route: `/texto/diff-texto`
- Rationale: The claimed row is a new browser-only text comparison utility. The app already has a first-class `texto` family and adjacent text tools for counting, case conversion, accent removal, and slug generation, but none compares two texts or produces a diff. A dedicated route matches the primary keyword and keeps comparison separate from transformation, counting, regex testing, and JSON diffing.

## Similarity Check

- Existing routes checked:
  - Text family routes: `app/[locale]/texto/page.tsx`, `app/[locale]/texto/contador-caracteres/page.tsx`, `app/[locale]/texto/conversor-maiusculas/page.tsx`, `app/[locale]/texto/removedor-acentos/page.tsx`, and `app/[locale]/texto/gerador-slug/page.tsx`.
  - Generic directory routes: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Related dev routes: `app/[locale]/dev/regex-tester/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, `app/[locale]/dev/conversor-base64/page.tsx`, `app/[locale]/dev/url-encode-decode/page.tsx`, `app/[locale]/dev/hash-texto/page.tsx`, and `app/[locale]/dev/jwt-decoder/page.tsx`.
  - No `/texto/diff-texto` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId: "texto"`.
  - Current text categories are `contagem-texto` and `transformacao-texto`.
  - Text diffing is comparison/review, not counting or transformation. Add a new `ToolCategoryId` such as `comparacao-texto` with href `/texto/categorias/comparacao-texto`.
  - Use `FileText` for the category/tool icon if keeping imports minimal, or a lucide comparison icon only if the creator confirms availability.
  - No `diff-texto` tool entry exists.
- Related modules/translations checked:
  - `lib/tools/text.ts` contains character counting, case conversion, slug generation, accent removal, and URL/share helpers. It does not contain two-text diff logic.
  - `components/tools/text/*` contains existing textarea text tools and privacy-safe hash-fragment sharing patterns.
  - `components/tools/url-state.ts` supports query replacement and safe share URL construction patterns.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` contain text family/category keys and existing text tool namespaces, but no `toolCategories.comparacao-texto` or `tools.diff-texto`.
- Prior plans checked:
  - `docs/tool-plans/contador-caracteres.md`, `docs/tool-plans/conversor-maiusculas.md`, `docs/tool-plans/removedor-acentos.md`, `docs/tool-plans/gerador-slug.md`, `docs/tool-plans/regex-tester.md`, and related dev/text plans.
  - Existing plans mention `/texto/diff-texto` only as a future related text utility.
  - No duplicate `docs/tool-plans/diff-texto.md` existed before this plan.
- Text search checked:
  - `diff-texto`, `comparador de texto`, `comparador`, `comparar texto`, `diff`, `difference`, `diferenca`, `diferença`, `comparison`, and related terms across allowed route, constants, helper, component, message, and `docs/tool-plans` paths.
- Overlap conclusion:
  - Build a new tool page at `/texto/diff-texto`.
  - Keep `/texto/contador-caracteres` separate because it counts a single text.
  - Keep `/texto/conversor-maiusculas`, `/texto/removedor-acentos`, and `/texto/gerador-slug` separate because they transform one text into another.
  - Keep `/dev/regex-tester` separate because it tests patterns against one sample text.
  - Keep future JSON/YAML/XML diffing separate because structured-data diffs need parser-aware behavior.

## User Intent And Scope

- Target user: Editors, students, translators, developers, support teams, legal/ops reviewers, product writers, and office users who need to compare two plain-text versions without uploading content.
- User job: Paste an original text and a revised text, choose the comparison granularity, see additions/removals/changed blocks, copy a summary or diff, and optionally share safe settings or an explicit content-bearing link.
- In scope:
  - Browser-only comparison of two plain-text inputs: `original` and `alterado`.
  - Default line-level diff for paragraphs, notes, clauses, messages, lists, and code snippets.
  - Optional word-level and character/grapheme-level modes for shorter texts.
  - Side-by-side and unified result views.
  - Summary counts for unchanged, added, removed, and modified blocks/lines/tokens.
  - Inline highlighting inside modified line pairs when the changed block is small enough.
  - Options to ignore letter case, ignore trailing spaces, and ignore empty lines for comparison while still displaying original text.
  - Actions: copy original, copy revised, swap sides, clear, load example, copy plain summary, copy unified diff-like text, and download `.txt`.
  - Privacy-aware sharing that keeps pasted content out of live query params unless the user explicitly includes it in a hash-only share URL.
- Out of scope:
  - File upload, rich text, DOCX/PDF comparison, OCR, image comparison, semantic/AI rewrite analysis, plagiarism detection, grammar checking, code-aware AST diffs, JSON/YAML/XML parser-aware diffs, Git patch application, three-way merge, conflict resolution, saved history, account favorites, and server-side comparison.
  - A guarantee that the result is legally sufficient for contract review or that it catches every meaningful wording change.
- Sensitive-topic caveats:
  - Treat pasted text as potentially sensitive. The UI should state that comparison runs in the browser and the tool should not intentionally send input to the server.
  - Shared links with included content are readable by anyone who receives the URL.
  - Comparison output is informational. Users should manually review legal, contractual, academic, medical, financial, credential, and source-code material before relying on it.

## Tool Contract

- Inputs:
  - `original`: free-form string in the left textarea.
  - `alterado`: free-form string in the right textarea.
  - `modo`: `linhas`, `palavras`, or `caracteres`; default `linhas`.
  - `visao`: `lado-a-lado` or `unificado`; default `lado-a-lado`.
  - `ignorarCaixa`: boolean; default `false`.
  - `ignorarEspacosFinais`: boolean; default `false`.
  - `ignorarLinhasVazias`: boolean; default `false`.
  - `conteudo`: optional explicit share flag used only in the URL fragment/hash for links that include `original` and `alterado`.
- Defaults:
  - `original` empty.
  - `alterado` empty.
  - `modo=linhas`.
  - `visao=lado-a-lado`.
  - Ignore toggles disabled.
  - `conteudo` absent, so live URLs and default share links omit pasted text.
- Validation rules:
  - Empty both sides is valid and should show a neutral "paste two texts" state.
  - One empty side is valid and should show all content as added or removed with a clear explanation.
  - Invalid mode/view/query values fall back to defaults.
  - Do not trim or mutate the displayed inputs.
  - Normalize CRLF/CR to LF internally for comparison, but keep display text faithful enough that line-break differences can be explained.
  - Enforce practical caps to avoid browser freezes, for example 200,000 characters per side for line mode, lower token caps for word/character modes, and a maximum diff matrix/work budget.
  - When caps are exceeded, return `tooLarge` or `tooManyTokens` with guidance to use line mode or reduce input.
  - Ignore options affect equality matching only; rendered snippets should still show the original spelling, spacing, and blank lines when possible.
  - Word mode should split text into words, whitespace, and punctuation tokens so punctuation-only edits remain visible.
  - Character mode should prefer grapheme segmentation with `Intl.Segmenter` when available, with a deterministic fallback.
- Outputs:
  - `status`: `empty`, `missingOriginal`, `missingRevised`, `identical`, `different`, `tooLarge`, or `tooManyTokens`.
  - `modeApplied` and normalized option flags.
  - `summary`: counts for unchanged, added, removed, modified blocks, total changed blocks, input line counts, token counts, and approximate percent changed.
  - `blocks`: ordered diff blocks with `type` values such as `equal`, `insert`, `delete`, and `replace`; each block should carry original/revised ranges, display text, and token counts.
  - `inlineChanges`: optional nested word/character changes for small changed line pairs.
  - `warnings`: `largeInput`, `lineEndingNormalized`, `caseIgnored`, `trailingSpacesIgnored`, `blankLinesIgnored`, `inlineDiffSkipped`, or `comparisonApproximation`.
- Result explanations:
  - Explain whether texts are identical under the selected options.
  - Explain that line mode is best for documents and lists; word/character modes are best for shorter passages.
  - Explain that ignored case/spaces/blank lines can hide differences by design.
  - Explain that positions and counts are plain-text approximations, not a legal redline.
- URL params:
  - Safe live query params: `modo`, `visao`, `ignorarCaixa`, `ignorarEspacosFinais`, and `ignorarLinhasVazias` only when non-default or useful.
  - Do not sync `original`, `alterado`, diff blocks, or summaries into `window.location.search`.
  - Explicit content-bearing share format: `#conteudo=1&original=...&alterado=...` only when the user opts in.
  - On load, read hash content only when `conteudo=1`, prefill client-side, then sanitize the live address bar after hydration so text is not retained in the visible URL.
  - Invalid query or fragment params should fall back safely without crashing.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Provide an explicit "incluir textos no link compartilhado" control before a generated link can contain content.
  - Toggling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a content share budget around 1,800 encoded characters across both text fields. If content is too long, omit content and show a warning.
  - Warn that anyone with a content-bearing link can read both pasted texts.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store inputs, outputs, diff blocks, copied summaries, or generated share content in localStorage, sessionStorage, cookies, IndexedDB, analytics events, server logs, saved app state, or API requests.

## Logic, Data, And Sources

- Logic summary:
  - Add a focused pure helper module such as `lib/tools/text-diff.ts` instead of growing `lib/tools/text.ts` further.
  - Suggested types: `TextDiffMode`, `TextDiffView`, `TextDiffState`, `TextDiffOptions`, `TextDiffBlock`, `TextDiffInlineChange`, `TextDiffSummary`, `TextDiffResult`, `TextDiffWarning`, and URL/share result types.
  - Normalize only the comparison key according to selected options; keep original token text for rendering.
  - Tokenize line mode by LF-separated lines, retaining enough line-break information for display.
  - Tokenize word mode with a stable local tokenizer that separates words, whitespace, punctuation, and symbols; use locale-aware segmentation only as a helper, not as the only path.
  - Tokenize character mode by grapheme where possible with `Intl.Segmenter({ granularity: "grapheme" })`, falling back to `Array.from`.
  - Build an edit script with a bounded sequence-diff algorithm such as LCS dynamic programming for manageable token counts. For large inputs, do not attempt quadratic work; return a capped warning/status.
  - Coalesce adjacent delete/insert operations into `replace` blocks when they represent a modified section.
  - For small replace blocks, run a secondary inline diff at word/character level to highlight exact changed tokens.
  - Keep all logic independent from React so unit tests can exercise tokenization, normalization, diff blocks, URL state, and share behavior.
- Data tables or assumptions:
  - No government, legal, financial, public-rate, check-digit, security, file-processing, or table-driven source is required.
  - The first build compares plain Unicode strings in the browser and does not parse document formats.
  - Diff quality is practical and deterministic, not a formal legal redline or semantic review.
  - Counts and ranges are based on the chosen plain-text tokenization.
- Official or authoritative sources:
  - ECMA-262 `String.prototype.normalize`, accessed 2026-07-05: https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.normalize
  - ECMA-402 `Intl.Segmenter`, accessed 2026-07-05: https://tc39.es/ecma402/#segmenter-objects
  - Codebase source checked on 2026-07-05: route tree, `lib/constants.ts`, `lib/tools`, `components/tools`, `messages/*.json`, and prior tool plans listed in the similarity check.
- Source access dates:
  - TC39 ECMA-262 and ECMA-402 draft specs checked on 2026-07-05.
  - Codebase checked on 2026-07-05.
- Rule/table effective dates:
  - Not applicable. This tool uses browser JavaScript text APIs and app-owned deterministic diff logic, not date-bound public rules or data tables.
- Freshness or maintenance risk:
  - Low for plain line diff behavior.
  - Moderate for word/grapheme segmentation because browser `Intl.Segmenter` data and fallbacks can differ by runtime.
  - Moderate for large inputs because quadratic diff algorithms can become expensive; strict caps and user-facing warnings are required.
  - Moderate privacy risk if explicit content links are used; keep content sharing hash-only, opt-in, visible, and length-limited.
- Estimator or privacy limitations:
  - This is not an estimator.
  - The tool does not prove legal, semantic, or authorship equivalence.
  - Browser-only processing reduces server exposure, but clipboard managers, browser extensions, screenshots, downloads, and explicit content-bearing links can still expose text.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Comparador de Texto`
  - PT-BR meta title: `Comparador de texto online grátis`
  - PT-BR description: `Compare dois textos no navegador, veja trechos adicionados, removidos e modificados sem enviar o conteúdo ao servidor.`
- Main form sections:
  - Two textarea inputs labeled original/revised, side by side on desktop and stacked on mobile.
  - Browser-only privacy note near the inputs.
  - Actions near inputs: copy, swap, clear, and load example.
  - Options section with mode segmented control (`linhas`, `palavras`, `caracteres`), view tabs or segmented control (`lado-a-lado`, `unificado`), and checkboxes for ignore options.
  - Share/privacy section with safe default link and explicit include-content option.
- Results sections:
  - Summary strip with status and counts for added, removed, modified, unchanged, and percent changed.
  - Side-by-side diff view with stable line numbers, added/removed/modified highlighting, wrapping long lines, and mobile-safe layout.
  - Unified diff view for copy-friendly review.
  - Inline diff highlights inside small modified line pairs.
  - Empty, identical, missing-side, too-large, and too-many-tokens states.
  - Warnings panel for ignored options, skipped inline diff, normalized line endings, or large input.
  - Actions: copy summary, copy unified diff, download `.txt`.
- SEO sections:
  - What a text comparator does.
  - How to compare two texts online.
  - Difference between line, word, and character comparison.
  - How ignored case/spaces/blank lines affect results.
  - Privacy note for pasted text.
  - Limitations for legal documents, code, rich text, and semantic meaning.
- FAQ topics:
  - `O texto e enviado para o servidor?`
  - `Qual e a diferenca entre comparar por linhas, palavras e caracteres?`
  - `Posso ignorar maiusculas, espacos e linhas vazias?`
  - `A ferramenta compara Word, PDF ou texto formatado?`
  - `Isso vale como redline juridico?`
  - `Posso compartilhar uma comparacao ja preenchida?`
  - `Por que o resultado pode diferir de outro comparador?`
- Disclaimer or privacy copy:
  - Comparison runs in the browser and should not intentionally send text to the server.
  - Do not include confidential content in shared links unless every recipient may read both texts.
  - Review legal, medical, financial, academic, source-code, and credential material manually before relying on the result.
- Related tool links:
  - Existing: `/texto`, `/texto/contador-caracteres`, `/texto/conversor-maiusculas`, `/texto/removedor-acentos`, `/texto/gerador-slug`, and `/dev/regex-tester`.
  - Future candidates: `/texto/limpar-texto`, `/texto/ordenar-linhas`, `/texto/remover-duplicados`, and structured JSON/YAML/XML diff tools if planned later.
- Translation guidance:
  - Add `toolCategories.comparacao-texto` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested category names: PT-BR `Comparacao de texto`; EN `Text comparison`; ES `Comparacion de texto`.
  - Add `tools.diff-texto` keys for metadata, form labels, mode/view labels, result states, summary labels, warnings, actions, share/privacy copy, SEO content, related links, and FAQ content.
  - Suggested tool names: PT-BR `Comparador de Texto`; EN `Text Compare`; ES `Comparador de Texto`.
  - Keep route slug `/texto/diff-texto` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Add `lib/tools/text-diff.ts` with pure state defaults, normalization, tokenization, diffing, summary shaping, inline diff, URL/search params, hash-fragment content, and share URL helpers.
  - Add `lib/tools/text-diff.test.ts` or extend the existing text test suite if local convention strongly favors one file.
- URL state:
  - Safe query params only for mode/view/ignore options.
  - Hash-only explicit content sharing with hydration sanitization.
  - Tests for ignored query content, explicit hash content, invalid params, and too-long content omission.
- UI components:
  - Add `components/tools/text/text-diff-client.tsx`.
  - Follow existing text-tool card/section patterns, but use a dense comparison layout rather than a marketing hero.
  - Use icons from `lucide-react` for actions and tool affordances.
  - Keep result panes stable and responsive; no overlapping text on mobile.
- Route and metadata:
  - Add `app/[locale]/texto/diff-texto/page.tsx` using `ToolPageLayout`, `generateToolPageMetadata`, and `setRequestLocale`.
- Registry/family/category:
  - Add `comparacao-texto` to `ToolCategoryId`, `toolCategories`, and visible message keys.
  - Add a `diff-texto` `ToolDefinition` with `familyId: "texto"`, `primaryCategoryId: "comparacao-texto"`, `available: true`, `stateMode: "query"`, and a suitable `sitemapPriority`.
- Messages:
  - Add complete PT-BR, EN, and ES translations.
  - Preserve message key parity and avoid hardcoded UI copy in the component.
- Unit tests:
  - Cover line diff, word diff, character/grapheme diff, identical text, one empty side, replacement block pairing, inline diff, ignore-case, ignore-trailing-spaces, ignore-empty-lines, CRLF normalization, token caps, URL params, hash content, and share omission.
- E2E hooks/tests:
  - Add stable `data-testid` selectors for original/revised textareas, compare mode, view toggle, ignore options, summary counts, result rows, share controls, copy/download actions, and warnings.
  - Add focused Playwright coverage for PT-BR route and smoke checks for EN/ES localized routes.
- Backlog updates:
  - Do not update the DB from creator/planner directly. After this plan, the orchestrator should mark the claimed row planned with `scripts/backlog/mark_planned.sql`.

## Test Plan

- Unit scenarios:
  - `original === alterado` returns `identical`.
  - Empty original and non-empty revised returns added content.
  - Non-empty original and empty revised returns removed content.
  - Line replacement coalesces adjacent delete/insert blocks into one modified block.
  - Word diff catches punctuation-only changes.
  - Character/grapheme diff handles accents and emoji without splitting surrogate pairs when possible.
  - Ignore-case hides casing-only changes and emits a warning.
  - Ignore-trailing-spaces hides end-of-line whitespace changes while preserving display text.
  - Ignore-empty-lines hides blank-line-only changes.
  - CRLF and LF inputs produce stable comparison and a line-ending warning when relevant.
  - Too-large/token-budget inputs stop before expensive diff work.
- URL-state scenarios:
  - Safe query contains mode/view/ignore options only.
  - Query params named `original` or `alterado` are ignored.
  - Explicit hash content loads only with `conteudo=1`.
  - Content-bearing hash is sanitized after hydration.
  - Default share omits both texts.
  - Explicit share uses hash content and respects the fragment length budget.
- Browser scenarios:
  - PT-BR `/texto/diff-texto` loads without console or page errors.
  - Two sample texts produce visible added, removed, and modified sections.
  - Side-by-side and unified views are usable on desktop and mobile.
  - Copy summary, copy unified diff, swap, clear, and download actions work.
  - Large input warning appears without freezing the page.
  - No SaveButton/favorites UI appears for this tool.
  - No pasted text appears in request URLs, request bodies, cookies, localStorage, sessionStorage, or IndexedDB keys/values during default usage.
- Playwright scenarios:
  - Focused Chromium spec for main diff flow, ignore toggles, share privacy, hash hydration/sanitization, mobile no-overflow, and localized route smoke checks.
  - If sandboxed Chromium hits the known macOS permission issue, rerun focused Playwright elevated as in recent tool validations.
- Lint/build commands:
  - `corepack pnpm test -- lib/tools/text-diff.test.ts lib/constants.test.ts`
  - `corepack pnpm lint`
  - `corepack pnpm build` with the same placeholder/env approach used by recent tool work if local Prisma/env requirements block a plain build.
  - `git diff --check`
- Acceptance criteria:
  - Plan implemented at `/texto/diff-texto`.
  - Registry, category, messages, route metadata, helper, UI, unit tests, and e2e tests are present.
  - Text content is never placed in normal query params or sent to app APIs by default.
  - Default sharing is settings-only; explicit content sharing is hash-only and length-limited.
  - Unit, URL-state, e2e, browser, lint, build, and whitespace validation pass or have documented environment-only blockers.

## Implementation Notes

- Status updates:
  - 2026-07-05: Planner decision `new`; target route `/texto/diff-texto`; plan written for creator handoff.
  - 2026-07-05: Creator accepted the orchestrator handoff; DB item was provided as `In Progress` with stage `implementation`, so app implementation started and plan status moved to `in_progress`.
  - 2026-07-05: Implemented `/texto/diff-texto` with pure bounded diff logic, client UI, registry/category wiring, PT-BR/EN/ES messages, unit/URL-state tests, and focused Playwright coverage.
  - 2026-07-05: Narrow review-fix handoff addressed the accepted helper findings only; DB item remains `In Progress` with stage `review`, not `Done`.
- Files changed:
  - `docs/tool-plans/diff-texto.md`
  - `lib/tools/text-diff.ts`
  - `lib/tools/text-diff.test.ts`
  - `components/tools/text/text-diff-client.tsx`
  - `app/[locale]/texto/diff-texto/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/text-diff.spec.ts`
- Validation results:
  - 2026-07-05: `git diff --check --no-index /dev/null docs/tool-plans/diff-texto.md` produced no whitespace warnings; exit code `1` is expected for a new-file diff.
  - 2026-07-05: `corepack pnpm test -- lib/tools/text-diff.test.ts`: passed; repo test script ran 64 non-e2e files / 750 tests.
  - 2026-07-05: `corepack pnpm test -- lib/tools/text-diff.test.ts lib/constants.test.ts`: passed; repo test script ran 64 non-e2e files / 750 tests.
  - 2026-07-05: Message JSON parse and key parity for `tools.diff-texto` and `toolCategories.comparacao-texto`: passed.
  - 2026-07-05: `corepack pnpm lint`: passed with no warnings after removing an unused helper constant.
  - 2026-07-05: Plain `corepack pnpm build` failed before Next because Prisma requires `DATABASE_URL`; sandboxed placeholder build then failed on Prisma cache `EPERM`. Elevated placeholder build with `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-check-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 NEXT_TELEMETRY_DISABLED=1 corepack pnpm build` passed; output listed `/[locale]/texto/diff-texto` for PT-BR/EN/ES and emitted only existing `metadataBase`/edge-runtime warnings.
  - 2026-07-05: Sandboxed focused Playwright failed before assertions with the known macOS Chromium `MachPortRendezvousServer` permission error. Elevated focused Playwright passed: `PORT=3207 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3207' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3207 NEXTAUTH_URL=http://localhost:3207 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/text-diff.spec.ts` (6/6 Chromium tests).
  - 2026-07-05: `git diff --check` passed for tracked edits. No-index whitespace checks for new route, component, helper, helper tests, e2e spec, and plan produced no warnings; exit code `1` is expected for new-file diffs.
  - 2026-07-05: Review-fix rerun `corepack pnpm test -- lib/tools/text-diff.test.ts lib/constants.test.ts` passed; repo test script ran 64 non-e2e files / 753 tests.
  - 2026-07-05: Review-fix rerun `git diff --check` passed for tracked edits. No-index whitespace checks for the touched new helper, helper tests, and plan produced no warnings; exit code `1` is expected for new-file diffs.
- PR-review findings addressed:
  - Status issue: `empty`, `missingOriginal`, and `missingRevised` now derive from the raw textarea values; `identical`/`different` derive from diff block types.
  - Ignore options issue: trailing-space and blank-line ignores now use comparison-only token keys where practical while preserving display token values/ranges; added regressions for word/character trailing spaces and blank-line display/range preservation.
- Tester findings:
  - 2026-07-05: Independent tester validation passed for `/texto/diff-texto`. Tester changed only `tests/e2e/text-diff.spec.ts` and this plan; no production code was modified.
  - DB source-of-truth check passed after sourcing `/Users/saulodefaria/coding/personal/projects/calculaderia/.env`: `scripts/backlog/get_item.sql` returned kind `tool`, slug `diff-texto`, status `In Progress`, stage `testing`, target route `/texto/diff-texto`, plan path `docs/tool-plans/diff-texto.md`, and branch `codex/diff-texto-tool`.
  - Route and implementation inspection confirmed field ids/test ids for original/revised textareas, mode/view controls, ignore options, result status/summary, side-by-side/unified output, share controls, copy/swap/clear/example/download actions, and no `SaveButton` behavior.
  - Added e2e coverage for character/grapheme mode plus `ignorarLinhasVazias=1`, including safe live query restoration and omitted text params.
  - Browser/dev-server validation used elevated Chromium against `next dev` because sandboxed Chromium still fails on this macOS host with `MachPortRendezvousServer` permission errors.
  - Covered PT-BR main route, EN/ES smoke, no redirect loop, no console/page errors, realistic original/revised comparison, line/word/character modes, side-by-side/unified views, ignore case/trailing spaces/blank lines, copy summary/unified, swap, clear, example, TXT download, default settings-only share, explicit hash-only content share, hydration sanitization, content budget warning, mobile no horizontal overflow, no pasted text in request URLs/bodies/storage/cookies/IndexedDB, no SaveButton, and no favorites/simulations API persistence.
  - Static privacy scan of route/component/helper found no `SaveButton`, favorites/simulations API references, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `fetch`, `sendBeacon`, or XHR usage.
- Tester commands:
  - `zsh -lc 'set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=diff-texto -f scripts/backlog/get_item.sql'`: passed and confirmed DB status/stage `In Progress`/`testing`.
  - `pnpm run test:e2e -- tests/e2e/text-diff.spec.ts`: blocked before Playwright by the local non-TTY pnpm modules-purge prompt.
  - `PORT=3208 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3208' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3208 NEXTAUTH_URL=http://localhost:3208 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/text-diff.spec.ts`: sandboxed run failed before assertions with the known macOS Chromium `MachPortRendezvousServer` permission error; elevated final run passed 7/7 Chromium tests.
  - `./node_modules/.bin/eslint tests/e2e/text-diff.spec.ts`: passed.
  - `./node_modules/.bin/vitest run lib/tools/text-diff.test.ts lib/constants.test.ts`: passed, 2 files / 28 tests.
  - `git diff --check`: passed.
  - `git diff --check --no-index /dev/null docs/tool-plans/diff-texto.md`: no whitespace warnings; exit code `1` is expected for a new-file diff.
  - `git diff --check --no-index /dev/null tests/e2e/text-diff.spec.ts`: no whitespace warnings; exit code `1` is expected for a new-file diff.
  - 2026-07-05: Final orchestrator rerun `corepack pnpm test -- lib/tools/text-diff.test.ts lib/constants.test.ts`: passed; repo test script ran 64 non-e2e files / 753 tests.
  - 2026-07-05: Final orchestrator rerun `corepack pnpm lint`: passed.
  - 2026-07-05: Final orchestrator placeholder-env build passed with `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=build-check-secret AUTH_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 NEXT_TELEMETRY_DISABLED=1 corepack pnpm build`; output listed `/[locale]/texto/diff-texto` for PT-BR/EN/ES and emitted only existing `metadataBase`/edge-runtime warnings.
- Residual risks:
  - Plain `pnpm run test:e2e` remains blocked by the environment's non-TTY pnpm modules-purge prompt, so tester used direct local binaries.
  - Sandboxed Chromium remains unusable on this host; browser/e2e validation requires elevated execution.
  - Full app lint/build were not rerun by this tester pass because only e2e and plan files changed; creator/review-fix runs already recorded full lint/build coverage for production code.
- Final status:
  - Tester validation passed. Draft PR: https://github.com/saulodefaria/calculaderia/pull/49
  - Orchestrator advanced the DB item to `verified` before PR creation, then marked it `Done` with stage `pr` using `scripts/backlog/mark_done.sql`.
  - DB done ref records the route, draft PR URL, and final pushed commit.
