import { describe, expect, it } from "vitest";
import {
  getDefaultSalarioPorHoraInputs,
  type SalarioPorHoraInputs,
} from "../calculators/salario-por-hora";
import {
  decodeSalarioPorHoraState,
  encodeSalarioPorHoraState,
  generateSalarioPorHoraShareUrl,
} from "./salario-por-hora";

function inputs(overrides: Partial<SalarioPorHoraInputs> = {}): SalarioPorHoraInputs {
  return {
    ...getDefaultSalarioPorHoraInputs(),
    ...overrides,
  };
}

describe("salario-por-hora URL state", () => {
  it("keeps default share state auditable with source version, mode, divisor mode, and weekly hours", () => {
    const state = { inputs: inputs() };
    const params = encodeSalarioPorHoraState(state);

    expect(params.toString()).toBe("sv=2026-07-05&md=mh&dm=sem&js=44");
    expect(decodeSalarioPorHoraState(params)).toEqual(state);
  });

  it("round-trips a full monthly salary to hourly state", () => {
    const state = {
      inputs: inputs({
        salarioMensal: 6000,
        jornadaSemanal: 40,
        horasPeriodo: 120,
        adicionalPercentual: 75,
        mostrarAdicional: false,
      }),
    };

    const params = encodeSalarioPorHoraState(state);

    expect(params.get("sv")).toBe("2026-07-05");
    expect(params.get("md")).toBe("mh");
    expect(params.get("dm")).toBe("sem");
    expect(params.get("js")).toBe("40");
    expect(params.get("s")).toBe("6000");
    expect(params.get("hp")).toBe("120");
    expect(params.get("ap")).toBe("75");
    expect(params.get("ma")).toBe("0");
    expect(decodeSalarioPorHoraState(params)).toEqual(state);
  });

  it("round-trips an hourly to monthly state without leaking salary-only assumptions", () => {
    const state = {
      inputs: inputs({
        modo: "horaParaMensal",
        salarioMensal: 3000,
        valorHora: 35.5,
        jornadaSemanal: 36,
      }),
    };

    const params = encodeSalarioPorHoraState(state);

    expect(params.get("md")).toBe("hm");
    expect(params.get("vh")).toBe("35.5");
    expect(params.get("js")).toBe("36");
    expect(params.get("s")).toBeNull();
    expect(decodeSalarioPorHoraState(params)).toEqual(state);
  });

  it("round-trips manual divisor state with zero period hours", () => {
    const state = {
      inputs: inputs({
        divisorModo: "manual",
        divisorMensalManual: 180,
        horasPeriodo: 0,
      }),
    };

    const params = encodeSalarioPorHoraState(state);

    expect(params.get("dm")).toBe("man");
    expect(params.get("hmn")).toBe("180");
    expect(params.get("hp")).toBe("0");
    expect(decodeSalarioPorHoraState(params)).toEqual(state);
  });

  it("returns a warning for missing or unsupported source versions while restoring valid inputs", () => {
    const missing = decodeSalarioPorHoraState(new URLSearchParams("md=mh&dm=sem&js=44&s=3000"));
    const unsupported = decodeSalarioPorHoraState(new URLSearchParams("sv=2026-01-01&md=mh&dm=sem&js=44&s=3000"));

    expect(missing?.warnings).toEqual(["fonteUrlNaoSuportada"]);
    expect(missing?.inputs.salarioMensal).toBe(3000);
    expect(unsupported?.warnings).toEqual(["fonteUrlNaoSuportada"]);
  });

  it("rejects invalid mode, money, divisor, hours, additional percent, and booleans", () => {
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=bad&dm=sem&js=44"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=bad&js=44"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=sem&js=44&s=-1"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=hm&dm=sem&js=44&vh=0"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=sem&js=61"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=man&hmn=0"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=sem&js=44&hp=1001"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=sem&js=44&ap=301"))).toBeNull();
    expect(decodeSalarioPorHoraState(new URLSearchParams("sv=2026-07-05&md=mh&dm=sem&js=44&ma=maybe"))).toBeNull();
  });

  it("generates stable share URLs", () => {
    const url = generateSalarioPorHoraShareUrl("https://calculaderia.test/calculadoras/salario-por-hora", {
      inputs: inputs({ salarioMensal: 5000, divisorModo: "manual", divisorMensalManual: 180, horasPeriodo: 12 }),
    });

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/salario-por-hora?sv=2026-07-05&md=mh&dm=man&hmn=180&s=5000&hp=12"
    );
  });
});
