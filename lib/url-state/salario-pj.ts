import {
  getDefaultSalarioPjInputs,
  isSalarioPjAnexoMode,
  isSalarioPjInssPessoaFisicaMode,
  validateSalarioPjInputs,
  type SalarioPjAnexoMode,
  type SalarioPjInssPessoaFisicaMode,
  type SalarioPjInputs,
} from "../calculators/salario-pj";

export const SALARIO_PJ_PARAM_KEYS = {
  tabelaAno: "tb",
  receitaMensal: "r",
  rbt12: "rbt",
  fs12: "fs",
  anexoMode: "an",
  aliquotaManualEfetiva: "am",
  proLaboreMensal: "pl",
  inssPessoaFisicaMode: "im",
  inssManual: "in",
  calcularIrrfProLabore: "ir",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  contabilidadeMensal: "ct",
  custosOperacionais: "co",
  beneficiosPessoais: "bp",
  outrasRetencoes: "or",
} as const;

export interface SalarioPjUrlState {
  inputs: SalarioPjInputs;
}

const ANEXO_MODE_TO_PARAM: Record<SalarioPjAnexoMode, string> = {
  autoFatorR: "auto",
  anexoIII: "iii",
  anexoV: "v",
  aliquotaManual: "man",
};

const PARAM_TO_ANEXO_MODE: Record<string, SalarioPjAnexoMode> = {
  auto: "autoFatorR",
  iii: "anexoIII",
  v: "anexoV",
  man: "aliquotaManual",
};

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

function parseAnexoMode(params: URLSearchParams, fallback: SalarioPjAnexoMode): SalarioPjAnexoMode | null {
  const raw = params.get(SALARIO_PJ_PARAM_KEYS.anexoMode);
  if (raw === null || raw === "") return fallback;
  const expanded = PARAM_TO_ANEXO_MODE[raw] ?? raw;
  return isSalarioPjAnexoMode(expanded) ? expanded : null;
}

function parseInssMode(
  params: URLSearchParams,
  fallback: SalarioPjInssPessoaFisicaMode
): SalarioPjInssPessoaFisicaMode | null {
  const raw = params.get(SALARIO_PJ_PARAM_KEYS.inssPessoaFisicaMode);
  if (raw === null || raw === "") return fallback;
  return isSalarioPjInssPessoaFisicaMode(raw) ? raw : null;
}

function setNumberIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) {
    params.set(key, value.toString());
  }
}

function setBooleanIfChanged(params: URLSearchParams, key: string, value: boolean, defaultValue: boolean) {
  if (value !== defaultValue) {
    params.set(key, value ? "1" : "0");
  }
}

export function encodeSalarioPjState(state: SalarioPjUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultSalarioPjInputs();
  const { inputs } = state;

  params.set(SALARIO_PJ_PARAM_KEYS.tabelaAno, "2026");
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.receitaMensal, inputs.receitaMensal, defaults.receitaMensal);
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.rbt12, inputs.rbt12, defaults.rbt12);
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.fs12, inputs.fs12, defaults.fs12);

  if (inputs.anexoMode !== defaults.anexoMode) {
    params.set(SALARIO_PJ_PARAM_KEYS.anexoMode, ANEXO_MODE_TO_PARAM[inputs.anexoMode]);
  }

  setNumberIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.aliquotaManualEfetiva,
    inputs.aliquotaManualEfetiva,
    defaults.aliquotaManualEfetiva
  );
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.proLaboreMensal, inputs.proLaboreMensal, defaults.proLaboreMensal);

  if (inputs.inssPessoaFisicaMode !== defaults.inssPessoaFisicaMode) {
    params.set(SALARIO_PJ_PARAM_KEYS.inssPessoaFisicaMode, inputs.inssPessoaFisicaMode);
  }

  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.inssManual, inputs.inssManual, defaults.inssManual);
  setBooleanIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.calcularIrrfProLabore,
    inputs.calcularIrrfProLabore,
    defaults.calcularIrrfProLabore
  );
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.dependentesIr, inputs.dependentesIr, defaults.dependentesIr);
  setNumberIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  setNumberIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.contabilidadeMensal,
    inputs.contabilidadeMensal,
    defaults.contabilidadeMensal
  );
  setNumberIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.custosOperacionais,
    inputs.custosOperacionais,
    defaults.custosOperacionais
  );
  setNumberIfChanged(
    params,
    SALARIO_PJ_PARAM_KEYS.beneficiosPessoais,
    inputs.beneficiosPessoais,
    defaults.beneficiosPessoais
  );
  setNumberIfChanged(params, SALARIO_PJ_PARAM_KEYS.outrasRetencoes, inputs.outrasRetencoes, defaults.outrasRetencoes);

  return params;
}

