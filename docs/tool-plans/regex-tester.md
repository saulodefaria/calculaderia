---
slug: "regex-tester"
familyId: "dev"
primaryCategoryId: "expressoes-regulares"
backlogRank: 11
primaryKeyword: "regex tester"
decision: "new"
targetRoute: "/dev/regex-tester"
status: "verified"
createdAt: "2026-06-26"
updatedAt: "2026-06-26"
---

# Regex Tester Plan

## Backlog Row

- Rank: 11
- Original status: Backlog
- Slug: `regex-tester`
- Primary keyword: `regex tester`
- Cluster keywords: `testar regex online`; `regular expression tester`; `regex javascript`
- Family/category: backlog family `dev`; planned family `dev`; planned category `expressoes-regulares`
- Opportunity score: 77
- Idea type: New
- Notes: Useful but needs careful UX for flags, matches, groups, and errors.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/dev/regex-tester`
- Rationale: Build a first-class JavaScript regex tester in the existing developer family. The current repo has `/dev/formatador-json` and `/dev/conversor-base64`, but no route, registry entry, helper, component, translation namespace, or plan that tests JavaScript regular expressions. The stale local backlog still shows ranks 8-10 as `Backlog`, but automation memory records `unix-timestamp`, `uuid`, and `paleta-cores` as completed or in PR flow, so rank 11 is the next eligible non-calculator `New` row for this run.

## Similarity Check

- Existing routes checked:
  - Generic tool pages: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, and `app/[locale]/[familySlug]/categorias/[categorySlug]/page.tsx`.
  - Current family routes under `app/[locale]`: `dev`, `geradores`, `validadores`, `matematica`, `datas`, and `texto`.
  - Current dev routes: `app/[locale]/dev/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, and `app/[locale]/dev/conversor-base64/page.tsx`.
  - No `/dev/regex-tester` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `dev`.
  - Existing dev categories are `dados-estruturados` for JSON and `codificacao` for Base64. Regex testing is not structured-data formatting or encoding, so the creator should add a new dev category such as `expressoes-regulares`.
  - No `regex-tester` tool entry exists in `tools`.
