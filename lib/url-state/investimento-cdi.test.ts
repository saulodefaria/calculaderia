import { describe, expect, it } from "vitest";
import {
  INVESTIMENTO_CDI_SOURCE_VERSION,
  getDefaultInvestimentoCdiInputs,
  type InvestimentoCdiInputs,
} from "../calculators/investimento-cdi";
import {
  decodeInvestimentoCdiState,
  encodeInvestimentoCdiState,
  generateInvestimentoCdiShareUrl,
} from "./investimento-cdi";

function inputs(overrides: Partial<InvestimentoCdiInputs> = {}): InvestimentoCdiInputs {
  return {
    ...getDefaultInvestimentoCdiInputs(),
    ...overrides,
  };
}

describe("investimento CDI URL state", () => {
  it("encodes the default BCB snapshot state with required source version", () => {
    const params = encodeInvestimentoCdiState({ inputs: getDefaultInvestimentoCdiInputs() });

    expect(params.toString()).toBe("sv=2026-07-06&v=10000&dc=365&du=252&dum=e&pc=100&cm=s");
    expect(decodeInvestimentoCdiState(params)).toEqual({ inputs: getDefaultInvestimentoCdiInputs(), warnings: [] });
  });

  it("round-trips manual business days and explicit zero CDI percentage", () => {
    const state = {
      inputs: inputs({
        valorInicial: 2500,
        prazoDiasCorridos: 90,
        diasUteis: 62,
        diasUteisModo: "manual",
        percentualCdi: 0,
      }),
    };

    const params = encodeInvestimentoCdiState(state);

    expect(params.get("sv")).toBe(INVESTIMENTO_CDI_SOURCE_VERSION);
    expect(params.get("dum")).toBe("m");
    expect(params.get("pc")).toBe("0");
    expect(params.get("cdi")).toBeNull();
    expect(decodeInvestimentoCdiState(params)).toEqual({ ...state, warnings: [] });
  });

  it("round-trips manual annual CDI and ignores unknown future params", () => {
    const state = {
      inputs: inputs({
        valorInicial: 50_000,
        prazoDiasCorridos: 720,
        diasUteis: 497,
        diasUteisModo: "manual",
        percentualCdi: 110,
        cdiModo: "manual",
        cdiAnualManual: 12.75,
      }),
    };
    const params = encodeInvestimentoCdiState(state);
    params.set("future", "ignored");

    expect(params.get("cm")).toBe("m");
    expect(params.get("cdi")).toBe("12.75");
    expect(decodeInvestimentoCdiState(params)).toEqual({ ...state, warnings: [] });
  });

  it("restores defaults and warning for missing, stale, or unknown source versions", () => {
    const expected = { inputs: getDefaultInvestimentoCdiInputs(), warnings: ["staleSourceVersion"] };

    expect(decodeInvestimentoCdiState(new URLSearchParams("v=1000&dc=365&du=252&dum=e&pc=100&cm=s"))).toEqual(
      expected
    );
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-05&v=1000&dc=365&du=252&dum=e&pc=100&cm=s"))
    ).toEqual(expected);
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=unknown&v=1000&dc=365&du=252&dum=e&pc=100&cm=s"))
    ).toEqual(expected);
  });

  it("rejects unsupported modes, malformed numbers, and impossible days for current source version", () => {
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=1000&dc=365&du=252&dum=x&pc=100&cm=s"))
    ).toBeNull();
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=1000&dc=365&du=252&dum=e&pc=100&cm=x"))
    ).toBeNull();
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=abc&dc=365&du=252&dum=e&pc=100&cm=s"))
    ).toBeNull();
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=1000&dc=10.5&du=7&dum=e&pc=100&cm=s"))
    ).toBeNull();
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=1000&dc=10&du=100&dum=e&pc=100&cm=s"))
    ).toBeNull();
    expect(
      decodeInvestimentoCdiState(new URLSearchParams("sv=2026-07-06&v=1000&dc=365&du=252&dum=e&pc=100&cm=m"))
    ).toBeNull();
  });

  it("generates canonical source-versioned share URLs", () => {
    const url = generateInvestimentoCdiShareUrl("https://calculaderia.test/calculadoras/investimento-cdi", {
      inputs: inputs({ cdiModo: "manual", cdiAnualManual: 12.5 }),
    });

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/investimento-cdi?sv=2026-07-06&v=10000&dc=365&du=252&dum=e&pc=100&cm=m&cdi=12.5"
    );
  });
});
