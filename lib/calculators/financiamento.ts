import { round2, calculateIrr, getAluguelCorrigidoNoMes } from "../utils";
import { convertAnnualRateToMonthlyRate, convertMonthlyRateToAnnualRate } from "../utils/math";

export interface InputsFinanciamento {
  valorEmprestimo: number;
  valorEntrada: number;
  taxaJurosAnual: number;
  meses: number;
  /**
   * Annual property appreciation rate (e.g., 6 = 6% p.a.).
   * Used only for IRR calculation, does not change payments.
   */
  correcaoAnualImovel: number;
  /**
   * Monthly rent received when renting the property (optional).
   * Used in IRR calculation as revenue that reduces monthly outflow.
   */
  aluguelMensal?: number;
  /**
   * Annual rent adjustment (e.g., 6 = 6% p.a. - IGP-M).
   */
  correcaoAnualAluguel?: number;
}

export interface Parcela {
  mes: number;
  saldoInicial: number;
  jurosPago: number;
  amortizacao: number;
  prestacao: number;
  saldoDevedor: number;
}

export interface ParcelaComAdicional extends Parcela {
  amortizacaoAdicional: number;
  tipoAdicional: TipoAmortizacaoAdicional;
}

export interface ResultadoFinanciamento {
  valorFinanciado: number;
  /** Property value (before down payment) used to project appreciation. */
  valorImovelInicial: number;
  /** Estimated future property value at the end of the considered term. */
  valorImovelFinal: number;
  totalJurosPagos: number;
  totalPago: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
  parcelas: Parcela[];
  /** Monthly IRR considering down payment + payments as outflows and final property value as inflow. */
  tirMensal?: number | null;
  /** Annual IRR equivalent to monthly IRR. */
  tirAnual?: number | null;
  /** Total rent received throughout the loan (used for display). */
  totalAluguelRecebido?: number;
  /** Cash flows used for IRR calculation. */
  cashflows?: number[];
}

export interface ResultadoComAdicionais {
  valorFinanciado: number;
  totalJurosPagosOriginal: number;
  totalPagoOriginal: number;
  totalJurosPagosComAdicionais: number;
  totalPagoComAdicionais: number;
  totalAmortizacoesAdicionais: number;
  mesesOriginais: number;
  mesesComAdicionais: number;
  economiaJuros: number;
  parcelas: ParcelaComAdicional[];
  // IRR of original scenario (without additional amortizations)
  tirMensalOriginal?: number | null;
  tirAnualOriginal?: number | null;
  // IRR of scenario with additional amortizations
  tirMensalComAdicionais?: number | null;
  tirAnualComAdicionais?: number | null;
  /** Total rent received in original scenario. */
  totalAluguelRecebidoOriginal?: number;
  /** Total rent received in scenario with amortizations. */
  totalAluguelRecebidoComAdicionais?: number;
  /** Cash flows of original scenario. */
  cashflowsOriginal?: number[];
  /** Cash flows of scenario with additional amortizations. */
  cashflowsComAdicionais?: number[];
}

export interface AmortizacaoAdicional {
  mes: number;
  valor: number;
  tipo: TipoAmortizacaoAdicional;
}

export type MetodoAmortizacao = "sac" | "price";
export type TipoAmortizacaoAdicional = "prazo" | "parcela";

// ================================
// Helper Functions
// ================================

/**
 * Calculates the future value of the property considering annual appreciation.
 */
function calcularValorizacaoImovel(
  valorInicial: number,
  meses: number,
  correcaoAnualImovel: number
): { valorInicial: number; valorFinal: number } {
  const anosTotal = meses / 12;
  const fatorValorImovel = Math.pow(1 + (correcaoAnualImovel ?? 0) / 100, anosTotal);
  const valorFinal = round2(valorInicial * fatorValorImovel);
  return { valorInicial, valorFinal };
}

/**
 * Calculates monthly cash flows for IRR calculation.
 * Returns cashflows and total rent received.
 */
