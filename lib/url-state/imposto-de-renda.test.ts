import { describe, expect, it } from "vitest";
import { getDefaultImpostoDeRendaInputs, type ImpostoDeRendaInputs } from "../calculators/imposto-de-renda";
import {
  decodeImpostoDeRendaState,
  encodeImpostoDeRendaState,
  generateImpostoDeRendaShareUrl,
} from "./imposto-de-renda";

function inputs(overrides: Partial<ImpostoDeRendaInputs> = {}): ImpostoDeRendaInputs {
  return {
    ...getDefaultImpostoDeRendaInputs(),
    ...overrides,
  };
}

describe("imposto-de-renda URL state", () => {
  it("keeps default share state source-versioned with 2025 calendar year", () => {
    const params = encodeImpostoDeRendaState({ inputs: getDefaultImpostoDeRendaInputs() });

    expect(params.toString()).toBe("sv=2026-06-26&ac=2025");
    expect(decodeImpostoDeRendaState(params)).toEqual({ inputs: getDefaultImpostoDeRendaInputs() });
  });

  it("round-trips every non-default money, count, year, and mode field", () => {
    const state = {
      inputs: inputs({
        anoCalendario: 2026,
        rendimentosTributaveis: 90_000,
        rendimentosIsentos: 10_000,
        rendimentosExclusivos: 5_000,
        impostoRetidoFonte: 6_000,
        carneLeaoPago: 1_200.5,
        impostoComplementarPago: 300,
        dependentes: 2,
        previdenciaOficial: 8_000,
        pensaoAlimenticia: 2_400,
        despesasMedicas: 9_000,
        despesasInstrucao: 7_000,
        pessoasInstrucao: 2,
        previdenciaComplementar: 10_000,
        livroCaixa: 1_500,
        outrasDeducoesLegais: 900,
        modoDeducao: "legais",
      }),
    };

    const params = encodeImpostoDeRendaState(state);

    expect(params.get("sv")).toBe("2026-06-26");
    expect(params.get("ac")).toBe("2026");
    expect(params.get("rt")).toBe("90000");
    expect(params.get("ri")).toBe("10000");
    expect(params.get("rx")).toBe("5000");
    expect(params.get("ir")).toBe("6000");
    expect(params.get("cl")).toBe("1200.5");
    expect(params.get("ic")).toBe("300");
    expect(params.get("dep")).toBe("2");
    expect(params.get("po")).toBe("8000");
    expect(params.get("pa")).toBe("2400");
    expect(params.get("dm")).toBe("9000");
    expect(params.get("di")).toBe("7000");
    expect(params.get("pi")).toBe("2");
    expect(params.get("pg")).toBe("10000");
    expect(params.get("lc")).toBe("1500");
    expect(params.get("od")).toBe("900");
    expect(params.get("md")).toBe("legais");
    expect(decodeImpostoDeRendaState(params)).toEqual(state);
  });

  it("preserves zero optional values through omitted defaults", () => {
    const state = {
      inputs: inputs({
        rendimentosTributaveis: 60_000,
        impostoRetidoFonte: 0,
        carneLeaoPago: 0,
        dependentes: 0,
      }),
    };

    const params = encodeImpostoDeRendaState(state);

    expect(params.get("ir")).toBeNull();
    expect(params.get("cl")).toBeNull();
    expect(params.get("dep")).toBeNull();
    expect(decodeImpostoDeRendaState(params)).toEqual(state);
  });

  it("rejects missing or unsupported source versions and calendar years", () => {
    expect(decodeImpostoDeRendaState(new URLSearchParams("ac=2025&rt=60000"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-01-01&ac=2025&rt=60000"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&rt=60000"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&ac=2027&rt=60000"))).toBeNull();
  });

  it("rejects invalid money, count, and mode params", () => {
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&ac=2025&rt=-1"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&ac=2025&dep=31"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&ac=2025&pi=1.5"))).toBeNull();
    expect(decodeImpostoDeRendaState(new URLSearchParams("sv=2026-06-26&ac=2025&md=manual"))).toBeNull();
  });

  it("generates a stable share URL with compact params", () => {
    const url = generateImpostoDeRendaShareUrl("https://calculaderia.test/calculadoras/imposto-de-renda", {
      inputs: inputs({ anoCalendario: 2026, rendimentosTributaveis: 70_000, modoDeducao: "simplificado" }),
    });

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/imposto-de-renda?sv=2026-06-26&ac=2026&rt=70000&md=simplificado"
    );
  });
});
