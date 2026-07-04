import { describe, expect, it } from "vitest";
import {
  getDefaultMinhaCasaMinhaVidaInputs,
  type McmvInputs,
} from "../calculators/financiamento-minha-casa-minha-vida";
import {
  decodeFinanciamentoMcmvState,
  encodeFinanciamentoMcmvState,
  generateFinanciamentoMcmvShareUrl,
} from "./financiamento-minha-casa-minha-vida";

function inputs(overrides: Partial<McmvInputs> = {}): McmvInputs {
  return {
    ...getDefaultMinhaCasaMinhaVidaInputs(),
    ...overrides,
  };
}

describe("financiamento Minha Casa Minha Vida URL state", () => {
  it("encodes defaults with explicit source version and zero optional values", () => {
    const state = { inputs: getDefaultMinhaCasaMinhaVidaInputs() };
    const params = encodeFinanciamentoMcmvState(state);

    expect(params.get("sv")).toBe("2026-07-03");
    expect(params.get("rb")).toBe("4500");
    expect(params.get("rg")).toBe("sseco");
    expect(params.get("ct")).toBe("0");
    expect(params.get("ti")).toBe("n");
    expect(params.get("vi")).toBe("250000");
    expect(params.get("ll")).toBe("0");
    expect(params.get("en")).toBe("20000");
    expect(params.get("fg")).toBe("0");
    expect(params.get("sd")).toBe("0");
    expect(params.get("pm")).toBe("360");
    expect(params.get("mt")).toBe("sac");
    expect(params.get("uo")).toBe("1");
    expect(params.has("ta")).toBe(false);
    expect(params.get("cmp")).toBe("1");
    expect(decodeFinanciamentoMcmvState(params)).toEqual(state);
  });

  it("round-trips manual-rate mode and a provided local cap", () => {
    const state = {
      inputs: inputs({
        rendaMensalBruta: 8000,
        regiao: "norte-nordeste",
        cotistaFgts: true,
        tipoImovel: "terreno-construcao",
        valorImovel: 390000,
        limiteLocalFaixa12: 250000,
        entradaRecursosProprios: 0,
        fgtsEntrada: 0,
        subsidioInformado: 0,
        prazoMeses: 420,
        metodo: "price",
        usarTaxaOficial: false,
        taxaNominalAnualManual: 8.5,
        compararMetodos: false,
      }),
    };

    const params = encodeFinanciamentoMcmvState(state);

    expect(params.get("rg")).toBe("nne");
    expect(params.get("ct")).toBe("1");
    expect(params.get("ti")).toBe("tc");
    expect(params.get("ll")).toBe("250000");
    expect(params.get("en")).toBe("0");
    expect(params.get("fg")).toBe("0");
    expect(params.get("sd")).toBe("0");
    expect(params.get("uo")).toBe("0");
    expect(params.get("ta")).toBe("8.5");
    expect(params.get("cmp")).toBe("0");
    expect(decodeFinanciamentoMcmvState(params)).toEqual(state);
  });

  it("rejects missing or unsupported source version and required values", () => {
    expect(decodeFinanciamentoMcmvState(new URLSearchParams("rb=4500"))).toBeNull();
    expect(
      decodeFinanciamentoMcmvState(
        new URLSearchParams(
          "sv=2026-07-02&rb=4500&rg=sseco&ct=0&ti=n&vi=250000&ll=0&en=20000&fg=0&sd=0&pm=360&mt=sac&uo=1&cmp=1"
        )
      )
    ).toBeNull();
    expect(
      decodeFinanciamentoMcmvState(
        new URLSearchParams("sv=2026-07-03&rb=4500&rg=sseco&ct=0&ti=n&vi=250000")
      )
    ).toBeNull();
  });

  it("rejects invalid numeric, enum, boolean, local-cap, and manual-rate params", () => {
    const valid = "sv=2026-07-03&rb=4500&rg=sseco&ct=0&ti=n&vi=250000&ll=0&en=20000&fg=0&sd=0&pm=360&mt=sac&uo=1&cmp=1";

    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("rb=4500", "rb=abc")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("rg=sseco", "rg=x")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("ct=0", "ct=x")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("ti=n", "ti=x")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("ll=0", "ll=200000")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("pm=360", "pm=12.5")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("mt=sac", "mt=x")))).toBeNull();
    expect(decodeFinanciamentoMcmvState(new URLSearchParams(valid.replace("uo=1", "uo=0")))).toBeNull();
    expect(
      decodeFinanciamentoMcmvState(new URLSearchParams(`${valid.replace("uo=1", "uo=0")}&ta=31`))
    ).toBeNull();
  });

  it("rejects impossible financed amount", () => {
    expect(
      decodeFinanciamentoMcmvState(
        new URLSearchParams(
          "sv=2026-07-03&rb=4500&rg=sseco&ct=0&ti=n&vi=250000&ll=0&en=250000&fg=0&sd=0&pm=360&mt=sac&uo=1&cmp=1"
        )
      )
    ).toBeNull();
  });

  it("generates a stable share URL for the MCMV route", () => {
    const url = generateFinanciamentoMcmvShareUrl(
      "https://calculaderia.test/calculadoras/financiamento-minha-casa-minha-vida",
      {
        inputs: inputs({
          rendaMensalBruta: 10000,
          cotistaFgts: true,
          valorImovel: 600000,
          entradaRecursosProprios: 0,
          fgtsEntrada: 0,
          subsidioInformado: 0,
          prazoMeses: 420,
          metodo: "price",
        }),
      }
    );

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/financiamento-minha-casa-minha-vida?sv=2026-07-03&rb=10000&rg=sseco&ct=1&ti=n&vi=600000&ll=0&en=0&fg=0&sd=0&pm=420&mt=price&uo=1&cmp=1"
    );
  });
});