- Related modules/translations checked:
  - `lib/tools` contains helpers for Base64, JSON, dates, documents, email, generators, math, QR code, and text, but no regex helper.
  - `components/tools/dev/json-formatter-client.tsx` and `components/tools/dev/base64-converter-client.tsx` provide the closest developer-tool privacy and hash-sharing patterns.
  - `components/tools/url-state.ts` provides generic query/share helpers.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` have dev/JSON/Base64 keys but no regex tester namespace.
- Prior plans checked:
  - `docs/tool-plans/formatador-json.md` and `docs/tool-plans/conversor-base64.md` list `/dev/regex-tester` only as a future related tool.
  - `docs/tool-plans/validador-email.md` also mentions `/dev/regex-tester` as a future related tool.
  - No duplicate `regex-tester` plan exists in `docs/tool-plans` or `docs/calculator-plans`.
- Text search checked:
  - `regex-tester`, `regex tester`, `testar regex`, `regular expression tester`, `regex javascript`, `RegExp`, and `regular expression` across app, lib, components, messages, tests, `docs/tool-plans`, `docs/calculator-plans`, and `docs/tool-backlog.md`.
  - Existing `RegExp` references are implementation details in tests/calculator helpers or future-link text, not a user-facing regex tester.
- Overlap conclusion:
  - Build a new route at `/dev/regex-tester`.
  - Keep future rows such as `/dev/url-encode-decode`, `/dev/hash-texto`, `/dev/jwt-decoder`, `/dev/cron-parser`, `/dev/validador-yaml`, and `/dev/validador-xml` separate because they solve different developer jobs.
  - This tool should link to JSON/Base64 and text counter, but it should not merge into them.

## User Intent And Scope

- Target user: Developers, QA analysts, support engineers, students, data analysts, and technical writers who need to test a JavaScript regular expression against sample text without sending either to a server.
- User job: Enter a pattern and test text, toggle JavaScript flags, see compile errors or matches immediately, inspect numbered and named capture groups, understand match positions, copy extracted results, and share only safe settings unless they explicitly include content.
- In scope:
  - Browser-only JavaScript `RegExp` compilation and matching.
  - Pattern entry without surrounding slash delimiters, plus clear handling for users who paste `/pattern/flags`.
  - Flag controls for common JavaScript flags: `g`, `i`, `m`, `s`, `u`, `v`, `y`, and `d`, with browser-support diagnostics when a flag is unavailable.
  - Match listing with full match, index range, preview, numbered groups, named groups, and indices when the `d` flag is active and supported.
  - Text highlighting for matches, including overlapping-safe rendering and zero-length match handling.
  - Invalid-pattern errors with stable app-owned error codes plus the browser error text as secondary diagnostics.
  - Guardrails for large text, large match counts, zero-length loops, and catastrophic-backtracking risk.
  - Privacy-aware share behavior that keeps pattern and test text out of the live query string by default.
- Out of scope:
  - Server-side regex execution, PCRE/Python/Ruby/.NET compatibility modes, replacement/substitution tooling, regex generation, regex explanation AI, regex linting beyond simple warnings, schema validation, file upload, saved history, account favorites, and cross-browser semantic guarantees.
  - Claims that a pattern is safe, complete, performant, or production-ready.
- Sensitive-topic caveats:
  - Treat pasted patterns and test text as potentially containing proprietary business rules, tokens, logs, customer data, or credentials.
  - Regex execution can be slow or hang for some pattern/input combinations because of backtracking. The UI must warn clearly and should isolate matching from the main page when feasible.
  - JavaScript regex syntax differs from PCRE and other engines, so results should be described as JavaScript/browser results only.

## Tool Contract

- Inputs:
  - `padrao`: raw regex pattern text. Users should normally enter the pattern without `/.../` delimiters.
  - `texto`: test text.
  - `flags`: selected JavaScript flags, canonicalized in a stable order such as `dgimsuvy` or the project's chosen UI order.
  - `limite`: maximum matches to collect; default `100`; allowed values such as `25`, `100`, `250`, and `500`.
  - `conteudo`: optional explicit hash/fragment flag (`1`) that allows `padrao` and `texto` to be loaded from and included in generated share links.
- Defaults:
  - `padrao` empty.
  - `texto` empty.
  - `flags=g`, so users see all matches once they enter a pattern.
  - `limite=100`.
  - `conteudo` absent, so default live URLs and default share URLs omit the pattern and test text.
  - Provide placeholders and a "load example" action, but do not prefill private-content fields by default.
- Validation rules:
  - Empty pattern should show a neutral "enter a pattern" state, not a compile error.
  - Empty test text with a non-empty pattern should show a neutral "enter test text" state.
  - Pattern length should have a practical cap such as 5,000 characters.
  - Test text should have a practical cap such as 200,000 characters for automatic matching; over-limit text can show a warning and require trimming before matching.
  - Invalid query or hash params must fall back to defaults without crashing.
  - Duplicate flags are impossible from UI toggles and should be deduplicated when read from URL state.
  - `u` and `v` must be treated as mutually exclusive because `new RegExp(pattern, "uv")` is invalid in JavaScript engines.
  - Unsupported flags should produce a localized `unsupportedFlag` or `invalidFlags` diagnostic from the `RegExp` constructor error.
  - If users paste a full literal such as `/foo/gi`, offer a parse action or auto-detect only when it is unambiguous. Do not silently strip slashes from patterns like `\/api\/`.
  - Matching loops must guard against zero-length matches by advancing `lastIndex` safely and stopping at the match limit.
  - Timeouts or slow-pattern warnings should return a distinct `timeout` or `tooSlow` status without clearing user input.
- Outputs:
  - `status`: `empty`, `needsText`, `valid`, `noMatch`, `invalidPattern`, `invalidFlags`, `tooLarge`, `tooManyMatches`, or `timeout`.
  - `compiledSource`: the source returned by the constructed `RegExp` when valid.
  - `flagsUsed`: normalized flags.
  - `matches`: ordered match objects with match number, full text, start index, end index, length, input preview, numbered groups, named groups, and optional indices.
  - `summary`: total matches shown, whether results were truncated by `limite`, and whether the global/sticky flags affected matching.
  - `warnings`: zero-length matches, match limit reached, unsupported advanced flag, large input, possible catastrophic backtracking, and JavaScript-engine-only compatibility.
  - `error`: stable app-owned error code plus localized explanation and optional browser `SyntaxError.message`.
- Result explanations:
  - Explain that positions are JavaScript string indices (UTF-16 code units), not necessarily visual characters or Unicode grapheme clusters.
  - Explain that without the `g` or `y` flag, JavaScript returns only the first match in this tester.
  - Explain that `d` exposes match indices when supported by the current browser.
  - Explain that named groups appear only when the pattern uses syntax like `(?<name>...)`.
  - Explain that `u` and `v` affect Unicode behavior and cannot be enabled together.
  - Explain that browser error text and exact performance can vary by JavaScript engine.
- URL params:
  - Safe params synced automatically in `window.location.search`: `flags` and `limite`.
  - Do not sync `padrao` or `texto` to the live query string.
  - Explicit content params must live only in the URL fragment/hash, for example `?flags=gi&limite=100#conteudo=1&padrao=...&texto=...`.
  - Read `padrao` and `texto` only from the hash when `conteudo=1`.
  - After loading a content-bearing hash URL, prefill the editor client-side and sanitize the live address bar back to safe query params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings: route, `flags`, and `limite`.
  - Provide an explicit "include pattern and test text in shared link" checkbox or equivalent confirmation.
  - Enabling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Apply a fragment length budget such as 1,800 characters. If content is too large, omit content and show a warning.
  - Warn that anyone with a content-bearing link can read the pattern and test text.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store pattern, text, matches, or errors in localStorage, sessionStorage, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add pure helpers such as `lib/tools/regex.ts` for state defaults, flag normalization, literal parsing, validation, match result shaping, URL-state helpers, hash-fragment share helpers, warning heuristics, and result types.
  - Compile with `new RegExp(pattern, flags)` in the browser.
  - Execute matches with a fresh `RegExp` instance so `lastIndex` from previous runs never leaks into a new result.
  - If the selected flags do not include `g` or `y`, run one `exec` call and show the first match.
  - If `g` or `y` is selected, loop with `exec`, collect matches until no match or the configured `limite`, and advance safely for zero-length matches.
  - Use `match.index` and `match[0].length` for base ranges. When the `d` flag is enabled and `match.indices` exists, include full-match, numbered-group, and named-group indices.
  - Use `match.groups` for named groups and positional capture array entries for numbered groups.
  - Use a Web Worker for matching if feasible so long-running regex execution can be terminated on timeout without freezing the page. If a worker is not introduced in the first implementation, keep automatic matching caps stricter and document the residual freeze risk in the plan notes.