function calcularCashflows(
  parcelas: Parcela[],
  valorEntrada: number,
  valorImovelFinal: number,
  aluguelMensal: number,
  correcaoAnualAluguel: number
): { cashflows: number[]; totalAluguelRecebido: number } {
  let totalAluguelRecebido = 0;
  const cashflows: number[] = [];

  for (const parcela of parcelas) {
    const mes = parcela.mes;
    const aluguelRecebido = aluguelMensal > 0 ? getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel) : 0;

    totalAluguelRecebido = round2(totalAluguelRecebido + aluguelRecebido);

    // Net cash flow of the month: rent received - payment
    const fluxoLiquido = round2(aluguelRecebido - parcela.prestacao);
    cashflows.push(fluxoLiquido);
  }

  // Include down payment as outflow in the first month
  if (valorEntrada > 0 && cashflows.length > 0) {
    cashflows[0] -= valorEntrada;
  }

  // Add estimated future property value in the last month
  if (cashflows.length > 0) {
    cashflows[cashflows.length - 1] += valorImovelFinal;
  }

  return { cashflows, totalAluguelRecebido };
}

/**
 * Calculates cash flows for payments with additional amortizations.
 */
function calcularCashflowsComAdicionais(
  parcelas: ParcelaComAdicional[],
  valorEntrada: number,
  valorImovelFinal: number,
  aluguelMensal: number,
  correcaoAnualAluguel: number
): { cashflows: number[]; totalAluguelRecebido: number } {
  let totalAluguelRecebido = 0;
  const cashflows: number[] = [];

  for (const parcela of parcelas) {
    const mesAtual = parcela.mes;
    const adicional = parcela.amortizacaoAdicional ?? 0;
    const pagamento = round2(parcela.prestacao + adicional);

    const aluguelRecebido =
      aluguelMensal > 0 ? getAluguelCorrigidoNoMes(mesAtual, aluguelMensal, correcaoAnualAluguel) : 0;

    totalAluguelRecebido = round2(totalAluguelRecebido + aluguelRecebido);

    // Net cash flow of the month: rent received - (payment + additional)
    const fluxoLiquido = round2(aluguelRecebido - pagamento);
    cashflows.push(fluxoLiquido);
  }

  // Include down payment as outflow in the first month
  if (valorEntrada > 0 && cashflows.length > 0) {
    cashflows[0] -= valorEntrada;
  }

  // Add estimated future property value in the last month
  if (cashflows.length > 0) {
    cashflows[cashflows.length - 1] += valorImovelFinal;
  }

  return { cashflows, totalAluguelRecebido };
}

/**
 * Calculates monthly and annual IRR from cash flows.
 */
function calcularTIR(cashflows: number[]): { tirMensal: number | null; tirAnual: number | null } {
  if (cashflows.length === 0) {
    return { tirMensal: null, tirAnual: null };
  }

  const irr = calculateIrr(cashflows);
  if (irr === null || !Number.isFinite(irr)) {
    return { tirMensal: null, tirAnual: null };
  }

  return {
    tirMensal: irr,
    tirAnual: convertMonthlyRateToAnnualRate(irr),
  };
}

/**
 * Calculates complete IRR (appreciation + cashflows + IRR).
 */
function calcularTIRCompleta(
  parcelas: Parcela[],
  inputs: InputsFinanciamento,
  valorImovelFinal: number
): {
  tirMensal: number | null;
  tirAnual: number | null;
  totalAluguelRecebido: number;
  cashflows: number[];
} {
  if (parcelas.length === 0) {
    return {
      tirMensal: null,
      tirAnual: null,
      totalAluguelRecebido: 0,
      cashflows: [],
    };
  }

  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { cashflows, totalAluguelRecebido } = calcularCashflows(
    parcelas,
    inputs.valorEntrada,
    valorImovelFinal,
    aluguelMensal,
    correcaoAnualAluguel
  );

  const { tirMensal, tirAnual } = calcularTIR(cashflows);

  return {
    tirMensal,
    tirAnual,
    totalAluguelRecebido,
    cashflows,
  };
}

/**
 * Calculates constant payment using PRICE formula.
 * PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calcularPrestacaoPRICE(valorFinanciado: number, taxaMensal: number, meses: number): number {
  if (taxaMensal === 0) {
    return valorFinanciado / meses;
  }

  const fator = Math.pow(1 + taxaMensal, meses);
  return valorFinanciado * ((taxaMensal * fator) / (fator - 1));
}

/**
 * Calculates amortization schedule using SAC (Constant Amortization System).
 */
