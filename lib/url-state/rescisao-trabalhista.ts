import {
  getAvisosPermitidos,
  validateRescisaoTrabalhistaInputs,
  type AvisoPrevio,
  type InputsRescisaoTrabalhista,
  type MotivoRescisao,
} from "../calculators/rescisao-trabalhista";

export const RESCISAO_TRABALHISTA_PARAM_KEYS = {
  salarioMensal: "s",
  mediaVariavelMensal: "mv",
  dataAdmissao: "ad",
  dataDesligamento: "dd",
  motivo: "mt",
  avisoPrevio: "av",
  diasTrabalhadosMes: "dt",
  feriasVencidasPeriodos: "fv",
  saldoFgts: "fg",
  saldoFgtsIncluiVerbasRescisorias: "fi",
  dependentesIr: "dep",
  adiantamentoDecimoTerceiro: "a13",
  adiantamentoFerias: "af",
  outrosCreditos: "oc",
  outrosDescontos: "od",
  calcularDescontosLegais: "dl",
} as const;

const MOTIVO_CODES: Record<MotivoRescisao, string> = {
  semJustaCausa: "sjc",
  pedidoDemissao: "pd",
  justaCausa: "jc",
  acordo: "ac",
  rescisaoIndireta: "ri",
};

const MOTIVO_DECODE: Record<string, MotivoRescisao> = {
  sjc: "semJustaCausa",
  pd: "pedidoDemissao",
  jc: "justaCausa",
  ac: "acordo",
  ri: "rescisaoIndireta",
};

const AVISO_CODES: Record<AvisoPrevio, string> = {
  trabalhado: "trab",
  indenizado: "ind",
  dispensado: "disp",
  descontado: "desc",
  naoSeAplica: "na",
};

const AVISO_DECODE: Record<string, AvisoPrevio> = {
  trab: "trabalhado",
  ind: "indenizado",
  disp: "dispensado",
  desc: "descontado",
  na: "naoSeAplica",
};

export interface RescisaoTrabalhistaUrlState {
  inputs: InputsRescisaoTrabalhista;
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

export function encodeRescisaoTrabalhistaState(state: RescisaoTrabalhistaUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.salarioMensal, inputs.salarioMensal.toString());
  if (inputs.mediaVariavelMensal > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.mediaVariavelMensal, inputs.mediaVariavelMensal.toString());
  }
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.dataAdmissao, inputs.dataAdmissao);
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.dataDesligamento, inputs.dataDesligamento);
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.motivo, MOTIVO_CODES[inputs.motivo]);
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.avisoPrevio, AVISO_CODES[inputs.avisoPrevio]);
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.diasTrabalhadosMes, inputs.diasTrabalhadosMes.toString());
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.feriasVencidasPeriodos, inputs.feriasVencidasPeriodos.toString());

  if (inputs.saldoFgts !== undefined) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.saldoFgts, inputs.saldoFgts.toString());
  }
  if (inputs.saldoFgtsIncluiVerbasRescisorias) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.saldoFgtsIncluiVerbasRescisorias, "1");
  }
  if (inputs.dependentesIr > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.dependentesIr, inputs.dependentesIr.toString());
  }
  if (inputs.adiantamentoDecimoTerceiro > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.adiantamentoDecimoTerceiro, inputs.adiantamentoDecimoTerceiro.toString());
  }
  if (inputs.adiantamentoFerias > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.adiantamentoFerias, inputs.adiantamentoFerias.toString());
  }
  if (inputs.outrosCreditos > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.outrosCreditos, inputs.outrosCreditos.toString());
  }
  if (inputs.outrosDescontos > 0) {
    params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.outrosDescontos, inputs.outrosDescontos.toString());
  }
  params.set(RESCISAO_TRABALHISTA_PARAM_KEYS.calcularDescontosLegais, inputs.calcularDescontosLegais ? "1" : "0");

  return params;
}

