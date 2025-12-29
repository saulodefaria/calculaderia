import { round2, calculateIrr, irrMonthlyToAnnual, getAluguelCorrigidoNoMes } from "../utils";
import { convertAnnualRateToMonthlyRate } from "../utils/math";

export interface InputsFinanciamento {
  valorEmprestimo: number;
  valorEntrada: number;
  taxaJurosAnual: number;
  meses: number;
  /**
   * Índice anual de valorização do imóvel (ex: 6 = 6% a.a.).
   * Usado apenas para cálculo de TIR, não altera as parcelas.
   */
  correcaoAnualImovel: number;
  /**
   * Aluguel mensal recebido ao alugar o imóvel (opcional).
   * Usado no cálculo da TIR como receita que reduz a saída mensal.
   */
  aluguelMensal?: number;
  /**
   * Correção anual do aluguel (ex: 6 = 6% a.a. - IGPM).
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
  /** Valor do imóvel (antes da entrada) usado para projetar a valorização. */
  valorImovelInicial: number;
  /** Valor futuro estimado do imóvel ao final do prazo considerado. */
  valorImovelFinal: number;
  totalJurosPagos: number;
  totalPago: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
  parcelas: Parcela[];
  /** TIR mensal considerando entrada + prestações como saídas e imóvel final como entrada. */
  tirMensal?: number | null;
  /** TIR anual equivalente à TIR mensal. */
  tirAnual?: number | null;
  /** Total de aluguel recebido ao longo do financiamento (usado para display). */
  totalAluguelRecebido?: number;
  /** Fluxos de caixa usados para cálculo da TIR. */
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
  // TIR do cenário original (sem amortizações adicionais)
  tirMensalOriginal?: number | null;
  tirAnualOriginal?: number | null;
  // TIR do cenário com amortizações adicionais
  tirMensalComAdicionais?: number | null;
  tirAnualComAdicionais?: number | null;
  /** Total de aluguel recebido no cenário original. */
  totalAluguelRecebidoOriginal?: number;
  /** Total de aluguel recebido no cenário com amortizações. */
  totalAluguelRecebidoComAdicionais?: number;
  /** Fluxos de caixa do cenário original. */
  cashflowsOriginal?: number[];
  /** Fluxos de caixa do cenário com amortizações adicionais. */
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
 * Calcula o valor futuro do imóvel considerando a valorização anual.
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
 * Calcula os fluxos de caixa mensais para o cálculo da TIR.
 * Retorna os cashflows e o total de aluguel recebido.
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

    // Cashflow líquido do mês: aluguel recebido - prestação
    const fluxoLiquido = round2(aluguelRecebido - parcela.prestacao);
    cashflows.push(fluxoLiquido);
  }

  // Inclui a entrada como saída no primeiro mês
  if (valorEntrada > 0 && cashflows.length > 0) {
    cashflows[0] -= valorEntrada;
  }

  // Adiciona o valor futuro estimado do imóvel no último mês
  if (cashflows.length > 0) {
    cashflows[cashflows.length - 1] += valorImovelFinal;
  }

  return { cashflows, totalAluguelRecebido };
}