function calcularCronogramaSAC(
  valorFinanciado: number,
  taxaMensal: number,
  meses: number
): { parcelas: Parcela[]; totalJurosPagos: number } {
  const amortizacaoConstante = valorFinanciado / meses;
  const parcelas: Parcela[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);
    const amortizacao =
      taxaMensal === 0
        ? round2(saldoInicial / (meses - mes + 1))
        : mes === meses
          ? round2(saldoInicial)
          : round2(amortizacaoConstante);
    const prestacao = round2(amortizacao + jurosPago);
    saldoDevedor = round2(saldoInicial - amortizacao);

    // Evita saldo negativo por erros de ponto flutuante
    if (saldoDevedor < 0.01) {
      saldoDevedor = 0;
    }

    totalJurosPagos = round2(totalJurosPagos + jurosPago);

    parcelas.push({
      mes,
      saldoInicial,
      jurosPago,
      amortizacao,
      prestacao,
      saldoDevedor,
    });
  }

  return { parcelas, totalJurosPagos };
}

/**
 * Calcula o cronograma de amortização usando PRICE (Sistema Francês).
 */
function calcularCronogramaPRICE(
  valorFinanciado: number,
  taxaMensal: number,
  meses: number
): { parcelas: Parcela[]; totalJurosPagos: number } {
  const prestacaoConstante = calcularPrestacaoPRICE(valorFinanciado, taxaMensal, meses);

  const parcelas: Parcela[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);
    const amortizacao =
      taxaMensal === 0
        ? round2(saldoInicial / (meses - mes + 1))
        : mes === meses
          ? round2(saldoInicial)
          : round2(prestacaoConstante - jurosPago);
    const prestacao = round2(amortizacao + jurosPago);
    saldoDevedor = round2(saldoInicial - amortizacao);

    // Evita saldo negativo por erros de ponto flutuante
    if (saldoDevedor < 0.01) {
      saldoDevedor = 0;
    }

    totalJurosPagos = round2(totalJurosPagos + jurosPago);

    parcelas.push({
      mes,
      saldoInicial,
      jurosPago,
      amortizacao,
      prestacao,
      saldoDevedor,
    });
  }

  return { parcelas, totalJurosPagos };
}

/**
 * Calculates loan using Constant Amortization System (SAC)
 * - Amortization is constant
 * - Payments are decreasing
 */
export function calcularSAC(inputs: InputsFinanciamento): ResultadoFinanciamento {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses, correcaoAnualImovel } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = convertAnnualRateToMonthlyRate(taxaJurosAnual);

  const { parcelas, totalJurosPagos } = calcularCronogramaSAC(valorFinanciado, taxaMensal, meses);

  const { valorInicial: valorImovelInicial, valorFinal: valorImovelFinal } = calcularValorizacaoImovel(
    valorEmprestimo,
    meses,
    correcaoAnualImovel
  );

  const { tirMensal, tirAnual, totalAluguelRecebido, cashflows } = calcularTIRCompleta(
    parcelas,
    inputs,
    valorImovelFinal
  );

  return {
    valorFinanciado,
    valorImovelInicial,
    valorImovelFinal,
    totalJurosPagos,
    totalPago: valorFinanciado + totalJurosPagos,
    primeiraPrestacao: parcelas[0]?.prestacao ?? 0,
    ultimaPrestacao: parcelas[parcelas.length - 1]?.prestacao ?? 0,
    parcelas,
    tirMensal,
    tirAnual,
    totalAluguelRecebido,
    cashflows,
  };
}

/**
 * Calculates loan using PRICE Table (French Amortization System)
 * - Payments are constant
 * - Amortization is increasing
 */
export function calcularPRICE(inputs: InputsFinanciamento): ResultadoFinanciamento {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses, correcaoAnualImovel } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = convertAnnualRateToMonthlyRate(taxaJurosAnual);

  const { parcelas, totalJurosPagos } = calcularCronogramaPRICE(valorFinanciado, taxaMensal, meses);

  const { valorInicial: valorImovelInicial, valorFinal: valorImovelFinal } = calcularValorizacaoImovel(
    valorEmprestimo,
    meses,
    correcaoAnualImovel
  );

  const { tirMensal, tirAnual, totalAluguelRecebido, cashflows } = calcularTIRCompleta(
    parcelas,
    inputs,
    valorImovelFinal
  );

  return {
    valorFinanciado,
    valorImovelInicial,
    valorImovelFinal,
    totalJurosPagos,
    totalPago: valorFinanciado + totalJurosPagos,
    primeiraPrestacao: parcelas[0]?.prestacao ?? 0,
    ultimaPrestacao: parcelas[parcelas.length - 1]?.prestacao ?? 0,
    parcelas,
    tirMensal,
    tirAnual,
    totalAluguelRecebido,
    cashflows,
  };
}

