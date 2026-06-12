import { describe, expect, it } from "vitest";
import { decodeFeriasState, encodeFeriasState, generateFeriasShareUrl, type FeriasUrlState } from "./ferias";

const fullState: FeriasUrlState = {
  inputs: {
    salarioMensal: 4500,
    mediaVariavelMensal: 600,
    modo: "gozo",
    dataInicioPeriodoAquisitivo: "2025-06-01",
    dataReferencia: "2026-06-07",
    dataInicioFerias: "2026-07-01",
    faltasInjustificadas: 0,
    diasFerias: 20,
    converterAbono: true,
    diasAbono: 10,
    incluirSalarioDiasVendidos: true,
    dependentesIr: 2,
    pensaoAlimenticia: 300,
    outrosDescontos: 150,
    outrosAcrescimos: 250,
    calcularDescontosLegais: true,
  },
};

describe("encodeFeriasState", () => {
  it("encodes full state with compact params and mode codes", () => {
    const params = encodeFeriasState(fullState);

    expect(params.get("s")).toBe("4500");
    expect(params.get("mv")).toBe("600");
    expect(params.get("m")).toBe("g");
    expect(params.get("ai")).toBe("2025-06-01");
    expect(params.get("ref")).toBe("2026-06-07");
    expect(params.get("fi")).toBe("2026-07-01");
    expect(params.get("fa")).toBe("0");
    expect(params.get("df")).toBe("20");
    expect(params.get("ab")).toBe("1");
    expect(params.get("da")).toBe("10");
    expect(params.get("sv")).toBe("1");
    expect(params.get("dep")).toBe("2");
    expect(params.get("pa")).toBe("300");
    expect(params.get("od")).toBe("150");
    expect(params.get("oc")).toBe("250");
    expect(params.get("dl")).toBe("1");
  });

  it("omits zero optional values where sensible", () => {
    const params = encodeFeriasState({
      inputs: {
        ...fullState.inputs,
        mediaVariavelMensal: 0,
        diasFerias: 30,
        converterAbono: false,
        diasAbono: 0,
        dependentesIr: 0,
        pensaoAlimenticia: 0,
        outrosDescontos: 0,
        outrosAcrescimos: 0,
        calcularDescontosLegais: false,
      },
    });

    expect(params.get("mv")).toBeNull();
    expect(params.get("da")).toBeNull();
    expect(params.get("sv")).toBeNull();
    expect(params.get("dep")).toBeNull();
    expect(params.get("pa")).toBeNull();
    expect(params.get("od")).toBeNull();
    expect(params.get("oc")).toBeNull();
    expect(params.get("ab")).toBe("0");
    expect(params.get("dl")).toBe("0");
  });
});

describe("decodeFeriasState", () => {
  it("roundtrips full state", () => {
    const params = encodeFeriasState(fullState);
    const decoded = decodeFeriasState(params);

    expect(decoded).toEqual(fullState);
  });

  it("decodes minimal valid params with optional defaults", () => {
    const params = new URLSearchParams("s=3000&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=30");
    const decoded = decodeFeriasState(params);

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.mediaVariavelMensal).toBe(0);
    expect(decoded!.inputs.converterAbono).toBe(false);
    expect(decoded!.inputs.diasAbono).toBe(0);
    expect(decoded!.inputs.incluirSalarioDiasVendidos).toBe(true);
    expect(decoded!.inputs.calcularDescontosLegais).toBe(true);
  });

  it("decodes proportional and overdue mode codes", () => {
    expect(
      decodeFeriasState(new URLSearchParams("s=3000&m=p&ai=2026-01-01&ref=2026-06-15&fi=2026-07-01&fa=0&df=30"))
        ?.inputs.modo
    ).toBe("proporcional");
    expect(
      decodeFeriasState(new URLSearchParams("s=3000&m=v&ai=2025-01-01&ref=2026-06-07&fi=2027-01-01&fa=0&df=30"))
        ?.inputs.modo
    ).toBe("vencidas");
  });

  it("returns null for invalid required values", () => {
    expect(decodeFeriasState(new URLSearchParams("s=-1&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=30"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=x&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=30"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=g&ai=bad&ref=2026-06-07&fi=2026-07-01&fa=0&df=30"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=34&df=30"))).toBeNull();
  });

  it("returns null for impossible abono and range combinations", () => {
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=20&ab=1&da=11"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=20&ab=0&da=10"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=p&ai=2026-01-01&ref=2026-06-15&fi=2026-07-01&fa=0&df=30&ab=1&da=10"))).toBeNull();
    expect(decodeFeriasState(new URLSearchParams("s=3000&m=g&ai=2025-06-01&ref=2025-05-31&fi=2026-07-01&fa=0&df=30"))).toBeNull();
  });
});

describe("generateFeriasShareUrl", () => {
  it("generates a shareable URL with compact query params", () => {
    const url = generateFeriasShareUrl("https://calculaderia.test/calculadoras/ferias", fullState);

    expect(url).toContain("https://calculaderia.test/calculadoras/ferias?");
    expect(url).toContain("m=g");
    expect(url).toContain("ab=1");
    expect(url).toContain("da=10");
  });
});
