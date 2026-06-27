---
slug: "unix-timestamp"
familyId: "datas"
primaryCategoryId: "datas-periodos"
backlogRank: 8
primaryKeyword: "conversor timestamp"
decision: "new"
targetRoute: "/datas/unix-timestamp"
status: "verified"
createdAt: "2026-06-25"
updatedAt: "2026-06-25"
---

# Conversor Timestamp Unix Plan

## Backlog Row

- Rank: 8
- Original status: Backlog
- Slug: `unix-timestamp`
- Primary keyword: `conversor timestamp`
- Cluster keywords: `timestamp unix`; `unix time converter`; `converter data timestamp`
- Family/category: backlog family `datas`; planned family `datas`; planned category `datas-periodos`
- Opportunity score: 80
- Idea type: New
- Notes: Fits existing date family; useful for developers.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/datas/unix-timestamp`
- Rationale: Build a new non-calculator date/time utility. The repo already has the `datas` family, the `datas-periodos` category, and `/datas/contador-de-dias`; none of the existing routes, logic modules, translations, or plans convert Unix timestamps to readable dates or dates back to timestamps. The backlog family hint is correct because the user intent is date/time conversion, even though the tool also serves developers.

## Similarity Check

- Existing routes checked:
  - Current date routes: `app/[locale]/datas/page.tsx` and `app/[locale]/datas/contador-de-dias/page.tsx`.
  - Current developer routes: `app/[locale]/dev/page.tsx`, `app/[locale]/dev/formatador-json/page.tsx`, and `app/[locale]/dev/conversor-base64/page.tsx`.
  - Current text/generator/validator/math routes under `app/[locale]`.
  - No `/datas/unix-timestamp` or `/dev/unix-timestamp` route exists.
- Registry/categories checked:
  - `lib/constants.ts` already defines `ToolFamilyId` value `datas`.
  - `lib/constants.ts` already defines category `datas-periodos` under `datas`.
  - `lib/constants.ts` has a `contador-de-dias` tool entry, but no timestamp converter entry.
  - No new family or category is needed for v1.
- Related modules/translations checked:
  - `lib/tools/dates.ts` contains `countDaysBetween` only.
  - `components/tools/dates/day-counter-client.tsx` is the closest date-tool UI and URL-state pattern.
  - `components/tools/url-state.ts` supports safe query-string state and share URLs.
  - `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` already contain `toolFamilies.datas`, `toolCategories.datas-periodos`, and `tools.contador-de-dias`, but no timestamp keys.
- Prior plans checked:
  - Existing non-calculator plans in `docs/tool-plans`: QR code, character counter, JSON formatter, Base64 converter, name drawer, case converter, and email validator.
  - No duplicate timestamp plan exists.
- Text search checked:
  - `unix-timestamp`, `conversor timestamp`, `timestamp`, `epoch`, `unix time`, `converter data timestamp`, `datas`, and `datas-periodos`.
- Overlap conclusion:
  - Build a new route at `/datas/unix-timestamp`.
  - Keep future Rank 76 `conversor-fuso-horario` separate; this v1 should show UTC and the browser's local timezone, but should not implement arbitrary timezone conversion.
  - Keep this outside `/dev` because the existing `datas` family is now established and timestamp conversion is a date/time job.

## User Intent And Scope

- Target user: Developers, QA analysts, support teams, data analysts, students, and anyone reading log, API, database, spreadsheet, or webhook timestamps.
- User job: Paste a Unix timestamp or choose a date/time and immediately see the equivalent timestamp, UTC date, local date, ISO string, and copyable values.
- In scope:
  - Convert Unix timestamp to date/time.
  - Convert date/time to Unix timestamp.
  - Support timestamp units `seconds` and `milliseconds`.
  - Accept fractional seconds with up to 3 decimal places so values like `1700000000.123` map exactly to milliseconds.
  - Show outputs in UTC and in the browser's local timezone.
  - Show and copy Unix seconds, Unix milliseconds, ISO UTC string, UTC formatted date/time, local formatted date/time, and detected local timezone label.
  - Provide a current timestamp panel or "usar agora" action based on `Date.now()`.
  - Use query-string state for all non-sensitive values and the normal share button.
- Out of scope:
  - Arbitrary IANA timezone conversion, timezone search, daylight-saving comparison between zones, or historical timezone database UI.
  - Leap-second tables, TAI/GPS time, NTP timestamps, Windows FILETIME, Excel serial dates, cron parsing, relative time scheduling, countdown timers, stopwatch behavior, or batch/file conversion.
  - Natural-language date parsing such as `next Friday`, `amanha`, or locale-dependent free text.
  - Server-side conversion APIs, saved history, favorites, account storage, or analytics events containing user-entered timestamp values.
- Sensitive-topic caveats:
  - Timestamps can come from logs or incidents. Treat values as user data: process in the browser, avoid storage, and do not send values to server actions or analytics.
  - Shared URLs expose the timestamp/date in the query string to anyone with the link.
  - Local-time results depend on the visitor's browser timezone; UTC output is the canonical, deterministic result.

## Tool Contract

- Inputs:
  - `modo`: conversion mode, `timestamp` or `data`.
  - `timestamp`: numeric string for the timestamp input.
  - `unidade`: timestamp unit, `s` for seconds or `ms` for milliseconds.
  - `data`: date input in `YYYY-MM-DD` for date-to-timestamp mode.
  - `hora`: time input in `HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`.
  - `zona`: interpretation for date/time input, `utc` or `local`.
- Defaults:
  - `modo=timestamp`.
  - `unidade=s`.
  - `timestamp` defaults to the current Unix seconds at page load, not a ticking query value.
  - `data` and `hora` default to the current local date/time rounded to the current second.
  - `zona=utc` for deterministic date-to-timestamp conversion; users can switch to `local` when their input is local wall time.
- Validation rules:
  - Empty timestamp input shows a neutral empty state, not a red error.
  - Timestamp input must match a numeric string with optional leading `-`; seconds may include a decimal part with 1 to 3 digits.
  - Reject `NaN`, `Infinity`, scientific notation, thousands separators, whitespace inside the number, currency symbols, and mixed text.
  - For `unidade=s`, convert integer or fractional seconds to integer milliseconds without floating-point drift. Fractional precision beyond milliseconds should be rejected with a clear message.
  - For `unidade=ms`, require an integer millisecond value.
  - After conversion to milliseconds, require the value to be within the ECMAScript Date time-value range: `-8640000000000000` to `8640000000000000`.
  - Date input must be a real Gregorian calendar date in `YYYY-MM-DD`; reject invalid dates like `2026-02-30`.
  - Time input must be valid 24-hour time; allow seconds and milliseconds, but normalize output to `HH:mm:ss.SSS`.
  - When `zona=utc`, construct the instant with `Date.UTC(year, monthIndex, day, hour, minute, second, millisecond)`.
  - When `zona=local`, construct the instant with the browser's local timezone using `new Date(year, monthIndex, day, hour, minute, second, millisecond)` and validate round-trip components to catch DST gaps or invalid local times.
  - Invalid or unknown URL params should fall back safely to defaults without throwing.
- Outputs:
  - Normalized Unix timestamp in seconds.
  - Normalized Unix timestamp in milliseconds.
  - ISO UTC string from `Date.prototype.toISOString()`.
  - UTC formatted date/time.
  - Local formatted date/time using the active app locale.
  - Browser timezone name or offset, when available from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Weekday/date summary for scanning.
  - Copyable summary containing the input, interpreted unit/timezone, Unix seconds, Unix milliseconds, UTC ISO, and local time.
- Result explanations:
  - Explain that Unix timestamp seconds count from `1970-01-01T00:00:00Z`.
  - Explain the difference between Unix seconds and JavaScript milliseconds.
  - Explain that UTC is stable across devices, while local display depends on the viewer's timezone.
  - Explain that leap seconds are not modeled by JavaScript `Date` or normal POSIX-style Unix time.
- URL params:
  - `modo=timestamp|data`
  - `ts=<numeric timestamp>`
  - `u=s|ms`
  - `data=YYYY-MM-DD`
  - `hora=HH:mm:ss.SSS`
  - `zona=utc|local`
  - Keep query params compact and omit defaults when practical.
  - Do not use hash-fragment content sharing; timestamps are small and can use normal query params.
- Share behavior:
  - Default `ShareButton` returns the current route plus normalized safe query params.
  - If `zona=local`, the share UI or result explanation should warn that another device may interpret the local date/time in a different local timezone; UTC mode is the deterministic choice.
  - Shared links should never contain hidden state beyond the visible input values and mode.
- Save/favorites behavior:
  - No favorites, account save, localStorage, sessionStorage, or conversion history in v1.
  - Do not send timestamp values to server components, server actions, analytics events, logs, or saved app state.

## Logic, Data, And Sources

- Logic summary:
  - Extend `lib/tools/dates.ts` with pure helpers such as `parseUnixTimestampInput`, `convertTimestampToDate`, `convertDateTimeToTimestamp`, `parseTimestampQuery`, and `formatTimestampSummary`.
  - Keep display strings in the UI/messages layer; helper functions should return structured values, issue codes, and normalized numeric/string outputs.
  - Use exact string parsing for seconds-to-milliseconds conversion to avoid binary floating-point surprises.
  - Use `Date` only after producing an integer millisecond time value.
  - Use `Date.UTC` for UTC date/time construction and component round-trip checks for both UTC and local construction.
  - Use `Intl.DateTimeFormat(locale, options)` for human-readable local and UTC formatting.
  - Use `Date.now()` only for "now" defaults/actions, not inside deterministic conversion tests except with injected clock values.
- Data tables or assumptions:
  - No external data tables are required.
  - Unix timestamp seconds and ECMAScript time values are treated as POSIX-style time and do not model leap seconds.
  - The browser's timezone database and `Intl` implementation define local-time names/offsets.
  - The proleptic Gregorian calendar behavior comes from ECMAScript `Date`.
- Official or authoritative sources:
  - ECMAScript Date time values and range: https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-time-values-and-time-range
  - ECMAScript Date time string format and parse invariants: https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format
  - Linux man-pages `time(2)` for Unix/POSIX system time behavior and 2038 note: https://man7.org/linux/man-pages/man2/time.2.html
  - Linux man-pages `time(7)` for epoch overview: https://man7.org/linux/man-pages/man7/time.7.html
  - MDN `Date` for browser-facing timestamp/timezone explanation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
  - MDN `Date.parse()` caveats for avoiding implementation-defined free-form parsing: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
  - Codebase source checked on 2026-06-25: current date route, registry, date helper, URL helper, translations, and prior tool plans.
- Source access dates:
  - ECMAScript specification checked on 2026-06-25.
  - Linux man-pages `time(2)` and `time(7)` checked on 2026-06-25; pages identify Linux man-pages 6.18 and render/source dates in 2026.
  - MDN `Date` and `Date.parse()` checked on 2026-06-25.
  - Codebase checked on 2026-06-25.
- Rule/table effective dates:
  - Not table-driven.
  - ECMAScript page observed as the current online draft at planning time.
  - Linux man-pages `time(2)` page lists standards C11 and POSIX.1-2024.
- Freshness or maintenance risk:
  - Low for core timestamp conversion.
  - Moderate for browser timezone display because local timezone data comes from the user's environment.
  - Low-to-moderate for spec links because ECMAScript is a living/current draft online; recheck if the implementation changes parsing or range assumptions.
  - Keep arbitrary timezone conversion out of v1 to avoid maintaining timezone database behavior.
- Estimator or privacy limitations:
  - This is a deterministic converter, not an estimator.
  - Local-time output can differ across devices and locations.
  - Browser-only processing reduces intentional server exposure, but shared links and screenshots can expose timestamp values.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Conversor Timestamp Unix`
  - PT-BR meta title: `Conversor timestamp Unix online`
  - PT-BR description: `Converta timestamp Unix em data e data em timestamp, com resultado em UTC, horario local, segundos e milissegundos.`
