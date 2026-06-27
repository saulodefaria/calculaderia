export const IMPOSTO_DE_RENDA_SOURCE_VERSION = "2026-06-26" as const;
export const IMPOSTO_DE_RENDA_SOURCE_ACCESS_DATE = "2026-06-26" as const;
export const IMPOSTO_DE_RENDA_MONEY_MAX = 100_000_000;

export type ImpostoDeRendaAnoCalendario = 2025 | 2026;
export type ImpostoDeRendaModoDeducao = "auto" | "legais" | "simplificado";
export type ImpostoDeRendaMetodoUsado = "legais" | "simplificado";

export type ImpostoDeRendaWarningCode =
  | "estimativaEducativa"
  | "urlSensivel"
  | "fontesConsultadas"
  | "anoCalendario2026"
  | "deducoesNaoValidadas"
  | "rendimentosInformativos"
  | "deducoesSemRendimento";

export type ImpostoDeRendaBreakdownCategory = "rendimentos" | "deducoes" | "bases" | "imposto" | "saldo";

export type ImpostoDeRendaBreakdownId =
  | "rendimentosTributaveis"
  | "rendimentosIsentos"
  | "rendimentosExclusivos"
  | "deducaoDependentes"
  | "despesasInstrucao"
  | "previdenciaComplementar"
  | "totalDeducoesLegais"
  | "descontoSimplificado"
  | "baseLegal"
  | "baseSimplificada"
  | "baseUsada"
  | "impostoAntesReducao"
  | "reducaoAnual"
  | "impostoDevido"
  | "totalImpostoPago"
  | "saldo";

export interface ImpostoDeRendaInputs {
  anoCalendario: ImpostoDeRendaAnoCalendario;
  rendimentosTributaveis: number;
  rendimentosIsentos: number;
  rendimentosExclusivos: number;
  impostoRetidoFonte: number;
  carneLeaoPago: number;
  impostoComplementarPago: number;
  dependentes: number;
  previdenciaOficial: number;
  pensaoAlimenticia: number;
  despesasMedicas: number;
  despesasInstrucao: number;
  pessoasInstrucao: number;
  previdenciaComplementar: number;
  livroCaixa: number;
  outrasDeducoesLegais: number;
  modoDeducao: ImpostoDeRendaModoDeducao;
}

export interface ImpostoDeRendaBracket {
  limiteSuperior: number;
  aliquota: number;
  parcelaDeduzir: number;
}

export interface ImpostoDeRendaAnoConfig {
  anoCalendario: ImpostoDeRendaAnoCalendario;
  exercicio: 2026 | 2027;
  label: string;
  tabelaAnual: ImpostoDeRendaBracket[];
  deducaoDependenteAnual: number;
  limiteInstrucaoAnual: number;
  limiteDescontoSimplificadoAnual: number;
  temReducaoAnual: boolean;
}

export interface ImpostoDeRendaMetodoResult {
  metodo: ImpostoDeRendaMetodoUsado;
  base: number;
  deducaoOuDesconto: number;
  aliquotaFaixa: number;
  parcelaDeduzir: number;
  impostoAntesReducao: number;
  reducaoAnual: number;
  impostoDevido: number;
}

export interface ImpostoDeRendaBreakdownRow {
  id: ImpostoDeRendaBreakdownId;
  categoria: ImpostoDeRendaBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
}

export interface ResultadoImpostoDeRenda {
  anoCalendario: ImpostoDeRendaAnoCalendario;
  exercicio: 2026 | 2027;
  sourceVersion: typeof IMPOSTO_DE_RENDA_SOURCE_VERSION;
  sourceAccessDate: typeof IMPOSTO_DE_RENDA_SOURCE_ACCESS_DATE;
  deducaoDependentes: number;
  despesasInstrucaoDedutivel: number;
  despesasInstrucaoExcedente: number;
  previdenciaComplementarDedutivel: number;
  previdenciaComplementarExcedente: number;
  totalDeducoesLegais: number;
  descontoSimplificado: number;
  baseLegal: number;
  baseSimplificada: number;
  baseUsada: number;
  metodoUsado: ImpostoDeRendaMetodoUsado;
  metodoSolicitado: ImpostoDeRendaModoDeducao;
  aliquotaFaixa: number;
  parcelaDeduzir: number;
  impostoAntesReducao: number;
  reducaoAnual: number;
  impostoDevido: number;
  totalImpostoPago: number;
  saldo: number;
  aliquotaEfetivaSobreRendimentos: number;
  comparacao: Record<ImpostoDeRendaMetodoUsado, ImpostoDeRendaMetodoResult>;
  breakdown: ImpostoDeRendaBreakdownRow[];
  warnings: ImpostoDeRendaWarningCode[];
}