export function decodeRescisaoTrabalhistaState(params: URLSearchParams): RescisaoTrabalhistaUrlState | null {
  const salarioMensal = parseRequiredNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.salarioMensal);
  const dataAdmissao = params.get(RESCISAO_TRABALHISTA_PARAM_KEYS.dataAdmissao);
  const dataDesligamento = params.get(RESCISAO_TRABALHISTA_PARAM_KEYS.dataDesligamento);
  const motivo = MOTIVO_DECODE[params.get(RESCISAO_TRABALHISTA_PARAM_KEYS.motivo) ?? ""];
  const avisoPrevio = AVISO_DECODE[params.get(RESCISAO_TRABALHISTA_PARAM_KEYS.avisoPrevio) ?? ""];
  const diasTrabalhadosMes = parseRequiredInteger(params, RESCISAO_TRABALHISTA_PARAM_KEYS.diasTrabalhadosMes);
  const feriasVencidasPeriodos = parseRequiredInteger(
    params,
    RESCISAO_TRABALHISTA_PARAM_KEYS.feriasVencidasPeriodos
  );

  if (
    salarioMensal === null ||
    !dataAdmissao ||
    !dataDesligamento ||
    !motivo ||
    !avisoPrevio ||
    diasTrabalhadosMes === null ||
    feriasVencidasPeriodos === null
  ) {
    return null;
  }

  if (!getAvisosPermitidos(motivo).includes(avisoPrevio)) return null;

  const mediaVariavelMensal = parseOptionalNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.mediaVariavelMensal);
  const saldoFgts = parseOptionalNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.saldoFgts);
  const saldoFgtsIncluiVerbasRescisorias = parseBoolean(
    params,
    RESCISAO_TRABALHISTA_PARAM_KEYS.saldoFgtsIncluiVerbasRescisorias,
    false
  );
  const dependentesIr = parseOptionalInteger(params, RESCISAO_TRABALHISTA_PARAM_KEYS.dependentesIr, 0);
  const adiantamentoDecimoTerceiro = parseOptionalNumber(
    params,
    RESCISAO_TRABALHISTA_PARAM_KEYS.adiantamentoDecimoTerceiro
  );
  const adiantamentoFerias = parseOptionalNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.adiantamentoFerias);
  const outrosCreditos = parseOptionalNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.outrosCreditos);
  const outrosDescontos = parseOptionalNumber(params, RESCISAO_TRABALHISTA_PARAM_KEYS.outrosDescontos);
  const calcularDescontosLegais = parseBoolean(
    params,
    RESCISAO_TRABALHISTA_PARAM_KEYS.calcularDescontosLegais,
    true
  );

  if (
    mediaVariavelMensal === null ||
    saldoFgts === null ||
    saldoFgtsIncluiVerbasRescisorias === null ||
    dependentesIr === null ||
    adiantamentoDecimoTerceiro === null ||
    adiantamentoFerias === null ||
    outrosCreditos === null ||
    outrosDescontos === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: InputsRescisaoTrabalhista = {
    salarioMensal,
    mediaVariavelMensal: mediaVariavelMensal ?? 0,
    dataAdmissao,
    dataDesligamento,
    motivo,
    avisoPrevio,
    diasTrabalhadosMes,
    feriasVencidasPeriodos,
    saldoFgts,
    saldoFgtsIncluiVerbasRescisorias,
    dependentesIr,
    adiantamentoDecimoTerceiro: adiantamentoDecimoTerceiro ?? 0,
    adiantamentoFerias: adiantamentoFerias ?? 0,
    outrosCreditos: outrosCreditos ?? 0,
    outrosDescontos: outrosDescontos ?? 0,
    calcularDescontosLegais,
  };

  return validateRescisaoTrabalhistaInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateRescisaoTrabalhistaShareUrl(baseUrl: string, state: RescisaoTrabalhistaUrlState): string {
  const params = encodeRescisaoTrabalhistaState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}