- Main form sections:
  - Mode segmented control: `Timestamp para data` and `Data para timestamp`.
  - Timestamp input with unit segmented control for seconds/milliseconds and a `usar agora` action.
  - Date/time input with date, time, UTC/local interpretation toggle, and current-time action.
  - Privacy/share row using existing `ShareButton`.
- Results sections:
  - Primary copy cards for Unix seconds, Unix milliseconds, and ISO UTC.
  - UTC date/time card.
  - Local date/time card with browser timezone label.
  - Diagnostic/explanation block for unit, timezone interpretation, and validation warnings.
  - Copy buttons for individual values and a copy-summary action.
- SEO sections:
  - What a Unix timestamp is.
  - Difference between timestamp in seconds and milliseconds.
  - How to convert timestamp to UTC/local date.
  - How to convert a date to timestamp.
  - Why local timezones can change the displayed date/hour.
  - Limits and leap-second caveat.
- FAQ topics:
  - `O que e timestamp Unix?`
  - `Timestamp Unix usa segundos ou milissegundos?`
  - `Qual a diferenca entre UTC e horario local?`
  - `Por que o mesmo timestamp aparece com outro horario no meu computador?`
  - `O conversor considera segundos bissextos?`
  - `Posso converter datas antes de 1970?`
- Disclaimer or privacy copy:
  - The conversion runs in the browser.
  - UTC output is the safest value for logs, APIs, databases, and shared debugging.
  - Shared URLs include the selected timestamp/date values in the query string.
  - The tool does not validate whether a timestamp came from a specific system, log source, or database.
