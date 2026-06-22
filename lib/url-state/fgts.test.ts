import { describe, expect, it } from "vitest";
import { getDefaultFgtsInputs, type FgtsInputs } from "../calculators/fgts";
import { decodeFgtsState, encodeFgtsState, generateFgtsShareUrl } from "./fgts";

function inputs(overrides: Partial<FgtsInputs> = {}): FgtsInputs {
  return {
    ...getDefaultFgtsInputs(),
    ...overrides,
  };
}

describe("fgts URL state", () => {
  it("keeps minimal/default share state auditable with sv=2026-06-22", () => {
    const params = encodeFgtsState({ inputs: getDefaultFgtsInputs() });

    expect(params.toString()).toBe("sv=2026-06-22");
    expect(decodeFgtsState(params)).toEqual({ inputs: getDefaultFgtsInputs() });
  });

  it("round-trips the full calculator state", () => {
    const state = {
      inputs: inputs({
        baseMensalFgts: 4500,
        meses: 18,
        tipoDeposito: "aprendiz2",
        baseDecimoTerceiro: 0,
        baseVerbasRescisoriasFgts: 1200,
        depositosExtrasInformados: 99.5,
        saldoFgtsInformado: 10000,
        saldoIncluiDepositosEstimados: true,
        motivoRescisao: "culpaReciprocaForcaMaior",
        mostrarSaqueEstimado: false,
      }),
    };

    const params = encodeFgtsState(state);

    expect(params.get("sv")).toBe("2026-06-22");
    expect(params.get("s")).toBe("4500");
    expect(params.get("m")).toBe("18");
    expect(params.get("tp")).toBe("a2");
    expect(params.get("d13")).toBe("0");
    expect(params.get("vr")).toBe("1200");
    expect(params.get("ex")).toBe("99.5");
    expect(params.get("fg")).toBe("10000");
    expect(params.get("fi")).toBe("1");
    expect(params.get("mt")).toBe("cfm");
    expect(params.get("sq")).toBe("0");
    expect(decodeFgtsState(params)).toEqual(state);
  });

  it("preserves zero optional amounts that differ from defaults", () => {
    const state = {
      inputs: inputs({
        baseDecimoTerceiro: 0,
        saldoFgtsInformado: 0,
        motivoRescisao: "semJustaCausa",
      }),
    };

    const params = encodeFgtsState(state);

    expect(params.get("d13")).toBe("0");
    expect(params.get("fg")).toBe("0");
    expect(decodeFgtsState(params)).toEqual(state);
  });

  it("rejects missing or unsupported source versions", () => {
    expect(decodeFgtsState(new URLSearchParams("s=3000"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-21&s=3000"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2027-01-01&s=3000"))).toBeNull();
  });

  it("rejects invalid money, months, enums, and booleans", () => {
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&s=-1"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&m=601"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&m=1.5"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&tp=x"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&mt=x"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&fi=maybe"))).toBeNull();
    expect(decodeFgtsState(new URLSearchParams("sv=2026-06-22&fg=abc"))).toBeNull();
  });

  it("generates source-version-pinned share URLs", () => {
    const url = generateFgtsShareUrl("https://calculaderia.test/calculadoras/fgts", {
      inputs: inputs({ baseMensalFgts: 6000, motivoRescisao: "semJustaCausa" }),
    });

    expect(url).toBe("https://calculaderia.test/calculadoras/fgts?sv=2026-06-22&s=6000&mt=sjc");
  });
});