- Performance and ReDoS handling:
  - Set an execution timeout target such as 750-1,000 ms for worker-based matching.
  - Add a match-count limit and display a truncated-results warning when reached.
  - Debounce automatic execution while users type.
  - Add a simple heuristic warning for patterns commonly associated with catastrophic backtracking, such as nested quantifiers or repeated alternations with overlapping prefixes. This warning is advisory only and must not claim to prove safety.
  - Keep the UI copy explicit that some regexes can still be slow or can freeze a browser tab, especially without worker isolation.
- Data tables or assumptions:
  - No external data tables are required.
  - The regex engine is the current browser's JavaScript `RegExp` implementation.
  - Results are JavaScript regex results, not PCRE, RE2, Python, Java, Ruby, PHP, or .NET results.
  - Indices are JavaScript string indices in UTF-16 code units.
- Official or authoritative sources:
  - TC39 ECMA-262 living specification, RegExp objects: https://tc39.es/ecma262/#sec-regexp-regular-expression-objects
  - TC39 ECMA-262 living specification, `RegExp.prototype.exec`: https://tc39.es/ecma262/#sec-regexp.prototype.exec
  - TC39 ECMA-262 living specification, `String.prototype.matchAll`: https://tc39.es/ecma262/#sec-string.prototype.matchall
  - MDN JavaScript `RegExp` reference for browser-facing flag and property documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
  - OWASP Regular expression Denial of Service guidance for catastrophic-backtracking risk framing: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
  - Codebase source checked on 2026-06-26: routes, `lib/constants.ts`, `lib/tools`, `components/tools`, URL-state helpers, messages, tests, and prior tool/calculator plans.
