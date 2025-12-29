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

  // Criar mapa de amortizações adicionais por mês
  const amortizacoesMap = new Map<number, AmortizacaoAdicional>();
  for (const amort of amortizacoesAdicionais) {
    if (amort.valor > 0) {
      amortizacoesMap.set(amort.mes, amort);
    }
  }

  // Calcular resultado original para comparação
  const resultadoOriginal = calcularFinanciamento(inputs, metodo);
  const tirMensalOriginal = resultadoOriginal.tirMensal ?? null;
  const tirAnualOriginal = resultadoOriginal.tirAnual ?? null;

  const parcelas: ParcelaComAdicional[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;
  let totalAmortizacoesAdicionais = 0;
  let mes = 1;

  // Verificar se há alguma amortização do tipo "parcela"
  const temAmortizacaoParcela = amortizacoesAdicionais.some((a) => a.tipo === "parcela" && a.valor > 0);

  // Valores de cálculo que podem mudar durante o loop
  let amortizacaoBase = metodo === "sac" ? round2(valorFinanciado / meses) : 0;
  let prestacaoBase = metodo === "price" ? calcularPrestacaoPRICE(valorFinanciado, taxaMensal, meses) : 0;

  while (saldoDevedor > 0.01 && mes <= meses * 2) {
    // Safety limit
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);

    let amortizacao: number;
    let prestacao: number;

    // Verificar se há amortização adicional neste mês ANTES de calcular a parcela
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

    // Se houver amortizações tipo "parcela", forçar quitação na última parcela do prazo original
    // para evitar que o financiamento se estenda devido a arredondamentos
    const isUltimaParcelaOriginal = mes === meses && temAmortizacaoParcela;

    if (metodo === "sac") {
      // Para SAC, se for a última parcela original e houver amortização tipo "parcela",
      // quitar o saldo remanescente
      if (isUltimaParcelaOriginal) {
        amortizacao = round2(saldoInicial);
        prestacao = round2(amortizacao + jurosPago);
      } else {
        amortizacao = round2(Math.min(amortizacaoBase, saldoInicial));
        prestacao = round2(amortizacao + jurosPago);
      }
    } else {
      // PRICE
      // Mantém a prestação constante (prestacaoBase) durante todo o período,
      // exceto na parcela final de quitação, que pode ser menor.
      const valorMaximoPrestacao = round2(saldoInicial + jurosPago);
      const isParcelaFinal = prestacaoBase >= valorMaximoPrestacao - 0.005 || isUltimaParcelaOriginal;

      if (isParcelaFinal) {
        // Parcela final: quita o saldo remanescente
        prestacao = valorMaximoPrestacao;
        amortizacao = round2(saldoInicial);
      } else {
        // Parcela normal: usa sempre a prestação base
        prestacao = round2(prestacaoBase);
        amortizacao = round2(prestacao - jurosPago);
      }
    }

    // Aplicar amortização adicional (não pode exceder o saldo)
    const amortizacaoAdicionalEfetiva = round2(Math.min(valorAdicional, saldoInicial - amortizacao));

    saldoDevedor = round2(saldoInicial - amortizacao - amortizacaoAdicionalEfetiva);

    if (saldoDevedor < 0.01) {
      saldoDevedor = 0;
    }

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

      // Modo "Prazo":
      // - PRICE: mantém a prestação base (prestacaoBase) constante; o prazo reduz naturalmente.
      // - SAC: o comportamento esperado (bancos) geralmente é manter a prestação “parecida”
      //   e reduzir mais o prazo. Para isso, recalculamos a amortização constante (SAC) para que
      //   a próxima prestação fique próxima da prestação atual (antes do adicional),
      //   o que implica menos meses restantes.
      if (tipoAdicional === "prazo" && metodo === "sac" && mesesRestantesOriginais > 0) {
        const prestacaoAlvo = prestacao; // prestação regular do mês (sem o adicional)
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
        if (mesesRestantesOriginais > 0 && saldoDevedor > 0) {
          if (metodo === "sac") {
            amortizacaoBase = round2(saldoDevedor / mesesRestantesOriginais);
          } else {
            // PRICE: recalcula prestação para o saldo restante
            prestacaoBase = round2(calcularPrestacaoPRICE(saldoDevedor, taxaMensal, mesesRestantesOriginais));
          }
        }
      }
    }

    mes++;

    // Segurança: se chegou no mês original e ainda não acabou (modo parcela), continuar
    if (mes > meses && saldoDevedor <= 0.01) {
      break;
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
