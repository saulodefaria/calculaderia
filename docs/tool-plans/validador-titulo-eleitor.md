---
slug: "validador-titulo-eleitor"
familyId: "validadores"
primaryCategoryId: "documentos"
backlogRank: 25
primaryKeyword: "validador título de eleitor"
decision: "new"
targetRoute: "/validadores/validador-titulo-eleitor"
status: "verified"
createdAt: "2026-07-08"
updatedAt: "2026-07-08"
---

# Validador de Título de Eleitor Plan

## Backlog Row

- Rank: 25
- Original status: `In Progress`
- Stage: `implementation`
- Slug: `validador-titulo-eleitor`
- Branch: `codex/validador-titulo-eleitor-tool`
- Primary keyword: `validador título de eleitor`
- Cluster keywords: `validar titulo eleitor`; `titulo eleitoral valido`
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `documentos`
- Opportunity score: 69
- Volume/CPC/SEO difficulty: not provided in the DB row.
- Idea type: `New`
- Notes: `Public check-digit algorithm; avoid electoral-service claims.`
- Done ref: `https://github.com/saulodefaria/calculaderia/pull/60`
- Plan path: `docs/tool-plans/validador-titulo-eleitor.md`
- Target route: `/validadores/validador-titulo-eleitor`
- Claimed by: `019f41b5-d97c-7211-a703-6a0a0feca23d`
- Claim expires at: `2026-07-10T00:32:22.14916+00:00`

## Decision

- Decision: `new`
- Target route: `/validadores/validador-titulo-eleitor`
- Plan status: `verified`
- Buildability: buildable.
- Rationale: The claimed row is a document-number validator with a public check-digit rule and no existing route, registry entry, helper, translation namespace, test file, or prior plan in this worktree. The target route matches the primary keyword and belongs under the existing `validadores` family and `documentos` category. The tool must be framed as local syntax/check-digit validation only, not as a TSE status, eligibility, regularity, voting-place, or e-Título lookup.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores`, `app/[locale]/validadores/cpf`, `app/[locale]/validadores/cnpj`, `app/[locale]/validadores/formatador-cpf-cnpj`, `app/[locale]/validadores/validador-email`, `app/[locale]/validadores/validador-cartao`, dynamic family/category routes, and current top-level families under `calculadoras`, `geradores`, `matematica`, `datas`, `texto`, `cores`, and `dev`. No `/validadores/validador-titulo-eleitor` route exists.
- Registry/categories checked: `lib/constants.ts` already defines `ToolFamilyId: "validadores"` and validator categories `documentos`, `contato`, and `pagamentos`. Current document validators are `cpf`, `cnpj`, and `formatador-cpf-cnpj`. Add this tool to the existing `documentos` category; no new family or category is needed.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/payment-card.ts`, `lib/tools/email.ts`, `components/tools/validators/*`, `components/tools/url-state.ts`, `messages/*/catalog/tools.json`, `messages/*/directories.json`, and `messages/*/tools/*`. Current helpers cover CPF/CNPJ, CPF/CNPJ formatting, email syntax, and payment-card Luhn validation only.
- Prior plans checked: current `docs/tool-plans/*.md` and `docs/calculator-plans/*.md`. Adjacent references are `formatador-cpf-cnpj.md`, `validador-email.md`, and `validador-cartao.md`; none covers título eleitoral. Archived markdown backlog snapshots were not read.
- Text search checked: `validador-titulo-eleitor`, `titulo-eleitor`, `título de eleitor`, `titulo eleitoral`, `eleitor`, `validar titulo eleitor`, `titulo eleitoral valido`, and `validadores` across routes, registry, tool logic, components, messages, tests, and prior plans. No duplicate implementation or plan was found.
- Overlap conclusion: Build a new route. Reuse the current validator layout, i18n/catalog conventions, document category, and sensitive-identifier privacy pattern. Do not merge into CPF/CNPJ because título eleitoral has a different structure, UF code table, and check-digit contract.

## User Intent And Scope

