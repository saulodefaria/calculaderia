---
slug: "validador-placa"
familyId: "validadores"
primaryCategoryId: "veiculos"
backlogRank: 23
primaryKeyword: "validador de placa mercosul"
decision: "new"
targetRoute: "/validadores/validador-placa"
status: "verified"
createdAt: "2026-07-07"
updatedAt: "2026-07-07"
---

# Validador de Placa Plan

## Backlog Row

- Rank: 23
- Original status: `In Progress`
- Stage: `implementation`
- Slug: `validador-placa`
- Branch: `codex/validador-placa-tool`
- Primary keyword: `validador de placa mercosul`
- Cluster keywords: `validar placa`; `placa mercosul`; `placa antiga`
- Family/category: backlog family `validadores`; planned family `validadores`; proposed category `veiculos`
- Opportunity score: 70
- Idea type: `New`
- Notes: Supports old and Mercosul patterns.
- Done ref: not provided.
- Plan path: `docs/tool-plans/validador-placa.md`
- Target route: `/validadores/validador-placa`
- Claim expires at: `2026-07-09T00:29:06.243411+00:00`

## Decision

- Decision: `new`
- Target route: `/validadores/validador-placa`
- Buildability: buildable.
- Rationale: The DB row asks for a plate validator and the target route matches the primary keyword. Current code has validator routes for CPF, CNPJ, CPF/CNPJ formatting, email, and payment-card checks, but no vehicle plate route, helper, component, message namespace, registry entry, or plan. Build a dedicated browser-only validator for Brazilian PIV/Mercosul and old PNU plate formats.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx`, `app/[locale]/validadores/validador-email/page.tsx`, `app/[locale]/validadores/validador-cartao/page.tsx`, dynamic family/category routes, and top-level tool families under `calculadoras`, `geradores`, `matematica`, `datas`, `texto`, `cores`, and `dev`.
- Registry/categories checked: `lib/constants.ts` defines the `validadores` family and categories `documentos`, `contato`, and `pagamentos`. None of those is a clean fit for vehicle identifiers. Propose a new `veiculos` validator category, using the existing imported `Car` icon if the creator keeps that import.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/email.ts`, `lib/tools/payment-card.ts`, current validator components under `components/tools/validators`, `components/tools/url-state.ts`, split tool messages under `messages/*/tools`, `messages/*/catalog/tools.json`, and `messages/*/directories.json`.
- Prior plans checked: current `docs/tool-plans` and `docs/calculator-plans`, including adjacent validator plans `validador-email.md`, `validador-cartao.md`, and `formatador-cpf-cnpj.md`. No prior `validador-placa` plan exists in this worktree.
- Text search checked: `validador-placa`, `validador de placa mercosul`, `validar placa`, `placa mercosul`, `placa antiga`, `placa`, `license plate`, `plate validator`, and `mercosul`, excluding `docs/tool-backlog.md` and `docs/calculator-backlog.md`.
- Overlap conclusion: Build a new route. Reuse the validator UI/privacy patterns from email, phone memory context, and card validator plans, but do not merge the idea into document/contact/payment validators.

## User Intent And Scope

- Target user: A Brazilian user checking whether a typed vehicle plate has the expected old Brazilian PNU format or the current PIV/Mercosul format before using it in a form, spreadsheet, support ticket, inspection note, or internal workflow.
- User job: Type or paste one plate, normalize the input, see whether it matches an old or Mercosul syntax, understand the old-to-Mercosul conversion when applicable, and avoid mistaking syntax validation for an official vehicle lookup.
- In scope:
  - Single Brazilian vehicle plate syntax validation.
  - Current PIV/Mercosul pattern: `LLLNLNN`, displayed to users as `ABC1D23`.
  - Old PNU pattern: three letters and four numbers, displayed as `ABC-1234`.
  - Normalization from lowercase to uppercase and removal of common visual separators such as space, hyphen, dot, and line-trimmed whitespace.
  - Diagnostic states for valid Mercosul, valid old, invalid, incomplete, and attention.
  - Old-to-Mercosul conversion using the official Annex II table: old second numeric digit `0..9` maps to Mercosul fourth letter slot `A..J`, e.g. `ABC1234` -> `ABC1C34`.
  - Mercosul-to-old reverse conversion only when the fifth normalized character is `A..J`, with copy saying "equivalente pela tabela de conversao", not "placa oficial vinculada".
  - Copy normalized plate, copy formatted display, copy conversion when available, copy validation summary, clear input, safe share settings, and optional explicit content share.
  - Clear caveats that this validates shape only and does not query SENATRAN, RENAVAM, DETRAN, QR Code, ownership, fines, theft records, registration status, or authenticity.
