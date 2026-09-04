#!/usr/bin/env node

/**
 * Maintains the bundled BCB SGS 28655 IGP-M snapshot.
 *
 * Run `pnpm update:data:igpm` after the monthly FGV publication. Existing
 * history is immutable by default: an upstream revision prints a diff and
 * exits without replacing the verified file. `--check` validates the
 * committed snapshot offline. `--source-file=<path>` is intended for tests
 * and audited bootstrapping from an already downloaded BCB response.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const SERIES_CODE = 28655;
export const SERIES_NAME = "IGP-M - monthly variation consistent with index number";
export const KNOWN_FIRST_MONTH = "1989-06";
export const KNOWN_LAST_MONTH = "2026-08";
export const KNOWN_MINIMUM_COUNT = 447;
export const SOURCE_START_DATE = "01/06/1989";
export const SOURCE_BASE_URL = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIES_CODE}/dados`;

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SNAPSHOT_PATH = path.join(REPO_ROOT, "data", "indices", "igpm.json");

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function addOneMonth(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Invalid month: ${month}`);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) throw new Error(`Invalid month: ${month}`);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${pad2(monthNumber + 1)}`;
}

export function normalizeBcbObservations(rows) {
  if (!Array.isArray(rows)) throw new Error("BCB response must be an array.");

  return rows.map((row, index) => {
    if (!row || typeof row !== "object") throw new Error(`Observation ${index} is not an object.`);
    const date = row.data;
    const value = row.valor;
    if (typeof date !== "string" || typeof value !== "string") {
      throw new Error(`Observation ${index} must contain string data and valor fields.`);
    }
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
    if (!match) throw new Error(`Observation ${index} has invalid BCB date: ${date}`);
    const month = `${match[3]}-${match[2]}`;
    return { month, ratePercent: value };
  });
}

export function validateObservations(observations, { requireKnownRange = true } = {}) {
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new Error("IGP-M observations must be a non-empty array.");
  }

  const seen = new Set();
  let expectedMonth = observations[0]?.month;

  observations.forEach((observation, index) => {
    if (!observation || typeof observation.month !== "string" || typeof observation.ratePercent !== "string") {
      throw new Error(`Observation ${index} has an invalid shape.`);
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(observation.month)) {
      throw new Error(`Observation ${index} has an invalid month: ${observation.month}`);
    }
    if (seen.has(observation.month)) throw new Error(`Duplicate IGP-M month: ${observation.month}`);
    seen.add(observation.month);
    if (observation.month !== expectedMonth) {
      throw new Error(`Discontinuous IGP-M data: expected ${expectedMonth}, received ${observation.month}`);
    }
    if (!/^-?\d+(?:\.\d+)?$/.test(observation.ratePercent)) {
      throw new Error(`Invalid IGP-M rate for ${observation.month}: ${observation.ratePercent}`);
    }
    const rate = Number(observation.ratePercent);
    if (!Number.isFinite(rate) || rate <= -100) {
      throw new Error(`IGP-M rate must be finite and greater than -100% for ${observation.month}`);
    }
    expectedMonth = addOneMonth(observation.month);
  });

  if (requireKnownRange) {
    const first = observations[0].month;
    const last = observations.at(-1).month;
    if (first !== KNOWN_FIRST_MONTH) throw new Error(`Expected first month ${KNOWN_FIRST_MONTH}, received ${first}`);
    if (last < KNOWN_LAST_MONTH) throw new Error(`Snapshot is shorter than known last month ${KNOWN_LAST_MONTH}: ${last}`);
    if (observations.length < KNOWN_MINIMUM_COUNT) {
      throw new Error(`Snapshot has ${observations.length} observations; expected at least ${KNOWN_MINIMUM_COUNT}`);
    }
  }

  return observations;
}

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("IGP-M snapshot must be an object.");
  if (snapshot.seriesCode !== SERIES_CODE) throw new Error(`Expected SGS series ${SERIES_CODE}.`);
  if (snapshot.unit !== "percentPerMonth") throw new Error("Unexpected IGP-M unit.");
  if (typeof snapshot.retrievedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.retrievedAt)) {
    throw new Error("Invalid snapshot retrieval date.");
  }
  validateObservations(snapshot.observations);
  if (snapshot.firstObservation !== snapshot.observations[0].month) {
    throw new Error("firstObservation does not match the first observation.");
  }
  if (snapshot.lastObservation !== snapshot.observations.at(-1).month) {
    throw new Error("lastObservation does not match the last observation.");
  }
  return snapshot;
}

export function compareObservations(previous, incoming) {
  if (incoming.length < previous.length) {
    throw new Error(`Incoming SGS response was truncated (${incoming.length} < ${previous.length}).`);
  }
  const revisions = [];
  previous.forEach((observation, index) => {
    const next = incoming[index];
    if (!next || next.month !== observation.month || next.ratePercent !== observation.ratePercent) {
      revisions.push({ previous: observation, incoming: next ?? null });
    }
  });
  return revisions;
}

export function buildSnapshot(observations, retrievedAt) {
  validateObservations(observations);
  const lastObservation = observations.at(-1).month;
  const [year, month] = lastObservation.split("-");
  const finalDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const sourceUrl = `${SOURCE_BASE_URL}?formato=json&dataInicial=01%2F06%2F1989&dataFinal=${finalDay}%2F${month}%2F${year}`;
  return {
    seriesCode: SERIES_CODE,
    seriesName: SERIES_NAME,
    unit: "percentPerMonth",
    source: "Banco Central do Brasil SGS / FGV",
    sourceUrl,
    retrievedAt,
    firstObservation: observations[0].month,
    lastObservation,
    observations,
  };
}

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function currentBcbUrl() {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(nowParts.map(({ type, value }) => [type, value]));
  const params = new URLSearchParams({ formato: "json", dataInicial: SOURCE_START_DATE, dataFinal: `${parts.day}/${parts.month}/${parts.year}` });
  return `${SOURCE_BASE_URL}?${params.toString()}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const sourceFileArg = args.find((arg) => arg.startsWith("--source-file="));

  if (checkOnly) {
    validateSnapshot(readJson(SNAPSHOT_PATH));
    console.log(`IGP-M snapshot valid: ${SNAPSHOT_PATH}`);
    return;
  }

  let rows;
  if (sourceFileArg) {
    rows = readJson(path.resolve(sourceFileArg.slice("--source-file=".length)));
  } else {
    const response = await fetch(currentBcbUrl(), { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`BCB SGS request failed with HTTP ${response.status}.`);
    rows = await response.json();
  }

  const incoming = validateObservations(normalizeBcbObservations(rows));
  const previous = fs.existsSync(SNAPSHOT_PATH) ? validateSnapshot(readJson(SNAPSHOT_PATH)) : null;

  if (previous) {
    const revisions = compareObservations(previous.observations, incoming);
    if (revisions.length > 0) {
      console.error("BCB SGS changed previously verified IGP-M observations:");
      for (const revision of revisions) console.error(JSON.stringify(revision));
      throw new Error("Historical revision requires explicit maintainer review; snapshot was not changed.");
    }
    if (incoming.length === previous.observations.length) {
      console.log("IGP-M snapshot already matches Banco Central; no file changed.");
      return;
    }
  }

  const snapshot = buildSnapshot(incoming, todayIso());
  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Updated IGP-M snapshot through ${snapshot.lastObservation} (${incoming.length} observations).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
