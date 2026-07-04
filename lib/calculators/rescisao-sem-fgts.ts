import {
  calcularRescisaoTrabalhista,
  getDefaultRescisaoTrabalhistaInputs,
  validateRescisaoTrabalhistaInputs,
  type AvisoPrevio,
  type InputsRescisaoTrabalhista,
  type ResultadoRescisaoTrabalhista,
} from "./rescisao-trabalhista";

export const RESCISAO_SEM_FGTS_SOURCE_VERSION = "2026-07-04";

export type CenarioRescisaoSemFgts = "pedidoDemissao" | "justaCausa";
export type AvisoPrevioPedidoRescisaoSemFgts = Extract<AvisoPrevio, "trabalhado" | "dispensado" | "descontado">;

export interface InputsRescisaoSemFgts {
  salarioMensal: number;
  mediaVariavelMensal: number;
  dataAdmissao: string;
  dataDesligamento: string;
  cenarioSemFgts: CenarioRescisaoSemFgts;
  avisoPrevioPedido: AvisoPrevioPedidoRescisaoSemFgts;
  diasTrabalhadosMes: number;
  feriasVencidasPeriodos: number;
  dependentesIr: number;
  adiantamentoDecimoTerceiro: number;
  adiantamentoFerias: number;
  outrosCreditos: number;
  outrosDescontos: number;
  calcularDescontosLegais: boolean;
  sourceVersion: typeof RESCISAO_SEM_FGTS_SOURCE_VERSION;
}

export type ResultadoRescisaoSemFgts = ResultadoRescisaoTrabalhista;

const AVISOS_PEDIDO: AvisoPrevioPedidoRescisaoSemFgts[] = ["trabalhado", "dispensado", "descontado"];
const CENARIOS_SEM_FGTS: CenarioRescisaoSemFgts[] = ["pedidoDemissao", "justaCausa"];

export function getDefaultRescisaoSemFgtsInputs(today = new Date()): InputsRescisaoSemFgts {
  const defaults = getDefaultRescisaoTrabalhistaInputs(today);

  return {
    salarioMensal: defaults.salarioMensal,
    mediaVariavelMensal: defaults.mediaVariavelMensal,
    dataAdmissao: defaults.dataAdmissao,
    dataDesligamento: defaults.dataDesligamento,
    cenarioSemFgts: "pedidoDemissao",
    avisoPrevioPedido: "trabalhado",
    diasTrabalhadosMes: defaults.diasTrabalhadosMes,
    feriasVencidasPeriodos: defaults.feriasVencidasPeriodos,
    dependentesIr: defaults.dependentesIr,
    adiantamentoDecimoTerceiro: defaults.adiantamentoDecimoTerceiro,
    adiantamentoFerias: defaults.adiantamentoFerias,
    outrosCreditos: defaults.outrosCreditos,
    outrosDescontos: defaults.outrosDescontos,
    calcularDescontosLegais: defaults.calcularDescontosLegais,
    sourceVersion: RESCISAO_SEM_FGTS_SOURCE_VERSION,
  };
}

function isCenarioSemFgts(value: string): value is CenarioRescisaoSemFgts {
  return CENARIOS_SEM_FGTS.includes(value as CenarioRescisaoSemFgts);
}

function isAvisoPedido(value: string): value is AvisoPrevioPedidoRescisaoSemFgts {
  return AVISOS_PEDIDO.includes(value as AvisoPrevioPedidoRescisaoSemFgts);
}

export function mapRescisaoSemFgtsToCoreInputs(inputs: InputsRescisaoSemFgts): InputsRescisaoTrabalhista {
  return {
    salarioMensal: inputs.salarioMensal,
    mediaVariavelMensal: inputs.mediaVariavelMensal,
    dataAdmissao: inputs.dataAdmissao,
    dataDesligamento: inputs.dataDesligamento,
    motivo: inputs.cenarioSemFgts,
    avisoPrevio: inputs.cenarioSemFgts === "justaCausa" ? "naoSeAplica" : inputs.avisoPrevioPedido,
    diasTrabalhadosMes: inputs.diasTrabalhadosMes,
    feriasVencidasPeriodos: inputs.feriasVencidasPeriodos,
    saldoFgts: 0,
    saldoFgtsIncluiVerbasRescisorias: true,
    dependentesIr: inputs.dependentesIr,
    adiantamentoDecimoTerceiro: inputs.adiantamentoDecimoTerceiro,
    adiantamentoFerias: inputs.adiantamentoFerias,
    outrosCreditos: inputs.outrosCreditos,
    outrosDescontos: inputs.outrosDescontos,
    calcularDescontosLegais: inputs.calcularDescontosLegais,
  };
}

export function validateRescisaoSemFgtsInputs(inputs: InputsRescisaoSemFgts): string[] {
  const errors: string[] = [];
  const cenario = String(inputs.cenarioSemFgts);
  const aviso = String(inputs.avisoPrevioPedido);

  if (inputs.sourceVersion !== RESCISAO_SEM_FGTS_SOURCE_VERSION) {
    errors.push("sourceVersion");
  }
  if (!isCenarioSemFgts(cenario)) {
    errors.push("cenarioSemFgts");
  }
  if (!isAvisoPedido(aviso)) {
    errors.push("avisoPrevioPedido");
  }
  if (!Number.isFinite(inputs.salarioMensal) || inputs.salarioMensal <= 0) {
    errors.push("salarioMensal");
  }

  if (isCenarioSemFgts(cenario) && isAvisoPedido(aviso)) {
    errors.push(...validateRescisaoTrabalhistaInputs(mapRescisaoSemFgtsToCoreInputs(inputs)));
  }

  return Array.from(new Set(errors));
}

export function calcularRescisaoSemFgts(inputs: InputsRescisaoSemFgts): ResultadoRescisaoSemFgts {
  const errors = validateRescisaoSemFgtsInputs(inputs);
  if (errors.length > 0) {
    throw new RangeError(`Invalid rescisao sem FGTS inputs: ${errors.join(", ")}`);
  }

  return calcularRescisaoTrabalhista(mapRescisaoSemFgtsToCoreInputs(inputs));
}