- Out of scope:
  - Official plate lookup, vehicle existence, ownership, RENAVAM, CRLV, fines, theft/restriction checks, QR Code scanning, PIV manufacturer validation, clone detection, state/city inference, category color validation from photos, OCR, bulk CSV validation, API endpoints, server actions, and saved/favorite vehicle records.
  - International plate formats outside Brazil.
  - Historical Brazilian formats before the old PNU `AAA-1111` style.
  - Legal or enforcement advice.
- Sensitive-topic caveats:
  - A plate can identify a vehicle and may become personal data when combined with context. Default live URLs and default share links must not contain the typed plate.
  - Do not imply that a syntactically valid plate exists, is active, belongs to a user, is legal to circulate, or is not cloned.
  - Do not instruct users to scrape or bypass official services.

## Tool Contract

- Inputs:
  - `placa`: one text input for a single Brazilian plate.
  - `modo`: optional validation mode, default `auto`, with allowed values `auto`, `mercosul`, and `antiga` if the creator exposes a segmented control. V1 can keep mode internal if the UI stays simpler.
  - `conteudo`: optional explicit share flag for fragment-only content sharing.
- Defaults:
  - Empty input.
  - `modo=auto`.
  - No plate in live query string.
- Validation rules:
  - Trim leading/trailing whitespace for validation and show an attention note if trimming changed the input.
  - Normalize letters to uppercase.
  - Remove a small allowlist of visual separators: ASCII space, nonbreaking space, hyphen, dot, and optionally a single internal space between groups. Record ignored separators in diagnostics.
  - Reject tabs, line breaks with multiple plate-like values, emoji, accents, underscores, slashes, punctuation outside the separator allowlist, and non-ASCII letters/digits.
  - Reject empty input as neutral `empty`, not an error.
  - Reject normalized length below 7 as `incomplete` and above 7 as `tooLong`.
  - Mercosul/PIV format: seven characters matching `^[A-Z]{3}[0-9][A-Z][0-9]{2}$`.
  - Old PNU format: seven characters matching `^[A-Z]{3}[0-9]{4}$`.
  - Ambiguity: the two accepted patterns are disjoint after normalization. A normalized value cannot be both.
  - Old-to-PIV conversion: for old `ABC1234`, keep positions 1-4, replace the second numeric digit with the table letter, and keep positions 6-7, producing `ABC1C34`.
  - PIV-to-old reverse conversion: if normalized PIV fifth character is `A` through `J`, map it back to `0` through `9`; if it is `K` through `Z`, return no old-equivalent and explain that Annex II reserves `A` to `J` for PNU conversion.
  - Do not reject a PIV plate merely because the fifth character is `K` through `Z`; classify it as a syntactically valid PIV with no old-PNU conversion.
  - Warn about visually confusable characters such as `O` vs `0`, `I` vs `1`, and `B` vs `8` only as a typing hint. Do not mutate letters into digits automatically.
  - Invalid query/hash params must fall back to defaults without crashing.
