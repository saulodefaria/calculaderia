import { describe, expect, it } from "vitest";
import { getDefaultFinanciamentoVeiculoInputs, type FinanciamentoVeiculoInputs } from "../calculators/financiamento-veiculo";
import {
  decodeFinanciamentoVeiculoState,
  encodeFinanciamentoVeiculoState,
  generateFinanciamentoVeiculoShareUrl,
} from "./financiamento-veiculo";

function inputs(overrides: Partial<FinanciamentoVeiculoInputs> = {}): FinanciamentoVeiculoInputs {
  return {
    ...getDefaultFinanciamentoVeiculoInputs(),
    ...overrides,
  };
}

describe("financiamento-veiculo URL state", () => {
  it("encodes defaults with explicit source version and zero optional costs", () => {
    const state = { inputs: getDefaultFinanciamentoVeiculoInputs() };
    const params = encodeFinanciamentoVeiculoState(state);

    expect(params.get("sv")).toBe("2026-06-25");
    expect(params.get("vv")).toBe("80000");
    expect(params.get("en")).toBe("20000");
    expect(params.get("cf")).toBe("0");
    expect(params.get("ca")).toBe("0");
    expect(params.get("tm")).toBe("1.49");
    expect(params.get("pm")).toBe("48");
    expect(params.get("mt")).toBe("price");
    expect(params.get("cmp")).toBe("1");
    expect(decodeFinanciamentoVeiculoState(params)).toEqual(state);
  });

  it("round-trips a SAC scenario with comparison disabled", () => {
    const state = {
      inputs: inputs({
        valorVeiculo: 45000,
        entrada: 5000,
        custosFinanciados: 1200,
        custosAVista: 700,
        taxaJurosMensal: 2.25,
        prazoMeses: 36,
        metodo: "sac",
        compararMetodos: false,
      }),
    };

    const params = encodeFinanciamentoVeiculoState(state);

    expect(params.get("mt")).toBe("sac");
    expect(params.get("cmp")).toBe("0");
    expect(decodeFinanciamentoVeiculoState(params)).toEqual(state);
  });

  it("rejects missing or unsupported source version and required values", () => {
    expect(decodeFinanciamentoVeiculoState(new URLSearchParams("vv=80000"))).toBeNull();
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-24&vv=80000&en=0&cf=0&ca=0&tm=1&pm=12&mt=price")
      )
    ).toBeNull();
    expect(decodeFinanciamentoVeiculoState(new URLSearchParams("sv=2026-06-25&vv=80000"))).toBeNull();
  });

  it("rejects invalid numeric, method, and comparison params", () => {
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-25&vv=-1&en=0&cf=0&ca=0&tm=1&pm=12&mt=price&cmp=1")
      )
    ).toBeNull();
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-25&vv=80000&en=0&cf=0&ca=0&tm=abc&pm=12&mt=price&cmp=1")
      )
    ).toBeNull();
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-25&vv=80000&en=0&cf=0&ca=0&tm=1&pm=12.5&mt=price&cmp=1")
      )
    ).toBeNull();
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-25&vv=80000&en=0&cf=0&ca=0&tm=1&pm=12&mt=x&cmp=1")
      )
    ).toBeNull();
    expect(
      decodeFinanciamentoVeiculoState(
        new URLSearchParams("sv=2026-06-25&vv=80000&en=0&cf=0&ca=0&tm=1&pm=12&mt=price&cmp=x")
      )
    ).toBeNull();
  });

  it("generates a stable share URL for the vehicle financing route", () => {
    const url = generateFinanciamentoVeiculoShareUrl("https://calculaderia.test/calculadoras/financiamento-veiculo", {
      inputs: inputs({ valorVeiculo: 10000, entrada: 0, taxaJurosMensal: 8 / 12, prazoMeses: 10 }),
    });

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/financiamento-veiculo?sv=2026-06-25&vv=10000&en=0&cf=0&ca=0&tm=0.6666666666666666&pm=10&mt=price&cmp=1"
    );
  });
});