- Related tool links:
  - Existing: `/datas/contador-de-dias`, `/dev/formatador-json`, `/dev/conversor-base64`, `/texto/contador-caracteres`.
  - Future backlog candidates: `/datas/conversor-fuso-horario`, `/datas/adicionar-dias-data`, `/datas/semana-do-ano`, `/dev/cron-parser`.
- Translation guidance:
  - Add `tools.unix-timestamp` keys to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Suggested tool names: PT-BR `Conversor Timestamp Unix`; EN `Unix Timestamp Converter`; ES `Conversor de Timestamp Unix`.
  - Translate mode labels, unit labels, UTC/local labels, result-card labels, copy actions, validation issue codes, timezone warnings, privacy/share copy, SEO sections, and FAQ content.
  - Keep technical tokens such as `Unix`, `timestamp`, `UTC`, `ISO`, `JavaScript`, `Date`, `seconds`, and `milliseconds` recognizable in localized copy.
  - Keep the route slug `/datas/unix-timestamp` stable across locales unless localized routes are introduced later.

## Implementation Checklist

- Tool logic:
  - Extend `lib/tools/dates.ts` with timestamp conversion types, constants, parse helpers, conversion helpers, issue codes, query-state helpers, and summary helpers.
  - Add deterministic unit tests in `lib/tools/dates.test.ts`.