export function calcularFinanciamento(inputs: InputsFinanciamento, metodo: MetodoAmortizacao): ResultadoFinanciamento {
  if (metodo === "sac") {
    return calcularSAC(inputs);
  }
  return calcularPRICE(inputs);
}

// ================================
// Recalculate with additional amortizations (helpers)
// ================================

const SALDO_QUITADO_EPS = 0.01;
const LIMITE_MULTIPLICADOR_MESES_RECALCULO = 2;
const TOLERANCIA_PARCELA_FINAL_PRICE = 0.005;

function ajustarSaldoQuitado(saldoDevedor: number): number {
  return saldoDevedor < SALDO_QUITADO_EPS ? 0 : saldoDevedor;
}

/**
 * Simulates how many months remain to pay off the balance following the "current plan"
 * (same amortization/payment base, without new additional amortizations),
 * using the same rounding rules as the main loop.
 *
 * This is essential for "parcela" type: when there has already been term reduction (type "prazo"),
 * the new payment calculation must respect the CURRENT TERM (not the original term).
 */
function simularMesesRestantesNoPlanoAtual(params: {
  metodo: MetodoAmortizacao;
  saldoDevedor: number;
  taxaMensal: number;
  amortizacaoBase: number;
  prestacaoBase: number;
  maxMeses: number;
}): number {
  const { metodo, taxaMensal, amortizacaoBase, prestacaoBase } = params;
  let saldoDevedor = ajustarSaldoQuitado(round2(params.saldoDevedor));
  if (saldoDevedor <= 0) return 0;

  const maxMeses = Math.max(1, Math.floor(params.maxMeses));
  let meses = 0;

  for (let i = 0; i < maxMeses && saldoDevedor > SALDO_QUITADO_EPS; i++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);

    const { amortizacao } =
      metodo === "sac"
        ? calcularParcelaBaseSAC(saldoInicial, jurosPago, amortizacaoBase, false)
        : calcularParcelaBasePRICE(saldoInicial, jurosPago, prestacaoBase, false);

    saldoDevedor = round2(saldoInicial - amortizacao);
    saldoDevedor = ajustarSaldoQuitado(saldoDevedor);
    meses++;
  }

  return meses;
}

function criarMapaAmortizacoesPorMes(
  amortizacoesAdicionais: AmortizacaoAdicional[]
): Map<number, AmortizacaoAdicional> {
  const map = new Map<number, AmortizacaoAdicional>();
  for (const amort of amortizacoesAdicionais) {
    if (amort.valor > 0) {
      map.set(amort.mes, amort);
    }
  }
  return map;
}

function calcularParcelaBaseSAC(
  saldoInicial: number,
  jurosPago: number,
  amortizacaoBase: number,
  isUltimaParcelaOriginal: boolean
): { amortizacao: number; prestacao: number } {
  const amortizacao = isUltimaParcelaOriginal ? round2(saldoInicial) : round2(Math.min(amortizacaoBase, saldoInicial));

  const prestacao = round2(amortizacao + jurosPago);
  return { amortizacao, prestacao };
}

function calcularParcelaBasePRICE(
  saldoInicial: number,
  jurosPago: number,
  prestacaoBase: number,
  isUltimaParcelaOriginal: boolean
): { amortizacao: number; prestacao: number } {
  const valorMaximoPrestacao = round2(saldoInicial + jurosPago);
  const isParcelaFinal =
    prestacaoBase >= valorMaximoPrestacao - TOLERANCIA_PARCELA_FINAL_PRICE || isUltimaParcelaOriginal;

  if (isParcelaFinal) {
    return {
      prestacao: valorMaximoPrestacao,
      amortizacao: round2(saldoInicial),
    };
  }

  const prestacao = round2(prestacaoBase);
  const amortizacao = round2(prestacao - jurosPago);
  return { amortizacao, prestacao };
}

function calcularAmortizacaoAdicionalEfetiva(
  saldoInicial: number,
  amortizacao: number,
  valorAdicional: number
): number {
  if (valorAdicional <= 0) {
    return 0;
  }
  return round2(Math.min(valorAdicional, saldoInicial - amortizacao));
}

