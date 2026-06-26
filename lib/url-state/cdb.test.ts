import { describe, expect, it } from "vitest";
import {
  CDB_SOURCE_VERSION,
  getDefaultCdbInputs,
  type CdbInputs,
} from "../calculators/cdb";
import { decodeCdbState, encodeCdbState, generateCdbShareUrl } from "./cdb";

function inputs(overrides: Partial<CdbInputs> = {}): CdbInputs {
  return {
    ...getDefaultCdbInputs(),
    ...overrides,
  };
}

describe("cdb URL state", () => {
  it("encodes the default CDI state with all active fields", () => {
    const params = encodeCdbState({ inputs: getDefaultCdbInputs() });

    expect(params.toString()).toBe("sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10");
    expect(decodeCdbState(params)).toEqual({ inputs: getDefaultCdbInputs(), warnings: [] });
  });

  it("round-trips a post-fixed CDI state with explicit zero rates", () => {
    const state = {
      inputs: inputs({
        valorInicial: 2500,
        prazoDiasCorridos: 90,
        diasUteis: 62,
        percentualCdi: 0,
        cdiAnual: 0,
      }),
    };

    const params = encodeCdbState(state);

    expect(params.get("sv")).toBe(CDB_SOURCE_VERSION);
    expect(params.get("m")).toBe("cdi");
    expect(params.get("pc")).toBe("0");
    expect(params.get("cdi")).toBe("0");
    expect(decodeCdbState(params)).toEqual({ ...state, warnings: [] });
  });

  it("round-trips a pre-fixed state and ignores unknown future params", () => {
    const state = {
      inputs: inputs({
        modo: "pre",
        valorInicial: 50000,
        prazoDiasCorridos: 720,
        diasUteis: 497,
        taxaPreAnual: 0,
      }),
    };
    const params = encodeCdbState(state);
    params.set("future", "ignored");

    expect(params.get("m")).toBe("pre");
    expect(params.get("pre")).toBe("0");
    expect(params.get("pc")).toBeNull();
    expect(params.get("cdi")).toBeNull();
    expect(decodeCdbState(params)).toEqual({ ...state, warnings: [] });
  });

  it("restores defaults and warning for missing, stale, or unknown source versions", () => {
    const expected = { inputs: getDefaultCdbInputs(), warnings: ["staleSourceVersion"] };

    expect(decodeCdbState(new URLSearchParams("v=1000&dc=365&du=252&pc=100&cdi=10"))).toEqual(expected);
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-25&m=cdi&v=1000&dc=365&du=252&pc=100&cdi=10"))).toEqual(
      expected
    );
    expect(decodeCdbState(new URLSearchParams("sv=unknown&m=cdi&v=1000&dc=365&du=252&pc=100&cdi=10"))).toEqual(
      expected
    );
  });

  it("rejects unsupported modes, malformed numbers, and impossible days for current source version", () => {
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-26&m=selic&v=1000&dc=365&du=252"))).toBeNull();
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-26&m=cdi&v=abc&dc=365&du=252&pc=100&cdi=10"))).toBeNull();
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-26&m=cdi&v=1000&dc=10.5&du=7&pc=100&cdi=10"))).toBeNull();
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-26&m=cdi&v=1000&dc=10&du=100&pc=100&cdi=10"))).toBeNull();
    expect(decodeCdbState(new URLSearchParams("sv=2026-06-26&m=pre&v=1000&dc=365&du=252"))).toBeNull();
  });

  it("generates canonical source-versioned share URLs", () => {
    const url = generateCdbShareUrl("https://calculaderia.test/calculadoras/cdb", {
      inputs: inputs({ modo: "pre", taxaPreAnual: 12 }),
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/cdb?sv=2026-06-26&m=pre&v=10000&dc=365&du=252&pre=12");
  });
});
