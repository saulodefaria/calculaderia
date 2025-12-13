import { describe, it, expect } from "vitest";
import {
  encodeFinanciamentoState,
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
  type FinanciamentoUrlState,
} from "./financiamento";

describe("encodeFinanciamentoState", () => {
  it("encodes basic inputs correctly", () => {
    const state: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 500000,
        valorEntrada: 100000,
        taxaJurosAnual: 10.5,
        meses: 360,
        correcaoAnualImovel: 6,
      },
      metodo: "sac",
      amortizacoesAdicionais: [],
    };

    const params = encodeFinanciamentoState(state);

    expect(params.get("ve")).toBe("500000");
    expect(params.get("vn")).toBe("100000");
    expect(params.get("tj")).toBe("10.5");
    expect(params.get("m")).toBe("360");
    expect(params.get("ci")).toBe("6");
    expect(params.get("mt")).toBe("sac");
    expect(params.get("aa")).toBeNull();
  });

  it("encodes PRICE method correctly", () => {
    const state: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 500000,
        valorEntrada: 0,
        taxaJurosAnual: 10,
        meses: 240,
        correcaoAnualImovel: 5,
      },
      metodo: "price",
      amortizacoesAdicionais: [],
    };

    const params = encodeFinanciamentoState(state);
    expect(params.get("mt")).toBe("price");
  });

  it("encodes additional amortizations correctly", () => {
    const state: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 500000,
        valorEntrada: 100000,
        taxaJurosAnual: 10,
        meses: 360,
        correcaoAnualImovel: 6,
      },
      metodo: "sac",
      amortizacoesAdicionais: [
        { mes: 12, valor: 50000, tipo: "prazo" },
        { mes: 24, valor: 30000, tipo: "parcela" },
      ],
    };

    const params = encodeFinanciamentoState(state);
    expect(params.get("aa")).toBe("12:50000:p,24:30000:z");
  });

  it("filters out zero-value amortizations", () => {
    const state: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 500000,
        valorEntrada: 100000,
        taxaJurosAnual: 10,
        meses: 360,
        correcaoAnualImovel: 6,
      },
      metodo: "sac",
      amortizacoesAdicionais: [
        { mes: 12, valor: 50000, tipo: "prazo" },
        { mes: 24, valor: 0, tipo: "parcela" },
      ],
    };

    const params = encodeFinanciamentoState(state);
    expect(params.get("aa")).toBe("12:50000:p");
  });
});

describe("decodeFinanciamentoState", () => {
  it("decodes basic inputs correctly", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "100000");
    params.set("tj", "10.5");
    params.set("m", "360");
    params.set("ci", "6");
    params.set("mt", "sac");

    const state = decodeFinanciamentoState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.valorEmprestimo).toBe(500000);
    expect(state!.inputs.valorEntrada).toBe(100000);
    expect(state!.inputs.taxaJurosAnual).toBe(10.5);
    expect(state!.inputs.meses).toBe(360);
    expect(state!.inputs.correcaoAnualImovel).toBe(6);
    expect(state!.metodo).toBe("sac");
    expect(state!.amortizacoesAdicionais).toEqual([]);
  });

  it("decodes PRICE method correctly", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "0");
    params.set("tj", "10");
    params.set("m", "240");
    params.set("ci", "5");
    params.set("mt", "price");

    const state = decodeFinanciamentoState(params);
    expect(state!.metodo).toBe("price");
  });

  it("defaults to SAC for invalid method", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "0");
    params.set("tj", "10");
    params.set("m", "240");
    params.set("ci", "5");
    params.set("mt", "invalid");

    const state = decodeFinanciamentoState(params);
    expect(state!.metodo).toBe("sac");
  });

  it("defaults correcaoAnualImovel to 6 when missing", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "0");
    params.set("tj", "10");
    params.set("m", "240");

    const state = decodeFinanciamentoState(params);
    expect(state!.inputs.correcaoAnualImovel).toBe(6);
  });

  it("decodes additional amortizations correctly", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "100000");
    params.set("tj", "10");
    params.set("m", "360");
    params.set("ci", "6");
    params.set("mt", "sac");
    params.set("aa", "12:50000:p,24:30000:z");

    const state = decodeFinanciamentoState(params);

    expect(state!.amortizacoesAdicionais).toEqual([
      { mes: 12, valor: 50000, tipo: "prazo" },
      { mes: 24, valor: 30000, tipo: "parcela" },
    ]);
  });

  it("returns null for missing required fields", () => {
    const params1 = new URLSearchParams();
    params1.set("vn", "100000");
    params1.set("tj", "10");
    params1.set("m", "360");
    expect(decodeFinanciamentoState(params1)).toBeNull();

    const params2 = new URLSearchParams();
    params2.set("ve", "500000");
    params2.set("vn", "100000");
    params2.set("m", "360");
    expect(decodeFinanciamentoState(params2)).toBeNull();

    const params3 = new URLSearchParams();
    params3.set("ve", "500000");
    params3.set("vn", "100000");
    params3.set("tj", "10");
    expect(decodeFinanciamentoState(params3)).toBeNull();
  });

  it("returns null for invalid values", () => {
    const params = new URLSearchParams();
    params.set("ve", "-500000"); // negative
    params.set("vn", "100000");
    params.set("tj", "10");
    params.set("m", "360");
    expect(decodeFinanciamentoState(params)).toBeNull();

    const params2 = new URLSearchParams();
    params2.set("ve", "500000");
    params2.set("vn", "100000");
    params2.set("tj", "0"); // zero interest
    params2.set("m", "360");
    expect(decodeFinanciamentoState(params2)).toBeNull();
  });

  it("ignores invalid amortization entries", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "100000");
    params.set("tj", "10");
    params.set("m", "360");
    params.set("ci", "6");
    params.set("mt", "sac");
    params.set("aa", "12:50000:p,invalid:entry:x,24:30000:z");

    const state = decodeFinanciamentoState(params);

    expect(state!.amortizacoesAdicionais).toEqual([
      { mes: 12, valor: 50000, tipo: "prazo" },
      { mes: 24, valor: 30000, tipo: "parcela" },
    ]);
  });
});

