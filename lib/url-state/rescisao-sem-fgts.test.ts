import { describe, expect, it } from "vitest";
import {
  decodeRescisaoSemFgtsState,
  encodeRescisaoSemFgtsState,
  generateRescisaoSemFgtsShareUrl,
  type RescisaoSemFgtsUrlState,
} from "./rescisao-sem-fgts";

const fullState: RescisaoSemFgtsUrlState = {
  inputs: {
    salarioMensal: 4500,
    mediaVariavelMensal: 800,
    dataAdmissao: "2024-02-29",
    dataDesligamento: "2026-05-31",
    cenarioSemFgts: "pedidoDemissao",
    avisoPrevioPedido: "descontado",
    diasTrabalhadosMes: 30,
    feriasVencidasPeriodos: 1,
    dependentesIr: 2,
    adiantamentoDecimoTerceiro: 1000,
    adiantamentoFerias: 500,
    outrosCreditos: 250,
    outrosDescontos: 150,
    calcularDescontosLegais: false,
    sourceVersion: "2026-07-04",
  },
};

describe("encodeRescisaoSemFgtsState", () => {
  it("encodes full no-FGTS state with source version and no FGTS balance params", () => {
    const params = encodeRescisaoSemFgtsState(fullState);

    expect(params.get("sv")).toBe("2026-07-04");
    expect(params.get("s")).toBe("4500");
    expect(params.get("mv")).toBe("800");
    expect(params.get("ad")).toBe("2024-02-29");
    expect(params.get("dd")).toBe("2026-05-31");
    expect(params.get("mt")).toBe("pd");
    expect(params.get("av")).toBe("desc");
    expect(params.get("dt")).toBe("30");
    expect(params.get("fv")).toBe("1");
    expect(params.get("dep")).toBe("2");
    expect(params.get("a13")).toBe("1000");
    expect(params.get("af")).toBe("500");
    expect(params.get("oc")).toBe("250");
    expect(params.get("od")).toBe("150");
    expect(params.get("dl")).toBe("0");
    expect(params.get("fg")).toBeNull();
    expect(params.get("fi")).toBeNull();
    expect(params.get("sq")).toBeNull();
  });

  it("omits optional zero values and notice for with-cause mode", () => {
    const params = encodeRescisaoSemFgtsState({
      inputs: {
        ...fullState.inputs,
        mediaVariavelMensal: 0,
        cenarioSemFgts: "justaCausa",
        dependentesIr: 0,
        adiantamentoDecimoTerceiro: 0,
        adiantamentoFerias: 0,
        outrosCreditos: 0,
        outrosDescontos: 0,
        calcularDescontosLegais: true,
      },
    });

    expect(params.get("mt")).toBe("jc");
    expect(params.get("av")).toBeNull();
    expect(params.get("mv")).toBeNull();
    expect(params.get("dep")).toBeNull();
    expect(params.get("a13")).toBeNull();
    expect(params.get("af")).toBeNull();
    expect(params.get("oc")).toBeNull();
    expect(params.get("od")).toBeNull();
    expect(params.get("dl")).toBe("1");
  });
});

describe("decodeRescisaoSemFgtsState", () => {
  it("roundtrips full state", () => {
    const params = encodeRescisaoSemFgtsState(fullState);
    const decoded = decodeRescisaoSemFgtsState(params);

    expect(decoded).toEqual(fullState);
  });

  it("decodes minimal valid params with optional defaults", () => {
    const params = new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0");
    const decoded = decodeRescisaoSemFgtsState(params);

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.mediaVariavelMensal).toBe(0);
    expect(decoded!.inputs.dependentesIr).toBe(0);
    expect(decoded!.inputs.calcularDescontosLegais).toBe(true);
    expect(decoded!.inputs.sourceVersion).toBe("2026-07-04");
  });

  it("coerces with-cause notice away from pedido-demissao notice state", () => {
    const params = new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=jc&av=desc&dt=15&fv=1");
    const decoded = decodeRescisaoSemFgtsState(params);

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.cenarioSemFgts).toBe("justaCausa");
    expect(decoded!.inputs.avisoPrevioPedido).toBe("trabalhado");
  });

  it("returns null for invalid source version, forbidden motives, and unknown enums", () => {
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-01-01&s=3000&ad=2025-01-01&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=trab&dt=30&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=pd&av=bad&dt=30&fv=0")
      )
    ).toBeNull();
  });

  it("returns null for negative money, invalid dates, impossible ranges, and invalid booleans", () => {
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=-1&ad=2025-01-01&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=bad&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=2026-02-01&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=pd&av=trab&dt=31&fv=0")
      )
    ).toBeNull();
    expect(
      decodeRescisaoSemFgtsState(
        new URLSearchParams("sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-01-31&mt=pd&av=trab&dt=30&fv=0&dl=maybe")
      )
    ).toBeNull();
  });
});

describe("generateRescisaoSemFgtsShareUrl", () => {
  it("generates a version-pinned share URL for the no-FGTS route", () => {
    const url = generateRescisaoSemFgtsShareUrl(
      "https://calculaderia.test/calculadoras/rescisao-sem-fgts",
      fullState
    );

    expect(url).toContain("https://calculaderia.test/calculadoras/rescisao-sem-fgts?");
    expect(url).toContain("sv=2026-07-04");
    expect(url).toContain("mt=pd");
    expect(url).toContain("av=desc");
    expect(url).not.toContain("fg=");
    expect(url).not.toContain("fi=");
  });
});
