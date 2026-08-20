---
slug: "calculadora-financeira-online"
backlogRank: 33
primaryKeyword: "calculadora financeira online"
decision: "merge"
targetRoute: "/calculadoras/calculadora-financeira-online"
status: "merged"
createdAt: "2026-08-20"
updatedAt: "2026-08-20"
---

# Calculadora Financeira Online Merge Plan

## Backlog Row

- Rank: 33.
- Original status: `In Progress`.
- Slug: `calculadora-financeira-online`.
- Primary keyword: `calculadora financeira online`.
- Cluster keywords: not present in the claimed row.
- Opportunity score: not present in the claimed row.
- Idea type: `New`.
- Notes: not present in the claimed row. The user request attached to this planning run describes a housing decision calculator that compares financing a home now with renting, saving, and investing until a cash purchase is possible.
- Done ref: not present in the claimed row.
- Claimed branch: `codex/calculadora-financeira-online-calculator`.
- Claimed plan path: `docs/calculator-plans/calculadora-financeira-online.md`.

## Decision

- Decision: `merge` this claimed row into the completed rank-10 `hp-12c-online` work represented by `docs/calculator-plans/hp-12c-online.md` and the existing `/calculadoras/calculadora-financeira-online` route.
- Target route: `/calculadoras/calculadora-financeira-online`.
- Rationale:
  - The claimed slug, primary keyword, plan target, route, registry id, and existing product title all identify the already implemented generic financial calculator.
  - The rank-10 plan explicitly says that future rank 33 `calculadora-financeira-online` must be merged into that implementation instead of creating a second page.
  - The existing route already serves the keyword with TVM (`n`, `i`, `PV`, `PMT`, `FV`), VPL/NPV, and TIR/IRR workflows and is recorded as verified and completed in PR 22.
  - Repurposing the route for a housing-specific “finance now versus save to buy in cash” calculator would replace a shipped calculator, break its saved/share URLs and SEO intent, and contradict the prior merge decision.
  - The user's housing concept is valid but cannot be represented by this claimed row. It needs a separately authorized enhancement/backlog item, most naturally against `/calculadoras/alugar-vs-comprar`; this plan does not invent or claim that item.
- Orchestrator action: mark rank 33 as merged/covered by the completed rank-10 route. Do not send this merge plan to the creator as a new implementation.

## Similarity Check

- Existing calculators/routes checked:
  - `/calculadoras/calculadora-financeira-online`: exact slug and target-route collision; shipped generic TVM/VPL/TIR calculator.
  - `/calculadoras/alugar-vs-comprar`: strong semantic overlap with the user request. It compares buying with financing against renting and investing, using property value, down payment, annual loan interest, term, SAC/Price, property appreciation, monthly rent, annual rent adjustment, and annual investment return.
  - `/calculadoras/financiamento`: supplies the SAC/Price amortization model reused by the rent-vs-buy calculator.
  - `/calculadoras/juros-compostos`, `/calculadoras/investimento`, and `/calculadoras/tir`: adjacent accumulation and investment-analysis workflows, but none answers the requested housing crossing-date question.
- Related modules/translations checked:
  - `lib/calculators/calculadora-financeira-online.ts`, `lib/url-state/calculadora-financeira-online.ts`, `components/calculators/calculadora-financeira-online/*`, `messages/{pt-br,en,es}/calculators/calculadora-financeira-online.json`, and the exact route implementation confirm that the target is occupied and available.
  - `lib/constants.ts` registers `calculadora-financeira-online` under `investimentos-rendimentos` and `financiamento-credito`, with the exact target href.
  - `lib/calculators/alugar-vs-comprar.ts`, its URL-state helper, components, tests, and translations confirm partial housing overlap.
- Prior plans checked:
  - `docs/calculator-plans/hp-12c-online.md` is the authoritative prior plan for the existing target. It explicitly calls rank 33 a future duplicate and records the route as verified/completed in PR 22.
  - Other calculator plans and a repository-wide keyword/route search found no plan for the specific “time until a cash home purchase” result.
- Exact gap against the user request:
  - Existing `alugar-vs-comprar` starts the rent scenario with the down payment invested and then invests only `loan payment - rent`; it does not accept an independent monthly or annual savings contribution.
  - It reports comparative net worth at a user-selected financing horizon, not the first month when invested savings equal the appreciated property price.
  - It does not distinguish “cash purchase reached,” “not reached within the simulation horizon,” and mathematically/asymptotically “never reached under these assumptions.”
  - It does not expose a dedicated cash-purchase affordability timeline or the shortfall at the horizon.
- Overlap conclusion: merge the claimed row into the exact existing route. The user concept remains unfulfilled by this row and should not be forced into the generic financial-calculator route.

## User Intent And Scope

- Target user for the concept described in this run: a prospective home buyer deciding whether to finance now or keep renting while saving/investing toward a cash purchase.
- User job: learn whether and when liquid invested savings could catch the future appreciated property price, while accounting for rent, savings contributions, investment returns, and the alternative financing path.
- In scope for this claimed row: no new product work; deduplicate the row into the existing generic financial calculator.
- Out of scope for this claimed row:
  - Changing the existing route from TVM/VPL/TIR to a housing comparison.
  - Adding housing-only modes to a broadly targeted financial-calculator workbench.
  - Enhancing `/calculadoras/alugar-vs-comprar` without a separately claimed/authorized row.
  - Creating a new slug or backlog row during this planning run.
