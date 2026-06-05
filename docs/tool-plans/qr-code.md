---
slug: "qr-code"
familyId: "geradores"
primaryCategoryId: "codigos-links"
backlogRank: 1
primaryKeyword: "gerador de qr code"
decision: "new"
targetRoute: "/geradores/qr-code"
status: "verified"
createdAt: "2026-06-04"
updatedAt: "2026-06-04"
---

# Gerador de QR Code Plan

## Backlog Row

- Rank: 1
- Original status: Backlog
- Slug: `qr-code`
- Primary keyword: `gerador de qr code`
- Cluster keywords: `qr code online`; `criar qr code`; `gerador qr code gratis`
- Family/category: `geradores`; planned category `codigos-links`
- Opportunity score: 88
- Idea type: New
- Notes: High-fit utility; can support URL/text/Wi-Fi/Pix text without storing.
- Done ref: -

## Decision

- Decision: `new`
- Target route: `/geradores/qr-code`
- Rationale: There is no existing QR code route or prior QR plan. The app already has the `geradores` family, and QR generation fits that family better than calculators, validators, math, or dates. The current generator categories are `seguranca` and `aleatorios`; QR code generation is neither password/security-specific nor random, so the creator should add a new `codigos-links` category under `geradores`.

## Similarity Check

- Existing routes checked: `app/[locale]/geradores/senha/page.tsx`, `app/[locale]/geradores/numeros-aleatorios/page.tsx`, family/category directory routes, and all current `app/[locale]` route files. No `/geradores/qr-code` route exists.
- Registry/categories checked: `lib/constants.ts` has `ToolFamilyId: "geradores"` and generator categories `seguranca` and `aleatorios`. No QR tool, QR category, or general code/link category exists.
- Related modules/translations checked: `lib/tools/generators.ts`, `lib/tools/generators.test.ts`, `components/tools/generators/*`, `components/tools/url-state.ts`, `messages/pt-br.json`, `messages/en.json`, `messages/es.json`, and `tests/e2e/tools-hub.spec.ts`.
- Prior plans checked: `docs/tool-plans` contains only `_template.md`; no duplicate QR plan exists.
- Overlap conclusion: Build a new tool page. Reuse the existing generator page layout, query-state helper, translation structure, and `ShareButton`. The donation/support page uses `QRCodeSVG` from `qrcode.react` for a fixed Pix QR, but that is a page-specific support component, not a reusable public QR generator.

## User Intent And Scope

- Target user: People in Brazil who need to quickly create a QR code for a URL, plain text, Wi-Fi credentials, or a Pix copia-e-cola text without uploading data to a remote service.
- User job: Enter content, preview a scannable QR code, copy the underlying payload, download the QR image, and optionally share a prefilled configuration.
- In scope:
  - Modes: URL, text, Wi-Fi, and Pix text.
  - QR preview generated in the browser.
  - Copy payload button.
  - Download as SVG; PNG download is desirable if it can be implemented cleanly with the selected QR library.
  - Style controls for size, error correction, foreground color, background color, and margin.
  - Privacy-aware sharing that avoids putting Wi-Fi passwords or Pix payloads in the browser URL unless the user explicitly chooses a link with content.
- Out of scope:
  - Dynamic QR codes, analytics, tracking, link shorteners, hosted redirects, saved QR history, batch generation, logo embedding, payment initiation, Pix payload construction, or validation that a Pix payment will work.
  - Server-side storage or server-side QR generation.
- Sensitive-topic caveats:
  - The tool must not claim to verify links, payment recipients, Pix validity, or Wi-Fi network correctness.
  - Warn that anyone with a QR code or shared prefilled link can read the encoded content.
  - Wi-Fi passwords and Pix text should remain client-side by default and should not be saved to favorites.

## Tool Contract

- Inputs:
  - `tipo`: `url`, `texto`, `wifi`, or `pix`; default `url`.
  - URL mode: `url` string.
  - Text mode: `texto` string.
  - Wi-Fi mode: `ssid`, `senha`, `criptografia` (`WPA`, `WEP`, `nopass`), and `oculta` boolean.
  - Pix mode: `pix` string for an existing Pix copia-e-cola payload or Pix-related text.
  - Style: `nivel` (`L`, `M`, `Q`, `H`), `tamanho`, `margem`, `cor`, `fundo`.
