import { describe, expect, it } from "vitest";
import {
  decodeSeguroDesempregoState,
  encodeSeguroDesempregoState,
  generateSeguroDesempregoShareUrl,
  type SeguroDesempregoUrlState,
} from "./seguro-desemprego";

const fullState: SeguroDesempregoUrlState = {
  inputs: {
    salarioUltimo: 4200,
    salarioPenultimo: 3900,
    salarioAntepenultimo: 3600,
    numeroSolicitacao: "segunda",
    mesesComSalarioElegibilidade: 10,
    mesesTrabalhados36: 12,
    motivoDispensa: "rescisaoIndireta",
    dataDispensa: "2026-06-01",
    dataRequerimento: "2026-06-08",
    desempregadoNoRequerimento: true,
    semRendaPropriaSuficiente: false,
    semBeneficioContinuadoIncompativel: true,
    tabelaAno: 2026,
  },
};

describe("encodeSeguroDesempregoState", () => {
  it("encodes full state with compact params and a required 2026 table pin", () => {
    const params = encodeSeguroDesempregoState(fullState);

    expect(params.get("tb")).toBe("2026");
    expect(params.get("s1")).toBe("4200");
    expect(params.get("s2")).toBe("3900");
    expect(params.get("s3")).toBe("3600");
    expect(params.get("sol")).toBe("2");
    expect(params.get("me")).toBe("10");
    expect(params.get("m36")).toBe("12");
    expect(params.get("mt")).toBe("ri");
    expect(params.get("dd")).toBe("2026-06-01");
    expect(params.get("rq")).toBe("2026-06-08");
    expect(params.get("de")).toBe("1");
    expect(params.get("sr")).toBe("0");
    expect(params.get("bp")).toBe("1");
  });

  it("includes tb=2026 even when encoding defaults", () => {
    const params = encodeSeguroDesempregoState({
      inputs: {
        ...fullState.inputs,
        salarioUltimo: 3000,
        salarioPenultimo: 3000,
        salarioAntepenultimo: 3000,
        numeroSolicitacao: "primeira",
        mesesComSalarioElegibilidade: 12,
        mesesTrabalhados36: 12,
        motivoDispensa: "semJustaCausa",
        dataDispensa: "",
        desempregadoNoRequerimento: true,
        semRendaPropriaSuficiente: true,
      },
    });

    expect(params.get("tb")).toBe("2026");
    expect(params.toString()).toContain("tb=2026");
  });

  it("preserves blank optional salaries as zero in generated share params", () => {
    const oneSalaryState: SeguroDesempregoUrlState = {
      inputs: {
        ...fullState.inputs,
        salarioUltimo: 1900,
        salarioPenultimo: 0,
        salarioAntepenultimo: 0,
      },
    };
    const twoSalaryState: SeguroDesempregoUrlState = {
      inputs: {
        ...fullState.inputs,
        salarioUltimo: 2500,
        salarioPenultimo: 3000,
        salarioAntepenultimo: 0,
      },
    };

    const oneSalaryParams = encodeSeguroDesempregoState(oneSalaryState);
    expect(oneSalaryParams.get("s1")).toBe("1900");
    expect(oneSalaryParams.get("s2")).toBe("0");
    expect(oneSalaryParams.get("s3")).toBe("0");
    expect(decodeSeguroDesempregoState(oneSalaryParams)).toEqual(oneSalaryState);

    const twoSalaryParams = encodeSeguroDesempregoState(twoSalaryState);
    expect(twoSalaryParams.get("s1")).toBe("2500");
    expect(twoSalaryParams.get("s2")).toBe("3000");
    expect(twoSalaryParams.get("s3")).toBe("0");
    expect(decodeSeguroDesempregoState(twoSalaryParams)).toEqual(twoSalaryState);
  });
});

describe("decodeSeguroDesempregoState", () => {
  it("roundtrips full state", () => {
    const decoded = decodeSeguroDesempregoState(encodeSeguroDesempregoState(fullState));

    expect(decoded).toEqual(fullState);
  });

  it("decodes table-pinned default state from tb=2026 only", () => {
    const decoded = decodeSeguroDesempregoState(new URLSearchParams("tb=2026"));

    expect(decoded).not.toBeNull();
    expect(decoded!.inputs.salarioUltimo).toBe(3000);
    expect(decoded!.inputs.numeroSolicitacao).toBe("primeira");
    expect(decoded!.inputs.motivoDispensa).toBe("semJustaCausa");
    expect(decoded!.inputs.tabelaAno).toBe(2026);
  });

  it("returns null for unsupported table years, enums, money, months, booleans, and dates", () => {
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2027"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&sol=9"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&mt=x"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&s1=-1"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&me=37"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&m36=1.5"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&de=maybe"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&dd=2026-02-31"))).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("tb=2026&dd=2026-06-01&rq=2026-05-31"))).toBeNull();
  });

  it("returns null when params are empty or the table pin is absent", () => {
    expect(decodeSeguroDesempregoState(new URLSearchParams())).toBeNull();
    expect(decodeSeguroDesempregoState(new URLSearchParams("s1=3000&sol=1"))).toBeNull();
  });
});

describe("generateSeguroDesempregoShareUrl", () => {
  it("generates a share URL with tb=2026 and compact params", () => {
    const url = generateSeguroDesempregoShareUrl("https://calculaderia.test/calculadoras/seguro-desemprego", fullState);

    expect(url).toContain("https://calculaderia.test/calculadoras/seguro-desemprego?");
    expect(url).toContain("tb=2026");
    expect(url).toContain("s1=4200");
    expect(url).toContain("sol=2");
    expect(url).toContain("mt=ri");
  });
});
