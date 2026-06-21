---
slug: "sorteador-nomes"
familyId: "geradores"
primaryCategoryId: "aleatorios"
backlogRank: 5
primaryKeyword: "sorteador de nomes"
decision: "new"
targetRoute: "/geradores/sorteador-nomes"
status: "verified"
createdAt: "2026-06-20"
updatedAt: "2026-06-20"
---

# Sorteador de Nomes Plan

## Backlog Row

- Rank: 5
- Original status: Backlog
- Slug: `sorteador-nomes`
- Primary keyword: `sorteador de nomes`
- Cluster keywords: `sorteio de nomes`; `sortear nomes online`; `sorteador lista`
- Family/category: backlog family `geradores`; planned family `geradores`; planned category `aleatorios`
- Opportunity score: 83
- Idea type: New
- Notes: Good general tool; can share list parsing with random tools.
- Done ref: Draft PR https://github.com/saulodefaria/calculaderia/pull/17; route `/geradores/sorteador-nomes`; review gate and browser/e2e validation passed 2026-06-20.

## Decision

- Decision: `new`
- Target route: `/geradores/sorteador-nomes`
- Rationale: The backlog row is a new non-calculator generator. The app already has the `geradores` family and the `aleatorios` category, and the existing random-number page does not cover drawing names from a pasted list. A dedicated route matches the primary keyword and can reuse generator randomization patterns without merging this into `/geradores/numeros-aleatorios`.

## Similarity Check

- Existing routes checked: `app/[locale]/geradores/page.tsx`, `app/[locale]/geradores/senha/page.tsx`, `app/[locale]/geradores/qr-code/page.tsx`, `app/[locale]/geradores/numeros-aleatorios/page.tsx`, current family/category directory routes, and current top-level tool families under `app/[locale]`. No `/geradores/sorteador-nomes` route exists.
- Registry/categories checked: `lib/constants.ts` defines `ToolFamilyId: "geradores"` and generator categories `seguranca`, `aleatorios`, and `codigos-links`. Existing generator tool entries are `senha`, `qr-code`, and `numeros-aleatorios`; no name draw entry exists.
- Related modules/translations checked: `lib/tools/generators.ts`, `lib/tools/generators.test.ts`, `components/tools/generators/*`, `components/tools/url-state.ts`, `lib/tools/text.ts`, `lib/tools/json.ts`, `messages/pt-br.json`, `messages/en.json`, `messages/es.json`, and e2e specs under `tests/e2e`.
- Prior plans checked: `docs/tool-plans/qr-code.md`, `docs/tool-plans/contador-caracteres.md`, `docs/tool-plans/formatador-json.md`, `docs/tool-plans/_template.md`, and calculator plans under `docs/calculator-plans`. No duplicate `sorteador-nomes` plan exists.
- Text search checked: `sorteador-nomes`, `sorteador de nomes`, `sorteio`, `sortear`, `nomes`, `name picker`, `raffle`, `random name`, `aleatorio`, and `random`.
- Overlap conclusion: Build a new tool page. Keep Rank 31 `gerador-nomes` separate because it generates fictional names instead of drawing from a user list. Keep Rank 89 `sorteador-equipes` and Rank 90 `sorteador-amigo-secreto` separate because they need grouping/pairing flows and stronger privacy decisions. Treat Rank 88 `numero-aleatorio-lista` as an enhancement to the existing random-number page, not as overlap with this name picker.

## User Intent And Scope

- Target user: Teachers, facilitators, event organizers, teams, streamers, community managers, and small groups that need a quick browser-only way to draw one or more names from a list.
- User job: Paste a list of names, choose how many names to draw, run a fair casual draw, copy the result, and optionally share the same settings or list.
- In scope:
  - Textarea for names or entries, primarily one entry per line.
  - Optional separator mode for pasted lists: line breaks by default, with an automatic mode that also splits commas and semicolons.
  - Draw one or many winners.
  - Shuffle the entire list as an alternate mode.
  - Options for no-repeat draws, draws with replacement, and removing duplicate entries before drawing.
  - Entry counts, duplicate warnings, ignored-empty-line count, and clear validation messages.
  - Copy winners, copy the shuffled order, clear list, draw again, and share safe settings.
  - Client-side processing and randomization.
