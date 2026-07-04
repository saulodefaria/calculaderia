import {
  RESCISAO_SEM_FGTS_SOURCE_VERSION,
  validateRescisaoSemFgtsInputs,
  type AvisoPrevioPedidoRescisaoSemFgts,
  type CenarioRescisaoSemFgts,
  type InputsRescisaoSemFgts,
} from "../calculators/rescisao-sem-fgts";

export const RESCISAO_SEM_FGTS_PARAM_KEYS = {
  sourceVersion: "sv",
  salarioMensal: "s",
  mediaVariavelMensal: "mv",
  dataAdmissao: "ad",
  dataDesligamento: "dd",
  cenarioSemFgts: "mt",
  avisoPrevioPedido: "av",
  diasTrabalhadosMes: "dt",
  feriasVencidasPeriodos: "fv",
  dependentesIr: "dep",
  adiantamentoDecimoTerceiro: "a13",
  adiantamentoFerias: "af",
  outrosCreditos: "oc",
  outrosDescontos: "od",
  calcularDescontosLegais: "dl",
} as const;

const CENARIO_CODES: Record<CenarioRescisaoSemFgts, string> = {
  pedidoDemissao: "pd",
  justaCausa: "jc",
};

const CENARIO_DECODE: Record<string, CenarioRescisaoSemFgts> = {
  pd: "pedidoDemissao",
  jc: "justaCausa",
};

const AVISO_CODES: Record<AvisoPrevioPedidoRescisaoSemFgts, string> = {
  trabalhado: "trab",
  dispensado: "disp",
  descontado: "desc",
};

const AVISO_DECODE: Record<string, AvisoPrevioPedidoRescisaoSemFgts> = {
  trab: "trabalhado",
  disp: "dispensado",
  desc: "descontado",
};

export interface RescisaoSemFgtsUrlState {
  inputs: InputsRescisaoSemFgts;
}

function parseRequiredNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalNumber(params: URLSearchParams, key: string): number | undefined | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseRequiredInteger(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
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

export function encodeRescisaoSemFgtsState(state: RescisaoSemFgtsUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.sourceVersion, RESCISAO_SEM_FGTS_SOURCE_VERSION);
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.salarioMensal, inputs.salarioMensal.toString());
  if (inputs.mediaVariavelMensal > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.mediaVariavelMensal, inputs.mediaVariavelMensal.toString());
  }
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.dataAdmissao, inputs.dataAdmissao);
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.dataDesligamento, inputs.dataDesligamento);
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.cenarioSemFgts, CENARIO_CODES[inputs.cenarioSemFgts]);
  if (inputs.cenarioSemFgts === "pedidoDemissao") {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.avisoPrevioPedido, AVISO_CODES[inputs.avisoPrevioPedido]);
  }
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.diasTrabalhadosMes, inputs.diasTrabalhadosMes.toString());
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.feriasVencidasPeriodos, inputs.feriasVencidasPeriodos.toString());
  if (inputs.dependentesIr > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.dependentesIr, inputs.dependentesIr.toString());
  }
  if (inputs.adiantamentoDecimoTerceiro > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.adiantamentoDecimoTerceiro, inputs.adiantamentoDecimoTerceiro.toString());
  }
  if (inputs.adiantamentoFerias > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.adiantamentoFerias, inputs.adiantamentoFerias.toString());
  }
  if (inputs.outrosCreditos > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.outrosCreditos, inputs.outrosCreditos.toString());
  }
  if (inputs.outrosDescontos > 0) {
    params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.outrosDescontos, inputs.outrosDescontos.toString());
  }
  params.set(RESCISAO_SEM_FGTS_PARAM_KEYS.calcularDescontosLegais, inputs.calcularDescontosLegais ? "1" : "0");

  return params;
}

