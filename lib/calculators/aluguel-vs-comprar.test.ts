import { describe, it, expect } from "vitest";
import { calcularAluguelVsComprar, type InputsAluguelVsComprar } from "./aluguel-vs-comprar";
import { round2 } from "../utils";
import { calcularFinanciamento } from "./financiamento";

describe("calcularAluguelVsComprar", () => {
  it("gera estrutura básica e inclui a entrada no mês 1 da prestação exibida", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 120,
      metodo: "price",
      correcaoAnualImovel: 5,
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(resultado.valorImovel).toBe(500000);
    expect(resultado.parcelasMensais.length).toBe(120);
    expect(resultado.comparacao.mesesTotal).toBe(120);

    // Verifica que todas as parcelas têm os campos necessários
    resultado.parcelasMensais.forEach((p) => {
      expect(p.mes).toBeGreaterThan(0);
      expect(p.prestacaoFinanciamento).toBeGreaterThan(0);
      expect(p.aluguelPago).toBeGreaterThan(0);
      expect(p.diferencaInvestida).toBeDefined();
      expect(p.saldoInvestimentoAluguel).toBeGreaterThanOrEqual(0);
      expect(p.aporteExtraAluguel).toBeGreaterThanOrEqual(0);
      expect(p.patrimonioComprar).toBeDefined();
      expect(p.patrimonioAluguel).toBeDefined();
    });

    // Verifica que o primeiro mês inclui a entrada no financiamento
    expect(resultado.parcelasMensais[0].prestacaoFinanciamento).toBeGreaterThan(
      resultado.parcelasMensais[1].prestacaoFinanciamento
    );
  });

  it("calcula a diferença investida como (prestação mensal sem entrada - aluguel do mês)", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 12,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 10,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const primeiraParcela = resultado.parcelasMensais[0]!;
    const prestacaoMensalSemEntrada = round2(primeiraParcela.prestacaoFinanciamento - inputs.valorEntrada);
    const diferencaEsperada = round2(prestacaoMensalSemEntrada - primeiraParcela.aluguelPago);
    expect(primeiraParcela.diferencaInvestida).toBeCloseTo(diferencaEsperada, 2);
  });

  it("aplica correção anual do aluguel corretamente", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 10,
      meses: 36,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2500,
      correcaoAnualAluguel: 6, // 6% ao ano
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Mês 1 deve ter aluguel base
    expect(resultado.parcelasMensais[0].aluguelPago).toBeCloseTo(2500, 2);

    // Mês 12 ainda deve ter aluguel base (correção só no mês 13)
    expect(resultado.parcelasMensais[11].aluguelPago).toBeCloseTo(2500, 2);

    // Mês 13 deve ter aluguel corrigido (2500 * 1.06)
    expect(resultado.parcelasMensais[12].aluguelPago).toBeCloseTo(2650, 2);

    // Mês 25 deve ter segunda correção (2500 * 1.06^2)
    expect(resultado.parcelasMensais[24].aluguelPago).toBeCloseTo(2809, 2);
  });

  it("calcula o patrimônio do cenário comprar como equidade (valor do imóvel - saldo devedor)", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 60,
      metodo: "price",
      correcaoAnualImovel: 5, // 5% ao ano
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const financiamento = calcularFinanciamento(
      {
        valorEmprestimo: inputs.valorImovel,
        valorEntrada: inputs.valorEntrada,
        taxaJurosAnual: inputs.taxaJurosAnual,
        meses: inputs.meses,
        correcaoAnualImovel: inputs.correcaoAnualImovel,
      },
      inputs.metodo
    );

    // Mês 1: equidade = valor do imóvel no mês - saldo devedor após o pagamento do mês
    const parcelaMes1 = financiamento.parcelas[0]!;
    const valorImovelMes1 = round2(inputs.valorImovel * Math.pow(1 + inputs.correcaoAnualImovel / 100, 1 / 12));
    const equidadeMes1Esperada = round2(valorImovelMes1 - parcelaMes1.saldoDevedor);
    expect(resultado.parcelasMensais[0]!.patrimonioComprar).toBeCloseTo(equidadeMes1Esperada, 2);

    // Final: saldo devedor deve ser ~0, então equidade final ≈ valor do imóvel final
    const ultimaParcela = resultado.parcelasMensais[resultado.parcelasMensais.length - 1]!;
    const saldoDevedorFinal = financiamento.parcelas[financiamento.parcelas.length - 1]!.saldoDevedor;
    const equidadeFinalEsperada = round2(resultado.comparacao.valorImovelFinal - saldoDevedorFinal);
    expect(ultimaParcela.patrimonioComprar).toBeCloseTo(equidadeFinalEsperada, 2);
    expect(resultado.comparacao.patrimonioFinalComprar).toBeCloseTo(ultimaParcela.patrimonioComprar, 2);
  });

  it("determina corretamente o vencedor e a economia baseada no patrimônio final", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 15, // Taxa alta favorece aluguel
      meses: 60,
      metodo: "price",
      correcaoAnualImovel: 3, // Valorização baixa
      aluguelMensal: 2000, // Aluguel baixo
      correcaoAnualAluguel: 4,
      taxaRendimentoAnual: 12, // Retorno de investimento alto favorece aluguel
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(["comprar", "aluguel", "empate"]).toContain(resultado.comparacao.vencedor);

    const diff = round2(resultado.comparacao.patrimonioFinalComprar - resultado.comparacao.patrimonioFinalAluguel);

    if (Math.abs(diff) < 0.01) {
      expect(resultado.comparacao.vencedor).toBe("empate");
      expect(resultado.comparacao.economiaVencedor).toBe(0);
    } else if (diff > 0) {
      expect(resultado.comparacao.vencedor).toBe("comprar");
      expect(resultado.comparacao.economiaVencedor).toBeCloseTo(Math.abs(diff), 2);
    } else {
      expect(resultado.comparacao.vencedor).toBe("aluguel");
      expect(resultado.comparacao.economiaVencedor).toBeCloseTo(Math.abs(diff), 2);
    }
  });

  it("quando aluguel é maior que prestação, pode exigir aporte extra e patrimônio do aluguel pode ficar negativo", () => {
    const base: Omit<InputsAluguelVsComprar, "aluguelMensal"> = {
      valorImovel: 200000,
      valorEntrada: 40000,
      taxaJurosAnual: 8,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 10,
    };

    // Garante que o aluguel seja maior que a prestação do financiamento para este cenário
    const financiamento = calcularFinanciamento(
      {
        valorEmprestimo: base.valorImovel,
        valorEntrada: base.valorEntrada,
        taxaJurosAnual: base.taxaJurosAnual,
        meses: base.meses,
        correcaoAnualImovel: base.correcaoAnualImovel,
      },
      base.metodo
    );
    const prestacaoBase = financiamento.parcelas[0]!.prestacao;
    const inputs: InputsAluguelVsComprar = {
      ...base,
      // Bem acima para forçar consumo do investimento e geração de aporte extra
      aluguelMensal: round2(prestacaoBase + 5000),
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const primeiraParcela = resultado.parcelasMensais[0]!;
    const prestacaoSemEntrada = round2(primeiraParcela.prestacaoFinanciamento - inputs.valorEntrada);
    expect(primeiraParcela.aluguelPago).toBeGreaterThan(prestacaoSemEntrada);
    expect(primeiraParcela.diferencaInvestida).toBeLessThan(0);

    // Em algum momento o aporte extra deve aparecer (aluguel muito alto)
    expect(resultado.parcelasMensais.some((p) => p.aporteExtraAluguel > 0)).toBe(true);
    expect(resultado.comparacao.aporteExtraTotalAluguel).toBeGreaterThan(0);

    // O saldo investido nunca deve ser negativo
    expect(resultado.parcelasMensais.every((p) => p.saldoInvestimentoAluguel >= 0)).toBe(true);

    // E o patrimônio final do aluguel deve ficar negativo (precisou aportar mais do que conseguiu manter investido)
    expect(resultado.comparacao.patrimonioFinalAluguel).toBeLessThan(0);
  });

  it("aplica taxa de rendimento mensal corretamente ao investimento", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 10,
      meses: 12,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 3000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 12, // 12% ao ano
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Verifica crescimento do investimento mês a mês
    for (let i = 1; i < resultado.parcelasMensais.length; i++) {
      const mesAnterior = resultado.parcelasMensais[i - 1];
      const mesAtual = resultado.parcelasMensais[i];

      // O saldo deve crescer mesmo sem novas contribuições (devido ao rendimento)
      // Mas pode diminuir se a diferença investida for negativa
      // Vamos verificar que o crescimento está acontecendo quando há saldo positivo
      if (mesAnterior.saldoInvestimentoAluguel > 0 && mesAtual.diferencaInvestida >= 0) {
        // O saldo deve crescer pelo menos pelo rendimento mensal
        const rendimentoMensalEsperado = mesAnterior.saldoInvestimentoAluguel * (Math.pow(1.12, 1 / 12) - 1);
        const crescimentoMinimo = mesAnterior.saldoInvestimentoAluguel + rendimentoMensalEsperado - 1; // tolerância
        expect(mesAtual.saldoInvestimentoAluguel).toBeGreaterThanOrEqual(crescimentoMinimo);
      }
    }
  });

  it("calcula corretamente o valor do imóvel valorizado ao final", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 120, // 10 anos
      metodo: "price",
      correcaoAnualImovel: 5, // 5% ao ano
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Valor do imóvel após 10 anos com 5% ao ano: 500000 * (1.05)^10
    const valorEsperado = round2(500000 * Math.pow(1.05, 10));
    expect(resultado.comparacao.valorImovelFinal).toBeCloseTo(valorEsperado, 0);
  });

  it("funciona corretamente com método SAC", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 12,
      meses: 60,
      metodo: "sac",
      correcaoAnualImovel: 4,
      aluguelMensal: 2500,
      correcaoAnualAluguel: 5,
      taxaRendimentoAnual: 9,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(resultado.parcelasMensais.length).toBe(60);

    // Com SAC, as prestações devem ser decrescentes
    expect(resultado.parcelasMensais[0].prestacaoFinanciamento).toBeGreaterThan(
      resultado.parcelasMensais[59].prestacaoFinanciamento
    );
  });

  it("calcula corretamente o total pago em cada cenário", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 10,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Total pago no cenário comprar = entrada + soma das prestações
    const totalPrestacoes = resultado.parcelasMensais.reduce((sum, p) => sum + p.prestacaoFinanciamento, 0);
    expect(resultado.comparacao.totalPagoComprar).toBeCloseTo(totalPrestacoes, 2);

    // Total pago no cenário aluguel = soma dos aluguéis
    const totalAlugueis = resultado.parcelasMensais.reduce((sum, p) => sum + p.aluguelPago, 0);
    expect(resultado.comparacao.totalPagoAluguel).toBeCloseTo(totalAlugueis, 2);
  });
});