- Out of scope:
  - Certified/audited raffles, legal lottery compliance, public contest administration, ticket sales, payments, account history, email invitations, server-stored lists, recurring events, participant registration forms, weighted probabilities beyond intentional duplicate entries, team creation, and secret-santa pair assignment.
- Sensitive-topic caveats:
  - Names can be personal data. The tool should say that the list is processed in the browser and is not sent to the server by the tool.
  - Shared links that include names are public to anyone who receives the URL.
  - The draw is suitable for casual use, not official, legal, gambling, or prize-promotion compliance.

## Tool Contract

- Inputs:
  - `nomes`: free-form textarea with one name/entry per line by default.
  - `modo`: `vencedores` or `embaralhar`; default `vencedores`.
  - `quantidade`: integer number of winners; default `1`.
  - `separador`: `linhas` or `auto`; default `linhas`. `auto` splits line breaks, commas, and semicolons.
  - `semRepetir`: boolean; default `true`. When true, entries are sampled without replacement.
  - `removerDuplicados`: boolean; default `false`. When true, repeated entries are collapsed before drawing.
  - `conteudo`: optional explicit share flag used only for links that include `nomes`.
- Defaults:
  - `nomes` empty.
  - `modo=vencedores`.
  - `quantidade=1`.
  - `separador=linhas`.
  - `semRepetir=true`.
  - `removerDuplicados=false`.
  - `conteudo` absent, so live URLs and default share links omit the name list.
- Validation rules:
  - Trim leading/trailing whitespace from each entry for drawing, but preserve the first normalized display label.
  - Ignore empty entries and report how many were ignored when relevant.
  - Require at least two valid entries before enabling a meaningful draw. If only one entry exists, show a neutral validation message instead of producing a misleading "random" result.
  - Clamp `quantidade` to a practical range such as 1 to 500.
  - If `semRepetir=true`, cap the effective winner count at the number of available entries and show that the draw cannot produce more unique winners than entries.
  - If `semRepetir=false`, allow repeated winners up to the clamped `quantidade`.
  - Cap total parsed entries to a practical range such as 5,000 and cap total input length around 200,000 characters to keep the page responsive.
  - Cap individual entry display length around 120 characters and show validation for very long entries rather than breaking result cards.
  - Duplicate detection should compare normalized keys after trim, internal-whitespace collapse, and locale-aware lowercasing. Preserve the first typed label in results.
  - Invalid query or fragment params must fall back to defaults without crashing.
- Outputs:
  - Winner list in draw order when `modo=vencedores`.
  - Full shuffled list when `modo=embaralhar`.
  - Entry statistics: valid entries, unique entries, duplicates found, ignored empty entries, selected quantity, and draw mode.
  - Validation and privacy messages.
  - Copyable result summary.
  - No generated result should be written to the URL.
- Result explanations:
  - Explain that repeated names count as separate entries unless the remove-duplicates option is enabled.
  - Explain that no-repeat draws sample entries without replacement, while draws with replacement can choose the same entry more than once.
  - Explain that the generated order is random each time the user clicks "Sortear novamente" and is not reproducible from the shared URL.
