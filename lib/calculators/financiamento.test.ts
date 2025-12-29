import { describe, it, expect } from "vitest";
import { calculateIrr, getAluguelCorrigidoNoMes, round2 } from "../utils";
import {
  calcularSAC,
  calcularPRICE,
  recalcularComAmortizacoes,
  type InputsFinanciamento,
  type AmortizacaoAdicional,
} from "./financiamento";

describe("calcularSAC", () => {
  it("calcula corretamente SAC básico", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 0,
      taxaJurosAnual: 12, // 12% a.a.
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(100000);
    expect(resultado.parcelas.length).toBe(12);

    // Amortização constante
    const amortizacaoEsperada = 100000 / 12;
    resultado.parcelas.forEach((p) => {
      expect(p.amortizacao).toBeCloseTo(amortizacaoEsperada, 0);
    });

    // Prestações decrescentes (juros diminuem)
    expect(resultado.parcelas[0].prestacao).toBeGreaterThan(resultado.parcelas[11].prestacao);
  });

  it("considera entrada no cálculo", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 20000,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(80000);
  });
});

describe("calcularPRICE", () => {
  it("calcula corretamente PRICE básico", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularPRICE(inputs);

    expect(resultado.valorFinanciado).toBe(100000);
    expect(resultado.parcelas.length).toBe(12);

    // Prestações constantes (com pequena tolerância por arredondamentos)
    const primeiraPrestacao = resultado.parcelas[0].prestacao;
    resultado.parcelas.forEach((p, i) => {
      // Última parcela pode ser ligeiramente diferente devido a arredondamentos
      if (i < resultado.parcelas.length - 1) {
        expect(p.prestacao).toBeCloseTo(primeiraPrestacao, 1);
      }
    });

    // Amortização crescente
    expect(resultado.parcelas[0].amortizacao).toBeLessThan(resultado.parcelas[11].amortizacao);
  });
});

describe("calcularPRICE - TIR com aluguel", () => {
  it("permite cashflow mensal positivo quando aluguel > prestação", () => {
    const baseInputs: InputsFinanciamento = {
      valorEmprestimo: 300_000,
      valorEntrada: 60_000,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const base = calcularPRICE(baseInputs);
    const prestacaoBase = base.parcelas[0]?.prestacao ?? 0;
    expect(prestacaoBase).toBeGreaterThan(0);

    // Garante que o aluguel supera a prestação, gerando fluxo mensal positivo.
    const aluguelMensal = round2(prestacaoBase + 100);

    const inputs: InputsFinanciamento = {
      ...baseInputs,
      aluguelMensal,
      correcaoAnualAluguel: 0,
    };

    const resultado = calcularPRICE(inputs);
    expect(resultado.tirMensal).not.toBeNull();

    // Reconstrói os cashflows esperados a partir das parcelas e valida que batem com a TIR calculada.
    const cashflows = resultado.parcelas.map((p) => {
      const aluguelNoMes = getAluguelCorrigidoNoMes(p.mes, aluguelMensal, 0);
      return round2(aluguelNoMes - p.prestacao);
    });

    // Entrada como saída no primeiro mês
    cashflows[0] -= inputs.valorEntrada;
    // Valor do imóvel no último mês
    cashflows[cashflows.length - 1] += resultado.valorImovelFinal;

    // Deve existir pelo menos um mês intermediário com fluxo positivo devido ao aluguel > prestação.
    expect(cashflows.slice(1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });
});

describe("recalcularComAmortizacoes - tipo PRAZO", () => {
  it("SAC com amortização tipo PRAZO: mantém prestação parecida e reduz bastante o prazo (cenário real)", () => {
    const inputs: InputsFinanciamento = {
      // Caso reportado pelo usuário (link compartilhado)
      valorEmprestimo: 371753,
      valorEntrada: 0,
      taxaJurosAnual: 9.3764,
      meses: 420,
      correcaoAnualImovel: 6,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 1, valor: 140000, tipo: "prazo" }];

    const resultadoOriginal = calcularSAC(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // Sanity: amortização extra aplicada no mês 1 reduz fortemente o saldo
    expect(resultadoComAmortizacao.parcelas[0].amortizacaoAdicional).toBeCloseTo(140000, 2);
    expect(resultadoComAmortizacao.parcelas[0].saldoDevedor).toBeCloseTo(230867.87, 2);

    // Prazo: a prestação deve se manter parecida (não deve despencar como em modo "parcela")
    const prestacaoMes1 = resultadoComAmortizacao.parcelas[0].prestacao;
    const prestacaoMes2 = resultadoComAmortizacao.parcelas[1].prestacao;
    const diffPrestacao = Math.abs(prestacaoMes2 - prestacaoMes1) / prestacaoMes1;
    expect(diffPrestacao).toBeLessThan(0.05);

    // SAC: ao escolher "prazo", a amortização mensal deve aumentar (para manter a prestação e reduzir mais meses)
    const amortizacaoOriginal = resultadoOriginal.parcelas[0].amortizacao;
    expect(resultadoComAmortizacao.parcelas[1].amortizacao).toBeGreaterThan(amortizacaoOriginal * 1.8);

    // O prazo deve ser menor que o original
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(resultadoComAmortizacao.mesesOriginais);
    // E, neste cenário, a redução deve ser bem expressiva (se não, o comportamento está mais perto de "parcela")
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(200);

    // Economia de juros deve existir
    expect(resultadoComAmortizacao.economiaJuros).toBeGreaterThan(0);
  });

  it("PRICE com amortização tipo PRAZO: mantém prestação base e reduz prazo", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 12, valor: 40000, tipo: "prazo" }];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // Parcelas antes da amortização adicional devem ter prestação similar à original
    for (let i = 0; i < 11; i++) {
      expect(resultadoComAmortizacao.parcelas[i].prestacao).toBeCloseTo(prestacaoOriginal, 1);
    }

    // A parcela do mês 12 tem a amortização adicional
    expect(resultadoComAmortizacao.parcelas[11].amortizacaoAdicional).toBe(40000);

    // Após a amortização adicional, a prestação deve permanecer similar
    // (não deve diminuir significativamente para tipo PRAZO)
    // IMPORTANTE: excluir a última parcela, pois ela é a quitação final e pode ser menor
    for (let i = 12; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      // A prestação deve estar próxima da original (tolerância de 5% para arredondamentos)
      const diferencaPercentual =
        Math.abs(resultadoComAmortizacao.parcelas[i].prestacao - prestacaoOriginal) / prestacaoOriginal;
      expect(diferencaPercentual).toBeLessThan(0.05);
    }

    // O prazo deve ser menor que o original
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(resultadoComAmortizacao.mesesOriginais);

    // Economia de juros
    expect(resultadoComAmortizacao.economiaJuros).toBeGreaterThan(0);
  });

  it("PRICE com múltiplas amortizações tipo PRAZO: mantém prestação base", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 36,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 20000, tipo: "prazo" },
      { mes: 12, valor: 20000, tipo: "prazo" },
      { mes: 18, valor: 20000, tipo: "prazo" },
    ];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // Verificar que as prestações ao longo do tempo permanecem próximas da original
    // (exceto a última que pode ser diferente por ser quitação final)
    for (let i = 0; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      const diferencaPercentual =
        Math.abs(resultadoComAmortizacao.parcelas[i].prestacao - prestacaoOriginal) / prestacaoOriginal;
      // Tolerância de 5% para arredondamentos
      expect(diferencaPercentual).toBeLessThan(0.05);
    }

    // Prazo reduzido
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(36);
  });
});

