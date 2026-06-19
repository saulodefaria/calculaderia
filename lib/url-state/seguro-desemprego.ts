import {
  getDefaultSeguroDesempregoInputs,
  validateSeguroDesempregoInputs,
  type SeguroDesempregoInputs,
  type SeguroDesempregoMotivoDispensa,
  type SeguroDesempregoNumeroSolicitacao,
} from "../calculators/seguro-desemprego";

export const SEGURO_DESEMPREGO_PARAM_KEYS = {
  salarioUltimo: "s1",
  salarioPenultimo: "s2",
  salarioAntepenultimo: "s3",
  numeroSolicitacao: "sol",
  mesesComSalarioElegibilidade: "me",
  mesesTrabalhados36: "m36",
  motivoDispensa: "mt",
  dataDispensa: "dd",
  dataRequerimento: "rq",
  desempregadoNoRequerimento: "de",
  semRendaPropriaSuficiente: "sr",
  semBeneficioContinuadoIncompativel: "bp",
  tabelaAno: "tb",
} as const;

const REQUEST_CODES: Record<SeguroDesempregoNumeroSolicitacao, string> = {
  primeira: "1",
  segunda: "2",
  terceiraOuMais: "3",
};

const REQUEST_DECODE: Record<string, SeguroDesempregoNumeroSolicitacao> = {
  "1": "primeira",
  "2": "segunda",
  "3": "terceiraOuMais",
};

const REASON_CODES: Record<SeguroDesempregoMotivoDispensa, string> = {
  semJustaCausa: "sjc",
  rescisaoIndireta: "ri",
  pedidoDemissao: "pd",
  justaCausa: "jc",
  acordo: "ac",
  pdv: "pdv",
  outro: "ot",
};

const REASON_DECODE: Record<string, SeguroDesempregoMotivoDispensa> = {
  sjc: "semJustaCausa",
  ri: "rescisaoIndireta",
  pd: "pedidoDemissao",
  jc: "justaCausa",
  ac: "acordo",
  pdv: "pdv",
  ot: "outro",
};

export interface SeguroDesempregoUrlState {
  inputs: SeguroDesempregoInputs;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalInteger(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function parseBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return null;
}

function setMoney(params: URLSearchParams, key: string, value: number) {
  if (value >= 0) {
    params.set(key, value.toString());
  }
}

export function encodeSeguroDesempregoState(state: SeguroDesempregoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.tabelaAno, "2026");
  setMoney(params, SEGURO_DESEMPREGO_PARAM_KEYS.salarioUltimo, inputs.salarioUltimo);
  setMoney(params, SEGURO_DESEMPREGO_PARAM_KEYS.salarioPenultimo, inputs.salarioPenultimo);
  setMoney(params, SEGURO_DESEMPREGO_PARAM_KEYS.salarioAntepenultimo, inputs.salarioAntepenultimo);
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.numeroSolicitacao, REQUEST_CODES[inputs.numeroSolicitacao]);
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.mesesComSalarioElegibilidade, inputs.mesesComSalarioElegibilidade.toString());
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.mesesTrabalhados36, inputs.mesesTrabalhados36.toString());
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.motivoDispensa, REASON_CODES[inputs.motivoDispensa]);
  if (inputs.dataDispensa) {
    params.set(SEGURO_DESEMPREGO_PARAM_KEYS.dataDispensa, inputs.dataDispensa);
  }
  if (inputs.dataRequerimento) {
    params.set(SEGURO_DESEMPREGO_PARAM_KEYS.dataRequerimento, inputs.dataRequerimento);
  }
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.desempregadoNoRequerimento, inputs.desempregadoNoRequerimento ? "1" : "0");
  params.set(SEGURO_DESEMPREGO_PARAM_KEYS.semRendaPropriaSuficiente, inputs.semRendaPropriaSuficiente ? "1" : "0");
  params.set(
    SEGURO_DESEMPREGO_PARAM_KEYS.semBeneficioContinuadoIncompativel,
    inputs.semBeneficioContinuadoIncompativel ? "1" : "0"
  );

  return params;
}

export function decodeSeguroDesempregoState(params: URLSearchParams): SeguroDesempregoUrlState | null {
  if (!params.toString()) return null;
  if (params.get(SEGURO_DESEMPREGO_PARAM_KEYS.tabelaAno) !== "2026") return null;

  const defaults = getDefaultSeguroDesempregoInputs();
  const salarioUltimo = parseOptionalNumber(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.salarioUltimo,
    defaults.salarioUltimo
  );
  const salarioPenultimo = parseOptionalNumber(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.salarioPenultimo,
    defaults.salarioPenultimo
  );
  const salarioAntepenultimo = parseOptionalNumber(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.salarioAntepenultimo,
    defaults.salarioAntepenultimo
  );
  const numeroSolicitacaoRaw = params.get(SEGURO_DESEMPREGO_PARAM_KEYS.numeroSolicitacao);
  const numeroSolicitacao = numeroSolicitacaoRaw
    ? REQUEST_DECODE[numeroSolicitacaoRaw]
    : defaults.numeroSolicitacao;
  const mesesComSalarioElegibilidade = parseOptionalInteger(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.mesesComSalarioElegibilidade,
    defaults.mesesComSalarioElegibilidade
  );
  const mesesTrabalhados36 = parseOptionalInteger(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.mesesTrabalhados36,
    defaults.mesesTrabalhados36
  );
  const motivoDispensaRaw = params.get(SEGURO_DESEMPREGO_PARAM_KEYS.motivoDispensa);
  const motivoDispensa = motivoDispensaRaw ? REASON_DECODE[motivoDispensaRaw] : defaults.motivoDispensa;
  const desempregadoNoRequerimento = parseBoolean(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.desempregadoNoRequerimento,
    defaults.desempregadoNoRequerimento
  );
  const semRendaPropriaSuficiente = parseBoolean(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.semRendaPropriaSuficiente,
    defaults.semRendaPropriaSuficiente
  );
  const semBeneficioContinuadoIncompativel = parseBoolean(
    params,
    SEGURO_DESEMPREGO_PARAM_KEYS.semBeneficioContinuadoIncompativel,
    defaults.semBeneficioContinuadoIncompativel
  );

  if (
    salarioUltimo === null ||
    salarioPenultimo === null ||
    salarioAntepenultimo === null ||
    !numeroSolicitacao ||
    mesesComSalarioElegibilidade === null ||
    mesesTrabalhados36 === null ||
    !motivoDispensa ||
    desempregadoNoRequerimento === null ||
    semRendaPropriaSuficiente === null ||
    semBeneficioContinuadoIncompativel === null
  ) {
    return null;
  }

  const inputs: SeguroDesempregoInputs = {
    salarioUltimo,
    salarioPenultimo,
    salarioAntepenultimo,
    numeroSolicitacao,
    mesesComSalarioElegibilidade,
    mesesTrabalhados36,
    motivoDispensa,
    dataDispensa: params.get(SEGURO_DESEMPREGO_PARAM_KEYS.dataDispensa) ?? defaults.dataDispensa,
    dataRequerimento: params.get(SEGURO_DESEMPREGO_PARAM_KEYS.dataRequerimento) ?? defaults.dataRequerimento,
    desempregadoNoRequerimento,
    semRendaPropriaSuficiente,
    semBeneficioContinuadoIncompativel,
    tabelaAno: 2026,
  };

  return validateSeguroDesempregoInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateSeguroDesempregoShareUrl(baseUrl: string, state: SeguroDesempregoUrlState): string {
  const params = encodeSeguroDesempregoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}
