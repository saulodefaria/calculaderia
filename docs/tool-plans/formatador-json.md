---
slug: "formatador-json"
familyId: "dev"
primaryCategoryId: "dados-estruturados"
backlogRank: 3
primaryKeyword: "formatador json"
decision: "new"
targetRoute: "/dev/formatador-json"
status: "verified"
createdAt: "2026-06-19"
updatedAt: "2026-06-19"
---

# Formatador de JSON Plan

## Backlog Row

- Rank: 3
- Original status: Backlog
- Slug: `formatador-json`
- Primary keyword: `formatador json`
- Cluster keywords: `json formatter`; `formatar json online`; `validar json`
- Family/category: backlog family `dev`; planned family `dev`; planned category `dados-estruturados`
- Opportunity score: 85
- Idea type: New
- Notes: Strong developer utility; add parse errors and copy/minify mode.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/dev/formatador-json`
- Rationale: No existing route, registry entry, helper module, UI component, translation namespace, or prior plan implements JSON formatting, JSON validation, or JSON minification. The backlog already has enough developer utilities to justify a first-class `dev` family, and this Rank 3 row is the highest-ranked eligible non-calculator row after Rank 1 `qr-code` and Rank 2 `contador-caracteres` were completed.

## Similarity Check

- Existing routes checked: `app/[locale]/ferramentas/page.tsx`, `app/[locale]/ferramentas/[familySlug]/page.tsx`, current family routes under `app/[locale]`, and current tool pages under `geradores`, `validadores`, `matematica`, `datas`, and `texto`. There is no `/dev` family route and no `/dev/formatador-json` tool route.
- Registry/categories checked: `lib/constants.ts` currently defines `ToolFamilyId` values `calculadoras`, `geradores`, `validadores`, `matematica`, `datas`, and `texto`. It has no `dev` family, no structured-data developer category, and no `formatador-json` tool entry.
- Related modules/translations checked: `lib/tools`, `components/tools`, `components/tools/url-state.ts`, `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. There is no JSON formatter helper or dev-specific client component. Existing `json` text is infrastructure such as JSON-LD, API responses, localization files, and the backlog, not a user-facing formatter.
- Prior plans checked: `docs/tool-plans/_template.md`, `docs/tool-plans/qr-code.md`, and `docs/tool-plans/contador-caracteres.md`. No duplicate JSON formatter plan exists.
- Text search checked: `formatador-json`, `json formatter`, `formatar json`, `validar json`, and broad `json` references across app, lib, components, messages, tool plans, and `docs/tool-backlog.md`.
- Overlap conclusion: Build a new tool. Treat Rank 44 `minificador-json` as an enhancement already covered by the first build's minify mode. Keep Rank 19 `conversor-csv-json`, Rank 45 `validador-xml`, and Rank 46 `validador-yaml` as separate future tools because they require different parsing and conversion contracts.

## User Intent And Scope

- Target user: Developers, QA analysts, support teams, students, data analysts, and technical content editors who need to inspect JSON quickly without uploading it to a remote service.
- User job: Paste JSON, immediately know whether it is valid, see a readable formatted version or compact minified version, locate parse errors, copy the result, and optionally share safe settings.
- In scope:
  - Browser-only strict JSON parse, validation, formatting, and minification.
  - Modes for `formatar`, `minificar`, and `validar`.
  - Indentation options: 2 spaces, 4 spaces, and tab.
  - Parse status with clear invalid JSON messaging and line/column diagnostics when the runtime exposes a parse position.
  - Output textarea or code block with copy result, copy error, clear input, swap result to input, and download `.json` actions.
  - Lightweight metrics such as input size, output size, line count, and minification savings.
  - Privacy-aware sharing that never writes pasted JSON into the live query string. Explicit content-bearing share links must put JSON in the URL fragment/hash only.
