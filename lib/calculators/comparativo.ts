import { round2 } from "../utils";
import {
  calcularFinanciamento,
  type InputsFinanciamento,
  type ResultadoFinanciamento,
  type MetodoAmortizacao,
} from "./financiamento";
import { calcularConsorcio, type InputsConsorcio, type ResultadoConsorcio } from "./consorcio";

export interface InputsComparativo {
  // Financiamento
  financiamento: {
    valorImovel: number;
    valorEntrada: number;
    taxaJurosAnual: number;
    meses: number;
    metodo: MetodoAmortizacao;
    correcaoAnualImovel: number;
  };
  // Consórcio
  consorcio: {
    meses: number;
    taxaAdministracaoTotal: number;
    correcaoAnual: number;
    agioCartaContemplada: number; // valor pago para comprar carta já contemplada (opcional, default 0)
  };
  // Taxa de rendimento para investir a diferença
  taxaRendimentoAnual: number;
}

export interface ParcelaComparativa {
  mes: number;
  parcelaFinanciamento: number;
  parcelaConsorcio: number;
  diferenca: number; // consorcio - financiamento (positivo = financiamento mais barato)
  saldoInvestimentoFinanciamento: number; // acumulado quando financiamento é mais barato
  saldoInvestimentoConsorcio: number; // acumulado quando consórcio é mais barato
}

export interface ResultadoComparativo {
  valorImovel: number;
  financiamento: ResultadoFinanciamento;
  consorcio: ResultadoConsorcio;
  comparacao: {
    mesesTotal: number;
    parcelasMensais: ParcelaComparativa[];
    // Total pago em cada cenário (incluindo entrada no financiamento)
    totalPagoFinanciamento: number;
    totalPagoConsorcio: number;
    // Saldo acumulado de investimento ao final do período
    saldoInvestimentoFinanciamento: number;
    saldoInvestimentoConsorcio: number;
    // Resultado final: imóvel + saldo de investimento - total pago
    custoLiquidoFinanciamento: number; // total pago - saldo investimento
    custoLiquidoConsorcio: number;
    // Vencedor
    vencedor: "financiamento" | "consorcio" | "empate";
    economiaVencedor: number; // quanto o vencedor economiza em relação ao perdedor
  };
}

/**
 * Calcula a comparação entre financiamento e consórcio
 *
 * Para cada mês:
 * - Compara as parcelas de ambos
 * - A diferença (quem paga menos) é investida a taxa informada
 * - No final, ambos têm o imóvel, mas um terá acumulado investimento
 */