- URL params:
  - Safe live query params: `modo`, `quantidade`, `separador`, `semRepetir`, and `removerDuplicados`.
  - Do not sync `nomes` or generated results into `window.location.search` during normal editing.
  - Content-bearing share links should put names behind an explicit opt-in, preferably in the URL fragment/hash as `#conteudo=1&nomes=...` so the list is not sent as a request query string.
  - On initial load, read `nomes` only when `conteudo=1` is present in the fragment/hash or an explicitly supported content share format.
  - After hydrating a content-bearing shared link, sanitize the live URL back to safe query params and clear the hash.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings.
  - Provide an explicit "incluir nomes no link compartilhado" control for list-bearing links.
  - Enabling include-content must not mutate the address bar; it only changes the URL returned by the share action.
  - Enforce a share URL length budget, such as 1,800 characters for content fragments. If the list is too long, omit `nomes` and show a warning.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store names, winners, or shuffled lists in localStorage, sessionStorage, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add pure helper types and functions for name drawing, either in `lib/tools/generators.ts` or a focused `lib/tools/name-draw.ts` if `generators.ts` becomes too broad.
  - Implement `parseNameEntries(input, options)` to normalize line endings, split by selected separator mode, trim entries, ignore empties, compute duplicate stats, and return stable entry objects.
  - Implement `drawNameEntries(entries, options, random)` for winner draws and `shuffleNameEntries(entries, random)` for shuffled order.
  - Use Fisher-Yates shuffle for no-repeat draws and full-list shuffle.
  - Use indexed sampling for with-replacement draws.
  - Accept an injected `random: () => number` in pure helpers so unit tests can be deterministic.
- Randomization assumptions:
  - In the client component, prefer `crypto.getRandomValues` when available, following the existing password generator pattern; fall back to `Math.random` only when the Web Crypto API is unavailable.
  - The random source is for casual fairness and convenience. It is not a certified audit trail, legal raffle system, cryptographic commitment scheme, or proof against manipulation.
  - Results are intentionally ephemeral. Regenerating should produce a fresh draw and should not be recoverable from the URL unless future work adds an explicit seed/audit mode.
  - Duplicate entries are transparent: by default, each duplicate line is another chance in the draw. The user can enable duplicate removal when they want each displayed name to count once.
- Data tables or assumptions:
  - No external data tables are required.
  - Names are user-provided strings; the tool should not infer identity, gender, validity, or real-person status.
  - Locale-sensitive lowercasing can use the current app locale for duplicate-key normalization, with deterministic fallbacks.
- Official or authoritative sources:
  - No government, legal, financial, public-rate, check-digit, or table source is required.
  - Codebase source checked on 2026-06-20: current generator routes, registry entries, URL helpers, generator helpers/tests, translations, and prior tool plans.
  - Standard browser APIs used by implementation: Web Crypto `crypto.getRandomValues`, `URLSearchParams`, Clipboard API, and History API.
- Source access dates: Codebase checked on 2026-06-20.
- Rule/table effective dates: Not applicable.
- Freshness or maintenance risk:
  - Low for list parsing and sampling behavior.
  - Low-to-moderate privacy risk if shared links include personal names; keep content sharing opt-in, visible, and length-limited.
  - Low-to-moderate trust risk because users may overinterpret casual random draws as certified raffles; keep disclaimer copy direct.
