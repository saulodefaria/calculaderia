import { round2, getAluguelCorrigidoNoMes } from "../utils";
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
    mesContemplacao: number; // mês em que será contemplado (default 1)
    valorLance: number; // lance pago no mês de contemplação para reduzir prazo (default 0)
  };
  // Taxa de rendimento para investir a diferença
  taxaRendimentoAnual: number;
  // Aluguel mensal evitado (economia ao ter imóvel próprio)
  aluguelMensal: number; // valor do aluguel no mês 1 (default 0)
  correcaoAnualAluguel: number; // correção anual do aluguel - IGPM (default 0)
}

export interface ParcelaComparativa {
  mes: number;
  parcelaFinanciamento: number;
  parcelaConsorcio: number;
  diferenca: number; // consorcio - financiamento (positivo = financiamento mais barato)
  saldoInvestimentoFinanciamento: number; // acumulado quando financiamento é mais barato
  saldoInvestimentoConsorcio: number; // acumulado quando consórcio é mais barato
  isContemplacao?: boolean; // indica se é o mês de contemplação
  valorLance?: number; // valor do lance pago neste mês (se houver)
  valorAgio?: number; // valor do ágio pago neste mês (se houver)
  // Aluguel evitado (economia) - usado quando há aluguel configurado
  aluguelEvitadoFinanciamento?: number; // sempre desde o mês 1
  aluguelEvitadoConsorcio?: number; // a partir da contemplação
  // Custos líquidos (parcela - aluguel evitado) - pode ser negativo
  custoLiquidoFinanciamento?: number;
  custoLiquidoConsorcio?: number;
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
    // Contemplação e lance
    mesContemplacao: number;
    valorLance: number;
    valorAgio: number;
    // Economia de aluguel (quando configurado)
    totalDescontoAluguelFinanciamento: number;
    totalDescontoAluguelConsorcio: number;
    // Totais líquidos considerando aluguel
    totalPagoLiquidoFinanciamento: number; // totalPago - descontoAluguel
    totalPagoLiquidoConsorcio: number;
  };
}

/**
 * Calcula a comparação entre financiamento e consórcio
 *
 * Para cada mês:
 * - Compara as parcelas de ambos
 * - Aplica o desconto de aluguel evitado (economia ao ter imóvel próprio)
 * - A diferença (quem paga menos) é investida a taxa informada
 * - No final, ambos têm o imóvel, mas um terá acumulado investimento
 *
 * Contemplação:
 * - O mês de contemplação indica quando o consorciado recebe a carta de crédito
 * - Antes da contemplação, paga-se as parcelas mas não se tem o imóvel
 * - O ágio (se houver) é pago no mês 1 (carta contemplada adquirida de terceiros)
 * - O lance (se houver) é pago no mês da contemplação e reduz o prazo
 *
 * Aluguel (economia):
 * - O financiamento já tem o imóvel desde o mês 1 (desconto desde o início)
 * - O consórcio só tem o imóvel a partir da contemplação (desconto a partir dela)
 * - O aluguel é corrigido anualmente pelo IGPM em degraus (mês 13, 25, ...)
 */