- Target user: A Brazilian user, support analyst, public-service form reviewer, QA tester, spreadsheet cleaner, or developer who needs to check whether a typed voter registration number has the expected numeric structure and check digits before using it elsewhere.
- User job: Paste or type one título de eleitor number, see whether its format, UF code, and two check digits are internally consistent, get a canonical display, and understand what the result does not prove.
- In scope:
  - Single-value browser-only validation.
  - Accept ASCII digits and common visual separators such as spaces, dots, hyphens, and non-breaking spaces.
  - Canonical 12-digit interpretation with groups for sequence, UF code, and two check digits.
  - Attention state for values with fewer than 12 digits when a left-padded canonical candidate is possible, because the TSE rule says the issued number may have up to 12 digits and leading zeros in the sequential part may be omitted.
  - UF code table `01` through `28`, including `28` for exterior/ZZ, with the UF name in the result.
  - Two check digits based on Módulo 11: first over the sequential part, second over the UF code plus first check digit.
  - Public factor convention used by common implementations: sequence weights `[2,3,4,5,6,7,8,9]`; UF plus first check digit weights `[7,8,9]`; remainder `10` becomes `0`; for UF `01` and `02`, remainder `0` becomes `1`.
  - Clear diagnostic messages for empty input, unsupported characters, incomplete length, too many digits, invalid UF, repeated fake-looking sequence, and check-digit mismatch.
  - Copy canonical number, copy formatted number, copy result summary, clear input, and safe share link.
- Out of scope:
  - TSE/e-Título/Título Net lookup, situação eleitoral, regularidade, quitação, cancelamento, suspensão, local de votação, zona/seção eleitoral, voter identity, voting eligibility, QR code authenticity, document issuance, regularization, debt/fine lookup, legal advice, or electoral-service workflow.
  - Bulk CSV/spreadsheet processing, file upload, account save, local history, server API, or third-party validation service.
  - Claims that a mathematically valid number exists in the Justiça Eleitoral database or belongs to a person.
- Sensitive-topic caveats:
  - Título de eleitor is a personal civic identifier. The default live URL and default share URL must not contain the entered number.
  - Browser-only validation reduces intentional server exposure, but users can still expose the number through screenshots, clipboard, browser extensions, analytics bugs, or explicit content-bearing links.
  - UI copy must say "dígitos conferem", "estrutura matemática", or "formato compatível"; avoid "título regular", "eleitor apto", "cadastro confirmado", "consulta oficial", or "validado pelo TSE".

## Tool Contract

- Inputs:
  - `titulo`: one local input field for a single título de eleitor number.
  - `conteudo`: optional explicit share flag used only in a URL fragment, never in the live query string.
- Defaults:
  - Empty input.
  - No live query params.
  - Default share link includes only the route.
  - Explicit content sharing is off.
- Validation rules:
  - Trim leading/trailing ASCII whitespace for diagnostics.
  - Keep ASCII digits `0-9`; ignore only a small allowlist of visual separators: regular spaces, tabs, line breaks, non-breaking spaces, dots, and hyphens.
  - Treat letters, emoji, punctuation outside the allowlist, and non-ASCII digits as unsupported characters.
  - If no digits are present, status `empty`.
  - If there are more than 12 digits, status `invalidFormat`/`tooLong`.
  - If there are 1 to 4 digits, status `incomplete`.
  - If there are 5 to 11 digits, compute a left-padded 12-digit candidate for diagnostics and return an attention status. The UI may say "conferência com zeros à esquerda" and show the canonical candidate, but should not silently rewrite the user's input.
  - If there are exactly 12 digits, validate the canonical value directly.
  - Split canonical digits as `sequence = digits[0..7]`, `uf = digits[8..9]`, and `checkDigits = digits[10..11]`.
  - Reject UF codes outside `01` through `28`, including `00` and `29+`.
  - Reject all-identical 12-digit values before claiming check-digit success.
  - Compute first check digit from the eight sequence digits with weights `[2,3,4,5,6,7,8,9]` and Módulo 11.
  - Compute second check digit from the two UF digits plus the first computed check digit with weights `[7,8,9]` and Módulo 11.
  - Normalize check-digit remainders with the public title-election convention: `10 -> 0`; `0 -> 1` only for UF `01` and `02`; otherwise the digit is the remainder.
  - Compare expected check digits to the provided final two digits.
  - Invalid query or fragment params must fall back to defaults without crashing.
- Outputs:
  - Overall status: `empty`, `incomplete`, `attention`, `invalidFormat`, `invalidUf`, `invalidChecksum`, or `validChecksum`.
  - Canonical 12-digit value when available.
  - Formatted value, suggested as `0000 0000 00 00`.
  - Sequence part, UF code, UF name, provided DVs, expected DVs, and whether left-padding was assumed.
  - Diagnostic checklist: input characters, length/canonicalization, UF code, first check digit, second check digit, and privacy.
  - Main explanation in plain language.
  - Copyable canonical number, formatted number, and masked/safe summary.
