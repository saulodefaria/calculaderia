import { describe, expect, it } from "vitest";
import {
  getDefaultSalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosInputs,
} from "../calculators/salario-dias-trabalhados";
import {
  decodeSalarioDiasTrabalhadosState,
  encodeSalarioDiasTrabalhadosState,
  generateSalarioDiasTrabalhadosShareUrl,
} from "./salario-dias-trabalhados";

function inputs(overrides: Partial<SalarioDiasTrabalhadosInputs> = {}): SalarioDiasTrabalhadosInputs {
  return {
    ...getDefaultSalarioDiasTrabalhadosInputs(),
    mesReferencia: "2026-07",
    ...overrides,
  };
}

describe("salario-dias-trabalhados URL state", () => {
  it("round-trips the full calculator state", () => {
    const state = {
      inputs: inputs({
        salarioMensal: 9000,
        diasRemunerados: 20,
        divisorModo: "manual",
        divisorManual: 31,
        dataInicio: "2026-07-05",
        dataFim: "2026-07-24",
        usarPeriodo: true,
        outrosProventosTributaveis: 500,
        outrosProventosNaoTributaveis: 150,
        descontosManuais: 220.5,
        dependentesIr: 2,
        pensaoAlimenticia: 300,
        calcularDescontosLegais: false,
      }),
    };

    const params = encodeSalarioDiasTrabalhadosState(state);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("dm")).toBe("man");
    expect(params.get("m")).toBe("2026-07");
    expect(params.get("s")).toBe("9000");
    expect(params.get("d")).toBe("20");
    expect(params.get("dv")).toBe("31");
    expect(params.get("pi")).toBe("2026-07-05");
    expect(params.get("pf")).toBe("2026-07-24");
    expect(params.get("up")).toBe("1");
    expect(params.get("ot")).toBe("500");
    expect(params.get("on")).toBe("150");
    expect(params.get("desc")).toBe("220.5");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("dl")).toBe("0");
    expect(decodeSalarioDiasTrabalhadosState(params)).toEqual(state);
  });

  it("keeps minimal/default share state auditable with tb, dm, and m", () => {
    const state = { inputs: inputs() };
    const params = encodeSalarioDiasTrabalhadosState(state);

    expect(params.toString()).toBe("tb=2026&dm=30&m=2026-07");
    expect(decodeSalarioDiasTrabalhadosState(params)).toEqual(state);
  });

  it("preserves zero optional values through omitted defaults", () => {
    const state = {
      inputs: inputs({
        salarioMensal: 2000,
        diasRemunerados: 0,
        outrosProventosTributaveis: 0,
        outrosProventosNaoTributaveis: 0,
        pensaoAlimenticia: 0,
        descontosManuais: 0,
      }),
    };

    expect(decodeSalarioDiasTrabalhadosState(encodeSalarioDiasTrabalhadosState(state))).toEqual(state);
  });

  it("round-trips date helper state", () => {
    const state = {
      inputs: inputs({
        usarPeriodo: true,
        dataInicio: "2026-06-25",
        dataFim: "2026-07-10",
      }),
    };

    const params = encodeSalarioDiasTrabalhadosState(state);

    expect(params.get("pi")).toBe("2026-06-25");
    expect(params.get("pf")).toBe("2026-07-10");
    expect(params.get("up")).toBe("1");
    expect(decodeSalarioDiasTrabalhadosState(params)).toEqual(state);
  });

  it("disables legal deductions and returns a warning for unsupported or missing table year", () => {
    const unsupported = decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2027&dm=30&m=2026-07&s=6000"));
    const missing = decodeSalarioDiasTrabalhadosState(new URLSearchParams("dm=30&m=2026-07&s=6000"));

    expect(unsupported?.inputs.calcularDescontosLegais).toBe(false);
    expect(unsupported?.warnings).toEqual(["fonteUrlNaoSuportada"]);
    expect(missing?.inputs.calcularDescontosLegais).toBe(false);
    expect(missing?.warnings).toEqual(["fonteUrlNaoSuportada"]);
  });

  it("rejects invalid dates, month, divisor, mode, money, and booleans", () => {
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=30&m=2026-13"))).toBeNull();
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=bad&m=2026-07"))).toBeNull();
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=man&m=2026-07&dv=0"))).toBeNull();
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=30&m=2026-07&s=-1"))).toBeNull();
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=30&m=2026-07&pi=2026-07-40"))).toBeNull();
    expect(decodeSalarioDiasTrabalhadosState(new URLSearchParams("tb=2026&dm=30&m=2026-07&up=maybe"))).toBeNull();
  });

  it("generates stable share URLs with table year, divisor mode, and month", () => {
    const url = generateSalarioDiasTrabalhadosShareUrl(
      "https://calculaderia.test/calculadoras/salario-dias-trabalhados",
      { inputs: inputs({ salarioMensal: 6000, diasRemunerados: 10 }) }
    );

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/salario-dias-trabalhados?tb=2026&dm=30&m=2026-07&s=6000&d=10"
    );
  });
});