export function decodeRescisaoSemFgtsState(params: URLSearchParams): RescisaoSemFgtsUrlState | null {
  if (params.get(RESCISAO_SEM_FGTS_PARAM_KEYS.sourceVersion) !== RESCISAO_SEM_FGTS_SOURCE_VERSION) {
    return null;
  }

  const salarioMensal = parseRequiredNumber(params, RESCISAO_SEM_FGTS_PARAM_KEYS.salarioMensal);
  const dataAdmissao = params.get(RESCISAO_SEM_FGTS_PARAM_KEYS.dataAdmissao);
  const dataDesligamento = params.get(RESCISAO_SEM_FGTS_PARAM_KEYS.dataDesligamento);
  const cenarioSemFgts = CENARIO_DECODE[params.get(RESCISAO_SEM_FGTS_PARAM_KEYS.cenarioSemFgts) ?? ""];
  const diasTrabalhadosMes = parseRequiredInteger(params, RESCISAO_SEM_FGTS_PARAM_KEYS.diasTrabalhadosMes);
  const feriasVencidasPeriodos = parseRequiredInteger(
    params,
    RESCISAO_SEM_FGTS_PARAM_KEYS.feriasVencidasPeriodos
  );

  if (
    salarioMensal === null ||
    !dataAdmissao ||
    !dataDesligamento ||
    !cenarioSemFgts ||
    diasTrabalhadosMes === null ||
    feriasVencidasPeriodos === null
  ) {
    return null;
  }

  const rawAviso = params.get(RESCISAO_SEM_FGTS_PARAM_KEYS.avisoPrevioPedido);
  const avisoPrevioPedido =
    cenarioSemFgts === "justaCausa"
      ? rawAviso && rawAviso !== "na" && !AVISO_DECODE[rawAviso]
        ? null
        : "trabalhado"
      : AVISO_DECODE[rawAviso ?? "trab"];

  if (!avisoPrevioPedido) return null;

  const mediaVariavelMensal = parseOptionalNumber(params, RESCISAO_SEM_FGTS_PARAM_KEYS.mediaVariavelMensal);
  const dependentesIr = parseOptionalInteger(params, RESCISAO_SEM_FGTS_PARAM_KEYS.dependentesIr, 0);
  const adiantamentoDecimoTerceiro = parseOptionalNumber(
    params,
    RESCISAO_SEM_FGTS_PARAM_KEYS.adiantamentoDecimoTerceiro
  );
  const adiantamentoFerias = parseOptionalNumber(params, RESCISAO_SEM_FGTS_PARAM_KEYS.adiantamentoFerias);
  const outrosCreditos = parseOptionalNumber(params, RESCISAO_SEM_FGTS_PARAM_KEYS.outrosCreditos);
  const outrosDescontos = parseOptionalNumber(params, RESCISAO_SEM_FGTS_PARAM_KEYS.outrosDescontos);
  const calcularDescontosLegais = parseBoolean(
    params,
    RESCISAO_SEM_FGTS_PARAM_KEYS.calcularDescontosLegais,
    true
  );

  if (
    mediaVariavelMensal === null ||
    dependentesIr === null ||
    adiantamentoDecimoTerceiro === null ||
    adiantamentoFerias === null ||
    outrosCreditos === null ||
    outrosDescontos === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: InputsRescisaoSemFgts = {
    salarioMensal,
    mediaVariavelMensal: mediaVariavelMensal ?? 0,
    dataAdmissao,
    dataDesligamento,
    cenarioSemFgts,
    avisoPrevioPedido,
    diasTrabalhadosMes,
    feriasVencidasPeriodos,
    dependentesIr,
    adiantamentoDecimoTerceiro: adiantamentoDecimoTerceiro ?? 0,
    adiantamentoFerias: adiantamentoFerias ?? 0,
    outrosCreditos: outrosCreditos ?? 0,
    outrosDescontos: outrosDescontos ?? 0,
    calcularDescontosLegais,
    sourceVersion: RESCISAO_SEM_FGTS_SOURCE_VERSION,
  };

  return validateRescisaoSemFgtsInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateRescisaoSemFgtsShareUrl(baseUrl: string, state: RescisaoSemFgtsUrlState): string {
  const params = encodeRescisaoSemFgtsState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}
