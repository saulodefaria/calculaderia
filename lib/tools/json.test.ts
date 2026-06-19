import { describe, expect, test } from "vitest";
import {
  JSON_FORMATTER_MAX_INPUT_LENGTH,
  buildJsonFormatterContentFragmentParams,
  buildJsonFormatterSearchParams,
  buildJsonFormatterShareUrl,
  formatJson,
  getJsonTextMetrics,
  minifyJson,
  normalizeJsonParseError,
  processJsonFormatter,
  readJsonFormatterContentFromFragment,
  readJsonFormatterStateFromParams,
  validateJson,
  type JsonFormatterState,
} from "./json";

describe("json formatter tool", () => {
  test("returns a neutral empty state for empty or whitespace-only input", () => {
    expect(formatJson("").status).toBe("empty");
    expect(formatJson(" \n\t ").status).toBe("empty");
    expect(formatJson("").output).toBe("");
  });

  test("formats valid objects, arrays, and selected indentation", () => {
    expect(formatJson('{"nome":"Ana","ativo":true}', "2").output).toBe(
      '{\n  "nome": "Ana",\n  "ativo": true\n}'
    );
    expect(formatJson('{"nome":"Ana","ativo":true}', "4").output).toBe(
      '{\n    "nome": "Ana",\n    "ativo": true\n}'
    );
    expect(formatJson('{"itens":[1,{"ok":true}]}', "tab").output).toBe(
      '{\n\t"itens": [\n\t\t1,\n\t\t{\n\t\t\t"ok": true\n\t\t}\n\t]\n}'
    );
    expect(formatJson('[{"id":1},{"id":2}]').valueKind).toBe("array");
  });

  test("supports top-level JSON primitives", () => {
    expect(formatJson('"texto"').output).toBe('"texto"');
    expect(formatJson("123").output).toBe("123");
    expect(formatJson("true").valueKind).toBe("boolean");
    expect(formatJson("false").output).toBe("false");
    expect(formatJson("null").valueKind).toBe("null");
  });

  test("minifies JSON without changing string contents", () => {
    const input = `{
      "mensagem": "Olá 👋",
      "texto": "linha 1\\nlinha 2",
      "aspas": "ela disse \\"oi\\""
    }`;
    const result = minifyJson(input);

    expect(result.status).toBe("valid");
    expect(result.output).toBe('{"mensagem":"Olá 👋","texto":"linha 1\\nlinha 2","aspas":"ela disse \\"oi\\""}');
    expect(result.minificationSavings?.bytes).toBeGreaterThan(0);
    expect(JSON.parse(result.output)).toEqual(JSON.parse(input));
  });

  test("validates syntax without producing formatted output", () => {
    const result = validateJson('{"ok":true}');

    expect(result.status).toBe("valid");
    expect(result.output).toBe("");
    expect(result.outputMetrics).toBeNull();
    expect(result.valueKind).toBe("object");
  });

  test("rejects common non-strict JSON forms without throwing", () => {
    const invalidInputs = [
      '{"a":1,}',
      '{"a":/* comentario */1}',
      "{'a':1}",
      "{a:1}",
      '{"a":}',
      "[1,2,]",
      '{"value": NaN}',
      '{"value": Infinity}',
    ];

    for (const input of invalidInputs) {
      const result = formatJson(input);
      expect(result.status).toBe("invalid");
      expect(result.output).toBe("");
      expect(result.error?.code).toBe("invalidJson");
    }
  });

  test("normalizes parse locations from position and line-column diagnostics", () => {
    const input = '{\n  "ok": true,\n  "bad":\n}';
    const positionError = normalizeJsonParseError(input, new SyntaxError("Unexpected token } in JSON at position 26"));

    expect(positionError.location).toEqual({
      offset: 26,
      line: 4,
      column: 2,
      snippet: "}",
    });

    const lineColumnError = normalizeJsonParseError(input, new SyntaxError("JSON Parse error: line 3 column 10"));

    expect(lineColumnError.location?.line).toBe(3);
    expect(lineColumnError.location?.column).toBe(10);
    expect(lineColumnError.location?.snippet).toBe('  "bad":');

    const tokenOnlyError = normalizeJsonParseError(
      input,
      new SyntaxError('Unexpected token \'}\', ..."\n  "bad":\n}" is not valid JSON')
    );

    expect(tokenOnlyError.location).toEqual({
      offset: 25,
      line: 4,
      column: 1,
      snippet: "}",
    });
  });

  test("reports deterministic metrics and input guardrail results", () => {
    const value = "Olá 👋\n[]";
    const metrics = getJsonTextMetrics(value);

    expect(metrics.characters).toBe(8);
    expect(metrics.lines).toBe(2);
    expect(metrics.bytes).toBe(new TextEncoder().encode(value).length);

    const result = processJsonFormatter({
      input: `${" ".repeat(JSON_FORMATTER_MAX_INPUT_LENGTH + 1)}[]`,
      mode: "formatar",
      indent: "2",
    });

    expect(result.status).toBe("tooLarge");
    expect(result.error?.code).toBe("inputTooLarge");
  });

  test("reads and writes only safe settings in URL search params", () => {
    const state: JsonFormatterState = {
      input: '{"token":"privado"}',
      mode: "minificar",
      indent: "4",
    };

    const safeParams = buildJsonFormatterSearchParams(state);

    expect(safeParams.params.get("modo")).toBe("minificar");
    expect(safeParams.params.get("recuo")).toBe("4");
    expect(safeParams.params.get("conteudo")).toBeNull();
    expect(safeParams.params.get("entrada")).toBeNull();

    expect(
      readJsonFormatterStateFromParams(new URLSearchParams("modo=validar&recuo=tab&conteudo=1&entrada=ignorado"))
    ).toEqual({
      input: "",
      mode: "validar",
      indent: "tab",
    });
    expect(readJsonFormatterStateFromParams(new URLSearchParams("modo=xml&recuo=8"))).toEqual({
      input: "",
      mode: "formatar",
      indent: "2",
    });
  });

  test("writes explicit shared JSON to the URL fragment only", () => {
    const state: JsonFormatterState = {
      input: '{"token":"privado"}',
      mode: "minificar",
      indent: "4",
    };
    const contentFragment = buildJsonFormatterContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildJsonFormatterShareUrl("https://calculaderia.test/dev/formatador-json", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("entrada")).toBe('{"token":"privado"}');
    expect(parsedShareUrl.searchParams.get("modo")).toBe("minificar");
    expect(parsedShareUrl.searchParams.get("recuo")).toBe("4");
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedShareUrl.searchParams.get("entrada")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("entrada")).toBe('{"token":"privado"}');
    expect(readJsonFormatterContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      input: '{"token":"privado"}',
    });
    expect(readJsonFormatterContentFromFragment("modo=minificar&entrada=ignorado")).toEqual({
      hasExplicitContent: false,
      input: "",
    });
  });

  test("omits shared JSON when the fragment would exceed the URL budget", () => {
    const result = buildJsonFormatterContentFragmentParams(
      {
        input: '{"conteudo":"grande"}',
        mode: "formatar",
        indent: "2",
      },
      { includeContent: true, maxFragmentLength: 30 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("entrada")).toBeNull();
  });
});