- Out of scope:
  - JSONC comments/trailing comma support, JSON5, schema validation, JSONPath queries, diffing, sorting keys, CSV conversion, YAML/XML conversion, API calls, file uploads, saved history, account save, and server-side formatting.
  - A separate `/dev/minificador-json` route in the first build.
- Sensitive-topic caveats:
  - Treat pasted JSON as potentially containing secrets, tokens, customer data, or credentials.
  - The tool should state that parsing happens in the browser, but shared links with included content are public to anyone who receives the URL.
  - Do not claim to detect leaked secrets, validate business meaning, or prove that an API payload is safe.

## Tool Contract

- Inputs:
  - `entrada`: raw JSON text from a textarea.
  - `modo`: `formatar`, `minificar`, or `validar`; default `formatar`.
  - `recuo`: `2`, `4`, or `tab`; default `2`.
  - `conteudo`: optional explicit URL fragment/hash flag (`1`) that allows `entrada` to be loaded from and included in generated share links.
- Defaults:
  - `entrada` empty.
  - `modo=formatar`.
  - `recuo=2`.
  - `conteudo` absent, so default live URLs and share URLs omit pasted JSON.
- Validation rules:
  - Empty input should show a neutral "paste JSON" state, not a red parse error.
  - Whitespace surrounding valid JSON is accepted according to `JSON.parse`.
  - JSON must be strict JSON. Comments, trailing commas, single-quoted strings, unquoted keys, `NaN`, `Infinity`, and JavaScript object literals are invalid.
  - Accept every valid JSON value supported by `JSON.parse`, including objects, arrays, strings, numbers, booleans, and `null`.
  - Enforce a practical client-side input guardrail such as 1,000,000 characters. Over-limit input should not parse automatically and should show a clear warning rather than freezing the page.
  - Invalid query params must fall back to defaults without crashing.
  - If content is included in a share URL, enforce a safe fragment length budget such as 1,800 characters. If the JSON is too large, omit `entrada` from the share URL and show a warning.
- Outputs:
  - Validity status: valid, invalid, or empty.
  - Formatted JSON when valid and `modo=formatar`.
  - Minified JSON when valid and `modo=minificar`.
  - Validation summary when valid and `modo=validar`.
  - Parse error title, localized explanation, optional engine detail, and line/column/snippet when available.
  - Input/output character counts, byte counts, line counts, and minification savings where relevant.
  - Copyable output and copyable error detail.
- Result explanations:
  - Explain that the formatter uses strict JSON rules, not JavaScript object syntax.
  - Explain that minification removes unnecessary whitespace but preserves data.
  - Explain that key order follows the parsed JSON/runtime serialization order; the first build should not sort keys.
  - Explain that error locations can vary by browser when the JavaScript engine does not expose a stable position.
- URL params:
  - Safe params synced automatically: `modo` and `recuo`.
  - Explicit content params: `conteudo=1` and `entrada` live only in the URL fragment/hash, for example `?modo=minificar&recuo=4#conteudo=1&entrada=...`.
  - Read `entrada` only from the fragment/hash when `conteudo=1`.
  - Generate `entrada` only inside the explicit share callback when the include-content control is enabled, and append it as a fragment/hash rather than as query params.
  - After loading a content-bearing fragment URL, prefill the textarea client-side and sanitize the live address bar back to safe query params after hydration.