- Result explanations:
  - Success: the number has a compatible structure and the two check digits match the public Módulo 11 rule.
  - Failure: the number may have a typo, missing/extra digits, unsupported characters, invalid UF code, or mismatched check digits.
  - Attention: the check was made on a left-padded canonical candidate; the user should compare with the official document or e-Título.
  - Scope: the result does not prove active registration, regular situation, voting eligibility, address, polling place, voter identity, or official database existence.
- URL params:
  - Do not write `titulo`, canonical value, UF, result, or diagnostics to `window.location.search`.
  - Default live URL should remain the route path only.
  - Optional explicit content share may use a fragment such as `#conteudo=1&titulo=004356870906`.
  - Read `titulo` only from the hash when `conteudo=1` is present.
  - After hydrating a content-bearing fragment, sanitize the address bar back to the route path and clear the hash.
  - Enforce a small fragment length budget, for example 256 characters.
  - Ignore and remove hostile content-like params from query/hash, including `titulo`, `valor`, `numero`, `inscricao`, `eleitor`, `q`, `conteudo`, and unknown params.
- Share behavior:
  - Default share link contains no title number, no hash, and no diagnostics.
  - If include-content sharing is implemented, require an explicit checkbox or equivalent control labeled with a privacy warning.
  - Enabling content sharing must not mutate the live address bar; it only changes the URL returned by the share action.
  - Shared summaries and copied summaries should avoid unnecessary full-number exposure. Copying the canonical/formatted number can be a separate explicit action.
- Save/favorites behavior:
  - No SaveButton.
  - No favorites integration.
  - Do not store title numbers, canonical values, result details, or copied summaries in localStorage, sessionStorage, cookies, IndexedDB, analytics payloads, server logs, saved app state, or account data.

## Logic, Data, And Sources

- Logic summary:
  - Prefer a new pure helper module such as `lib/tools/titulo-eleitor.ts` instead of adding more responsibility to `lib/tools/documents.ts`.
  - Define types for validation status, issue codes, UF metadata, diagnostics, normalized state, search/share helpers, and formatted output.
  - Implement small pure helpers: `normalizeTituloEleitorInput`, `canonicalizeTituloEleitorDigits`, `getTituloEleitorUf`, `calculateTituloEleitorCheckDigits`, `validateTituloEleitor`, `formatTituloEleitor`, `readTituloEleitorContentFromFragment`, and `buildTituloEleitorShareUrl`.
  - Keep the helper deterministic and browser-only. No network calls, server actions, database calls, TSE endpoints, or third-party packages are needed.
  - Return structured issue codes and let locale message files provide user-facing text.
  - If implementation finds an authoritative TSE source or official code that contradicts the public factor convention above, stop and update this plan before building.
- Data tables or assumptions:
  - UF code table from TSE Resolução n. 23.659/2021:
    - `01` São Paulo
    - `02` Minas Gerais
    - `03` Rio de Janeiro
    - `04` Rio Grande do Sul
    - `05` Bahia
    - `06` Paraná
    - `07` Ceará
    - `08` Pernambuco
    - `09` Santa Catarina
    - `10` Goiás
    - `11` Maranhão
    - `12` Paraíba
    - `13` Pará
    - `14` Espírito Santo
    - `15` Piauí
    - `16` Rio Grande do Norte
    - `17` Alagoas
    - `18` Mato Grosso
    - `19` Mato Grosso do Sul
    - `20` Distrito Federal
    - `21` Sergipe
    - `22` Amazonas
    - `23` Rondônia
    - `24` Acre
    - `25` Amapá
    - `26` Roraima
    - `27` Tocantins
    - `28` Exterior (ZZ)
  - The official rule says the number has up to 12 digits and leading zeros in the sequential part may be disregarded when issued. The product should handle shorter values as an attention state instead of silently asserting plain validity.
  - The exact factor sequence is not spelled out in the TSE resolution page. The plan uses the widely documented public convention and records that limitation.