- URL state:
  - Use `components/tools/url-state.ts` for initial params, `replaceQueryString`, and share URLs.
  - Sync only normalized compact query params.
  - Do not create a ticking query string for the current timestamp panel.
  - Invalid params should fall back to defaults while preserving a visible validation state when user-entered input is invalid.
- UI components:
  - Create `components/tools/dates/unix-timestamp-client.tsx`.
  - Use existing UI primitives, `ShareButton`, lucide icons such as `CalendarClock`, `Clock`, `Copy`, `RefreshCw`, and `Trash2` if available.
  - Add stable labels/test ids for mode, timestamp input, unit selector, date input, time input, timezone selector, now action, result cards, copy actions, share button, and validation messages.
  - Keep result cards stable in height and allow long timestamp/ISO strings to wrap or scroll within their own field without causing page-level horizontal overflow.
- Route and metadata:
  - Add `app/[locale]/datas/unix-timestamp/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "unix-timestamp")`.
- Registry/family/category:
  - Add a `tools` entry for `unix-timestamp` with `available: true`, `familyId: "datas"`, `primaryCategoryId: "datas-periodos"`, `categoryIds: ["datas-periodos"]`, `recentRank: 10`, `sitemapPriority` around `0.72`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
  - Reuse existing `datas` family and `datas-periodos` category; do not add a new category unless the creator finds a broader date-conversion category is already being introduced elsewhere.