- Source access dates:
  - TC39 ECMA-262 links checked on 2026-06-26.
  - MDN `RegExp` reference checked on 2026-06-26.
  - OWASP ReDoS page checked on 2026-06-26.
  - Codebase checked on 2026-06-26.
- Rule/table effective dates:
  - Not applicable. This tool uses browser JavaScript APIs and no government, legal, financial, public-rate, or table-driven rules.
- Freshness or maintenance risk:
  - Low for core `RegExp` construction and `exec` behavior.
  - Moderate for newer flags such as `d` and `v`; browser support and error messages can vary.
  - Moderate for exact error messages because browsers localize or phrase `SyntaxError` differently.
  - Moderate-to-high for performance safety because catastrophic backtracking depends on both pattern and input. Worker timeout plus caps reduce risk but do not make arbitrary regexes safe.
- Estimator or privacy limitations:
  - The tool tests JavaScript regex behavior only. It does not prove a pattern is secure, portable, efficient, or suitable for validation in production.
  - Browser-only execution reduces server exposure, but clipboard contents, screenshots, browser extensions, and explicit content-bearing share links can still expose data.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Regex Tester`
  - PT-BR meta title: `Regex tester online para JavaScript`
  - PT-BR description: `Teste expressoes regulares JavaScript no navegador, veja matches, grupos, flags e erros sem enviar o texto para o servidor.`
- Main form sections:
  - Pattern input with clear label, placeholder, and optional unambiguous `/padrao/flags` parse helper.
  - Flag toolbar with toggles for `g`, `i`, `m`, `s`, `u`, `v`, `y`, and `d`; each flag needs a short tooltip/description in translations.
  - Match limit selector.
  - Test text textarea with browser-only privacy note.
  - Share/privacy section with default safe link and explicit include-content option.
- Results sections:
  - Compile status panel for valid pattern, invalid pattern, unsupported flag, or neutral state.
  - Highlighted text preview with stable dimensions and horizontal overflow contained inside the preview when needed.
  - Match summary with total matches, shown matches, and truncation/time warnings.
  - Match list/table with full match, index range, numbered captures, named captures, and optional `d` flag indices.
  - Copy actions for all matches, first match, groups as JSON, and error details.
  - Warning panel for catastrophic-backtracking risk, JavaScript-only behavior, and content-sharing privacy.
- SEO sections:
  - What a regex tester does.
  - JavaScript regex flags explained.
  - How matches and capture groups work.
  - Why a regex can work differently in JavaScript than in PCRE or other engines.
  - Performance and catastrophic-backtracking caveats.
  - Privacy note for logs, tokens, and customer data.
- FAQ topics:
  - `O texto e enviado para o servidor?`
  - `Este tester usa qual motor de regex?`
  - `Quais flags JavaScript posso usar?`
  - `Como vejo grupos capturados e grupos nomeados?`
  - `Por que meu regex funciona em outro site mas nao aqui?`
  - `Uma regex pode travar o navegador?`
  - `Posso compartilhar um teste ja preenchido?`
- Disclaimer or privacy copy:
  - The pattern and text are processed in the browser and should not intentionally be sent to the server.
  - Do not paste secrets, production logs, tokens, passwords, or customer data unless you are comfortable processing them in the current browser.
  - Content-bearing share links expose the pattern and text to anyone who receives the URL.
  - Results follow the current browser's JavaScript `RegExp` behavior and are not a compatibility guarantee for other engines.
- Related tool links:
  - Existing: `/dev`, `/dev/formatador-json`, `/dev/conversor-base64`, `/texto/contador-caracteres`.
  - Future backlog candidates: `/dev/url-encode-decode`, `/dev/hash-texto`, `/dev/jwt-decoder`, `/dev/cron-parser`, `/dev/validador-yaml`, `/dev/validador-xml`, and `/texto/diff-texto`.
- Translation guidance:
  - Add `toolCategories.expressoes-regulares` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested category names: PT-BR `Expressoes regulares`; EN `Regular Expressions`; ES `Expresiones regulares`.
  - Add `tools.regex-tester` keys for metadata, form labels, flag labels/descriptions, match-limit labels, result statuses, match/group tables, warnings, validation errors, privacy/share copy, actions, SEO sections, and FAQ content.
  - Suggested tool names: PT-BR `Regex Tester`; EN `Regex Tester`; ES `Probador de Regex`.
  - Keep route slug `/dev/regex-tester` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/regex.ts` with default state, flag definitions, canonical flag normalization, URL/search-param helpers, hash-fragment helpers, optional literal parsing, match result shaping, warning detection, and typed result statuses.
  - Add worker-compatible matching code or a small dedicated worker wrapper if the implementation chooses timeout isolation.
  - Add `lib/tools/regex.test.ts` with deterministic coverage for flags, invalid patterns, matching, groups, named groups, `d` indices when supported/mocked, zero-length matches, match limits, URL state, and hash sharing.