- Estimator or privacy limitations:
  - The tool does not prove fairness after the fact and does not produce a tamper-evident audit log.
  - Browser-only processing reduces server exposure but does not make names private if users copy results, take screenshots, or share content-bearing links.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Sorteador de Nomes`
  - PT-BR meta title: `Sorteador de nomes online grátis`
  - PT-BR description: `Cole uma lista de nomes e sorteie um ou mais vencedores no navegador, sem enviar a lista para o servidor.`
- Main form sections:
  - Name list input card with textarea, clear action, paste guidance, and browser-only privacy note.
  - Draw settings card with mode, quantity, separator mode, no-repeat toggle, and remove-duplicates toggle.
  - Privacy/share section with safe default share link and explicit include-list option.
  - Primary draw action with `Shuffle` or `RefreshCw` icon and copy result action with `Copy` icon.
- Results sections:
  - Winner list or shuffled-order list with stable cards/chips that do not resize the surrounding layout.
  - Summary stats for valid entries, unique entries, ignored blanks, duplicates, and selected quantity.
  - Duplicate warning when repeated entries are present and duplicate removal is off.
  - Empty/invalid state before enough entries are available.
- SEO sections:
  - What the name picker does.
  - How to paste a list and draw names online.
  - Difference between no-repeat, with-replacement, and duplicate removal.
  - Privacy note for lists with personal names.
  - Limitations for official raffles and prize promotions.
- FAQ topics:
  - `A lista de nomes é enviada para o servidor?`
  - `Nomes repetidos contam mais de uma vez?`
  - `Posso sortear mais de um vencedor?`
  - `O sorteio pode repetir nomes?`
  - `Posso compartilhar um sorteio com a lista preenchida?`
  - `Esse sorteador vale para sorteios oficiais?`
- Disclaimer or privacy copy:
  - The draw happens in the browser and the tool does not intentionally send the list to the server.
  - Do not include names in a shared link unless every recipient may see the list.
  - The result is for casual organization and does not replace legal, audited, or regulated raffle processes.
- Related tool links:
  - Existing: `/geradores/numeros-aleatorios`, `/geradores/qr-code`, `/geradores/senha`, and `/texto/contador-caracteres`.
  - Future backlog candidates: `/geradores/sorteador-equipes`, `/geradores/sorteador-amigo-secreto`, `/geradores/gerador-nomes`, `/texto/remover-duplicados`, and `/texto/ordenar-linhas`.
- Translation guidance:
  - Add `tools.sorteador-nomes` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested names: PT-BR `Sorteador de Nomes`; EN `Random Name Picker`; ES `Sorteador de Nombres` or `Selector aleatorio de nombres`.
  - Translate form labels, validation messages, duplicate warnings, randomization explanations, privacy/share warnings, result copy, SEO text, and FAQ content.
  - Existing `toolFamilies.geradores` and `toolCategories.aleatorios` keys already exist in all locales; update descriptions only if the product owner wants name drawing called out on directory pages.
  - Keep the route slug `/geradores/sorteador-nomes` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Add `NameDrawMode`, `NameSeparatorMode`, `NameDrawOptions`, entry/result/stat types, parsing helpers, duplicate-key helper, draw helper, shuffle helper, and URL/share helper functions.
  - Extend `lib/tools/generators.test.ts` or add a focused name-draw test file with deterministic random callbacks.
- URL state:
  - Use `components/tools/url-state.ts` for safe query read/write where possible.
  - Add generator-specific helpers for content-bearing fragment/hash share links if reusing the JSON formatter privacy pattern.
  - Sync only safe settings in the live query string.
  - Never put `nomes` or generated winners in the live URL by default.
- UI components:
  - Create `components/tools/generators/name-drawer-client.tsx`.
  - Use existing UI primitives, `ShareButton`, lucide icons, accessible labels, stable test ids, and responsive result layouts.
  - Keep the textarea, controls, and result cards usable on mobile without horizontal overflow.
- Route and metadata:
  - Add `app/[locale]/geradores/sorteador-nomes/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "sorteador-nomes")`.
- Registry/family/category:
  - Add a `tools` entry for `sorteador-nomes` with `available: true`, `familyId: "geradores"`, `primaryCategoryId: "aleatorios"`, `categoryIds: ["aleatorios"]`, an appropriate icon such as `Users` or `Shuffle`, `sitemapPriority` around `0.74`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
  - No new `ToolFamilyId` or `ToolCategoryId` is needed.
- Messages:
  - Add PT-BR, EN, and ES translations for tool metadata, form controls, validation, result summaries, actions, privacy/share states, SEO article text, and FAQ content.
- Unit tests:
  - Cover parsing, separator modes, duplicate detection/removal, no-repeat draw, with-replacement draw, shuffle mode, clamping, limits, safe params, content fragment params, and deterministic random callbacks.
- E2E hooks/tests:
  - Add stable selectors or accessible labels for textarea, draw button, mode control, quantity input, separator control, no-repeat toggle, remove-duplicates toggle, result list, copy result, include-content control, and share button.
  - Add a focused `tests/e2e/name-drawer.spec.ts` and update `tests/e2e/tools-hub.spec.ts` if the hub verifies listed tools.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark the row `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Empty input and one-entry input return neutral validation states and no draw result.
  - Line-separated names parse correctly with CRLF, LF, blank lines, and leading/trailing whitespace.
  - `auto` separator splits commas and semicolons while preserving line-separated behavior.
  - Duplicate stats are reported; duplicate removal preserves the first display label.
  - Duplicate entries count as separate chances when duplicate removal is off.
  - No-repeat draw returns unique sampled entries and caps quantity at available entries.
  - With-replacement draw can return the same entry more than once under deterministic random input.
  - Shuffle mode returns all entries in deterministic shuffled order.
  - Quantity, input length, entry count, and entry length limits are enforced without throwing.
  - Safe query params omit `nomes`; explicit share fragment includes `conteudo=1&nomes=...` only when opted in and under budget.
