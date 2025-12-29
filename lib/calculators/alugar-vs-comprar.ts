import { round2, getAluguelCorrigidoNoMes } from "../utils";
import { calcularFinanciamento, type InputsFinanciamento, type MetodoAmortizacao } from "./financiamento";
import { convertAnnualRateToMonthlyRate } from "../utils/math";

export interface InputsAluguelVsComprar {
  valorImovel: number;
  valorEntrada: number;
  taxaJurosAnual: number;
  meses: number;
  metodo: MetodoAmortizacao;
  correcaoAnualImovel: number;
  aluguelMensal: number;
  correcaoAnualAluguel: number;
  taxaRendimentoAnual: number;
}

export interface ParcelaAluguelVsComprar {
  mes: number;
  /**
   * Saída do mês no cenário de compra.
   * Observação: inclui a entrada no mês 1 (para ficar consistente com outras comparações do projeto).
   */
  prestacaoFinanciamento: number;
  /** Saída do mês no cenário de aluguel. */
  aluguelPago: number;
  /**
   * Diferença entre prestação mensal do financiamento (sem entrada) e o aluguel do mês.
   * - Positivo: aluguel é mais barato → a diferença é investida
   * - Negativo: aluguel é mais caro → precisa complementar a diferença (saque do investimento e/ou aporte extra)
   */
  diferencaInvestida: number;
  /** Saldo investido (nunca negativo). Começa com a entrada investida. */
  saldoInvestimentoAluguel: number;
  /** Aportes extras acumulados quando o aluguel é maior que a prestação e o investimento zera. */
  aporteExtraAluguel: number;
  /**
   * Patrimônio no cenário de compra (equidade):
   * valor do imóvel valorizado no mês - saldo devedor do financiamento no mês.
   */
  patrimonioComprar: number;
  /**
   * Patrimônio no cenário de aluguel:
   * saldo investido - aportes extras acumulados.
   */
  patrimonioAluguel: number;
}

export interface ResultadoAluguelVsComprar {
  valorImovel: number;
  parcelasMensais: ParcelaAluguelVsComprar[];
  comparacao: {
    mesesTotal: number;
    totalPagoComprar: number;
    totalPagoAluguel: number;
    valorImovelFinal: number;
    saldoInvestimentoFinalAluguel: number;
    aporteExtraTotalAluguel: number;
    patrimonioFinalComprar: number; // equidade (valor do imóvel valorizado - saldo devedor final)
    patrimonioFinalAluguel: number; // saldo investido - aportes extras
    vencedor: "comprar" | "aluguel" | "empate";
    economiaVencedor: number;
  };
}

/**
 * Calcula a comparação entre comprar um imóvel (financiamento) vs alugar e investir a diferença.
 *
 * Cenário Comprar:
 * - Paga entrada + prestações mensais
 * - Patrimônio (equidade) = valor do imóvel (valorizado) - saldo devedor
 *
 * Cenário Aluguel:
 * - Investe a entrada
 * - Paga aluguel mensal (com correção anual)
 * - Investe a diferença quando o aluguel é mais barato que a prestação do financiamento
 * - Se o aluguel for mais caro, consome o investimento e, se necessário, exige aportes extras
 * - Patrimônio = saldo investido - aportes extras acumulados
 */