- URL state:
  - Sync only safe settings to the live query string: `flags` and `limite`.
  - Read `padrao` and `texto` only from a `conteudo=1` hash fragment.
  - Generate content-bearing links only from the explicit share callback and only in the hash fragment.
  - Sanitize the address bar after loading a content-bearing hash.
  - Add a fragment length budget and visible too-long warning.
- UI components:
  - Create `components/tools/dev/regex-tester-client.tsx`.
  - Follow the JSON/Base64 client privacy pattern for safe query state and explicit hash-only content sharing.
  - Use lucide icons for run/test, copy, clear, warning, success, share, and reset actions. Prefer a regex/search/code icon if available in the installed lucide version; otherwise use `Code2`.
  - Keep pattern input, text editor, highlighted preview, and match table responsive with contained overflow for long lines.
  - Add accessible labels and stable test ids for pattern input, test text input, each flag toggle, match limit selector, status panel, match list, group table, include-content control, share button, copy actions, clear/reset actions, and warning panels.
- Route and metadata:
  - Add `app/[locale]/dev/regex-tester/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "regex-tester")`.
  - Reuse existing `app/[locale]/dev/page.tsx`.
- Registry/family/category:
  - Reuse existing `dev` family.
  - Add `expressoes-regulares` to `ToolCategoryId` and `toolCategories` under family `dev`, with href `/dev/categorias/expressoes-regulares`.
  - Add `regex-tester` to `tools` with `available: true`, `familyId: "dev"`, `primaryCategoryId: "expressoes-regulares"`, `categoryIds: ["expressoes-regulares"]`, `sitemapPriority` around `0.76`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"`.
- Messages:
  - Add PT-BR, EN, and ES translations for the new category and tool.
  - Include concise explanations for each flag:
    - `g`: global/all matches.
    - `i`: ignore case.
    - `m`: multiline anchors.
    - `s`: dot matches line breaks.
    - `u`: Unicode mode.
    - `v`: Unicode sets mode when supported.
    - `y`: sticky matching.
    - `d`: match indices when supported.
  - Include browser-only privacy, JavaScript-engine limitation, and catastrophic-backtracking warnings in all locales.
- Unit tests:
  - Cover empty pattern/text neutral states.
  - Cover valid first-match and global-match behavior.
  - Cover numbered groups and named groups.
  - Cover zero-length pattern behavior with match limit and no infinite loop.
  - Cover invalid pattern such as `(` and invalid flag combinations such as `uv`.
  - Cover `g`, `i`, `m`, `s`, `u`, and `y` behavior where deterministic.
  - Cover `d` indices only when supported by the test runtime or via isolated shaping tests.
  - Cover pasted literal parsing for unambiguous `/abc/gi` and non-parsing for ambiguous slash-heavy input.
  - Cover warning heuristic without treating it as a security guarantee.
  - Cover safe query params and hash-only content sharing.
- E2E hooks/tests:
  - Add a focused Playwright spec such as `tests/e2e/regex-tester.spec.ts`.
  - Reuse existing e2e conventions for locale routing, clipboard, share URL, mobile overflow, and console-error checks.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark rank 11 `regex-tester` as `In Progress` only when implementation starts and `Done` only after validation passes and PR/publication details are known.

