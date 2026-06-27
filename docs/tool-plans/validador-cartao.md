---
slug: "validador-cartao"
familyId: "validadores"
primaryCategoryId: "pagamentos"
backlogRank: 13
primaryKeyword: "validador de cartão de crédito"
decision: "new"
targetRoute: "/validadores/validador-cartao"
status: "verified"
createdAt: "2026-06-27"
updatedAt: "2026-06-27"
---

# Validador de Cartão de Crédito Plan

## Backlog Row

- Rank: 13
- Original status: `In Progress`
- Stage: `testing`
- Slug: `validador-cartao`
- Branch: `codex/validador-cartao-tool`
- Primary keyword: `validador de cartão de crédito`
- Cluster keywords: not provided in the claimed DB row.
- Family/category: backlog family `validadores`; planned family `validadores`; planned category `pagamentos`
- Opportunity score: not provided in the claimed DB row.
- Idea type: `New`
- Notes: not provided in the claimed DB row.
- Done ref: not provided in the claimed DB row.
- Plan path: `docs/tool-plans/validador-cartao.md`
- Target route: `/validadores/validador-cartao`
- Claim expires at: `2026-06-29T09:05:44.381281+00:00`

## Decision

- Decision: `new`
- Target route: `/validadores/validador-cartao`
- Buildability: buildable.
- Rationale: The current target branch and `origin/main` do not contain a card-number validator route, helper, test, translation namespace, registry entry, or plan file. The claimed route matches the primary keyword and belongs under the existing `validadores` family. Add a new `pagamentos` validator category because payment-card PAN validation is neither a Brazilian document validator nor a contact/email validator.
- Automation memory note: Daily Tool Backlog Builder memory records an earlier `validador-cartao` implementation and tester pass on 2026-06-26 in another worktree/stale branch context, but this clean branch does not contain those files and no canonical PR is recorded in memory. The creator may use that prior work as implementation reference if available, but the DB row should proceed as a buildable new plan for this branch rather than selecting a different backlog item.

## Similarity Check

- Existing routes checked: `app/[locale]/validadores/page.tsx`, `app/[locale]/validadores/cpf/page.tsx`, `app/[locale]/validadores/cnpj/page.tsx`, `app/[locale]/validadores/formatador-cpf-cnpj/page.tsx`, `app/[locale]/validadores/validador-email/page.tsx`, dynamic family/category routes, and current top-level tool routes under `calculadoras`, `geradores`, `matematica`, `datas`, `texto`, `cores`, and `dev`.
- Registry/categories checked: `lib/constants.ts` already defines `ToolFamilyId: "validadores"` and categories `documentos` and `contato`. Existing validator entries are `cpf`, `cnpj`, `formatador-cpf-cnpj`, and `validador-email`. No `pagamentos` category and no `validador-cartao` entry exist.
- Related modules/translations checked: `lib/tools/documents.ts`, `lib/tools/email.ts`, `components/tools/validators/*`, `components/tools/url-state.ts`, `messages/pt-br.json`, `messages/en.json`, `messages/es.json`, and focused e2e specs for email and CPF/CNPJ formatter privacy patterns.
- Prior plans checked: current `docs/tool-plans` and `docs/calculator-plans` include adjacent validator/tool plans but no `docs/tool-plans/validador-cartao.md`. Relevant adjacent plans are `validador-email.md` and `formatador-cpf-cnpj.md`.
- Text search checked: `validador-cartao`, `cartao`, `cartão`, `credit`, `crédito`, `luhn`, `payment-card`, `PAN`, `mascarado`, and `validadores`.
- Overlap conclusion: Build a new route. CPF/CNPJ and email validators provide UI/privacy patterns but are not substitutes. CPF/CNPJ formatter patterns that share document content through hash fragments must not be reused for PAN-like payment-card data.

## User Intent And Scope

- Target user: A Portuguese-speaking user who needs to quickly check whether a typed card number has a plausible payment-card format and passes the Luhn/modulo-10 check digit test before submitting it elsewhere.
- User job: Paste or type a card number, see whether the visible digits and check digit are internally consistent, and understand that the result does not prove the card exists or can be charged.
- In scope:
  - Browser-only normalization of an entered card number.
  - Accept ASCII digits plus common visual separators such as spaces and hyphens.
  - Validate generic payment-card/PAN shape and Luhn checksum.
  - Show privacy-safe diagnostics: length, unsupported characters, repeated sequence sanity, check digit, and checksum.
  - Show a masked summary by default, with at most the last 4 digits in copy/share/result summaries.
  - Explain that the tool performs a local checksum/format check only.
