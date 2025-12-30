import { round2 } from "../utils";

// ==========================
// Types
// ==========================

export type RendaFixaTipo = "pre" | "cdi" | "ipca" | "selic";

export const RENDA_FIXA_TIPO_LABELS: Record<RendaFixaTipo, string> = {
  pre: "Pré-fixado",
  cdi: "% CDI",
  ipca: "IPCA+",
  selic: "Selic",
};

export interface InputsComparadorRendaFixa {
  valor: number;
  prazoDias: number;
  // Taxas das 4 opções
  preAnual: number; // % a.a.
  cdiPercent: number; // % do CDI
  ipcaMaisAnual: number; // % a.a. de spread real
  selicAnual: number; // % a.a.
  // Expectativas de mercado
  cdiAnual: number; // % a.a.
  ipcaAnual: number; // % a.a.
  // Fees
  custodiaAnual: number; // % a.a. (default 0)
}

export interface EvolucaoRendaFixa {
  dia: number;
  valorBruto: number;
  valorLiquido: number;
  valorReal: number;
}

export interface ResultadoOpcaoRendaFixa {
  tipo: RendaFixaTipo;
  valorFinalBruto: number;
  iof: number;
  ir: number;
  taxas: number; // Custódia total
  valorFinalLiquido: number;
  rentabilidadeLiquidaPercent: number;
  taxaEfetivaAnualLiquidaPercent: number;
  inflacaoAcumuladaPercent: number;
  valorFinalReal: number;
  retornoRealPercent: number;
  taxaRealAnualPercent: number;
  evolucao: EvolucaoRendaFixa[];
}

export interface RankingItem {
  tipo: RendaFixaTipo;
  posicao: number;
}

export interface ResultadoComparadorRendaFixa {
  opcoes: ResultadoOpcaoRendaFixa[];
  ranking: RankingItem[];
  vencedor: RendaFixaTipo | "empate";
}

// ==========================
// Helper Functions
// ==========================

/**
 * Converts annual effective rate to daily rate (base 365)
 */
export function annualToDaily(annualPercent: number): number {
  if (annualPercent === 0) return 0;
  return Math.pow(1 + annualPercent / 100, 1 / 365) - 1;
}

/**
 * Gets IR regressivo aliquota based on days
 */
export function getIrAliquotaRegressiva(dias: number): number {
  if (dias <= 180) return 22.5;
  if (dias <= 360) return 20;
  if (dias <= 720) return 17.5;
  return 15;
}

/**
 * Gets IOF aliquota based on days (official table for days 1-30)
 * Returns 0 for days >= 30
 */
export function getIofAliquota(dias: number): number {
  if (dias >= 30) return 0;

  // Official IOF table (decreasing from day 1 to day 29)
  const table: Record<number, number> = {
    1: 96,
    2: 93,
    3: 90,
    4: 86,
    5: 83,
    6: 80,
    7: 76,
    8: 73,
    9: 70,
    10: 66,
    11: 63,
    12: 60,
    13: 56,
    14: 53,
    15: 50,
    16: 46,
    17: 43,
    18: 40,
    19: 36,
    20: 33,
    21: 30,
    22: 26,
    23: 23,
    24: 20,
    25: 16,
    26: 13,
    27: 10,
    28: 6,
    29: 3,
    30: 0,
  };

  return table[dias] ?? 0;
}

/**
 * Calculates daily rate for each option type
 */
function calcularTaxaDiaria(tipo: RendaFixaTipo, inputs: InputsComparadorRendaFixa): number {
  const cdiDaily = annualToDaily(inputs.cdiAnual);
  const ipcaDaily = annualToDaily(inputs.ipcaAnual);

  switch (tipo) {
    case "pre":
      return annualToDaily(inputs.preAnual);
    case "cdi":
      return cdiDaily * (inputs.cdiPercent / 100);
    case "ipca":
      const spreadDaily = annualToDaily(inputs.ipcaMaisAnual);
      return (1 + ipcaDaily) * (1 + spreadDaily) - 1;
    case "selic":
      return annualToDaily(inputs.selicAnual);
  }
}

