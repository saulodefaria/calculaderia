import { round2, calculateIrr, getAluguelCorrigidoNoMes } from "../utils";
import { convertMonthlyRateToAnnualRate } from "../utils/math";

export interface InputsConsorcio {
  valorBem: number;
  meses: number;
  taxaAdministracaoTotal: number; // Percentual total (ex: 15%)
  correcaoAnual: number; // Annual adjustment percentage (e.g., 6%)
  // Optional premium - amount paid to buy already awarded credit letter
  agio?: number;
  // Optional bid - reduces term (type "prazo")
  lance?: {
    mes: number; // Month in which the bid will be paid
    valor: number; // Bid amount
  };
  // Contemplation - month in which credit letter is received (even without bid)
  mesContemplacao?: number; // default 1
  // Monthly rent received (when renting the property)
  aluguelMensal?: number; // rent value in month 1 (default 0)
  correcaoAnualAluguel?: number; // annual rent adjustment - IGP-M (default 0)
}

export interface ParcelaConsorcio {
  mes: number;
  fundoComum: number;
  taxaAdministracao: number;
  parcela: number;
  saldoDevedor: number;
  correcaoAplicada: number; // 0 if no adjustment in the month, otherwise the applied percentage
  anoCorrente: number;
}

export interface ParcelaConsorcioComAdicional extends ParcelaConsorcio {
  amortizacaoAdicional: number;
  tipoAdicional: TipoAmortizacaoAdicional;
}

export interface ResultadoConsorcio {
  valorBem: number;
  valorBemFinal: number;
  primeiraParcela: number;
  ultimaParcela: number;
  totalTaxaAdministracao: number;
  totalPago: number; // Includes premium if present
  agio: number; // Premium amount paid (0 if not present)
  parcelas: ParcelaConsorcio[];
  // IRR considering:
  // - Each payment (common fund + admin fee) as monthly outflow
  // - Final adjusted asset value as positive inflow in the last month
  tirMensal?: number | null;
  tirAnual?: number | null;
  // Cashflows for analysis in IRR calculator
  cashflows?: number[];
}

export interface ResultadoConsorcioComAdicionais {
  valorBem: number;
  valorBemFinal: number;
  totalTaxaAdministracaoOriginal: number;
  totalPagoOriginal: number;
  totalTaxaAdministracaoComAdicionais: number;
  totalPagoComAdicionais: number;
  totalAmortizacoesAdicionais: number;
  mesesOriginais: number;
  mesesComAdicionais: number;
  economiaTaxa: number;
  economiaMeses: number;
  parcelas: ParcelaConsorcioComAdicional[];
  // IRR of original scenario (without additional amortizations)
  tirMensalOriginal?: number | null;
  tirAnualOriginal?: number | null;
  // IRR of scenario with additional amortizations
  tirMensalComAdicionais?: number | null;
  tirAnualComAdicionais?: number | null;
  // Cashflows for analysis in IRR calculator
  cashflowsOriginal?: number[];
  cashflowsComAdicionais?: number[];
}

export interface AmortizacaoAdicionalConsorcio {
  mes: number;
  valor: number;
  tipo: TipoAmortizacaoAdicional;
}

export type TipoAmortizacaoAdicional = "prazo" | "parcela";

// ==========================
// Helpers (private)
// ==========================

const EPSILON = 0.01;
const MAX_MESES_FATOR_SEGURANCA = 2;

type TirResultado = { tirMensal: number | null; tirAnual: number | null; cashflows: number[] };

function anoCorrenteParaMes(mes: number): number {
  return Math.ceil(mes / 12);
}

function isMesReajusteAnual(mes: number): boolean {
  return mes > 1 && (mes - 1) % 12 === 0;
}

function fatorReajusteAnual(correcaoAnualPercent: number): number {
  return 1 + correcaoAnualPercent / 100;
}

function aplicarFatorReajuste(valor: number, fator: number): number {
  return round2(valor * fator);
}

