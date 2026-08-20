import {
  calcularFinanciamento,
  type MetodoAmortizacao,
  type ResultadoFinanciamento,
} from "./financiamento";
import { round2 } from "../utils";

export const FINANCIAR_OU_JUNTAR_SUPPORTED_STATE_VERSION = "1";
export const FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE = 1e-12;

export interface FinanciarOuJuntarDinheiroInputs {
  valorImovel: number;
  capitalInicial: number;
  metodo: MetodoAmortizacao;
  taxaFinanciamentoAnual: number;
  prazoFinanciamentoMeses: number;
  valorizacaoAnualImovel: number;
  aporteMensalLiquido: number;
  rendimentoAnualInvestimento: number;
  aluguelMensalInicial: number;
  crescimentoAnualAluguel: number;
  horizonteMeses: number;
}

export type FinanciarOuJuntarValidationError =
  | "valorImovel"
  | "capitalInicial"
  | "metodo"
  | "taxaFinanciamentoAnual"
  | "prazoFinanciamentoMeses"
  | "valorizacaoAnualImovel"
  | "aporteMensalLiquido"
  | "rendimentoAnualInvestimento"
  | "aluguelMensalInicial"
  | "crescimentoAnualAluguel"
  | "horizonteMeses";

export type StatusCompraAVista =
  | "already-affordable"
  | "reached-within-horizon"
  | "not-reached-within-horizon"
  | "never-reached-under-assumptions";

export interface ResumoFinanciamentoAgora {
  necessario: boolean;
  valorFinanciado: number;
  metodo: MetodoAmortizacao;
  prazoMeses: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
  totalJuros: number;
  somaPrestacoes: number;
  desembolsoTotalAquisicao: number;
  valorImovelFimPrazo: number;
}

export interface LinhaProjecaoCompraAVista {
  mes: number;
  saldoInvestido: number;
  precoImovel: number;
  aluguelDoMes: number;
  aluguelAcumulado: number;
  falta: number;
  sobra: number;
}

export interface ResumoEsperaCompraAVista {
  status: StatusCompraAVista;
  primeiroMesAcessivel: number | null;
  saldoNoHorizonte: number;
  precoNoHorizonte: number;
  faltaNoHorizonte: number;
  sobraNoHorizonte: number;
  aluguelAcumuladoConsiderado: number;
  aluguelPrimeiroMes: number;
  aluguelFinalConsiderado: number;
  mesFinalConsiderado: number;
  linhaDoTempo: LinhaProjecaoCompraAVista[];
}

export interface ResultadoFinanciarOuJuntarDinheiro {
  financeNow: ResumoFinanciamentoAgora;
  waitForCash: ResumoEsperaCompraAVista;
}

export function getDefaultFinanciarOuJuntarDinheiroInputs(): FinanciarOuJuntarDinheiroInputs {
  return {
    valorImovel: 500000,
    capitalInicial: 100000,
    metodo: "sac",
    taxaFinanciamentoAnual: 10,
    prazoFinanciamentoMeses: 360,
    valorizacaoAnualImovel: 5,
    aporteMensalLiquido: 3000,
    rendimentoAnualInvestimento: 8,
    aluguelMensalInicial: 2500,
    crescimentoAnualAluguel: 5,
    horizonteMeses: 360,
  };
}

function isFiniteNonNegative(value: number, maximum: number): boolean {
  return Number.isFinite(value) && !Object.is(value, -0) && value >= 0 && value <= maximum;
}

function isWholeMonths(value: number, maximum: number): boolean {
  return Number.isInteger(value) && !Object.is(value, -0) && value >= 1 && value <= maximum;
}

