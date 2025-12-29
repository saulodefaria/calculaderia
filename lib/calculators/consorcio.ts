import { round2, calculateIrr, getAluguelCorrigidoNoMes } from "../utils";
import { convertMonthlyRateToAnnualRate } from "../utils/math";

export interface InputsConsorcio {
  valorBem: number;
  meses: number;
  taxaAdministracaoTotal: number; // Percentual total (ex: 15%)
  correcaoAnual: number; // Percentual anual de correção (ex: 6%)
  // Ágio opcional - valor pago para comprar carta já contemplada
  agio?: number;
  // Lance opcional - reduz o prazo (tipo "prazo")
  lance?: {
    mes: number; // Mês em que o lance será pago
    valor: number; // Valor do lance
  };
  // Contemplação - mês em que recebe a carta de crédito (mesmo sem lance)
  mesContemplacao?: number; // default 1
  // Aluguel mensal recebido (ao alugar o imóvel)
  aluguelMensal?: number; // valor do aluguel no mês 1 (default 0)
  correcaoAnualAluguel?: number; // correção anual do aluguel - IGPM (default 0)
}

export interface ParcelaConsorcio {
  mes: number;
  fundoComum: number;
  taxaAdministracao: number;
  parcela: number;
  saldoDevedor: number;
  correcaoAplicada: number; // 0 se não houver correção no mês, senão o percentual aplicado
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
  totalPago: number; // Inclui ágio se houver
  agio: number; // Valor do ágio pago (0 se não houver)
  parcelas: ParcelaConsorcio[];
  // TIR considerando:
  // - Cada parcela (fundo comum + taxa adm.) como saída mensal
  // - Valor final corrigido do bem como entrada positiva no último mês
  tirMensal?: number | null;
  tirAnual?: number | null;
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
  // TIR do cenário original (sem amortizações adicionais)
  tirMensalOriginal?: number | null;
  tirAnualOriginal?: number | null;
  // TIR do cenário com amortizações adicionais
  tirMensalComAdicionais?: number | null;
  tirAnualComAdicionais?: number | null;
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

type TirResultado = { tirMensal: number | null; tirAnual: number | null };

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
    // Taxa proporcional ao fundo comum, mantendo a razão dos saldos
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

  // O adicional abate os saldos proporcionalmente, após pagar a parcela do mês
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

  // Adiciona o valor final do bem no último mês (entrada)
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
  if (cashflows.length === 0) return { tirMensal: null, tirAnual: null };

  const irr = calculateIrr(cashflows);
  if (irr !== null && Number.isFinite(irr)) {
    return { tirMensal: irr, tirAnual: convertMonthlyRateToAnnualRate(irr) };
  }

  return { tirMensal: null, tirAnual: null };
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

  // Se não há lance, usa a lógica original simplificada
  if (!lance || lance.valor <= 0) {
    return calcularConsorcioSemLance(inputs);
  }

