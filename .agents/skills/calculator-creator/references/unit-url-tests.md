# Unit And URL-State Tests

## Commands

- All unit tests: `pnpm test`.
- One test file: `pnpm test -- lib/calculators/<slug>.test.ts`.
- Focused pattern: `pnpm test -- -t "<behavior>"`.
- Lint after TypeScript, React, messages, or test changes: `pnpm lint`.
- Build after adding routes, metadata, messages, or SEO page content: `pnpm build`.

## Test Style

- Use Vitest with `import { describe, it, expect } from "vitest";`.
- Test behavior, not implementation.
- Prefer pure calculator and URL-state tests before component tests.
- Keep fixtures typed, small, realistic, and deterministic.
- Use `toBeCloseTo` for money, rates, IRR, and amortization values affected by rounding.
- Assert representative rows, boundaries, totals, rankings, encoded params, decoded state, null/error returns, and validation branches.
- Avoid snapshots and trivial re-export tests.

## Calculator Logic Coverage

- Cover one realistic happy path.
- Cover invalid or impossible inputs.
- Cover edge cases that change formulas, rates, periods, or eligibility.
- Cover table/date boundaries for tax, labor, benefit, public-program, or rate-table calculators.
- Cover rounding and totals where users will compare visible money values.

## URL-State Coverage

- Required fields are encoded.
- Optional fields are omitted when they equal defaults and restored on decode.
- Invalid required values return `null`.
- Lists ignore invalid entries only if that is the documented contract.
- Roundtrips preserve meaningful state.
- Generated share URLs use compact parameter names consistently.

## Component Tests

There is no React Testing Library harness yet. Add one only when pure helpers cannot cover the behavior. Browser flows belong in the tester skill and Playwright specs.
