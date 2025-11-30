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

export interface ParcelaComAdicional extends Parcela {
  amortizacaoAdicional: number;
  tipoAdicional: TipoAmortizacaoAdicional;
}

export interface ResultadoFinanciamento {
  valorFinanciado: number;
  totalJurosPagos: number;
  totalPago: number;
  primeiraPrestacao: number;
  ultimaPrestacao: number;
  parcelas: Parcela[];
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
}

export interface AmortizacaoAdicional {
  mes: number;
  valor: number;
  tipo: TipoAmortizacaoAdicional;
}

export type MetodoAmortizacao = "sac" | "price";
export type TipoAmortizacaoAdicional = "prazo" | "parcela";

// Arredonda valores monetários para 2 casas decimais
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula financiamento usando o Sistema de Amortização Constante (SAC)
 * - Amortização é constante
 * - Prestações são decrescentes
 */
export function calcularSAC(inputs: InputsFinanciamento): ResultadoFinanciamento {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  // Conversão de taxa efetiva anual para taxa equivalente mensal
  const taxaMensal = Math.pow(1 + taxaJurosAnual / 100, 1 / 12) - 1;
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
  // Conversão de taxa efetiva anual para taxa equivalente mensal
  const taxaMensal = Math.pow(1 + taxaJurosAnual / 100, 1 / 12) - 1;

  // Fórmula PRICE: PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
  const fator = Math.pow(1 + taxaMensal, meses);
  const prestacaoConstante = valorFinanciado * ((taxaMensal * fator) / (fator - 1));

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

/**
 * Recalcula o financiamento considerando amortizações adicionais
 * - Prazo: Reduz o número de meses, mantendo amortização similar
 * - Parcela: Mantém o prazo, reduz o valor das parcelas
 */
export function recalcularComAmortizacoes(
  inputs: InputsFinanciamento,
  metodo: MetodoAmortizacao,
  amortizacoesAdicionais: AmortizacaoAdicional[]
): ResultadoComAdicionais {
  const { valorEmprestimo, valorEntrada, taxaJurosAnual, meses } = inputs;
  const valorFinanciado = valorEmprestimo - valorEntrada;
  const taxaMensal = Math.pow(1 + taxaJurosAnual / 100, 1 / 12) - 1;

  // Criar mapa de amortizações adicionais por mês
  const amortizacoesMap = new Map<number, AmortizacaoAdicional>();
  for (const amort of amortizacoesAdicionais) {
    if (amort.valor > 0) {
      amortizacoesMap.set(amort.mes, amort);
    }
  }

  // Calcular resultado original para comparação
  const resultadoOriginal = calcularFinanciamento(inputs, metodo);

  const parcelas: ParcelaComAdicional[] = [];
  let saldoDevedor = round2(valorFinanciado);
  let totalJurosPagos = 0;
  let totalAmortizacoesAdicionais = 0;
  let mes = 1;
  let mesesRestantes = meses;

  // Valores de cálculo que podem mudar durante o loop
  let amortizacaoBase = metodo === "sac" ? round2(valorFinanciado / meses) : 0;
  let prestacaoBase = 0;

  if (metodo === "price") {
    const fator = Math.pow(1 + taxaMensal, meses);
    prestacaoBase = valorFinanciado * ((taxaMensal * fator) / (fator - 1));
  }

  while (saldoDevedor > 0.01 && mes <= meses * 2) {
    // Safety limit
    const saldoInicial = saldoDevedor;
    const jurosPago = round2(saldoInicial * taxaMensal);

    let amortizacao: number;
    let prestacao: number;

    if (metodo === "sac") {
      amortizacao = round2(Math.min(amortizacaoBase, saldoInicial));
      prestacao = round2(amortizacao + jurosPago);
    } else {
      // PRICE
      // Mantém a prestação constante (prestacaoBase) durante todo o período,
      // exceto na parcela final de quitação, que pode ser menor.
      const valorMaximoPrestacao = round2(saldoInicial + jurosPago);
      const isParcelaFinal = prestacaoBase >= valorMaximoPrestacao - 0.005;

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

    // Verificar se há amortização adicional neste mês
    const amortAdicional = amortizacoesMap.get(mes);
    const valorAdicional = amortAdicional?.valor ?? 0;
    const tipoAdicional = amortAdicional?.tipo ?? "prazo";

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
      mesesRestantes = mesesRestantes - 1;

      // Modo "Prazo": mantém a amortização/prestação base inalterada.
      // O financiamento terminará antes pois o saldo diminui mais rápido,
      // mas cada parcela continua com o mesmo valor base.
      // Não há nada a recalcular - apenas deixa o loop continuar até saldo = 0.

      // Modo "Parcela": mantém o prazo original restante, recalcula amortização/prestação
      // para que o financiamento termine no mesmo tempo, mas com parcelas menores.
      if (tipoAdicional === "parcela") {
        const mesesRestantesOriginais = meses - mes;

        if (mesesRestantesOriginais > 0 && saldoDevedor > 0) {
          if (metodo === "sac") {
            amortizacaoBase = round2(saldoDevedor / mesesRestantesOriginais);
          } else {
            // PRICE: recalcula prestação para o saldo restante
            const fator = Math.pow(1 + taxaMensal, mesesRestantesOriginais);
            prestacaoBase = round2(saldoDevedor * ((taxaMensal * fator) / (fator - 1)));
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

  return {
    valorFinanciado,
    totalJurosPagosOriginal: resultadoOriginal.totalJurosPagos,
    totalPagoOriginal: resultadoOriginal.totalPago,
    totalJurosPagosComAdicionais: totalJurosPagos,
    totalPagoComAdicionais,
    totalAmortizacoesAdicionais,
    mesesOriginais: meses,
    mesesComAdicionais: parcelas.length,
    economiaJuros: resultadoOriginal.totalJurosPagos - totalJurosPagos,
    parcelas,
  };
}