// Receita Federal annual IRPF tables accessed on 2026-06-26.
// 2026 annual reduction uses annual taxable income subject to adjustment, not the post-deduction base.
export const IMPOSTO_DE_RENDA_ANNUAL_CONFIGS: Record<ImpostoDeRendaAnoCalendario, ImpostoDeRendaAnoConfig> = {
  2025: {
    anoCalendario: 2025,
    exercicio: 2026,
    label: "Declaracao IRPF 2026 / ano-calendario 2025",
    tabelaAnual: [
      { limiteSuperior: 28_467.2, aliquota: 0, parcelaDeduzir: 0 },
      { limiteSuperior: 33_919.8, aliquota: 0.075, parcelaDeduzir: 2_135.04 },
      { limiteSuperior: 45_012.6, aliquota: 0.15, parcelaDeduzir: 4_679.03 },
      { limiteSuperior: 55_976.16, aliquota: 0.225, parcelaDeduzir: 8_054.97 },
      { limiteSuperior: Number.POSITIVE_INFINITY, aliquota: 0.275, parcelaDeduzir: 10_853.78 },
    ],
    deducaoDependenteAnual: 2_275.08,
    limiteInstrucaoAnual: 3_561.5,
    limiteDescontoSimplificadoAnual: 16_754.34,
    temReducaoAnual: false,
  },
  2026: {
    anoCalendario: 2026,
    exercicio: 2027,
    label: "Estimativa ano-calendario 2026 / exercicio 2027",
    tabelaAnual: [
      { limiteSuperior: 29_145.6, aliquota: 0, parcelaDeduzir: 0 },
      { limiteSuperior: 33_919.8, aliquota: 0.075, parcelaDeduzir: 2_185.92 },
      { limiteSuperior: 45_012.6, aliquota: 0.15, parcelaDeduzir: 4_729.91 },
      { limiteSuperior: 55_976.16, aliquota: 0.225, parcelaDeduzir: 8_105.85 },
      { limiteSuperior: Number.POSITIVE_INFINITY, aliquota: 0.275, parcelaDeduzir: 10_904.66 },
    ],
    deducaoDependenteAnual: 2_275.08,
    limiteInstrucaoAnual: 3_561.5,
    limiteDescontoSimplificadoAnual: 17_640,
    temReducaoAnual: true,
  },
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= IMPOSTO_DE_RENDA_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isSupportedAnoCalendario(value: number): value is ImpostoDeRendaAnoCalendario {
  return value === 2025 || value === 2026;
}

function isSupportedModoDeducao(value: string): value is ImpostoDeRendaModoDeducao {
  return value === "auto" || value === "legais" || value === "simplificado";
}

function normalizeImpostoDeRendaInputs(inputs: ImpostoDeRendaInputs): ImpostoDeRendaInputs {
  return {
    ...inputs,
    rendimentosTributaveis: roundMoney(inputs.rendimentosTributaveis),
    rendimentosIsentos: roundMoney(inputs.rendimentosIsentos),
    rendimentosExclusivos: roundMoney(inputs.rendimentosExclusivos),
    impostoRetidoFonte: roundMoney(inputs.impostoRetidoFonte),
    carneLeaoPago: roundMoney(inputs.carneLeaoPago),
    impostoComplementarPago: roundMoney(inputs.impostoComplementarPago),
    previdenciaOficial: roundMoney(inputs.previdenciaOficial),
    pensaoAlimenticia: roundMoney(inputs.pensaoAlimenticia),
    despesasMedicas: roundMoney(inputs.despesasMedicas),
    despesasInstrucao: roundMoney(inputs.despesasInstrucao),
    previdenciaComplementar: roundMoney(inputs.previdenciaComplementar),
    livroCaixa: roundMoney(inputs.livroCaixa),
    outrasDeducoesLegais: roundMoney(inputs.outrasDeducoesLegais),
  };
}

export function getDefaultImpostoDeRendaInputs(): ImpostoDeRendaInputs {
  return {
    anoCalendario: 2025,
    rendimentosTributaveis: 0,
    rendimentosIsentos: 0,
    rendimentosExclusivos: 0,
    impostoRetidoFonte: 0,
    carneLeaoPago: 0,
    impostoComplementarPago: 0,
    dependentes: 0,
    previdenciaOficial: 0,
    pensaoAlimenticia: 0,
    despesasMedicas: 0,
    despesasInstrucao: 0,
    pessoasInstrucao: 0,
    previdenciaComplementar: 0,
    livroCaixa: 0,
    outrasDeducoesLegais: 0,
    modoDeducao: "auto",
  };
}

export function getImpostoDeRendaAnoConfig(anoCalendario: ImpostoDeRendaAnoCalendario): ImpostoDeRendaAnoConfig {
  return IMPOSTO_DE_RENDA_ANNUAL_CONFIGS[anoCalendario];
}

export function validateImpostoDeRendaInputs(inputs: ImpostoDeRendaInputs): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof ImpostoDeRendaInputs, number]> = [
    ["rendimentosTributaveis", inputs.rendimentosTributaveis],
    ["rendimentosIsentos", inputs.rendimentosIsentos],
    ["rendimentosExclusivos", inputs.rendimentosExclusivos],
    ["impostoRetidoFonte", inputs.impostoRetidoFonte],
    ["carneLeaoPago", inputs.carneLeaoPago],
    ["impostoComplementarPago", inputs.impostoComplementarPago],
    ["previdenciaOficial", inputs.previdenciaOficial],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
    ["despesasMedicas", inputs.despesasMedicas],
    ["despesasInstrucao", inputs.despesasInstrucao],
    ["previdenciaComplementar", inputs.previdenciaComplementar],
    ["livroCaixa", inputs.livroCaixa],
    ["outrasDeducoesLegais", inputs.outrasDeducoesLegais],
  ];

  for (const [field, value] of moneyFields) {
    if (!isMoney(value)) errors.push(String(field));
  }

  if (!isSupportedAnoCalendario(inputs.anoCalendario)) errors.push("anoCalendario");
  if (!isSupportedModoDeducao(inputs.modoDeducao)) errors.push("modoDeducao");
  if (!isIntegerRange(inputs.dependentes, 0, 30)) errors.push("dependentes");
  if (!isIntegerRange(inputs.pessoasInstrucao, 0, 30)) errors.push("pessoasInstrucao");

  return errors;
}