- Out of scope:
  - Payment authorization, chargeability, account balance, credit limit, fraud/risk scoring, AVS, 3-D Secure, tokenization, or gateway integration.
  - Issuer, bank, cardholder, country, BIN/IIN, or network lookup.
  - CVV/CVC/CID, expiration date, cardholder name, CPF, billing address, ZIP/postal code, or any other authentication/payment details.
  - Storing, transmitting, logging, saving, favoriting, or generating real card numbers.
  - Maintaining brand-specific card ranges or relying on unofficial BIN tables.
- Sensitive-topic caveats:
  - A passing Luhn result only means the digit sequence is internally consistent. It is not proof that a card is real, active, authorized, safe, or accepted by a merchant.
  - Users should not paste real card numbers unless they accept local browser-only processing. The UI should recommend using test numbers when learning how the validator works.
  - Do not add server-side validation, remote analytics events containing the typed number, query/hash content sharing, storage, SaveButton, or favorites.

## Tool Contract

- Inputs:
  - `numero`: local component state only. One text input or textarea for a single payment-card number/PAN-like digit sequence.
  - `mascarado`: local/query setting that controls whether the on-page normalized result is fully masked. Default `true`.
  - No input fields for CVV, expiration, name, CPF, address, issuer, bank, or card network.
- Defaults:
  - Empty input.
  - Masked result enabled.
  - No URL params by default.
- Validation rules:
  - Trim leading/trailing ASCII whitespace for diagnostics.
  - Normalize by keeping ASCII digits `0-9` and ignoring common separators: spaces, tabs, line breaks, hyphen, en dash/em dash if intentionally supported, and non-breaking spaces. Prefer a small explicit separator allowlist.
  - Treat letters, punctuation other than allowed separators, emoji, and non-ASCII digits as unsupported characters.
  - If no digits are present, status `empty`.
  - Length below the chosen payment-card/PAN threshold is `incomplete`.
  - Length above 19 digits is `invalid`/`tooLong`.
  - Length in the accepted generic range can run Luhn. Use 8-19 digits if the implementation presents the result as a generic PAN-style checksum, or 12-19 if copy presents it specifically as common credit-card shape. The UI text must avoid saying "cartão real" either way.
  - Reject all-identical digit sequences such as `0000000000000000`, even if Luhn would pass, with an explicit `repeatedDigits` diagnostic.
  - Luhn pass returns status `validChecksum`; Luhn fail returns `invalidChecksum`.
  - Keep invalid-format diagnostics independent from checksum diagnostics: if unsupported characters or length issues prevent Luhn, show checksum as unavailable rather than failed.
- Outputs:
  - Overall status: empty, incomplete, invalid format, invalid checksum, or checksum valid.
  - Masked number summary, defaulting to last 4 digits only when at least 4 digits exist.
  - Digit count.
  - Check digit explanation: provided final digit and expected final digit when enough digits exist to compute it.
  - Diagnostic list with stable issue codes for tests/translations.
  - Privacy panel stating local-only processing and no storage/share of the number.
- Result explanations:
  - Success copy: "O dígito verificador confere pelo algoritmo de Luhn. Isso não confirma que o cartão existe, está ativo ou pode ser usado em uma compra."
  - Failure copy: "O dígito verificador não confere; pode haver erro de digitação, caractere extra ou número incompleto."
  - Privacy copy: "O número fica no seu navegador, não entra na URL, não é salvo e não é enviado ao servidor."
- URL params:
  - Allow only `mascarado=0` when the user explicitly disables result masking.
  - Omit `mascarado` when masking is enabled.
  - Ignore and actively remove sensitive or content-like params such as `numero`, `card`, `cartao`, `pan`, `digits`, `valor`, `entrada`, `conteudo`, `q`, and all unknown params.
  - Never hydrate input from query string or hash.
  - Remove all hash fragments from this route on mount; do not support explicit content share for card numbers.
- Share behavior:
  - Share URL contains no card digits and no hash fragment.
  - Share URL may include only `?mascarado=0` if the user explicitly changed that setting.
  - Copy result action must copy masked summary only, never the full normalized number.
- Save/favorites behavior:
  - No SaveButton.
  - No favorites integration.
  - No localStorage, sessionStorage, cookies, IndexedDB, API calls, or server actions containing the typed number.
  - If future platform behavior automatically exposes favorites for tools, this route must explicitly opt out or store only non-sensitive settings.

## Logic, Data, And Sources