/**
 * Calculates final value for an option with daily compounding
 */
function calcularValorFinal(
  valorInicial: number,
  taxaDiaria: number,
  prazoDias: number,
  custodiaDiaria: number
): number {
  let saldo = valorInicial;

  for (let dia = 1; dia <= prazoDias; dia++) {
    // Apply interest
    saldo = saldo * (1 + taxaDiaria);
    // Apply custody fee (as drag)
    saldo = saldo * (1 - custodiaDiaria);
  }

  return round2(saldo);
}

/**
 * Calculates taxes (IOF + IR) on profit
 */
function calcularImpostos(lucroBruto: number, prazoDias: number): { iof: number; ir: number } {
  if (lucroBruto <= 0) {
    return { iof: 0, ir: 0 };
  }

  // IOF applies first (only if < 30 days)
  const iofAliquota = getIofAliquota(prazoDias);
  const iof = round2((lucroBruto * iofAliquota) / 100);

  // IR applies on remaining profit after IOF
  const lucroAposIof = lucroBruto - iof;
  const irAliquota = getIrAliquotaRegressiva(prazoDias);
  const ir = round2((lucroAposIof * irAliquota) / 100);

  return { iof, ir };
}

/**
 * Generates evolution series for chart (sampled)
 */
function gerarEvolucao(
  valorInicial: number,
  taxaDiaria: number,
  prazoDias: number,
  custodiaDiaria: number,
  ipcaAnual: number
): EvolucaoRendaFixa[] {
  const evolucao: EvolucaoRendaFixa[] = [];
  const maxPoints = 100; // Limit points for performance
  const step = Math.max(1, Math.floor(prazoDias / maxPoints));

  const saldo = valorInicial;

  for (let dia = 0; dia <= prazoDias; dia += step) {
    if (dia === 0) {
      // Initial value
      evolucao.push({
        dia: 0,
        valorBruto: valorInicial,
        valorLiquido: valorInicial,
        valorReal: valorInicial,
      });
      continue;
    }

    // Calculate up to this day
    let tempSaldo = valorInicial;
    for (let d = 1; d <= dia; d++) {
      tempSaldo = tempSaldo * (1 + taxaDiaria);
      tempSaldo = tempSaldo * (1 - custodiaDiaria);
    }

    const valorBruto = round2(tempSaldo);
    const lucroBruto = valorBruto - valorInicial;
    const { iof, ir } = calcularImpostos(lucroBruto, dia);
    const valorLiquido = round2(valorInicial + lucroBruto - iof - ir);

    // Calculate real value (deflated by inflation)
    const inflFactor = Math.pow(1 + ipcaAnual / 100, dia / 365);
    const valorReal = round2(valorLiquido / inflFactor);

    evolucao.push({
      dia,
      valorBruto,
      valorLiquido,
      valorReal,
    });
  }

  // Always include last day
  if (evolucao[evolucao.length - 1].dia !== prazoDias) {
    let tempSaldo = valorInicial;
    for (let d = 1; d <= prazoDias; d++) {
      tempSaldo = tempSaldo * (1 + taxaDiaria);
      tempSaldo = tempSaldo * (1 - custodiaDiaria);
    }

    const valorBruto = round2(tempSaldo);
    const lucroBruto = valorBruto - valorInicial;
    const { iof, ir } = calcularImpostos(lucroBruto, prazoDias);
    const valorLiquido = round2(valorInicial + lucroBruto - iof - ir);

    const inflFactor = Math.pow(1 + ipcaAnual / 100, prazoDias / 365);
    const valorReal = round2(valorLiquido / inflFactor);

    evolucao.push({
      dia: prazoDias,
      valorBruto,
      valorLiquido,
      valorReal,
    });
  }

  return evolucao;
}

/**
 * Calculates total custody fees paid
 */
function calcularTaxasTotais(
  valorInicial: number,
  taxaDiaria: number,
  custodiaDiaria: number,
  prazoDias: number
): number {
  let saldo = valorInicial;
  let totalTaxas = 0;

  for (let dia = 1; dia <= prazoDias; dia++) {
    const antesFee = saldo * (1 + taxaDiaria);
    const depoisFee = antesFee * (1 - custodiaDiaria);
    totalTaxas += antesFee - depoisFee;
    saldo = depoisFee;
  }

  return round2(totalTaxas);
}