function findBracket(base: number, config: ImpostoDeRendaAnoConfig): ImpostoDeRendaBracket {
  return config.tabelaAnual.find((bracket) => base <= bracket.limiteSuperior) ?? config.tabelaAnual[0];
}

function calculateAnnualReduction(
  anoCalendario: ImpostoDeRendaAnoCalendario,
  rendimentosTributaveis: number,
  impostoAntesReducao: number
): number {
  if (anoCalendario !== 2026 || impostoAntesReducao <= 0) return 0;

  let reducao = 0;
  if (rendimentosTributaveis <= 60_000) {
    reducao = 2_694.15;
  } else if (rendimentosTributaveis <= 88_200) {
    reducao = Math.max(0, 8_429.73 - 0.095575 * rendimentosTributaveis);
  }

  return roundMoney(Math.min(impostoAntesReducao, reducao));
}

function calculateMethodResult(
  metodo: ImpostoDeRendaMetodoUsado,
  base: number,
  deducaoOuDesconto: number,
  anoCalendario: ImpostoDeRendaAnoCalendario,
  rendimentosTributaveis: number,
  config: ImpostoDeRendaAnoConfig
): ImpostoDeRendaMetodoResult {
  const bracket = findBracket(base, config);
  const impostoAntesReducao = roundMoney(Math.max(0, base * bracket.aliquota - bracket.parcelaDeduzir));
  const reducaoAnual = calculateAnnualReduction(anoCalendario, rendimentosTributaveis, impostoAntesReducao);
  const impostoDevido = roundMoney(Math.max(0, impostoAntesReducao - reducaoAnual));

  return {
    metodo,
    base: roundMoney(base),
    deducaoOuDesconto: roundMoney(deducaoOuDesconto),
    aliquotaFaixa: bracket.aliquota,
    parcelaDeduzir: bracket.parcelaDeduzir,
    impostoAntesReducao,
    reducaoAnual,
    impostoDevido,
  };
}