- Sensitive-topic caveats for any future housing enhancement: results must be labeled as educational scenario estimates, not lending or investment advice; user-entered nominal assumptions must not be presented as forecasts or promises; taxes, transaction costs, maintenance, insurance, financing fees, and investment taxes require explicit inclusion or an exclusion warning.

## Calculator Contract

- Inputs: no new inputs for rank 33. The existing target retains its shipped TVM and cash-flow contract.
- Defaults: unchanged from the completed rank-10 plan and implementation.
- Validation rules: unchanged from the completed rank-10 plan and implementation.
- Outputs: unchanged from the completed rank-10 plan and implementation.
- Result explanations: unchanged from the completed rank-10 plan and implementation.
- URL params: preserve the existing query schema and source version for `/calculadoras/calculadora-financeira-online`; do not introduce housing parameters on this route.
- Share/save behavior: preserve calculator id `calculadora-financeira-online` and compatibility with existing share/favorite links.
- Future concept note, not an implementation contract: a separately authorized `alugar-vs-comprar` enhancement would need an explicit savings contribution and frequency, a bounded calculation horizon, a first-affordable-month output, horizon shortfall, and a clear non-reached classification. Those requirements are recorded only to prevent the user's request from being mistaken for coverage by this merge.

## Formulas And Sources

- Formula summary: no new formulas are authorized by this merge decision. Continue using the existing target's tested TVM, NPV, and IRR formula contract.
- Data tables or assumptions: none added.
- Official sources: use the formula and trademark sources already recorded in `docs/calculator-plans/hp-12c-online.md`; no current public rate or housing-program table is required for the merge.
- Source access dates: existing target sources were accessed `2026-06-25`; repository/overlap inspection for this decision occurred `2026-08-20`.
- Rule/table effective dates: not applicable; the existing generic calculator uses user-entered values and stable financial-math equations.
- Freshness or maintenance risk: low for this merge. A future housing calculator should avoid hard-coded appreciation, rent-growth, investment-return, or financing-rate claims.
- Estimator limitations: no new estimator is being built. The existing generic calculator's educational, periodic-rate, sign-convention, IRR-root, and non-affiliation limitations remain authoritative.

## UI, SEO, And Content

- Page title and description: keep the existing localized “Calculadora Financeira Online” TVM/VPL/TIR metadata.
- Main form sections: unchanged; no housing form is added.
- Results sections: unchanged; no cash-home-purchase timeline is claimed.
- SEO sections: retain the existing broad financial-calculator keyword coverage. Do not overwrite it with financing-versus-saving copy.
- FAQ topics: unchanged from the completed implementation.
- Disclaimer: unchanged from the completed implementation.
- Related calculator links: the existing route may continue to link to financing/investment tools under ordinary maintenance, but this merge authorizes no content changes.
- Translation guidance: no new `pt-br`, `en`, or `es` keys. A future housing enhancement would require complete terminology for financing now, saving while renting, cash-purchase date, shortfall, and non-reached states in all three locales.

## Implementation Checklist

- Calculator logic: no change.
- URL state: no change.
- UI components: no change.
- Route and metadata: no change.
- Registry: no change; the exact id/href already exists.
- Messages: no change.
- Unit tests: no change required for a documentation-only merge.
- E2E hooks/tests: no change required for a documentation-only merge.
- Backlog updates: orchestrator marks rank 33 merged/covered by completed rank 10 and should preserve the existing done reference rather than start creator implementation.

## Test Plan

- Unit scenarios: not applicable; no runtime code changes.
- URL-state scenarios: verify by inspection that the existing route has its own versioned query helper and tests; do not alter its schema.
- Browser scenarios: not required for the merge decision; the rank-10 plan already records successful focused browser validation.
- Playwright scenarios: not required for the merge decision; the rank-10 plan records 6/6 focused scenarios passing.
- Lint/build commands: not required because this plan changes documentation only. Run `git diff --check` for the plan file.
- Acceptance criteria:
  - Rank 33 does not create a duplicate route, registry entry, module, or translation namespace.
  - Existing `/calculadoras/calculadora-financeira-online` behavior and URLs remain untouched.
  - The backlog records the item as merged into the completed rank-10 work.
  - The merge is not represented to the user as completion of the housing decision concept.
  - The housing concept is returned as blocked by claimed-row mismatch until a suitable enhancement/new item is authorized.

## Implementation Notes

- Status updates:
  - `2026-08-20` planner: selected `merge` after confirming an exact shipped route/keyword collision and the prior plan's explicit rank-33 merge instruction.
  - `2026-08-20` planner: recorded that the user-requested housing journey is only partially covered by `/calculadoras/alugar-vs-comprar` and cannot be implemented under this row.
- Files changed: `docs/calculator-plans/calculadora-financeira-online.md` only.
- Validation results: repository route, registry, logic, component, URL-state, translation, test, and prior-plan overlap inspection completed; `git diff --check` passed.
- Tester findings: not applicable; no application code was changed.
- Final status: merge decision ready for orchestrator. User concept remains blocked by the claimed-row mismatch, not by formula feasibility.
