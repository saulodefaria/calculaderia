import { describe, expect, it } from "vitest";
import { getDefaultCorrecaoIgpmInputs, type CorrecaoIgpmInputs } from "../calculators/correcao-igpm";
import {
  decodeCorrecaoIgpmState,
  encodeCorrecaoIgpmState,
  generateCorrecaoIgpmShareUrl,
} from "./correcao-igpm";

function inputs(overrides: Partial<CorrecaoIgpmInputs> = {}): CorrecaoIgpmInputs {
  return { ...getDefaultCorrecaoIgpmInputs(), ...overrides };
}

describe("IGP-M correction URL state", () => {
  it("round-trips the complete reproducible default state", () => {
    const state = { inputs: getDefaultCorrecaoIgpmInputs() };
    const params = encodeCorrecaoIgpmState(state);
    expect(params.toString()).toBe("sv=1&v=500000&i=2020-01&f=2026-08");
    expect(decodeCorrecaoIgpmState(params)).toEqual({ ...state, warnings: [] });
  });

  it("preserves valid decimals, older final months, and ignores unknown params", () => {
    const state = { inputs: inputs({ valorOriginal: 0.01, mesInicial: "2020-01", mesFinal: "2025-12" }) };
    const params = encodeCorrecaoIgpmState(state);
    params.set("future", "ignored");
    expect(params.get("v")).toBe("0.01");
    expect(decodeCorrecaoIgpmState(params)).toEqual({ ...state, warnings: ["newerDataAvailable"] });
  });

  it("distinguishes a missing formula version from a present unsupported version", () => {
    expect(decodeCorrecaoIgpmState(new URLSearchParams("v=500000&i=2020-01&f=2026-08"))).toEqual({
      inputs: getDefaultCorrecaoIgpmInputs(),
      warnings: ["invalidLink"],
    });
    expect(decodeCorrecaoIgpmState(new URLSearchParams("sv=2&v=500000&i=2020-01&f=2026-08"))).toEqual({
      inputs: getDefaultCorrecaoIgpmInputs(),
      warnings: ["formulaVersion"],
    });
  });

  it("restores defaults with an invalid-link warning for invalid required values", () => {
    const invalidQueries = [
      "sv=1&i=2020-01&f=2026-08",
      "sv=1&v=abc&i=2020-01&f=2026-08",
      "sv=1&v=500000&i=1994-06&f=2026-08",
      "sv=1&v=500000&i=2020-01&f=2026-09",
      "sv=1&v=500000&i=2025-01&f=2024-12",
    ];
    for (const query of invalidQueries) {
      expect(decodeCorrecaoIgpmState(new URLSearchParams(query))).toEqual({
        inputs: getDefaultCorrecaoIgpmInputs(),
        warnings: ["invalidLink"],
      });
    }
  });

  it("treats an empty query as an unshared default page", () => {
    expect(decodeCorrecaoIgpmState(new URLSearchParams())).toBeNull();
  });

  it("treats unknown-only query params as no calculator state", () => {
    expect(decodeCorrecaoIgpmState(new URLSearchParams("utm_source=search&future=ignored"))).toBeNull();
  });

  it("generates a canonical complete share URL", () => {
    expect(
      generateCorrecaoIgpmShareUrl("https://calculaderia.test/calculadoras/correcao-igpm?ignored=1", {
        inputs: getDefaultCorrecaoIgpmInputs(),
      })
    ).toBe("https://calculaderia.test/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08");
  });
});