function chooseMethod(
  modoDeducao: ImpostoDeRendaModoDeducao,
  comparacao: Record<ImpostoDeRendaMetodoUsado, ImpostoDeRendaMetodoResult>
) {
  if (modoDeducao === "legais") return comparacao.legais;
  if (modoDeducao === "simplificado") return comparacao.simplificado;

  if (comparacao.legais.impostoDevido < comparacao.simplificado.impostoDevido) return comparacao.legais;
  return comparacao.simplificado;
}

function buildWarnings(
  inputs: ImpostoDeRendaInputs,
  totalDeducoesLegais: number,
  despesasInstrucaoExcedente: number,
  previdenciaComplementarExcedente: number
): ImpostoDeRendaWarningCode[] {
  const warnings: ImpostoDeRendaWarningCode[] = ["estimativaEducativa", "urlSensivel", "fontesConsultadas"];

  if (inputs.anoCalendario === 2026) warnings.push("anoCalendario2026");
  if (inputs.rendimentosIsentos > 0 || inputs.rendimentosExclusivos > 0) warnings.push("rendimentosInformativos");
  if (inputs.rendimentosTributaveis === 0 && totalDeducoesLegais > 0) warnings.push("deducoesSemRendimento");
  if (
    inputs.pensaoAlimenticia > 0 ||
    inputs.despesasMedicas > 0 ||
    inputs.livroCaixa > 0 ||
    inputs.outrasDeducoesLegais > 0 ||
    despesasInstrucaoExcedente > 0 ||
    previdenciaComplementarExcedente > 0
  ) {
    warnings.push("deducoesNaoValidadas");
  }

  return warnings;
}

