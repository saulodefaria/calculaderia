export interface InputsFinanciamento {
  valorEmprestimo: number;
  valorEntrada: number;
  taxaJurosAnual: number;
  meses: number;
}

export interface Parcela {
  mes: number;
  saldoInicial: number;
  jurosPago: number;
  amortizacao: number;
  prestacao: number;
  saldoDevedor: number;
}

export interface ResultadoFinanciamento {
  valorFinanciado: number;
  totalJurosPagos: number;
  totalPago: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
  parcelas: Parcela[];
}

export type MetodoAmortizacao = "sac" | "price";

/**
 * Calcula financiamento usando o Sistema de Amortização Constante (SAC)
 * - Amortização é constante
 * - Prestações são decrescentes
 */
export function calcularSAC(inputs: InputsFinanciamento): ResultadoFinanciamento {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = taxaJurosAnual / 100 / 12;
  const amortizacaoConstante = valorFinanciado / meses;

  const parcelas: Parcela[] = [];
  let saldoDevedor = valorFinanciado;
  let totalJurosPagos = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = saldoInicial * taxaMensal;
    const amortizacao = amortizacaoConstante;
    const prestacao = amortizacao + jurosPago;
    saldoDevedor = saldoInicial - amortizacao;

    // Evita saldo negativo por erros de ponto flutuante
    if (saldoDevedor < 0.01) {
      saldoDevedor = 0;
    }

    totalJurosPagos += jurosPago;

    parcelas.push({
      mes,
      saldoInicial,
      jurosPago,
      amortizacao,
      prestacao,
      saldoDevedor,
    });
  }

  return {
    valorFinanciado,
    totalJurosPagos,
    totalPago: valorFinanciado + totalJurosPagos,
    primeiraPrestacao: parcelas[0]?.prestacao ?? 0,
    ultimaPrestacao: parcelas[parcelas.length - 1]?.prestacao ?? 0,
    parcelas,
  };
}

/**
 * Calcula financiamento usando a Tabela PRICE (Sistema Francês de Amortização)
 * - Prestações são constantes
 * - Amortização é crescente
 */
export function calcularPRICE(inputs: InputsFinanciamento): ResultadoFinanciamento {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = taxaJurosAnual / 100 / 12;

  // Fórmula PRICE: PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
  const fator = Math.pow(1 + taxaMensal, meses);
  const prestacaoConstante = valorFinanciado * ((taxaMensal * fator) / (fator - 1));

  const parcelas: Parcela[] = [];
  let saldoDevedor = valorFinanciado;
  let totalJurosPagos = 0;

  for (let mes = 1; mes <= meses; mes++) {
    const saldoInicial = saldoDevedor;
    const jurosPago = saldoInicial * taxaMensal;
    const amortizacao = prestacaoConstante - jurosPago;
    const prestacao = prestacaoConstante;
    saldoDevedor = saldoInicial - amortizacao;

    // Evita saldo negativo por erros de ponto flutuante
    if (saldoDevedor < 0.01) {
      saldoDevedor = 0;
    }

    totalJurosPagos += jurosPago;

    parcelas.push({
      mes,
      saldoInicial,
      jurosPago,
      amortizacao,
      prestacao,
      saldoDevedor,
    });
  }

  return {
    valorFinanciado,
    totalJurosPagos,
    totalPago: valorFinanciado + totalJurosPagos,
    primeiraPrestacao: parcelas[0]?.prestacao ?? 0,
    ultimaPrestacao: parcelas[parcelas.length - 1]?.prestacao ?? 0,
    parcelas,
  };
}

export function calcularFinanciamento(inputs: InputsFinanciamento, metodo: MetodoAmortizacao): ResultadoFinanciamento {
  if (metodo === "sac") {
    return calcularSAC(inputs);
  }
  return calcularPRICE(inputs);
}