function zerarSeAbaixoDoEpsilon(valor: number): number {
  return valor < EPSILON ? 0 : valor;
}

type ParcelaBaseProporcional = {
  fundoComum: number;
  taxaAdministracao: number;
  parcelaBase: number;
};

function calcularParcelaBaseProporcional(params: {
  valorBemAtual: number;
  divisorFundoComum: number;
  saldoDevedorFundo: number;
  saldoDevedorTaxa: number;
}): ParcelaBaseProporcional {
  const { valorBemAtual, divisorFundoComum, saldoDevedorFundo, saldoDevedorTaxa } = params;

  let fundoComum = 0;
  let taxaAdministracao = 0;

  if (saldoDevedorFundo > EPSILON) {
    fundoComum = round2(valorBemAtual / divisorFundoComum);
    if (fundoComum > saldoDevedorFundo) fundoComum = saldoDevedorFundo;
  }

  if (saldoDevedorTaxa > EPSILON) {
    // Fee proportional to common fund, maintaining balance ratio
    if (saldoDevedorFundo > 0) {
      taxaAdministracao = round2(fundoComum * (saldoDevedorTaxa / saldoDevedorFundo));
    } else {
      taxaAdministracao = round2(saldoDevedorTaxa);
    }
    if (taxaAdministracao > saldoDevedorTaxa) taxaAdministracao = saldoDevedorTaxa;
  }

  const parcelaBase = round2(fundoComum + taxaAdministracao);

  return { fundoComum, taxaAdministracao, parcelaBase };
}

type AbateProporcional = {
  valorEfetivo: number;
  abateFundo: number;
  abateTaxa: number;
};

function calcularAbateProporcional(
  valorAdicional: number,
  saldoDevedorFundo: number,
  saldoDevedorTaxa: number,
  fundoComum: number,
  taxaAdministracao: number
): AbateProporcional {
  let abateFundo = 0;
  let abateTaxa = 0;
  let valorEfetivo = 0;

  if (valorAdicional <= 0) {
    return { valorEfetivo, abateFundo, abateTaxa };
  }

  // The additional amount reduces balances proportionally, after paying the month's payment
  const saldoAposParcelaFundo = Math.max(0, saldoDevedorFundo - fundoComum);
  const saldoAposParcelaTaxa = Math.max(0, saldoDevedorTaxa - taxaAdministracao);
  const saldoTotalAposParcela = saldoAposParcelaFundo + saldoAposParcelaTaxa;

  valorEfetivo = Math.min(valorAdicional, saldoTotalAposParcela);

  if (valorEfetivo > 0 && saldoTotalAposParcela > 0) {
    const razaoFundo = saldoAposParcelaFundo / saldoTotalAposParcela;
    abateFundo = round2(valorEfetivo * razaoFundo);
    abateTaxa = round2(valorEfetivo - abateFundo);
  }

  return { valorEfetivo, abateFundo, abateTaxa };
}

function aplicarPagamentosNosSaldos(params: {
  saldoDevedorFundo: number;
  saldoDevedorTaxa: number;
  fundoComum: number;
  taxaAdministracao: number;
  abateFundo: number;
  abateTaxa: number;
}): { saldoDevedorFundo: number; saldoDevedorTaxa: number } {
  const { fundoComum, taxaAdministracao, abateFundo, abateTaxa } = params;

  let saldoDevedorFundo = round2(params.saldoDevedorFundo - fundoComum - abateFundo);
  saldoDevedorFundo = zerarSeAbaixoDoEpsilon(saldoDevedorFundo);

  let saldoDevedorTaxa = round2(params.saldoDevedorTaxa - taxaAdministracao - abateTaxa);
  saldoDevedorTaxa = zerarSeAbaixoDoEpsilon(saldoDevedorTaxa);

  return { saldoDevedorFundo, saldoDevedorTaxa };
}