- Official or authoritative sources:
  - TSE, Resolução n. 23.659, de 26 de outubro de 2021: https://www.tse.jus.br/legislacao/codigo-eleitoral/normas-editadas-pelo-tse/resolucao-no-23-659-de-26-de-outubro-de-2021
    - Relevant rule: Art. 36 says the registration number has up to 12 digits; the first eight are sequential; the next two are the UF code; the last two are check digits based on Módulo 11, first over the sequence and last over the UF code plus first check digit.
  - TSE, Título Eleitoral - FAQ: https://www.tse.jus.br/servicos-eleitorais/titulo-eleitoral/titulo-eleitoral-faq
    - Use for official service boundaries: title definition, official number/local consultation through Autoatendimento/e-Título, and canceled/suspended status caveats.
  - TSE, Autoatendimento Eleitoral - Título Net: https://www.tse.jus.br/servicos-eleitorais/titulo-eleitoral/autoatendimento-eleitoral/autoatendimento-eleitoral-titulo-net
    - Use for official-service references and to avoid claiming this tool can consult or regularize a title.
  - TSE, Aplicativo e-Título: https://www.tse.jus.br/servicos-eleitorais/servicos/aplicativo-e-titulo
    - Use for official-service references and to direct users who need official digital title/status services.
- Secondary implementation cross-check:
  - Wikipédia, `Título de eleitor`, section `Cálculo do dígito verificador`: https://pt.wikipedia.org/wiki/T%C3%ADtulo_de_eleitor
    - Use only as a secondary public cross-check for factor sequence, the `0043 5687 09 06` example, `10 -> 0`, and the São Paulo/Minas Gerais remainder-0 special case. Do not cite Wikipedia as official authority in UI copy.
- Source access dates:
  - TSE Resolução n. 23.659/2021 checked on `2026-07-08`.
  - TSE Título Eleitoral FAQ checked on `2026-07-08`.
  - TSE Autoatendimento Eleitoral - Título Net checked on `2026-07-08`.
  - TSE Aplicativo e-Título checked on `2026-07-08`.
  - Wikipédia secondary cross-check checked on `2026-07-08`.
  - Codebase overlap checked on `2026-07-08`.
- Rule/table effective dates:
  - Resolução n. 23.659 is dated `2021-10-26` and remains the TSE page used for planning on `2026-07-08`.
  - The UF code table and Módulo 11 structure are from Art. 36 of that resolution.
  - The tool does not need a periodically updated rate/table, but implementation should recheck the TSE resolution if a future legal change affects cadastro eleitoral rules.
- Freshness or maintenance risk:
  - Low for the UF table and high-level Módulo 11 structure while Resolução n. 23.659 remains current.
  - Moderate for exact factor convention because the official page found during planning does not spell out the weights or São Paulo/Minas Gerais special case. Keep tests explicit and record the source limitation.
  - Moderate product risk if users infer "valid title" as official status. Keep copy precise and link to TSE services for official consultation.