- Defaults:
  - `tipo=url`
  - URL/text/Pix content empty.
  - Wi-Fi: empty SSID/password, `criptografia=WPA`, `oculta=false`.
  - `nivel=M`, `tamanho=240`, `margem=2`, `cor=#000000`, `fundo=#ffffff`.
- Validation rules:
  - Active-mode content is required before rendering an actionable QR code.
  - URL mode must parse as `http:` or `https:`. If the user types a domain without a scheme, the UI may offer or apply `https://`.
  - Text and Pix content should be limited by UTF-8 byte length, with a practical cap around 2,000 bytes to avoid unreadable oversized QR codes.
  - Wi-Fi SSID is required and should be capped at 32 bytes. WPA passwords should warn outside 8-63 characters unless a 64-character hex PSK is provided. `nopass` must ignore password.
  - Escape Wi-Fi payload special characters (`\`, `;`, `,`, `:`, and `"`) before building the `WIFI:` payload.
  - Hex colors must be valid 6-digit colors. Foreground and background cannot be identical; show a scanability warning for very low contrast.
  - Clamp size to a stable range such as 128-1024 px and margin to 0-8.
- Outputs:
  - QR code SVG preview.
  - Encoded payload string, with copy action.
  - Validation or scanability messages.
  - Download buttons for SVG and, if implemented, PNG.
  - Share button for current settings and optional explicit content-sharing link.
- Result explanations:
  - Show the current mode label and a short explanation of what will be encoded.
  - For Wi-Fi, display a "contains password" warning when a password is present.
  - For Pix, explain that the tool only encodes the provided text and does not validate or create payment requests.
- URL params:
  - Always safe to sync: `tipo`, `nivel`, `tamanho`, `margem`, `cor`, `fundo`.
  - Content params only when explicitly included: `url`, `texto`, `pix`, `ssid`, `senha`, `criptografia`, `oculta`, plus `conteudo=1`.
  - On initial load, read content params if present so shared links can prefill the form.
  - During normal editing, avoid writing sensitive content params into `window.location` unless the user has opted into content sharing.
- Share behavior:
  - Default share URL should preserve mode and visual settings only.
  - Provide an explicit "compartilhar com conteúdo" option or equivalent confirmation for links that include QR payload content.
  - Shared links with content must be treated as public; surface this in copy near the action.
- Save/favorites behavior:
  - No favorites or account save for this tool.
  - Do not store generated QR content server-side. Do not save QR payloads, Wi-Fi passwords, or Pix text in app favorites.

## Logic, Data, And Sources

- Logic summary:
  - Build an encoded payload from the active mode, validate it, then pass the payload and style options to a QR rendering dependency.
  - Prefer a small pure helper module such as `lib/tools/qr-code.ts` for validation, payload construction, Wi-Fi escaping, color normalization, and option clamping.
  - Keep rendering in `components/tools/generators/qr-code-client.tsx`.
- Dependency/library guidance:
  - Do not hand-roll QR matrix generation.
  - Reuse the existing project QR dependency if available: `app/[locale]/apoiar/page.tsx` already imports `QRCodeSVG` from `qrcode.react`.
  - Use `QRCodeSVG` for preview and SVG download. If `qrcode.react` exposes a suitable canvas renderer in the installed version, use that for PNG; otherwise keep PNG out of the first build rather than adding a second QR dependency.
  - If the dependency is missing from the package manifest during implementation, add `qrcode.react` and use its documented React API.
- Data tables or assumptions:
  - No external data tables are required.
  - QR capacity varies by version and error correction level, but the UX should enforce a conservative payload limit rather than exposing QR version internals.
  - Wi-Fi QR uses the common `WIFI:T:<type>;S:<ssid>;P:<password>;H:<true|false>;;` payload shape.
- Official or authoritative sources:
  - Codebase source: existing `QRCodeSVG` usage in `app/[locale]/apoiar/page.tsx`, checked on 2026-06-04.
  - QR encoding is delegated to the selected dependency; the creator should consult the dependency README/API docs for exact props supported by the installed version.
  - No government, legal, tax, payment-network, or public-rate source is required because this tool only encodes user-provided text.
- Source access dates: Codebase checked on 2026-06-04.
- Rule/table effective dates: Not applicable.
- Freshness or maintenance risk:
  - Low for QR rendering logic if delegated to a maintained library.
  - Moderate for dependency API details; verify installed `qrcode.react` version before choosing SVG/canvas/export props.
  - Pix mode can become misleading if framed as validation or payment generation; keep it as plain text encoding only.
- Estimator or privacy limitations:
  - Browser-only generation reduces server exposure but does not make encoded content private.
  - A QR code is easy to decode. Shared links and downloaded images can expose URLs, Wi-Fi passwords, or Pix payloads to anyone who receives them.

## UI, SEO, And Content

- Page title and description:
  - PT-BR title: `Gerador de QR Code`
  - PT-BR meta title: `Gerador de QR Code online grátis`
  - PT-BR description: `Crie QR codes para links, textos, Wi-Fi e Pix no navegador, com download em SVG e sem enviar o conteúdo ao servidor.`
- Main form sections:
  - Mode selector as tabs or segmented control: Link, Texto, Wi-Fi, Pix.
  - Mode-specific input panel.
  - Style panel with error correction, size, margin, foreground color, and background color.
  - Privacy/share panel for default share vs share-with-content.
- Results sections:
  - QR preview with stable dimensions.
  - Payload preview in a monospaced, wrapping container.
  - Copy payload, download SVG, optional download PNG, and share actions.
  - Validation and privacy warnings near the relevant inputs.
- SEO sections:
  - What the QR generator does.
  - How to create QR codes for links, text, Wi-Fi, and Pix text.
  - Privacy note: generated locally, not stored.
  - Download format guidance: SVG for crisp print/web; PNG if implemented for quick image use.
- FAQ topics:
  - `O conteúdo do QR code fica salvo?`
  - `Posso gerar QR code para Wi-Fi?`
  - `Posso gerar QR code Pix?`
  - `Qual formato devo baixar, SVG ou PNG?`
  - `Por que meu QR code não escaneia?`
- Disclaimer or privacy copy:
  - The QR code is generated in the browser from user-provided content.
  - The app does not validate destination links, payment information, or network credentials.
  - Do not include passwords or sensitive content in a shared link unless you intend recipients to see it.
- Related tool links:
  - Existing: `/geradores/senha`, `/geradores/numeros-aleatorios`.
  - Future backlog candidates: `/geradores/qr-code-wifi` should merge into this page as a Wi-Fi mode; `/geradores/link-whatsapp` and `/dev/url-encode-decode` can link later if built.
- Translation guidance:
  - Add `tools.qr-code` keys in `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`.
  - Keep the route slug `qr-code` stable across locales unless the project later introduces localized route slugs.
  - Translate mode labels, validation errors, privacy warnings, download/copy/share labels, SEO about/how-to-use text, and FAQ entries.
  - Suggested locale names: PT-BR `Gerador de QR Code`; EN `QR Code Generator`; ES `Generador de Código QR`.

## Implementation Checklist

- Tool logic:
  - Create `lib/tools/qr-code.ts` with types for modes/options, validation, `buildQrPayload`, `buildWifiPayload`, escaping helpers, byte-length checks, color normalization, and option clamping.
  - Add focused unit tests for payload building and validation.
- URL state:
  - Use `components/tools/url-state.ts` helpers for initial read, safe query updates, and share URLs.
  - Implement privacy-aware params so sensitive content is not automatically written to the address bar.
- UI components:
  - Create `components/tools/generators/qr-code-client.tsx`.
  - Use existing shadcn-style UI components, lucide icons, `ShareButton`, and the current card-based tool surface.
  - Keep preview dimensions stable on mobile and desktop.
- Route and metadata:
  - Add `app/[locale]/geradores/qr-code/page.tsx` using `ToolPageLayout` and `generateToolPageMetadata(locale, "qr-code")`.
- Registry/family/category:
  - Add `QrCode` or an equivalent lucide icon import in `lib/constants.ts`.
  - Add `ToolCategoryId` value `codigos-links`.
  - Add a `toolCategories` entry for `codigos-links` under `geradores`, with href `/geradores/categorias/codigos-links`.
  - Add a `tools` entry for `qr-code`, `available: true`, `familyId: "geradores"`, `primaryCategoryId: "codigos-links"`, `categoryIds: ["codigos-links"]`, `popularRank: 1`, `sitemapPriority` around `0.8`, `stateMode: "query"`, and `seoApplicationCategory: "UtilityApplication"`.
- Messages:
  - Add category translations for `toolCategories.codigos-links`.
  - Add `tools.qr-code` translations in PT-BR, EN, and ES.
- Unit tests:
  - Add `lib/tools/qr-code.test.ts` or extend the existing generator tests if the helper is added to `lib/tools/generators.ts`.
- E2E hooks/tests:
  - Add stable accessible labels and/or test ids for mode selector, active input, QR preview, copy, download, and share actions.
  - Extend `tests/e2e/tools-hub.spec.ts` or add a focused QR spec.
- Backlog updates:
  - Planner must not edit `docs/tool-backlog.md`.
  - Creator should mark the row `In Progress` only when implementation starts and `Done` only after validation passes.

## Test Plan

- Unit scenarios:
  - Builds URL payload after scheme normalization and rejects unsupported schemes.
  - Builds plain text and Pix text payloads without mutation.
  - Builds Wi-Fi payload for WPA, WEP, and no-password networks.
  - Escapes Wi-Fi special characters correctly.
  - Enforces empty, max length, size, margin, error-correction, and color validation.
- URL-state scenarios:
  - Loads `tipo`, style params, and explicit content params from a shared URL.
  - Normal edits update only safe params by default.
  - Sensitive Wi-Fi password and Pix content do not appear in `window.location.search` unless explicit content sharing is enabled.
  - Invalid query params fall back to defaults without crashing.
- Browser scenarios:
  - `/geradores/qr-code` renders the correct title, breadcrumb, form, and QR preview.
  - Switching modes changes visible fields without layout breakage.
  - A valid URL generates a QR SVG and copy/download actions work.
  - Wi-Fi mode displays a password privacy warning.
  - Pix mode displays plain-encoding/no-validation copy.
  - Mobile layout keeps preview, buttons, and long payload text readable.
- Playwright scenarios:
  - Navigate to the route and assert the heading `Gerador de QR Code`.
  - Fill a URL and assert an SVG QR element is visible.
  - Toggle Wi-Fi, fill SSID/password, and assert the current URL does not contain the password by default.
  - Use the share action and assert the copied URL includes safe params; separately test explicit content sharing if implemented.
  - Assert `/sitemap.xml` includes `/geradores/qr-code`.
- Lint/build commands:
  - Run the repo's lint command.
  - Run the repo's unit test command for the QR helper.
  - Run the relevant Playwright e2e command.
  - Run the repo build command.
- Acceptance criteria:
  - New route is listed in the generator directory and sitemap.
  - QR generation works fully client-side.
  - No QR payload content is sent to server code or saved to favorites.
  - URL state is shareable while respecting the sensitive-content rule.
  - PT-BR, EN, and ES translations are complete.
  - Unit, e2e, lint, and build validation pass.

## Implementation Notes

- Status updates:
  - 2026-06-04: Planner selected `new` and wrote this buildable plan for `/geradores/qr-code`.
  - 2026-06-04 21:27 -03: Creator implemented the QR Code tool and left backlog status as `In Progress` for tester validation.
  - 2026-06-04 21:40 -03: Browser validation passed; orchestrator marked this plan `verified` and backlog rank 1 `Done`.
- Files changed:
  - `docs/tool-backlog.md`
  - `docs/tool-plans/qr-code.md`
  - `lib/tools/qr-code.ts`
  - `lib/tools/qr-code.test.ts`
  - `components/tools/generators/qr-code-client.tsx`
  - `app/[locale]/geradores/qr-code/page.tsx`
  - `lib/constants.ts`
  - `messages/pt-br.json`
  - `messages/en.json`
  - `messages/es.json`
  - `tests/e2e/tools-hub.spec.ts`
- Validation results:
  - PASS: `pnpm install --frozen-lockfile` installed missing local dependencies from the existing lockfile without package manifest changes.
  - PASS: `pnpm test -- lib/tools/qr-code.test.ts` (Vitest reported 22 test files and 256 tests passing).
  - PASS: `pnpm lint`.
  - PASS: `DATABASE_URL=postgresql://user:password@localhost:5432/calculaderia AUTH_SECRET=build-secret pnpm build`.
  - PASS: `WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3101` plus `curl -I http://localhost:3101/geradores/qr-code` returned `200 OK`.
  - PASS: `curl -s http://localhost:3101/sitemap.xml | rg "/geradores/qr-code"` found PT-BR, EN, and ES sitemap URLs.
  - BLOCKED: `DATABASE_URL=postgresql://user:password@localhost:5432/calculaderia AUTH_SECRET=e2e-secret pnpm test:e2e -- tests/e2e/tools-hub.spec.ts` could not launch Chromium in this sandbox (`MachPortRendezvousServer` permission denied), so Playwright assertions did not execute.
- Tester findings:
  - Focus on browser validation that could not run here: URL mode QR SVG rendering, mode switching, Wi-Fi password staying out of the URL by default, explicit content sharing adding `conteudo=1`, copy payload, SVG/PNG downloads, Pix no-validation copy, mobile layout, and console errors.
- Final status:
  - Verified after tester browser validation. Backlog rank 1 is `Done` with `/geradores/qr-code` and validation summary in Done Ref. Residual risk: Playwright CLI assertions still need rerun outside this sandbox because local Chromium launch is blocked by macOS permission errors.
- Tester validation results:
  - 2026-06-04 21:37 -03: Tester expanded `tests/e2e/tools-hub.spec.ts` QR coverage for breadcrumbs, URL QR rendering, text/Pix/Wi-Fi mode switching, safe vs content share clipboard URLs, SVG/PNG/copy button enabled states, mobile horizontal overflow, and sitemap presence.
  - PASS: `pnpm test -- lib/tools/qr-code.test.ts` (Vitest reported 22 test files and 256 tests passing).
  - PASS: `pnpm lint`.
  - PASS: `DATABASE_URL=postgresql://user:password@localhost:5432/calculaderia AUTH_SECRET=dev-secret NEXT_TELEMETRY_DISABLED=1 WATCHPACK_POLLING=true pnpm dev --hostname localhost --port 3106` plus in-app Browser checks for `/geradores/qr-code`.
  - PASS: Browser route load showed title `Gerador de QR Code online grátis | Calculaderia`, breadcrumb links `Ferramentas`, `Geradores`, and `Códigos e links`, and safe default query params only.
  - PASS: URL mode with `calculaderia.com` rendered a visible QR SVG and payload `https://calculaderia.com/`; copy payload wrote that payload to clipboard; copy payload, SVG download, and PNG download buttons were enabled.
  - PASS: ShareButton copied the safe URL without payload content by default, then copied a content URL containing `conteudo=1&ssid=Casa&criptografia=WPA&senha=senha-secreta` after the explicit include-content option was checked.
  - PASS: Mode switching for text, Pix, and Wi-Fi rendered visible QR SVG output. Pix no-validation copy was visible. Wi-Fi password warnings were visible, and `senha-secreta` stayed out of the address bar until explicit content sharing was enabled.
  - PASS: Browser console error log was empty during desktop and mobile checks. At a 390px mobile viewport, `scrollWidth` equaled `clientWidth` and the QR preview/copy/SVG/PNG controls remained usable.
  - BLOCKED: `DATABASE_URL=postgresql://user:password@localhost:5432/calculaderia AUTH_SECRET=e2e-secret PORT=3107 pnpm test:e2e -- tests/e2e/tools-hub.spec.ts` could not execute assertions because Chromium launch fails in this sandbox with `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.<pid>: Permission denied (1100)` and `kill EPERM`.
  - Tester finding: no implementation failures found and no fix-worker handoff required. The remaining risk is environment-only Playwright CLI execution; rerun the focused spec in an environment where Chromium can launch.