- URL-state scenarios:
  - `?modo=vencedores&quantidade=3&semRepetir=1&removerDuplicados=0` initializes controls and keeps names empty.
  - Typing names does not add `nomes` to `window.location.search`.
  - Drawing winners does not add result data to `window.location.search` or `window.location.hash`.
  - Enabling include-content does not mutate the address bar.
  - Share URL without include-content contains only safe settings.
  - Share URL with include-content stores the list in the fragment/hash and shows a public-link warning.
  - Loading a content-bearing shared link prefills names and sanitizes the live URL afterward.
  - Oversized content-bearing share omits `nomes` and shows a warning.
- Browser scenarios:
  - Visit `/geradores/sorteador-nomes` in PT-BR and confirm title, description, textarea, controls, draw button, and SEO sections render.
  - Paste a short list, draw one winner, draw again, and verify the result updates without console errors.
  - Draw multiple winners without repeat and confirm the visible count matches the requested/capped count.
  - Toggle duplicate removal and verify stats/results update.
  - Use shuffle mode and copy the shuffled list.
  - Test safe share and include-content share flows.
  - Check mobile width for textarea, controls, result chips/cards, and buttons with long names.
- Playwright scenarios:
  - Add `tests/e2e/name-drawer.spec.ts` for basic draw, duplicate handling, safe URL behavior, include-content share behavior, content-bearing link hydration/sanitization, copy action, and mobile smoke coverage.
  - Extend `tests/e2e/tools-hub.spec.ts` only if the hub test expects every available tool to appear.
- Lint/build commands:
  - Run focused unit tests for generator helpers.
  - Run focused Playwright spec for the name drawer.
  - Run the project lint/typecheck/build commands used by the repo before opening the implementation PR.

## Creator Implementation Notes

- Status: implementation complete; tester sign-off passed on 2026-06-20 and frontmatter is now `status: "verified"`.
- Backlog: rank 5 in `docs/tool-backlog.md` is `Done` after tester validation passed. Draft PR https://github.com/saulodefaria/calculaderia/pull/17 is recorded in Done Ref.
- Files changed:
  - `lib/tools/generators.ts`: added name parsing, duplicate stats, no-repeat and replacement draw helpers, shuffle helper, validation codes, safe query params, and hash-only explicit content share helpers.
  - `lib/tools/generators.test.ts`: added deterministic unit coverage for parsing, separators, duplicates, no-repeat draws, replacement draws, shuffle, limits, validation codes, safe params, content fragments, and oversized content omission.
  - `components/tools/generators/name-drawer-client.tsx`: added the browser-only name drawer UI with textarea, settings, privacy/share controls, stats, result copy, validation, SEO details, and FAQ.
  - `app/[locale]/geradores/sorteador-nomes/page.tsx`: added the route using `ToolPageLayout` and localized metadata.
  - `lib/constants.ts`: registered `sorteador-nomes` under `geradores` / `aleatorios` with `Users`, `stateMode: "query"`, and `UtilityApplication`.
  - `messages/pt-br.json`, `messages/en.json`, `messages/es.json`: added tool metadata, form, validation, share/privacy, result, SEO, and FAQ translations.
  - `tests/e2e/name-drawer.spec.ts`: added focused browser coverage for draw flow, duplicate handling, shuffle mode, with-replacement draws, safe URL behavior, explicit content share, hydration sanitization, oversized share warning, copy action, and mobile overflow.