- Outputs:
  - Overall status: `empty`, `validMercosul`, `validAntiga`, `invalid`, `incomplete`, or `attention`.
  - Normalized raw plate, e.g. `ABC1D23` or `ABC1234`.
  - Formatted display, e.g. `ABC1D23` for PIV and `ABC-1234` for old PNU.
  - Plate type: `PIV/Mercosul`, `PNU antiga`, or `desconhecida`.
  - Conversion result when available, with direction and mapping explanation.
  - Diagnostic checklist: length, character groups, separators, format family, conversion availability, privacy/scope.
  - Main explanation: syntax validation only, no official lookup.
- Result explanations:
  - Valid PIV: "A placa segue o padrao PIV/Mercosul `ABC1D23`."
  - Valid old: "A placa segue o padrao antigo `ABC-1234`; a substituicao para PIV usa a tabela oficial quando houver troca."
  - Conversion: "A conversao e uma equivalencia de caracteres pela tabela, nao uma consulta oficial do veiculo."
  - Invalid: show the first concrete issue and a checklist, e.g. wrong position, unsupported character, too short/too long, multiple values, or mixed groups.
- URL params:
  - Safe live query params: `modo` only when not default.
  - Do not write `placa`, `plate`, `q`, `entrada`, `conteudo`, or normalized output into `window.location.search` during normal editing.
  - Optional explicit content share may use hash only, e.g. `#conteudo=1&placa=ABC1D23`, after the user opts in.
  - Hydrate plate input only from fragment/hash when `conteudo=1` is present.
  - After hydrating a content-bearing hash, sanitize the address bar back to safe query params and clear the hash.
  - Enforce a short fragment budget such as 200 characters because only one plate is supported.
- Share behavior:
  - Default share URL includes route and safe mode only.
  - Optional "incluir placa no link compartilhado" must be explicit and must not mutate the address bar.
  - Show a warning that anyone with a content-bearing URL can see the plate.
- Save/favorites behavior:
  - No SaveButton and no favorites integration for plate content.
  - Do not store typed plate, normalized plate, conversion output, or summaries in localStorage, sessionStorage, cookies, IndexedDB, analytics event payloads, server logs, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Add a pure helper such as `lib/tools/license-plate.ts` or `lib/tools/vehicle-plate.ts` with validation result types, issue codes, normalization metadata, conversion helpers, safe search-param helpers, and optional hash-share helpers.
  - Keep validation deterministic and browser-only. Use anchored regexes after explicit normalization, not loose substring matching.
  - Implement `normalizePlateInput(input)` to return original input, trimmed input, uppercase normalized value, ignored separators, unsupported characters, multiple-line indicators, and confusable-character hints.
  - Implement `validateBrazilianPlate(input, options)` to classify old PNU or PIV/Mercosul and return stable issue codes.
  - Implement `convertOldPlateToMercosul(oldPlate)` and `convertMercosulToOldPlate(pivPlate)` using the official map `0:A`, `1:B`, `2:C`, `3:D`, `4:E`, `5:F`, `6:G`, `7:H`, `8:I`, `9:J`.
  - Keep all user-facing strings in message JSON; helper returns stable codes only.
  - Do not fetch official services or embed a mutable list of existing plate series.
- Data tables or assumptions:
  - Pattern table:
    - PIV/Mercosul current syntax: `LLLNLNN`, example `ABC1D23`.
    - Old PNU syntax: `LLLNNNN`, example `ABC1234` / display `ABC-1234`.
  - Conversion table:
    - `0 -> A`, `1 -> B`, `2 -> C`, `3 -> D`, `4 -> E`, `5 -> F`, `6 -> G`, `7 -> H`, `8 -> I`, `9 -> J`.
  - Accepted letters are ASCII `A-Z`; accepted numerals are ASCII `0-9`.
  - The tool does not know whether a normalized combination was issued, reserved, canceled, cloned, stolen, transferred, or associated with a specific UF.