- Estimator or privacy limitations:
  - This is not an estimator and not an official electoral-service integration.
  - A compatible check digit cannot prove the title exists, is regular, active, uncanceled, unsuspended, linked to a person, or eligible for voting.
  - Browser-only processing reduces intentional server exposure, but explicit shared links and copied values can still expose the identifier.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de Título de Eleitor`
  - PT-BR meta title: `Validador de título de eleitor online`
  - PT-BR description: `Confira no navegador se um número de título de eleitor tem UF e dígitos verificadores compatíveis, sem consultar situação eleitoral.`
  - EN title: `Brazilian Voter ID Validator`
  - EN description: `Check locally whether a Brazilian voter registration number has a compatible UF code and check digits without querying electoral status.`
  - ES title: `Validador de Título Electoral Brasileño`
  - ES description: `Comprueba localmente si un número de título electoral brasileño tiene código UF y dígitos de control compatibles, sin consultar situación electoral.`
- Main form sections:
  - Input card with one title-number field, local-processing privacy note, clear action, and compact accepted-format hint.
  - Result card with status icon, formatted/canonical number, UF code/name, provided/expected DVs, and attention note when left-padding was assumed.
  - Checklist section for characters, length/canonicalization, UF code, first DV, second DV, and privacy.
  - Share section with safe default link and optional explicit include-number control.
  - Scope panel explaining local mathematical validation versus official TSE/e-Título services.
- Results sections:
  - Empty state before input.
  - Incomplete state for too few digits.
  - Attention state for left-padded candidate checks.
  - Invalid state for unsupported characters, too many digits, invalid UF, repeated fake-looking values, or DV mismatch.
  - Valid state saying the structure and check digits are compatible with the public rule.
  - Related official-service CTA for users who need situation, local de votação, regularization, or digital title.
- SEO sections:
  - What the validator checks.
  - Structure of the título de eleitor number: sequence, UF code, and two check digits.
  - What Módulo 11 means in this context.
  - Why a mathematical match is not an official situation query.
  - Privacy note for personal identifiers.
- FAQ topics:
  - `O título de eleitor é enviado para o servidor?`
  - `O que este validador confere?`
  - `Um título com dígitos corretos está regular no TSE?`
  - `O que significa o código de UF?`
  - `Por que o resultado fala em zeros à esquerda?`
  - `Onde consulto situação eleitoral, local de votação ou e-Título?`
  - `Posso compartilhar um link com o número preenchido?`
- Disclaimer or privacy copy:
  - "Esta ferramenta faz apenas uma conferência local de formato e dígitos verificadores. Ela não consulta bases da Justiça Eleitoral, não confirma regularidade, não identifica eleitor, não informa local de votação e não substitui Autoatendimento Eleitoral, e-Título ou cartório eleitoral."
  - "Não inclua o número em links compartilhados se outras pessoas não puderem vê-lo."
- Related tool links:
  - Existing current routes: `/validadores/cpf`, `/validadores/cnpj`, `/validadores/formatador-cpf-cnpj`, `/validadores/validador-email`, `/validadores/validador-cartao`.
  - Future adjacent validators when available in the target branch: `/validadores/validador-pis-pasep`, `/validadores/validador-placa`, `/validadores/validador-cep`, and `/validadores/validador-telefone`.
- Translation guidance:
  - Add `messages/pt-br/tools/validador-titulo-eleitor.json`, `messages/en/tools/validador-titulo-eleitor.json`, and `messages/es/tools/validador-titulo-eleitor.json`.
  - Add catalog entries in `messages/pt-br/catalog/tools.json`, `messages/en/catalog/tools.json`, and `messages/es/catalog/tools.json`.
  - The existing `validadores.documentos` category copy already fits. Update it only if needed to mention "título de eleitor" naturally without narrowing the category too much.
  - Translate statuses, issue codes, checklist labels, UF labels, copy/share buttons, privacy warnings, SEO sections, FAQs, and official-service disclaimers.
  - Keep route slug `/validadores/validador-titulo-eleitor` stable across locales.
  - In EN/ES, keep "Título de Eleitor", "TSE", "Justiça Eleitoral", "e-Título", "Título Net", and "UF" explained rather than replaced with misleading local equivalents.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/titulo-eleitor.ts` with pure validation helpers, UF code table, default state, issue codes, diagnostics, formatter, search/share helpers, and content-fragment helpers.
  - Add `lib/tools/titulo-eleitor.test.ts`.
  - Keep existing CPF/CNPJ/email/payment-card helpers unchanged unless shared privacy utilities are intentionally extracted.
- URL state:
  - Reuse `components/tools/url-state.ts` for safe query replacement.
  - Keep live query params empty for default use.
  - Never write `titulo` to `window.location.search`.
  - Support optional explicit hash-only content share only behind an include-content control.
  - Sanitize address bar after hydrating `#conteudo=1&titulo=...`.
  - If global analytics can observe the initial URL before client cleanup, update the analytics sanitizer so `/validadores/validador-titulo-eleitor` strips title-like params and all hashes from GA page paths/locations.