function recalcularBasesAposAmortizacaoAdicional(params: {
  metodo: MetodoAmortizacao;
  tipoAdicional: TipoAmortizacaoAdicional;
  saldoDevedor: number;
  taxaMensal: number;
  prestacaoAtual: number;
  mesesRestantesOriginais: number;
  amortizacaoBase: number;
  prestacaoBase: number;
}): { amortizacaoBase: number; prestacaoBase: number } {
  let { amortizacaoBase, prestacaoBase } = params;
  const { metodo, tipoAdicional, saldoDevedor, taxaMensal, prestacaoAtual, mesesRestantesOriginais } = params;

  if (saldoDevedor <= 0 || mesesRestantesOriginais <= 0) {
    return { amortizacaoBase, prestacaoBase };
  }

  // "Prazo" mode:
  // - PRICE: maintains base payment; term reduces naturally.
  // - SAC: tries to keep payment similar and reduce term.
  if (tipoAdicional === "prazo" && metodo === "sac") {
    const prestacaoAlvo = prestacaoAtual; // regular payment of the month (without additional)
    const denominador = prestacaoAlvo / saldoDevedor - taxaMensal;

    // If denominator <= 0, there is no finite term that maintains this payment (interest >= payment).
    if (denominador > 0) {
      const mesesCalculados = Math.ceil(1 / denominador);
      const mesesNovo = Math.max(1, Math.min(mesesCalculados, mesesRestantesOriginais));

      // Only apply if it actually reduces the term (term should never increase here).
      if (mesesNovo < mesesRestantesOriginais) {
        amortizacaoBase = round2(saldoDevedor / mesesNovo);
      }
    }
  }

  // "Parcela" mode: maintains original remaining term, recalculates amortization/payment
  // so the loan ends at the same time, but with smaller payments.
  if (tipoAdicional === "parcela") {
    if (metodo === "sac") {
      amortizacaoBase = round2(saldoDevedor / mesesRestantesOriginais);
    } else {
      prestacaoBase = round2(calcularPrestacaoPRICE(saldoDevedor, taxaMensal, mesesRestantesOriginais));
    }
  }

  return { amortizacaoBase, prestacaoBase };
}

/**
 * Recalculates loan considering additional amortizations
 * - Prazo: Reduces number of months (tries to keep payment "similar")
 * - Parcela: Maintains term, reduces payment amount
 */
