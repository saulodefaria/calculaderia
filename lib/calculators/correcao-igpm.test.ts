import { describe, expect, it } from "vitest";
import {
  CORRECAO_IGPM_FORMULA_VERSION,
  IGPM_SNAPSHOT,
  calcularCorrecaoIgpm,
  getDefaultCorrecaoIgpmInputs,
  getIgpmFreshnessStatus,
  validateCorrecaoIgpmInputs,
  validateIgpmSnapshot,
  type CorrecaoIgpmInputs,
  type IgpmSnapshot,
} from "./correcao-igpm";

function inputs(overrides: Partial<CorrecaoIgpmInputs> = {}): CorrecaoIgpmInputs {
  return { ...getDefaultCorrecaoIgpmInputs(), ...overrides };
}

function cloneSnapshot(): IgpmSnapshot {
  return structuredClone(IGPM_SNAPSHOT);
}

describe("IGP-M snapshot", () => {
  it("contains the exact verified 447-month SGS 28655 snapshot", () => {
    expect(IGPM_SNAPSHOT.seriesCode).toBe(28655);
    expect(IGPM_SNAPSHOT.observations).toHaveLength(447);
    expect(IGPM_SNAPSHOT.firstObservation).toBe("1989-06");
    expect(IGPM_SNAPSHOT.lastObservation).toBe("2026-08");
    expect(IGPM_SNAPSHOT.observations[0]).toEqual({ month: "1989-06", ratePercent: "19.6800000000" });
    expect(IGPM_SNAPSHOT.observations.at(-1)).toEqual({ month: "2026-08", ratePercent: "-0.2248645646" });
  });

  it("rejects gaps, duplicate months, invalid rates, and rates at or below -100%", () => {
    const gapped = cloneSnapshot();
    gapped.observations.splice(10, 1);
    gapped.observations.push({ month: "2026-09", ratePercent: "0.1234567890" });
    gapped.lastObservation = "2026-09";
    expect(() => validateIgpmSnapshot(gapped)).toThrow(/Discontinuous/);

    const duplicate = cloneSnapshot();
    duplicate.observations[11] = { ...duplicate.observations[10] };
    expect(() => validateIgpmSnapshot(duplicate)).toThrow(/Duplicate|Discontinuous/);

    const invalid = cloneSnapshot();
    invalid.observations[10].ratePercent = "not-a-rate";
    expect(() => validateIgpmSnapshot(invalid)).toThrow(/Invalid IGP-M rate/);

    const impossible = cloneSnapshot();
    impossible.observations[10].ratePercent = "-100.0000000000";
    expect(() => validateIgpmSnapshot(impossible)).toThrow(/greater than -100/);
  });

  it("requires the canonical known range and minimum observation count", () => {
    const wrongFirst = cloneSnapshot();
    wrongFirst.firstObservation = "1989-07";
    wrongFirst.observations.shift();
    expect(() => validateIgpmSnapshot(wrongFirst)).toThrow(/start at 1989-06/);

    const shortLast = cloneSnapshot();
    shortLast.lastObservation = "2026-07";
    shortLast.observations.pop();
    expect(() => validateIgpmSnapshot(shortLast)).toThrow(/at least 2026-08/);

    const shortCount = cloneSnapshot();
    shortCount.observations.pop();
    expect(() => validateIgpmSnapshot(shortCount)).toThrow(/at least 447 observations/);
  });

  it("requires non-empty provenance and the official BCB SGS 28655 HTTPS API URL", () => {
    for (const field of ["seriesName", "source"] as const) {
      const missing = cloneSnapshot();
      missing[field] = " ";
      expect(() => validateIgpmSnapshot(missing)).toThrow(/include/);
    }

    const missingUrl = cloneSnapshot();
    missingUrl.sourceUrl = "";
    expect(() => validateIgpmSnapshot(missingUrl)).toThrow(/official source URL/);

    for (const sourceUrl of [
      "http://api.bcb.gov.br/dados/serie/bcdata.sgs.28655/dados",
      "https://example.com/dados/serie/bcdata.sgs.28655/dados",
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados",
    ]) {
      const unofficial = cloneSnapshot();
      unofficial.sourceUrl = sourceUrl;
      expect(() => validateIgpmSnapshot(unofficial)).toThrow(/official BCB SGS 28655 HTTPS API/);
    }
  });

  it("permits valid future months appended to the verified snapshot", () => {
    const future = cloneSnapshot();
    future.lastObservation = "2026-09";
    future.sourceUrl =
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.28655/dados?formato=json&dataInicial=01%2F06%2F1989&dataFinal=30%2F09%2F2026";
    future.observations.push({ month: "2026-09", ratePercent: "0.1234567890" });
    expect(validateIgpmSnapshot(future)).toBe(future);
  });
});

