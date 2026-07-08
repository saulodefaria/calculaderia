---
slug: "validador-pis-pasep"
familyId: "validadores"
primaryCategoryId: "documentos"
backlogRank: 24
primaryKeyword: "validador pis pasep"
decision: "new"
targetRoute: "/validadores/validador-pis-pasep"
status: "verified"
createdAt: "2026-07-07"
updatedAt: "2026-07-07"
---

# Validador de PIS/PASEP Plan

## Backlog Row

- Rank: 24.
- Original status: `In Progress` / `planning` after claim.
- Slug: `validador-pis-pasep`.
- Primary keyword: `validador pis pasep`.
- Cluster keywords: `validar pis`; `validar pasep`; `validador nis`.
- Family/category: `validadores` / existing `documentos`.
- Opportunity score: 70.
- Idea type: `New`.
- Notes: `Public check-digit algorithm; source before build.`
- Done ref: none.

## Decision

- Decision: `new`.
- Target route: `/validadores/validador-pis-pasep`.
- Rationale: build a browser-only validator for the common 11-digit PIS/PASEP/NIS/NIT identifier shape and its public modulo-11 check digit. This complements existing CPF, CNPJ, CPF/CNPJ formatter, email, and card validators without overlapping their routes or responsibilities.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores`, `cpf`, `cnpj`, `formatador-cpf-cnpj`, `validador-email`, and `validador-cartao`; no `/validadores/validador-pis-pasep` route exists.
- Registry/categories checked: `lib/constants.ts` already has `validadores` family and `documentos` category; no PIS/PASEP tool is registered.
- Related modules/translations checked: `lib/tools/documents.ts`, `components/tools/validators`, `messages/*/tools`, and focused validator e2e specs. CPF/CNPJ helpers provide document-check-digit patterns, but there is no PIS/PASEP/NIS logic.
- Prior plans checked: `docs/tool-plans/validador-email.md`, `validador-cartao.md`, `formatador-cpf-cnpj.md`, and other tool plans; no prior PIS/PASEP plan exists.
- Overlap conclusion: new focused document validator is appropriate. Reuse the `validadores/documentos` taxonomy and privacy-safe validator UX.

## User Intent And Scope

- Target user: Brazilian workers, HR/admin users, students, and developers who need to check whether a typed PIS, PASEP, NIS, or NIT number is internally consistent before using it in a form.
- User job: paste or type a number, see whether it has 11 digits and a matching check digit, copy the normalized or formatted value, and understand that this is not an official registry lookup.
- In scope:
  - Accept one identifier at a time.
  - Remove common visual separators such as dots, hyphens, slashes, and spaces.
  - Reject unsupported characters, non-ASCII digits, repeated-digit sequences, wrong length, and invalid check digit.
  - Calculate the expected check digit with the public modulo-11 PIS/PASEP/NIS convention using weights `[3,2,9,8,7,6,5,4,3,2]` over the first 10 digits; expected digit is `0` when `11 - (sum % 11)` is `10` or `11`, otherwise that value.
  - Show normalized 11-digit value and a readable mask like `000.00000.00-0`.
  - Keep validation local in the browser.
  - Default URL/share behavior must not include the identifier. Optional explicit content sharing can use a hash fragment only, with sanitization and length limits.
- Out of scope:
  - No gov.br, Caixa, Banco do Brasil, Dataprev, CNIS, eSocial, INSS, RAIS, FGTS, Abono Salarial, or account lookup.
  - No statement that a person exists, is registered, has benefit eligibility, has balance, has employment records, or can receive PIS/PASEP/Abono.
  - No batch validation, file upload, document image parsing, or persistence.
- Sensitive-topic caveats: PIS/PASEP/NIS/NIT can identify workers. The UI must warn that syntax/check digit validity is not official validity and that users should not share identifiers publicly.

## Tool Contract

- Inputs:
  - `pisPasep`: free text input, empty by default, `inputMode="numeric"`, `autoComplete="off"`, no `name` attribute.
  - Share option: unchecked checkbox for explicit content in shared link.
- Defaults:
  - Empty input.
  - Settings-only live query and default share.
  - No save/favorite.
- Validation rules:
  - Trim ASCII edge whitespace and warn when trimming happened.
  - Normalize only ASCII digits; allow common separators `.`, `-`, `/`, whitespace.
  - Reject letters, emoji, punctuation outside accepted separators, and non-ASCII digits.
  - Require exactly 11 digits.
  - Reject repeated digits such as `00000000000` and `11111111111`.
  - Calculate and compare the final check digit from the first 10 digits.
- Outputs:
  - Status: `empty`, `incomplete`, `invalidFormat`, `invalidChecksum`, `validChecksum`.
  - Normalized value: 11 digits when readable.
  - Formatted value: `000.00000.00-0`.
  - Expected check digit and provided check digit when length permits.
  - Checklist diagnostics for input, characters, length, repeated sequence, check digit, scope, and privacy.
  - Copy buttons for normalized value, formatted value, and summary when applicable.
- Result explanations:
  - Valid checksum means the number is internally consistent only.
  - Invalid checksum usually means a typo or unsupported number.
  - Incomplete or too long input should explain the 11-digit requirement.
- URL params:
  - Live URL: no identifier content. If a future display option exists, it can use compact safe params; v1 likely has none.
  - Optional explicit shared content: hash `#conteudo=1&pis=<digits>` only after user opts in.
- Share behavior:
  - `ShareButton` default returns base route without identifier.
  - Explicit content share includes sanitized digits only in hash fragment, never query string.
  - Hydration from hash fills the input once and clears URL hash/query; do not leave content-sharing re-enabled by default after hydration.
- Save/favorites behavior: no `SaveButton`, no favorites, no storage, no API.

## Logic, Data, And Sources

- Logic summary:
  - `onlyPisPasepDigits` reads ASCII digits.
  - `formatPisPasep` formats up to 11 digits as `000.00000.00-0`.
  - `calculatePisPasepCheckDigit(base10)` returns the expected final digit.
  - `validatePisPasepNumber(input)` returns structured status, issues, diagnostics, normalized/formatted output, and check-digit details.
  - URL/share helpers mirror the privacy pattern from email/card validators.
- Data tables or assumptions:
  - PIS/PASEP/NIS/NIT numbers are treated as 11 decimal digits for this syntax/check-digit validator.
  - Check-digit rule uses the widely implemented public modulo-11 convention with weights `[3,2,9,8,7,6,5,4,3,2]`.
- Official or authoritative sources:
  - Gov.br service page "Receber o Abono Salarial", accessed 2026-07-07, identifies PIS/PASEP in the public Abono Salarial context, notes official channels, and distinguishes Caixa and Banco do Brasil payment roles: https://www.gov.br/pt-br/servicos/receber-o-abono-salarial
  - Caixa PIS worker page, accessed 2026-07-07, for public PIS context and official channel limitations: https://www.caixa.gov.br/beneficios-trabalhador/pis/Paginas/default.aspx
  - Gov.br/INSS service context for worker/social identifiers, accessed 2026-07-07: https://www.gov.br/pt-br/servicos/inscrever-no-inss
  - Public check-digit algorithm references are not exposed as a single official gov.br specification in the pages found during planning. The implementation must label the rule as a public/de facto checksum convention and avoid saying it proves official registration.
- Source access dates: 2026-07-07 America/Sao_Paulo.
- Rule/table effective dates: no date-sensitive table; only static checksum logic and current official service-channel context.
- Freshness or maintenance risk:
  - Low for the 11-digit checksum convention, but moderate content risk around official PIS/PASEP/NIS terminology and service channels. Copy should stay generic and avoid payment-calendar or eligibility details.
  - If an official published check-digit specification is later found, update the source section and UI copy.
- Estimator or privacy limitations:
  - This is not an estimator or official lookup. It only checks local numeric consistency and never sends the identifier by this tool.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de PIS/PASEP`.
  - Description: validate PIS, PASEP, NIS, or NIT check digit locally without consulting official systems.
- Main form sections:
  - Input card with privacy note.
  - Share card with explicit-content opt-in.
  - Details card explaining covered checks.
- Results sections:
  - Status panel with icon and short description.
  - Formatted/normalized value panel when digits are readable.
  - Check digit panel with provided/expected digit when available.
  - Diagnostics checklist.
  - Copy actions.
- SEO sections:
  - About the PIS/PASEP validator.
  - How to validate PIS/PASEP/NIS online safely.
- FAQ topics:
  - Does it consult Caixa, Banco do Brasil, INSS, Dataprev, CNIS, or gov.br?
  - Does a valid checksum prove benefit eligibility?
  - What are PIS, PASEP, NIS, and NIT?
  - Is the number sent to the server?
  - Can I share a prefilled link?
- Disclaimer or privacy copy:
  - The tool validates format/check digit only and is not affiliated with Caixa, Banco do Brasil, INSS, Dataprev, MTE, or gov.br.
  - Do not use the result as legal, benefit, employment, or registration advice.
- Related tool links:
  - CPF, CNPJ, Formatador de CPF/CNPJ, Validador de Email, Validador de Cartao.
- Translation guidance:
  - `pt-br`: primary SEO copy with Brazilian terminology.
  - `en`: explain PIS/PASEP/NIS/NIT as Brazilian worker/social identification numbers.
  - `es`: explain as identificadores laborales/sociales brasileños.

## Implementation Checklist

- Tool logic:
  - Add `lib/tools/pis-pasep.ts` with pure validation, formatting, diagnostics, and share helpers.
  - Add `lib/tools/pis-pasep.test.ts`.
- URL state:
  - Live params omit identifier content.
  - Explicit shared content uses hash-only helper and hydration sanitization.
- UI components:
  - Add `components/tools/validators/pis-pasep-validator-client.tsx`.
  - Keep controls accessible with stable test ids.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-pis-pasep/page.tsx`.
- Registry/family/category:
  - Add tool to `lib/constants.ts` under `validadores` / `documentos`, with `stateMode: "query"` and rank 24-ish recent order if appropriate.
  - Update `lib/constants.test.ts` if required by registry expectations.
- Messages:
  - Add `messages/pt-br/tools/validador-pis-pasep.json`.
  - Add `messages/en/tools/validador-pis-pasep.json`.
  - Add `messages/es/tools/validador-pis-pasep.json`.
  - Update catalog/directory loading if the project requires explicit imports.
- Unit tests:
  - Valid known values, invalid check digit, repeated digits, wrong length, unsupported characters, formatting, share privacy, hash hydration.
- E2E hooks/tests:
  - Add focused Playwright spec if coverage is missing.
  - Browser tester should validate route, results, share privacy, hash hydration, no storage/API leaks, navigation, and mobile no-overflow.
- Backlog updates:
  - Orchestrator marks planned, review/testing/verified/done stages through DB scripts only.

## Test Plan

- Unit scenarios:
  - `validatePisPasepNumber("120.44560.08-0")` returns valid checksum.
  - Same base with final digit changed returns invalid checksum and expected/provided values.
  - `00000000000`, `11111111111`, `123`, `123456789012`, Unicode digits, letters, and emoji are rejected with precise issues.
  - Formatting handles partial and full digit strings.
  - Share URL default excludes `pis`; explicit share includes hash-only sanitized content; oversized/noisy content is omitted or sanitized.
- URL-state scenarios:
  - Reading query params always defaults to empty content.
  - Hash `#conteudo=1&pis=<digits>` hydrates sanitized digits only.
  - Invalid hash content returns empty.
- Browser scenarios:
  - PT-BR route loads with H1, breadcrumb, category, JSON-LD, SEO sections.
  - Valid sample shows checksum valid, normalized/formatted values, copy actions.
  - Invalid sample shows expected digit.
  - Default URL/share never includes identifier.
  - Explicit hash-only share restores once and clears URL content.
  - No SaveButton, no local/session storage, cookies, IndexedDB, request URLs, or API calls contain the identifier.
  - EN/ES route smoke checks.
  - Mobile 390px viewport has no horizontal overflow.
- Playwright scenarios:
  - Focused spec for valid/default-share/privacy.
  - Spec for invalid/repeated/unsupported diagnostics.
  - Spec for explicit hash share/hydration sanitization.
  - Spec for directory/category navigation.
- Lint/build commands:
  - `corepack pnpm test -- lib/tools/pis-pasep.test.ts lib/constants.test.ts`
  - `corepack pnpm run validate:messages`
  - `corepack pnpm lint`
  - `corepack pnpm build`
  - `corepack pnpm run test:e2e -- tests/e2e/pis-pasep-validator.spec.ts --project=chromium`
- Acceptance criteria:
  - Local checksum validation is deterministic and tested.
  - User copy never claims official registration, eligibility, balance, or benefit entitlement.
  - Identifier content is excluded from live/default URL, analytics-visible query state, storage, and server/API paths.
  - Route is discoverable through registry, family, category, sitemap, metadata, and messages.

## Implementation Notes

- Status updates:
  - 2026-07-07 22:44 -0300: Initial planner subagent was spawned for this claimed row but stalled without writing a plan. Orchestrator closed it and completed the buildable plan locally for the same DB row and target route.
  - 2026-07-07: Creator confirmed the DB item is `In Progress` with stage `implementation` for `kind=tool`, slug `validador-pis-pasep`, route `/validadores/validador-pis-pasep`, and branch `codex/validador-pis-pasep-tool`; plan status moved to `in_progress` before app implementation.
  - 2026-07-07 22:54 -0300: Creator implemented the planned tool. The original plan fixture was corrected from `120.44560.08-3` to `120.44560.08-0` because the mandated modulo-11 formula produces expected digit `0`; `...-3` remains the invalid-checksum fixture.
  - 2026-07-07 23:35 -0300: Tester validation passed. Plan status moved to `verified`; tester did not edit DB state.
  - 2026-07-07 23:36 -0300: Orchestrator moved the DB item from `In Progress` / `testing` to `In Progress` / `verified`.
- Files changed:
  - `docs/tool-plans/validador-pis-pasep.md`.
  - `lib/tools/pis-pasep.ts`.
  - `lib/tools/pis-pasep.test.ts`.
  - `components/tools/validators/pis-pasep-validator-client.tsx`.
  - `app/[locale]/validadores/validador-pis-pasep/page.tsx`.
  - `lib/constants.ts`.
  - `messages/pt-br/catalog/tools.json`.
  - `messages/en/catalog/tools.json`.
  - `messages/es/catalog/tools.json`.
  - `messages/pt-br/tools/validador-pis-pasep.json`.
  - `messages/en/tools/validador-pis-pasep.json`.
  - `messages/es/tools/validador-pis-pasep.json`.
  - `tests/e2e/pis-pasep-validator.spec.ts`.
- Validation results:
  - Creator reported focused single-worker Vitest for `lib/tools/pis-pasep.test.ts lib/constants.test.ts` passed, `corepack pnpm run validate:messages` passed, `corepack pnpm lint` passed, elevated placeholder build passed, and elevated focused Playwright passed 6/6 Chromium.
  - Tester DB read attempt: `set -a; [ -f .env ] && . ./.env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-pis-pasep -f scripts/backlog/get_item.sql` failed because no usable backlog database URL was available and no local Postgres socket existed at `/tmp/.s.PGSQL.5432`; no DB state was changed.
  - Tester inspection confirmed route `/validadores/validador-pis-pasep`, field ids `pis-pasep-validator-*`, result labels, empty live query params, hash-only explicit share params, hash hydration cleanup, and no `SaveButton` / favorites / local storage / session storage / IndexedDB / server API path in the PIS/PASEP implementation.
  - `corepack pnpm test -- lib/tools/pis-pasep.test.ts lib/constants.test.ts` passed: 67 files / 780 tests under the repo Vitest config.
  - `corepack pnpm run validate:messages` passed.
  - `corepack pnpm lint` passed.
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia AUTH_SECRET=placeholder-auth-secret corepack pnpm build` passed; build listed `/[locale]/validadores/validador-pis-pasep` for `pt-br`, `en`, and `es` with only existing `metadataBase` warnings.
  - Sandboxed Chromium command `CI=true PORT=3244 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3244' ./node_modules/.bin/playwright test tests/e2e/pis-pasep-validator.spec.ts --project=chromium` failed before assertions with macOS `MachPortRendezvousServer ... Permission denied (1100)`.
  - Elevated Chromium command `CI=true PORT=3245 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3245' ./node_modules/.bin/playwright test tests/e2e/pis-pasep-validator.spec.ts --project=chromium` passed: 6/6 tests.
  - Dev server command `pnpm dev -- --hostname localhost --port 3246` failed before startup on the local no-TTY pnpm modules-purge guard.
  - Direct dev server command `WATCHPACK_POLLING=true AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3246 NEXTAUTH_URL=http://localhost:3246 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname localhost --port 3246` served the route successfully; the earlier direct server attempt without `WATCHPACK_POLLING` logged `EMFILE` watcher errors and returned 404, so it was stopped and replaced.
  - Elevated live browser sweep against `http://localhost:3246` passed 27 checks: PT-BR route/no redirect, valid `120.44560.08-0`, invalid `120.44560.08-3`, repeated digits, unsupported characters, default share without identifier, explicit hash-only share, hash hydration clears URL and leaves content sharing disabled, hydrated default re-share omits content, EN/ES smoke, mobile 390px no horizontal overflow, no SaveButton/favorite action, no identifier in storage/cookies/IndexedDB metadata, no identifier in 104 observed request URLs, no `/api/favorites` calls, and no page console or page errors.
- Tester findings:
  - Passed with no production-code changes and no e2e coverage changes required.
  - Residual risk: live browser validation depends on elevated Chromium on this macOS host because sandboxed Chromium cannot launch.
- Final status:
  - Verified by tester. DB item is `In Progress` / `verified`; do not mark DB `Done` until orchestrator PR/finalization completes.
