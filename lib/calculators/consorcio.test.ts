import { describe, it, expect } from "vitest";
import { calculateIrr, getAluguelCorrigidoNoMes, round2 } from "../utils";
import {
  calcularConsorcio,
  recalcularConsorcioComAmortizacoes,
  type InputsConsorcio,
  type AmortizacaoAdicionalConsorcio,
} from "./consorcio";

describe("calcularConsorcio - without bid", () => {
  it("calculates constant payments without annual correction", () => {
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

    // Constant fund and fee
    expect(r.parcelas[0].fundoComum).toBeCloseTo(100, 2);
    expect(r.parcelas[0].taxaAdministracao).toBeCloseTo(12, 2);
    expect(r.parcelas[0].parcela).toBeCloseTo(112, 2);
    expect(r.parcelas[0].saldoDevedor).toBeCloseTo(1100, 2);
    expect(r.parcelas[0].correcaoAplicada).toBe(0);
    expect(r.parcelas[0].anoCorrente).toBe(1);

    // Last payment settles the asset balance
    expect(r.parcelas[11].saldoDevedor).toBeCloseTo(0, 2);

    // Totals
    expect(r.totalTaxaAdministracao).toBeCloseTo(144, 2);
    expect(r.totalPago).toBeCloseTo(1344, 2);
    expect(r.primeiraParcela).toBeCloseTo(112, 2);
    expect(r.ultimaParcela).toBeCloseTo(112, 2);

    // IRR exists (there is sign change: negative payments and positive asset at the end)
    expect(r.tirMensal).not.toBeNull();
    expect(r.tirMensal!).toBeLessThan(0);
    expect(r.tirAnual).not.toBeNull();
  });

  it("applies annual correction in month 13 (annual step)", () => {
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

    // Month 12: still without correction
    const p12 = r.parcelas[11];
    expect(p12.mes).toBe(12);
    expect(p12.correcaoAplicada).toBe(0);
    expect(p12.anoCorrente).toBe(1);
    expect(p12.parcela).toBeCloseTo(56, 2); // 50 + 6

    // Month 13: applies 10% correction to asset value and balance
    const p13 = r.parcelas[12];
    expect(p13.mes).toBe(13);
    expect(p13.correcaoAplicada).toBe(10);
    expect(p13.anoCorrente).toBe(2);
    expect(p13.fundoComum).toBeCloseTo(55, 2); // 1320 / 24
    expect(p13.taxaAdministracao).toBeCloseTo(6.6, 2); // 12% / 24 * 1320
    expect(p13.parcela).toBeCloseTo(61.6, 2);
    expect(p13.saldoDevedor).toBeCloseTo(605, 2); // corrected balance (660) - fund (55)

    // Final asset value should reflect applied correction (only once in 24 months)
    expect(r.valorBemFinal).toBeCloseTo(1320, 2);

    // Totals by annual step:
    // 12 months at 56 + 12 months at 61.6
    expect(r.totalPago).toBeCloseTo(1411.2, 2);
    expect(r.totalTaxaAdministracao).toBeCloseTo(151.2, 2);
  });

  it("includes agio in total paid and reduces IRR", () => {
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

    // Agio adds outflow in month 1 => worse IRR (more negative, or smaller)
    expect(comAgio.tirMensal!).toBeLessThan(base.tirMensal!);
  });

  it("returns null IRR when there is no sign change in flows (all flows non-negative)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 1200,
      meses: 12,
      taxaAdministracaoTotal: 12,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 1000, // greater than payment => positive monthly flow from month 1
      correcaoAnualAluguel: 0,
    };

    const r = calcularConsorcio(inputs);
    expect(r.tirMensal).toBeNull();
    expect(r.tirAnual).toBeNull();
  });

  it("allows positive monthly cashflow when rent > payment (after contemplation)", () => {
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

    // Ensures rent above payment (positive flow after contemplation).
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

    // Months before contemplation should be negative (without rent).
    expect(cashflows.slice(0, mesContemplacao - 1).every((cf) => cf < 0)).toBe(true);
    // After contemplation there should be positive month because rent > payment.
    expect(cashflows.slice(mesContemplacao - 1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });

  it("applies annual correction also in month 25 (2nd annual step) in long terms", () => {
    const inputs: InputsConsorcio = {
      valorBem: 3600, // avoids decimals: 3600/36 = 100
      meses: 36,
      taxaAdministracaoTotal: 12, // monthly = 12 (since (12%/36)*3600 = 12)
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

describe("calcularConsorcio - with bid", () => {
  it("applies bid proportionally to fund and fee and reduces term, keeping total paid when there is no correction", () => {
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

    // In proportional model, without annual correction, bid only anticipates payments:
    // total paid (asset + fee) remains the same, but term decreases.
    expect(comLance.totalPago).toBeCloseTo(semLance.totalPago, 2);
    expect(comLance.totalTaxaAdministracao).toBeCloseTo(semLance.totalTaxaAdministracao, 2);
    expect(comLance.parcelas.length).toBeLessThan(semLance.parcelas.length);
    expect(comLance.parcelas).toHaveLength(11);

    // Month 1: payment includes bid (total payment in the month)
    const p1 = comLance.parcelas[0];
    expect(p1.fundoComum).toBeCloseTo(100, 2);
    expect(p1.taxaAdministracao).toBeCloseTo(12, 2);
    expect(p1.parcela).toBeCloseTo(312, 2); // 112 + 200

    // Proportional distribution of bid after paying payment:
    // balance after payment: fund=1100, fee=132, total=1232
    // bid=200 => reduceFund=178.57, reduceFee=21.43
    expect(p1.saldoDevedor).toBeCloseTo(921.43, 2);
  });

  it("limits bid to remaining balance and settles in 1 month when bid is very high (without correction)", () => {
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

    // Full settlement in 1 month (base payment + effective bid limited to balance)
    expect(r.parcelas).toHaveLength(1);
    expect(r.parcelas[0].saldoDevedor).toBeCloseTo(0, 2);

    // Total paid continues to be asset + fee
    expect(r.totalTaxaAdministracao).toBeCloseTo(144, 2);
    expect(r.totalPago).toBeCloseTo(1344, 2);
    expect(r.parcelas[0].parcela).toBeCloseTo(1344, 2);
  });
});

describe("recalcularConsorcioComAmortizacoes", () => {
  it("type TERM: additional amortization reduces term and maintains base payment (without correction)", () => {
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

    // Base payment remains the same (112) throughout schedule, except final settlement
    const parcelaBase = r.parcelas[0].parcela;
    expect(parcelaBase).toBeCloseTo(112, 2);
    for (let i = 0; i < r.parcelas.length - 1; i++) {
      expect(r.parcelas[i].parcela).toBeCloseTo(parcelaBase, 2);
    }

    // Without annual correction, amortization only anticipates payments: total paid and total fee don't change
    expect(r.totalPagoComAdicionais).toBeCloseTo(r.totalPagoOriginal, 2);
    expect(r.totalTaxaAdministracaoComAdicionais).toBeCloseTo(r.totalTaxaAdministracaoOriginal, 2);
    expect(r.economiaTaxa).toBeCloseTo(0, 2);
    expect(r.economiaMeses).toBe(1);
  });

  it("type PAYMENT: maintains term and reduces base payment after bid month (without correction)", () => {
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

    // Before amortization: base payment = 120000/24 + 10% = 5000 + 500 = 5500
    expect(r.parcelas[0].parcela).toBeCloseTo(5500, 2);
    expect(r.parcelas[5].parcela).toBeCloseTo(5500, 2);

    // After amortization (month 7 onwards), base payment should be smaller
    expect(r.parcelas[6].parcela).toBeLessThan(r.parcelas[5].parcela);

    // Without annual correction, total paid and total fee remain the same
    expect(r.totalPagoComAdicionais).toBeCloseTo(r.totalPagoOriginal, 2);
    expect(r.economiaTaxa).toBeCloseTo(0, 2);
    expect(r.economiaMeses).toBe(0);
  });

  it("term -> payment: after reducing term (bid/TERM), a subsequent PAYMENT amortization maintains current term (does not return to original)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 1,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      lance: { mes: 1, valor: 60_000 }, // reduces term significantly
    };

    // Without extra user amortizations, but with initial bid (which is included internally)
    const rSomenteLance = recalcularConsorcioComAmortizacoes(inputs, []);
    expect(rSomenteLance.mesesComAdicionais).toBeLessThan(inputs.meses);
    // Ensure month 6 exists to apply subsequent amortization
    expect(rSomenteLance.mesesComAdicionais).toBeGreaterThan(6);

    const rMix = recalcularConsorcioComAmortizacoes(inputs, [{ mes: 6, valor: 5_000, tipo: "parcela" }]);

    // BUG (regression): before fix, could "stretch" and approach original term.
    // Rule: maintain current term (already reduced by bid) and adjust payment in remaining time.
    expect(rMix.mesesComAdicionais).toBeLessThanOrEqual(rSomenteLance.mesesComAdicionais + 1);

    // After month 6, base payment should drop because it's type "payment"
    const p6 = rMix.parcelas[5];
    const p7 = rMix.parcelas[6];
    expect(p6.mes).toBe(6);
    expect(p7.mes).toBe(7);
    expect(p7.parcela).toBeLessThan(p6.parcela);
  });

  it("with annual correction: large amortization can avoid month 13 adjustment and generate savings (INCC/IPCA model)", () => {
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
    expect(original.valorBemFinal).toBeCloseTo(132_000, 2); // correction in month 13
    expect(original.totalTaxaAdministracao).toBeCloseTo(12_600, 2);
    expect(original.totalPago).toBeCloseTo(138_600, 2);

    const amortizacoes: AmortizacaoAdicionalConsorcio[] = [{ mes: 1, valor: 70_000, tipo: "prazo" }];
    const r = recalcularConsorcioComAmortizacoes(inputs, amortizacoes);

    // Amortization was designed to settle up to month 12 and avoid month 13 adjustment.
    expect(r.mesesComAdicionais).toBe(12);
    expect(r.valorBemFinal).toBeCloseTo(120_000, 2);

    // Totals without applying correction: pays original "asset + fee"
    expect(r.totalTaxaAdministracaoComAdicionais).toBeCloseTo(12_000, 2);
    expect(r.totalPagoComAdicionais).toBeCloseTo(132_000, 2);

    // Fee savings corresponds to what would be adjusted in second year (600 = 10% of 6000)
    expect(r.economiaTaxa).toBeCloseTo(600, 2);
    expect(r.totalPagoComAdicionais).toBeLessThan(r.totalPagoOriginal);
    expect(r.economiaMeses).toBe(12);
  });

  it("includes initial bid and agio in scenario with additional amortizations (consistency fix)", () => {
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

    // Initial bid should enter as additional amortization in month 1
    expect(r.parcelas[0].amortizacaoAdicional).toBeCloseTo(200, 2);
    // And user's extra amortization enters in month 2
    expect(r.parcelas[1].amortizacaoAdicional).toBeCloseTo(100, 2);
    expect(r.totalAmortizacoesAdicionais).toBeCloseTo(300, 2);

    // Without annual correction: total paid continues to be (asset + fee) + agio, regardless of anticipating payments
    expect(r.totalPagoComAdicionais).toBeCloseTo(1344 + 100, 2);
    expect(r.totalPagoOriginal).toBeCloseTo(1344 + 100, 2);

    // IRR with additional amortizations should consider agio as outflow in month 1.
    // Reconstructs cashflows of scenario "with additionals" (payments = payment + additional).
    // Note: agio is now included in payment for month 1, so we don't subtract it separately
    const cashflows = r.parcelas.map((p) => round2(0 - round2(p.parcela + p.amortizacaoAdicional)));
    cashflows[cashflows.length - 1] += r.valorBemFinal;

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(r.tirMensalComAdicionais).toBeCloseTo(irrEsperada!, 8);
  });

  it("if amortization exists in same month as initial bid, sums values and preserves user type", () => {
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

    // Month 6 should sum 10k (bid) + 5k (extra) = 15k and preserve type "payment"
    expect(r.parcelas[5].amortizacaoAdicional).toBeCloseTo(15_000, 2);
    expect(r.parcelas[5].tipoAdicional).toBe("parcela");

    // And, being "payment", base payment after month 6 should drop
    expect(r.parcelas[6].parcela).toBeLessThan(r.parcelas[5].parcela);
  });

  it("calculates IRR with rent in scenario with additional amortizations (payment = payment + additional)", () => {
    const inputs: InputsConsorcio = {
      valorBem: 120_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      agio: 0,
      mesContemplacao: 6,
      aluguelMensal: 6000, // greater than base payment (5500) after contemplation
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
