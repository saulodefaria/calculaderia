# Repo Patterns

## Implementation Checklist

- Register every public ferramenta in `lib/constants.ts`; sitemap, cards, families, categories, and metadata depend on this registry.
- Add complete keys to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. `pt-br` is the primary SEO language; `en` and `es` can be faithful translations unless the plan says otherwise.
- Use `generateToolPageMetadata` and `ToolPageLayout` for non-calculator tool pages unless the plan explicitly requires a special layout.
- Add static SEO/about/how-to copy in the `tools.<id>.seo` namespace for non-calculators; `ToolPageLayout` renders those sections.
- Add canonical/alternate URLs, breadcrumb JSON-LD, item lists, and software-app JSON-LD through existing helpers rather than bespoke metadata code.

## Non-Calculator Tools

- Put pure helper logic in `lib/tools/<domain>.ts` and tests in `lib/tools/<domain>.test.ts`.
- Put UI in `components/tools/<family>/<tool>-client.tsx`.
- Add localized App Router files under `app/[locale]/<family>/<slug>/page.tsx`.
- When a plan introduces a new family or category, extend `ToolFamilyId`, `ToolCategoryId`, `toolFamilies`, `toolCategories`, top-level family routes, category routing, nav/footer copy when needed, and all locale messages together.
- Use `components/tools/url-state.ts` for query-string state; keep params stable and omit sensitive generated outputs when appropriate.
- Include `ShareButton` when a configuration/result should be repeatable. Avoid `SaveButton` unless the plan explicitly extends favorites to that tool.
- Keep private/sensitive processing client-side for passwords, tokens, validators, encoders, text, images, and files. State this in SEO/privacy copy when users might worry.

## Calculators

- Add pure calculation code in `lib/calculators/<slug>.ts` with typed inputs and result types.
- Add URL state in `lib/url-state/<slug>.ts`, export it from `lib/url-state/index.ts`, and keep compact query params stable.
- Add calculator UI in `components/calculators/<slug>/` using existing form, summary, table, chart, share, and save patterns.
- Add localized App Router files under `app/[locale]/calculadoras/<slug>/page.tsx` and `layout.tsx`.
- Include related calculator links and a calculator-specific disclaimer when the topic is financial, legal, tax, payroll, credit, or benefits-related.

## Formula And Accuracy

- Prefer deterministic formulas in pure TypeScript over UI-coupled calculations.
- Prefer deterministic parsing, validation, encoding, conversion, sorting, and generation logic in pure TypeScript over UI-coupled logic.
- Keep money, rates, periods, date boundaries, and rounding explicit and covered by tests.
- Use existing helpers from `lib/utils` when they fit the contract.
- Make date-sensitive tables data-driven inside the calculator module or a small helper, with the table year/date visible in code.
- Do not hard-code current law, tax brackets, benefit bands, public program limits, or public rates without the official source and rule date from the plan.
- If only an official calculator exists and formulas are not published, implement an estimator with explicit limitations instead of copying unexplained outputs.
- Treat brand-heavy keywords as generic calculators unless the plan explicitly approves brand-specific content that avoids implying affiliation.
- For document validators, check-digit tools, security tools, file tools, accessibility checks, and parsers, source the algorithm or use a maintained library where hand-rolling is risky.

## UI And Content

- Keep the first viewport focused on the usable tool.
- Use existing `components/ui` primitives and lucide icons when registering tools.
- Prefer realistic Brazilian defaults and examples.
- Avoid nested card-heavy layouts; match nearby tool or calculator pages.
- Keep labels accessible and ids stable enough for Playwright.
- Use translated copy for all visible UI, metadata, SEO sections, FAQ, validation, and results.
- For generated secrets, tokens, documents, text, images, or encoded data, do not save or send generated values unless the plan explicitly adds secure persistence.

## Backlog And Plan Status

- Set backlog status to `In Progress` when app implementation begins.
- Keep keyword metrics intact.
- Mark backlog `Done` only after tester validation passes.
- Put the route plus commit/PR reference in `Done Ref` when available.
- If validation is skipped or fails, leave status as `In Progress` or move it back to `Backlog` with a short note.