- Share behavior:
  - Default `ShareButton` URL includes only safe settings (`modo`, `recuo`).
  - Provide an explicit "include JSON in shared link" checkbox or equivalent confirmation.
  - Enabling include-content must not mutate `window.location.search` or `window.location.hash`; it only changes the URL returned by the share action.
  - Show a warning that shared JSON links can expose secrets or private data.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store input/output JSON in localStorage, sessionStorage, analytics events, server logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/json.ts` with types for formatter state, output mode, indentation, parse results, metrics, safe query params, and hash-fragment share building.
  - Parse with the runtime's strict `JSON.parse(input)`.
  - For `formatar`, serialize with `JSON.stringify(parsedValue, null, indent)` where indent is `2`, `4`, or `"\t"`.
  - For `minificar`, serialize with `JSON.stringify(parsedValue)`.
  - For `validar`, parse once and return a success summary without changing the input unless the user chooses to copy formatted/minified output.
  - Preserve semantic JSON values. Do not coerce dates, numbers, booleans, `null`, arrays, or objects into custom app types.
  - Compute deterministic metrics from strings with `TextEncoder` for UTF-8 bytes and normalized `\n` line counts.
  - On `SyntaxError`, return a stable structured error object with `code: "invalidJson"`, a localized generic message, and optional parse position metadata. Do not rely on raw browser error text as the primary user-facing message.
- Parse error handling:
  - Catch parse exceptions and keep the original input unchanged.
  - Attempt to extract a character offset from common engine messages such as `position N`; when found, compute line and column by scanning the original input up to that offset.
  - If an engine reports line/column directly, normalize it into the same structured shape.
  - If no position is available, show the generic invalid JSON message plus the raw engine message as secondary diagnostic text.
  - Highlight a small snippet around the computed line/column when available, but never crash if the input contains unusual Unicode or very long lines.
- Data tables or assumptions:
  - No external data tables are required.
  - JSON parsing behavior comes from the JavaScript runtime. The app should document strict JSON behavior rather than support relaxed formats.
  - The first build should avoid key sorting to prevent surprising reordering beyond standard `JSON.stringify` serialization.
- Official or authoritative sources:
  - Codebase source checked on 2026-06-19: current tool layout, registry, URL helper, routes, translations, and prior plans.
  - Standard JavaScript APIs used by implementation: `JSON.parse`, `JSON.stringify`, `SyntaxError`, `TextEncoder`, `URLSearchParams`, and Clipboard API.
  - No government, legal, financial, public-rate, or table source is required.
- Source access dates: Codebase checked on 2026-06-19.
- Rule/table effective dates: Not applicable.
- Freshness or maintenance risk:
  - Low for valid JSON parse/format/minify behavior because it uses standard runtime APIs.
  - Moderate for exact parse error messages because browsers differ. Keep stable app-owned error codes and best-effort location extraction.
  - Moderate performance risk for very large pasted JSON; keep a client-side size guard and avoid repeated parsing on every keystroke without debouncing or memoization.
- Estimator or privacy limitations:
  - The tool validates JSON syntax only. It does not validate schemas, API contracts, secrets, permissions, or business rules.
  - Browser-only processing reduces exposure, but shared links, clipboard contents, screenshots, and downloaded files can still reveal data.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Formatador de JSON`
  - PT-BR meta title: `Formatador JSON online gratis`
  - PT-BR description: `Formate, valide e minifique JSON no navegador, com erros de parse claros e sem enviar o conteudo para o servidor.`
- Main form sections:
  - Input textarea for JSON with clear, paste-friendly layout and a browser-only privacy note.
  - Mode segmented control or tabs for format, minify, and validate.
  - Indentation segmented control for 2 spaces, 4 spaces, and tab. Disable or visually de-emphasize indentation when mode is minify/validate if needed.
  - Share/privacy section with default safe link and explicit include-content option.
- Results sections:
  - Status block for valid/invalid/empty state.
  - Output panel with formatted or minified JSON in a monospaced textarea/code area.
  - Error panel with line/column/snippet when available.
  - Metrics panel for input size, output size, lines, and minification savings.
  - Actions: copy output, copy error, download JSON, clear input, and use output as input.
- SEO sections:
  - What a JSON formatter does.
  - Difference between formatting, validation, and minification.
  - Common JSON errors: trailing commas, comments, single quotes, unquoted keys, and incomplete strings/brackets.
  - Privacy note for pasted API payloads, tokens, and personal data.