  // Com lance: usa lógica similar ao recalcularConsorcioComAmortizacoes
  const parcelas: ParcelaConsorcio[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;

  // Ágio (valor pago para comprar carta já contemplada)
  const agio = inputs.agio || 0;

  // Valor do bem atual (será corrigido anualmente)
  let valorBemAtual = valorBem;

  // Saldos iniciais (fundo comum e taxa são controlados separadamente para o lance)
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Divisor do fundo comum (fixo em 'meses' para modo prazo)
  const mesesFundoComum = meses;

  let mesAtual = 1;

  // Loop até quitar ambos os saldos ou atingir limite de segurança
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

    // Verificar se é o mês do lance
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
      parcela: parcelaFinal, // Inclui o lance e agio (se aplicável) na parcela do mês
      saldoDevedor: saldoDevedorFundo,
      correcaoAplicada,
      anoCorrente,
    });

    mesAtual++;
    if (saldoDevedorTotal <= EPSILON) break;
  }

  const totalPagoComAgio = round2(totalPago);

  // Parâmetros de aluguel (opcional)
  const mesContemplacao = inputs.mesContemplacao ?? inputs.lance?.mes ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { tirMensal, tirAnual } = calcularTir(parcelas, (p) => p.parcela, {
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

  // Ágio (valor pago para comprar carta já contemplada)
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

  // Parâmetros de aluguel (opcional)
  const mesContemplacao = inputs.mesContemplacao ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { tirMensal, tirAnual } = calcularTir(parcelas, (p) => p.parcela, {
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

  // Criar mapa de amortizações adicionais por mês
  const amortizacoesMap = new Map<number, AmortizacaoAdicionalConsorcio>();
  for (const amort of amortizacoesAdicionais) {
    if (amort.valor > 0) {
      amortizacoesMap.set(amort.mes, amort);
    }
  }

  // Incluir o lance inicial (se houver) como amortização adicional no mês da contemplação.
  // Isso garante que o cenário "com amortizações adicionais" seja comparável ao cenário original,
  // quando o usuário já informou um lance no formulário.
  if (inputs.lance && inputs.lance.valor > 0) {
    const existente = amortizacoesMap.get(inputs.lance.mes);
    if (existente) {
      amortizacoesMap.set(inputs.lance.mes, {
        ...existente,
        // Soma os valores e preserva o tipo já escolhido para aquele mês (se existir).
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

  // Calcular resultado original para comparação
  const resultadoOriginal = calcularConsorcio(inputs);

  const parcelas: ParcelaConsorcioComAdicional[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;
  let totalAmortizacoesAdicionais = 0;

  // Ágio (valor pago para comprar carta já contemplada)
  const agio = inputs.agio || 0;

  // Valor do bem atual (será corrigido anualmente)
  let valorBemAtual = valorBem;

  // Saldos iniciais
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Fatores para cálculo mensal
  let mesesFundoComum = meses; // divisor do fundo comum

  let mes = 1;

  // Loop até quitar ambos os saldos ou atingir limite de segurança
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

    // Verificar amortização adicional (lance)
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
      parcela: parcelaFinal, // Inclui agio no primeiro mês (amortização adicional é separada)
      saldoDevedor: saldoDevedorFundo, // Na tabela mostramos o saldo do bem (comum)
      correcaoAplicada,
      anoCorrente,
      amortizacaoAdicional: amortizacaoEfetiva,
      tipoAdicional,
    });

    // Reajuste de parâmetros pós-lance
    if (amortizacaoEfetiva > 0) {
      const mesesRestantes = Math.max(1, meses - mes);

      if (tipoAdicional === "prazo") {
        // Modo Prazo: não mudamos o divisor (mesesFundoComum).
        // A parcela nominal continua "a mesma" (reajustada apenas pelo INCC anual).
        // O saldo cai rápido e o loop termina antes.
      } else {
        // Modo Parcela: queremos diluir o saldo restante no prazo original.
        // Novo cálculo de parcela deve cobrir o saldo restante em mesesRestantes.
        // Mas a lógica de parcela é: ValorBem / Divisor.
        // Queremos achar o NovoDivisor tal que: (ValorBemAtual / NovoDivisor) * MesesRestantes ≈ SaldoDevedorFundo.
        // Logo: NovoDivisor = (ValorBemAtual * MesesRestantes) / SaldoDevedorFundo.
        if (saldoDevedorFundo > EPSILON) {
          mesesFundoComum = round2((valorBemAtual * mesesRestantes) / saldoDevedorFundo);
          // Para a taxa, mesma lógica para manter a proporção
          if (saldoDevedorTaxa > EPSILON) {
            // Implicitamente a taxa acompanhará porque é calculada proporcional ao fundo
          }
        }
      }
    }

    mes++;
    if (saldoDevedorTotal <= EPSILON) break;
  }

  const mesesComAdicionais = parcelas.length;
  const economiaMeses = meses - mesesComAdicionais;
  // Por segurança, evitamos economia negativa em função de arredondamentos
  const economiaTaxa = Math.max(0, round2(resultadoOriginal.totalTaxaAdministracao - totalTaxaAdministracao));

  // TIR do cenário original já foi calculada em calcularConsorcio.
  const tirMensalOriginal = resultadoOriginal.tirMensal ?? null;
  const tirAnualOriginal = resultadoOriginal.tirAnual ?? null;

  // Parâmetros de aluguel (opcional)
  const mesContemplacao = inputs.mesContemplacao ?? inputs.lance?.mes ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  const { tirMensal: tirMensalComAdicionais, tirAnual: tirAnualComAdicionais } = calcularTir(
    parcelas,
    (p) => p.parcela + p.amortizacaoAdicional,
    {
      mesContemplacao,
      aluguelMensal,
      correcaoAnualAluguel,
      valorBemFinal: valorBemAtual,
      agio,
    }
  );

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
    economiaTaxa, // Economia gerada por não pagar INCC sobre a taxa antecipada
    economiaMeses,
    parcelas,
    tirMensalOriginal,
    tirAnualOriginal,
    tirMensalComAdicionais,
    tirAnualComAdicionais,
  };
}