- UI components:
  - Add `components/tools/validators/titulo-eleitor-validator-client.tsx`.
  - Use `ToolPageLayout`, existing Button/Input/Card/Tabs/ShareButton patterns, and lucide icons such as `BadgeCheck`, `Fingerprint`, `ShieldCheck`, `CheckCircle`, `XCircle`, `AlertTriangle`, `Copy`, and `Eraser`.
  - Use `inputMode="numeric"`, `autoComplete="off"`, `spellCheck={false}`, no sensitive `name` attribute, and no server form action.
  - Add stable test ids for input, status, canonical output, formatted output, UF output, expected DVs, provided DVs, diagnostics, copy canonical, copy formatted, copy summary, clear, include-content control, and share button.
  - Ensure long pasted strings wrap and mobile layouts do not overflow.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-titulo-eleitor/page.tsx`.
  - Use `generateToolPageMetadata(locale, "validador-titulo-eleitor")`.
  - Render with `ToolPageLayout locale={locale} toolId="validador-titulo-eleitor"`.
- Registry/family/category:
  - Add a `tools` entry in `lib/constants.ts`:
    - `id: "validador-titulo-eleitor"`
    - `title: "Validador de Título de Eleitor"`
    - `href: "/validadores/validador-titulo-eleitor"`
    - `familyId: "validadores"`
    - `primaryCategoryId: "documentos"`
    - `categoryIds: ["documentos"]`
    - `available: true`
    - `icon: Fingerprint` or `BadgeCheck`
    - `sitemapPriority` around `0.74`
    - `stateMode: "query"`
    - `seoApplicationCategory: "UtilityApplication"`
  - No new `ToolFamilyId` or `ToolCategoryId` should be added.
- Messages:
  - Add `messages/{pt-br,en,es}/tools/validador-titulo-eleitor.json`.
  - Update `messages/{pt-br,en,es}/catalog/tools.json`.
  - Include all issue-code labels, diagnostics, buttons, FAQ, privacy/disclaimer text, SEO title/description, source/scope copy, and related-tool labels.
- Unit tests:
  - Valid public example `004356870906` with UF `09` Santa Catarina and expected DVs `06`.
  - Same example with changed final digit returns `invalidChecksum`.
  - UF code `00` and `29` return `invalidUf`.
  - Unsupported letters/emoji/non-ASCII digits return character issues.
  - Input with separators normalizes correctly.
  - Too many digits returns `tooLong`.
  - Fewer than 12 digits with possible left padding returns attention and canonical candidate.
  - São Paulo/Minas Gerais remainder-zero special-case fixtures, for example synthetic checks for `000000140116`, `000000140213`, and second-DV remainder-zero candidates.
  - Share builder omits content by default and includes sanitized fragment only with explicit content sharing.
  - Fragment reader enforces length budget and ignores content without `conteudo=1`.
- E2E hooks/tests:
  - Add `tests/e2e/titulo-eleitor-validator.spec.ts`.
  - Cover default route load, valid example, invalid DV, invalid UF, shorter left-padded attention case, unsupported characters, clear/copy/share behavior, explicit content hash sharing, hash hydration cleanup, hostile query/hash cleanup, no SaveButton/favorite button, no storage/API leaks, EN/ES smoke, discovery/category/sitemap, and mobile no-overflow.
- Backlog updates:
  - Do not update the DB directly in creator/tester work. The orchestrator should use the backlog scripts after each stage.
  - Do not edit archived markdown backlog snapshots.

## Test Plan

- Unit scenarios:
  - Run focused Vitest for the new helper and affected registry tests, for example `corepack pnpm test -- lib/tools/titulo-eleitor.test.ts lib/constants.test.ts`.
  - Include deterministic fixtures for valid, invalid checksum, invalid UF, special remainder handling, left-padding attention, unsupported characters, and share URL behavior.
- URL-state scenarios:
  - Default live URL contains no number.
  - Default share URL contains no number.
  - Explicit content share uses hash only and only after opt-in.
  - Loading content hash hydrates once and then sanitizes the address bar.
  - Query params such as `?titulo=004356870906&valor=...` are ignored/removed and do not hydrate input.
- Browser scenarios:
  - PT-BR route renders at `/validadores/validador-titulo-eleitor`.
  - Valid example shows compatible structure, UF, and expected DVs.
  - Invalid examples show focused, non-official diagnostic copy.
  - No TSE lookup, e-Título login, or official-status claim appears.
  - Copy actions copy only the intended value.
  - No console/page errors and no horizontal overflow on mobile.
- Playwright scenarios:
  - Focused spec for form behavior and privacy.
  - Locale smoke for `/en/validadores/validador-titulo-eleitor` and `/es/validadores/validador-titulo-eleitor`.
  - Directory/category/sitemap checks for the new route.
  - Storage/network checks ensuring no title number in requests, localStorage, sessionStorage, cookies, IndexedDB, favorites, or API calls.
- Lint/build commands:
  - `corepack pnpm run validate:messages`
  - `corepack pnpm lint`
  - `corepack pnpm build` with the repo's required placeholder env values if needed.
  - `corepack pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts` or the repo's focused Playwright invocation.
  - `git diff --check`
- Acceptance criteria:
  - The route exists in all supported locales and is discoverable through the registry/category/sitemap.
  - The tool validates title-number structure and DVs locally with clear diagnostics.
  - Default URL/share/storage/analytics behavior does not expose the title number.
  - Copy and explicit content sharing are intentional and labeled.
  - User-facing copy avoids official TSE status claims and links users to TSE services for official consultation.

## Implementation Notes

- Status updates:
  - 2026-07-08: Planner wrote this plan from the claimed local Postgres row only; decision `new`, status `planned`.
  - 2026-07-08: DB row read succeeded with `ok: true`, rank 25, status `In Progress`, stage `planning`, score 69, target route `/validadores/validador-titulo-eleitor`, and notes `Public check-digit algorithm; avoid electoral-service claims.`
  - 2026-07-08: Overlap inspection found no existing route, registry entry, helper, component, message namespace, test, or prior plan for título eleitoral.
  - 2026-07-08: Official TSE source confirms the 12-digit structure, UF table, and Módulo 11 check-digit structure, but does not spell out every weight/special-case detail. This plan records the public factor convention and requires creator tests to make that limitation explicit.
  - 2026-07-08: Creator implementation run started after orchestrator handoff confirmed the DB item is `In Progress` / `implementation`; plan status set to `in_progress`.
  - 2026-07-08: Creator implementation completed locally after the delegated creator worker stalled without edits. Plan status set to `implemented`; DB remains `In Progress` / `implementation` until orchestrator moves the review gate.
  - 2026-07-08: PR-review gate found one issue/test-gap: 5-11 digit left-padded checksum failures were shown as `invalidChecksum` rather than the plan's attention state. Fixed status precedence so `leftPadded` remains the primary status after hard format/UF blockers, and added a regression for `4356870907` -> canonical `004356870907` with `attention` plus `invalidChecksum`.
  - 2026-07-08: Repeat review found the UI explanation for padded invalid checks still used the generic attention copy. Added `attentionValidChecksum` / `attentionInvalidChecksum` explanation keys in PT-BR/EN/ES and Playwright coverage for `4356870907` showing attention status, canonical value, expected/provided DVs, invalid-checksum diagnostics, and non-contradictory copy.
  - 2026-07-08: Independent tester validation completed. Plan status set to `verified`; DB was read only and still shows `In Progress` / `testing`.
  - 2026-07-08: Draft PR opened at `https://github.com/saulodefaria/calculaderia/pull/60`; plan done ref recorded before DB finalization.