- Messages:
  - Add PT-BR, EN, and ES translations for metadata, form labels, result labels, issue messages, source/caveat copy, SEO body, and FAQs.
- Unit tests:
  - Cover timestamp parsing, seconds/milliseconds conversion, fractional seconds, negative timestamps, Date range limits, UTC date construction, local date construction with injected dates where possible, invalid dates/times, and query-state normalization.
- E2E hooks/tests:
  - Add focused `tests/e2e/unix-timestamp.spec.ts`.
  - Cover route load, timestamp-to-date, date-to-timestamp, unit switching, UTC/local toggle, now action, copy/share behavior, invalid input diagnostics, directory/category links, and mobile no-horizontal-overflow.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark Rank 8 `In Progress` only when implementation starts.
  - Creator/tester should update this plan status through `in_progress`, `implemented`, and `verified` as the workflow proceeds.

## Test Plan

- Unit scenarios:
  - `0` seconds converts to `1970-01-01T00:00:00.000Z`.
  - `1` second converts to `1000` milliseconds.
  - `1700000000` seconds converts to `1700000000000` milliseconds and a valid ISO UTC string.
  - `1700000000.123` seconds preserves `.123` as milliseconds.
  - `-1` seconds converts to `1969-12-31T23:59:59.000Z`.
  - `2147483647` seconds converts to `2038-01-19T03:14:07.000Z`.
  - Millisecond mode accepts `1700000000123` and rejects decimal milliseconds.
  - Reject empty, non-numeric, scientific notation, comma separators, too many fractional digits, and values outside the ECMAScript Date range.
  - UTC date input `1970-01-01 00:00:00.000` returns timestamp `0`.
  - UTC date input `2024-02-29 12:34:56.789` round-trips to the same ISO components.
  - Invalid dates such as `2026-02-30` and invalid times such as `24:00` return structured issue codes.
  - Query-state parser normalizes valid params and ignores invalid ones safely.
- URL-state scenarios:
  - Empty URL loads default timestamp mode with current timestamp seeded once.
  - `?modo=timestamp&ts=0&u=s` initializes epoch conversion.
  - `?modo=timestamp&ts=1700000000000&u=ms` initializes millisecond conversion.
  - `?modo=data&data=1970-01-01&hora=00:00:00.000&zona=utc` initializes timestamp `0`.
  - Switching units or modes updates the query with compact, normalized params.
  - Invalid query params do not crash and do not leave nonsensical state in the URL after hydration.
  - Shared URLs include only visible state and no hidden content.
- Browser scenarios:
  - `/datas/unix-timestamp` renders the title, mode control, input fields, result cards, and privacy/share note.
  - Timestamp-to-date updates UTC and local results live.
  - Date-to-timestamp updates seconds and milliseconds live.
  - Unit switching between seconds and milliseconds preserves the represented instant when possible or clearly changes interpretation when user chooses explicit mode.
  - Copy actions write the expected values to the clipboard.
  - Share button copies a URL that rehydrates the same visible values.
  - Invalid input shows a clear validation message and does not show stale results as valid.
  - `/datas` directory lists `Conversor Timestamp Unix`.
  - Mobile viewport has no horizontal overflow and long ISO/timestamp values remain readable.