- FAQ topics:
  - `O JSON e enviado para o servidor?`
  - `Por que meu JSON com comentario ou virgula final e invalido?`
  - `Qual e a diferenca entre formatar e minificar JSON?`
  - `A ferramenta valida schema JSON?`
  - `Posso compartilhar um JSON ja preenchido?`
- Disclaimer or privacy copy:
  - The tool parses JSON in the browser and does not intentionally send input to the server.
  - Do not include tokens, credentials, or private data in a shared URL unless every recipient may read it.
  - Validation is syntactic only and does not prove that an API accepts the payload.
- Related tool links:
  - Existing: `/ferramentas`, `/texto/contador-caracteres`, `/geradores/qr-code`.
  - Future backlog candidates: `/dev/conversor-base64`, `/dev/url-encode-decode`, `/dev/regex-tester`, `/dev/conversor-csv-json`, `/dev/jwt-decoder`, `/dev/validador-yaml`, and `/dev/validador-xml`.
  - Treat `/dev/minificador-json` as merged into this page unless later search evidence justifies a separate route.
- Translation guidance:
  - Add `toolFamilies.dev` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Add `toolCategories.dados-estruturados` keys in all locales.
  - Add `tools.formatador-json` keys for title, description, metadata, form labels, modes, indentation options, result labels, metrics, actions, parse errors, privacy/share warnings, SEO text, and FAQ content.
  - Suggested family names: PT-BR `Dev`; EN `Developer`; ES `Desarrollo`.
  - Suggested category names: PT-BR `Dados estruturados`; EN `Structured Data`; ES `Datos estructurados`.
  - Suggested tool names: PT-BR `Formatador de JSON`; EN `JSON Formatter`; ES `Formateador de JSON`.
  - Keep the route slug `/dev/formatador-json` stable across locales unless the project later introduces localized routes.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/json.ts` with `formatJson`, `minifyJson`, `validateJson`, parse result types, error normalization helpers, metric helpers, state defaults, safe URL/search param helpers, and content fragment/hash helpers.
  - Add `lib/tools/json.test.ts` with focused deterministic coverage for formatting, minification, validation, errors, metrics, safe query params, and fragment/hash share params.
- URL state:
  - Use safe initial search params, `replaceQueryString`, and JSON-specific share URL helpers that append content only in the fragment/hash.
  - Sync only `modo` and `recuo` by default.
  - Read and generate `entrada` only behind `conteudo=1` in the fragment/hash.
  - Add a share URL size guard and visible warning when pasted JSON is too large for content sharing.
- UI components:
  - Create `components/tools/dev/json-formatter-client.tsx` or an equivalent dev-family folder.
  - Use existing UI primitives and lucide icons for copy, clear, download, alert, and success actions.
  - Use stable dimensions for the editor/output panels and metrics so long JSON strings do not cause horizontal overflow.
  - Add accessible labels and stable test ids for input, mode controls, indent controls, output, error panel, copy buttons, download, include-content control, and share button.
- Route and metadata:
  - Add `app/[locale]/dev/page.tsx` using `ToolFamilyDirectoryPage` and `generateToolFamilyMetadata(locale, "dev")`.
  - Add `app/[locale]/dev/formatador-json/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "formatador-json")`.
- Registry/family/category:
  - Add `dev` to `ToolFamilyId`, `toolFamilies`, visible family translations, sitemap, and directory support through existing registry helpers.
  - Add a developer/code lucide icon import such as `Code2`, and a JSON/structured-data icon such as `Braces` after verifying availability in the installed lucide version.
  - Add `dados-estruturados` to `ToolCategoryId` under family `dev`, with href `/dev/categorias/dados-estruturados`.
  - Add `formatador-json` to `tools` with `available: true`, `familyId: "dev"`, `primaryCategoryId: "dados-estruturados"`, `categoryIds: ["dados-estruturados"]`, `sitemapPriority` around `0.8`, `stateMode: "query"`, and `seoApplicationCategory: "DeveloperApplication"`.
  - Consider `popularRank: 3` because this is the Rank 3 backlog tool, then adjust existing lower popular ranks to keep ordering unique if product ranking should follow backlog order.
- Messages:
  - Add PT-BR, EN, and ES translations for family, category, tool metadata, form, modes, indentation, results, metrics, parse errors, copy/download/share actions, privacy warnings, SEO article text, and FAQ content.
- Unit tests:
  - Cover valid object, array, top-level string, number, boolean, and `null`.
  - Cover 2-space, 4-space, tab, and minified output.
  - Cover Portuguese accents, emoji, escaped quotes, escaped newlines, and Unicode strings without data loss.
  - Cover invalid trailing comma, comment, single quote, unquoted key, incomplete object/array, and empty input.
  - Cover parse-position normalization from at least V8-style `position N` errors and direct line/column inputs.
  - Cover metrics, input guardrail behavior, safe query params, and content fragment/hash share params.
- E2E hooks/tests:
  - Add stable test ids for the main JSON input, mode selector, indent selector, result output, error message, metrics, clear, copy result, download, include-content toggle, and share controls.
  - Add focused Playwright coverage in a new `tests/e2e/json-formatter.spec.ts` or extend the tool hub spec if that remains the repo convention.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark Rank 3 `formatador-json` as `In Progress` only when implementation starts and `Done` only after validation passes.
  - Do not mark Rank 44 `minificador-json` directly in this planner pass; a later backlog cleanup can reference it as covered by the minify mode after implementation is verified.

## Test Plan

- Unit scenarios:
  - Empty input returns a neutral empty state and no output.
  - `{"nome":"Ana","ativo":true}` formats with 2 spaces and 4 spaces deterministically.
  - Arrays and nested objects format with selected indentation.
  - Top-level primitives (`"texto"`, `123`, `true`, `false`, `null`) validate and serialize deterministically.
  - Minify mode removes formatting whitespace while preserving string contents.
  - Escaped newline and quote characters remain escaped correctly.
  - Invalid JSON returns `invalidJson` without throwing and preserves input.
  - Error-position helpers compute line/column/snippet from a character offset.
  - Over-limit input reports a deterministic size warning before parse.
  - Search param helpers always omit `entrada`; fragment/hash helpers include it only when include-content is requested and omit it again when the fragment would be too long.
- URL-state scenarios:
  - `?modo=minificar&recuo=4` initializes safe settings and preserves only those settings in the live URL.
  - Invalid `modo` or `recuo` falls back to defaults.
  - Typing or pasting JSON does not add content to `window.location.search`.
  - Enabling include-content does not change the live URL.
  - Clicking share with include-content off copies a safe settings-only URL.
  - Clicking share with include-content on copies a URL with safe query params plus `#conteudo=1&entrada=...` when under the fragment limit.
  - Loading `?modo=minificar&recuo=4#conteudo=1&entrada=...` prefills the editor client-side and then clears the hash from the live URL after hydration while preserving safe query params.
