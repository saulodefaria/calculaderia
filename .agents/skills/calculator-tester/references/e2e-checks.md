# E2E Checks

## Existing Harness

- Playwright is installed as `@playwright/test`.
- `package.json` has `test:e2e` and `test:e2e:ui`.
- `playwright.config.ts` uses `.next-e2e` plus a local web server.
- Specs live in `tests/e2e`; helpers live in `tests/e2e/helpers/calculator.ts`.
- Use the configured base URL and web server for Playwright tests.

## Routes And Locales

- Default locale `pt-br` is unprefixed: `/calculadoras/<slug>` and `/favoritos`.
- Non-default locales are prefixed: `/en/...` and `/es/...`.
- Run the main happy path in `pt-br`.
- Add one or two locale smoke tests when routing, metadata, messages, or navigation changed.

## What Good E2E Proves

- The route loads without redirect loops or hydration errors.
- Required fields accept realistic user input and formatting does not block submission.
- Submit produces visible results.
- Result summary, table, chart, FAQ, or explanation areas appear when planned.
- Tabs and selects change the submitted scenario.
- URL query params restore a shared calculation on page load.
- Share copies a URL with query params after a calculation.
- Save stores a simulation or redirects to sign-in as intended.
- Invalid states block submission or show the intended validation message.
- Desktop and mobile viewports can complete the main flow without hidden controls or overflow.

## Selector Policy

- Prefer `getByRole`, `getByLabel`, and `getByText`.
- Use form field ids when labels are duplicated.
- Do not rely on deep CSS class chains, table row indexes, or Recharts internals unless there is no better semantic hook.
- Add `data-testid` only when accessible selectors and stable ids are insufficient.
- If dynamic inputs are unlabeled, improve accessibility when the task allows it.

## Input Notes

- Currency inputs format with Brazilian separators; fill formatted values like `500.000,00`.
- Percent inputs accept comma decimals like `10,5`.
- Month, day, and period fields accept digits only.
- Radix selects should be used through their trigger role and option text.

## Useful Commands

- Specific spec: `pnpm test:e2e -- tests/e2e/<spec>.ts`.
- Full e2e: `pnpm test:e2e`.
- Unit tests when browser failures implicate logic: `pnpm test`.
- Lint after helper/spec TypeScript changes: `pnpm lint`.
- Build before CI-like e2e validation if route or metadata behavior could differ from dev: `pnpm build`.
