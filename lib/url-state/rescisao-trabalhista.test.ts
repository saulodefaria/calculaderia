import { describe, expect, it } from "vitest";
import {
  decodeRescisaoTrabalhistaState,
  encodeRescisaoTrabalhistaState,
  generateRescisaoTrabalhistaShareUrl,
  type RescisaoTrabalhistaUrlState,
} from "./rescisao-trabalhista";

const fullState: RescisaoTrabalhistaUrlState = {
  inputs: {
    salarioMensal: 4500,
    mediaVariavelMensal: 800,
    dataAdmissao: "2024-02-29",
    dataDesligamento: "2026-05-31",
    motivo: "acordo",
    avisoPrevio: "indenizado",
    diasTrabalhadosMes: 30,
    feriasVencidasPeriodos: 1,
    saldoFgts: 12000,
    saldoFgtsIncluiVerbasRescisorias: true,
    dependentesIr: 2,
    adiantamentoDecimoTerceiro: 1000,
    adiantamentoFerias: 500,
    outrosCreditos: 250,
    outrosDescontos: 150,
    calcularDescontosLegais: false,
  },
};

describe("encodeRescisaoTrabalhistaState", () => {
  it("encodes full state with compact params and enum codes", () => {
    const params = encodeRescisaoTrabalhistaState(fullState);

    expect(params.get("s")).toBe("4500");
    expect(params.get("mv")).toBe("800");
    expect(params.get("ad")).toBe("2024-02-29");
    expect(params.get("dd")).toBe("2026-05-31");
    expect(params.get("mt")).toBe("ac");
    expect(params.get("av")).toBe("ind");
    expect(params.get("dt")).toBe("30");
    expect(params.get("fv")).toBe("1");
    expect(params.get("fg")).toBe("12000");
    expect(params.get("fi")).toBe("1");
    expect(params.get("dep")).toBe("2");
    expect(params.get("a13")).toBe("1000");
    expect(params.get("af")).toBe("500");
    expect(params.get("oc")).toBe("250");
    expect(params.get("od")).toBe("150");
    expect(params.get("dl")).toBe("0");
  });

  it("omits blank and zero optional values where sensible", () => {
    const params = encodeRescisaoTrabalhistaState({
      inputs: {
        ...fullState.inputs,
        mediaVariavelMensal: 0,
        saldoFgts: undefined,
        saldoFgtsIncluiVerbasRescisorias: false,
        dependentesIr: 0,
        adiantamentoDecimoTerceiro: 0,
        adiantamentoFerias: 0,
        outrosCreditos: 0,
        outrosDescontos: 0,
        calcularDescontosLegais: true,
      },
    });

    expect(params.get("mv")).toBeNull();
    expect(params.get("fg")).toBeNull();
    expect(params.get("fi")).toBeNull();
    expect(params.get("dep")).toBeNull();
    expect(params.get("a13")).toBeNull();
    expect(params.get("af")).toBeNull();
    expect(params.get("oc")).toBeNull();
    expect(params.get("od")).toBeNull();
    expect(params.get("dl")).toBe("1");
  });
});

describe("decodeRescisaoTrabalhistaState", () => {
  it("roundtrips full state", () => {
    const params = encodeRescisaoTrabalhistaState(fullState);
    const decoded = decodeRescisaoTrabalhistaState(params);

    expect(decoded).toEqual(fullState);
  });

  it("decodes minimal valid params with optional defaults", () => {
    const params = new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0");
    const decoded = decodeRescisaoTrabalhistaState(params);

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.mediaVariavelMensal).toBe(0);
    expect(decoded!.inputs.saldoFgts).toBeUndefined();
    expect(decoded!.inputs.saldoFgtsIncluiVerbasRescisorias).toBe(false);
    expect(decoded!.inputs.dependentesIr).toBe(0);
    expect(decoded!.inputs.calcularDescontosLegais).toBe(true);
  });

  it("returns null for invalid required values", () => {
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=-1&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=bad&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=x&av=ind&dt=30&fv=0"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=jc&av=ind&dt=30&fv=0"))).toBeNull();
  });

  it("returns null for impossible ranges and invalid optional params", () => {
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2026-02-01&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=ind&dt=31&fv=0"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0&fg=-10"))).toBeNull();
    expect(decodeRescisaoTrabalhistaState(new URLSearchParams("s=3000&ad=2025-01-01&dd=2026-01-31&mt=sjc&av=ind&dt=30&fv=0&dl=maybe"))).toBeNull();
  });
});

describe("generateRescisaoTrabalhistaShareUrl", () => {
  it("generates a shareable URL with compact query params", () => {
    const url = generateRescisaoTrabalhistaShareUrl(
      "https://calculaderia.test/calculadoras/rescisao-trabalhista",
      fullState
    );

    expect(url).toContain("https://calculaderia.test/calculadoras/rescisao-trabalhista?");
    expect(url).toContain("mt=ac");
    expect(url).toContain("av=ind");
    expect(url).toContain("fi=1");
  });
});
