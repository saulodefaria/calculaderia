import { describe, expect, it } from "vitest";
import {
  decodeDecimoTerceiroState,
  encodeDecimoTerceiroState,
  generateDecimoTerceiroShareUrl,
  type DecimoTerceiroUrlState,
} from "./decimo-terceiro";

const today2026 = new Date(2026, 5, 18);

const fullState: DecimoTerceiroUrlState = {
  inputs: {
    salarioMensal: 4500,
    mediaVariavelMensal: 600,
    anoReferencia: 2026,
    dataAdmissao: "2026-03-17",
    dataReferencia: "2026-11-30",
    modoCalculo: "proporcionalAteData",
    adiantamentoJaRecebido: 2250,
    calcularPrimeiraParcela: false,
    dependentesIr: 2,
    pensaoAlimenticia: 300,
    outrosDescontos: 150,
    outrosAcrescimos: 250,
    calcularDescontosLegais: false,
  },
};

describe("encodeDecimoTerceiroState", () => {
  it("omits default values from the compact query state except the stable year", () => {
    const params = encodeDecimoTerceiroState(
      {
        inputs: {
          salarioMensal: 3000,
          mediaVariavelMensal: 0,
          anoReferencia: 2026,
          dataAdmissao: "2026-01-01",
          dataReferencia: "2026-12-31",
          modoCalculo: "projecaoAnual",
          adiantamentoJaRecebido: 0,
          calcularPrimeiraParcela: true,
          dependentesIr: 0,
          pensaoAlimenticia: 0,
          outrosDescontos: 0,
          outrosAcrescimos: 0,
          calcularDescontosLegais: true,
        },
      },
      today2026
    );

    expect(params.toString()).toBe("y=2026");
  });

  it("encodes a full non-default state with compact params and mode codes", () => {
    const params = encodeDecimoTerceiroState(fullState, today2026);

    expect(params.get("y")).toBe("2026");
    expect(params.get("s")).toBe("4500");
    expect(params.get("mv")).toBe("600");
    expect(params.get("ad")).toBe("2026-03-17");
    expect(params.get("rd")).toBe("2026-11-30");
    expect(params.get("m")).toBe("pd");
    expect(params.get("aa")).toBe("2250");
    expect(params.get("pp")).toBe("0");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("od")).toBe("150");
    expect(params.get("oa")).toBe("250");
    expect(params.get("dl")).toBe("0");
  });

  it("omits selected-year default dates while preserving non-current year", () => {
    const params = encodeDecimoTerceiroState(
      {
        inputs: {
          ...fullState.inputs,
          anoReferencia: 2025,
          dataAdmissao: "2025-01-01",
          dataReferencia: "2025-12-31",
        },
      },
      today2026
    );

    expect(params.get("y")).toBe("2025");
    expect(params.get("ad")).toBeNull();
    expect(params.get("rd")).toBeNull();
  });
});

describe("decodeDecimoTerceiroState", () => {
  it("decodes omitted defaults into the default 2026 state", () => {
    const decoded = decodeDecimoTerceiroState(new URLSearchParams(), today2026);

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.salarioMensal).toBe(3000);
    expect(decoded!.inputs.anoReferencia).toBe(2026);
    expect(decoded!.inputs.dataAdmissao).toBe("2026-01-01");
    expect(decoded!.inputs.dataReferencia).toBe("2026-12-31");
    expect(decoded!.inputs.calcularDescontosLegais).toBe(true);
  });

  it("roundtrips full non-default state", () => {
    const params = encodeDecimoTerceiroState(fullState, today2026);
    const decoded = decodeDecimoTerceiroState(params, today2026);

    expect(decoded).toEqual(fullState);
  });

  it("decodes annual mode, proportional mode, and selected-year defaults", () => {
    expect(decodeDecimoTerceiroState(new URLSearchParams("m=pa"), today2026)?.inputs.modoCalculo).toBe(
      "projecaoAnual"
    );
    expect(decodeDecimoTerceiroState(new URLSearchParams("m=pd&rd=2026-06-15"), today2026)?.inputs.modoCalculo).toBe(
      "proporcionalAteData"
    );

    const decoded = decodeDecimoTerceiroState(new URLSearchParams("y=2025"), today2026);
    expect(decoded?.inputs.dataAdmissao).toBe("2025-01-01");
    expect(decoded?.inputs.dataReferencia).toBe("2025-12-31");
  });

  it("returns null for invalid provided values", () => {
    expect(decodeDecimoTerceiroState(new URLSearchParams("s=-1"), today2026)).toBeNull();
    expect(decodeDecimoTerceiroState(new URLSearchParams("m=x"), today2026)).toBeNull();
    expect(decodeDecimoTerceiroState(new URLSearchParams("ad=bad"), today2026)).toBeNull();
    expect(decodeDecimoTerceiroState(new URLSearchParams("rd=2025-12-31"), today2026)).toBeNull();
    expect(decodeDecimoTerceiroState(new URLSearchParams("dep=21"), today2026)).toBeNull();
    expect(decodeDecimoTerceiroState(new URLSearchParams("dl=maybe"), today2026)).toBeNull();
  });
});

describe("generateDecimoTerceiroShareUrl", () => {
  it("generates a shareable URL with compact query params", () => {
    const url = generateDecimoTerceiroShareUrl(
      "https://calculaderia.test/calculadoras/decimo-terceiro",
      fullState,
      today2026
    );

    expect(url).toContain("https://calculaderia.test/calculadoras/decimo-terceiro?");
    expect(url).toContain("m=pd");
    expect(url).toContain("aa=2250");
    expect(url).toContain("dl=0");
  });

  it("keeps all-default generated share state non-empty and stable across future defaults", () => {
    const url = generateDecimoTerceiroShareUrl(
      "https://calculaderia.test/calculadoras/decimo-terceiro",
      {
        inputs: {
          salarioMensal: 3000,
          mediaVariavelMensal: 0,
          anoReferencia: 2026,
          dataAdmissao: "2026-01-01",
          dataReferencia: "2026-12-31",
          modoCalculo: "projecaoAnual",
          adiantamentoJaRecebido: 0,
          calcularPrimeiraParcela: true,
          dependentesIr: 0,
          pensaoAlimenticia: 0,
          outrosDescontos: 0,
          outrosAcrescimos: 0,
          calcularDescontosLegais: true,
        },
      },
      today2026
    );

    expect(url).toContain("?y=2026");

    const params = new URL(url).searchParams;
    const decoded = decodeDecimoTerceiroState(params, new Date(2027, 0, 1));

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.anoReferencia).toBe(2026);
    expect(decoded!.inputs.dataAdmissao).toBe("2026-01-01");
    expect(decoded!.inputs.dataReferencia).toBe("2026-12-31");
  });
});
