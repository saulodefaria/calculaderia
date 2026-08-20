import { describe, expect, test } from "vitest";
import {
  CSV_JSON_MAX_INPUT_LENGTH,
  buildCsvJsonContentFragmentParams,
  buildCsvJsonSearchParams,
  buildCsvJsonShareUrl,
  defaultCsvJsonState,
  getCsvJsonTextMetrics,
  processCsvJsonConverter,
  readCsvJsonContentFromFragment,
  readCsvJsonStateFromParams,
  type CsvJsonState,
} from "./csv-json";

function makeState(patch: Partial<CsvJsonState> = {}): CsvJsonState {
  return {
    ...defaultCsvJsonState,
    ...patch,
  };
}

function warningCodes(result: ReturnType<typeof processCsvJsonConverter>) {
  return result.warnings.map((warning) => warning.code);
}

describe("csv json converter tool", () => {
  test("returns a neutral empty state for blank input", () => {
    const result = processCsvJsonConverter(makeState({ input: " \n\t " }));

    expect(result.status).toBe("empty");
    expect(result.output).toBe("");
    expect(result.outputMetrics).toBeNull();
  });

  test("converts comma CSV with headers to JSON objects and preserves strings by default", () => {
    const result = processCsvJsonConverter(makeState({ input: "nome,idade,codigo\nAna,31,00123\nBia,29,true" }));

    expect(result.status).toBe("valid");
    expect(result.detectedDelimiter).toBe("virgula");
    expect(result.rows).toBe(2);
    expect(result.columns).toBe(3);
    expect(JSON.parse(result.output)).toEqual([
      { nome: "Ana", idade: "31", codigo: "00123" },
      { nome: "Bia", idade: "29", codigo: "true" },
    ]);
    expect(warningCodes(result)).toContain("delimiterDetected");
  });

  test("handles semicolon, tab, and pipe delimiters", () => {
    const semicolon = processCsvJsonConverter(makeState({ input: "nome;cidade\nAna;Sao Paulo" }));
    const tab = processCsvJsonConverter(makeState({ input: "nome\tidade\nAna\t31", delimiter: "tab" }));
    const pipe = processCsvJsonConverter(makeState({ input: "nome|idade\nBia|29", delimiter: "pipe" }));

    expect(JSON.parse(semicolon.output)).toEqual([{ nome: "Ana", cidade: "Sao Paulo" }]);
    expect(semicolon.detectedDelimiter).toBe("pontoEVirgula");
    expect(JSON.parse(tab.output)).toEqual([{ nome: "Ana", idade: "31" }]);
    expect(JSON.parse(pipe.output)).toEqual([{ nome: "Bia", idade: "29" }]);
  });

  test("parses quoted delimiters, escaped quotes, quoted line breaks, UTF-8 text, emoji, and BOM", () => {
    const input = '\ufeffproduto,obs\n"Cafe, especial","linha 1\nlinha 2"\n"Caneca","ela disse ""oi"" 👋"';
    const result = processCsvJsonConverter(makeState({ input, delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(JSON.parse(result.output)).toEqual([
      { produto: "Cafe, especial", obs: "linha 1\nlinha 2" },
      { produto: "Caneca", obs: 'ela disse "oi" 👋' },
    ]);
    expect(warningCodes(result)).toContain("bomRemoved");
  });

  test("supports no-header arrays and generated object keys", () => {
    const arrays = processCsvJsonConverter(
      makeState({
        input: "Ana,31\nBia,29",
        delimiter: "virgula",
        headerMode: "semCabecalho",
        outputShape: "arrays",
      })
    );
    const objects = processCsvJsonConverter(
      makeState({
        input: "Ana,31\nBia,29",
        delimiter: "virgula",
        headerMode: "semCabecalho",
        outputShape: "objetos",
      })
    );

    expect(JSON.parse(arrays.output)).toEqual([
      ["Ana", "31"],
      ["Bia", "29"],
    ]);
    expect(JSON.parse(objects.output)).toEqual([
      { column_1: "Ana", column_2: "31" },
      { column_1: "Bia", column_2: "29" },
    ]);
  });

  test("preserves delimiter-defined and quoted empty rows while removing true blank lines by default", () => {
    const delimiterDefined = processCsvJsonConverter(makeState({ input: "a,b\n,\n\n", delimiter: "virgula" }));
    const quotedEmpty = processCsvJsonConverter(makeState({ input: 'a\n""\n', delimiter: "virgula" }));

    expect(JSON.parse(delimiterDefined.output)).toEqual([{ a: "", b: "" }]);
    expect(warningCodes(delimiterDefined)).toContain("emptyLinesIgnored");
    expect(JSON.parse(quotedEmpty.output)).toEqual([{ a: "" }]);
    expect(warningCodes(quotedEmpty)).not.toContain("emptyLinesIgnored");
  });

  test("renames duplicate and blank headers and preserves ragged rows", () => {
    const result = processCsvJsonConverter(makeState({ input: "id,id,\n1,2,3,4\n5", delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(JSON.parse(result.output)).toEqual([
      { id: "1", id_2: "2", column_3: "3", _extra: ["4"] },
      { id: "5", id_2: "", column_3: "" },
    ]);
    expect(warningCodes(result)).toEqual([
      "duplicateHeadersRenamed",
      "emptyHeadersGenerated",
      "raggedRows",
      "extraFieldsPreserved",
      "missingFieldsFilled",
    ]);
  });

  test("keeps renamed duplicate headers unique when a later real header matches the suffix", () => {
    const result = processCsvJsonConverter(makeState({ input: "id,id,id_2\n1,2,3", delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(JSON.parse(result.output)).toEqual([{ id: "1", id_3: "2", id_2: "3" }]);
    expect(result.preview.headers).toEqual(["id", "id_3", "id_2"]);
    expect(result.warnings.find((warning) => warning.code === "duplicateHeadersRenamed")).toMatchObject({
      count: 1,
      details: ["id -> id_3"],
    });
  });

  test("keeps generated empty headers unique when a real header matches the fallback name", () => {
    const result = processCsvJsonConverter(makeState({ input: ",column_1\nblank,real", delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(JSON.parse(result.output)).toEqual([{ column_1_2: "blank", column_1: "real" }]);
    expect(result.preview.headers).toEqual(["column_1_2", "column_1"]);
    expect(result.warnings.find((warning) => warning.code === "emptyHeadersGenerated")).toMatchObject({
      count: 1,
      details: ["column 1 -> column_1_2"],
    });
    expect(result.warnings.find((warning) => warning.code === "duplicateHeadersRenamed")).toMatchObject({
      count: 1,
      details: ["column_1 -> column_1_2"],
    });
  });

  test("preserves object output headers that shadow object prototype properties", () => {
    const result = processCsvJsonConverter(makeState({ input: "__proto__,nome\npreservado,Ana", delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(result.output).toContain('"__proto__": "preservado"');

    const parsed = JSON.parse(result.output) as Array<Record<string, unknown>>;
    expect(Object.keys(parsed[0])).toContain("__proto__");
    expect(Object.prototype.propertyIsEnumerable.call(parsed[0], "__proto__")).toBe(true);
    expect(parsed[0]["__proto__"]).toBe("preservado");
  });

  test("reserves a non-conflicting extra field key when a real header is named _extra", () => {
    const result = processCsvJsonConverter(makeState({ input: "_extra,nome\nreal,Ana,sobra", delimiter: "virgula" }));

    expect(result.status).toBe("valid");
    expect(JSON.parse(result.output)).toEqual([{ _extra: "real", nome: "Ana", _extra_2: ["sobra"] }]);
    expect(result.preview.headers).toEqual(["_extra", "nome", "_extra_2"]);
    expect(warningCodes(result)).toContain("extraFieldsPreserved");
  });

  test("infers only conservative scalar types when requested", () => {
    const result = processCsvJsonConverter(
      makeState({
        input: "id,ativo,nulo,valor,vazio,grande,data,telefone\n001,true,null,12.5,,9007199254740993,2026-07-06,+5511999999999",
        delimiter: "virgula",
        typeMode: "inferir",
      })
    );

    expect(JSON.parse(result.output)).toEqual([
      {
        id: "001",
        ativo: true,
        nulo: null,
        valor: 12.5,
        vazio: "",
        grande: "9007199254740993",
        data: "2026-07-06",
        telefone: "+5511999999999",
      },
    ]);
    expect(result.warnings.find((warning) => warning.code === "typesInferred")?.count).toBe(3);
  });

  test("reports malformed CSV and undetectable auto delimiter without throwing", () => {
    const malformed = processCsvJsonConverter(makeState({ input: 'nome,idade\n"Ana,31', delimiter: "virgula" }));
    const undetectable = processCsvJsonConverter(makeState({ input: "somente uma coluna\nsem separador" }));
    const ambiguous = processCsvJsonConverter(makeState({ input: "a,b;c\n1,2;3" }));

    expect(malformed.status).toBe("invalidCsv");
    expect(malformed.errors[0]?.code).toBe("missingClosingQuote");
    expect(undetectable.status).toBe("invalidCsv");
    expect(undetectable.errors[0]?.code).toBe("undetectableDelimiter");
    expect(ambiguous.status).toBe("valid");
    expect(warningCodes(ambiguous)).toContain("ambiguousDelimiter");
  });

  test("guards oversized input before parsing", () => {
    const result = processCsvJsonConverter(makeState({ input: "x".repeat(CSV_JSON_MAX_INPUT_LENGTH + 1) }));

    expect(result.status).toBe("tooLarge");
    expect(result.errors[0]?.code).toBe("inputTooLarge");
  });

  test("converts arrays of objects to CSV with unioned headers and formula warnings", () => {
    const input = JSON.stringify([
      { nome: "Ana", formula: "=SUM(A1:A2)", ativo: true },
      { idade: 31, nome: "Bia", formula: "+cmd" },
    ]);
    const result = processCsvJsonConverter(makeState({ input, mode: "jsonParaCsv" }));

    expect(result.status).toBe("valid");
    expect(result.output).toBe("nome,formula,ativo,idade\r\nAna,=SUM(A1:A2),true,\r\nBia,+cmd,,31");
    expect(warningCodes(result)).toEqual(["formulaLikeCells"]);
    expect(result.warnings.find((warning) => warning.code === "formulaLikeCells")?.count).toBe(2);
  });

  test("escapes spreadsheet formula-like cells only when enabled", () => {
    const result = processCsvJsonConverter(
      makeState({
        input: JSON.stringify([{ nome: "Ana", formula: "=SUM(A1:A2)" }]),
        mode: "jsonParaCsv",
        escapeFormulas: true,
      })
    );

    expect(result.output).toBe("nome,formula\r\nAna,'=SUM(A1:A2)");
    expect(warningCodes(result)).toEqual(["formulaLikeCells", "formulaEscaped"]);
  });

  test("converts arrays of arrays and fields/data JSON shape", () => {
    const arrays = processCsvJsonConverter(
      makeState({
        input: JSON.stringify([
          ["Ana", "ola"],
          ["Bia", "x;y"],
        ]),
        mode: "jsonParaCsv",
        delimiter: "pontoEVirgula",
      })
    );
    const fieldsData = processCsvJsonConverter(
      makeState({
        input: JSON.stringify({ fields: ["nome", "idade"], data: [{ idade: 31, nome: "Ana" }] }),
        mode: "jsonParaCsv",
      })
    );

    expect(arrays.output).toBe("Ana;ola\r\nBia;\"x;y\"");
    expect(fieldsData.output).toBe("nome,idade\r\nAna,31");
  });

  test("reports invalid JSON and unsupported tabular shapes", () => {
    const invalidJson = processCsvJsonConverter(makeState({ input: "{a:1}", mode: "jsonParaCsv" }));
    const rootObject = processCsvJsonConverter(makeState({ input: '{"nome":"Ana"}', mode: "jsonParaCsv" }));
    const mixedRows = processCsvJsonConverter(makeState({ input: '[{"nome":"Ana"},["Bia"]]', mode: "jsonParaCsv" }));

    expect(invalidJson.status).toBe("invalidJson");
    expect(invalidJson.errors[0]?.code).toBe("invalidJson");
    expect(rootObject.status).toBe("invalidJson");
    expect(rootObject.errors[0]?.code).toBe("unsupportedJsonRoot");
    expect(mixedRows.status).toBe("invalidJson");
    expect(mixedRows.errors[0]?.code).toBe("mixedJsonRows");
  });

  test("reports deterministic text metrics", () => {
    const metrics = getCsvJsonTextMetrics("Olá 👋\na,b");

    expect(metrics.characters).toBe(9);
    expect(metrics.lines).toBe(2);
    expect(metrics.bytes).toBe(new TextEncoder().encode("Olá 👋\na,b").length);
  });

  test("reads and writes only safe settings in URL search params", () => {
    const state = makeState({
      input: "nome,email\nAna,ana@example.com",
      mode: "jsonParaCsv",
      delimiter: "pontoEVirgula",
      headerMode: "semCabecalho",
      outputShape: "arrays",
      typeMode: "inferir",
      emptyLineMode: "preservar",
      jsonIndent: "compacto",
      escapeFormulas: true,
    });
    const safeParams = buildCsvJsonSearchParams(state);

    expect(safeParams.params.get("modo")).toBe("jsonParaCsv");
    expect(safeParams.params.get("delimitador")).toBe("pontoEVirgula");
    expect(safeParams.params.get("cabecalho")).toBe("semCabecalho");
    expect(safeParams.params.get("saida")).toBe("arrays");
    expect(safeParams.params.get("tipos")).toBe("inferir");
    expect(safeParams.params.get("linhas")).toBe("preservar");
    expect(safeParams.params.get("recuo")).toBe("compacto");
    expect(safeParams.params.get("formulas")).toBe("1");
    expect(safeParams.params.get("entrada")).toBeNull();
    expect(safeParams.params.get("conteudo")).toBeNull();

    expect(
      readCsvJsonStateFromParams(
        new URLSearchParams(
          "modo=jsonParaCsv&delimitador=pipe&cabecalho=semCabecalho&saida=arrays&tipos=inferir&linhas=preservar&recuo=compacto&formulas=1&entrada=ignorado&conteudo=1"
        )
      )
    ).toEqual({
      input: "",
      mode: "jsonParaCsv",
      delimiter: "pipe",
      headerMode: "semCabecalho",
      outputShape: "arrays",
      typeMode: "inferir",
      emptyLineMode: "preservar",
      jsonIndent: "compacto",
      escapeFormulas: true,
    });
    expect(readCsvJsonStateFromParams(new URLSearchParams("modo=xml&delimitador=espaco"))).toEqual(defaultCsvJsonState);
  });

  test("writes explicit shared content to the URL fragment only", () => {
    const state = makeState({ input: "nome,email\nAna,ana@example.com" });
    const shareUrl = buildCsvJsonShareUrl("https://calculaderia.test/dev/conversor-csv-json", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(parsedShareUrl.searchParams.get("modo")).toBe("csvParaJson");
    expect(parsedShareUrl.searchParams.get("entrada")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("entrada")).toBe("nome,email\nAna,ana@example.com");
    expect(readCsvJsonContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      input: "nome,email\nAna,ana@example.com",
    });
    expect(readCsvJsonContentFromFragment("entrada=ignorado")).toEqual({
      hasExplicitContent: false,
      input: "",
    });
  });

  test("omits shared input when the fragment would exceed the URL budget", () => {
    const result = buildCsvJsonContentFragmentParams(makeState({ input: "valor".repeat(200) }), {
      includeContent: true,
      maxFragmentLength: 40,
    });

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("entrada")).toBeNull();
  });
});