- Logic summary:
  - Implement a pure helper in `lib/tools/payment-card.ts`.
  - `normalizePaymentCardInput(input)` returns trimmed input, normalized ASCII digits, unsupported characters, ignored separators, and length metadata.
  - `calculateLuhnCheckDigit(payloadDigits)` processes the payload digits right-to-left, doubles alternating digits, subtracts 9 from doubled values above 9, sums digits, and returns `(10 - (sum % 10)) % 10`.
  - `validateLuhn(fullDigits)` computes the expected check digit from all digits except the final digit and compares it to the provided final digit.
  - `validatePaymentCardNumber(input, options)` combines normalization, length diagnostics, repeated-sequence check, Luhn result, masked display, and stable issue codes.
  - `buildPaymentCardValidatorSearchParams(state)` emits only allowed settings, never card digits.
  - `readPaymentCardValidatorSearchParams(params)` accepts only `mascarado=0`; defaults to masked for any other value.
  - `buildPaymentCardValidatorShareUrl(originPath, state)` returns a query-only settings URL with no hash.
- Data tables or assumptions:
  - No issuer/BIN/IIN/card-network table.
  - No brand regexes. These drift, are often unofficial, and create false authority.
  - No sample real card data. Tests can use synthetic Luhn-valid values or public payment-provider test numbers, but UI examples should avoid encouraging real-card entry.
  - Accepted maximum length: 19 digits for generic payment-card/PAN-style validation.
  - Accepted minimum length must be documented in helper tests and copy. If using 8, phrase as generic PAN-style checksum; if using 12, phrase as common credit-card number shape.
- Official or authoritative sources:
  - ISO, ISO/IEC 7812-1:2017 public standard page: https://www.iso.org/standard/70484.html. Accessed `2026-06-27`. The public page says the standard specifies the numbering system and the IIN/PAN format, was published in 2017, and was reviewed/confirmed in 2022.
  - PCI Security Standards Council, PCI DSS overview: https://www.pcisecuritystandards.org/standards/pci-dss/. Accessed `2026-06-27`. Use as payment-account-data security context.
  - PCI Security Standards Council Glossary: https://www.pcisecuritystandards.org/glossary/. Accessed `2026-06-27`. Use definitions for PAN, cardholder data, sensitive authentication data, card verification code, masking, and truncation.
  - Google Patents mirror of US Patent US2950048A, "Computer for verifying numbers": https://patents.google.com/patent/US2950048A/en. Accessed `2026-06-27`. The patent is expired and describes the check-digit verification system underlying Luhn/modulo-10 style validation.
- Source access dates:
  - All source links above were checked on `2026-06-27`.
- Rule/table effective dates:
  - ISO/IEC 7812-1:2017 is the current public ISO page version; public page notes it was confirmed in 2022.
  - PCI DSS page is current site content as of access date; this plan does not require the app to claim PCI compliance.
  - US2950048A publication date `1960-08-23`; legal status listed as expired on Google Patents. The algorithm is stable but the patent text is an OCR/public mirror rather than modern implementation guidance.
- Freshness or maintenance risk:
  - Luhn logic is stable.
  - IIN/BIN/network ranges change and should not be implemented from unofficial tables.
  - Payment-data privacy expectations are high and can change with PCI DSS/payment-brand requirements; keep this tool local-only and data-minimizing so the implementation does not enter payment processing scope.
  - If a future change adds card brand detection, remote BIN lookup, storage, or analytics for input details, it requires a fresh security/privacy review and new authoritative sources.