/**
 * Simula quantos meses faltam para quitar o consórcio seguindo o "plano atual"
 * (sem novas amortizações adicionais), mantendo:
 * - mesmo divisor do fundo comum (mesesFundoComum)
 * - mesma lógica de degrau anual (correção no mês 13, 25, ...)
 * - mesma lógica proporcional de taxa vs fundo
 *
 * Essencial para o tipo "parcela": quando já houve redução de prazo (tipo "prazo"),
 * a recalibração de parcela deve respeitar o PRAZO ATUAL (não o original).
 */
function simularMesesRestantesNoPlanoAtual(params: {
  mesAtual: number;
  mesLimite: number;
  correcaoAnual: number;
  valorBemAtual: number;
  saldoDevedorFundo: number;
  saldoDevedorTaxa: number;
  mesesFundoComum: number;
}): number {
  const mesAtual = params.mesAtual;
  let { valorBemAtual, saldoDevedorFundo, saldoDevedorTaxa } = params;
  const { correcaoAnual, mesesFundoComum } = params;

  saldoDevedorFundo = zerarSeAbaixoDoEpsilon(round2(saldoDevedorFundo));
  saldoDevedorTaxa = zerarSeAbaixoDoEpsilon(round2(saldoDevedorTaxa));
  if (saldoDevedorFundo <= EPSILON && saldoDevedorTaxa <= EPSILON) return 0;

  let mesesRestantes = 0;
  let mes = mesAtual + 1;

  while ((saldoDevedorFundo > EPSILON || saldoDevedorTaxa > EPSILON) && mes <= params.mesLimite) {
    const isNovoAno = isMesReajusteAnual(mes);
    if (isNovoAno) {
      const fatorReajuste = fatorReajusteAnual(correcaoAnual);
      valorBemAtual = aplicarFatorReajuste(valorBemAtual, fatorReajuste);
      saldoDevedorFundo = aplicarFatorReajuste(saldoDevedorFundo, fatorReajuste);
      saldoDevedorTaxa = aplicarFatorReajuste(saldoDevedorTaxa, fatorReajuste);
    }

    const { fundoComum, taxaAdministracao } = calcularParcelaBaseProporcional({
      valorBemAtual,
      divisorFundoComum: mesesFundoComum,
      saldoDevedorFundo,
      saldoDevedorTaxa,
    });

    const saldosAtualizados = aplicarPagamentosNosSaldos({
      saldoDevedorFundo,
      saldoDevedorTaxa,
      fundoComum,
      taxaAdministracao,
      abateFundo: 0,
      abateTaxa: 0,
    });
    saldoDevedorFundo = saldosAtualizados.saldoDevedorFundo;
    saldoDevedorTaxa = saldosAtualizados.saldoDevedorTaxa;

    mesesRestantes++;
    mes++;
    if (saldoDevedorFundo + saldoDevedorTaxa <= EPSILON) break;
  }

  return mesesRestantes;
}

function construirCashflowsParaTir<T extends { mes: number }>(
  parcelas: T[],
  getPagamentoNoMes: (p: T) => number,
  params: {
    mesContemplacao: number;
    aluguelMensal: number;
    correcaoAnualAluguel: number;
    valorBemFinal: number;
    agio?: number;
  }
): number[] {
  if (parcelas.length === 0) return [];

  const { mesContemplacao, aluguelMensal, correcaoAnualAluguel, valorBemFinal } = params;

  const cashflows: number[] = parcelas.map((p) => {
    const mes = p.mes;
    const aluguelRecebido =
      aluguelMensal > 0 && mes >= mesContemplacao
        ? getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel)
        : 0;

    const pagamento = round2(getPagamentoNoMes(p));
    return round2(aluguelRecebido - pagamento);
  });

  // Note: Ágio is now included in the first month's parcela, so we don't add it separately here
  // This prevents double-counting since getPagamentoNoMes already returns parcela with agio

  // Add final asset value in the last month (inflow)
  cashflows[cashflows.length - 1] += valorBemFinal;

  return cashflows;
}

