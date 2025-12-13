import { round2, calculateIrr, irrMonthlyToAnnual, getAluguelCorrigidoNoMes } from "../utils";

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

  // Valor do bem atual (será corrigido anualmente)
  let valorBemAtual = valorBem;

  // Saldos iniciais (fundo comum e taxa são controlados separadamente para o lance)
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Divisor do fundo comum (fixo em 'meses' para modo prazo)
  const mesesFundoComum = meses;

  let mesAtual = 1;

  // Loop até quitar ambos os saldos ou atingir limite de segurança
  while ((saldoDevedorFundo > 0.01 || saldoDevedorTaxa > 0.01) && mesAtual <= meses * 2) {
    const anoCorrente = Math.ceil(mesAtual / 12);
    const isNovoAno = mesAtual > 1 && (mesAtual - 1) % 12 === 0;

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      const fatorReajuste = 1 + correcaoAnual / 100;
      valorBemAtual = round2(valorBemAtual * fatorReajuste);
      saldoDevedorFundo = round2(saldoDevedorFundo * fatorReajuste);
      saldoDevedorTaxa = round2(saldoDevedorTaxa * fatorReajuste);
    }

    // Cálculo da parcela base do mês
    let fundoComum = 0;
    let taxaAdministracao = 0;

    if (saldoDevedorFundo > 0.01) {
      fundoComum = round2(valorBemAtual / mesesFundoComum);
      if (fundoComum > saldoDevedorFundo) fundoComum = saldoDevedorFundo;
    }

    if (saldoDevedorTaxa > 0.01) {
      // Taxa proporcional ao fundo comum, mantendo a razão dos saldos
      if (saldoDevedorFundo > 0) {
        taxaAdministracao = round2(fundoComum * (saldoDevedorTaxa / saldoDevedorFundo));
      } else {
        taxaAdministracao = round2(saldoDevedorTaxa);
      }
      if (taxaAdministracao > saldoDevedorTaxa) taxaAdministracao = saldoDevedorTaxa;
    }

    const parcelaBase = round2(fundoComum + taxaAdministracao);

    // Verificar se é o mês do lance
    const isLanceMes = mesAtual === lance.mes;
    let abateFundo = 0;
    let abateTaxa = 0;
    let lanceEfetivo = 0;

    if (isLanceMes && lance.valor > 0) {
      // O lance abate os saldos proporcionalmente após pagar a parcela do mês
      const saldoAposParcelaFundo = Math.max(0, saldoDevedorFundo - fundoComum);
      const saldoAposParcelaTaxa = Math.max(0, saldoDevedorTaxa - taxaAdministracao);
      const saldoTotalAposParcela = saldoAposParcelaFundo + saldoAposParcelaTaxa;

      lanceEfetivo = Math.min(lance.valor, saldoTotalAposParcela);

      if (lanceEfetivo > 0 && saldoTotalAposParcela > 0) {
        const razaoFundo = saldoAposParcelaFundo / saldoTotalAposParcela;
        abateFundo = round2(lanceEfetivo * razaoFundo);
        abateTaxa = round2(lanceEfetivo - abateFundo);
      }
    }

    // Atualiza saldos
    saldoDevedorFundo = round2(saldoDevedorFundo - fundoComum - abateFundo);
    if (saldoDevedorFundo < 0.01) saldoDevedorFundo = 0;

    saldoDevedorTaxa = round2(saldoDevedorTaxa - taxaAdministracao - abateTaxa);
    if (saldoDevedorTaxa < 0.01) saldoDevedorTaxa = 0;

    totalTaxaAdministracao = round2(totalTaxaAdministracao + taxaAdministracao + abateTaxa);
    totalPago = round2(totalPago + parcelaBase + lanceEfetivo);

    const saldoDevedorTotal = round2(saldoDevedorFundo + saldoDevedorTaxa);

    parcelas.push({
      mes: mesAtual,
      fundoComum,
      taxaAdministracao,
      parcela: parcelaBase + lanceEfetivo, // Inclui o lance na parcela do mês
      saldoDevedor: saldoDevedorFundo,
      correcaoAplicada,
      anoCorrente,
    });

    mesAtual++;
    if (saldoDevedorTotal <= 0.01) break;
  }

  // Ágio (valor pago para comprar carta já contemplada)
  const agio = inputs.agio || 0;
  const totalPagoComAgio = round2(totalPago + agio);

  // Parâmetros de aluguel (opcional)
  const mesContemplacao = inputs.mesContemplacao ?? inputs.lance?.mes ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  // Construir fluxos de caixa para cálculo da TIR
  // - Parcelas como saídas (negativo)
  // - Ágio no primeiro mês (negativo)
  // - Aluguel recebido a partir da contemplação (entra no fluxo mensal e pode superar a parcela)
  // - Valor final do bem no último mês (positivo)
  let tirMensal: number | null = null;
  let tirAnual: number | null = null;

  if (parcelas.length > 0) {
    const cashflows: number[] = parcelas.map((p) => {
      const mes = p.mes;
      const aluguelRecebido =
        aluguelMensal > 0 && mes >= mesContemplacao
          ? getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel)
          : 0;

      // Fluxo líquido do mês: aluguel recebido - parcela
      // (pode ser positivo se o aluguel for maior que a parcela).
      const fluxoLiquido = round2(aluguelRecebido - p.parcela);
      return fluxoLiquido;
    });

    // Adiciona o ágio ao primeiro mês
    if (agio > 0) {
      cashflows[0] -= agio;
    }
    // Adiciona o valor final do bem no último mês
    cashflows[cashflows.length - 1] += valorBemAtual;

    const irr = calculateIrr(cashflows);
    if (irr !== null && Number.isFinite(irr)) {
      tirMensal = irr;
      tirAnual = irrMonthlyToAnnual(irr);
    }
  }

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

  for (let mes = 1; mes <= meses; mes++) {
    const anoCorrente = Math.ceil(mes / 12);
    const isNovoAno = mes > 1 && (mes - 1) % 12 === 0;

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      valorBemAtual = round2(valorBemAtual * (1 + correcaoAnual / 100));
      saldoDevedorAtual = round2(saldoDevedorAtual * (1 + correcaoAnual / 100));
    }

    const fundoComum = round2(valorBemAtual / meses);
    const taxaAdministracao = round2((taxaAdministracaoTotal / 100 / meses) * valorBemAtual);
    const parcela = round2(fundoComum + taxaAdministracao);

    saldoDevedorAtual = round2(saldoDevedorAtual - fundoComum);
    if (saldoDevedorAtual < 0.01) {
      saldoDevedorAtual = 0;
    }

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

  // Ágio (valor pago para comprar carta já contemplada)
  const agio = agioInput || 0;
  const totalPagoComAgio = round2(totalPago + agio);

  // Parâmetros de aluguel (opcional)
  const mesContemplacao = inputs.mesContemplacao ?? 1;
  const aluguelMensal = inputs.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs.correcaoAnualAluguel ?? 0;

  let tirMensal: number | null = null;
  let tirAnual: number | null = null;

  if (parcelas.length > 0) {
    const cashflows: number[] = parcelas.map((p) => {
      const mes = p.mes;
      const aluguelRecebido =
        aluguelMensal > 0 && mes >= mesContemplacao
          ? getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel)
          : 0;

      // Fluxo líquido do mês: aluguel recebido - parcela
      // (pode ser positivo se o aluguel for maior que a parcela).
      const fluxoLiquido = round2(aluguelRecebido - p.parcela);
      return fluxoLiquido;
    });

    // Adiciona o ágio ao primeiro mês
    if (agio > 0) {
      cashflows[0] -= agio;
    }
    // Adiciona o valor final do bem no último mês
    cashflows[cashflows.length - 1] += valorBemAtual;

    const irr = calculateIrr(cashflows);
    if (irr !== null && Number.isFinite(irr)) {
      tirMensal = irr;
      tirAnual = irrMonthlyToAnnual(irr);
    }
  }

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

  // Calcular resultado original para comparação
  const resultadoOriginal = calcularConsorcio(inputs);

  const parcelas: ParcelaConsorcioComAdicional[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;
  let totalAmortizacoesAdicionais = 0;

  // Valor do bem atual (será corrigido anualmente)
  let valorBemAtual = valorBem;

  // Saldos iniciais
  let saldoDevedorFundo = valorBem;
  let saldoDevedorTaxa = (valorBem * taxaAdministracaoTotal) / 100;

  // Fatores para cálculo mensal
  let mesesFundoComum = meses; // divisor do fundo comum

  let mes = 1;

  // Loop até quitar ambos os saldos ou atingir limite de segurança
  while ((saldoDevedorFundo > 0.01 || saldoDevedorTaxa > 0.01) && mes <= meses * 2) {
    const anoCorrente = Math.ceil(mes / 12);
    const isNovoAno = mes > 1 && (mes - 1) % 12 === 0;

    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      const fatorReajuste = 1 + correcaoAnual / 100;
      valorBemAtual = round2(valorBemAtual * fatorReajuste);
      saldoDevedorFundo = round2(saldoDevedorFundo * fatorReajuste);
      saldoDevedorTaxa = round2(saldoDevedorTaxa * fatorReajuste);
    }

    // Cálculo da parcela base do mês
    // Modo Prazo: usa o prazo original como divisor (parcela cheia)
    // Modo Parcela: usa o prazo restante como divisor (parcela reduzida)
    // Como o divisor pode ter mudado devido a um lance anterior (modo parcela), usamos as variáveis de controle
    let fundoComum = 0;
    let taxaAdministracao = 0;

    // Se ainda há saldo, calcula a parcela
    if (saldoDevedorFundo > 0.01) {
      // No modo prazo (padrão), mesesFundoComum é fixo em 'meses'.
      // A lógica original era valorBemAtual / meses.
      // Aqui adaptamos para: saldoDevedorFundo se estivermos no fim, ou valorBemAtual / mesesFundoComum.
      // Porém, para suportar o modo parcela corretamente (onde saldo cai e meses se mantém),
      // o cálculo deve ser baseado no objetivo de zerar o saldo.
      // Mas para ser fiel à regra "parcela = % do bem":
      // Fundo = (100% / mesesTotal) * ValorBemAtual.
      // Se modo parcela: Fundo = (SaldoRestante% / MesesRestantes) * ValorBemAtual.
      // Simplificando: Fundo = SaldoDevedorFundo / MesesRestantesParaAmortizar?
      // Não, pois o SaldoDevedorFundo cresce com o tempo.
      // Melhor aproximação com o modelo original:
      // FundoBase = ValorBemAtual / mesesFundoComum.
      fundoComum = round2(valorBemAtual / mesesFundoComum);
      // Trava: não pagar mais que o saldo
      if (fundoComum > saldoDevedorFundo) fundoComum = saldoDevedorFundo;
    }

    if (saldoDevedorTaxa > 0.01) {
      // Taxa = (TaxaTotal% / mesesTotal) * ValorBemAtual
      // O equivalente a: (SaldoTaxaInicial% / mesesTaxaAdmin) * ValorBemAtual
      // Ou proporcional ao fundo comum se quisermos manter a razão.
      // Vamos manter a lógica de percentual do bem atual.
      // TaxaBase = (TaxaAdminTotal% / 100 / mesesTaxaAdminOriginal) * ValorBemAtual?
      // Se modo parcela, a taxa cai proporcionalmente.
      // Vamos usar: taxaAdministracao = fundoComum * (saldoDevedorTaxa / saldoDevedorFundo) ?
      // Não, a taxa tem vida própria.
      // Vamos usar a regra de: Taxa = ValorBemAtual * (TaxaTotal / 100) / mesesTaxaAdmin
      // Mas se houve lance, o saldoTaxa caiu.
      // Melhor: Taxa = SaldoDevedorTaxa / MesesRestantes (considerando que saldo cresce com INCC, isso geraria parcela constante real)
      // Mas a regra é % do bem.
      // Vamos derivar a taxa da proporção atual do saldo em relação ao bem total se estivéssemos no início?
      // Mais simples: Taxa = FundoComum * (TaxaTotal / 100). Não, isso é fixo.

      // Vamos calcular proporcional ao FundoComum deste mês, mantendo a razão dos saldos
      // Razão: SaldoTaxa / SaldoFundo.
      if (saldoDevedorFundo > 0) {
        taxaAdministracao = round2(fundoComum * (saldoDevedorTaxa / saldoDevedorFundo));
      } else {
        // Se só sobrou taxa (improvável no modelo proporcional, mas possível por arredondamento)
        taxaAdministracao = round2(saldoDevedorTaxa); // Paga o resto
      }

      if (taxaAdministracao > saldoDevedorTaxa) taxaAdministracao = saldoDevedorTaxa;
    }

    const parcelaBase = round2(fundoComum + taxaAdministracao);

    // Verificar lance
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

    // O lance abate os saldos. Quanto vai para cada um?
    // Proporção baseada na parcela base deste mês (que reflete a proporção dos saldos)
    let abateFundo = 0;
    let abateTaxa = 0;
    let amortizacaoEfetiva = 0;

    if (valorAdicional > 0) {
      // Limita o lance ao saldo total devedor (após pagar a parcela do mês)
      // Mas o lance é pago "além" da parcela ou "inclui" a parcela? Geralmente é além (boleto separado).
      // Vamos considerar "além".
      const saldoAposParcelaFundo = Math.max(0, saldoDevedorFundo - fundoComum);
      const saldoAposParcelaTaxa = Math.max(0, saldoDevedorTaxa - taxaAdministracao);
      const saldoTotalAposParcela = saldoAposParcelaFundo + saldoAposParcelaTaxa;

      amortizacaoEfetiva = Math.min(valorAdicional, saldoTotalAposParcela);

      if (amortizacaoEfetiva > 0 && saldoTotalAposParcela > 0) {
        // Distribui proporcional aos saldos restantes
        const razaoFundo = saldoAposParcelaFundo / saldoTotalAposParcela;
        abateFundo = round2(amortizacaoEfetiva * razaoFundo);
        abateTaxa = round2(amortizacaoEfetiva - abateFundo);
      }
    }

    // Atualiza saldos
    saldoDevedorFundo = round2(saldoDevedorFundo - fundoComum - abateFundo);
    if (saldoDevedorFundo < 0.01) saldoDevedorFundo = 0;

    saldoDevedorTaxa = round2(saldoDevedorTaxa - taxaAdministracao - abateTaxa);
    if (saldoDevedorTaxa < 0.01) saldoDevedorTaxa = 0;

    totalTaxaAdministracao = round2(totalTaxaAdministracao + taxaAdministracao + abateTaxa);
    totalPago = round2(totalPago + parcelaBase + amortizacaoEfetiva);
    totalAmortizacoesAdicionais = round2(totalAmortizacoesAdicionais + amortizacaoEfetiva);

    const saldoDevedorTotal = round2(saldoDevedorFundo + saldoDevedorTaxa);

    parcelas.push({
      mes,
      fundoComum,
      taxaAdministracao,
      parcela: parcelaBase,
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
        if (saldoDevedorFundo > 0.01) {
          mesesFundoComum = round2((valorBemAtual * mesesRestantes) / saldoDevedorFundo);
          // Para a taxa, mesma lógica para manter a proporção
          if (saldoDevedorTaxa > 0.01) {
            // Implicitamente a taxa acompanhará porque é calculada proporcional ao fundo
          }
        }
      }
    }

    mes++;
    if (saldoDevedorTotal <= 0.01) break;
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

  // Construir fluxos de caixa para o cenário com amortizações adicionais:
  // - Cada mês: fluxo líquido = aluguel recebido - (parcela + adicional) (pode ser positivo).
  // - Último mês: adiciona o valor final corrigido do bem como entrada positiva.
  let tirMensalComAdicionais: number | null = null;
  let tirAnualComAdicionais: number | null = null;

  if (parcelas.length > 0) {
    const cashflowsComAdicionais: number[] = parcelas.map((p) => {
      const mesAtual = p.mes;
      const adicional = (p as ParcelaConsorcioComAdicional).amortizacaoAdicional ?? 0;
      const pagamento = round2(p.parcela + adicional);

      const aluguelRecebido =
        aluguelMensal > 0 && mesAtual >= mesContemplacao
          ? getAluguelCorrigidoNoMes(mesAtual, aluguelMensal, correcaoAnualAluguel)
          : 0;

      // Fluxo líquido do mês: aluguel recebido - (parcela + adicional)
      // (pode ser positivo se o aluguel for maior que o pagamento do mês).
      const fluxoLiquido = round2(aluguelRecebido - pagamento);
      return fluxoLiquido;
    });

    // Adiciona o valor final do bem no último mês
    cashflowsComAdicionais[cashflowsComAdicionais.length - 1] += valorBemAtual;

    const irrComAdicionais = calculateIrr(cashflowsComAdicionais);
    if (irrComAdicionais !== null && Number.isFinite(irrComAdicionais)) {
      tirMensalComAdicionais = irrComAdicionais;
      tirAnualComAdicionais = irrMonthlyToAnnual(irrComAdicionais);
    }
  }

  return {
    valorBem,
    valorBemFinal: valorBemAtual,
    totalTaxaAdministracaoOriginal: resultadoOriginal.totalTaxaAdministracao,
    totalPagoOriginal: resultadoOriginal.totalPago,
    totalTaxaAdministracaoComAdicionais: totalTaxaAdministracao,
    totalPagoComAdicionais: totalPago,
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