export function validateFinanciarOuJuntarDinheiroInputs(
  inputs: FinanciarOuJuntarDinheiroInputs
): FinanciarOuJuntarValidationError[] {
  const errors: FinanciarOuJuntarValidationError[] = [];

  if (!Number.isFinite(inputs.valorImovel) || Object.is(inputs.valorImovel, -0) || inputs.valorImovel <= 0 || inputs.valorImovel > 1e12) {
    errors.push("valorImovel");
  }
  if (
    !isFiniteNonNegative(inputs.capitalInicial, 1e12) ||
    (Number.isFinite(inputs.valorImovel) && inputs.capitalInicial > inputs.valorImovel)
  ) {
    errors.push("capitalInicial");
  }
  if (inputs.metodo !== "sac" && inputs.metodo !== "price") errors.push("metodo");
  if (!isFiniteNonNegative(inputs.taxaFinanciamentoAnual, 100)) errors.push("taxaFinanciamentoAnual");
  if (!isWholeMonths(inputs.prazoFinanciamentoMeses, 600)) errors.push("prazoFinanciamentoMeses");
  if (!isFiniteNonNegative(inputs.valorizacaoAnualImovel, 50)) errors.push("valorizacaoAnualImovel");
  if (!isFiniteNonNegative(inputs.aporteMensalLiquido, 1e9)) errors.push("aporteMensalLiquido");
  if (!isFiniteNonNegative(inputs.rendimentoAnualInvestimento, 100)) {
    errors.push("rendimentoAnualInvestimento");
  }
  if (!isFiniteNonNegative(inputs.aluguelMensalInicial, 1e9)) errors.push("aluguelMensalInicial");
  if (!isFiniteNonNegative(inputs.crescimentoAnualAluguel, 50)) errors.push("crescimentoAnualAluguel");
  if (!isWholeMonths(inputs.horizonteMeses, 1200)) errors.push("horizonteMeses");

  return errors;
}

function annualEffectiveFactor(rate: number): number {
  return Math.pow(1 + rate / 100, 1 / 12);
}

/** Closed-form oracle for S_m = S_(m-1) * I + A, with A deposited at month-end. */
export function calcularSaldoInvestidoFechado(
  capitalInicial: number,
  aporteMensalLiquido: number,
  fatorRendimentoMensal: number,
  mes: number
): number {
  if (fatorRendimentoMensal === 1) {
    return capitalInicial + mes * aporteMensalLiquido;
  }

  const potencia = Math.pow(fatorRendimentoMensal, mes);
  return (
    capitalInicial * potencia +
    aporteMensalLiquido * ((potencia - 1) / (fatorRendimentoMensal - 1))
  );
}

function saldoAtingiuLimiar(params: {
  capitalInicial: number;
  aporteMensal: number;
  fatorRendimento: number;
  mes: number;
  limiar: number;
}): boolean | null {
  const { capitalInicial, aporteMensal, fatorRendimento, mes, limiar } = params;

  if (limiar <= 0) {
    return true;
  }

  if (fatorRendimento === 1) {
    const saldo = capitalInicial + mes * aporteMensal;
    return Number.isFinite(saldo) ? saldo >= limiar : null;
  }

  const baseAportes = aporteMensal / (fatorRendimento - 1);
  const capitalEquivalente = capitalInicial + baseAportes;
  const alvoEquivalente = limiar + baseAportes;
  if (capitalEquivalente <= 0 || alvoEquivalente <= 0) return null;

  const diferencaLogs = Math.log(capitalEquivalente) + mes * Math.log(fatorRendimento) - Math.log(alvoEquivalente);
  return Number.isFinite(diferencaLogs) ? diferencaLogs >= 0 : null;
}

function razaoSaldoPreco(params: {
  capitalInicial: number;
  aporteMensal: number;
  fatorRendimento: number;
  valorImovel: number;
  fatorValorizacao: number;
  mes: number;
}): number | null {
  const { capitalInicial, aporteMensal, fatorRendimento, valorImovel, fatorValorizacao, mes } = params;
  let ratio: number;

  if (fatorRendimento === 1) {
    ratio = ((capitalInicial + mes * aporteMensal) / valorImovel) * Math.pow(fatorValorizacao, -mes);
  } else {
    const baseAportes = aporteMensal / (fatorRendimento - 1);
    ratio =
      ((capitalInicial + baseAportes) * Math.pow(fatorRendimento / fatorValorizacao, mes) -
        baseAportes * Math.pow(fatorValorizacao, -mes)) /
      valorImovel;
  }

  return Number.isFinite(ratio) ? Math.max(0, ratio) : null;
}