function calcularTir<T extends { mes: number }>(
  parcelas: T[],
  getPagamentoNoMes: (p: T) => number,
  params: {
    mesContemplacao: number;
    aluguelMensal: number;
    correcaoAnualAluguel: number;
    valorBemFinal: number;
    agio?: number;
  }
): TirResultado {
  const cashflows = construirCashflowsParaTir(parcelas, getPagamentoNoMes, params);
  if (cashflows.length === 0) return { tirMensal: null, tirAnual: null, cashflows: [] };

  const irr = calculateIrr(cashflows);
  if (irr !== null && Number.isFinite(irr)) {
    return { tirMensal: irr, tirAnual: convertMonthlyRateToAnnualRate(irr), cashflows };
  }

  return { tirMensal: null, tirAnual: null, cashflows };
}

/**
 * Calcula as parcelas de um consórcio
 *
 * Estrutura da parcela:
 * - Fundo Comum: valorBem / meses (corrigido anualmente)
 * - Taxa de Administração: (taxaAdministracaoTotal% / meses) * valorBem (corrigido anualmente)
 *
 * A correção é aplicada a cada 12 meses, ajustando o valor do bem
 * e consequentemente as parcelas restantes.
 *
 * Se um lance for informado, ele é aplicado no mês especificado e reduz o prazo
 * (tipo "prazo" - a parcela se mantém, o prazo diminui).
 */
export function calcularConsorcio(inputs: InputsConsorcio): ResultadoConsorcio {
  const { valorBem, meses, taxaAdministracaoTotal, correcaoAnual, lance } = inputs;

  // If there is no bid, use original simplified logic
  if (!lance || lance.valor <= 0) {
    return calcularConsorcioSemLance(inputs);
  }

  // With bid: use logic similar to recalcularConsorcioComAmortizacoes
  const parcelas: ParcelaConsorcio[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;

  // Premium (amount paid to buy already awarded credit letter)
  const agio = inputs.agio || 0;

  // Current asset value (will be adjusted annually)
  let valorBemAtual = valorBem;

  // Initial balances (common fund and fee are controlled separately for bid)
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Divisor do fundo comum (fixo em 'meses' para modo prazo)
  const mesesFundoComum = meses;

  let mesAtual = 1;

  // Loop until both balances are paid off or safety limit is reached
  while ((saldoDevedorFundo > EPSILON || saldoDevedorTaxa > EPSILON) && mesAtual <= meses * MAX_MESES_FATOR_SEGURANCA) {
    const anoCorrente = anoCorrenteParaMes(mesAtual);
    const isNovoAno = isMesReajusteAnual(mesAtual);

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      const fatorReajuste = fatorReajusteAnual(correcaoAnual);
      valorBemAtual = aplicarFatorReajuste(valorBemAtual, fatorReajuste);
      saldoDevedorFundo = aplicarFatorReajuste(saldoDevedorFundo, fatorReajuste);
      saldoDevedorTaxa = aplicarFatorReajuste(saldoDevedorTaxa, fatorReajuste);
    }

    const { fundoComum, taxaAdministracao, parcelaBase } = calcularParcelaBaseProporcional({
      valorBemAtual,
      divisorFundoComum: mesesFundoComum,
      saldoDevedorFundo,
      saldoDevedorTaxa,
    });

    // Check if it's the bid month
    const isLanceMes = mesAtual === lance.mes;
    let abateFundo = 0;
    let abateTaxa = 0;
    let lanceEfetivo = 0;

    if (isLanceMes && lance.valor > 0) {
      const abate = calcularAbateProporcional(
        lance.valor,
        saldoDevedorFundo,
        saldoDevedorTaxa,
        fundoComum,
        taxaAdministracao
      );
      abateFundo = abate.abateFundo;
      abateTaxa = abate.abateTaxa;
      lanceEfetivo = abate.valorEfetivo;
    }

    // Atualiza saldos
    const saldosAtualizados = aplicarPagamentosNosSaldos({
      saldoDevedorFundo,
      saldoDevedorTaxa,
      fundoComum,
      taxaAdministracao,
      abateFundo,
      abateTaxa,
    });
    saldoDevedorFundo = saldosAtualizados.saldoDevedorFundo;
    saldoDevedorTaxa = saldosAtualizados.saldoDevedorTaxa;

    totalTaxaAdministracao = round2(totalTaxaAdministracao + taxaAdministracao + abateTaxa);
    // Add agio to the first month's parcela
    const parcelaComLance = parcelaBase + lanceEfetivo;
    const parcelaFinal = mesAtual === 1 ? round2(parcelaComLance + agio) : parcelaComLance;
    totalPago = round2(totalPago + parcelaFinal);

    const saldoDevedorTotal = round2(saldoDevedorFundo + saldoDevedorTaxa);

    parcelas.push({
      mes: mesAtual,
      fundoComum,
      taxaAdministracao,
      parcela: parcelaFinal, // Includes bid and premium (if applicable) in the month's payment
      saldoDevedor: saldoDevedorFundo,
      correcaoAplicada,
      anoCorrente,
    });

    mesAtual++;
    if (saldoDevedorTotal <= EPSILON) break;
  }

  const totalPagoComAgio = round2(totalPago);

  // Rent parameters (optional)
  const mesContemplacao = inputs.mesContemplacao ?? inputs.lance?.mes ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { tirMensal, tirAnual, cashflows } = calcularTir(parcelas, (p) => p.parcela, {
    mesContemplacao,
    aluguelMensal,
    correcaoAnualAluguel,
    valorBemFinal: valorBemAtual,
    agio,
  });

  return {
    valorBem,
    valorBemFinal: valorBemAtual,
    primeiraParcela: parcelas[0]?.parcela ?? 0,
    ultimaParcela: parcelas[parcelas.length - 1]?.parcela ?? 0,
    totalTaxaAdministracao,
    totalPago: totalPagoComAgio,
    agio,
    parcelas,
    tirMensal,
    tirAnual,
    cashflows,
  };
}