## Test Plan

- Unit scenarios:
  - Empty state returns `empty` and no match list.
  - Pattern `\\b\\w+@\\w+\\.\\w+\\b` with `g` over two email-like samples returns two matches.
  - Pattern `(\\w+)@(\\w+\\.\\w+)` exposes numbered groups.
  - Pattern `(?<user>\\w+)@(?<host>\\w+\\.\\w+)` exposes named groups.
  - Pattern `^linha` with `gm` matches line starts across multiple lines.
  - Pattern `a.*b` with and without `s` differs across a newline.
  - Pattern `(?=a)` with `g` does not infinite-loop on zero-length matches.
  - Invalid pattern `(` returns `invalidPattern` and preserves input.
  - Invalid flag combination `uv` returns an invalid/unsupported flags diagnostic.
  - Match limit truncates results deterministically.
  - Large input returns `tooLarge` before automatic execution.
  - Search-param helpers include only `flags` and `limite`.
  - Fragment helpers include `padrao` and `texto` only when content sharing is explicitly enabled and within the length budget.
- URL-state scenarios:
  - `?flags=im&limite=25` initializes safe settings.
  - Invalid `flags` or `limite` falls back to defaults.
  - Typing pattern or text does not add either value to `window.location.search`.
  - Toggling include-content does not mutate the live URL.
  - Clicking share with include-content off copies a safe settings-only URL.
  - Clicking share with include-content on copies a URL with `conteudo=1`, `padrao`, and `texto` in the hash fragment, not query params.
  - Loading a content-bearing fragment preloads pattern/text client-side and then sanitizes the address bar after hydration.
- Browser scenarios:
  - `/dev/regex-tester` renders heading, breadcrumb, pattern input, text textarea, flag controls, match limit, privacy copy, results panel, and FAQ.
  - Entering a valid pattern/text shows highlighted matches and match rows.
  - Capture groups and named groups appear in the match detail UI.
  - Invalid patterns show localized errors without clearing inputs.
  - The `d` flag either exposes indices or shows an unsupported-browser diagnostic, depending on browser support.
  - Performance warnings appear for intentionally risky nested quantifier samples without claiming proof.
  - Copy actions for matches/groups/error details work.
  - `/dev` lists `Regex Tester` after registry wiring.
  - `/dev/categorias/expressoes-regulares` lists `Regex Tester` after category wiring.
  - Mobile viewport has no horizontal overflow; long patterns/text lines stay inside editor/result containers.
  - Browser console has no hydration errors or uncaught exceptions.
- Playwright scenarios:
  - Navigate to `/dev/regex-tester` and assert heading `Regex Tester`.
  - Fill pattern `(\\w+)@(\\w+\\.\\w+)`, flags `g`, and test text with two addresses; assert two matches and capture groups.
  - Toggle `i` and assert case-insensitive matching changes the result for a mixed-case sample.
  - Fill invalid pattern `(` and assert invalid-pattern message is visible.
  - Assert the current URL never contains pasted pattern or text by default.
  - Enable include-content, click share, and assert clipboard URL contains encoded content in the hash fragment only.
  - Visit a shared content URL, assert pattern/text are restored, then assert the live URL is sanitized.
  - Visit `/dev` and the new category route to assert discovery.
  - Assert `/sitemap.xml` includes `/dev/regex-tester` and the new category route for supported locales after implementation.
- Lint/build commands:
  - Run the repo unit test command for `lib/tools/regex.test.ts`.
  - Run the relevant focused Playwright e2e command.
  - Run the repo lint command or targeted ESLint for touched files.
  - Run message JSON parse checks for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Run the repo build command, including required local env placeholders if the existing build needs them.
  - Run `git diff --check`.
- Acceptance criteria:
  - The route `/dev/regex-tester` is discoverable through the dev family, new regex category, tools hub, related links, and sitemap.
  - Pattern compilation, flags, matches, groups, invalid patterns, and warnings work fully in the browser.
  - Pattern/test text are never sent to the server, stored, or written to live query params by default.
  - Explicit content sharing is hash-only, budgeted, visibly warned, and sanitized after hydration.
  - The UI remains usable on desktop and mobile and avoids freezing for common slow-pattern cases through worker timeout or documented strict caps.