- Browser scenarios:
  - `/dev/formatador-json` renders the correct title, breadcrumb, input textarea, mode controls, result area, privacy copy, and FAQ.
  - Pasting valid multiline JSON updates the valid status and formatted output.
  - Switching to minify updates output and savings metrics.
  - Pasting invalid JSON shows a clear localized error and does not clear the input.
  - Copy output, copy error, clear, download, and use-output-as-input controls work when enabled.
  - `/dev` lists `Formatador de JSON` once the family route exists.
  - Mobile viewport has no horizontal overflow; long unbroken JSON strings wrap or scroll inside the intended editor/output containers only.
  - Browser console has no hydration errors or uncaught exceptions.
- Playwright scenarios:
  - Navigate to `/dev/formatador-json` and assert heading `Formatador de JSON`.
  - Fill valid JSON and assert formatted output includes line breaks and indentation.
  - Switch to minify and assert output becomes compact.
  - Fill invalid JSON with a trailing comma and assert an invalid JSON message is visible.
  - Assert the current URL never contains pasted JSON by default.
  - Enable include-content, click share, and assert clipboard URL contains `conteudo=1` and encoded `entrada` in the hash fragment, not in query params.
  - Visit a shared content URL, assert the textarea is prefilled, then assert the live URL is sanitized after hydration.
  - Visit `/dev` and assert the family directory lists the JSON formatter.
  - Assert `/sitemap.xml` includes `/dev` and `/dev/formatador-json` for supported locales.