- Playwright scenarios:
  - Navigate to `/datas/unix-timestamp` and assert heading `Conversor Timestamp Unix`.
  - Fill timestamp `0`, choose seconds, and assert visible UTC output includes `1970-01-01T00:00:00.000Z`.
  - Fill timestamp `1700000000.123` and assert millisecond output includes `1700000000123`.
  - Switch to date mode, enter `1970-01-01`, `00:00:00.000`, `UTC`, and assert timestamp seconds `0`.
  - Assert the current URL contains normalized params and no unexpected content.
  - Use share, visit the copied URL, and assert the same mode/input/result rehydrates.
  - Assert `/datas` and `/ferramentas/datas` navigation exposes the new tool where applicable.
  - Run a mobile viewport check for no horizontal overflow.
- Lint/build commands:
  - `pnpm test -- lib/tools/dates.test.ts`
  - `pnpm lint`
  - `pnpm build` with the repo's required environment placeholders if needed.
  - `PORT=<free-port> pnpm run test:e2e -- tests/e2e/unix-timestamp.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - The route is live at `/datas/unix-timestamp`.
  - The tool converts in both directions for seconds and milliseconds.
  - UTC and local results are clearly labeled.
  - Query/share state round-trips valid visible state.
  - No values are stored, sent to server actions, or added to analytics.
  - Unit, e2e, lint, build, browser, and whitespace checks pass before marking verified.

## Implementation Notes

- Status updates:
  - 2026-06-25: Planner selected `new` and wrote the build plan. No app code was edited and the backlog row was not marked `In Progress`.
  - 2026-06-25: Creator confirmed the `new` decision is buildable and moved the backlog row plus plan to `In Progress` before app edits.
  - 2026-06-25: Creator implemented the browser-only Unix timestamp ferramenta and left the workflow in progress for tester review.
  - 2026-06-25: Review-fix handoff addressed accepted PR-review findings only and left the workflow in progress for tester review.
  - 2026-06-25: Tester validated the implemented route after the review gate and marked the plan verified. No production code changes were made during tester validation.
  - 2026-06-25: Orchestrator marked the backlog row `Done`, opened draft PR https://github.com/saulodefaria/calculaderia/pull/23, and recorded the PR URL in `Done Ref`.
- PR-review findings addressed:
  - `issue(now-action)`: date-mode `Usar agora` now fills date/time fields from the active zone. UTC uses UTC components for the current instant; local uses browser-local components. Timestamp-mode behavior is unchanged.
  - `issue(date-parsing)`: UTC date construction for date-mode conversion now preserves years `0000` through `0099` instead of allowing `Date.UTC` to remap them to `1900` through `1999`.
  - `test-gap(now-action)`: Playwright coverage now uses `timezoneId: "America/Sao_Paulo"` plus `page.clock.setFixedTime` to assert deterministic UTC `Usar agora`, local `Usar agora`, and actual non-UTC local wall-time conversion.
  - `blocking(date-input)`: date mode now uses a validated text field instead of native `type="date"` so browser controls do not drop `0000-01-01`; Playwright covers the year-0000 UTC date-mode flow and normalized query state.
- Files changed:
  - `docs/tool-plans/unix-timestamp.md`
  - `docs/tool-backlog.md`
  - `lib/tools/dates.ts`
  - `lib/tools/dates.test.ts`
  - `components/tools/dates/unix-timestamp-client.tsx`
  - `app/[locale]/datas/unix-timestamp/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/unix-timestamp.spec.ts`
- Validation results:
  - `pnpm test -- lib/tools/dates.test.ts`: blocked before Vitest by the environment's pnpm ignored-builds approval gate.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/dates.test.ts`: passed after review fixes, 16 tests.
  - Message JSON parse for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`: passed.
  - `pnpm lint`: blocked before eslint by the environment's pnpm ignored-builds approval gate.
  - `./node_modules/.bin/eslint`: passed.
  - `./node_modules/.bin/eslint components/tools/dates/unix-timestamp-client.tsx lib/tools/dates.ts lib/tools/dates.test.ts tests/e2e/unix-timestamp.spec.ts`: passed after review fixes.
  - `pnpm build`: blocked before build by the environment's pnpm ignored-builds approval gate.
  - `DATABASE_URL='postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public' ./node_modules/.bin/prisma generate`: passed for local validation.
  - `NEXT_TELEMETRY_DISABLED=1 AUTH_SECRET=build-check-secret AUTH_URL=http://localhost:3100 NEXTAUTH_URL=http://localhost:3100 ./node_modules/.bin/next build`: passed.
  - `PORT=3100 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3100' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3100 NEXTAUTH_URL=http://localhost:3100 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/unix-timestamp.spec.ts`: passed with elevated browser permissions, 4 tests.
  - `PORT=3102 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3102' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3102 NEXTAUTH_URL=http://localhost:3102 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/unix-timestamp.spec.ts`: passed after review fixes with elevated browser permissions, 5 tests.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/dates.test.ts`: passed after the `blocking(date-input)` fix, 16 tests.
  - Message JSON parse for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`: passed after the `blocking(date-input)` fix.
  - `./node_modules/.bin/eslint components/tools/dates/unix-timestamp-client.tsx tests/e2e/unix-timestamp.spec.ts lib/tools/dates.ts lib/tools/dates.test.ts`: passed after the `blocking(date-input)` fix.
  - `NEXT_TELEMETRY_DISABLED=1 DATABASE_URL='postgresql://postgres:postgres@localhost:5438/calculaderia?schema=public' AUTH_SECRET=build-check-secret AUTH_URL=http://localhost:3100 NEXTAUTH_URL=http://localhost:3100 ./node_modules/.bin/next build`: passed after the `blocking(date-input)` fix.
  - `PORT=3142 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3142' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3142 NEXTAUTH_URL=http://localhost:3142 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/unix-timestamp.spec.ts`: passed after the `blocking(date-input)` fix with elevated browser permissions, 5 tests.
  - `git diff --check`: passed after the `blocking(date-input)` fix.
  - `PORT=3148 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3148' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3148 NEXTAUTH_URL=http://localhost:3148 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/playwright test tests/e2e/unix-timestamp.spec.ts`: passed during tester validation with elevated browser permissions, 5 Chromium tests.
  - `WATCHPACK_POLLING=true AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3149 NEXTAUTH_URL=http://localhost:3149 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname localhost --port 3149`: started and stopped for live browser validation.
  - Elevated one-off Playwright Chromium validation against `http://localhost:3149/datas/unix-timestamp`: passed. Covered live route load/no redirect, timestamp-to-date `1704067200 -> 2024-01-01T00:00:00.000Z`, seconds-to-milliseconds switch, date-to-timestamp `2024-02-29 12:34:56.789` in UTC and `America/Sao_Paulo` local mode, local-share warning, `Use now` in UTC and local mode with a fixed instant, `0000-01-01` text date input, invalid `1e3` diagnostics, individual copy, summary copy, share URL restore, `/datas`, `/datas/categorias/datas-periodos`, sitemap exposure, mobile `390x900` no horizontal overflow, and no console or page errors in the accepted rerun.
  - Initial one-off live-browser probe was discarded because the validation script froze the browser clock and then navigated to unrelated pages, producing a footer-year hydration mismatch (`2024` client clock versus `2026` server render). The accepted rerun isolated the fixed-clock `Use now` checks on a disposable page and passed without browser issues.
  - `git diff --check`: passed after tester plan updates.
  - `git diff --check --no-index /dev/null docs/tool-plans/unix-timestamp.md`: produced no whitespace warnings for the untracked plan file; exit code `1` is expected for a new-file diff.
- Tester findings:
  - Pass. Existing `tests/e2e/unix-timestamp.spec.ts` coverage is sufficient after the review-gate fixes; no e2e edits were needed.
  - No production defects found during tester validation.
  - Residual note: Chromium/browser checks still require elevated permissions on this macOS host because of the known Playwright/Chromium sandbox issue.
- Remaining tester focus areas:
  - None for this tester pass.
- Final status:
  - Verified by tester; front matter is `verified`. Backlog rank 8 is `Done` with draft PR https://github.com/saulodefaria/calculaderia/pull/23 recorded in `Done Ref`.