- PR review fixes:
  - Addressed `test-gap(browser): Shuffle and replacement modes are not exercised through the UI` by adding Playwright coverage for shuffle copy, disabling no-repeat for with-replacement draws, and asserting live URLs still omit names/results.
- Validation:
  - PASS: `pnpm test -- lib/tools/generators.test.ts` (Vitest reported 31 files / 357 tests passed).
  - PASS: `pnpm lint`.
  - BLOCKED then PASS: plain `pnpm build` failed before Next build because Prisma requires `DATABASE_URL`; `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=build-secret' pnpm build` passed and listed `/[locale]/geradores/sorteador-nomes`.
  - BLOCKED then PASS: sandboxed `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=e2e-secret' pnpm test:e2e -- tests/e2e/name-drawer.spec.ts` failed to launch Chromium with `bootstrap_check_in ... Permission denied (1100)`; fresh-port escalated rerun passed 6/6 tests.
- Tester focus:
  - Recheck the privacy contract in a real browser: typing and drawing must never add `nomes`, winners, or hash content to the live address bar.
  - Exercise explicit include-names sharing with short and long lists, confirming names only appear in `#conteudo=1&nomes=...` and oversized names are omitted.
  - Spot-check mobile layout with long names and both modes (`vencedores`, `embaralhar`).
  - Confirm no favorites/save affordance appears and no persistence is introduced.
- Acceptance criteria:
  - The route exists at `/geradores/sorteador-nomes`.
  - The tool appears in the generator family and random category listings.
  - Lists are processed client-side and names are omitted from live URLs by default.
  - Casual draw behavior is clear, repeat/duplicate options are transparent, and official-raffle limitations are visible.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, and build validation pass or have documented blockers.

## Tester Validation Notes

- Tester update on 2026-06-20 14:46 -03: validated `/geradores/sorteador-nomes` after the second review gate passed with no blocking/issue/security/material test-gap findings.
- Browser/e2e coverage: focused Playwright coverage verifies route load without redirect loops, title/breadcrumb rendering, form completion, winner draw, duplicate stats and duplicate removal, shuffle mode, with-replacement mode, result copy, safe default share URL, explicit hash content share, content-fragment hydration and live-URL sanitization, oversized content-share omission, mobile no-horizontal-overflow, and no unexpected console/page errors.
- Privacy/persistence checks: default live URLs and default shared URLs keep names and generated results out of `window.location.search` and `window.location.hash`; explicit include-content sharing writes names only to `#conteudo=1&nomes=...`; hydrated content-bearing links clear the hash afterward. Implementation scan found no tool-specific favorites/save affordance and no `localStorage`, `sessionStorage`, or analytics persistence for names/results.
- Sandbox note: `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=e2e-secret' 'PORT=3117' pnpm test:e2e -- tests/e2e/name-drawer.spec.ts` failed before assertions because Chromium could not register `MachPortRendezvousServer` (`Permission denied (1100)`), matching the known macOS sandbox limitation.
- Tester investigation note: the first elevated fresh-port run reached the browser and passed 5/6 tests, with one transient strict-locator failure in the explicit content-fragment hydration test caused by two `name-drawer-input` nodes during that run. The hydration scenario then passed in isolation with `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=e2e-secret' 'PORT=3121' pnpm exec playwright test --grep 'prefills names from an explicit content fragment' tests/e2e/name-drawer.spec.ts`, and the full focused spec passed with `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=e2e-secret' 'PORT=3122' pnpm exec playwright test tests/e2e/name-drawer.spec.ts`.
- PASS: final exact focused command `env 'DATABASE_URL=postgresql://postgres:postgres@localhost:5433/calculaderia?schema=public' 'AUTH_SECRET=e2e-secret' 'PORT=3123' pnpm test:e2e -- tests/e2e/name-drawer.spec.ts` passed 6/6 tests in Chromium.
- Tester result: PASS. No production-code fix handoff required and no tester-side e2e adjustment was needed.
- Final status: verified and draft PR https://github.com/saulodefaria/calculaderia/pull/17 is open.
