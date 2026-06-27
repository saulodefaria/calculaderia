import {
  IMPOSTO_DE_RENDA_SOURCE_VERSION,
  getDefaultImpostoDeRendaInputs,
  validateImpostoDeRendaInputs,
  type ImpostoDeRendaAnoCalendario,
  type ImpostoDeRendaInputs,
  type ImpostoDeRendaModoDeducao,
} from "../calculators/imposto-de-renda";

export const IMPOSTO_DE_RENDA_PARAM_KEYS = {
  sourceVersion: "sv",
  anoCalendario: "ac",
  rendimentosTributaveis: "rt",
  rendimentosIsentos: "ri",
  rendimentosExclusivos: "rx",
  impostoRetidoFonte: "ir",
  carneLeaoPago: "cl",
  impostoComplementarPago: "ic",
  dependentes: "dep",
  previdenciaOficial: "po",
  pensaoAlimenticia: "pa",
  despesasMedicas: "dm",
  despesasInstrucao: "di",
  pessoasInstrucao: "pi",
  previdenciaComplementar: "pg",
  livroCaixa: "lc",
  outrasDeducoesLegais: "od",
  modoDeducao: "md",
} as const;

export interface ImpostoDeRendaUrlState {
  inputs: ImpostoDeRendaInputs;
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
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function parseAnoCalendario(params: URLSearchParams): ImpostoDeRendaAnoCalendario | null {
  const raw = params.get(IMPOSTO_DE_RENDA_PARAM_KEYS.anoCalendario);
  if (raw === "2025") return 2025;
  if (raw === "2026") return 2026;
  return null;
}

function parseModoDeducao(params: URLSearchParams, fallback: ImpostoDeRendaModoDeducao): ImpostoDeRendaModoDeducao | null {
  const raw = params.get(IMPOSTO_DE_RENDA_PARAM_KEYS.modoDeducao);
  if (raw === null || raw === "") return fallback;
  if (raw === "auto" || raw === "legais" || raw === "simplificado") return raw;
  return null;
}

function setNumberIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) {
    params.set(key, value.toString());
  }
}

function setIntegerIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) {
    params.set(key, Math.trunc(value).toString());
  }
}

function setModeIfChanged(
  params: URLSearchParams,
  key: string,
  value: ImpostoDeRendaModoDeducao,
  defaultValue: ImpostoDeRendaModoDeducao
) {
  if (value !== defaultValue) {
    params.set(key, value);
  }
}

export function encodeImpostoDeRendaState(state: ImpostoDeRendaUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultImpostoDeRendaInputs();
  const { inputs } = state;

  params.set(IMPOSTO_DE_RENDA_PARAM_KEYS.sourceVersion, IMPOSTO_DE_RENDA_SOURCE_VERSION);
  params.set(IMPOSTO_DE_RENDA_PARAM_KEYS.anoCalendario, inputs.anoCalendario.toString());
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosTributaveis,
    inputs.rendimentosTributaveis,
    defaults.rendimentosTributaveis
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosIsentos,
    inputs.rendimentosIsentos,
    defaults.rendimentosIsentos
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosExclusivos,
    inputs.rendimentosExclusivos,
    defaults.rendimentosExclusivos
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.impostoRetidoFonte,
    inputs.impostoRetidoFonte,
    defaults.impostoRetidoFonte
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.carneLeaoPago,
    inputs.carneLeaoPago,
    defaults.carneLeaoPago
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.impostoComplementarPago,
    inputs.impostoComplementarPago,
    defaults.impostoComplementarPago
  );
  setIntegerIfChanged(params, IMPOSTO_DE_RENDA_PARAM_KEYS.dependentes, inputs.dependentes, defaults.dependentes);
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.previdenciaOficial,
    inputs.previdenciaOficial,
    defaults.previdenciaOficial
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.despesasMedicas,
    inputs.despesasMedicas,
    defaults.despesasMedicas
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.despesasInstrucao,
    inputs.despesasInstrucao,
    defaults.despesasInstrucao
  );
  setIntegerIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.pessoasInstrucao,
    inputs.pessoasInstrucao,
    defaults.pessoasInstrucao
  );
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.previdenciaComplementar,
    inputs.previdenciaComplementar,
    defaults.previdenciaComplementar
  );
  setNumberIfChanged(params, IMPOSTO_DE_RENDA_PARAM_KEYS.livroCaixa, inputs.livroCaixa, defaults.livroCaixa);
  setNumberIfChanged(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.outrasDeducoesLegais,
    inputs.outrasDeducoesLegais,
    defaults.outrasDeducoesLegais
  );
  setModeIfChanged(params, IMPOSTO_DE_RENDA_PARAM_KEYS.modoDeducao, inputs.modoDeducao, defaults.modoDeducao);

  return params;
}