export function calcularComparativo(inputs: InputsComparativo): ResultadoComparativo {
  const {
    financiamento: inputsFinanc,
    consorcio: inputsConsorcio,
    taxaRendimentoAnual,
    aluguelMensal,
    correcaoAnualAluguel,
  } = inputs;

  // Valor do imóvel é o mesmo para ambos
  const valorImovel = inputsFinanc.valorImovel;

  // Extrai parâmetros de contemplação e lance (com defaults)
  const mesContemplacao = inputsConsorcio.mesContemplacao || 1;
  const valorLance = inputsConsorcio.valorLance || 0;
  const valorAgio = inputsConsorcio.agioCartaContemplada || 0;

  // Parâmetros de aluguel (com defaults)
  const aluguelBase = aluguelMensal || 0;
  const igpmAnual = correcaoAnualAluguel || 0;

  // Prepara inputs para as calculadoras existentes
  const inputsFinanciamento: InputsFinanciamento = {
    valorEmprestimo: inputsFinanc.valorImovel,
    valorEntrada: inputsFinanc.valorEntrada,
    taxaJurosAnual: inputsFinanc.taxaJurosAnual,
    meses: inputsFinanc.meses,
    correcaoAnualImovel: inputsFinanc.correcaoAnualImovel,
    aluguelMensal: aluguelBase,
    correcaoAnualAluguel: igpmAnual,
  };

  // Prepara inputs para o consórcio (com lance opcional)
  const inputsConsorcioCalc: InputsConsorcio = {
    valorBem: valorImovel,
    meses: inputsConsorcio.meses,
    taxaAdministracaoTotal: inputsConsorcio.taxaAdministracaoTotal,
    correcaoAnual: inputsConsorcio.correcaoAnual,
    agio: valorAgio,
    // Lance no mês de contemplação (se houver)
    lance: valorLance > 0 ? { mes: mesContemplacao, valor: valorLance } : undefined,
    mesContemplacao,
    aluguelMensal: aluguelBase,
    correcaoAnualAluguel: igpmAnual,
  };

  // Calcula o financiamento
  const resultadoFinanciamento = calcularFinanciamento(inputsFinanciamento, inputsFinanc.metodo);

  // Calcula o consórcio (com lance integrado se houver)
  const resultadoConsorcio: ResultadoConsorcio = calcularConsorcio(inputsConsorcioCalc);

  // Determina o prazo total (o maior entre financiamento e consórcio efetivo)
  const mesesConsorcioEfetivo = resultadoConsorcio.parcelas.length;
  const mesesTotal = Math.max(inputsFinanc.meses, mesesConsorcioEfetivo);

  // Taxa de rendimento mensal (conversão de anual para mensal)
  const taxaRendimentoMensal = Math.pow(1 + taxaRendimentoAnual / 100, 1 / 12) - 1;

  // Calcula as parcelas comparativas mês a mês
  const parcelasMensais: ParcelaComparativa[] = [];
  let saldoInvestimentoFinanciamento = 0;
  let saldoInvestimentoConsorcio = 0;
  let totalDescontoAluguelFinanciamento = 0;
  let totalDescontoAluguelConsorcio = 0;

  for (let mes = 1; mes <= mesesTotal; mes++) {
    // Parcela do financiamento (0 se já quitou)
    const parcelaFinanc =
      mes <= resultadoFinanciamento.parcelas.length ? resultadoFinanciamento.parcelas[mes - 1].prestacao : 0;

    // Parcela do consórcio (0 se já quitou) - o lance já está incluído na parcela
    const parcelaConsorcioInfo = resultadoConsorcio.parcelas.find((p) => p.mes === mes);
    const parcelaConsorcioBase = parcelaConsorcioInfo?.parcela ?? 0;

    // No primeiro mês, adiciona a entrada do financiamento à comparação
    const parcelaFinancComEntrada = mes === 1 ? parcelaFinanc + inputsFinanc.valorEntrada : parcelaFinanc;

    // Verifica se é o mês de contemplação
    const isContemplacao = mes === mesContemplacao;

    // O lance já está incluído na parcela base calculada por calcularConsorcio
    const parcelaConsorcioTotal = parcelaConsorcioBase;
    let valorAgioMes = 0;
    let valorLanceMes = 0;

    // Ágio é pago no mês 1 (consistente com a calculadora standalone)
    if (mes === 1 && valorAgio > 0) {
      valorAgioMes = valorAgio;
    }
    // Lance é pago no mês de contemplação (se houver)
    if (isContemplacao && valorLance > 0) {
      valorLanceMes = valorLance;
    }

    // Calcula o aluguel corrigido para este mês (se configurado)
    const aluguelMes = aluguelBase > 0 ? getAluguelCorrigidoNoMes(mes, aluguelBase, igpmAnual) : 0;

    // Aluguel evitado (economia):
    // - Financiamento: sempre (desde mês 1, já tem o imóvel)
    // - Consórcio: a partir da contemplação (inclusive)
    const aluguelEvitadoFinanc = aluguelMes;
    const aluguelEvitadoCons = mes >= mesContemplacao ? aluguelMes : 0;

    // Acumula totais de desconto
    totalDescontoAluguelFinanciamento = round2(totalDescontoAluguelFinanciamento + aluguelEvitadoFinanc);
    totalDescontoAluguelConsorcio = round2(totalDescontoAluguelConsorcio + aluguelEvitadoCons);

    // Custo líquido mensal = parcela - aluguel evitado (pode ficar negativo)
    const custoLiquidoFinancMes = round2(parcelaFinancComEntrada - aluguelEvitadoFinanc);
    const custoLiquidoConsMes = round2(parcelaConsorcioTotal - aluguelEvitadoCons);

    // Diferença baseada nos custos líquidos (considerando aluguel)
    // Positivo = financiamento mais barato neste mês
    const diferenca = round2(custoLiquidoConsMes - custoLiquidoFinancMes);

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
      parcelaConsorcio: parcelaConsorcioTotal,
      diferenca,
      saldoInvestimentoFinanciamento,
      saldoInvestimentoConsorcio,
      isContemplacao,
      valorLance: valorLanceMes > 0 ? valorLanceMes : undefined,
      valorAgio: valorAgioMes > 0 ? valorAgioMes : undefined,
      // Campos de aluguel (só populados se houver aluguel configurado)
      aluguelEvitadoFinanciamento: aluguelBase > 0 ? aluguelEvitadoFinanc : undefined,
      aluguelEvitadoConsorcio: aluguelBase > 0 ? aluguelEvitadoCons : undefined,
      custoLiquidoFinanciamento: aluguelBase > 0 ? custoLiquidoFinancMes : undefined,
      custoLiquidoConsorcio: aluguelBase > 0 ? custoLiquidoConsMes : undefined,
    });
  }

  // Total pago em cada cenário (incluindo entrada/ágio/lance) - bruto
  const totalPagoFinanciamento = round2(resultadoFinanciamento.totalPago + inputsFinanc.valorEntrada);
  const totalPagoConsorcio = round2(resultadoConsorcio.totalPago);

  // Total líquido considerando aluguel evitado
  const totalPagoLiquidoFinanciamento = round2(totalPagoFinanciamento - totalDescontoAluguelFinanciamento);
  const totalPagoLiquidoConsorcio = round2(totalPagoConsorcio - totalDescontoAluguelConsorcio);

  // Custo líquido = total pago líquido - saldo de investimento acumulado
  const custoLiquidoFinanciamento = round2(totalPagoLiquidoFinanciamento - saldoInvestimentoFinanciamento);
  const custoLiquidoConsorcio = round2(totalPagoLiquidoConsorcio - saldoInvestimentoConsorcio);

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
      mesContemplacao,
      valorLance,
      valorAgio,
      totalDescontoAluguelFinanciamento,
      totalDescontoAluguelConsorcio,
      totalPagoLiquidoFinanciamento,
      totalPagoLiquidoConsorcio,
    },
  };
}