- Estimator or privacy limitations:
  - This is not an estimator and not a compliance tool.
  - The page must not say it validates ownership, authorization, issuer status, available credit, fraud risk, or merchant acceptance.
  - Full PAN is cardholder data in PCI terminology. The implementation must minimize exposure: browser memory only, no URL, no storage, no network, masked output/copy/share, and no CVV/expiry/name inputs.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Validador de Cartão de Crédito`
  - PT-BR description: `Confira no navegador se um número de cartão tem formato plausível e dígito verificador Luhn válido, sem enviar ou salvar os dados.`
  - EN title: `Credit Card Validator`
  - EN description: `Check locally whether a card number has a plausible format and valid Luhn check digit without sending or saving the number.`
  - ES title: `Validador de Tarjeta de Crédito`
  - ES description: `Comprueba en el navegador si un número de tarjeta tiene formato plausible y dígito Luhn válido sin enviar ni guardar los datos.`
- Main form sections:
  - Single card-number input with label and compact help text.
  - Masked-result toggle using a switch/checkbox; default masked.
  - Clear button.
  - Copy masked result/diagnostic summary button.
  - Share settings button using a safe settings-only URL.
- Results sections:
  - Status summary with icon/color states.
  - Masked number summary.
  - Diagnostics list: format, length, repeated sequence, check digit, Luhn checksum, privacy.
  - Explanation block for what Luhn can and cannot prove.
- SEO sections:
  - How Luhn validation works, in user-friendly language.
  - Why a valid checksum does not mean the card is active.
  - Privacy note: local processing and no URL/storage.
  - Safe use guidance: avoid entering real card details on shared/public devices.
- FAQ topics:
  - "O que este validador confere?"
  - "Um cartão que passa no Luhn é válido para compra?"
  - "O número do cartão é enviado para algum servidor?"
  - "Por que não pedimos CVV, validade ou nome?"
  - "O validador identifica banco, bandeira ou titular?"
  - "Posso compartilhar o resultado?"
- Disclaimer or privacy copy:
  - "Ferramenta educativa e de conferência de digitação. Não processa pagamentos, não consulta bancos/bandeiras, não confirma titularidade, não autoriza compras e não substitui validação do emissor ou do adquirente."
  - "Por segurança, não informe CVV, validade, nome do titular ou endereço. O número digitado não entra na URL, no compartilhamento, nos favoritos nem no armazenamento do navegador."
- Related tool links:
  - Existing: `/validadores/formatador-cpf-cnpj`, `/validadores/cpf`, `/validadores/cnpj`, `/validadores/validador-email`, `/dev/regex-tester`.
  - Future candidates: `/validadores/validador-boleto`, `/validadores/validador-iban`, `/conversores/bin-iin` only if a reliable non-sensitive source is defined, and `/geradores/cartao-teste` only if explicitly scoped to synthetic/test-only numbers.
- Translation guidance:
  - `pt-br`: use "cartão", "dígito verificador", "algoritmo de Luhn", "não confirma existência, limite ou autorização".
  - `en`: use "card number", "check digit", "Luhn algorithm", "does not confirm the card exists, is active, or can be charged".
  - `es`: use "tarjeta", "dígito de control", "algoritmo de Luhn", "no confirma existencia, estado activo ni autorización".
  - Keep privacy/security language precise across locales. Do not translate into claims of payment validation, issuer lookup, or anti-fraud verification.

## Implementation Checklist

- Tool logic:
  - Add `lib/tools/payment-card.ts` with pure helpers, stable issue codes, default state, search/share helpers, masked display helpers, and no browser APIs except URL helpers where already established.
  - Add `lib/tools/payment-card.test.ts`.
  - Use `onlyDigits` style logic carefully but do not import document-specific CPF/CNPJ behavior.
- URL state:
  - Reuse `components/tools/url-state.ts` helpers for settings-only query replacement.
  - On mount, sanitize hostile query/hash values before or alongside user interaction.
  - If global analytics pageview can read the initial URL before client cleanup, update the analytics sanitizer allowlist so `/validadores/validador-cartao` strips all unknown params and hash before GA receives it.
- UI components:
  - Add `components/tools/validators/payment-card-validator-client.tsx`.
  - Use `ToolPageLayout`, existing Button/Input/Card/Tabs/Tooltip patterns, and lucide icons.
  - Keep UI compact and validator-like, not payment-flow-like.
  - Set safe input attributes: text input, `inputMode="numeric"`, `autoComplete="off"`, no `name="cc-number"`, no password manager/payment-autofill encouragement.
- Route and metadata:
  - Add `app/[locale]/validadores/validador-cartao/page.tsx`.
  - Use `generateToolPageMetadata(locale, "validador-cartao")`.
  - Add JSON-LD/application metadata consistent with other tools through registry helpers.
- Registry/family/category:
  - Add `CreditCard` or suitable lucide icon import in `lib/constants.ts`.
  - Add `ToolCategoryId` value `pagamentos`.
  - Add category `{ id: "pagamentos", familyId: "validadores", slug: "pagamentos", href: "/validadores/categorias/pagamentos", ... }`.
  - Add tool entry:
    - `id: "validador-cartao"`
    - `title: "Validador de Cartão de Crédito"`
    - `href: "/validadores/validador-cartao"`
    - `familyId: "validadores"`
    - `primaryCategoryId: "pagamentos"`
    - `categoryIds: ["pagamentos"]`
    - `available: true`
    - `sitemapPriority` around `0.74`
    - `stateMode: "query"`
    - `seoApplicationCategory: "UtilityApplication"`
- Messages:
  - Add `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` namespaces matching existing tool message structure.
  - Add family/category copy for `validadores.pagamentos`.
  - Include all issue-code labels, diagnostics, buttons, FAQ, privacy/disclaimer text, SEO title/description, and related-tool labels.
- Unit tests:
  - Luhn valid/invalid examples.
  - Expected check digit computation.
  - Separator normalization.
  - Unsupported characters and non-ASCII digit rejection.
  - Length boundaries.
  - Repeated identical digit rejection.
  - Masked display and copy summary never exposing full PAN.
  - Query parsing/building strips content and emits only allowed `mascarado=0`.
  - Hostile query/hash sanitizer helper behavior if implemented in logic.
  - Constants/registry tests for new category/tool.
  - Analytics sanitizer tests if GA pageview allowlist changes.
- E2E hooks/tests:
  - Add stable `data-testid` values for input, status, diagnostics, mask toggle, share button, copy button, clear button, privacy text, related links, category card, and sitemap/discovery checks.
  - Add `tests/e2e/payment-card-validator.spec.ts`.
- Backlog updates:
  - Planner does not update DB status or markdown backlog files.
  - Orchestrator should mark the claimed DB row planned after accepting this plan.

## Test Plan

- Unit scenarios:
  - Empty input.
  - Valid Luhn value with spaces/hyphens.
  - Invalid check digit.
  - Too short and too long.
  - Repeated digits that otherwise pass Luhn.
  - Unsupported letters/punctuation/emoji/non-ASCII digits.
  - Expected check digit for a payload.
  - Masked summary for 1-3, 4, 15, 16, and 19 digits.
  - Query/share helpers never include card digits.
  - `mascarado=0` is preserved and all other params are ignored.
- URL-state scenarios:
  - Default route has no query.
  - Toggling unmasked display adds only `?mascarado=0`.
  - Toggling back removes the query.
  - Loading `/validadores/validador-cartao?numero=4242424242424242&pan=4111111111111111#conteudo=1&card=...` clears query/hash and does not prefill the input.
  - Share URL contains no digits and no hash.
