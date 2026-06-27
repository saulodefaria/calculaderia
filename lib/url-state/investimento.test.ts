import { describe, expect, it } from "vitest";
import { getDefaultInvestimentoInputs, type InvestimentoInputs } from "../calculators/investimento";
import {
  decodeInvestimentoState,
  encodeInvestimentoState,
  generateInvestimentoShareUrl,
  type InvestimentoUrlState,
} from "./investimento";

function inputs(overrides: Partial<InvestimentoInputs> = {}): InvestimentoInputs {
  return {
    ...getDefaultInvestimentoInputs(),
    ...overrides,
  };
}

describe("investimento URL state", () => {
  it("encodes and decodes the full state for all modes", () => {
    const states: InvestimentoUrlState[] = [
      { inputs: inputs({ mode: "projection" }), warnings: [] },
      { inputs: inputs({ mode: "requiredContribution", metaValor: 120000, prazoMeses: 180 }), warnings: [] },
      { inputs: inputs({ mode: "timeToGoal", aporteMensal: 750, metaValor: 90000 }), warnings: [] },
    ];

    for (const state of states) {
      const params = encodeInvestimentoState(state);

      expect(params.get("sv")).toBe("2026-06-26");
      expect(decodeInvestimentoState(params)).toEqual(state);
    }
  });

  it("round-trips explicit zero values that materially affect a scenario", () => {
    const state: InvestimentoUrlState = {
      inputs: inputs({
        valorInicial: 0,
        aporteMensal: 0,
        taxa: 0,
        inflacaoAnual: 0,
      }),
      warnings: [],
    };

    const params = encodeInvestimentoState(state);

    expect(params.get("vi")).toBe("0");
    expect(params.get("am")).toBe("0");
    expect(params.get("tx")).toBe("0");
    expect(params.get("ia")).toBe("0");
    expect(decodeInvestimentoState(params)).toEqual(state);
  });

  it("omits blank optional inflation and restores it as null", () => {
    const state: InvestimentoUrlState = { inputs: inputs({ inflacaoAnual: null }), warnings: [] };
    const params = encodeInvestimentoState(state);

    expect(params.has("ia")).toBe(false);
    expect(decodeInvestimentoState(params)).toEqual(state);
  });

  it("returns safe defaults with stale warning for missing or unsupported sv", () => {
    expect(decodeInvestimentoState(new URLSearchParams("vi=2000"))).toEqual({
      inputs: getDefaultInvestimentoInputs(),
      warnings: ["staleSourceVersion"],
    });
    expect(decodeInvestimentoState(new URLSearchParams("sv=2025-01-01&vi=2000"))).toEqual({
      inputs: getDefaultInvestimentoInputs(),
      warnings: ["staleSourceVersion"],
    });
  });

  it("rejects invalid values when sv is current", () => {
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&vi=-1"))).toBeNull();
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&m=x"))).toBeNull();
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&pm=10.5"))).toBeNull();
  });

  it("rejects current source-version URLs whose rate and horizon would overflow", () => {
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&tx=1000&tp=m&pm=600"))).toBeNull();
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&m=t&tx=1000&tp=m&pm=1"))).toBeNull();
    expect(
      decodeInvestimentoState(
        new URLSearchParams("sv=2026-06-26&vi=1000000000&am=100000000&tx=220&tp=m&pm=600")
      )
    ).toBeNull();
  });

  it("accepts current source-version URLs with finite high or negative rates", () => {
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&tx=1000&tp=m&pm=10"))).toEqual({
      inputs: inputs({
        taxa: 1000,
        taxaPeriodo: "mensal",
        prazoMeses: 10,
      }),
      warnings: [],
    });
    expect(decodeInvestimentoState(new URLSearchParams("sv=2026-06-26&tx=-99.99&tp=m&pm=600"))).toEqual({
      inputs: inputs({
        taxa: -99.99,
        taxaPeriodo: "mensal",
        prazoMeses: 600,
      }),
      warnings: [],
    });
  });

  it("accepts required-contribution URLs when only the unused monthly contribution would overflow", () => {
    expect(
      decodeInvestimentoState(
        new URLSearchParams("sv=2026-06-26&m=a&vi=0&am=100000000&mv=10000000000&tx=220&tp=m&pm=600")
      )
    ).toEqual({
      inputs: inputs({
        mode: "requiredContribution",
        valorInicial: 0,
        aporteMensal: 100000000,
        metaValor: 10000000000,
        taxa: 220,
        taxaPeriodo: "mensal",
        prazoMeses: 600,
      }),
      warnings: [],
    });
  });

  it("generates a share URL for the investment calculator route", () => {
    const url = generateInvestimentoShareUrl("https://calculaderia.test/calculadoras/investimento", {
      inputs: inputs({ mode: "requiredContribution", valorInicial: 5000, metaValor: 80000 }),
      warnings: [],
    });

    expect(url).toContain("https://calculaderia.test/calculadoras/investimento?");
    expect(url).toContain("sv=2026-06-26");
    expect(url).toContain("m=a");
    expect(url).toContain("vi=5000");
    expect(url).toContain("mv=80000");
  });
});