- Official or authoritative sources:
  - Ministerio dos Transportes / SENATRAN, Resolucoes Contran index: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/resolucoes-contran. Accessed `2026-07-07`. The index lists CONTRAN Resolution 969 with date `2022-06-20`, publication `2022-06-24`, in force from `2022-07-01`, and notes it revokes prior plate resolutions including 231/2007 and 780/2019.
  - CONTRAN Resolution 969/2022 PDF: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao9692022.pdf. Accessed `2026-07-07`. Published in DOU on `2022-06-24`; resolution date `2022-06-20`. Used for PIV scope, old PNU pattern reference, non-mandatory replacement caveat, and QR/authenticity boundary.
  - CONTRAN Resolution 969/2022 Annexes PDF: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao9692022anexos.pdf. Accessed `2026-07-07`. Annex I sets PIV stamping as seven alphanumeric characters in sequence `LLLNLNN`; Annex II gives the PNU-to-PIV conversion table and example `ABC1234` -> `ABC1C34`.
  - CONTRAN Resolution 231/2007 PDF: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/resolucao_231.pdf. Accessed `2026-07-07`. Historical source for the old plate model; use only as background because the official index records that Resolution 969/2022 revoked it.
  - Codebase inspection on `2026-07-07`: current routes, registry, `lib/tools`, `components/tools`, URL helpers, messages, and existing tool/calculator plans.
- Source access dates:
  - Official CONTRAN/SENATRAN web sources checked on `2026-07-07` America/Sao_Paulo / `2026-07-07` UTC.
  - Codebase checked on `2026-07-07`.
- Rule/table effective dates:
  - Resolution 969/2022: dated `2022-06-20`, published `2022-06-24`, in force from `2022-07-01` according to the official index.
  - Annex I and Annex II are part of Resolution 969/2022.
  - Resolution 231/2007 is historical/superseded and should not be treated as current authority for new plates.
- Freshness or maintenance risk:
  - Moderate. Plate legislation and CONTRAN resolutions can change; the creator should recheck the official index before implementation if this plan ages.
  - Low for the basic regex and conversion table as long as Resolution 969/2022 remains current.
  - High product-risk if users expect official lookup. Keep "formato/sintaxe" wording prominent.