export function calcularComparativo(inputs: InputsComparativo): ResultadoComparativo {
  const { financiamento: inputsFinanc, consorcio: inputsConsorcio, taxaRendimentoAnual } = inputs;

  // Valor do imóvel é o mesmo para ambos
  const valorImovel = inputsFinanc.valorImovel;

  // Prepara inputs para as calculadoras existentes
  const inputsFinanciamento: InputsFinanciamento = {
    valorEmprestimo: inputsFinanc.valorImovel,
    valorEntrada: inputsFinanc.valorEntrada,
    taxaJurosAnual: inputsFinanc.taxaJurosAnual,
    meses: inputsFinanc.meses,
    correcaoAnualImovel: inputsFinanc.correcaoAnualImovel,
  };

  const inputsConsorcioCalc: InputsConsorcio = {
    valorBem: valorImovel,
    meses: inputsConsorcio.meses,
    taxaAdministracaoTotal: inputsConsorcio.taxaAdministracaoTotal,
    correcaoAnual: inputsConsorcio.correcaoAnual,
  };

  // Calcula cada cenário usando as funções existentes
  const resultadoFinanciamento = calcularFinanciamento(inputsFinanciamento, inputsFinanc.metodo);
  const resultadoConsorcio = calcularConsorcio(inputsConsorcioCalc);

  // Determina o prazo total (o maior entre os dois)
  const mesesTotal = Math.max(inputsFinanc.meses, inputsConsorcio.meses);

  // Taxa de rendimento mensal (conversão de anual para mensal)
  const taxaRendimentoMensal = Math.pow(1 + taxaRendimentoAnual / 100, 1 / 12) - 1;

  // Calcula as parcelas comparativas mês a mês
  const parcelasMensais: ParcelaComparativa[] = [];
  let saldoInvestimentoFinanciamento = 0;
  let saldoInvestimentoConsorcio = 0;

  for (let mes = 1; mes <= mesesTotal; mes++) {
    // Parcela do financiamento (0 se já quitou)
    const parcelaFinanc =
      mes <= resultadoFinanciamento.parcelas.length ? resultadoFinanciamento.parcelas[mes - 1].prestacao : 0;

    // Parcela do consórcio (0 se já quitou)
    const parcelaConsorcio =
      mes <= resultadoConsorcio.parcelas.length ? resultadoConsorcio.parcelas[mes - 1].parcela : 0;

    // No primeiro mês, adiciona a entrada do financiamento à comparação
    const parcelaFinancComEntrada = mes === 1 ? parcelaFinanc + inputsFinanc.valorEntrada : parcelaFinanc;

    // No primeiro mês, adiciona o ágio da carta contemplada ao consórcio
    const parcelaConsorcioComAgio =
      mes === 1 ? parcelaConsorcio + (inputsConsorcio.agioCartaContemplada || 0) : parcelaConsorcio;

    // Diferença: positivo = financiamento mais barato neste mês
    const diferenca = round2(parcelaConsorcioComAgio - parcelaFinancComEntrada);

    // Aplica rendimento ao saldo existente antes de adicionar nova diferença
    saldoInvestimentoFinanciamento = round2(saldoInvestimentoFinanciamento * (1 + taxaRendimentoMensal));
    saldoInvestimentoConsorcio = round2(saldoInvestimentoConsorcio * (1 + taxaRendimentoMensal));

    // Se diferença > 0, financiamento é mais barato, então quem escolheu financiamento investe a diferença
    // Se diferença < 0, consórcio é mais barato, então quem escolheu consórcio investe a diferença
    if (diferenca > 0) {
      saldoInvestimentoFinanciamento = round2(saldoInvestimentoFinanciamento + diferenca);
    } else if (diferenca < 0) {
      saldoInvestimentoConsorcio = round2(saldoInvestimentoConsorcio + Math.abs(diferenca));
    }

    parcelasMensais.push({
      mes,
      parcelaFinanciamento: parcelaFinancComEntrada,
      parcelaConsorcio: parcelaConsorcioComAgio,
      diferenca,
      saldoInvestimentoFinanciamento,
      saldoInvestimentoConsorcio,
    });
  }

  // Total pago em cada cenário (incluindo entrada/ágio)
  const totalPagoFinanciamento = round2(resultadoFinanciamento.totalPago + inputsFinanc.valorEntrada);
  const totalPagoConsorcio = round2(resultadoConsorcio.totalPago + (inputsConsorcio.agioCartaContemplada || 0));

  // Custo líquido = total pago - saldo de investimento acumulado
  const custoLiquidoFinanciamento = round2(totalPagoFinanciamento - saldoInvestimentoFinanciamento);
  const custoLiquidoConsorcio = round2(totalPagoConsorcio - saldoInvestimentoConsorcio);

  // Determina o vencedor
  let vencedor: "financiamento" | "consorcio" | "empate";
  let economiaVencedor: number;

  if (Math.abs(custoLiquidoFinanciamento - custoLiquidoConsorcio) < 0.01) {
    vencedor = "empate";
    economiaVencedor = 0;
  } else if (custoLiquidoFinanciamento < custoLiquidoConsorcio) {
    vencedor = "financiamento";
    economiaVencedor = round2(custoLiquidoConsorcio - custoLiquidoFinanciamento);
  } else {
    vencedor = "consorcio";
    economiaVencedor = round2(custoLiquidoFinanciamento - custoLiquidoConsorcio);
  }

  return {
    valorImovel,
    financiamento: resultadoFinanciamento,
    consorcio: resultadoConsorcio,
    comparacao: {
      mesesTotal,
      parcelasMensais,
      totalPagoFinanciamento,
      totalPagoConsorcio,
      saldoInvestimentoFinanciamento,
      saldoInvestimentoConsorcio,
      custoLiquidoFinanciamento,
      custoLiquidoConsorcio,
      vencedor,
      economiaVencedor,
    },
  };
}