/**
 * Calcula os fluxos de caixa para parcelas com amortizações adicionais.
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

    // Cashflow líquido do mês: aluguel recebido - (prestação + adicional)
    const fluxoLiquido = round2(aluguelRecebido - pagamento);
    cashflows.push(fluxoLiquido);
  }

  // Inclui a entrada como saída no primeiro mês
  if (valorEntrada > 0 && cashflows.length > 0) {
    cashflows[0] -= valorEntrada;
  }

  // Adiciona o valor futuro estimado do imóvel no último mês
  if (cashflows.length > 0) {
    cashflows[cashflows.length - 1] += valorImovelFinal;
  }

  return { cashflows, totalAluguelRecebido };
}

/**
 * Calcula a TIR mensal e anual a partir dos fluxos de caixa.
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
    tirAnual: irrMonthlyToAnnual(irr),
  };
}

/**
 * Calcula a TIR completa (valorização + cashflows + TIR).
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
 * Calcula a prestação constante usando a fórmula PRICE.
 * PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calcularPrestacaoPRICE(valorFinanciado: number, taxaMensal: number, meses: number): number {
  const fator = Math.pow(1 + taxaMensal, meses);
  return valorFinanciado * ((taxaMensal * fator) / (fator - 1));
}

/**
 * Calcula o cronograma de amortização usando SAC (Sistema de Amortização Constante).
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
    const amortizacao = round2(amortizacaoConstante);
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
    const amortizacao = round2(prestacaoConstante - jurosPago);
    const prestacao = round2(prestacaoConstante);
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
 * Calcula financiamento usando o Sistema de Amortização Constante (SAC)
 * - Amortização é constante
 * - Prestações são decrescentes
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
 * Calcula financiamento usando a Tabela PRICE (Sistema Francês de Amortização)
 * - Prestações são constantes
 * - Amortização é crescente
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
// Recalcular com amortizações adicionais (helpers)
// ================================

const SALDO_QUITADO_EPS = 0.01;
const LIMITE_MULTIPLICADOR_MESES_RECALCULO = 2;
const TOLERANCIA_PARCELA_FINAL_PRICE = 0.005;

function ajustarSaldoQuitado(saldoDevedor: number): number {
  return saldoDevedor < SALDO_QUITADO_EPS ? 0 : saldoDevedor;
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

  // Modo "Prazo":
  // - PRICE: mantém a prestação base; o prazo reduz naturalmente.
  // - SAC: tenta manter a prestação parecida e reduzir o prazo.
  if (tipoAdicional === "prazo" && metodo === "sac") {
    const prestacaoAlvo = prestacaoAtual; // prestação regular do mês (sem o adicional)
    const denominador = prestacaoAlvo / saldoDevedor - taxaMensal;

    // Se o denominador <= 0, não existe prazo finito que mantenha essa prestação (juros >= prestação).
    if (denominador > 0) {
      const mesesCalculados = Math.ceil(1 / denominador);
      const mesesNovo = Math.max(1, Math.min(mesesCalculados, mesesRestantesOriginais));

      // Só aplica se realmente reduzir o prazo (prazo nunca deve aumentar aqui).
      if (mesesNovo < mesesRestantesOriginais) {
        amortizacaoBase = round2(saldoDevedor / mesesNovo);
      }
    }
  }

  // Modo "Parcela": mantém o prazo original restante, recalcula amortização/prestação
  // para que o financiamento termine no mesmo tempo, mas com parcelas menores.
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
 * Recalcula o financiamento considerando amortizações adicionais
 * - Prazo: Reduz o número de meses (tenta manter a prestação “parecida”)
 * - Parcela: Mantém o prazo, reduz o valor das parcelas
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

  // Calcular resultado original para comparação
  const resultadoOriginal = calcularFinanciamento(inputs, metodo);
  const tirMensalOriginal = resultadoOriginal.tirMensal ?? null;
  const tirAnualOriginal = resultadoOriginal.tirAnual ?? null;

  const parcelas: ParcelaComAdicional[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;
  let totalAmortizacoesAdicionais = 0;

  // Verificar se há alguma amortização do tipo "parcela"
  const temAmortizacaoParcela = amortizacoesAdicionais.some((a) => a.tipo === "parcela" && a.valor > 0);

  // Valores de cálculo que podem mudar durante o loop
  let amortizacaoBase = metodo === "sac" ? round2(valorFinanciado / meses) : 0;
  let prestacaoBase = metodo === "price" ? calcularPrestacaoPRICE(valorFinanciado, taxaMensal, meses) : 0;

  const maxMeses = meses * LIMITE_MULTIPLICADOR_MESES_RECALCULO;

  for (let mes = 1; mes <= maxMeses && saldoDevedor > SALDO_QUITADO_EPS; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);

    // Verificar se há amortização adicional neste mês ANTES de calcular a parcela base
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

    // Se houver amortizações tipo "parcela", forçar quitação na última parcela do prazo original
    // para evitar que o financiamento se estenda devido a arredondamentos.
    const isUltimaParcelaOriginal = mes === meses && temAmortizacaoParcela;

    const { amortizacao, prestacao } =
      metodo === "sac"
        ? calcularParcelaBaseSAC(saldoInicial, jurosPago, amortizacaoBase, isUltimaParcelaOriginal)
        : calcularParcelaBasePRICE(saldoInicial, jurosPago, prestacaoBase, isUltimaParcelaOriginal);

    // Aplicar amortização adicional (não pode exceder o saldo)
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

    // Se houve amortização adicional, recalcular parâmetros para próximos meses
    if (amortizacaoAdicionalEfetiva > 0 && saldoDevedor > 0) {
      const mesesRestantesOriginais = meses - mes;
      const novasBases = recalcularBasesAposAmortizacaoAdicional({
        metodo,
        tipoAdicional,
        saldoDevedor,
        taxaMensal,
        prestacaoAtual: prestacao,
        mesesRestantesOriginais,
        amortizacaoBase,
        prestacaoBase,
      });

      amortizacaoBase = novasBases.amortizacaoBase;
      prestacaoBase = novasBases.prestacaoBase;
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