describe("generateFinanciamentoShareUrl", () => {
  it("generates a complete shareable URL", () => {
    const state: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 500000,
        valorEntrada: 100000,
        taxaJurosAnual: 10,
        meses: 360,
        correcaoAnualImovel: 6,
      },
      metodo: "sac",
      amortizacoesAdicionais: [],
    };

    const url = generateFinanciamentoShareUrl("https://example.com/calculadora/financiamento", state);

    expect(url).toContain("https://example.com/calculadora/financiamento?");
    expect(url).toContain("ve=500000");
    expect(url).toContain("vn=100000");
    expect(url).toContain("tj=10");
    expect(url).toContain("m=360");
    expect(url).toContain("ci=6");
    expect(url).toContain("mt=sac");
  });

  it("encodes and decodes roundtrip correctly", () => {
    const originalState: FinanciamentoUrlState = {
      inputs: {
        valorEmprestimo: 750000,
        valorEntrada: 150000,
        taxaJurosAnual: 11.5,
        meses: 420,
        correcaoAnualImovel: 5.5,
        aluguelMensal: 3500,
        correcaoAnualAluguel: 6,
      },
      metodo: "price",
      amortizacoesAdicionais: [
        { mes: 12, valor: 50000, tipo: "prazo" },
        { mes: 24, valor: 30000, tipo: "parcela" },
      ],
    };

    const url = generateFinanciamentoShareUrl("https://example.com/calc", originalState);
    const urlObj = new URL(url);
    const decoded = decodeFinanciamentoState(urlObj.searchParams);

    expect(decoded).toEqual(originalState);
  });

  it("encodes and decodes aluguelMensal and correcaoAnualAluguel correctly", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "100000");
    params.set("tj", "10");
    params.set("m", "360");
    params.set("ci", "6");
    params.set("mt", "sac");
    params.set("am", "2500");
    params.set("caa", "5");

    const state = decodeFinanciamentoState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.aluguelMensal).toBe(2500);
    expect(state!.inputs.correcaoAnualAluguel).toBe(5);
  });

  it("defaults aluguelMensal and correcaoAnualAluguel to 0 when not present", () => {
    const params = new URLSearchParams();
    params.set("ve", "500000");
    params.set("vn", "100000");
    params.set("tj", "10");
    params.set("m", "360");
    params.set("ci", "6");
    params.set("mt", "sac");

    const state = decodeFinanciamentoState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.aluguelMensal).toBe(0);
    expect(state!.inputs.correcaoAnualAluguel).toBe(0);
  });
});

