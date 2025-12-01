export interface InputsConsorcio {
  valorBem: number;
  meses: number;
  taxaAdministracaoTotal: number; // Percentual total (ex: 15%)
  correcaoAnual: number; // Percentual anual de correção (ex: 6%)
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

export interface ResultadoConsorcio {
  valorBem: number;
  valorBemFinal: number;
  primeiraParcela: number;
  ultimaParcela: number;
  totalTaxaAdministracao: number;
  totalPago: number;
  parcelas: ParcelaConsorcio[];
}

// Arredonda valores monetários para 2 casas decimais
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
 */
export function calcularConsorcio(inputs: InputsConsorcio): ResultadoConsorcio {
  const { valorBem, meses, taxaAdministracaoTotal, correcaoAnual } = inputs;

  const parcelas: ParcelaConsorcio[] = [];
  let totalTaxaAdministracao = 0;
  let totalPago = 0;

  // Valor do bem atual (será corrigido anualmente)
  let valorBemAtual = valorBem;
  // Saldo devedor inicia com o valor do bem
  let saldoDevedorAtual = valorBem;

  for (let mes = 1; mes <= meses; mes++) {
    // Determina o ano corrente (1-indexed)
    const anoCorrente = Math.ceil(mes / 12);

    // Verifica se é o primeiro mês de um novo ano (exceto o primeiro)
    const isNovoAno = mes > 1 && (mes - 1) % 12 === 0;

    // Aplica correção no início de cada novo ano
    let correcaoAplicada = 0;
    if (isNovoAno) {
      correcaoAplicada = correcaoAnual;
      valorBemAtual = round2(valorBemAtual * (1 + correcaoAnual / 100));
      // O saldo devedor também é corrigido proporcionalmente
      saldoDevedorAtual = round2(saldoDevedorAtual * (1 + correcaoAnual / 100));
    }

    // Calcula os componentes da parcela baseado no valor do bem atual
    const fundoComum = round2(valorBemAtual / meses);
    const taxaAdministracao = round2((taxaAdministracaoTotal / 100 / meses) * valorBemAtual);
    const parcela = round2(fundoComum + taxaAdministracao);

    // Subtrai o fundo comum do saldo devedor
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

  return {
    valorBem,
    valorBemFinal: valorBemAtual,
    primeiraParcela: parcelas[0]?.parcela ?? 0,
    ultimaParcela: parcelas[parcelas.length - 1]?.parcela ?? 0,
    totalTaxaAdministracao,
    totalPago,
    parcelas,
  };
}
