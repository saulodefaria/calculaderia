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
   * Outflow of the month in purchase scenario.
   * Note: includes down payment in month 1 (to be consistent with other comparisons in the project).
   */
  prestacaoFinanciamento: number;
  /** Outflow of the month in rent scenario. */
  aluguelPago: number;
  /**
   * Difference between monthly loan payment (without down payment) and monthly rent.
   * - Positive: rent is cheaper → difference is invested
   * - Negative: rent is more expensive → need to supplement difference (withdrawal from investment and/or extra contribution)
   */
  diferencaInvestida: number;
  /** Invested balance (never negative). Starts with invested down payment. */
  saldoInvestimentoAluguel: number;
  /** Extra contributions accumulated when rent is greater than payment and investment reaches zero. */
  aporteExtraAluguel: number;
  /**
   * Net worth in purchase scenario (equity):
   * appreciated property value in the month - loan balance in the month.
   */
  patrimonioComprar: number;
  /**
   * Net worth in rent scenario:
   * invested balance - accumulated extra contributions.
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
    patrimonioFinalComprar: number; // equity (appreciated property value - final loan balance)
    patrimonioFinalAluguel: number; // invested balance - extra contributions
    vencedor: "comprar" | "aluguel" | "empate";
    economiaVencedor: number;
  };
}

/**
 * Calculates comparison between buying a property (loan) vs renting and investing the difference.
 *
 * Purchase Scenario:
 * - Pays down payment + monthly payments
 * - Net worth (equity) = property value (appreciated) - loan balance
 *
 * Rent Scenario:
 * - Invests down payment
 * - Pays monthly rent (with annual adjustment)
 * - Invests difference when rent is cheaper than loan payment
 * - If rent is more expensive, consumes investment and, if necessary, requires extra contributions
 * - Net worth = invested balance - accumulated extra contributions
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

  // Calculate loan using existing calculator
  const inputsFinanciamento: InputsFinanciamento = {
    valorEmprestimo: valorImovel,
    valorEntrada,
    taxaJurosAnual,
    meses,
    correcaoAnualImovel,
  };

  const resultadoFinanciamento = calcularFinanciamento(inputsFinanciamento, metodo);

  // Monthly investment return rate
  const taxaRendimentoMensal = convertAnnualRateToMonthlyRate(taxaRendimentoAnual);

  // Calculate property appreciation at the end
  const anosTotal = meses / 12;
  const fatorValorizacao = Math.pow(1 + correcaoAnualImovel / 100, anosTotal);
  const valorImovelFinal = round2(valorImovel * fatorValorizacao);

  // Calculate comparative monthly payments
  const parcelasMensais: ParcelaAluguelVsComprar[] = [];
  let saldoInvestimentoAluguel = round2(valorEntrada); // Starts with invested down payment
  let aporteExtraAluguel = 0;
  let totalPagoComprar = 0;
  let totalPagoAluguel = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const parcelaFinanc = resultadoFinanciamento.parcelas[mes - 1];
    const prestacaoMensalFinanc = parcelaFinanc.prestacao;
    // Loan payment (includes down payment in first month only for display/total)
    const prestacaoFinanc = round2(prestacaoMensalFinanc + (mes === 1 ? valorEntrada : 0));

    // Rent adjusted for this month
    const aluguelMes = getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel);

    // Difference (without down payment): monthly payment - rent
    // Positive = rent invests the difference
    // Negative = rent needs to supplement the difference
    const diferencaInvestida = round2(prestacaoMensalFinanc - aluguelMes);

    // Apply return to existing balance before adding month's difference
    saldoInvestimentoAluguel = round2(saldoInvestimentoAluguel * (1 + taxaRendimentoMensal));

    // Apply month's difference:
    // - positive: contribution to investment
    // - negative: withdrawal from investment and, if necessary, extra contribution
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

    // Accumulate totals paid
    totalPagoComprar = round2(totalPagoComprar + prestacaoFinanc);
    totalPagoAluguel = round2(totalPagoAluguel + aluguelMes);

    // Purchase: equity = property value appreciated so far - loan balance
    const anosDecorridos = mes / 12;
    const fatorValorizacaoAtual = Math.pow(1 + correcaoAnualImovel / 100, anosDecorridos);
    const valorImovelAtual = round2(valorImovel * fatorValorizacaoAtual);
    const patrimonioComprar = round2(valorImovelAtual - (parcelaFinanc.saldoDevedor ?? 0));

    // Rent: invested balance - accumulated extra contributions
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

  // Determine winner
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
