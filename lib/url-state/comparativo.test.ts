import { describe, it, expect } from "vitest";
import {
  encodeComparativoState,
  decodeComparativoState,
  generateComparativoShareUrl,
  type ComparativoUrlState,
} from "./comparativo";

describe("encodeComparativoState", () => {
  it("encodes all inputs correctly", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 1,
          valorLance: 0,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const params = encodeComparativoState(state);

    // Financiamento params
    expect(params.get("vi")).toBe("500000");
    expect(params.get("ve")).toBe("100000");
    expect(params.get("tj")).toBe("10");
    expect(params.get("mf")).toBe("360");
    expect(params.get("mt")).toBe("sac");
    expect(params.get("ci")).toBe("6");

    // Consórcio params
    expect(params.get("mc")).toBe("200");
    expect(params.get("ta")).toBe("18");
    expect(params.get("cc")).toBe("6");
    expect(params.get("ac")).toBeNull(); // agioCartaContemplada is 0
    expect(params.get("ct")).toBeNull(); // mesContemplacao is 1 (default)
    expect(params.get("vl")).toBeNull(); // valorLance is 0

    // Investment param
    expect(params.get("tr")).toBe("10");
  });

  it("encodes agioCartaContemplada when greater than 0", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 15,
          mesContemplacao: 1,
          valorLance: 0,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const params = encodeComparativoState(state);
    expect(params.get("ac")).toBe("15");
  });

  it("encodes PRICE method correctly", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "price",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 1,
          valorLance: 0,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const params = encodeComparativoState(state);
    expect(params.get("mt")).toBe("price");
  });

  it("encodes mesContemplacao when greater than 1", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 24,
          valorLance: 0,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const params = encodeComparativoState(state);
    expect(params.get("ct")).toBe("24");
  });

  it("encodes valorLance when greater than 0", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 12,
          valorLance: 50000,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const params = encodeComparativoState(state);
    expect(params.get("ct")).toBe("12");
    expect(params.get("vl")).toBe("50000");
  });
});

describe("decodeComparativoState", () => {
  it("decodes all inputs correctly", () => {
    const params = new URLSearchParams();
    // Financiamento
    params.set("vi", "500000");
    params.set("ve", "100000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mt", "sac");
    params.set("ci", "6");
    // Consórcio
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("cc", "6");
    // Investment
    params.set("tr", "10");

    const state = decodeComparativoState(params);

    expect(state).not.toBeNull();
    // Financiamento
    expect(state!.inputs.financiamento.valorImovel).toBe(500000);
    expect(state!.inputs.financiamento.valorEntrada).toBe(100000);
    expect(state!.inputs.financiamento.taxaJurosAnual).toBe(10);
    expect(state!.inputs.financiamento.meses).toBe(360);
    expect(state!.inputs.financiamento.metodo).toBe("sac");
    expect(state!.inputs.financiamento.correcaoAnualImovel).toBe(6);
    // Consórcio
    expect(state!.inputs.consorcio.meses).toBe(200);
    expect(state!.inputs.consorcio.taxaAdministracaoTotal).toBe(18);
    expect(state!.inputs.consorcio.correcaoAnual).toBe(6);
    expect(state!.inputs.consorcio.agioCartaContemplada).toBe(0);
    expect(state!.inputs.consorcio.mesContemplacao).toBe(1); // default
    expect(state!.inputs.consorcio.valorLance).toBe(0); // default
    // Investment
    expect(state!.inputs.taxaRendimentoAnual).toBe(10);
  });

  it("decodes PRICE method correctly", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("ve", "100000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mt", "price");
    params.set("ci", "6");
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("cc", "6");
    params.set("tr", "10");

    const state = decodeComparativoState(params);
    expect(state!.inputs.financiamento.metodo).toBe("price");
  });

  it("defaults to SAC for invalid method", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("ve", "100000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mt", "invalid");
    params.set("ci", "6");
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("cc", "6");
    params.set("tr", "10");

    const state = decodeComparativoState(params);
    expect(state!.inputs.financiamento.metodo).toBe("sac");
  });

  it("applies default values for optional fields", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mc", "200");
    params.set("ta", "18");

    const state = decodeComparativoState(params);

    expect(state!.inputs.financiamento.valorEntrada).toBe(0);
    expect(state!.inputs.financiamento.correcaoAnualImovel).toBe(6);
    expect(state!.inputs.consorcio.correcaoAnual).toBe(6);
    expect(state!.inputs.consorcio.agioCartaContemplada).toBe(0);
    expect(state!.inputs.consorcio.mesContemplacao).toBe(1);
    expect(state!.inputs.consorcio.valorLance).toBe(0);
    expect(state!.inputs.taxaRendimentoAnual).toBe(10);
  });

  it("decodes agioCartaContemplada when present", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("ac", "15");

    const state = decodeComparativoState(params);
    expect(state!.inputs.consorcio.agioCartaContemplada).toBe(15);
  });

  it("decodes mesContemplacao when present", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("ct", "24");

    const state = decodeComparativoState(params);
    expect(state!.inputs.consorcio.mesContemplacao).toBe(24);
  });

  it("decodes valorLance when present", () => {
    const params = new URLSearchParams();
    params.set("vi", "500000");
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mc", "200");
    params.set("ta", "18");
    params.set("vl", "50000");

    const state = decodeComparativoState(params);
    expect(state!.inputs.consorcio.valorLance).toBe(50000);
  });

  it("returns null for missing required financiamento fields", () => {
    // Missing valorImovel
    const params1 = new URLSearchParams();
    params1.set("tj", "10");
    params1.set("mf", "360");
    params1.set("mc", "200");
    params1.set("ta", "18");
    expect(decodeComparativoState(params1)).toBeNull();

    // Missing taxaJurosAnual
    const params2 = new URLSearchParams();
    params2.set("vi", "500000");
    params2.set("mf", "360");
    params2.set("mc", "200");
    params2.set("ta", "18");
    expect(decodeComparativoState(params2)).toBeNull();

    // Missing mesesFinanciamento
    const params3 = new URLSearchParams();
    params3.set("vi", "500000");
    params3.set("tj", "10");
    params3.set("mc", "200");
    params3.set("ta", "18");
    expect(decodeComparativoState(params3)).toBeNull();
  });

  it("returns null for missing required consorcio fields", () => {
    // Missing mesesConsorcio
    const params1 = new URLSearchParams();
    params1.set("vi", "500000");
    params1.set("tj", "10");
    params1.set("mf", "360");
    params1.set("ta", "18");
    expect(decodeComparativoState(params1)).toBeNull();

    // Missing taxaAdministracaoTotal
    const params2 = new URLSearchParams();
    params2.set("vi", "500000");
    params2.set("tj", "10");
    params2.set("mf", "360");
    params2.set("mc", "200");
    expect(decodeComparativoState(params2)).toBeNull();
  });

  it("returns null for invalid values", () => {
    const params = new URLSearchParams();
    params.set("vi", "-500000"); // negative
    params.set("tj", "10");
    params.set("mf", "360");
    params.set("mc", "200");
    params.set("ta", "18");
    expect(decodeComparativoState(params)).toBeNull();
  });
});