export function decodeSalarioPjState(params: URLSearchParams): SalarioPjUrlState | null {
  if (!params.toString()) return null;
  if (params.get(SALARIO_PJ_PARAM_KEYS.tabelaAno) !== "2026") return null;

  const defaults = getDefaultSalarioPjInputs();
  const receitaMensal = parseOptionalNumber(params, SALARIO_PJ_PARAM_KEYS.receitaMensal, defaults.receitaMensal);
  const rbt12 = parseOptionalNumber(params, SALARIO_PJ_PARAM_KEYS.rbt12, defaults.rbt12);
  const fs12 = parseOptionalNumber(params, SALARIO_PJ_PARAM_KEYS.fs12, defaults.fs12);
  const anexoMode = parseAnexoMode(params, defaults.anexoMode);
  const aliquotaManualEfetiva = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.aliquotaManualEfetiva,
    defaults.aliquotaManualEfetiva
  );
  const proLaboreMensal = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.proLaboreMensal,
    defaults.proLaboreMensal
  );
  const inssPessoaFisicaMode = parseInssMode(params, defaults.inssPessoaFisicaMode);
  const inssManual = parseOptionalNumber(params, SALARIO_PJ_PARAM_KEYS.inssManual, defaults.inssManual);
  const calcularIrrfProLabore = parseBoolean(
    params,
    SALARIO_PJ_PARAM_KEYS.calcularIrrfProLabore,
    defaults.calcularIrrfProLabore
  );
  const dependentesIr = parseOptionalInteger(params, SALARIO_PJ_PARAM_KEYS.dependentesIr, defaults.dependentesIr);
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const contabilidadeMensal = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.contabilidadeMensal,
    defaults.contabilidadeMensal
  );
  const custosOperacionais = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.custosOperacionais,
    defaults.custosOperacionais
  );
  const beneficiosPessoais = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.beneficiosPessoais,
    defaults.beneficiosPessoais
  );
  const outrasRetencoes = parseOptionalNumber(
    params,
    SALARIO_PJ_PARAM_KEYS.outrasRetencoes,
    defaults.outrasRetencoes
  );

  if (
    receitaMensal === null ||
    rbt12 === null ||
    fs12 === null ||
    anexoMode === null ||
    aliquotaManualEfetiva === null ||
    proLaboreMensal === null ||
    inssPessoaFisicaMode === null ||
    inssManual === null ||
    calcularIrrfProLabore === null ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    contabilidadeMensal === null ||
    custosOperacionais === null ||
    beneficiosPessoais === null ||
    outrasRetencoes === null
  ) {
    return null;
  }

  const inputs: SalarioPjInputs = {
    receitaMensal,
    rbt12,
    fs12,
    anexoMode,
    aliquotaManualEfetiva,
    proLaboreMensal,
    inssPessoaFisicaMode,
    inssManual,
    calcularIrrfProLabore,
    dependentesIr,
    pensaoAlimenticia,
    contabilidadeMensal,
    custosOperacionais,
    beneficiosPessoais,
    outrasRetencoes,
    tabelaAno: 2026,
  };

  return validateSalarioPjInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateSalarioPjShareUrl(baseUrl: string, state: SalarioPjUrlState): string {
  const params = encodeSalarioPjState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}