## Implementation Notes

- Status updates:
  - 2026-06-26: Planner selected rank 11 `regex-tester` after skipping ranks 8-10 per automation memory. Wrote `decision: "new"` plan for `/dev/regex-tester`.
  - 2026-06-26: Creator started implementation; marked backlog rank 11 `In Progress` and plan status `in_progress`.
  - 2026-06-26 01:38 -0300: Creator implemented the browser-only regex tester route, pure helper, translations, registry wiring, unit tests, and focused Playwright handoff spec. No worker wrapper was introduced in this first implementation; strict text/match caps, ReDoS heuristic warnings, and plan/tester notes document the remaining freeze risk for pathological patterns.
  - 2026-06-26 02:00 -0300: Review-fix handoff addressed the accepted findings only. Regex matching now runs in a dedicated module worker with debounce, request cancellation, and a 900 ms timeout that returns localized `timeout` status instead of executing `RegExp.exec` on the main render path. The client uses safe preflight results for neutral/pending states and keeps the ReDoS heuristic visible without running expensive matching on the page. Focused Playwright coverage now asserts browser UI behavior for `d` flag indices and the visible `possibleReDoS` warning with a small non-hanging sample.
  - 2026-06-26 02:10 -0300: Narrow review-fix handoff addressed accepted `test-gap(worker)` only. Added focused Playwright coverage that runs `(a+)+$` against 28 `a` characters plus `!`, waits for the PT-BR timeout status `Execução interrompida`, then switches to `b+` / `bbb`, verifies `Matches encontrados`, waits beyond the worker timeout window, and confirms the valid match remains visible without a stale timeout overwrite.
- Files changed:
  - `docs/tool-plans/regex-tester.md`
  - `docs/tool-backlog.md`
  - `lib/tools/regex.ts`
  - `lib/tools/regex.test.ts`
  - `components/tools/dev/regex-tester-client.tsx`
  - `components/tools/dev/regex-tester-worker.ts`
  - `app/[locale]/dev/regex-tester/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/regex-tester.spec.ts`
- Validation results:
  - Planner overlap check completed across backlog, routes, registry, `lib/tools`, tool components, URL-state helpers, messages, tests, prior tool plans, prior calculator plans, and text search.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/regex.test.ts lib/constants.test.ts` passed: 2 files, 19 tests.
  - `node -e "for (const file of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(file, 'utf8')); console.log(file + ' ok'); }"` passed for all three locale files.
  - `./node_modules/.bin/eslint lib/tools/regex.ts lib/tools/regex.test.ts components/tools/dev/regex-tester-client.tsx app/'[locale]'/dev/regex-tester/page.tsx tests/e2e/regex-tester.spec.ts lib/constants.ts` passed after removing one unused import warning.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed to satisfy the generated Prisma client prerequisite for TypeScript.
  - `./node_modules/.bin/tsc --noEmit --pretty false` passed after Prisma generation.
  - `git diff --check` passed.
  - `git diff --check --no-index /dev/null <new-file>` produced no whitespace warnings for the new route, client, helper, unit test, e2e spec, and plan files; exit code 1 was expected because each file differs from `/dev/null`.
  - Focused Playwright spec `tests/e2e/regex-tester.spec.ts` was added as a tester handoff hook but not executed in this creator pass.
  - Plain `pnpm` wrappers were not used because automation memory records a local no-TTY modules prompt; direct local binaries were used instead.
- Review-fix validation results:
  - `./node_modules/.bin/vitest run lib/tools/regex.test.ts lib/constants.test.ts --reporter=dot` passed: 2 files, 20 tests.
  - `node -e "for (const file of ['messages/pt-br.json','messages/en.json','messages/es.json']) { JSON.parse(require('fs').readFileSync(file, 'utf8')); console.log(file + ' ok'); }"` passed for all three locale files.
  - `./node_modules/.bin/eslint lib/tools/regex.ts lib/tools/regex.test.ts components/tools/dev/regex-tester-client.tsx components/tools/dev/regex-tester-worker.ts app/'[locale]'/dev/regex-tester/page.tsx tests/e2e/regex-tester.spec.ts lib/constants.ts` passed.
  - `./node_modules/.bin/tsc --noEmit --pretty false` passed.
  - `git diff --check` passed.
  - Sandboxed Playwright failed before tests with the host macOS `MachPortRendezvousServer` Chromium permission error. Elevated `PORT=3171 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3171" ./node_modules/.bin/playwright test tests/e2e/regex-tester.spec.ts` passed: 7 Chromium tests.
  - During focused browser validation, the regex messages' named-group examples were escaped for ICU parsing, and match-list containers received `min-w-0` guards so long matches do not create mobile document overflow.