- Browser scenarios:
  - User can paste a spaced card-like number and see status/diagnostics update.
  - Copy action writes only masked result plus checksum status.
  - Clear removes input/results and URL settings if appropriate.
  - No full typed value appears in address bar, page requests, console logs, local/session storage, cookies, IndexedDB, favorites API calls, or analytics pageview/event payloads.
  - EN and ES routes render translated labels and privacy copy.
  - Mobile viewport has no horizontal overflow and result text wraps.
- Playwright scenarios:
  - Route load, breadcrumbs, category link, and tool directory discovery.
  - Valid checksum path.
  - Invalid checksum path.
  - Hostile query/hash cleanup and no input hydration.
  - Share/copy privacy.
  - No SaveButton/favorite controls/API calls.
  - Storage/cookie/IndexedDB/request URL privacy checks.
  - EN/ES smoke.
  - Sitemap contains `/validadores/validador-cartao`, `/en/validadores/validador-cartao`, and `/es/validadores/validador-cartao`.
- Lint/build commands:
  - `pnpm test -- lib/tools/payment-card.test.ts lib/constants.test.ts`
  - If pnpm prompts block this host, use direct local Vitest as in recent automation memory.
  - `pnpm lint`
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia pnpm build`
  - Focused Playwright: `PORT=<free-port> pnpm run test:e2e -- tests/e2e/payment-card-validator.spec.ts`
  - `git diff --check`
- Acceptance criteria:
  - `/validadores/validador-cartao` exists in all supported locales.
  - The tool validates Luhn/check-digit behavior deterministically in browser-only code.
  - The UI never claims the card is real, active, funded, authorized, safe, or accepted.
  - No CVV/expiry/name/payment fields exist.
  - No card digits are placed in query params, hash, share URLs, storage, cookies, favorites, API requests, analytics, or copied summaries.
  - Existing validator tools and category pages continue to pass constants/discovery tests.

## Implementation Notes

- Status updates:
  - 2026-06-27: Planner created this plan only. No app code, tests, messages, constants, DB rows, or backlog markdown files were edited.
  - 2026-06-27: Creator implemented the browser-only card/PAN-like validator for `/validadores/validador-cartao`; DB item remains `In Progress` with stage `implementation` for review/tester handoff.
  - 2026-06-27: Fix worker investigated the tester 500s and found the JSON parse error came from corrupted generated `.next-e2e/dev/prerender-manifest.json`, not from `messages/*.json`, JSON-LD strings, registry data, or Luhn logic. Parallel first-hit probes against a fresh `NEXT_DIST_DIR=.next-e2e` dev server can corrupt that generated manifest in dev; deleting `.next-e2e` and warming the relevant routes sequentially regenerated valid manifests and cleared the reported 500s. No production/config/i18n/registry source files needed changes.
- Files changed:
  - `docs/tool-plans/validador-cartao.md`
  - `lib/tools/payment-card.ts`
  - `lib/tools/payment-card.test.ts`
  - `lib/analytics/ga4.ts`
  - `lib/analytics/ga4.test.ts`
  - `lib/constants.ts`
  - `components/tools/validators/payment-card-validator-client.tsx`
  - `app/[locale]/validadores/validador-cartao/page.tsx`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/payment-card-validator.spec.ts`
- Validation results:
  - `git diff --check --no-index /dev/null docs/tool-plans/validador-cartao.md` produced no whitespace warnings. Exit code `1` is expected for a new-file diff against `/dev/null`.
  - `pnpm test -- lib/tools/payment-card.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` did not run tests because pnpm aborted on the non-interactive modules purge prompt (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/payment-card.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` passed: 3 files, 18 tests.
  - `node -e "JSON.parse(...)"` for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json` passed.
  - `./node_modules/.bin/eslint lib/tools/payment-card.ts lib/tools/payment-card.test.ts lib/analytics/ga4.ts lib/analytics/ga4.test.ts components/tools/validators/payment-card-validator-client.tsx 'app/[locale]/validadores/validador-cartao/page.tsx' tests/e2e/payment-card-validator.spec.ts` passed.
  - `env DATABASE_URL=postgresql://user:pass@localhost:5432/calculaderia ./node_modules/.bin/prisma generate` initially hit sandbox `EPERM` on the Prisma engine cache, then passed with elevated permissions.
  - `./node_modules/.bin/tsc --noEmit` passed after Prisma client generation.
  - `env PORT=3116 PLAYWRIGHT_WEB_SERVER_COMMAND='./node_modules/.bin/next dev --hostname localhost --port 3116' AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3116 NEXTAUTH_URL=http://localhost:3116 ./node_modules/.bin/playwright test tests/e2e/payment-card-validator.spec.ts` passed: 6 Chromium tests.
  - `git diff --check` passed.
- Tester findings:
  - 2026-06-27 tester validation failed at the browser route-load gate. The authoritative DB row read via `zsh -lc 'set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; cd /Users/saulodefaria/.codex/worktrees/9fa3/calculaderia; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-cartao -f scripts/backlog/get_item.sql'` returned `status: In Progress`, `stage: testing`, `rank: 13`, `targetRoute: /validadores/validador-cartao`, and branch `codex/validador-cartao-tool`.
  - `pnpm dev --hostname localhost --port 3120` could not be used because pnpm aborted on the non-interactive modules purge prompt (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR`).
  - `env AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3120 NEXTAUTH_URL=http://localhost:3120 ./node_modules/.bin/next dev --hostname localhost --port 3120` started, but returned 404 for `/`, `/validadores`, and `/validadores/validador-cartao`; this was treated as a bad direct-server attempt, not the app failure.
  - `env NEXT_DIST_DIR=.next-e2e WATCHPACK_POLLING=true AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3122 NEXTAUTH_URL=http://localhost:3122 ./node_modules/.bin/next dev --hostname localhost --port 3122` started the harness-style dev server. Probe results: `curl -I http://localhost:3122/validadores/validador-email` returned 200, but `curl -I http://localhost:3122/validadores/validador-cartao`, `curl -I http://localhost:3122/validadores`, and validator category pages returned 500.
  - The dev server logged `SyntaxError: Unexpected non-whitespace character after JSON at position 986 (line 1 column 987)` while rendering `/pt-br/validadores/validador-cartao`, `/en/validadores/validador-cartao`, `/pt-br/validadores`, and validator category pages. The same route under a GA-enabled server failed before runtime GA payload capture, so analytics browser validation could not complete.
  - Focused elevated Playwright was run after installing Chromium with `./node_modules/.bin/playwright install chromium`: `env PORT=3122 PLAYWRIGHT_BASE_URL=http://localhost:3122 PLAYWRIGHT_SKIP_WEBSERVER=1 ./node_modules/.bin/playwright test tests/e2e/payment-card-validator.spec.ts` failed all 6 Chromium tests because the pages served 500s and never exposed the expected heading/input.
  - Supporting checks still passed: `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/payment-card.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts` passed 3 files / 18 tests, and `./node_modules/.bin/eslint tests/e2e/payment-card-validator.spec.ts lib/tools/payment-card.ts lib/tools/payment-card.test.ts lib/analytics/ga4.ts lib/analytics/ga4.test.ts components/tools/validators/payment-card-validator-client.tsx 'app/[locale]/validadores/validador-cartao/page.tsx'` passed.
- Browser coverage completed:
  - Route-load probes confirmed the harness-style server can render an adjacent existing tool page (`/validadores/validador-email`), but the new card route and validator discovery/category surfaces return 500.
  - The focused Playwright spec attempted PT-BR route load, valid/invalid Luhn paths, hostile query/hash cleanup, EN/ES smoke, discovery/sitemap, and mobile overflow, but all browser assertions were blocked before interaction by the 500 response.
- Remaining fix handoff:
  - 2026-06-27 fix-worker result: the render-time JSON parse failure is cleared after removing the generated `.next-e2e` cache and avoiding parallel first-hit HEAD probes. Sequential `curl -I` checks on the same `3122` harness server now return `200` for `/validadores/validador-cartao`, `/validadores`, and `/validadores/categorias/pagamentos`; the regenerated `.next-e2e/dev` JSON files parse cleanly.
  - Tester can rerun the focused browser checks for route load, form validation, hostile query/hash cleanup, share/copy/storage/request/analytics privacy, no SaveButton/favorites/payment-detail fields, EN/ES smoke, discovery/sitemap, and mobile overflow. If the local `.next-e2e` cache is reused after parallel manual probes, delete `.next-e2e` before retrying.
- Final status:
  - `in_progress`; DB should remain `In Progress` with stage `testing` until independent tester rerun passes.

## Fix Worker Validation - 2026-06-27

- Root cause:
  - `.next-e2e/dev/prerender-manifest.json` contained two concatenated manifest fragments; `JSON.parse` failed at byte 992 while Next tried to render or generate static paths for validator pages.
  - The corruption was reproducible by hitting multiple first-time routes in parallel against a fresh `NEXT_DIST_DIR=.next-e2e` dev server. It was not caused by `messages/pt-br.json`, `messages/en.json`, `messages/es.json`, registry constants, JSON-LD content, or card validator logic.
- Remediation:
  - Stopped the dev server, removed the generated `.next-e2e` directory, restarted the same harness-style Next dev command on port `3122`, and warmed the failing routes sequentially.
- Validation results:
  - `curl -I http://localhost:3122/validadores/validador-cartao`: `200 OK`.
  - `curl -I http://localhost:3122/validadores`: `200 OK`.
  - `curl -I http://localhost:3122/validadores/categorias/pagamentos`: `200 OK`.
  - Generated manifest check over `.next-e2e/dev/**/*.json`: passed, including `prerender-manifest.json`.
  - `./node_modules/.bin/vitest run --exclude 'tests/e2e/**' lib/tools/payment-card.test.ts lib/constants.test.ts lib/analytics/ga4.test.ts`: passed, 3 files / 18 tests.
  - `node -e 'JSON.parse(...)'` for `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`: passed.
  - `./node_modules/.bin/eslint lib/tools/payment-card.ts lib/tools/payment-card.test.ts lib/analytics/ga4.ts lib/analytics/ga4.test.ts components/tools/validators/payment-card-validator-client.tsx 'app/[locale]/validadores/validador-cartao/page.tsx' tests/e2e/payment-card-validator.spec.ts`: passed.
  - `env PORT=3122 PLAYWRIGHT_BASE_URL=http://localhost:3122 PLAYWRIGHT_SKIP_WEBSERVER=1 ./node_modules/.bin/playwright test tests/e2e/payment-card-validator.spec.ts`: passed, 6 Chromium tests.