export function calcularAluguelVsComprar(inputs: InputsAluguelVsComprar): ResultadoAluguelVsComprar {
  const {
    valorImovel,
    valorEntrada,
    taxaJurosAnual,
    meses,
    metodo,
    correcaoAnualImovel,
    aluguelMensal,
    correcaoAnualAluguel,
    taxaRendimentoAnual,
  } = inputs;

  // Calcula o financiamento usando a calculadora existente
  const inputsFinanciamento: InputsFinanciamento = {
    valorEmprestimo: valorImovel,
    valorEntrada,
    taxaJurosAnual,
    meses,
    correcaoAnualImovel,
  };

  const resultadoFinanciamento = calcularFinanciamento(inputsFinanciamento, metodo);

  // Taxa de rendimento mensal do investimento
  const taxaRendimentoMensal = convertAnnualRateToMonthlyRate(taxaRendimentoAnual);

  // Calcula valorização do imóvel ao final
  const anosTotal = meses / 12;
  const fatorValorizacao = Math.pow(1 + correcaoAnualImovel / 100, anosTotal);
  const valorImovelFinal = round2(valorImovel * fatorValorizacao);

  // Calcula as parcelas mensais comparativas
  const parcelasMensais: ParcelaAluguelVsComprar[] = [];
  let saldoInvestimentoAluguel = round2(valorEntrada); // Começa com a entrada investida
  let aporteExtraAluguel = 0;
  let totalPagoComprar = 0;
  let totalPagoAluguel = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const parcelaFinanc = resultadoFinanciamento.parcelas[mes - 1];
    const prestacaoMensalFinanc = parcelaFinanc.prestacao;
    // Prestação do financiamento (inclui entrada no primeiro mês apenas para display/total)
    const prestacaoFinanc = round2(prestacaoMensalFinanc + (mes === 1 ? valorEntrada : 0));

    // Aluguel corrigido para este mês
    const aluguelMes = getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel);

    // Diferença (sem entrada): prestação mensal - aluguel
    // Positivo = aluguel investe a diferença
    // Negativo = aluguel precisa complementar a diferença
    const diferencaInvestida = round2(prestacaoMensalFinanc - aluguelMes);

    // Aplica rendimento ao saldo existente antes de adicionar a diferença do mês
    saldoInvestimentoAluguel = round2(saldoInvestimentoAluguel * (1 + taxaRendimentoMensal));

    // Aplica a diferença do mês:
    // - positiva: aporte no investimento
    // - negativa: saque do investimento e, se necessário, aporte extra
    if (diferencaInvestida >= 0) {
      saldoInvestimentoAluguel = round2(saldoInvestimentoAluguel + diferencaInvestida);
    } else {
      const saqueNecessario = Math.abs(diferencaInvestida);
      if (saldoInvestimentoAluguel >= saqueNecessario) {
        saldoInvestimentoAluguel = round2(saldoInvestimentoAluguel - saqueNecessario);
      } else {
        const falta = round2(saqueNecessario - saldoInvestimentoAluguel);
        saldoInvestimentoAluguel = 0;
        aporteExtraAluguel = round2(aporteExtraAluguel + falta);
      }
    }

    // Acumula totais pagos
    totalPagoComprar = round2(totalPagoComprar + prestacaoFinanc);
    totalPagoAluguel = round2(totalPagoAluguel + aluguelMes);

    // Comprar: equidade = valor do imóvel valorizado até agora - saldo devedor
    const anosDecorridos = mes / 12;
    const fatorValorizacaoAtual = Math.pow(1 + correcaoAnualImovel / 100, anosDecorridos);
    const valorImovelAtual = round2(valorImovel * fatorValorizacaoAtual);
    const patrimonioComprar = round2(valorImovelAtual - (parcelaFinanc.saldoDevedor ?? 0));

    // Aluguel: saldo investido - aportes extras acumulados
    const patrimonioAluguel = round2(saldoInvestimentoAluguel - aporteExtraAluguel);

    parcelasMensais.push({
      mes,
      prestacaoFinanciamento: prestacaoFinanc,
      aluguelPago: aluguelMes,
      diferencaInvestida,
      saldoInvestimentoAluguel,
      aporteExtraAluguel,
      patrimonioComprar,
      patrimonioAluguel,
    });
  }

  const saldoDevedorFinal =
    resultadoFinanciamento.parcelas[resultadoFinanciamento.parcelas.length - 1]?.saldoDevedor ?? 0;
  const patrimonioFinalComprar = round2(valorImovelFinal - saldoDevedorFinal);
  const patrimonioFinalAluguel = round2(saldoInvestimentoAluguel - aporteExtraAluguel);

  // Determina o vencedor
  let vencedor: "comprar" | "aluguel" | "empate";
  let economiaVencedor: number;

  if (Math.abs(patrimonioFinalComprar - patrimonioFinalAluguel) < 0.01) {
    vencedor = "empate";
    economiaVencedor = 0;
  } else if (patrimonioFinalComprar > patrimonioFinalAluguel) {
    vencedor = "comprar";
    economiaVencedor = round2(patrimonioFinalComprar - patrimonioFinalAluguel);
  } else {
    vencedor = "aluguel";
    economiaVencedor = round2(patrimonioFinalAluguel - patrimonioFinalComprar);
  }

  return {
    valorImovel,
    parcelasMensais,
    comparacao: {
      mesesTotal: meses,
      totalPagoComprar,
      totalPagoAluguel,
      valorImovelFinal,
      saldoInvestimentoFinalAluguel: saldoInvestimentoAluguel,
      aporteExtraTotalAluguel: aporteExtraAluguel,
      patrimonioFinalComprar,
      patrimonioFinalAluguel,
      vencedor,
      economiaVencedor,
    },
  };
}
