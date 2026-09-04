import { describe, expect, it } from "vitest";
import {
  getDefaultInssEmAtrasoInputs,
  type InssEmAtrasoInputs,
} from "../calculators/inss-em-atraso";
import {
  decodeInssEmAtrasoState,
  encodeInssEmAtrasoState,
  generateInssEmAtrasoShareUrl,
} from "./inss-em-atraso";

function inputs(overrides: Partial<InssEmAtrasoInputs> = {}): InssEmAtrasoInputs {
  return {
    ...getDefaultInssEmAtrasoInputs(),
    ...overrides,
  };
}

describe("inss-em-atraso URL state", () => {
  it("encodes the default source-versioned Receita/INSS state", () => {
    const state = { inputs: inputs() };
    const params = encodeInssEmAtrasoState(state);

    expect(params.toString()).toBe(
      "sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci"
    );
    expect(decodeInssEmAtrasoState(params)).toEqual(state);
  });

  it("round-trips all supported non-default values and optional manual days", () => {
    const state = {
      inputs: inputs({
        valorPrincipal: 178.31,
        competencia: "2026-05",
        categoriaSegurado: "facultativo",
        dataVencimento: "2026-06-15",
        dataPagamento: "2026-07-06",
        diasAtrasoManual: 21,
      }),
    };

    const params = encodeInssEmAtrasoState(state);

    expect(params.get("sv")).toBe("2026-07-06");
    expect(params.get("v")).toBe("178.31");
    expect(params.get("comp")).toBe("2026-05");
    expect(params.get("due")).toBe("2026-06-15");
    expect(params.get("pay")).toBe("2026-07-06");
    expect(params.get("cat")).toBe("fac");
    expect(params.get("days")).toBe("21");
    expect(decodeInssEmAtrasoState(params)).toEqual(state);
  });

  it("omits manual days when absent", () => {
    const params = encodeInssEmAtrasoState({ inputs: inputs({ diasAtrasoManual: null }) });

    expect(params.get("days")).toBeNull();
    expect(decodeInssEmAtrasoState(params)?.inputs.diasAtrasoManual).toBeNull();
  });

  it("restores valid links with missing or unsupported source versions with a warning", () => {
    const missing = decodeInssEmAtrasoState(
      new URLSearchParams("v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci")
    );
    const unsupported = decodeInssEmAtrasoState(
      new URLSearchParams("sv=2026-01-01&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci")
    );

    expect(missing?.warnings).toEqual(["fonteUrlNaoSuportada"]);
    expect(missing?.inputs.valorPrincipal).toBe(324.2);
    expect(unsupported?.warnings).toEqual(["fonteUrlNaoSuportada"]);
  });

  it("rejects invalid money, date, category, and manual days params", () => {
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams("sv=2026-07-06&v=0&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci")
      )
    ).toBeNull();
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams("sv=2026-07-06&v=324.2&comp=2026-13&due=2026-02-16&pay=2026-07-06&cat=ci")
      )
    ).toBeNull();
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams("sv=2026-07-06&v=324.2&comp=2026-01&due=bad&pay=2026-07-06&cat=ci")
      )
    ).toBeNull();
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams("sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=bad&cat=ci")
      )
    ).toBeNull();
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams("sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=mei")
      )
    ).toBeNull();
    expect(
      decodeInssEmAtrasoState(
        new URLSearchParams(
          "sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci&days=bad"
        )
      )
    ).toBeNull();
  });

  it("keeps no-arrears links decodable so the UI can show the blocked state", () => {
    const state = decodeInssEmAtrasoState(
      new URLSearchParams("sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-02-10&cat=ci")
    );

    expect(state?.inputs.dataPagamento).toBe("2026-02-10");
  });

  it("generates stable share URLs without sensitive identifiers", () => {
    const url = generateInssEmAtrasoShareUrl("https://calculaderia.test/calculadoras/inss-em-atraso", {
      inputs: inputs({
        valorPrincipal: 178.31,
        competencia: "2026-05",
        dataVencimento: "2026-06-15",
        dataPagamento: "2026-07-06",
        categoriaSegurado: "facultativo",
      }),
    });

    expect(url).toBe(
      "https://calculaderia.test/calculadoras/inss-em-atraso?sv=2026-07-06&v=178.31&comp=2026-05&due=2026-06-15&pay=2026-07-06&cat=fac"
    );
    expect(url).not.toContain("cpf");
    expect(url).not.toContain("nit");
  });
});