- Narrow review-fix validation results:
  - `./node_modules/.bin/eslint tests/e2e/regex-tester.spec.ts` passed.
  - Sandboxed `PORT=3172 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3172" ./node_modules/.bin/playwright test tests/e2e/regex-tester.spec.ts -g "recovers from a timed out worker"` failed before test execution with the known macOS Chromium `MachPortRendezvousServer` permission error.
  - Elevated `PORT=3173 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3173" ./node_modules/.bin/playwright test tests/e2e/regex-tester.spec.ts -g "recovers from a timed out worker"` passed: 1 Chromium test.
- Independent tester validation results:
  - 2026-06-26 02:14 -0300: Sandboxed `PORT=3180 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3180" ./node_modules/.bin/playwright test tests/e2e/regex-tester.spec.ts` failed before assertions with the host macOS Chromium `MachPortRendezvousServer` permission error.
  - 2026-06-26 02:15 -0300: Elevated `PORT=3181 PLAYWRIGHT_WEB_SERVER_COMMAND="./node_modules/.bin/next dev --hostname localhost --port 3181" ./node_modules/.bin/playwright test tests/e2e/regex-tester.spec.ts` passed: 8 Chromium tests.
  - 2026-06-26 02:17 -0300: Started direct dev server with `AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3182 NEXTAUTH_URL=http://localhost:3182 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true ./node_modules/.bin/next dev --hostname localhost --port 3182` for independent browser validation, then stopped it after the run. `lsof -nP -iTCP:3182 -sTCP:LISTEN` returned no listener afterward.
  - 2026-06-26 02:18 -0300: Elevated one-off Playwright browser validation against `http://localhost:3182` passed 15 checks with `auth-console-noise=0` and no non-auth console/page errors.
  - Browser coverage passed for PT-BR route load/no redirect loop, matches, numbered groups, named groups, `d` indices in Chromium, invalid-pattern error with inputs preserved, safe live URL excluding `padrao`/`texto`/`conteudo`, default share URL excluding content, explicit include-content hash-only share, content-bearing load hydration plus address-bar sanitization, visible ReDoS warning, controlled worker timeout, stale-timeout recovery, EN and ES translated heading/status smoke routes, `/dev`, `/dev/categorias/expressoes-regulares`, `/sitemap.xml`, and mobile no horizontal overflow/unusable primary controls.
  - 2026-06-26 02:19 -0300: `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` passed.
  - 2026-06-26 02:19 -0300: `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3183 NEXTAUTH_URL=http://localhost:3183 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build` passed and listed `/[locale]/dev/regex-tester`; build emitted only the existing `metadataBase` warnings.
- PR-review findings addressed:
  - `blocking(redos)`: actual matching moved out of render/useMemo and into `components/tools/dev/regex-tester-worker.ts`; the client terminates slow worker runs after 900 ms and returns status `timeout`.
  - `test-gap(e2e)`: Playwright coverage now checks `d` flag indices in match/group UI and visible `possibleReDoS` warning behavior with a small safe sample.
  - `test-gap(worker)`: Playwright coverage now exercises a controlled worker timeout and verifies a newer safe match result remains visible after the timeout window.
- Tester findings:
  - Independent tester validation passed with no production-code changes and no e2e coverage changes needed.
  - No tester-blocking failures found. Remaining orchestration work is final backlog/plan verification and PR handling.
- Final status:
  - Verified after implementation, review fixes, repeat review gate, focused e2e coverage, independent browser validation, lint, typecheck, build, and whitespace checks passed. Backlog rank 11 is `Done`; draft PR URL is pending PR creation.
