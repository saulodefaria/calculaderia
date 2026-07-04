import { describe, expect, it } from "vitest";
import {
  MCMV_SOURCE_VERSION,
  avaliarLimiteImovelMinhaCasaMinhaVida,
  avaliarSubsidioMinhaCasaMinhaVida,
  calcularCronogramaMinhaCasaMinhaVida,
  calcularFinanciamentoMinhaCasaMinhaVida,
  classificarFaixaMinhaCasaMinhaVida,
  getDefaultMinhaCasaMinhaVidaInputs,
  selecionarTaxaOficialMinhaCasaMinhaVida,
  validateMinhaCasaMinhaVidaInputs,
  type McmvInputs,
} from "./financiamento-minha-casa-minha-vida";

function inputs(overrides: Partial<McmvInputs> = {}): McmvInputs {
  return {
    ...getDefaultMinhaCasaMinhaVidaInputs(),
    ...overrides,
  };
}

describe("financiamento Minha Casa Minha Vida rules", () => {
  it("classifies income band boundaries from the source version", () => {
    expect(classificarFaixaMinhaCasaMinhaVida(3200)).toBe("faixa1");
    expect(classificarFaixaMinhaCasaMinhaVida(3200.01)).toBe("faixa2");
    expect(classificarFaixaMinhaCasaMinhaVida(5000)).toBe("faixa2");
    expect(classificarFaixaMinhaCasaMinhaVida(5000.01)).toBe("faixa3");
    expect(classificarFaixaMinhaCasaMinhaVida(9600)).toBe("faixa3");
    expect(classificarFaixaMinhaCasaMinhaVida(9600.01)).toBe("classeMedia");
    expect(classificarFaixaMinhaCasaMinhaVida(13000.01)).toBe("foraMcmv");
  });

  it("selects official nominal annual rate rows", () => {
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 2000,
        regiao: "norte-nordeste",
        cotistaFgts: true,
      })?.taxaNominalAnual
    ).toBe(4);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 2000,
        regiao: "sul-sudeste-centro-oeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(4.75);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 3300,
        regiao: "norte-nordeste",
        cotistaFgts: true,
      })?.taxaNominalAnual
    ).toBe(4.75);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 3300,
        regiao: "sul-sudeste-centro-oeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(5.5);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 4500,
        regiao: "norte-nordeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(6.5);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 4500,
        regiao: "sul-sudeste-centro-oeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(7);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 8000,
        regiao: "norte-nordeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(7.66);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 8000,
        regiao: "sul-sudeste-centro-oeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(8.16);
    expect(
      selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: 12000,
        regiao: "sul-sudeste-centro-oeste",
        cotistaFgts: false,
      })?.taxaNominalAnual
    ).toBe(10);
  });

  it("evaluates property cap statuses for Faixa 1/2, Faixa 3, and Classe Media", () => {
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "faixa2",
        valorImovel: 200000,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("withinNationalLowerBound");
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "faixa2",
        valorImovel: 250000,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("verifyLocalCap");
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "faixa2",
        valorImovel: 280000,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("aboveSourceRange");
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "faixa3",
        valorImovel: 400000,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("withinNationalCap");
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "faixa3",
        valorImovel: 400000.01,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("aboveSourceCap");
    expect(
      avaliarLimiteImovelMinhaCasaMinhaVida({
        faixaPrograma: "classeMedia",
        valorImovel: 600000,
        limiteLocalFaixa12: null,
      }).code
    ).toBe("withinClasseMediaCap");
  });

  it("warns for subsidy caps by region and income", () => {
    expect(
      avaliarSubsidioMinhaCasaMinhaVida({
        rendaMensalBruta: 4500,
        regiao: "norte-nordeste",
        subsidioInformado: 65000,
      })
    ).toEqual([]);
    expect(
      avaliarSubsidioMinhaCasaMinhaVida({
        rendaMensalBruta: 4500,
        regiao: "sul-sudeste-centro-oeste",
        subsidioInformado: 65000,
      })
    ).toEqual([{ code: "subsidioAcimaTetoFonte", sourceCap: 55000 }]);
    expect(
      avaliarSubsidioMinhaCasaMinhaVida({
        rendaMensalBruta: 6000,
        regiao: "sul-sudeste-centro-oeste",
        subsidioInformado: 10000,
      })
    ).toEqual([{ code: "subsidioForaFaixaFonte", sourceCap: null }]);
  });
});