export function recalcularComAmortizacoes(
  inputs: InputsFinanciamento,
  metodo: MetodoAmortizacao,
  amortizacoesAdicionais: AmortizacaoAdicional[]
): ResultadoComAdicionais {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses, correcaoAnualImovel } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = convertAnnualRateToMonthlyRate(taxaJurosAnual);
  const valorImovelInicial = valorEmprestimo;

  const amortizacoesMap = criarMapaAmortizacoesPorMes(amortizacoesAdicionais);

  // Calculate original result for comparison
  const resultadoOriginal = calcularFinanciamento(inputs, metodo);
  const tirMensalOriginal = resultadoOriginal.tirMensal ?? null;
  const tirAnualOriginal = resultadoOriginal.tirAnual ?? null;

  const parcelas: ParcelaComAdicional[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;
  let totalAmortizacoesAdicionais = 0;

  // When there is "parcela" type amortization, we may need to "force payoff" at target month
  // to avoid extending term due to rounding.
  // This target month represents CURRENT TERM (can decrease after "prazo" type amortizations),
  // and should never increase.
  const temAmortizacaoParcela = amortizacoesAdicionais.some((a) => a.tipo === "parcela" && a.valor > 0);
  let mesFinalAlvo = meses;

  // Calculation values that may change during the loop
  let amortizacaoBase = metodo === "sac" ? round2(valorFinanciado / meses) : 0;
  let prestacaoBase = metodo === "price" ? calcularPrestacaoPRICE(valorFinanciado, taxaMensal, meses) : 0;

  const maxMeses = meses * LIMITE_MULTIPLICADOR_MESES_RECALCULO;

  for (let mes = 1; mes <= maxMeses && saldoDevedor > SALDO_QUITADO_EPS; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);

    // Check if there is additional amortization this month BEFORE calculating base payment
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

    // If there is "parcela" type amortization, force payoff at target month to prevent extension due to rounding.
    const isUltimaParcelaAlvo = temAmortizacaoParcela && mes === mesFinalAlvo;

    const { amortizacao, prestacao } =
      metodo === "sac"
        ? calcularParcelaBaseSAC(saldoInicial, jurosPago, amortizacaoBase, isUltimaParcelaAlvo)
        : calcularParcelaBasePRICE(saldoInicial, jurosPago, prestacaoBase, isUltimaParcelaAlvo);

    // Apply additional amortization (cannot exceed balance)
    const amortizacaoAdicionalEfetiva = calcularAmortizacaoAdicionalEfetiva(saldoInicial, amortizacao, valorAdicional);

    saldoDevedor = round2(saldoInicial - amortizacao - amortizacaoAdicionalEfetiva);
    saldoDevedor = ajustarSaldoQuitado(saldoDevedor);

    totalJurosPagos = round2(totalJurosPagos + jurosPago);
    totalAmortizacoesAdicionais = round2(totalAmortizacoesAdicionais + amortizacaoAdicionalEfetiva);

    parcelas.push({
      mes,
      saldoInicial,
      jurosPago,
      amortizacao,
      prestacao,
      saldoDevedor,
      amortizacaoAdicional: amortizacaoAdicionalEfetiva,
      tipoAdicional,
    });

    // If there was additional amortization, recalculate parameters for next months
    if (amortizacaoAdicionalEfetiva > 0 && saldoDevedor > 0) {
      // Term reference for recalculation:
      // - "parcela": maintain CURRENT TERM (mesFinalAlvo), recalculating payment/amortization to fit in that time.
      // - "prazo": reduce term; we use current term as upper limit to ensure it never increases.
      const mesesRestantesReferencia = Math.max(1, mesFinalAlvo - mes);

      const novasBases = recalcularBasesAposAmortizacaoAdicional({
        metodo,
        tipoAdicional,
        saldoDevedor,
        taxaMensal,
        prestacaoAtual: prestacao,
        mesesRestantesOriginais: mesesRestantesReferencia,
        amortizacaoBase,
        prestacaoBase,
      });

      amortizacaoBase = novasBases.amortizacaoBase;
      prestacaoBase = novasBases.prestacaoBase;

      // If amortization was "prazo" type, current term decreases.
      // We update the "target month" based on updated plan (after base recalculation).
      if (tipoAdicional === "prazo") {
        const mesesRestantesProjetados = simularMesesRestantesNoPlanoAtual({
          metodo,
          saldoDevedor,
          taxaMensal,
          amortizacaoBase,
          prestacaoBase,
          maxMeses: maxMeses - mes,
        });

        if (mesesRestantesProjetados > 0) {
          mesFinalAlvo = Math.min(mesFinalAlvo, mes + mesesRestantesProjetados);
        }
      }
    }
  }

  const totalPagoComAdicionais = valorFinanciado + totalJurosPagos;

  const mesesComAdicionais = parcelas.length;
  const { valorFinal: valorImovelFinalComAdicionais } = calcularValorizacaoImovel(
    valorImovelInicial,
    mesesComAdicionais,
    correcaoAnualImovel
  );

  const { cashflows: cashflowsComAdicionais, totalAluguelRecebido: totalAluguelRecebidoComAdicionais } =
    calcularCashflowsComAdicionais(
      parcelas,
      valorEntrada,
      valorImovelFinalComAdicionais,
      inputs.aluguelMensal ?? 0,
      inputs.correcaoAnualAluguel ?? 0
    );

  const { tirMensal: tirMensalComAdicionais, tirAnual: tirAnualComAdicionais } = calcularTIR(cashflowsComAdicionais);

  return {
    valorFinanciado,
    totalJurosPagosOriginal: resultadoOriginal.totalJurosPagos,
    totalPagoOriginal: resultadoOriginal.totalPago,
    totalJurosPagosComAdicionais: totalJurosPagos,
    totalPagoComAdicionais,
    totalAmortizacoesAdicionais,
    mesesOriginais: meses,
    mesesComAdicionais,
    economiaJuros: resultadoOriginal.totalJurosPagos - totalJurosPagos,
    parcelas,
    tirMensalOriginal,
    tirAnualOriginal,
    tirMensalComAdicionais,
    tirAnualComAdicionais,
    totalAluguelRecebidoOriginal: resultadoOriginal.totalAluguelRecebido,
    totalAluguelRecebidoComAdicionais,
    cashflowsOriginal: resultadoOriginal.cashflows,
    cashflowsComAdicionais,
  };
}