function provarNuncaAtingeSobPremissas(
  inputs: FinanciarOuJuntarDinheiroInputs,
  fatorRendimento: number,
  fatorValorizacao: number
): boolean {
  const C = inputs.capitalInicial;
  const A = inputs.aporteMensalLiquido;
  const V = inputs.valorImovel;
  const H = inputs.horizonteMeses;

  if (C === 0 && A === 0) return true;
  if (fatorValorizacao < fatorRendimento) return false;

  if (fatorValorizacao === fatorRendimento) {
    if (fatorRendimento === 1) {
      return A === 0 && C / V < 1 - FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE;
    }

    const limiteRazao = (C + A / (fatorRendimento - 1)) / V;
    return Number.isFinite(limiteRazao) && limiteRazao < 1 - FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE;
  }

  // G > I: q_m is unimodal. Its future maximum occurs at the first m >= H
  // for which S_m >= A / (G - I). Ambiguous or non-finite cases deliberately
  // fall back to "not reached within the horizon" instead of asserting never.
  const limiar = A / (fatorValorizacao - fatorRendimento);
  let turningMonth = H;
  const atH = saldoAtingiuLimiar({
    capitalInicial: C,
    aporteMensal: A,
    fatorRendimento,
    mes: H,
    limiar,
  });
  if (atH === null) return false;

  if (!atH) {
    let estimate: number;
    if (fatorRendimento === 1) {
      if (A === 0) return false;
      estimate = Math.ceil((limiar - C) / A);
    } else {
      const baseAportes = A / (fatorRendimento - 1);
      const numerator = limiar + baseAportes;
      const denominator = C + baseAportes;
      if (numerator <= 0 || denominator <= 0) return false;
      estimate = Math.ceil(Math.log(numerator / denominator) / Math.log(fatorRendimento));
    }

    if (!Number.isSafeInteger(estimate) || estimate > Number.MAX_SAFE_INTEGER - 2) return false;
    turningMonth = Math.max(H, estimate);
  }

  // Correct the inverse result against the exact threshold predicate. A valid
  // inverse can differ only by adjacent integers because of floating-point logs.
  for (let correction = 0; correction < 4 && turningMonth > H; correction++) {
    const previousReached = saldoAtingiuLimiar({
      capitalInicial: C,
      aporteMensal: A,
      fatorRendimento,
      mes: turningMonth - 1,
      limiar,
    });
    if (previousReached !== true) break;
    turningMonth--;
  }
  for (let correction = 0; correction < 4; correction++) {
    const reached = saldoAtingiuLimiar({
      capitalInicial: C,
      aporteMensal: A,
      fatorRendimento,
      mes: turningMonth,
      limiar,
    });
    if (reached === null) return false;
    if (reached) break;
    turningMonth++;
  }

  const thresholdAtTurning = saldoAtingiuLimiar({
    capitalInicial: C,
    aporteMensal: A,
    fatorRendimento,
    mes: turningMonth,
    limiar,
  });
  if (thresholdAtTurning !== true || !Number.isSafeInteger(turningMonth + 1)) return false;

  const candidateMonths = Array.from(
    new Set([Math.max(H, turningMonth - 1), turningMonth, turningMonth + 1])
  );
  const candidateRatios = candidateMonths.map((mes) =>
    razaoSaldoPreco({
      capitalInicial: C,
      aporteMensal: A,
      fatorRendimento,
      valorImovel: V,
      fatorValorizacao,
      mes,
    })
  );
  if (candidateRatios.some((ratio) => ratio === null)) return false;

  return Math.max(...(candidateRatios as number[])) < 1 - FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE;
}

function adaptarFinanciamento(
  inputs: FinanciarOuJuntarDinheiroInputs,
  resultado: ResultadoFinanciamento | null,
  fatorValorizacao: number
): ResumoFinanciamentoAgora {
  if (!resultado) {
    return {
      necessario: false,
      valorFinanciado: 0,
      metodo: inputs.metodo,
      prazoMeses: inputs.prazoFinanciamentoMeses,
      primeiraPrestacao: 0,
      ultimaPrestacao: 0,
      totalJuros: 0,
      somaPrestacoes: 0,
      desembolsoTotalAquisicao: inputs.valorImovel,
      valorImovelFimPrazo: round2(
        inputs.valorImovel * Math.pow(fatorValorizacao, inputs.prazoFinanciamentoMeses)
      ),
    };
  }

  const somaPrestacoes = round2(
    resultado.parcelas.reduce((total, parcela) => total + parcela.prestacao, 0)
  );
  return {
    necessario: true,
    valorFinanciado: resultado.valorFinanciado,
    metodo: inputs.metodo,
    prazoMeses: inputs.prazoFinanciamentoMeses,
    primeiraPrestacao: resultado.primeiraPrestacao,
    ultimaPrestacao: resultado.ultimaPrestacao,
    totalJuros: resultado.totalJurosPagos,
    somaPrestacoes,
    desembolsoTotalAquisicao: round2(inputs.capitalInicial + somaPrestacoes),
    valorImovelFimPrazo: resultado.valorImovelFinal,
  };
}

