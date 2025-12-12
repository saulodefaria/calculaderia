import { describe, it, expect } from "vitest";
import {
  encodeConsorcioState,
  decodeConsorcioState,
  generateConsorcioShareUrl,
  type ConsorcioUrlState,
} from "./consorcio";

describe("encodeConsorcioState", () => {
  it("encodes basic inputs correctly", () => {
    const state: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
      },
      amortizacoesAdicionais: [],
    };

    const params = encodeConsorcioState(state);

    expect(params.get("vb")).toBe("500000");
    expect(params.get("m")).toBe("200");
    expect(params.get("ta")).toBe("18");
    expect(params.get("ca")).toBe("6");
    expect(params.get("aa")).toBeNull();
  });

  it("encodes additional amortizations correctly", () => {
    const state: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
      },
      amortizacoesAdicionais: [
        { mes: 12, valor: 50000, tipo: "prazo" },
        { mes: 36, valor: 75000, tipo: "parcela" },
      ],
    };

    const params = encodeConsorcioState(state);
    expect(params.get("aa")).toBe("12:50000:p,36:75000:z");
  });

  it("filters out zero-value amortizations", () => {
    const state: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
      },
      amortizacoesAdicionais: [
        { mes: 12, valor: 50000, tipo: "prazo" },
        { mes: 24, valor: 0, tipo: "parcela" },
      ],
    };

    const params = encodeConsorcioState(state);
    expect(params.get("aa")).toBe("12:50000:p");
  });

  it("encodes lance when present", () => {
    const state: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
        lance: { mes: 12, valor: 50000 },
      },
      amortizacoesAdicionais: [],
    };

    const params = encodeConsorcioState(state);
    expect(params.get("lm")).toBe("12");
    expect(params.get("lv")).toBe("50000");
  });
});

describe("decodeConsorcioState", () => {
  it("decodes basic inputs correctly", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");

    const state = decodeConsorcioState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.valorBem).toBe(500000);
    expect(state!.inputs.meses).toBe(200);
    expect(state!.inputs.taxaAdministracaoTotal).toBe(18);
    expect(state!.inputs.correcaoAnual).toBe(6);
    expect(state!.inputs.agio).toBe(0);
    expect(state!.amortizacoesAdicionais).toEqual([]);
  });

  it("decodes agio when present", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");
    params.set("ag", "25000");

    const state = decodeConsorcioState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.agio).toBe(25000);
  });

  it("decodes lance when present", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");
    params.set("lm", "12");
    params.set("lv", "50000");

    const state = decodeConsorcioState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.lance).toEqual({ mes: 12, valor: 50000 });
  });

  it("defaults lance.mes to 1 when lv present but lm missing", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");
    params.set("lv", "50000");

    const state = decodeConsorcioState(params);

    expect(state).not.toBeNull();
    expect(state!.inputs.lance).toEqual({ mes: 1, valor: 50000 });
  });

  it("defaults correcaoAnual to 6 when missing", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");

    const state = decodeConsorcioState(params);
    expect(state!.inputs.correcaoAnual).toBe(6);
  });

  it("decodes additional amortizations correctly", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");
    params.set("aa", "12:50000:p,36:75000:z");

    const state = decodeConsorcioState(params);

    expect(state!.amortizacoesAdicionais).toEqual([
      { mes: 12, valor: 50000, tipo: "prazo" },
      { mes: 36, valor: 75000, tipo: "parcela" },
    ]);
  });

  it("returns null for missing required fields", () => {
    const params1 = new URLSearchParams();
    params1.set("m", "200");
    params1.set("ta", "18");
    expect(decodeConsorcioState(params1)).toBeNull();

    const params2 = new URLSearchParams();
    params2.set("vb", "500000");
    params2.set("ta", "18");
    expect(decodeConsorcioState(params2)).toBeNull();

    const params3 = new URLSearchParams();
    params3.set("vb", "500000");
    params3.set("m", "200");
    expect(decodeConsorcioState(params3)).toBeNull();
  });

  it("returns null for invalid values", () => {
    const params1 = new URLSearchParams();
    params1.set("vb", "-500000"); // negative
    params1.set("m", "200");
    params1.set("ta", "18");
    expect(decodeConsorcioState(params1)).toBeNull();

    const params2 = new URLSearchParams();
    params2.set("vb", "500000");
    params2.set("m", "0"); // zero months
    params2.set("ta", "18");
    expect(decodeConsorcioState(params2)).toBeNull();

    const params3 = new URLSearchParams();
    params3.set("vb", "500000");
    params3.set("m", "200");
    params3.set("ta", "0"); // zero taxa
    expect(decodeConsorcioState(params3)).toBeNull();
  });

  it("ignores invalid amortization entries", () => {
    const params = new URLSearchParams();
    params.set("vb", "500000");
    params.set("m", "200");
    params.set("ta", "18");
    params.set("ca", "6");
    params.set("aa", "12:50000:p,invalid:data:x,36:75000:z");

    const state = decodeConsorcioState(params);

    expect(state!.amortizacoesAdicionais).toEqual([
      { mes: 12, valor: 50000, tipo: "prazo" },
      { mes: 36, valor: 75000, tipo: "parcela" },
    ]);
  });
});

describe("generateConsorcioShareUrl", () => {
  it("generates a complete shareable URL", () => {
    const state: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
      },
      amortizacoesAdicionais: [],
    };

    const url = generateConsorcioShareUrl("https://example.com/calculadora/consorcio", state);

    expect(url).toContain("https://example.com/calculadora/consorcio?");
    expect(url).toContain("vb=500000");
    expect(url).toContain("m=200");
    expect(url).toContain("ta=18");
    expect(url).toContain("ca=6");
  });

  it("encodes and decodes roundtrip correctly", () => {
    const originalState: ConsorcioUrlState = {
      inputs: {
        valorBem: 750000,
        meses: 180,
        taxaAdministracaoTotal: 20.5,
        correcaoAnual: 5.5,
        agio: 30000,
        lance: { mes: 6, valor: 100000 },
      },
      amortizacoesAdicionais: [
        { mes: 24, valor: 100000, tipo: "prazo" },
        { mes: 48, valor: 50000, tipo: "parcela" },
      ],
    };

    const url = generateConsorcioShareUrl("https://example.com/calc", originalState);
    const urlObj = new URL(url);
    const decoded = decodeConsorcioState(urlObj.searchParams);

    expect(decoded).toEqual(originalState);
  });

  it("encodes and decodes roundtrip correctly without agio", () => {
    const originalState: ConsorcioUrlState = {
      inputs: {
        valorBem: 500000,
        meses: 200,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
        agio: 0,
      },
      amortizacoesAdicionais: [],
    };

    const url = generateConsorcioShareUrl("https://example.com/calc", originalState);
    const urlObj = new URL(url);
    const decoded = decodeConsorcioState(urlObj.searchParams);

    expect(decoded).toEqual(originalState);
  });
});