describe("recalcularComAmortizacoes - tipo PARCELA", () => {
  it("SAC com amortização tipo PARCELA: mantém prazo e reduz amortização", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 6, valor: 30000, tipo: "parcela" }];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // O prazo deve permanecer o mesmo
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(resultadoComAmortizacao.mesesOriginais);

    // Após a amortização adicional, a amortização base deve ser recalculada
    // para ser menor (para caber no prazo restante)
    const amortizacaoBaseOriginal = 120000 / 12;
    const saldoDepoisAmortizacao = resultadoComAmortizacao.parcelas[5].saldoDevedor;
    const mesesRestantes = 12 - 6;
    const novaAmortizacaoBase = saldoDepoisAmortizacao / mesesRestantes;

    // Verificar que a nova amortização é menor que a original
    expect(novaAmortizacaoBase).toBeLessThan(amortizacaoBaseOriginal);

    // Verificar que as parcelas após a amortização adicional usam a nova amortização
    for (let i = 6; i < 12; i++) {
      expect(resultadoComAmortizacao.parcelas[i].amortizacao).toBeCloseTo(novaAmortizacaoBase, 0);
    }
  });

  it("PRICE com amortização tipo PARCELA: mantém prazo e reduz prestação", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 12, valor: 40000, tipo: "parcela" }];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    // O prazo deve permanecer o mesmo
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(resultadoComAmortizacao.mesesOriginais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // Após a amortização adicional, a prestação deve ser menor
    const prestacaoDepoisAmortizacao = resultadoComAmortizacao.parcelas[12].prestacao;
    expect(prestacaoDepoisAmortizacao).toBeLessThan(prestacaoOriginal);

    // Todas as parcelas após a amortização devem ter a mesma prestação (nova base)
    for (let i = 13; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      expect(resultadoComAmortizacao.parcelas[i].prestacao).toBeCloseTo(prestacaoDepoisAmortizacao, 1);
    }
  });
});

describe("recalcularComAmortizacoes - casos extremos", () => {
  it("amortização maior que saldo devedor é limitada ao saldo", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 50000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 999999, tipo: "prazo" }, // Valor muito alto
    ];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // Deve quitar antes do prazo original
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(12);

    // Saldo final deve ser zero
    const ultimaParcela = resultadoComAmortizacao.parcelas[resultadoComAmortizacao.parcelas.length - 1];
    expect(ultimaParcela.saldoDevedor).toBeCloseTo(0, 1);
  });

  it("múltiplas amortizações no mesmo tipo funcionam corretamente", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 20000, tipo: "parcela" },
      { mes: 12, valor: 20000, tipo: "parcela" },
    ];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    // Prazo deve ser mantido
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(24);

    // Cada amortização deve reduzir ainda mais a prestação
    const prestacao5 = resultadoComAmortizacao.parcelas[4].prestacao;
    const prestacao11 = resultadoComAmortizacao.parcelas[10].prestacao;
    const prestacao18 = resultadoComAmortizacao.parcelas[17].prestacao;

    expect(prestacao11).toBeLessThan(prestacao5);
    expect(prestacao18).toBeLessThan(prestacao11);
  });
});
