import { describe, expect, it } from "vitest";
import {
  CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  getDefaultCalculadoraFinanceiraOnlineInputs,
  type CalculadoraFinanceiraOnlineInputs,
} from "../calculators/calculadora-financeira-online";
import {
  decodeCalculadoraFinanceiraOnlineState,
  encodeCalculadoraFinanceiraOnlineState,
  generateCalculadoraFinanceiraOnlineShareUrl,
} from "./calculadora-financeira-online";

function inputs(overrides: Partial<CalculadoraFinanceiraOnlineInputs> = {}): CalculadoraFinanceiraOnlineInputs {
  const defaults = getDefaultCalculadoraFinanceiraOnlineInputs();
  return {
    ...defaults,
    ...overrides,
    tvm: {
      ...defaults.tvm,
      ...overrides.tvm,
    },
    cashflows: {
      ...defaults.cashflows,
      ...overrides.cashflows,
    },
  };
}

describe("calculadora financeira online URL state", () => {
  it("keeps the default TVM share state auditable with sv=2026-06-25", () => {
    const state = { inputs: getDefaultCalculadoraFinanceiraOnlineInputs() };
    const params = encodeCalculadoraFinanceiraOnlineState(state);

    expect(params.get("m")).toBe("t");
    expect(params.get("sf")).toBe("pmt");
    expect(params.get("sv")).toBe(CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION);
    expect(decodeCalculadoraFinanceiraOnlineState(params)).toEqual(state);
  });

  it("round-trips full signed TVM state", () => {
    const state = {
      inputs: inputs({
        mode: "tvm",
        tvm: {
          solveFor: "i",
          n: 24,
          i: 0,
          pv: -100000,
          pmt: 4707.35,
          fv: -5000,
          paymentTiming: "begin",
        },
      }),
    };

    const params = encodeCalculadoraFinanceiraOnlineState(state);

    expect(params.get("m")).toBe("t");
    expect(params.get("sf")).toBe("i");
    expect(params.get("n")).toBe("24");
    expect(params.get("pv")).toBe("-100000");
    expect(params.get("pmt")).toBe("4707.35");
    expect(params.get("fv")).toBe("-5000");
    expect(params.get("due")).toBe("1");
    expect(decodeCalculadoraFinanceiraOnlineState(params)).toEqual(state);
  });

  it("round-trips ordered cash-flow state exactly", () => {
    const state = {
      inputs: inputs({
        mode: "cashflows",
        cashflows: {
          discountRate: 10,
          cashflows: [-1000, 400, 400, 400],
          periodLabel: "monthly",
        },
      }),
    };

    const params = encodeCalculadoraFinanceiraOnlineState(state);

    expect(params.get("m")).toBe("c");
    expect(params.get("dr")).toBe("10");
    expect(params.get("cf")).toBe("-1000,400,400,400");
    expect(params.get("pl")).toBe("m");
    expect(params.get("sv")).toBe("2026-06-25");
    expect(decodeCalculadoraFinanceiraOnlineState(params)).toEqual(state);
  });

  it("rejects unknown modes, solve targets, timing, source versions, and bad numbers", () => {
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=t&sf=pmt"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=x&sf=pmt&sv=2026-06-25"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=t&sf=x&sv=2026-06-25"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=t&sf=pmt&due=2&sv=2026-06-25"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=t&sf=pmt&i=-100&sv=2026-06-25"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=t&sf=pmt&sv=2027-01-01"))).toBeNull();
  });

  it("rejects invalid cash-flow URL state but allows IRR-invalid signs for display errors", () => {
    const allPositive = decodeCalculadoraFinanceiraOnlineState(
      new URLSearchParams("m=c&dr=10&cf=100,200,300&sv=2026-06-25")
    );

    expect(allPositive?.inputs.cashflows.cashflows).toEqual([100, 200, 300]);
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=c&dr=bad&cf=-100,200&sv=2026-06-25"))).toBeNull();
    expect(decodeCalculadoraFinanceiraOnlineState(new URLSearchParams("m=c&dr=10&cf=-100,,200&sv=2026-06-25"))).toBeNull();
    expect(
      decodeCalculadoraFinanceiraOnlineState(
        new URLSearchParams(`m=c&dr=10&cf=${Array.from({ length: 101 }, (_, index) => index).join(",")}&sv=2026-06-25`)
      )
    ).toBeNull();
  });

  it("generates localized route share URLs with the required source version", () => {
    const url = generateCalculadoraFinanceiraOnlineShareUrl(
      "https://calculaderia.test/en/calculadoras/calculadora-financeira-online",
      {
        inputs: inputs({
          mode: "cashflows",
          cashflows: {
            discountRate: 10,
            cashflows: [-1000, 400, 400, 400],
            periodLabel: "periodic",
          },
        }),
      }
    );

    expect(url).toBe(
      "https://calculaderia.test/en/calculadoras/calculadora-financeira-online?m=c&sv=2026-06-25&dr=10&cf=-1000%2C400%2C400%2C400"
    );
  });
});
