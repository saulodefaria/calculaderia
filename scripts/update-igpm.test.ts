import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  buildSnapshot,
  compareObservations,
  normalizeBcbObservations,
  validateObservations,
  validateSnapshot,
} from "./update-igpm.mjs";

const baseRows = [
  { data: "01/06/1989", valor: "19.6800000000" },
  { data: "01/07/1989", valor: "35.9051127766" },
];

describe("IGP-M updater helpers", () => {
  it("normalizes BCB rows deterministically without losing decimal strings", () => {
    expect(normalizeBcbObservations(baseRows)).toEqual([
      { month: "1989-06", ratePercent: "19.6800000000" },
      { month: "1989-07", ratePercent: "35.9051127766" },
    ]);
  });

  it("accepts an appended month while preserving verified history", () => {
    const previous = normalizeBcbObservations(baseRows);
    const incoming = [...previous, { month: "1989-08", ratePercent: "36.9161407533" }];
    validateObservations(incoming, { requireKnownRange: false });
    expect(compareObservations(previous, incoming)).toEqual([]);
  });

  it("rejects truncated input and reports historical revisions", () => {
    const previous = normalizeBcbObservations(baseRows);
    expect(() => compareObservations(previous, previous.slice(0, 1))).toThrow(/truncated/);
    expect(
      compareObservations(previous, [previous[0], { ...previous[1], ratePercent: "35.9000000000" }])
    ).toEqual([
      {
        previous: previous[1],
        incoming: { month: "1989-07", ratePercent: "35.9000000000" },
      },
    ]);
  });

  it("rejects malformed, discontinuous, duplicate, and impossible observations", () => {
    expect(() => validateObservations([{ month: "1989-06", ratePercent: "NaN" }], { requireKnownRange: false })).toThrow(
      /Invalid/
    );
    expect(() =>
      validateObservations(
        [
          { month: "1989-06", ratePercent: "1.0" },
          { month: "1989-08", ratePercent: "1.0" },
        ],
        { requireKnownRange: false }
      )
    ).toThrow(/Discontinuous/);
    expect(() =>
      validateObservations(
        [
          { month: "1989-06", ratePercent: "1.0" },
          { month: "1989-06", ratePercent: "1.0" },
        ],
        { requireKnownRange: false }
      )
    ).toThrow(/Duplicate/);
    expect(() =>
      validateObservations([{ month: "1989-06", ratePercent: "-100.0" }], { requireKnownRange: false })
    ).toThrow(/greater than -100/);
  });

  it("builds and validates deterministic snapshot metadata", () => {
    const observations = normalizeBcbObservations(baseRows);
    expect(() => buildSnapshot(observations, "2026-08-29")).toThrow(/known last month/);

    const committed = validateSnapshot(JSON.parse(JSON.stringify(buildSnapshotFromCommitted())));
    expect(committed.firstObservation).toBe("1989-06");
    expect(committed.lastObservation).toBe("2026-08");
    expect(committed.observations).toHaveLength(447);
  });
});

function buildSnapshotFromCommitted() {
  // Importing JSON here would couple updater tests to TypeScript JSON assertions;
  // this fixture exercises the same builder with the validated committed data.
  const raw = JSON.parse(fs.readFileSync(new URL("../data/indices/igpm.json", import.meta.url), "utf8"));
  return buildSnapshot(raw.observations, raw.retrievedAt);
}