- Files changed:
  - `docs/tool-plans/validador-titulo-eleitor.md`
  - `lib/tools/titulo-eleitor.ts`
  - `lib/tools/titulo-eleitor.test.ts`
  - `components/tools/validators/titulo-eleitor-validator-client.tsx`
  - `app/[locale]/validadores/validador-titulo-eleitor/page.tsx`
  - `lib/constants.ts`
  - `lib/analytics/ga4.ts`
  - `lib/analytics/ga4.test.ts`
  - `messages/pt-br/catalog/tools.json`
  - `messages/en/catalog/tools.json`
  - `messages/es/catalog/tools.json`
  - `messages/pt-br/tools/validador-titulo-eleitor.json`
  - `messages/en/tools/validador-titulo-eleitor.json`
  - `messages/es/tools/validador-titulo-eleitor.json`
  - `tests/e2e/titulo-eleitor-validator.spec.ts`
- Validation results:
  - `git diff --check -- docs/tool-plans/validador-titulo-eleitor.md`: passed with no whitespace warnings.
  - `corepack pnpm test -- lib/tools/titulo-eleitor.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed, 67 files / 780 tests.
  - `corepack pnpm run validate:messages`: passed.
  - `corepack pnpm lint`: passed.
  - `corepack pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts`: sandboxed Chromium failed before assertions with macOS `MachPortRendezvousServer` permission denied.
  - Elevated `corepack pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts --reporter=line`: passed, 7 Chromium tests.
  - Review-fix rerun `corepack pnpm test -- lib/tools/titulo-eleitor.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed, 67 files / 780 tests.
  - Review-fix rerun `corepack pnpm lint`: passed.
  - Review-fix rerun elevated `corepack pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts --reporter=line`: passed, 7 Chromium tests.
  - Review-fix rerun `git diff --check`: passed.
  - Second review-fix rerun `corepack pnpm run validate:messages`: passed.
  - Second review-fix rerun `corepack pnpm lint`: passed.
  - Second review-fix rerun `corepack pnpm test -- lib/tools/titulo-eleitor.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed, 67 files / 780 tests.
  - Second review-fix rerun elevated `corepack pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts --reporter=line`: passed, 7 Chromium tests.
  - Second review-fix rerun `git diff --check`: passed.
  - Plain `corepack pnpm build`: failed because this worktree has no `.env` and `DATABASE_URL` was unset.
  - Env-loaded `corepack pnpm build`: sandboxed Prisma failed with `EPERM` updating `~/.cache/prisma`.
  - Elevated env-loaded `corepack pnpm build`: passed; route list includes `/[locale]/validadores/validador-titulo-eleitor` for `pt-br`, `en`, and `es`.
  - Tester DB read `set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; psql "${AGENT_BACKLOG_DATABASE_URL:-$DATABASE_URL}" -v kind=tool -v slug=validador-titulo-eleitor -f scripts/backlog/get_item.sql`: passed; returned `ok: true`, status `In Progress`, stage `testing`, route `/validadores/validador-titulo-eleitor`, plan path `docs/tool-plans/validador-titulo-eleitor.md`, branch `codex/validador-titulo-eleitor-tool`.
  - Tester `pnpm run test:e2e -- tests/e2e/titulo-eleitor-validator.spec.ts --reporter=line`: did not reach Playwright because the local pnpm runtime tried to purge/reinstall modules and stopped with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.
  - Tester direct sandboxed browser run `PORT=3250 PLAYWRIGHT_BASE_URL=http://localhost:3250 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3250' PLAYWRIGHT_WORKERS=1 PLAYWRIGHT_SKIP_WARMUP=1 NEXT_DIST_DIR=.next-e2e NEXT_TELEMETRY_DISABLED=1 AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3250 NEXTAUTH_URL=http://localhost:3250 ./node_modules/.bin/playwright test tests/e2e/titulo-eleitor-validator.spec.ts --reporter=line`: failed before assertions because Chromium could not register `MachPortRendezvousServer` inside the macOS sandbox.
  - Tester elevated direct browser run with the same command on port `3251`: passed, 7 Chromium tests.
  - Tester `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/titulo-eleitor.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed, 3 files / 20 tests.
  - Tester `node scripts/validate-messages.mjs`: passed.
  - Tester targeted `./node_modules/.bin/eslint tests/e2e/titulo-eleitor-validator.spec.ts lib/tools/titulo-eleitor.ts components/tools/validators/titulo-eleitor-validator-client.tsx 'app/[locale]/validadores/validador-titulo-eleitor/page.tsx' lib/analytics/ga4.ts lib/constants.ts`: passed.
  - Tester `lsof -nP -iTCP:3250 -iTCP:3251 -sTCP:LISTEN`: no leftover dev server listeners.
  - Tester final `git diff --check`: passed.
  - Tester final `git diff --check --no-index /dev/null docs/tool-plans/validador-titulo-eleitor.md`: no whitespace warnings; exit code `1` is expected for a new-file diff.
- Tester findings:
  - Pass. Existing focused e2e coverage was sufficient; no `tests/e2e` changes were needed.
  - Browser coverage passed for PT-BR route load/no redirect loop; valid `004356870906`; invalid DV `004356870907`; invalid UF `004356872906`/`29`; left-padded valid `4356870906`; left-padded invalid attention `4356870907`; unsupported letters/emoji; default live URL and default share without the title number; explicit content sharing as hash-only; hydration from `#conteudo=1&titulo=004356870906` followed by address-bar cleanup and default re-share without content; hostile query/hash cleanup without hydration; no SaveButton/favorites; no title identifier in storage, cookies, IndexedDB, or captured request URLs; EN/ES route smoke; directory/category/sitemap discovery; mobile no-horizontal-overflow; and no non-auth console/page errors.
  - Screenshots were not captured because the focused browser suite passed without visual anomalies.
  - DB expected next stage for orchestrator finalization: keep status `In Progress` and move stage from `testing` to `verified`; PR/final done handling can later set the row to `Done` / `pr`.
- Final status:
  - `verified`


## Integration validation — 2026-09-04

- Tested with current `main` (`c1a82bac`) and open PRs #53, #57, #58, #60, and #62 in an isolated checkout; shared registry, locale catalog, URL-state, and analytics conflicts preserve both additions.
- `pnpm test`: 83 files / 1,016 tests passed. `pnpm validate:messages`, `pnpm lint`, `pnpm build`, and `git diff --check` passed. The production build used Node 22.21.1, placeholder local auth/database configuration, and network access for Google Fonts.
- Focused browser regression: `titulo-eleitor-validator.spec.ts` passed 7/7; the combined five-PR plus email-validator run passed 37/37.
- `PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3114 pnpm exec playwright test --reporter=line`: full suite passed 304/304 against `next start`, without retries.
- Browser inspection confirmed visible forms and expected results. Automated coverage includes locale smoke tests, mobile overflow, relevant invalid-input states, share restoration/privacy, and unauthenticated save redirects for calculators.
- Validation status: passed locally; fresh hosted CI is required before merging. No backlog DB row was claimed or changed during this review; existing backlog finalization is outside this validation pass.