// ==========================
// Main Calculation Function
// ==========================

/**
 * Calcula comparador de renda fixa com 4 opções (Pré, %CDI, IPCA+, Selic)
 * Retorna resultados líquidos de IR/IOF + inflação e ranking
 */
export function calcularComparadorRendaFixa(inputs: InputsComparadorRendaFixa): ResultadoComparadorRendaFixa {
  const { valor, prazoDias, ipcaAnual, custodiaAnual } = inputs;

  const custodiaDiaria = annualToDaily(custodiaAnual);
  const tipos: RendaFixaTipo[] = ["pre", "cdi", "ipca", "selic"];

  const opcoes: ResultadoOpcaoRendaFixa[] = tipos.map((tipo) => {
    const taxaDiaria = calcularTaxaDiaria(tipo, inputs);
    const valorFinalBruto = calcularValorFinal(valor, taxaDiaria, prazoDias, custodiaDiaria);

    const lucroBruto = valorFinalBruto - valor;
    const { iof, ir } = calcularImpostos(lucroBruto, prazoDias);
    const taxas = calcularTaxasTotais(valor, taxaDiaria, custodiaDiaria, prazoDias);

    const valorFinalLiquido = round2(valor + lucroBruto - iof - ir);
    const rentabilidadeLiquidaPercent = round2(((valorFinalLiquido - valor) / valor) * 100);

    // CAGR (taxa efetiva anual líquida)
    const taxaEfetivaAnualLiquidaPercent =
      prazoDias > 0 ? round2((Math.pow(valorFinalLiquido / valor, 365 / prazoDias) - 1) * 100) : 0;

    // Inflation
    const inflacaoAcumuladaPercent = round2((Math.pow(1 + ipcaAnual / 100, prazoDias / 365) - 1) * 100);

    // Real value (deflated)
    const inflFactor = Math.pow(1 + ipcaAnual / 100, prazoDias / 365);
    const valorFinalReal = round2(valorFinalLiquido / inflFactor);
    const retornoRealPercent = round2(((valorFinalReal - valor) / valor) * 100);
    const taxaRealAnualPercent =
      prazoDias > 0 ? round2((Math.pow(valorFinalReal / valor, 365 / prazoDias) - 1) * 100) : 0;

    // Evolution series
    const evolucao = gerarEvolucao(valor, taxaDiaria, prazoDias, custodiaDiaria, ipcaAnual);

    return {
      tipo,
      valorFinalBruto,
      iof,
      ir,
      taxas,
      valorFinalLiquido,
      rentabilidadeLiquidaPercent,
      taxaEfetivaAnualLiquidaPercent,
      inflacaoAcumuladaPercent,
      valorFinalReal,
      retornoRealPercent,
      taxaRealAnualPercent,
      evolucao,
    };
  });

  // Ranking by valorFinalReal (descending)
  const ranking: RankingItem[] = opcoes
    .map((opcao, index) => ({
      tipo: opcao.tipo,
      posicao: index + 1,
    }))
    .sort((a, b) => {
      const opcaoA = opcoes.find((o) => o.tipo === a.tipo);
      const opcaoB = opcoes.find((o) => o.tipo === b.tipo);
      return (opcaoB?.valorFinalReal ?? 0) - (opcaoA?.valorFinalReal ?? 0);
    })
    .map((item, index) => ({
      ...item,
      posicao: index + 1,
    }));

  // Determine winner
  const primeiro = opcoes.find((o) => o.tipo === ranking[0].tipo);
  const segundo = opcoes.find((o) => o.tipo === ranking[1].tipo);

  let vencedor: RendaFixaTipo | "empate" = ranking[0].tipo;
  if (primeiro && segundo && Math.abs(primeiro.valorFinalReal - segundo.valorFinalReal) < 0.01) {
    vencedor = "empate";
  }

  return {
    opcoes,
    ranking,
    vencedor,
  };
}