- Lint/build commands:
  - Run the repo unit test command for `lib/tools/json.test.ts`.
  - Run the relevant focused Playwright e2e command.
  - Run the repo lint command.
  - Run the repo build command, including required local env placeholders if the existing build needs them.
- Acceptance criteria:
  - New dev family, structured-data category, route, and tool page are discoverable through the tools hub and sitemap.
  - Valid JSON formats, minifies, and validates deterministically in the browser.
  - Invalid JSON shows useful parse feedback without crashing or losing input.
  - Pasted JSON remains client-side and out of live URLs by default.
  - Explicit content-sharing behavior is clear, guarded by length limits, and tested.
  - PT-BR, EN, and ES translations are complete.
  - Unit, URL-state, e2e, browser, lint, and build validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-19: Planner selected `new` and wrote this buildable plan for `/dev/formatador-json`.
  - 2026-06-19: Creator implemented the route, UI, registry, translations, unit coverage, and focused Playwright coverage. Plan and backlog remain `In Progress` pending review and tester validation.
  - 2026-06-19: Review-fix pass addressed accepted privacy and test-gap findings. Plan and backlog remain `In Progress` pending final tester/PR validation.
  - 2026-06-19: Focused GA privacy review-fix disabled GA4 automatic initial pageviews and made manual App Router pageviews hash-free. Plan and backlog remain `In Progress` pending final tester/PR validation.
  - 2026-06-19: Tester validation passed for `/dev/formatador-json`. Plan is now verified; backlog remains for orchestrator/PR handoff.
  - 2026-06-19: Orchestrator marked the backlog row `Done` after tester validation passed and opened draft PR https://github.com/saulodefaria/calculaderia/pull/14.
- Files changed:
  - `docs/tool-plans/formatador-json.md`
  - `docs/tool-backlog.md`
  - `lib/tools/json.ts`
  - `lib/tools/json.test.ts`
  - `lib/analytics/ga4.ts`
  - `lib/analytics/ga4.test.ts`
  - `components/tools/dev/json-formatter-client.tsx`
  - `components/analytics/google-analytics.tsx`
  - `components/analytics/google-analytics-pageview.tsx`
  - `app/[locale]/dev/page.tsx`
  - `app/[locale]/dev/formatador-json/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/json-formatter.spec.ts`
- Implementation summary:
  - Added the `dev` family, `dados-estruturados` category, `/dev` family route, and `/dev/formatador-json` tool route.
  - Added strict browser-side JSON parsing, formatting, minification, validation, metrics, parse-error normalization, URL state reading, and safe/content share URL helpers.
  - Added a client UI with mode tabs, indentation controls, output/error panels, metrics, copy/download/clear/use-output actions, explicit include-content sharing, FAQ, and stable Playwright hooks.
  - Live URL state only syncs safe `modo` and `recuo`. `entrada` is read only from the hash fragment when `conteudo=1`, generated only in the explicit share callback hash, omitted when the fragment exceeds the length budget, and sanitized from the live address after hydration.
  - Review-fix update moved explicit content sharing from query params to `#conteudo=1&entrada=...`, added fragment helper coverage, added a token fallback for parse locations when Chromium omits numeric offsets, and expanded Playwright coverage for visible snippets, oversized share omission, and exact PT-BR/EN/ES sitemap entries.
  - Focused GA privacy fix changed the GA init snippet to `send_page_view: false`, removed the first-render skip in the manual pageview component, and made the GA helper derive both `page_path` and `page_location` from the hash-free `pathname + search` URL.
