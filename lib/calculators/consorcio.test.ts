import { describe, it, expect } from "vitest";
import { calculateIrr, getAluguelCorrigidoNoMes, round2 } from "../utils";
import {
  calcularConsorcio,
  recalcularConsorcioComAmortizacoes,
  type InputsConsorcio,
  type AmortizacaoAdicionalConsorcio,
} from "./consorcio";

describe("calcularConsorcio - sem lance", () => {
  it("calcula parcelas constantes sem correção anual", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const r = calcularConsorcio(inputs);

    expect(r.valorBem).toBe(1200);
    expect(r.valorBemFinal).toBe(1200);
    expect(r.parcelas).toHaveLength(12);

    // Fundo e taxa constantes
    expect(r.parcelas[0].fundoComum).toBeCloseTo(100, 2);
    expect(r.parcelas[0].taxaAdministracao).toBeCloseTo(12, 2);
    expect(r.parcelas[0].parcela).toBeCloseTo(112, 2);
    expect(r.parcelas[0].saldoDevedor).toBeCloseTo(1100, 2);
    expect(r.parcelas[0].correcaoAplicada).toBe(0);
    expect(r.parcelas[0].anoCorrente).toBe(1);

    // Última parcela quita o saldo do bem
    expect(r.parcelas[11].saldoDevedor).toBeCloseTo(0, 2);

    // Totais
    expect(r.totalTaxaAdministracao).toBeCloseTo(144, 2);
    expect(r.totalPago).toBeCloseTo(1344, 2);
    expect(r.primeiraParcela).toBeCloseTo(112, 2);
    expect(r.ultimaParcela).toBeCloseTo(112, 2);

    // TIR existe (há mudança de sinal: pagamentos negativos e bem positivo no final)
    expect(r.tirMensal).not.toBeNull();
    expect(r.tirMensal!).toBeLessThan(0);
    expect(r.tirAnual).not.toBeNull();
  });

  it("aplica correção anual no mês 13 (degrau anual)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 24,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 10,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const r = calcularConsorcio(inputs);

    expect(r.parcelas).toHaveLength(24);

    // Mês 12: ainda sem correção
    const p12 = r.parcelas[11];
    expect(p12.mes).toBe(12);
    expect(p12.correcaoAplicada).toBe(0);
    expect(p12.anoCorrente).toBe(1);
    expect(p12.parcela).toBeCloseTo(56, 2); // 50 + 6

    // Mês 13: aplica correção de 10% no valor do bem e no saldo
    const p13 = r.parcelas[12];
    expect(p13.mes).toBe(13);
    expect(p13.correcaoAplicada).toBe(10);
    expect(p13.anoCorrente).toBe(2);
    expect(p13.fundoComum).toBeCloseTo(55, 2); // 1320 / 24
    expect(p13.taxaAdministracao).toBeCloseTo(6.6, 2); // 12% / 24 * 1320
    expect(p13.parcela).toBeCloseTo(61.6, 2);
    expect(p13.saldoDevedor).toBeCloseTo(605, 2); // saldo corrigido (660) - fundo (55)

    // Valor final do bem deve refletir a correção aplicada (apenas uma vez em 24 meses)
    expect(r.valorBemFinal).toBeCloseTo(1320, 2);

    // Totais por degrau anual:
    // 12 meses a 56 + 12 meses a 61.6
    expect(r.totalPago).toBeCloseTo(1411.2, 2);
    expect(r.totalTaxaAdministracao).toBeCloseTo(151.2, 2);
  });

  it("inclui ágio no total pago e reduz a TIR", () => {
    const baseInputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const base = calcularConsorcio(baseInputs);
    const comAgio = calcularConsorcio({ ...baseInputs, agio: 100 });

    expect(comAgio.totalPago).toBeCloseTo(base.totalPago + 100, 2);
    expect(comAgio.agio).toBe(100);

    expect(base.tirMensal).not.toBeNull();
    expect(comAgio.tirMensal).not.toBeNull();

    // Ágio adiciona saída no mês 1 => TIR pior (mais negativa, ou menor)
    expect(comAgio.tirMensal!).toBeLessThan(base.tirMensal!);
  });

  it("retorna TIR nula quando não há mudança de sinal nos fluxos (todos fluxos não-negativos)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 1000, // maior que a parcela => fluxo mensal positivo desde o mês 1
      correcaoAnualAluguel: 0,
    };

    const r = calcularConsorcio(inputs);
    expect(r.tirMensal).toBeNull();
    expect(r.tirAnual).toBeNull();
  });

  it("permite cashflow mensal positivo quando aluguel > parcela (após contemplação)", () => {
    const baseInputs: InputsConsorcio = {
      valorBem: 200_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      mesContemplacao: 6,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      agio: 0,
    };

    const base = calcularConsorcio(baseInputs);
    const parcelaBase = base.parcelas[0]?.parcela ?? 0;
    expect(parcelaBase).toBeGreaterThan(0);

    // Garante aluguel acima da parcela (fluxo positivo após contemplação).
    const aluguelMensal = round2(parcelaBase + 100);

    const inputs: InputsConsorcio = {
      ...baseInputs,
      aluguelMensal,
      correcaoAnualAluguel: 0,
    };

    const resultado = calcularConsorcio(inputs);
    expect(resultado.tirMensal).not.toBeNull();

    const mesContemplacao = inputs.mesContemplacao ?? 1;

    const cashflows = resultado.parcelas.map((p) => {
      const aluguelNoMes = p.mes >= mesContemplacao ? getAluguelCorrigidoNoMes(p.mes, aluguelMensal, 0) : 0;
      return round2(aluguelNoMes - p.parcela);
    });

    // Valor do bem no último mês
    cashflows[cashflows.length - 1] += resultado.valorBemFinal;

    // Meses antes da contemplação devem ser negativos (sem aluguel).
    expect(cashflows.slice(0, mesContemplacao - 1).every((cf) => cf < 0)).toBe(true);
    // Após contemplação deve existir mês positivo por causa do aluguel > parcela.
    expect(cashflows.slice(mesContemplacao - 1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });

  it("aplica correção anual também no mês 25 (2º degrau anual) em prazos longos", () => {
    const inputs: InputsConsorcio = {
      valorBem: 3600, // evita dízimas: 3600/36 = 100
      meses: 36,
      taxaAdministracaoTotal: 12, // mensal = 12 (pois (12%/36)*3600 = 12)
      correcaoAnual: 10,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const r = calcularConsorcio(inputs);
    expect(r.parcelas).toHaveLength(36);

    const p13 = r.parcelas[12];
    expect(p13.mes).toBe(13);
    expect(p13.correcaoAplicada).toBe(10);
    expect(p13.anoCorrente).toBe(2);
    expect(p13.fundoComum).toBeCloseTo(110, 2); // 3960 / 36
    expect(p13.taxaAdministracao).toBeCloseTo(13.2, 2);
    expect(p13.saldoDevedor).toBeCloseTo(2530, 2); // (2400*1.1)=2640 -110

    const p25 = r.parcelas[24];
    expect(p25.mes).toBe(25);
    expect(p25.correcaoAplicada).toBe(10);
    expect(p25.anoCorrente).toBe(3);
    expect(p25.fundoComum).toBeCloseTo(121, 2); // 4356 / 36
    expect(p25.taxaAdministracao).toBeCloseTo(14.52, 2);
    expect(p25.saldoDevedor).toBeCloseTo(1331, 2); // (1320*1.1)=1452 -121

    expect(r.valorBemFinal).toBeCloseTo(4356, 2);
  });
});

describe("calcularConsorcio - com lance", () => {
  it("aplica lance proporcionalmente ao fundo e taxa e reduz o prazo, mantendo total pago quando não há correção", () => {
    const semLanceInputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const comLanceInputs: InputsConsorcio = {
      ...semLanceInputs,
      lance: { mes: 1, valor: 200 },
    };

    const semLance = calcularConsorcio(semLanceInputs);
    const comLance = calcularConsorcio(comLanceInputs);

    // No modelo proporcional, sem correção anual, o lance apenas antecipa pagamentos:
    // o total pago (bem + taxa) permanece o mesmo, mas o prazo diminui.
    expect(comLance.totalPago).toBeCloseTo(semLance.totalPago, 2);
    expect(comLance.totalTaxaAdministracao).toBeCloseTo(semLance.totalTaxaAdministracao, 2);
    expect(comLance.parcelas.length).toBeLessThan(semLance.parcelas.length);
    expect(comLance.parcelas).toHaveLength(11);

    // Mês 1: parcela inclui o lance (pagamento total no mês)
    const p1 = comLance.parcelas[0];
    expect(p1.fundoComum).toBeCloseTo(100, 2);
    expect(p1.taxaAdministracao).toBeCloseTo(12, 2);
    expect(p1.parcela).toBeCloseTo(312, 2); // 112 + 200

    // Distribuição proporcional do lance após pagar a parcela:
    // saldo após parcela: fundo=1100, taxa=132, total=1232
    // lance=200 => abateFundo=178.57, abateTaxa=21.43
    expect(p1.saldoDevedor).toBeCloseTo(921.43, 2);
  });

  it("limita lance ao saldo restante e quita em 1 mês quando o lance é muito alto (sem correção)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      lance: { mes: 1, valor: 999999 },
    };

    const r = calcularConsorcio(inputs);

    // Quitação total em 1 mês (pagamento base + lance efetivo limitado ao saldo)
    expect(r.parcelas).toHaveLength(1);
    expect(r.parcelas[0].saldoDevedor).toBeCloseTo(0, 2);

    // Total pago segue sendo bem + taxa
    expect(r.totalTaxaAdministracao).toBeCloseTo(144, 2);
    expect(r.totalPago).toBeCloseTo(1344, 2);
    expect(r.parcelas[0].parcela).toBeCloseTo(1344, 2);
  });
});

