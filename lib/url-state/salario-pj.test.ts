import { describe, expect, it } from "vitest";
import { getDefaultSalarioPjInputs, type SalarioPjInputs } from "../calculators/salario-pj";
import { decodeSalarioPjState, encodeSalarioPjState, generateSalarioPjShareUrl } from "./salario-pj";

function inputs(overrides: Partial<SalarioPjInputs> = {}): SalarioPjInputs {
  return {
    ...getDefaultSalarioPjInputs(),
    ...overrides,
  };
}

describe("salario-pj URL state", () => {
  it("round-trips the full calculator state with compact params", () => {
    const state = {
      inputs: inputs({
        receitaMensal: 15_000,
        rbt12: 180_000,
        fs12: 60_000,
        anexoMode: "aliquotaManual",
        aliquotaManualEfetiva: 0.12,
        proLaboreMensal: 5000,
        inssPessoaFisicaMode: "manual",
        inssManual: 600,
        calcularIrrfProLabore: false,
        dependentesIr: 2,
        pensaoAlimenticia: 300,
        contabilidadeMensal: 0,
        custosOperacionais: 750,
        beneficiosPessoais: 500,
        outrasRetencoes: 150,
      }),
    };

    const params = encodeSalarioPjState(state);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("r")).toBe("15000");
    expect(params.get("rbt")).toBe("180000");
    expect(params.get("fs")).toBe("60000");
    expect(params.get("an")).toBe("man");
    expect(params.get("am")).toBe("0.12");
    expect(params.get("pl")).toBe("5000");
    expect(params.get("im")).toBe("manual");
    expect(params.get("in")).toBe("600");
    expect(params.get("ir")).toBe("0");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("ct")).toBe("0");
    expect(params.get("co")).toBe("750");
    expect(params.get("bp")).toBe("500");
    expect(params.get("or")).toBe("150");
    expect(decodeSalarioPjState(params)).toEqual(state);
  });

  it("keeps the default share state auditable with tb=2026", () => {
    const params = encodeSalarioPjState({ inputs: getDefaultSalarioPjInputs() });

    expect(params.toString()).toBe("tb=2026");
    expect(decodeSalarioPjState(params)).toEqual({ inputs: getDefaultSalarioPjInputs() });
  });

  it("preserves zero values when they differ from defaults", () => {
    const state = {
      inputs: inputs({
        contabilidadeMensal: 0,
        inssManual: 0,
        anexoMode: "aliquotaManual",
        rbt12: 0,
      }),
    };

    const params = encodeSalarioPjState(state);

    expect(params.get("ct")).toBe("0");
    expect(params.get("in")).toBe("0");
    expect(params.get("rbt")).toBe("0");
    expect(decodeSalarioPjState(params)).toEqual(state);
  });

  it("rejects missing or unsupported table years", () => {
    expect(decodeSalarioPjState(new URLSearchParams("r=10000"))).toBeNull();
    expect(decodeSalarioPjState(new URLSearchParams("tb=2025&r=10000"))).toBeNull();
  });

  it("rejects invalid money, modes, booleans, and dependents", () => {
    expect(decodeSalarioPjState(new URLSearchParams("tb=2026&r=-1"))).toBeNull();
    expect(decodeSalarioPjState(new URLSearchParams("tb=2026&an=bad"))).toBeNull();
    expect(decodeSalarioPjState(new URLSearchParams("tb=2026&im=bad"))).toBeNull();
    expect(decodeSalarioPjState(new URLSearchParams("tb=2026&ir=maybe"))).toBeNull();
    expect(decodeSalarioPjState(new URLSearchParams("tb=2026&dep=21"))).toBeNull();
  });

  it("generates source-year-stable share URLs", () => {
    const url = generateSalarioPjShareUrl("https://calculaderia.test/calculadoras/salario-pj", {
      inputs: inputs({ receitaMensal: 15_000, fs12: 36_000 }),
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/salario-pj?tb=2026&r=15000&fs=36000");
  });
});