- Files changed by fix worker:
  - `docs/tool-plans/validador-cartao.md`
- DB status/stage:
  - DB item should remain `In Progress` with stage `testing` until the tester completes the independent rerun.

## Independent Tester Rerun - 2026-06-27

- Tester run time: `2026-06-27 19:17 -0300`.
- DB item check:
  - `set -a; source /Users/saulodefaria/coding/personal/projects/calculaderia/.env; set +a; psql "$AGENT_BACKLOG_DATABASE_URL" -v kind=tool -v slug=validador-cartao -f scripts/backlog/get_item.sql`
  - Result: `ok: true`; `kind: tool`; `rank: 13`; `slug: validador-cartao`; `status: In Progress`; `stage: testing`; `targetRoute: /validadores/validador-cartao`; `claimBranch: codex/validador-cartao-tool`.
- Clean cache and harness startup:
  - `rm -rf .next-e2e`
  - `env NEXT_DIST_DIR=.next-e2e WATCHPACK_POLLING=true AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3124 NEXTAUTH_URL=http://localhost:3124 ./node_modules/.bin/next dev --hostname localhost --port 3124`
  - Sequential warmup command: `for url in http://localhost:3124/validadores/validador-cartao http://localhost:3124/validadores http://localhost:3124/validadores/categorias/pagamentos http://localhost:3124/en/validadores/validador-cartao http://localhost:3124/es/validadores/validador-cartao http://localhost:3124/sitemap.xml; do curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" "$url"; done`
  - Warmup result: all six URLs returned `200`.
  - Generated cache check: `node -e "const fs=require('fs'); const path=require('path'); const root='.next-e2e/dev'; let count=0; function walk(dir){ if(!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir, entry.name); if(entry.isDirectory()) walk(p); else if(entry.isFile() && p.endsWith('.json')){ JSON.parse(fs.readFileSync(p,'utf8')); count++; } } } walk(root); console.log('parsed json files:', count);"` returned `parsed json files: 30`.