- Validation results:
  - Creator reported locale JSON parse check passed.
  - Creator reported `pnpm test -- lib/tools/json.test.ts` passed; Vitest reported 30 files and 343 tests because the existing script still ran the broader non-e2e suite with the file argument.
  - Creator reported `pnpm lint` passed.
  - Creator reported `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build` passed with existing `metadataBase` warnings.
  - Creator reported `pnpm run test:e2e -- tests/e2e/json-formatter.spec.ts` passed 5 tests in the normal sandbox.
  - Orchestrator reran `pnpm test -- lib/tools/json.test.ts`, `pnpm lint`, and `git diff --check`; all passed.
  - Review-fix reran `pnpm test -- lib/tools/json.test.ts`; passed 30 files and 344 tests.
  - Review-fix reran `pnpm lint`; passed.
  - Review-fix reran `pnpm run test:e2e -- tests/e2e/json-formatter.spec.ts`; passed 6 tests after adding the new focused assertions.
  - Review-fix reran `git diff --check`; passed.
  - Focused GA privacy fix reran `pnpm test -- lib/analytics/ga4.test.ts`; passed 31 files and 345 tests because the existing script still ran the broader non-e2e suite with the file argument.
  - Focused GA privacy fix reran `pnpm test -- lib/tools/json.test.ts`; passed 31 files and 345 tests.
  - Focused GA privacy fix reran `pnpm lint`; passed.
  - Focused GA privacy fix reran `pnpm run test:e2e -- tests/e2e/json-formatter.spec.ts`; passed 6 tests.
  - Focused GA privacy fix reran `git diff --check`; passed.
  - Tester reran `pnpm run test:e2e -- tests/e2e/json-formatter.spec.ts`; passed 6 tests in Chromium.
  - Tester ran a live browser validation against `env AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3117 NEXTAUTH_URL=http://localhost:3117 NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3117`; the browser script covered route load/no redirect loop, valid JSON formatting, 4-space indent switching, minify mode, validate mode, copy result, use-output, download, default safe share, explicit hash content share, shared-content hydration sanitization, invalid JSON line/column/snippet diagnostics, copy error, oversized content-share warning/omission, `/dev` directory listing, localized `/dev/formatador-json` sitemap entries, mobile no-horizontal-overflow, and console/page-error guards. Result: passed with no browser issues.
  - No screenshots were captured because the browser checks were deterministic and did not reveal a visual defect.
- PR-review findings addressed:
  - Blocking/security privacy leak: fixed by keeping safe `modo`/`recuo` in query params, moving explicit JSON content to the hash fragment, reading it client-side after hydration, and clearing the hash while preserving safe query params. Default/live URLs and default share URLs do not include pasted JSON in query params.
  - Material test gap: added focused unit coverage for fragment helpers and focused Playwright coverage for visible parse location/snippet, oversized content-share warning/omission, and exact locale sitemap entries for `/dev/formatador-json`.
  - Blocking/security GA privacy leak: fixed by disabling GA4's default initial `gtag('config')` pageview and sending the first pageview through the manual App Router effect using only `pathname + search`. The GA helper now also builds `page_location` from that hash-free URL instead of `window.location.href`.
- Tester findings:
  - Pass. Existing `tests/e2e/json-formatter.spec.ts` already covers the requested regression cases; no e2e changes were needed in the tester pass.
  - Note: direct MCP/Node REPL Chromium launch hit the known macOS sandbox `MachPortRendezvousServer` permission error, so the manual browser script was rerun through the repo shell with escalation. A first manual dev-server attempt without auth placeholder env produced expected Auth.js session console errors; the final validated run used the same auth placeholder env as Playwright config and had no console or page errors.
- Final status:
  - `verified`; backlog row is `Done` with draft PR https://github.com/saulodefaria/calculaderia/pull/14, route, and validation summary.
