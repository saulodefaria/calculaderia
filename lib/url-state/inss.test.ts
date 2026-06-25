import { describe, expect, it } from "vitest";
import { getDefaultInssInputs, type InssInputs } from "../calculators/inss";
import { decodeInssState, encodeInssState, generateInssShareUrl } from "./inss";

function inputs(overrides: Partial<InssInputs> = {}): InssInputs {
  return {
    ...getDefaultInssInputs(),
    ...overrides,
  };
}

describe("inss URL state", () => {
  it("keeps minimal/default share state auditable with tb=2026", () => {
    const params = encodeInssState({ inputs: getDefaultInssInputs() });

    expect(params.toString()).toBe("tb=2026");
    expect(decodeInssState(params)).toEqual({ inputs: getDefaultInssInputs() });
  });

  it("round-trips the full calculator state", () => {
    const state = {
      inputs: inputs({
        salarioContribuicao: 6000,
        outrasRemuneracoes: 750.5,
        categoriaSegurado: "domestico",
      }),
    };

    const params = encodeInssState(state);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("s")).toBe("6000");
    expect(params.get("o")).toBe("750.5");
    expect(params.get("cat")).toBe("d");
    expect(decodeInssState(params)).toEqual(state);
  });

  it("preserves zero optional remuneration through omitted defaults", () => {
    const state = {
      inputs: inputs({
        salarioContribuicao: 2000,
        outrasRemuneracoes: 0,
      }),
    };

    expect(decodeInssState(encodeInssState(state))).toEqual(state);
  });

  it("supports compact category codes", () => {
    expect(decodeInssState(new URLSearchParams("tb=2026&cat=e"))?.inputs.categoriaSegurado).toBe("empregado");
    expect(decodeInssState(new URLSearchParams("tb=2026&cat=d"))?.inputs.categoriaSegurado).toBe("domestico");
    expect(decodeInssState(new URLSearchParams("tb=2026&cat=a"))?.inputs.categoriaSegurado).toBe("avulso");
  });

  it("rejects missing or unsupported table year", () => {
    expect(decodeInssState(new URLSearchParams("s=3000"))).toBeNull();
    expect(decodeInssState(new URLSearchParams("tb=2027&s=3000"))).toBeNull();
  });

  it("rejects invalid money and category params", () => {
    expect(decodeInssState(new URLSearchParams("tb=2026&s=-1"))).toBeNull();
    expect(decodeInssState(new URLSearchParams("tb=2026&o=-1"))).toBeNull();
    expect(decodeInssState(new URLSearchParams("tb=2026&s=abc"))).toBeNull();
    expect(decodeInssState(new URLSearchParams("tb=2026&cat=x"))).toBeNull();
  });

  it("generates calendar-year-stable share URLs with tb=2026", () => {
    const url = generateInssShareUrl("https://calculaderia.test/calculadoras/inss", {
      inputs: inputs({ salarioContribuicao: 6000, categoriaSegurado: "avulso" }),
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/inss?tb=2026&s=6000&cat=a");
  });
});