- Focused e2e:
  - `env PORT=3124 PLAYWRIGHT_BASE_URL=http://localhost:3124 PLAYWRIGHT_SKIP_WEBSERVER=1 ./node_modules/.bin/playwright test tests/e2e/payment-card-validator.spec.ts`
  - Result: passed, `6` Chromium tests in `3.6s`.
  - Browser coverage from the spec: route load, valid Luhn flow, invalid checksum, invalid format diagnostics, repeated-digit diagnostic, hostile query/hash cleanup without input hydration, masked copy/share privacy, no SaveButton/favorite control, storage/cookie/IndexedDB/request URL privacy on the clean route, EN/ES smoke, validator directory discovery, payment category discovery, sitemap entries, and mobile overflow.
- Runtime GA/manual browser validation:
  - Restarted from a clean cache with GA enabled:
    - `rm -rf .next-e2e`
    - `env NEXT_DIST_DIR=.next-e2e WATCHPACK_POLLING=true NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-TEST AUTH_SECRET=playwright-test-secret AUTH_URL=http://localhost:3125 NEXTAUTH_URL=http://localhost:3125 ./node_modules/.bin/next dev --hostname localhost --port 3125`
    - Sequential warmup command used the same six paths on port `3125`; all returned `200`.
  - One-off Playwright browser script against `http://localhost:3125` passed.
  - Manual coverage: hostile URL cleanup, no input hydration, runtime GA `config` payload sanitized to `page_path: /validadores/validador-cartao?mascarado=0` and `page_location: http://localhost:3125/validadores/validador-cartao?mascarado=0`, form behavior, masked default result, unmask URL limited to `?mascarado=0`, share URL without digits/hash, copied summary without full digits, no SaveButton/favorite button, no `/api/favorites` calls, no CVV/CVC/expiry/name/CPF/address/payment-detail controls, no `cc-*` autocomplete/name hints, no localStorage/sessionStorage/IndexedDB card data, cookie state limited to `NEXT_LOCALE=pt-br`, EN/ES text, directory/category discovery, sitemap, mobile overflow, and no non-auth console/page errors.