describe("calcularCorrecaoIgpm", () => {
  it("matches all official source-derived inclusive fixtures", () => {
    const fixture2020 = calcularCorrecaoIgpm(inputs({ valorOriginal: 100_000 }));
    expect(fixture2020.quantidadeMeses).toBe(80);
    expect(fixture2020.fatorAcumulado).toBeCloseTo(1.5898800177008408, 14);
    expect(fixture2020.valorCorrigido).toBeCloseTo(158_988.00177008408, 8);
    expect(fixture2020.variacaoAcumuladaPercentual).toBeCloseTo(58.988001770084075, 12);

    const twelveMonths = calcularCorrecaoIgpm(
      inputs({ valorOriginal: 100_000, mesInicial: "2025-09", mesFinal: "2026-08" })
    );
    expect(twelveMonths.fatorAcumulado).toBeCloseTo(1.0216088284005878, 14);
    expect(twelveMonths.valorCorrigido).toBeCloseTo(102_160.88284005878, 8);

    const sameMonth = calcularCorrecaoIgpm(
      inputs({ valorOriginal: 100_000, mesInicial: "2026-08", mesFinal: "2026-08" })
    );
    expect(sameMonth.quantidadeMeses).toBe(1);
    expect(sameMonth.fatorAcumulado).toBeCloseTo(0.997751354354, 12);
    expect(sameMonth.valorCorrigido).toBeCloseTo(99_775.1354354, 7);
    expect(sameMonth.diferencaNominal).toBeLessThan(0);

    const fullRealRange = calcularCorrecaoIgpm(
      inputs({ valorOriginal: 100_000, mesInicial: "1994-07", mesFinal: "2026-08" })
    );
    expect(fullRealRange.quantidadeMeses).toBe(386);
    expect(fullRealRange.fatorAcumulado).toBeCloseTo(13.087663723098457, 12);
  });

  it("matches the current default without intermediate currency rounding", () => {
    const result = calcularCorrecaoIgpm(getDefaultCorrecaoIgpmInputs());
    expect(result.valorCorrigido).toBeCloseTo(794_940.0088504204, 7);
    expect(Math.round(result.valorCorrigido * 100) / 100).toBe(794_940.01);
    expect(result.hasNewerData).toBe(false);
  });

  it("compounds yearly rows to the same overall factor", () => {
    const result = calcularCorrecaoIgpm(getDefaultCorrecaoIgpmInputs());
    const yearlyProduct = result.resumoAnual.reduce((product, row) => product * row.factor, 1);
    expect(yearlyProduct).toBeCloseTo(result.fatorAcumulado, 14);
    expect(result.resumoAnual[0]).toMatchObject({ year: 2020, firstMonth: "2020-01", monthsApplied: 12 });
    expect(result.resumoAnual.at(-1)).toMatchObject({ year: 2026, lastMonth: "2026-08", monthsApplied: 8 });
  });

  it("validates BRL/date boundaries and unsupported formula versions", () => {
    expect(validateCorrecaoIgpmInputs(inputs({ valorOriginal: 0 }))).toContain("valorOriginal");
    expect(validateCorrecaoIgpmInputs(inputs({ valorOriginal: 1_000_000_000_000.01 }))).toContain("valorOriginal");
    expect(validateCorrecaoIgpmInputs(inputs({ mesInicial: "1994-06" }))).toContain("mesInicialAntesPlanoReal");
    expect(validateCorrecaoIgpmInputs(inputs({ mesInicial: "2026-09" }))).toContain("intervalo");
    expect(validateCorrecaoIgpmInputs(inputs({ mesFinal: "2026-09" }))).toContain("mesFinalIndisponivel");
    expect(
      validateCorrecaoIgpmInputs(inputs({ formulaVersion: 2 as typeof CORRECAO_IGPM_FORMULA_VERSION }))
    ).toContain("formulaVersion");
    expect(() => calcularCorrecaoIgpm(inputs({ mesInicial: "1994-06" }))).toThrow(RangeError);
  });

  it("detects missing observations in an otherwise selected interval", () => {
    const snapshot = cloneSnapshot();
    snapshot.observations = snapshot.observations.filter((item) => item.month !== "2020-02");
    expect(validateCorrecaoIgpmInputs(inputs(), snapshot)).toContain("observacaoAusente");
  });

  it("uses an injected clock for the 45-day freshness boundary", () => {
    expect(getIgpmFreshnessStatus("2026-08-29", new Date("2026-10-12T00:00:00Z"))).toBe("current");
    expect(getIgpmFreshnessStatus("2026-08-29", new Date("2026-10-13T00:00:00Z"))).toBe("current");
    expect(getIgpmFreshnessStatus("2026-08-29", new Date("2026-10-14T00:00:00Z"))).toBe("stale");
  });
});