/**
 * Versão original do cálculo sem lance (para performance quando não há lance)
 */
function calcularConsorcioSemLance(inputs: InputsConsorcio): ResultadoConsorcio {
  const { valorBem, meses, taxaAdministracaoTotal, correcaoAnual, agio: agioInput } = inputs;

  const parcelas: ParcelaConsorcio[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;

  let valorBemAtual = valorBem;
  let saldoDevedorAtual = valorBem;

  // Premium (amount paid to buy already awarded credit letter)
  const agio = agioInput || 0;

  for (let mes = 1; mes <= meses; mes++) {
    const anoCorrente = anoCorrenteParaMes(mes);
    const isNovoAno = isMesReajusteAnual(mes);

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      const fatorReajuste = fatorReajusteAnual(correcaoAnual);
      valorBemAtual = aplicarFatorReajuste(valorBemAtual, fatorReajuste);
      saldoDevedorAtual = aplicarFatorReajuste(saldoDevedorAtual, fatorReajuste);
    }

    const fundoComum = round2(valorBemAtual / meses);
    const taxaAdministracao = round2((taxaAdministracaoTotal / 100 / meses) * valorBemAtual);
    // Add agio to the first month's parcela
    const parcelaBase = round2(fundoComum + taxaAdministracao);
    const parcela = mes === 1 ? round2(parcelaBase + agio) : parcelaBase;

    saldoDevedorAtual = round2(saldoDevedorAtual - fundoComum);
    saldoDevedorAtual = zerarSeAbaixoDoEpsilon(saldoDevedorAtual);

    totalTaxaAdministracao = round2(totalTaxaAdministracao + taxaAdministracao);
    totalPago = round2(totalPago + parcela);

    parcelas.push({
      mes,
      fundoComum,
      taxaAdministracao,
      parcela,
      saldoDevedor: saldoDevedorAtual,
      correcaoAplicada,
      anoCorrente,
    });
  }

  const totalPagoComAgio = round2(totalPago);

  // Rent parameters (optional)
  const mesContemplacao = inputs.mesContemplacao ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { tirMensal, tirAnual, cashflows } = calcularTir(parcelas, (p) => p.parcela, {
    mesContemplacao,
    aluguelMensal,
    correcaoAnualAluguel,
    valorBemFinal: valorBemAtual,
    agio,
  });

  return {
    valorBem,
    valorBemFinal: valorBemAtual,
    primeiraParcela: parcelas[0]?.parcela ?? 0,
    ultimaParcela: parcelas[parcelas.length - 1]?.parcela ?? 0,
    totalTaxaAdministracao,
    totalPago: totalPagoComAgio,
    agio,
    parcelas,
    tirMensal,
    tirAnual,
    cashflows,
  };
}