describe("generateComparativoShareUrl", () => {
  it("generates a complete shareable URL", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 1,
          valorLance: 0,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const url = generateComparativoShareUrl("https://example.com/calculadora/comparativo", state);

    expect(url).toContain("https://example.com/calculadora/comparativo?");
    expect(url).toContain("vi=500000");
    expect(url).toContain("ve=100000");
    expect(url).toContain("tj=10");
    expect(url).toContain("mf=360");
    expect(url).toContain("mt=sac");
    expect(url).toContain("ci=6");
    expect(url).toContain("mc=200");
    expect(url).toContain("ta=18");
    expect(url).toContain("cc=6");
    expect(url).toContain("tr=10");
  });

  it("encodes and decodes roundtrip correctly", () => {
    const originalState: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 750000,
          valorEntrada: 150000,
          taxaJurosAnual: 11.5,
          meses: 420,
          metodo: "price",
          correcaoAnualImovel: 5.5,
        },
        consorcio: {
          meses: 180,
          taxaAdministracaoTotal: 20.5,
          correcaoAnual: 7,
          agioCartaContemplada: 12,
          mesContemplacao: 24,
          valorLance: 50000,
        },
        taxaRendimentoAnual: 12,
      },
    };

    const url = generateComparativoShareUrl("https://example.com/calc", originalState);
    const urlObj = new URL(url);
    const decoded = decodeComparativoState(urlObj.searchParams);

    expect(decoded).toEqual(originalState);
  });

  it("generates URL with contemplacao and lance params", () => {
    const state: ComparativoUrlState = {
      inputs: {
        financiamento: {
          valorImovel: 500000,
          valorEntrada: 100000,
          taxaJurosAnual: 10,
          meses: 360,
          metodo: "sac",
          correcaoAnualImovel: 6,
        },
        consorcio: {
          meses: 200,
          taxaAdministracaoTotal: 18,
          correcaoAnual: 6,
          agioCartaContemplada: 0,
          mesContemplacao: 36,
          valorLance: 75000,
        },
        taxaRendimentoAnual: 10,
      },
    };

    const url = generateComparativoShareUrl("https://example.com/calculadora/comparativo", state);

    expect(url).toContain("ct=36");
    expect(url).toContain("vl=75000");
  });
});
