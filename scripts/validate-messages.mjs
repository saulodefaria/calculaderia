import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const locales = ["en", "es", "pt-br"];
const referenceLocale = "en";
const messagesDir = path.join(process.cwd(), "messages");
const catalogKeys = ["title", "description", "metaTitle", "metaDescription"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dir, prefix = "") {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(prefix, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) return listJsonFiles(fullPath, relativePath);
      return entry.isFile() && entry.name.endsWith(".json") ? [relativePath] : [];
    })
    .sort();
}

function describeType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function compareShape(reference, candidate, location, errors) {
  const referenceType = describeType(reference);
  const candidateType = describeType(candidate);

  if (referenceType !== candidateType) {
    errors.push(`${location}: expected ${referenceType}, got ${candidateType}`);
    return;
  }

  if (Array.isArray(reference)) {
    if (reference.length !== candidate.length) {
      errors.push(`${location}: expected array length ${reference.length}, got ${candidate.length}`);
      return;
    }

    reference.forEach((item, index) => compareShape(item, candidate[index], `${location}[${index}]`, errors));
    return;
  }

  if (referenceType !== "object") return;

  const referenceKeys = Object.keys(reference).sort();
  const candidateKeys = Object.keys(candidate).sort();

  for (const key of referenceKeys) {
    if (!candidateKeys.includes(key)) {
      errors.push(`${location}: missing key ${key}`);
    }
  }

  for (const key of candidateKeys) {
    if (!referenceKeys.includes(key)) {
      errors.push(`${location}: unexpected key ${key}`);
    }
  }

  for (const key of referenceKeys.filter((key) => candidateKeys.includes(key))) {
    compareShape(reference[key], candidate[key], `${location}.${key}`, errors);
  }
}

function validateFileLists(errors) {
  const referenceFiles = listJsonFiles(path.join(messagesDir, referenceLocale));

  for (const locale of locales) {
    const files = listJsonFiles(path.join(messagesDir, locale));
    const missing = referenceFiles.filter((file) => !files.includes(file));
    const extra = files.filter((file) => !referenceFiles.includes(file));

    for (const file of missing) errors.push(`${locale}: missing file ${file}`);
    for (const file of extra) errors.push(`${locale}: unexpected file ${file}`);
  }

  return referenceFiles;
}

function validateLocaleShapes(referenceFiles, errors) {
  for (const relativePath of referenceFiles) {
    const reference = readJson(path.join(messagesDir, referenceLocale, relativePath));

    for (const locale of locales.filter((locale) => locale !== referenceLocale)) {
      const candidate = readJson(path.join(messagesDir, locale, relativePath));
      compareShape(reference, candidate, `${locale}/${relativePath}`, errors);
    }
  }
}

function validateCatalog(collection, errors) {
  for (const locale of locales) {
    const catalog = readJson(path.join(messagesDir, locale, "catalog", `${collection}.json`));
    const detailDir = path.join(messagesDir, locale, collection);
    const detailFiles = listJsonFiles(detailDir);

    for (const detailFile of detailFiles) {
      const id = detailFile.replace(/\.json$/, "");
      const detail = readJson(path.join(detailDir, detailFile));
      const catalogEntry = catalog[id];

      if (!catalogEntry) {
        errors.push(`${locale}/catalog/${collection}.json: missing ${id}`);
        continue;
      }

      for (const key of catalogKeys) {
        if (catalogEntry[key] !== detail[key]) {
          errors.push(`${locale}/catalog/${collection}.json: ${id}.${key} does not match detail file`);
        }
      }
    }
  }
}

const errors = [];
const referenceFiles = validateFileLists(errors);
validateLocaleShapes(referenceFiles, errors);
validateCatalog("calculators", errors);
validateCatalog("tools", errors);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Message files are valid.");