/**
 * Recalcula o consórcio considerando amortizações adicionais (lances)
 *
 * Modelo de Lance Proporcional:
 * - O lance é considerado um pagamento antecipado de parcelas a valor presente.
 * - Ele abate proporcionalmente o saldo devedor do fundo comum E o saldo da taxa de administração.
 * - Ao pagar hoje, o consorciado evita os reajustes futuros (INCC/IPCA) sobre as parcelas antecipadas.
 *
 * Saldos controlados:
 * - Saldo Fundo Comum: inicia = ValorBem.
 * - Saldo Taxa Admin: inicia = ValorBem * TaxaTotal%.
 * - Ambos sofrem reajuste anual pelo índice.
 */
export function recalcularConsorcioComAmortizacoes(
  inputs: InputsConsorcio,
  amortizacoesAdicionais: AmortizacaoAdicionalConsorcio[]
): ResultadoConsorcioComAdicionais {
  const { valorBem, meses, taxaAdministracaoTotal, correcaoAnual } = inputs;

  // Create map of additional amortizations by month
  const amortizacoesMap = new Map<number, AmortizacaoAdicionalConsorcio>();
  for (const amort of amortizacoesAdicionais) {
    if (amort.valor > 0) {
      amortizacoesMap.set(amort.mes, amort);
    }
  }

  // Include initial bid (if present) as additional amortization in contemplation month.
  // This ensures that the "with additional amortizations" scenario is comparable to the original scenario,
  // when the user has already entered a bid in the form.
  if (inputs.lance && inputs.lance.valor > 0) {
    const existente = amortizacoesMap.get(inputs.lance.mes);
    if (existente) {
      amortizacoesMap.set(inputs.lance.mes, {
        ...existente,
        // Sum values and preserve the type already chosen for that month (if exists).
        valor: round2(existente.valor + inputs.lance.valor),
      });
    } else {
      amortizacoesMap.set(inputs.lance.mes, {
        mes: inputs.lance.mes,
        valor: inputs.lance.valor,
        tipo: "prazo",
      });
    }
  }

  // Calculate original result for comparison
  const resultadoOriginal = calcularConsorcio(inputs);

  const parcelas: ParcelaConsorcioComAdicional[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;
  let totalAmortizacoesAdicionais = 0;

  // Premium (amount paid to buy already awarded credit letter)
  const agio = inputs.agio || 0;

  // Current asset value (will be adjusted annually)
  let valorBemAtual = valorBem;

  // Initial balances
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Factors for monthly calculation
  let mesesFundoComum = meses; // common fund divisor
  // "Target month" to maintain term when choosing "parcela" type.
  // Starts at original term, but can reduce if there are "prazo" type amortizations (bids) before.
  // Important: should never increase.
  let mesFinalAlvoParcela = meses;

  let mes = 1;

  // Loop until both balances are paid off or safety limit is reached
  while ((saldoDevedorFundo > EPSILON || saldoDevedorTaxa > EPSILON) && mes <= meses * MAX_MESES_FATOR_SEGURANCA) {
    const anoCorrente = anoCorrenteParaMes(mes);
    const isNovoAno = isMesReajusteAnual(mes);

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      const fatorReajuste = fatorReajusteAnual(correcaoAnual);
      valorBemAtual = aplicarFatorReajuste(valorBemAtual, fatorReajuste);
      saldoDevedorFundo = aplicarFatorReajuste(saldoDevedorFundo, fatorReajuste);
      saldoDevedorTaxa = aplicarFatorReajuste(saldoDevedorTaxa, fatorReajuste);
    }

    const { fundoComum, taxaAdministracao, parcelaBase } = calcularParcelaBaseProporcional({
      valorBemAtual,
      divisorFundoComum: mesesFundoComum,
      saldoDevedorFundo,
      saldoDevedorTaxa,
    });

    // State of "current plan" after paying the month's payment (WITHOUT additional amortization).
    // Used to discover current term when user chooses "parcela" type.
    const saldosAposParcelaSemExtra = aplicarPagamentosNosSaldos({
      saldoDevedorFundo,
      saldoDevedorTaxa,
      fundoComum,
      taxaAdministracao,
      abateFundo: 0,
      abateTaxa: 0,
    });

    // Check additional amortization (bid)
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

    let abateFundo = 0;
    let abateTaxa = 0;
    let amortizacaoEfetiva = 0;

    if (valorAdicional > 0) {
      const abate = calcularAbateProporcional(
        valorAdicional,
        saldoDevedorFundo,
        saldoDevedorTaxa,
        fundoComum,
        taxaAdministracao
      );
      abateFundo = abate.abateFundo;
      abateTaxa = abate.abateTaxa;
      amortizacaoEfetiva = abate.valorEfetivo;
    }

    // Atualiza saldos
    const saldosAtualizados = aplicarPagamentosNosSaldos({
      saldoDevedorFundo,
      saldoDevedorTaxa,
      fundoComum,
      taxaAdministracao,
      abateFundo,
      abateTaxa,
    });
    saldoDevedorFundo = saldosAtualizados.saldoDevedorFundo;
    saldoDevedorTaxa = saldosAtualizados.saldoDevedorTaxa;

    totalTaxaAdministracao = round2(totalTaxaAdministracao + taxaAdministracao + abateTaxa);
    // Add agio to the first month's parcela (but not amortizacao adicional, which is tracked separately)
    const parcelaFinal = mes === 1 ? round2(parcelaBase + agio) : parcelaBase;
    totalPago = round2(totalPago + parcelaFinal + amortizacaoEfetiva);
    totalAmortizacoesAdicionais = round2(totalAmortizacoesAdicionais + amortizacaoEfetiva);

    const saldoDevedorTotal = round2(saldoDevedorFundo + saldoDevedorTaxa);

    parcelas.push({
      mes,
      fundoComum,
      taxaAdministracao,
      parcela: parcelaFinal, // Includes premium in first month (additional amortization is separate)
      saldoDevedor: saldoDevedorFundo, // Na tabela mostramos o saldo do bem (comum)
      correcaoAplicada,
      anoCorrente,
      amortizacaoAdicional: amortizacaoEfetiva,
      tipoAdicional,
    });

    // Parameter adjustment post-bid
    if (amortizacaoEfetiva > 0) {
      if (tipoAdicional === "prazo") {
        // Prazo mode: we don't change the divisor (mesesFundoComum).
        // Nominal payment remains "the same" (adjusted only by annual INCC).
        // Balance drops quickly and loop ends earlier.
      } else {
        // Discover CURRENT TERM (plan without considering this month's additional amortization),
        // to avoid bug where "parcela" amortization recalculates using original term
        // and "stretches" schedule back.
        const mesesRestantesPlanoAtual =
          saldosAposParcelaSemExtra.saldoDevedorFundo > EPSILON || saldosAposParcelaSemExtra.saldoDevedorTaxa > EPSILON
            ? simularMesesRestantesNoPlanoAtual({
                mesAtual: mes,
                mesLimite: meses * MAX_MESES_FATOR_SEGURANCA,
                correcaoAnual,
                valorBemAtual,
                saldoDevedorFundo: saldosAposParcelaSemExtra.saldoDevedorFundo,
                saldoDevedorTaxa: saldosAposParcelaSemExtra.saldoDevedorTaxa,
                mesesFundoComum,
              })
            : 0;

        const mesFinalPlanoAtual = mes + mesesRestantesPlanoAtual;
        mesFinalAlvoParcela = Math.min(mesFinalAlvoParcela, mesFinalPlanoAtual);
        const mesesRestantes = Math.max(1, mesFinalAlvoParcela - mes);

        // Parcela mode: we want to dilute remaining balance in original term.
        // New payment calculation must cover remaining balance in mesesRestantes.
        // But payment logic is: ValorBem / Divisor.
        // We want to find NovoDivisor such that: (ValorBemAtual / NovoDivisor) * MesesRestantes ≈ SaldoDevedorFundo.
        // Therefore: NovoDivisor = (ValorBemAtual * MesesRestantes) / SaldoDevedorFundo.
        if (saldoDevedorFundo > EPSILON) {
          mesesFundoComum = round2((valorBemAtual * mesesRestantes) / saldoDevedorFundo);
          // For fee, same logic to maintain proportion
          if (saldoDevedorTaxa > EPSILON) {
            // Fee will implicitly follow because it's calculated proportional to fund
          }
        }
      }
    }

    mes++;
    if (saldoDevedorTotal <= EPSILON) break;
  }

  const mesesComAdicionais = parcelas.length;
  const economiaMeses = meses - mesesComAdicionais;
  // For safety, avoid negative savings due to rounding
  const economiaTaxa = Math.max(0, round2(resultadoOriginal.totalTaxaAdministracao - totalTaxaAdministracao));

  // IRR of original scenario was already calculated in calcularConsorcio.
  const tirMensalOriginal = resultadoOriginal.tirMensal ?? null;
  const tirAnualOriginal = resultadoOriginal.tirAnual ?? null;
  const cashflowsOriginal = resultadoOriginal.cashflows ?? [];

  // Rent parameters (optional)
  const mesContemplacao = inputs.mesContemplacao ?? inputs.lance?.mes ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const {
    tirMensal: tirMensalComAdicionais,
    tirAnual: tirAnualComAdicionais,
    cashflows: cashflowsComAdicionais,
  } = calcularTir(parcelas, (p) => p.parcela + p.amortizacaoAdicional, {
    mesContemplacao,
    aluguelMensal,
    correcaoAnualAluguel,
    valorBemFinal: valorBemAtual,
    agio,
  });

  const totalPagoComAdicionais = round2(totalPago);

  return {
    valorBem,
    valorBemFinal: valorBemAtual,
    totalTaxaAdministracaoOriginal: resultadoOriginal.totalTaxaAdministracao,
    totalPagoOriginal: resultadoOriginal.totalPago,
    totalTaxaAdministracaoComAdicionais: totalTaxaAdministracao,
    totalPagoComAdicionais,
    totalAmortizacoesAdicionais,
    mesesOriginais: meses,
    mesesComAdicionais,
    economiaTaxa, // Savings generated by not paying INCC on prepaid fee
    economiaMeses,
    parcelas,
    tirMensalOriginal,
    tirAnualOriginal,
    tirMensalComAdicionais,
    tirAnualComAdicionais,
    cashflowsOriginal,
    cashflowsComAdicionais,
  };
}