export function decodeImpostoDeRendaState(params: URLSearchParams): ImpostoDeRendaUrlState | null {
  if (!params.toString()) return null;
  if (params.get(IMPOSTO_DE_RENDA_PARAM_KEYS.sourceVersion) !== IMPOSTO_DE_RENDA_SOURCE_VERSION) return null;

  const defaults = getDefaultImpostoDeRendaInputs();
  const anoCalendario = parseAnoCalendario(params);
  const rendimentosTributaveis = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosTributaveis,
    defaults.rendimentosTributaveis
  );
  const rendimentosIsentos = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosIsentos,
    defaults.rendimentosIsentos
  );
  const rendimentosExclusivos = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.rendimentosExclusivos,
    defaults.rendimentosExclusivos
  );
  const impostoRetidoFonte = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.impostoRetidoFonte,
    defaults.impostoRetidoFonte
  );
  const carneLeaoPago = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.carneLeaoPago,
    defaults.carneLeaoPago
  );
  const impostoComplementarPago = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.impostoComplementarPago,
    defaults.impostoComplementarPago
  );
  const dependentes = parseOptionalInteger(params, IMPOSTO_DE_RENDA_PARAM_KEYS.dependentes, defaults.dependentes);
  const previdenciaOficial = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.previdenciaOficial,
    defaults.previdenciaOficial
  );
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const despesasMedicas = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.despesasMedicas,
    defaults.despesasMedicas
  );
  const despesasInstrucao = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.despesasInstrucao,
    defaults.despesasInstrucao
  );
  const pessoasInstrucao = parseOptionalInteger(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.pessoasInstrucao,
    defaults.pessoasInstrucao
  );
  const previdenciaComplementar = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.previdenciaComplementar,
    defaults.previdenciaComplementar
  );
  const livroCaixa = parseOptionalNumber(params, IMPOSTO_DE_RENDA_PARAM_KEYS.livroCaixa, defaults.livroCaixa);
  const outrasDeducoesLegais = parseOptionalNumber(
    params,
    IMPOSTO_DE_RENDA_PARAM_KEYS.outrasDeducoesLegais,
    defaults.outrasDeducoesLegais
  );
  const modoDeducao = parseModoDeducao(params, defaults.modoDeducao);

  if (
    anoCalendario === null ||
    rendimentosTributaveis === null ||
    rendimentosIsentos === null ||
    rendimentosExclusivos === null ||
    impostoRetidoFonte === null ||
    carneLeaoPago === null ||
    impostoComplementarPago === null ||
    dependentes === null ||
    previdenciaOficial === null ||
    pensaoAlimenticia === null ||
    despesasMedicas === null ||
    despesasInstrucao === null ||
    pessoasInstrucao === null ||
    previdenciaComplementar === null ||
    livroCaixa === null ||
    outrasDeducoesLegais === null ||
    modoDeducao === null
  ) {
    return null;
  }

  const inputs: ImpostoDeRendaInputs = {
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
  };

  return validateImpostoDeRendaInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateImpostoDeRendaShareUrl(baseUrl: string, state: ImpostoDeRendaUrlState): string {
  const params = encodeImpostoDeRendaState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}