- Estimator or privacy limitations:
  - This is not an estimator, legal opinion, registry lookup, or authenticity verifier.
  - It cannot verify existence, ownership, registration, fines, theft status, restriction status, QR authenticity, cloning, or whether a vehicle is authorized to circulate.
  - Browser-only processing reduces intentional server exposure, but screenshots, clipboard, browser history, and explicit content-bearing links can still expose a plate.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de Placa Mercosul`
  - PT-BR description: `Valide no navegador se uma placa segue o formato Mercosul ou antigo, veja a conversao de caracteres e entenda os limites sem consulta oficial.`
  - EN title: `Brazilian License Plate Validator`
  - EN description: `Check locally whether a Brazilian plate matches the Mercosul/PIV or old format, with conversion notes and no official lookup.`
  - ES title: `Validador de Placa Mercosur de Brasil`
  - ES description: `Comprueba en el navegador si una placa brasilena sigue el formato Mercosur/PIV o antiguo, con notas de conversion y sin consulta oficial.`
- Main form sections:
  - Single plate input with placeholder `ABC1D23` and compact hint `Tambem aceita ABC-1234`.
  - Optional segmented control for automatic/current/old mode if useful; otherwise infer automatically.
  - Clear button, copy normalized button, copy formatted button, copy conversion button when present, and copy summary button.
  - Privacy/share panel with settings-only default share and optional explicit content-share control.
- Results sections:
  - Empty state before input.
  - Valid PIV state with normalized value and no old-equivalent note if fifth character is outside `A-J`.
  - Valid old state with formatted old value and official table conversion.
  - Invalid state with first issue and checklist.
  - Attention hints for ignored separators, trimmed whitespace, and visually confusable characters.
  - Scope panel: format validation only, no SENATRAN/DETRAN/RENAVAM/QR lookup.
- SEO sections:
  - What a Mercosul/PIV plate format looks like.
  - Difference between old `ABC-1234` and current `ABC1D23`.
  - How the old-to-Mercosul character conversion works.
  - What this validator cannot confirm.
  - Privacy note for typed plates.
- FAQ topics:
  - `Este validador consulta SENATRAN, DETRAN ou RENAVAM?`
  - `Uma placa valida significa que o veiculo existe?`
  - `Qual e o formato da placa Mercosul no Brasil?`
  - `Como converter uma placa antiga para Mercosul?`
  - `Por que algumas placas Mercosul nao tem equivalente antigo?`
  - `A placa digitada fica salva ou vai para o servidor?`
  - `Posso compartilhar um link com a placa preenchida?`
- Disclaimer or privacy copy:
  - "A ferramenta confere apenas o formato e a tabela de conversao de caracteres. Ela nao consulta bases oficiais, nao confirma existencia do veiculo, propriedade, multas, restricoes, autenticidade, QR Code ou clonagem."
  - "Por padrao, a placa digitada nao entra na URL nem no link compartilhado. Inclua a placa no link somente quando qualquer pessoa com a URL puder ver esse dado."
- Related tool links:
  - Existing: `/validadores/cpf`, `/validadores/cnpj`, `/validadores/formatador-cpf-cnpj`, `/validadores/validador-email`, `/validadores/validador-cartao`, `/dev/regex-tester`.
  - Future candidates: `/validadores/validador-renavam`, `/validadores/validador-chassi`, `/validadores/validador-cep`, and vehicle-finance calculators where relevant.
- Translation guidance:
  - Add `toolCategories.veiculos` keys in `messages/pt-br/directories.json`, `messages/en/directories.json`, and `messages/es/directories.json`.
  - Add catalog keys for `validador-placa` in `messages/*/catalog/tools.json`.
  - Add split tool files `messages/pt-br/tools/validador-placa.json`, `messages/en/tools/validador-placa.json`, and `messages/es/tools/validador-placa.json`.
  - Suggested category names: PT-BR `Veiculos`; EN `Vehicles`; ES `Vehiculos`.
  - Suggested tool names: PT-BR `Validador de Placa Mercosul`; EN `Brazilian License Plate Validator`; ES `Validador de Placa Mercosur de Brasil`.
  - Keep official terms precise: PIV, PNU, Mercosul/Mercosur, SENATRAN, CONTRAN, RENAVAM, DETRAN, QR Code.
  - Translate issue codes consistently, especially "syntax only", "no official lookup", "old equivalent unavailable", and "confusable characters".

## Implementation Checklist

- Tool logic:
  - Add `lib/tools/license-plate.ts` or `lib/tools/vehicle-plate.ts` with pure helpers, issue codes, conversion table, normalization, validation, summary builders, and safe URL/hash helpers.
  - Add matching unit tests.
  - Do not import CPF/CNPJ document logic or payment-card logic except by following established patterns.
- URL state:
  - Reuse `components/tools/url-state.ts`.
  - Keep live query settings-only.
  - Never write plate content to query params during normal typing.
  - Hydrate plate content only from explicit `conteudo=1` hash and sanitize the URL after hydration.
  - Consider route-specific analytics URL sanitization if analytics can read the initial URL before client cleanup.
- UI components:
  - Add `components/tools/validators/license-plate-validator-client.tsx` or a similar plate-specific validator component.
  - Use existing Button/Input/Card/Tabs/Tooltip/ShareButton patterns.
  - Use `inputMode="text"`, `autoCapitalize="characters"`, `autoComplete="off"`, and avoid a sensitive `name` attribute.
  - Include stable `data-testid` hooks for input, mode control if present, status, normalized value, formatted value, conversion result, diagnostics, copy buttons, clear button, include-content toggle, and share button.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-placa/page.tsx`.
  - Use the existing metadata helpers and tool message provider conventions.
- Registry/family/category:
  - Add a `veiculos` `ToolCategoryId` under `validadores` in `lib/constants.ts`.
  - Add a `validador-placa` tool entry with `familyId: "validadores"`, `primaryCategoryId: "veiculos"`, `categoryIds: ["veiculos"]`, `stateMode: "query"`, `available: true`, and suitable icon such as `Car` or `BadgeCheck`.
  - Update constants tests for the new category/tool.
- Messages:
  - Add PT-BR, EN, and ES catalog, directories, and split tool message files.
  - Include source/caveat copy but keep user-facing paragraphs concise.
- Unit tests:
  - Cover Mercosul valid examples, old valid examples, lowercase/separator normalization, old-to-PIV conversion, PIV-to-old reverse conversion for A-J, no reverse conversion for K-Z, invalid lengths, invalid position types, unsupported characters, confusable hints, and URL/hash privacy helpers.
- E2E hooks/tests:
  - Add focused Playwright tests for route load, typing valid PIV, typing old with conversion, invalid diagnostics, safe live URL, default safe share, explicit hash-only content share if implemented, hydration sanitization, copy actions, clear action, category/directory exposure, no console errors, and mobile no-overflow.
- Backlog updates:
  - Creator should not update DB state directly unless invoked by the orchestrator. Planner has not updated DB state.

## Test Plan

- Unit scenarios:
  - `ABC1D23`, `abc1d23`, and `ABC 1D23` classify as PIV/Mercosul and normalize to `ABC1D23`.
  - `ABC-1234`, `abc1234`, and `ABC 1234` classify as old PNU and format as `ABC-1234`.
  - `ABC1234` converts to `ABC1C34`.
  - `ABC1A34` reverse-converts to `ABC1034`; `ABC1J34` reverse-converts to `ABC1934`; `ABC1K34` is valid PIV with no old equivalent.
  - `ABCD123`, `ABC12D3`, `AB12345`, `ABC123`, `ABC12345`, `ABC_1234`, `ABC@123`, and multiline input return stable issue codes.
  - Confusable hints appear without automatic substitution.
  - Query params emit only safe mode; plate content is omitted.
  - Hash content is accepted only with `conteudo=1` and can be sanitized after hydration.
- URL-state scenarios:
  - Default state has no query string.
  - Non-default `modo` round-trips through query.
  - Unknown params and sensitive params are ignored/removed.
  - Hash content share is opt-in and length-limited.
- Browser scenarios:
  - User can paste a plate, immediately see status, normalized value, and conversion.
  - Copy buttons copy the expected masked/safe or plate-specific values according to the action.
  - Default share does not include plate content.
  - Explicit content share warns before including the plate in the hash.
  - Mobile layout prevents overflow for long invalid input and diagnostics.
  - No visible text claims official lookup or vehicle existence.
- Playwright scenarios:
  - Route renders in PT-BR and smoke renders in EN/ES.
  - Valid PIV and old flows pass.
  - Conversion table edge cases pass.
  - Invalid diagnostics and clear button pass.
  - Privacy checks assert typed plate is not present in request URLs, local/session storage, cookies, IndexedDB metadata, or default share URLs.
  - Category and tools catalog navigation include the new route.
- Lint/build commands:
  - `corepack pnpm test -- lib/tools/license-plate.test.ts lib/constants.test.ts` or the actual helper test path.
  - `corepack pnpm run validate:messages`.
  - `corepack pnpm lint`.
  - `corepack pnpm build` with the repo's normal placeholder env if required.
  - Focused `corepack pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium` or equivalent.
  - `git diff --check`.
- Acceptance criteria:
  - The tool validates only Brazilian plate syntax and conversion table behavior.
  - The route, registry, category, messages, tests, and SEO content are wired in PT-BR/EN/ES.
  - Default URL/share behavior is plate-content-safe.
  - Official source links, access dates, effective dates, and limitations remain visible in this plan and reflected in UI disclaimer copy.
  - No app code stores, sends, saves, favorites, or analytics-logs typed plate content.

## Implementation Notes

- Status updates:
  - `2026-07-07`: Planner wrote decision `new` for claimed local DB row rank 23, route `/validadores/validador-placa`, plan path `docs/tool-plans/validador-placa.md`.
  - `2026-07-07`: Creator started implementation after orchestrator handoff confirmed DB row `In Progress` with stage `implementation`; app code edits are now in scope.
  - `2026-07-07 09:55 -0300`: Creator implemented the browser-only plate validator and left DB handoff at `In Progress` / `implementation` for orchestrator review and tester validation.
  - `2026-07-07 10:09 -0300`: Creator completed review-fix handoff for accepted findings only. DB remains `In Progress` with stage `review`; Postgres was not updated.
  - `2026-07-07 10:20 -0300`: Independent tester validation passed. Tester updated only this plan and `tests/e2e/license-plate-validator.spec.ts`; DB was not read because `AGENT_BACKLOG_DATABASE_URL` was unset and was not updated.
- Files changed:
  - `docs/tool-plans/validador-placa.md`
  - `lib/tools/license-plate.ts`
  - `lib/tools/license-plate.test.ts`
  - `lib/analytics/ga4.ts`
  - `lib/analytics/ga4.test.ts`
  - `components/tools/validators/license-plate-validator-client.tsx`
  - `app/[locale]/validadores/validador-placa/page.tsx`
  - `lib/constants.ts`
  - `lib/constants.test.ts`
  - `messages/pt-br/catalog/tools.json`
  - `messages/en/catalog/tools.json`
  - `messages/es/catalog/tools.json`
  - `messages/pt-br/directories.json`
  - `messages/en/directories.json`
  - `messages/es/directories.json`
  - `messages/pt-br/tools/validador-placa.json`
  - `messages/en/tools/validador-placa.json`
  - `messages/es/tools/validador-placa.json`
  - `tests/e2e/license-plate-validator.spec.ts`
- Validation results:
  - Planner overlap checks found no duplicate route, helper, component, message namespace, registry entry, or prior plan.
  - Official sources checked and recorded with source dates and limitations.
  - `corepack pnpm test -- lib/tools/license-plate.test.ts`: passed; Vitest reported 67 non-e2e files and 781 tests under the repo config.
  - `corepack pnpm test -- lib/tools/license-plate.test.ts lib/constants.test.ts`: passed; Vitest reported 67 non-e2e files and 782 tests under the repo config.
  - `corepack pnpm run validate:messages`: passed.
  - `corepack pnpm lint`: passed.
  - `corepack pnpm build`: failed before Next.js because `DATABASE_URL` is required by Prisma config.
  - Placeholder-env `corepack pnpm build` inside the sandbox failed on Prisma cache `EPERM` under `~/.cache/prisma`.
  - Elevated placeholder-env `corepack pnpm build`: passed; route list includes `/[locale]/validadores/validador-placa` for `pt-br`, `en`, and `es`.
  - Sandboxed focused Playwright `PORT=3233 ... corepack pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium`: failed before assertions with the known macOS Chromium MachPort permission error.
  - Elevated focused Playwright `PORT=3234 ... corepack pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium`: passed 4/4.
  - `git diff --check`: passed for tracked modifications.
- Review-fix findings addressed:
  - `blocking(privacy)`: Hydrating an explicit `#conteudo=1&placa=...` fragment now fills the plate input but leaves the include-content checkbox off, so a subsequent Share click is settings-only unless the user opts in during the current session.
  - `issue(validation)`: `convertOldPlateToMercosul` and `convertMercosulToOldPlate` now return `null` when normalization reports unsupported characters, control characters, or multiple values. Unit regressions cover underscore, tab, and multiline inputs for both directions.
  - `security(analytics)`: GA4 URL sanitization now has route-specific handling for `/validadores/validador-placa` and localized `/en`/`/es` variants, preserving only safe `modo=mercosul|antiga` and stripping plate/content/hash/unknown params before pageview dispatch.
  - `test-gap(privacy)`: Focused Playwright coverage now asserts typed plate content stays out of normal request URLs, localStorage, sessionStorage, cookies, IndexedDB metadata, and default share URLs; no save/favorite button is present; hydrated hash content is not re-shared until the checkbox is manually enabled.
- Review-fix validation results:
  - `corepack pnpm test -- lib/tools/license-plate.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed; Vitest reported 67 non-e2e files and 786 tests under the repo config.
  - `corepack pnpm lint`: passed.
  - `corepack pnpm run validate:messages`: not rerun in this review-fix pass because no message files were changed.
  - Sandboxed focused Playwright `PORT=3235 PLAYWRIGHT_WEB_SERVER_COMMAND='corepack pnpm dev --hostname localhost --port 3235' corepack pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium`: failed before assertions with Chromium MachPort permission error `bootstrap_check_in ... Permission denied (1100)`.
  - Elevated focused Playwright `PORT=3236 PLAYWRIGHT_WEB_SERVER_COMMAND='corepack pnpm dev --hostname localhost --port 3236' corepack pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium`: passed 4/4.
  - `git diff --check`: passed.
- Tester findings:
  - Passed independent tester validation for route `/validadores/validador-placa`.
  - Added missing EN/ES smoke coverage to `tests/e2e/license-plate-validator.spec.ts`; existing focused e2e coverage already covered PT-BR route load, valid PIV, old PNU conversion, no-old-equivalent PIV, invalid diagnostics, safe default live URL/default share, explicit hash-only content share, hydrated hash sanitization without automatic re-share, clipboard actions, category/directory exposure, request URL privacy, local/session storage, cookies, IndexedDB metadata, no save/favorite button, mobile no-overflow, and console/page errors.
  - DB read attempt with `psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-placa -f scripts/backlog/get_item.sql` was not possible because `AGENT_BACKLOG_DATABASE_URL` was unset in the tester shell. Per orchestrator handoff, DB should remain `In Progress` / `testing`; tester did not update Postgres.
  - Initial `pnpm run test:e2e -- tests/e2e/license-plate-validator.spec.ts --project=chromium` path with `PORT=3240` failed before Playwright because the local pnpm wrapper aborted on the no-TTY modules purge prompt.
  - Sandboxed direct focused Playwright `CI=true PORT=3241 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3241' ./node_modules/.bin/playwright test tests/e2e/license-plate-validator.spec.ts --project=chromium` failed before assertions with the known macOS Chromium MachPort permission error `bootstrap_check_in ... Permission denied (1100)`.
  - Elevated baseline focused Playwright before the EN/ES addition passed 4/4: `CI=true PORT=3242 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3242' ./node_modules/.bin/playwright test tests/e2e/license-plate-validator.spec.ts --project=chromium`.
  - Elevated updated focused Playwright passed 6/6 after EN/ES smoke coverage: `CI=true PORT=3243 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3243' ./node_modules/.bin/playwright test tests/e2e/license-plate-validator.spec.ts --project=chromium`.
  - Unit/analytics/registry checks passed: `CI=true ./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/license-plate.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` reported 3 files and 26 tests passed.
  - Message validation passed: `node scripts/validate-messages.mjs`.
  - Lint passed: `./node_modules/.bin/eslint`.
  - Build passed with placeholder env after direct Prisma generation: `CI=true DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/calculaderia?schema=public' AUTH_SECRET='test-secret-for-build' NEXTAUTH_SECRET='test-secret-for-build' NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/prisma generate` and `CI=true DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:5432/calculaderia?schema=public' AUTH_SECRET='test-secret-for-build' NEXTAUTH_SECRET='test-secret-for-build' NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next build`. Build output listed `/[locale]/validadores/validador-placa` for `pt-br`, `en`, and `es`.
- Final status:
  - Tester validation passed. DB item should remain `In Progress` with stage `testing` for orchestrator finalization; tester did not update Postgres directly.
