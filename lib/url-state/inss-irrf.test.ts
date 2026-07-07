import { describe, expect, it } from "vitest";
import { getDefaultInssIrrfInputs, type InssIrrfInputs } from "../calculators/inss-irrf";
import { decodeInssIrrfState, encodeInssIrrfState, generateInssIrrfShareUrl } from "./inss-irrf";

function inputs(overrides: Partial<InssIrrfInputs> = {}): InssIrrfInputs {
  return {
    ...getDefaultInssIrrfInputs(),
    ...overrides,
  };
}

describe("inss-irrf URL state", () => {
  it("keeps default share state auditable with tb=2026 and sv=2026-07-07", () => {
    const params = encodeInssIrrfState({ inputs: getDefaultInssIrrfInputs(), warnings: [] });

    expect(params.toString()).toBe("tb=2026&sv=2026-07-07");
    expect(decodeInssIrrfState(params)).toEqual({ inputs: getDefaultInssIrrfInputs(), warnings: [] });
  });

  it("round-trips non-default state with compact category and boolean codes", () => {
    const state = {
      inputs: inputs({
        rendimentosTributaveis: 6000,
        outrosRendimentosTributaveis: 750.5,
        categoriaSegurado: "domestico",
        dependentesIr: 2,
        pensaoAlimenticia: 300,
        considerarDescontoSimplificado: false,
      }),
      warnings: [],
    };

    const params = encodeInssIrrfState(state);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("sv")).toBe("2026-07-07");
    expect(params.get("r")).toBe("6000");
    expect(params.get("o")).toBe("750.5");
    expect(params.get("cat")).toBe("d");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("ds")).toBe("0");
    expect(decodeInssIrrfState(params)).toEqual(state);
  });

  it("supports all compact category codes", () => {
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&cat=e"))?.inputs.categoriaSegurado).toBe(
      "empregado"
    );
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&cat=d"))?.inputs.categoriaSegurado).toBe(
      "domestico"
    );
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&cat=a"))?.inputs.categoriaSegurado).toBe(
      "avulso"
    );
  });

  it("restores otherwise valid inputs with stale warning when sv is missing or old", () => {
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&r=6000&dep=1"))).toEqual({
      inputs: inputs({ rendimentosTributaveis: 6000, dependentesIr: 1 }),
      warnings: ["staleSourceVersion"],
    });
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-01-01&r=9000&cat=a"))).toEqual({
      inputs: inputs({ rendimentosTributaveis: 9000, categoriaSegurado: "avulso" }),
      warnings: ["staleSourceVersion"],
    });
  });

  it("rejects missing or unsupported table year", () => {
    expect(decodeInssIrrfState(new URLSearchParams("sv=2026-07-07&r=3000"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2025&sv=2026-07-07&r=3000"))).toBeNull();
  });

  it("rejects invalid money, integer, boolean, and category params", () => {
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&r=-1"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&o=-1"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&r=abc"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&dep=2.5"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&pa=-1"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&ds=x"))).toBeNull();
    expect(decodeInssIrrfState(new URLSearchParams("tb=2026&sv=2026-07-07&cat=x"))).toBeNull();
  });

  it("generates share URLs with source and table versions on the calculator route", () => {
    const url = generateInssIrrfShareUrl("https://calculaderia.test/calculadoras/inss-irrf", {
      inputs: inputs({ rendimentosTributaveis: 6000, categoriaSegurado: "avulso" }),
      warnings: [],
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/inss-irrf?tb=2026&sv=2026-07-07&r=6000&cat=a");
  });
});
