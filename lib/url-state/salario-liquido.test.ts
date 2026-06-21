import { describe, expect, it } from "vitest";
import {
  getDefaultSalarioLiquidoInputs,
  type SalarioLiquidoInputs,
} from "../calculators/salario-liquido";
import {
  decodeSalarioLiquidoState,
  encodeSalarioLiquidoState,
  generateSalarioLiquidoShareUrl,
} from "./salario-liquido";

function inputs(overrides: Partial<SalarioLiquidoInputs> = {}): SalarioLiquidoInputs {
  return {
    ...getDefaultSalarioLiquidoInputs(),
    ...overrides,
  };
}

describe("salario-liquido URL state", () => {
  it("round-trips the full calculator state", () => {
    const state = {
      inputs: inputs({
        salarioBruto: 6000,
        outrosProventosTributaveis: 500,
        outrosProventosNaoTributaveis: 150,
        dependentesIr: 2,
        pensaoAlimenticia: 300,
        descontosManuais: 220.5,
        adiantamentos: 100,
        calcularDescontosLegais: false,
      }),
    };

    const params = encodeSalarioLiquidoState(state);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("s")).toBe("6000");
    expect(params.get("ot")).toBe("500");
    expect(params.get("on")).toBe("150");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("dm")).toBe("220.5");
    expect(params.get("ad")).toBe("100");
    expect(params.get("dl")).toBe("0");
    expect(decodeSalarioLiquidoState(params)).toEqual(state);
  });

  it("keeps minimal/default share state auditable with tb=2026", () => {
    const params = encodeSalarioLiquidoState({ inputs: getDefaultSalarioLiquidoInputs() });

    expect(params.toString()).toBe("tb=2026");
    expect(decodeSalarioLiquidoState(params)).toEqual({ inputs: getDefaultSalarioLiquidoInputs() });
  });

  it("preserves zero optional values through omitted defaults", () => {
    const state = {
      inputs: inputs({
        salarioBruto: 2000,
        outrosProventosTributaveis: 0,
        outrosProventosNaoTributaveis: 0,
        pensaoAlimenticia: 0,
        descontosManuais: 0,
        adiantamentos: 0,
      }),
    };

    expect(decodeSalarioLiquidoState(encodeSalarioLiquidoState(state))).toEqual(state);
  });

  it("rejects missing or unsupported table year", () => {
    expect(decodeSalarioLiquidoState(new URLSearchParams("s=3000"))).toBeNull();
    expect(decodeSalarioLiquidoState(new URLSearchParams("tb=2027&s=3000"))).toBeNull();
  });

  it("rejects invalid money, dependents, and boolean params", () => {
    expect(decodeSalarioLiquidoState(new URLSearchParams("tb=2026&s=-1"))).toBeNull();
    expect(decodeSalarioLiquidoState(new URLSearchParams("tb=2026&dep=21"))).toBeNull();
    expect(decodeSalarioLiquidoState(new URLSearchParams("tb=2026&dl=maybe"))).toBeNull();
  });

  it("restores legal-deduction toggle and manual deductions that exceed pay", () => {
    const decoded = decodeSalarioLiquidoState(new URLSearchParams("tb=2026&s=1500&dm=5000&dl=0"));

    expect(decoded?.inputs.salarioBruto).toBe(1500);
    expect(decoded?.inputs.descontosManuais).toBe(5000);
    expect(decoded?.inputs.calcularDescontosLegais).toBe(false);
  });

  it("generates calendar-year-stable share URLs with tb=2026", () => {
    const url = generateSalarioLiquidoShareUrl("https://calculaderia.test/calculadoras/salario-liquido", {
      inputs: inputs({ salarioBruto: 6000 }),
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/salario-liquido?tb=2026&s=6000");
  });
});