export function calcularImpostoDeRenda(inputs: ImpostoDeRendaInputs): ResultadoImpostoDeRenda {
  const validationErrors = validateImpostoDeRendaInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid imposto-de-renda inputs: ${validationErrors.join(", ")}`);
  }

  const normalizedInputs = normalizeImpostoDeRendaInputs(inputs);
  const {
    anoCalendario,
    rendimentosTributaveis,
    rendimentosIsentos,
    rendimentosExclusivos,
    impostoRetidoFonte,
    carneLeaoPago,
    impostoComplementarPago,
    dependentes,
    previdenciaOficial,
    pensaoAlimenticia,
    despesasMedicas,
    despesasInstrucao,
    pessoasInstrucao,
    previdenciaComplementar,
    livroCaixa,
    outrasDeducoesLegais,
    modoDeducao,
  } = normalizedInputs;
  const config = getImpostoDeRendaAnoConfig(anoCalendario);

  const deducaoDependentes = roundMoney(dependentes * config.deducaoDependenteAnual);
  const despesasInstrucaoDedutivel = roundMoney(
    Math.min(despesasInstrucao, pessoasInstrucao * config.limiteInstrucaoAnual)
  );
  const despesasInstrucaoExcedente = roundMoney(Math.max(0, despesasInstrucao - despesasInstrucaoDedutivel));
  const previdenciaComplementarDedutivel = roundMoney(
    Math.min(previdenciaComplementar, rendimentosTributaveis * 0.12)
  );
  const previdenciaComplementarExcedente = roundMoney(
    Math.max(0, previdenciaComplementar - previdenciaComplementarDedutivel)
  );
  const totalDeducoesLegais = roundMoney(
    previdenciaOficial +
      pensaoAlimenticia +
      despesasMedicas +
      despesasInstrucaoDedutivel +
      deducaoDependentes +
      previdenciaComplementarDedutivel +
      livroCaixa +
      outrasDeducoesLegais
  );
  const descontoSimplificado = roundMoney(
    Math.min(rendimentosTributaveis * 0.2, config.limiteDescontoSimplificadoAnual)
  );
  const baseLegal = roundMoney(Math.max(0, rendimentosTributaveis - totalDeducoesLegais));
  const baseSimplificada = roundMoney(Math.max(0, rendimentosTributaveis - descontoSimplificado));
  const comparacao: Record<ImpostoDeRendaMetodoUsado, ImpostoDeRendaMetodoResult> = {
    legais: calculateMethodResult(
      "legais",
      baseLegal,
      totalDeducoesLegais,
      anoCalendario,
      rendimentosTributaveis,
      config
    ),
    simplificado: calculateMethodResult(
      "simplificado",
      baseSimplificada,
      descontoSimplificado,
      anoCalendario,
      rendimentosTributaveis,
      config
    ),
  };
  const selected = chooseMethod(modoDeducao, comparacao);
  const totalImpostoPago = roundMoney(impostoRetidoFonte + carneLeaoPago + impostoComplementarPago);
  const saldo = roundMoney(selected.impostoDevido - totalImpostoPago);
  const aliquotaEfetivaSobreRendimentos =
    rendimentosTributaveis > 0 ? roundRate(selected.impostoDevido / rendimentosTributaveis) : 0;
  const warnings = buildWarnings(
    normalizedInputs,
    totalDeducoesLegais,
    despesasInstrucaoExcedente,
    previdenciaComplementarExcedente
  );

  const breakdown: ImpostoDeRendaBreakdownRow[] = [
    {
      id: "rendimentosTributaveis",
      categoria: "rendimentos",
      valor: rendimentosTributaveis,
      aplicavel: true,
    },
    {
      id: "rendimentosIsentos",
      categoria: "rendimentos",
      valor: rendimentosIsentos,
      aplicavel: rendimentosIsentos > 0,
    },
    {
      id: "rendimentosExclusivos",
      categoria: "rendimentos",
      valor: rendimentosExclusivos,
      aplicavel: rendimentosExclusivos > 0,
    },
    {
      id: "deducaoDependentes",
      categoria: "deducoes",
      valor: deducaoDependentes,
      aplicavel: dependentes > 0,
      detalhe: dependentes.toString(),
    },
    {
      id: "despesasInstrucao",
      categoria: "deducoes",
      valor: despesasInstrucaoDedutivel,
      aplicavel: despesasInstrucao > 0,
      detalhe: despesasInstrucaoExcedente > 0 ? "limitada" : undefined,
    },
    {
      id: "previdenciaComplementar",
      categoria: "deducoes",
      valor: previdenciaComplementarDedutivel,
      aplicavel: previdenciaComplementar > 0,
      detalhe: previdenciaComplementarExcedente > 0 ? "limitada" : undefined,
    },
    {
      id: "totalDeducoesLegais",
      categoria: "deducoes",
      valor: totalDeducoesLegais,
      aplicavel: true,
    },
    {
      id: "descontoSimplificado",
      categoria: "deducoes",
      valor: descontoSimplificado,
      aplicavel: true,
    },
    {
      id: "baseLegal",
      categoria: "bases",
      valor: baseLegal,
      aplicavel: true,
    },
    {
      id: "baseSimplificada",
      categoria: "bases",
      valor: baseSimplificada,
      aplicavel: true,
    },
    {
      id: "baseUsada",
      categoria: "bases",
      valor: selected.base,
      aplicavel: true,
      detalhe: selected.metodo,
    },
    {
      id: "impostoAntesReducao",
      categoria: "imposto",
      valor: selected.impostoAntesReducao,
      aplicavel: true,
    },
    {
      id: "reducaoAnual",
      categoria: "imposto",
      valor: selected.reducaoAnual,
      aplicavel: anoCalendario === 2026,
    },
    {
      id: "impostoDevido",
      categoria: "imposto",
      valor: selected.impostoDevido,
      aplicavel: true,
    },
    {
      id: "totalImpostoPago",
      categoria: "saldo",
      valor: totalImpostoPago,
      aplicavel: totalImpostoPago > 0,
    },
    {
      id: "saldo",
      categoria: "saldo",
      valor: saldo,
      aplicavel: true,
      detalhe: saldo > 0 ? "pagar" : saldo < 0 ? "restituir" : "zero",
    },
  ];

  return {
    anoCalendario,
    exercicio: config.exercicio,
    sourceVersion: IMPOSTO_DE_RENDA_SOURCE_VERSION,
    sourceAccessDate: IMPOSTO_DE_RENDA_SOURCE_ACCESS_DATE,
    deducaoDependentes,
    despesasInstrucaoDedutivel,
    despesasInstrucaoExcedente,
    previdenciaComplementarDedutivel,
    previdenciaComplementarExcedente,
    totalDeducoesLegais,
    descontoSimplificado,
    baseLegal,
    baseSimplificada,
    baseUsada: selected.base,
    metodoUsado: selected.metodo,
    metodoSolicitado: modoDeducao,
    aliquotaFaixa: selected.aliquotaFaixa,
    parcelaDeduzir: selected.parcelaDeduzir,
    impostoAntesReducao: selected.impostoAntesReducao,
    reducaoAnual: selected.reducaoAnual,
    impostoDevido: selected.impostoDevido,
    totalImpostoPago,
    saldo,
    aliquotaEfetivaSobreRendimentos,
    comparacao,
    breakdown,
    warnings,
  };
}