export function calcularFinanciarOuJuntarDinheiro(
  inputs: FinanciarOuJuntarDinheiroInputs
): ResultadoFinanciarOuJuntarDinheiro {
  const errors = validateFinanciarOuJuntarDinheiroInputs(inputs);
  if (errors.length > 0) {
    throw new RangeError(`Invalid financiar-ou-juntar-dinheiro inputs: ${errors.join(", ")}`);
  }

  const fatorRendimento = annualEffectiveFactor(inputs.rendimentoAnualInvestimento);
  const fatorValorizacao = annualEffectiveFactor(inputs.valorizacaoAnualImovel);
  const fatorAluguel = annualEffectiveFactor(inputs.crescimentoAnualAluguel);
  const alreadyAffordable = inputs.capitalInicial >= inputs.valorImovel;

  const financiamentoCompartilhado = alreadyAffordable
    ? null
    : calcularFinanciamento(
        {
          valorEmprestimo: inputs.valorImovel,
          valorEntrada: inputs.capitalInicial,
          taxaJurosAnual: inputs.taxaFinanciamentoAnual,
          meses: inputs.prazoFinanciamentoMeses,
          correcaoAnualImovel: inputs.valorizacaoAnualImovel,
        },
        inputs.metodo
      );

  let saldo = inputs.capitalInicial;
  let preco = inputs.valorImovel;
  let aluguelAcumulado = 0;
  let primeiroMesAcessivel: number | null = alreadyAffordable ? 0 : null;
  const monthlyRows: LinhaProjecaoCompraAVista[] = [
    {
      mes: 0,
      saldoInvestido: saldo,
      precoImovel: preco,
      aluguelDoMes: 0,
      aluguelAcumulado: 0,
      falta: Math.max(preco - saldo, 0),
      sobra: Math.max(saldo - preco, 0),
    },
  ];

  for (let mes = 1; mes <= inputs.horizonteMeses; mes++) {
    saldo = saldo * fatorRendimento + inputs.aporteMensalLiquido;
    preco *= fatorValorizacao;

    let aluguelDoMes = 0;
    if (primeiroMesAcessivel === null) {
      aluguelDoMes = inputs.aluguelMensalInicial * Math.pow(fatorAluguel, mes - 1);
      aluguelAcumulado += aluguelDoMes;
      if (saldo >= preco) {
        primeiroMesAcessivel = mes;
      }
    }

    const row: LinhaProjecaoCompraAVista = {
      mes,
      saldoInvestido: saldo,
      precoImovel: preco,
      aluguelDoMes,
      aluguelAcumulado,
      falta: Math.max(preco - saldo, 0),
      sobra: Math.max(saldo - preco, 0),
    };
    const isCrossingRow = primeiroMesAcessivel === mes;
    if (mes % 12 === 0 || mes === inputs.horizonteMeses || isCrossingRow) monthlyRows.push(row);
  }

  const status: StatusCompraAVista = alreadyAffordable
    ? "already-affordable"
    : primeiroMesAcessivel !== null
      ? "reached-within-horizon"
      : provarNuncaAtingeSobPremissas(inputs, fatorRendimento, fatorValorizacao)
        ? "never-reached-under-assumptions"
        : "not-reached-within-horizon";
  const mesFinalConsiderado = primeiroMesAcessivel ?? inputs.horizonteMeses;
  const aluguelFinalConsiderado =
    mesFinalConsiderado === 0
      ? 0
      : inputs.aluguelMensalInicial * Math.pow(fatorAluguel, mesFinalConsiderado - 1);

  return {
    financeNow: adaptarFinanciamento(inputs, financiamentoCompartilhado, fatorValorizacao),
    waitForCash: {
      status,
      primeiroMesAcessivel,
      saldoNoHorizonte: saldo,
      precoNoHorizonte: preco,
      faltaNoHorizonte: Math.max(preco - saldo, 0),
      sobraNoHorizonte: Math.max(saldo - preco, 0),
      aluguelAcumuladoConsiderado: aluguelAcumulado,
      aluguelPrimeiroMes: inputs.aluguelMensalInicial,
      aluguelFinalConsiderado,
      mesFinalConsiderado,
      linhaDoTempo: monthlyRows.sort((a, b) => a.mes - b.mes),
    },
  };
}