describe("recalcularConsorcioComAmortizacoes", () => {
  it("tipo PRAZO: amortização adicional reduz o prazo e mantém parcela base (sem correção)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 1, valor: 200, tipo: "prazo" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    expect(r.mesesOriginais).toBe(12);
    expect(r.mesesComAdicionais).toBeLessThan(12);
    expect(r.mesesComAdicionais).toBe(11);
    expect(r.totalAmortizacoesAdicionais).toBeCloseTo(200, 2);

    // Parcela base permanece a mesma (112) ao longo do cronograma, exceto quitação final
    const parcelaBase = r.parcelas[0].parcela;
    expect(parcelaBase).toBeCloseTo(112, 2);
    for (let i = 0; i < r.parcelas.length - 1; i++) {
      expect(r.parcelas[i].parcela).toBeCloseTo(parcelaBase, 2);
    }

    // Sem correção anual, amortização apenas antecipa pagamentos: total pago e taxa total não mudam
    expect(r.totalPagoComAdicionais).toBeCloseTo(r.totalPagoOriginal, 2);
    expect(r.totalTaxaAdministracaoComAdicionais).toBeCloseTo(r.totalTaxaAdministracaoOriginal, 2);
    expect(r.economiaTaxa).toBeCloseTo(0, 2);
    expect(r.economiaMeses).toBe(1);
  });

  it("tipo PARCELA: mantém prazo e reduz a parcela base após o mês do lance (sem correção)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 6, valor: 24_000, tipo: "parcela" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    expect(r.mesesComAdicionais).toBe(24);
    expect(r.parcelas[5].amortizacaoAdicional).toBeCloseTo(24_000, 2);
    expect(r.parcelas[5].tipoAdicional).toBe("parcela");

    // Antes da amortização: parcela base = 120000/24 + 10% = 5000 + 500 = 5500
    expect(r.parcelas[0].parcela).toBeCloseTo(5500, 2);
    expect(r.parcelas[5].parcela).toBeCloseTo(5500, 2);

    // Após amortização (mês 7 em diante), parcela base deve ser menor
    expect(r.parcelas[6].parcela).toBeLessThan(r.parcelas[5].parcela);

    // Sem correção anual, total pago e taxa total permanecem iguais
    expect(r.totalPagoComAdicionais).toBeCloseTo(r.totalPagoOriginal, 2);
    expect(r.economiaTaxa).toBeCloseTo(0, 2);
    expect(r.economiaMeses).toBe(0);
  });

  it("prazo -> parcela: após reduzir o prazo (lance/PRAZO), uma amortização PARCELA posterior mantém o prazo atual (não volta ao original)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      lance: { mes: 1, valor: 60_000 }, // reduz bastante o prazo
    };

    // Sem amortizações extras do usuário, mas com lance inicial (que é incluído internamente)
    const rSomenteLance = recalcularConsorcioComAmortizacoes(inputs, []);
    expect(rSomenteLance.mesesComAdicionais).toBeLessThan(inputs.meses);
    // Garantir que o mês 6 exista para aplicar a amortização posterior
    expect(rSomenteLance.mesesComAdicionais).toBeGreaterThan(6);

    const rMix = recalcularConsorcioComAmortizacoes(inputs, [{ mes: 6, valor: 5_000, tipo: "parcela" }]);

    // BUG (regressão): antes do fix, podia "esticar" e aproximar do prazo original.
    // Regra: manter o prazo atual (já reduzido pelo lance) e ajustar a parcela no tempo restante.
    expect(rMix.mesesComAdicionais).toBeLessThanOrEqual(rSomenteLance.mesesComAdicionais + 1);

    // Após o mês 6, a parcela base deve cair por ser tipo "parcela"
    const p6 = rMix.parcelas[5];
    const p7 = rMix.parcelas[6];
    expect(p6.mes).toBe(6);
    expect(p7.mes).toBe(7);
    expect(p7.parcela).toBeLessThan(p6.parcela);
  });

  it("com correção anual: amortização grande pode evitar o reajuste do mês 13 e gerar economia (modelo INCC/IPCA)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 10,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const original = calcularConsorcio(inputs);
    expect(original.valorBemFinal).toBeCloseTo(132_000, 2); // correção no mês 13
    expect(original.totalTaxaAdministracao).toBeCloseTo(12_600, 2);
    expect(original.totalPago).toBeCloseTo(138_600, 2);

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 1, valor: 70_000, tipo: "prazo" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    // A amortização foi desenhada para quitar até o mês 12 e evitar o reajuste do mês 13.
    expect(r.mesesComAdicionais).toBe(12);
    expect(r.valorBemFinal).toBeCloseTo(120_000, 2);

    // Totais sem aplicar a correção: paga-se "bem + taxa" originais
    expect(r.totalTaxaAdministracaoComAdicionais).toBeCloseTo(12_000, 2);
    expect(r.totalPagoComAdicionais).toBeCloseTo(132_000, 2);

    // Economia de taxa corresponde ao que seria reajustado no segundo ano (600 = 10% de 6000)
    expect(r.economiaTaxa).toBeCloseTo(600, 2);
    expect(r.totalPagoComAdicionais).toBeLessThan(r.totalPagoOriginal);
    expect(r.economiaMeses).toBe(12);
  });

  it("inclui lance inicial e ágio no cenário com amortizações adicionais (correção de consistência)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 100,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      lance: { mes: 1, valor: 200 },
    };

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 2, valor: 100, tipo: "prazo" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    // O lance inicial deve entrar como amortização adicional no mês 1
    expect(r.parcelas[0].amortizacaoAdicional).toBeCloseTo(200, 2);
    // E a amortização extra do usuário entra no mês 2
    expect(r.parcelas[1].amortizacaoAdicional).toBeCloseTo(100, 2);
    expect(r.totalAmortizacoesAdicionais).toBeCloseTo(300, 2);

    // Sem correção anual: total pago continua sendo (bem + taxa) + ágio, independente de antecipar parcelas
    expect(r.totalPagoComAdicionais).toBeCloseTo(1344 + 100, 2);
    expect(r.totalPagoOriginal).toBeCloseTo(1344 + 100, 2);

    // TIR com amortizações adicionais deve considerar o ágio como saída no mês 1.
    // Reconstroi cashflows do cenário "com adicionais" (pagamentos = parcela + adicional).
    // Note: agio is now included in parcela for month 1, so we don't subtract it separately
    const cashflows = r.parcelas.map((p) => round2(0 - round2(p.parcela + p.amortizacaoAdicional)));
    cashflows[cashflows.length - 1] += r.valorBemFinal;

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(r.tirMensalComAdicionais).toBeCloseTo(irrEsperada!, 8);
  });

  it("se existir amortização no mesmo mês do lance inicial, soma valores e preserva o tipo do usuário", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 6,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      lance: { mes: 6, valor: 10_000 },
    };

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 6, valor: 5_000, tipo: "parcela" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    // Mês 6 deve somar 10k (lance) + 5k (extra) = 15k e preservar tipo "parcela"
    expect(r.parcelas[5].amortizacaoAdicional).toBeCloseTo(15_000, 2);
    expect(r.parcelas[5].tipoAdicional).toBe("parcela");

    // E, por ser "parcela", a parcela base após o mês 6 deve cair
    expect(r.parcelas[6].parcela).toBeLessThan(r.parcelas[5].parcela);
  });

  it("calcula TIR com aluguel no cenário com amortizações adicionais (pagamento = parcela + adicional)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 6,
      aluguelMensal: 6000, // maior que a parcela base (5500) após contemplação
      correcaoAnualAluguel: 0,
    };

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 12, valor: 20_000, tipo: "prazo" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    expect(r.tirMensalComAdicionais).not.toBeNull();

    const mesContemplacao = inputs.mesContemplacao ?? 1;
    const cashflows = r.parcelas.map((p) => {
      const aluguelNoMes = p.mes >= mesContemplacao ? getAluguelCorrigidoNoMes(p.mes, inputs.aluguelMensal ?? 0, 0) : 0;
      const pagamento = round2(p.parcela + p.amortizacaoAdicional);
      return round2(aluguelNoMes - pagamento);
    });

    cashflows[cashflows.length - 1] += r.valorBemFinal;

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(r.tirMensalComAdicionais).toBeCloseTo(irrEsperada!, 8);
  });
});