- Files changed by tester rerun:
  - `docs/tool-plans/validador-cartao.md` only.
  - No production code changes.
  - No `tests/e2e/payment-card-validator.spec.ts` changes were needed.
- Residual risks:
  - The initial HTTP request for a deliberately hostile URL still contains whatever query/hash the user typed before client cleanup and GA sanitization can run; this is inherent to browser navigation, and the tool cleans the visible URL, does not hydrate the input, and sends sanitized runtime GA pageviews.
  - Chromium/e2e execution on this host still requires elevated browser permissions because of the known macOS sandbox limitation.
- Final tester status:
  - Passed. The plan is `verified`.
  - Orchestrator can mark the DB item verified/done from `In Progress` stage `testing`.

## PR Finalization - 2026-06-27

- Implementation commit: `b0e36e53` (`Add credit card validator tool`).
- Draft PR: https://github.com/saulodefaria/calculaderia/pull/35
- Label attempt:
  - `gh pr edit 35 --add-label codex --add-label codex-automation` failed with the known Projects classic GraphQL error.
  - `gh issue edit 35 --add-label codex --add-label codex-automation` failed because the `codex` label does not exist in the repository.
- Final plan status: `verified`.
- DB finalization:
  - Orchestrator should run `scripts/backlog/mark_done.sql` with the PR URL after this plan update is pushed.
