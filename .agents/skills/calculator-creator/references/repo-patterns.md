# Repo Patterns

## Implementation Checklist

- Add pure calculation code in `lib/calculators/<slug>.ts` with typed inputs and result types.
- Add URL state in `lib/url-state/<slug>.ts`, export it from `lib/url-state/index.ts`, and keep compact query params stable.
- Add calculator UI in `components/calculators/<slug>/` using existing form, summary, table, chart, share, and save patterns.
- Add localized App Router files under `app/[locale]/calculadoras/<slug>/page.tsx` and `layout.tsx`.
- Register the calculator in `lib/constants.ts`; sitemap inclusion follows from that registry.
- Add complete keys to `messages/pt-br.json`, `messages/en.json`, and `messages/es.json`. `pt-br` is the primary SEO language; `en` and `es` can be faithful translations unless the plan says otherwise.
- Include SEO metadata, canonical/alternate URLs, breadcrumb JSON-LD, FAQ JSON-LD when real FAQs exist, related calculator links, and a calculator-specific disclaimer when the topic is financial, legal, tax, payroll, credit, or benefits-related.

## Formula And Accuracy

- Prefer deterministic formulas in pure TypeScript over UI-coupled calculations.
- Keep money, rates, periods, date boundaries, and rounding explicit and covered by tests.
- Use existing helpers from `lib/utils` when they fit the contract.
- Make date-sensitive tables data-driven inside the calculator module or a small helper, with the table year/date visible in code.
- Do not hard-code current law, tax brackets, benefit bands, public program limits, or public rates without the official source and rule date from the plan.
- If only an official calculator exists and formulas are not published, implement an estimator with explicit limitations instead of copying unexplained outputs.
- Treat brand-heavy keywords as generic calculators unless the plan explicitly approves brand-specific content that avoids implying affiliation.

## UI And Content

- Keep the first viewport focused on the usable calculator.
- Use existing `components/ui` primitives and lucide icons when registering calculators.
- Prefer realistic Brazilian defaults and examples.
- Avoid nested card-heavy layouts; match nearby calculator pages.
- Keep labels accessible and ids stable enough for Playwright.
- Use translated copy for all visible UI, metadata, SEO sections, FAQ, validation, and results.

## Backlog And Plan Status

- Set backlog status to `In Progress` when app implementation begins.
- Keep keyword metrics intact.
- Mark backlog `Done` only after tester validation passes.
- Put the route plus commit/PR reference in `Done Ref` when available.
- If validation is skipped or fails, leave status as `In Progress` or move it back to `Backlog` with a short note.