describe("calcularFinanciamentoMinhaCasaMinhaVida", () => {
  it("uses official source metadata and composes the financed amount", () => {
    const result = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        valorImovel: 250000,
        entradaRecursosProprios: 20000,
        fgtsEntrada: 5000,
        subsidioInformado: 30000,
      })
    );

    expect(result.sourceVersion.sourceVersion).toBe(MCMV_SOURCE_VERSION);
    expect(result.faixaPrograma).toBe("faixa2");
    expect(result.subfaixaRendaTaxa?.taxaNominalAnual).toBe(7);
    expect(result.valorFinanciadoEstimado).toBe(195000);
    expect(result.totalEntradaInformada).toBe(25000);
    expect(result.valorSubsidioInformado).toBe(30000);
    expect(result.ltvEstimado).toBeCloseTo(0.78, 4);
    expect(result.taxaMensalParaSimulacao).toBeCloseTo(0.0058333333, 10);
    expect(result.taxaEfetivaAnualEquivalente).toBeCloseTo(0.07229, 4);
    expect(result.eligibilityWarnings).toContain("subsidioNaoCalculado");
  });

  it("calculates the Microsoft PMT fixed-rate Price fixture with nominal annual conversion", () => {
    const result = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        valorImovel: 10000,
        entradaRecursosProprios: 0,
        fgtsEntrada: 0,
        subsidioInformado: 0,
        usarTaxaOficial: false,
        taxaNominalAnualManual: 8,
        prazoMeses: 10,
        metodo: "price",
        compararMetodos: false,
      })
    );

    expect(result.taxaNominalAnualSelecionada).toBe(8);
    expect(result.primeiraParcela).toBe(1037.03);
    expect(result.totalParcelas).toBeCloseTo(10370.3, 1);
    expect(result.totalJuros).toBeCloseTo(370.3, 1);
    expect(result.parcelas.at(-1)?.saldoFinal).toBe(0);
    expect(result.eligibilityWarnings).toContain("taxaManual");
  });

  it("calculates a deterministic SAC schedule and comparison", () => {
    const schedule = calcularCronogramaMinhaCasaMinhaVida({
      valorFinanciado: 1000,
      taxaNominalAnual: 36,
      prazoMeses: 4,
      metodo: "sac",
    });

    expect(schedule.parcelas.map((parcela) => parcela.parcela)).toEqual([280, 272.5, 265, 257.5]);
    expect(schedule.resumo.totalJuros).toBe(75);
    expect(schedule.resumo.totalParcelas).toBe(1075);
    expect(schedule.parcelas.at(-1)?.saldoFinal).toBe(0);

    const result = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        valorImovel: 1000,
        entradaRecursosProprios: 0,
        usarTaxaOficial: false,
        taxaNominalAnualManual: 24,
        prazoMeses: 4,
        metodo: "sac",
        compararMetodos: true,
      })
    );
    expect(result.comparacao?.sac.totalJuros).toBe(50);
    expect(result.comparacao?.price.totalJuros).toBeGreaterThan(0);
  });

  it("handles zero-rate Price and SAC scenarios", () => {
    const price = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        valorImovel: 12000,
        entradaRecursosProprios: 0,
        usarTaxaOficial: false,
        taxaNominalAnualManual: 0,
        prazoMeses: 12,
        metodo: "price",
        compararMetodos: true,
      })
    );
    const sac = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        valorImovel: 12000,
        entradaRecursosProprios: 0,
        usarTaxaOficial: false,
        taxaNominalAnualManual: 0,
        prazoMeses: 12,
        metodo: "sac",
        compararMetodos: false,
      })
    );

    expect(price.primeiraParcela).toBe(1000);
    expect(price.ultimaParcela).toBe(1000);
    expect(price.totalJuros).toBe(0);
    expect(price.comparacao?.price.totalParcelas).toBe(12000);
    expect(price.comparacao?.sac.totalParcelas).toBe(12000);
    expect(sac.primeiraParcela).toBe(1000);
    expect(sac.totalJuros).toBe(0);
  });

  it("returns outside-MCMV status without auto-selecting an official rate", () => {
    const result = calcularFinanciamentoMinhaCasaMinhaVida(
      inputs({
        rendaMensalBruta: 13000.01,
        usarTaxaOficial: true,
      })
    );

    expect(result.faixaPrograma).toBe("foraMcmv");
    expect(result.calculoDisponivel).toBe(false);
    expect(result.taxaNominalAnualSelecionada).toBeNull();
    expect(result.subfaixaRendaTaxa).toBeNull();
    expect(result.eligibilityWarnings).toEqual(expect.arrayContaining(["foraMcmv", "taxaOficialIndisponivel"]));
  });

  it("validates impossible or unsupported inputs", () => {
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ rendaMensalBruta: 0 }))).toContain("rendaMensalBruta");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ valorImovel: 0 }))).toContain("valorImovel");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ entradaRecursosProprios: -1 }))).toContain("entradaRecursosProprios");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ fgtsEntrada: -1 }))).toContain("fgtsEntrada");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ subsidioInformado: -1 }))).toContain("subsidioInformado");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ subsidioInformado: 250000 }))).toContain(
      "valorFinanciadoEstimado"
    );
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ prazoMeses: 421 }))).toContain("prazoMeses");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ limiteLocalFaixa12: 200000 }))).toContain("limiteLocalFaixa12");
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ usarTaxaOficial: false, taxaNominalAnualManual: null }))).toContain(
      "taxaNominalAnualManual"
    );
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ usarTaxaOficial: false, taxaNominalAnualManual: 30.01 }))).toContain(
      "taxaNominalAnualManual"
    );
    expect(validateMinhaCasaMinhaVidaInputs(inputs({ metodo: "foo" as "sac" }))).toContain("metodo");
  });
});
