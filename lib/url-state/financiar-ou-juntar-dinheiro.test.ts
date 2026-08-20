import { describe, expect, it } from "vitest";
import {
  getDefaultFinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarDinheiroInputs,
} from "../calculators/financiar-ou-juntar-dinheiro";
import {
  FINANCIAR_OU_JUNTAR_PARAM_KEYS,
  decodeFinanciarOuJuntarDinheiroState,
  encodeFinanciarOuJuntarDinheiroState,
  generateFinanciarOuJuntarDinheiroShareUrl,
} from "./financiar-ou-juntar-dinheiro";

function paramsFor(overrides: Partial<FinanciarOuJuntarDinheiroInputs> = {}) {
  return encodeFinanciarOuJuntarDinheiroState({
    inputs: { ...getDefaultFinanciarOuJuntarDinheiroInputs(), ...overrides },
  });
}

describe("financiar-ou-juntar-dinheiro URL state", () => {
  it("encodes every default field with compact stable keys", () => {
    const params = paramsFor();

    expect(params.toString()).toBe(
      "sv=1&vi=500000&cp=100000&mt=s&jf=10&pf=360&ai=5&ap=3000&ri=8&al=2500&ra=5&h=360"
    );
    expect([...params.keys()].sort()).toEqual(Object.values(FINANCIAR_OU_JUNTAR_PARAM_KEYS).sort());
  });

  it.each(["sac", "price"] as const)("round-trips a complete non-default %s state", (metodo) => {
    const original: FinanciarOuJuntarDinheiroInputs = {
      valorImovel: 999999.99,
      capitalInicial: 0,
      metodo,
      taxaFinanciamentoAnual: 0,
      prazoFinanciamentoMeses: 600,
      valorizacaoAnualImovel: 0,
      aporteMensalLiquido: 0,
      rendimentoAnualInvestimento: 100,
      aluguelMensalInicial: 0,
      crescimentoAnualAluguel: 50,
      horizonteMeses: 1200,
    };

    expect(decodeFinanciarOuJuntarDinheiroState(paramsFor(original))?.inputs).toEqual(original);
  });

  it("round-trips documented maximum values", () => {
    const original: FinanciarOuJuntarDinheiroInputs = {
      valorImovel: 1e12,
      capitalInicial: 1e12,
      metodo: "price",
      taxaFinanciamentoAnual: 100,
      prazoFinanciamentoMeses: 600,
      valorizacaoAnualImovel: 50,
      aporteMensalLiquido: 1e9,
      rendimentoAnualInvestimento: 100,
      aluguelMensalInicial: 1e9,
      crescimentoAnualAluguel: 50,
      horizonteMeses: 1200,
    };

    expect(decodeFinanciarOuJuntarDinheiroState(paramsFor(original))?.inputs).toEqual(original);
  });

  it.each(Object.values(FINANCIAR_OU_JUNTAR_PARAM_KEYS))("rejects missing required key %s atomically", (key) => {
    const params = paramsFor();
    params.delete(key);
    expect(decodeFinanciarOuJuntarDinheiroState(params)).toBeNull();
  });

  it.each(Object.values(FINANCIAR_OU_JUNTAR_PARAM_KEYS))("rejects duplicated known key %s", (key) => {
    const params = paramsFor();
    params.append(key, params.get(key) ?? "x");
    expect(decodeFinanciarOuJuntarDinheiroState(params)).toBeNull();
  });

  it.each([
    ["unknown version", "sv", "2"],
    ["bad method", "mt", "sac"],
    ["partial number", "vi", "500000oops"],
    ["localized decimal", "jf", "10,5"],
    ["scientific notation", "vi", "5e5"],
    ["negative zero", "ap", "-0"],
    ["non-finite", "ri", "Infinity"],
    ["fractional term", "pf", "12.5"],
    ["zero term", "pf", "0"],
    ["out of range", "h", "1201"],
    ["capital above price", "cp", "500001"],
  ])("rejects %s", (_label, key, value) => {
    const params = paramsFor();
    params.set(key, value);
    expect(decodeFinanciarOuJuntarDinheiroState(params)).toBeNull();
  });

  it("ignores unrelated unknown keys", () => {
    const params = paramsFor({ metodo: "price" });
    params.set("utm_source", "test");
    params.append("unknown", "one");
    params.append("unknown", "two");

    expect(decodeFinanciarOuJuntarDinheiroState(params)?.inputs.metodo).toBe("price");
  });

  it("generates a localized share URL with inputs only", () => {
    const url = generateFinanciarOuJuntarDinheiroShareUrl(
      "https://calculaderia.test/en/calculadoras/financiar-ou-juntar-dinheiro?old=1",
      { inputs: getDefaultFinanciarOuJuntarDinheiroInputs() }
    );
    const parsed = new URL(url);

    expect(parsed.pathname).toBe("/en/calculadoras/financiar-ou-juntar-dinheiro");
    expect(parsed.searchParams.get("sv")).toBe("1");
    expect(parsed.searchParams.get("status")).toBeNull();
    expect(parsed.searchParams.get("saldo")).toBeNull();
    expect(decodeFinanciarOuJuntarDinheiroState(parsed.searchParams)?.inputs).toEqual(
      getDefaultFinanciarOuJuntarDinheiroInputs()
    );
  });
});
