import { describe, expect, test } from "vitest";
import {
  TEXT_DIFF_MAX_INPUT_LENGTH,
  buildTextDiffContentFragmentParams,
  buildTextDiffSearchParams,
  buildTextDiffShareUrl,
  buildTextDiffSummaryText,
  buildUnifiedTextDiff,
  compareTexts,
  readTextDiffContentFromFragment,
  readTextDiffStateFromParams,
  type TextDiffState,
} from "./text-diff";

describe("text diff", () => {
  test("returns a neutral state for two empty texts", () => {
    const result = compareTexts("", "");

    expect(result.status).toBe("empty");
    expect(result.blocks).toEqual([]);
    expect(result.summary).toMatchObject({
      unchanged: 0,
      added: 0,
      removed: 0,
      modified: 0,
      totalChangedBlocks: 0,
      percentChanged: 0,
    });
  });

  test("returns identical for equal texts", () => {
    const result = compareTexts("linha 1\nlinha 2", "linha 1\nlinha 2");

    expect(result.status).toBe("identical");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.type).toBe("equal");
    expect(result.summary.unchanged).toBe(2);
    expect(result.summary.percentChanged).toBe(0);
  });

  test("handles an empty original as inserted content", () => {
    const result = compareTexts("", "nova\nlinha");

    expect(result.status).toBe("missingOriginal");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.type).toBe("insert");
    expect(result.blocks[0]?.revisedText).toBe("nova\nlinha");
    expect(result.summary.added).toBe(2);
  });

  test("handles an empty revised text as removed content", () => {
    const result = compareTexts("texto antigo", "");

    expect(result.status).toBe("missingRevised");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.type).toBe("delete");
    expect(result.blocks[0]?.originalText).toBe("texto antigo");
    expect(result.summary.removed).toBe(1);
  });

  test("bases missing-side statuses on raw textarea values when comparison keys are empty", () => {
    const result = compareTexts("   ", "", {
      ignoreTrailingSpaces: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("missingRevised");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.type).toBe("delete");
    expect(result.blocks[0]?.originalText).toBe("   ");
    expect(result.summary.removed).toBe(1);
  });

  test("coalesces adjacent line delete and insert operations into replacements with inline changes", () => {
    const result = compareTexts("igual\nclausula antiga\nfim", "igual\nclausula nova\nfim\nextra", {
      locale: "pt-BR",
    });

    expect(result.status).toBe("different");
    expect(result.blocks.map((block) => block.type)).toEqual(["equal", "replace", "equal", "insert"]);
    expect(result.blocks[1]?.originalText).toBe("clausula antiga");
    expect(result.blocks[1]?.revisedText).toBe("clausula nova");
    expect(result.blocks[1]?.inlineChanges.map((change) => change.type)).toContain("delete");
    expect(result.blocks[1]?.inlineChanges.map((change) => change.type)).toContain("insert");
    expect(result.summary.modified).toBe(1);
    expect(result.summary.added).toBe(1);
    expect(buildUnifiedTextDiff(result)).toContain("- clausula antiga\n+ clausula nova");
  });

  test("word mode catches punctuation-only changes", () => {
    const result = compareTexts("Ola, mundo.", "Ola, mundo!", {
      mode: "palavras",
      locale: "pt-BR",
    });

    expect(result.modeApplied).toBe("palavras");
    expect(result.status).toBe("different");
    expect(result.blocks.some((block) => block.type === "replace")).toBe(true);
    expect(result.summary.modified).toBe(1);
  });

  test("character mode keeps emoji and combining marks as stable grapheme units when available", () => {
    const result = compareTexts("cafe\u0301 🙂 ok", "cafe\u0301 🙂 OK", {
      mode: "caracteres",
      locale: "pt-BR",
    });

    expect(result.modeApplied).toBe("caracteres");
    expect(result.status).toBe("different");
    expect(result.summary.modified).toBeGreaterThan(0);
    expect(result.blocks.some((block) => block.originalText.includes("o") && block.revisedText.includes("O"))).toBe(
      true
    );
  });

  test("ignore-case hides casing-only changes and emits a warning", () => {
    const result = compareTexts("Contrato ABC", "contrato abc", {
      ignoreCase: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.warnings).toContain("caseIgnored");
    expect(result.blocks[0]?.originalText).toBe("Contrato ABC");
    expect(result.blocks[0]?.revisedText).toBe("contrato abc");
  });

  test("ignore-trailing-spaces hides end-of-line whitespace changes", () => {
    const result = compareTexts("linha  \nproxima\t", "linha\nproxima", {
      ignoreTrailingSpaces: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.warnings).toContain("trailingSpacesIgnored");
    expect(result.blocks[0]?.originalText).toBe("linha  \nproxima\t");
  });

  test("ignore-trailing-spaces is comparison-only in word mode", () => {
    const result = compareTexts("um  \ndois\t", "um\ndois", {
      mode: "palavras",
      ignoreTrailingSpaces: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.summary.totalChangedBlocks).toBe(0);
    expect(result.summary.unchanged).toBe(3);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.originalText).toBe("um  \ndois\t");
    expect(result.blocks[0]?.revisedText).toBe("um\ndois");
  });

  test("ignore-trailing-spaces is comparison-only in character mode", () => {
    const result = compareTexts("ab  \ncd\t", "ab\ncd", {
      mode: "caracteres",
      ignoreTrailingSpaces: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.summary.totalChangedBlocks).toBe(0);
    expect(result.summary.unchanged).toBe(5);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.originalText).toBe("ab  \ncd\t");
    expect(result.blocks[0]?.revisedText).toBe("ab\ncd");
  });

  test("ignore-empty-lines preserves blank-line display text and ranges", () => {
    const result = compareTexts("a\n\nb", "a\nb", {
      ignoreBlankLines: true,
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.warnings).toContain("blankLinesIgnored");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]?.originalText).toBe("a\n\nb");
    expect(result.blocks[0]?.revisedText).toBe("a\nb");
    expect(result.blocks[0]?.originalStart).toBe(1);
    expect(result.blocks[0]?.originalEnd).toBe(3);
    expect(result.blocks[0]?.revisedStart).toBe(1);
    expect(result.blocks[0]?.revisedEnd).toBe(2);
    expect(result.summary.unchanged).toBe(2);
    expect(result.summary.totalChangedBlocks).toBe(0);
  });

  test("normalizes CRLF and CR line endings for comparison", () => {
    const result = compareTexts("a\r\nb\rc", "a\nb\nc", {
      locale: "pt-BR",
    });

    expect(result.status).toBe("identical");
    expect(result.warnings).toContain("lineEndingNormalized");
    expect(result.summary.originalLines).toBe(3);
    expect(result.summary.revisedLines).toBe(3);
  });

  test("stops before expensive work when input length exceeds the cap", () => {
    const result = compareTexts("abcdef", "abc", {
      maxInputLength: 5,
    });

    expect(TEXT_DIFF_MAX_INPUT_LENGTH).toBe(200_000);
    expect(result.status).toBe("tooLarge");
    expect(result.blocks).toEqual([]);
    expect(result.warnings).toContain("largeInput");
  });

  test("stops before expensive work when token or matrix budgets are exceeded", () => {
    const tooManyTokens = compareTexts("a\nb\nc", "a\nb\nc", {
      maxTokens: { linhas: 2 },
    });
    const tooManyCells = compareTexts("a\nb\nc", "a\nx\nc", {
      maxMatrixCells: 4,
    });

    expect(tooManyTokens.status).toBe("tooManyTokens");
    expect(tooManyTokens.summary.originalTokens).toBe(3);
    expect(tooManyCells.status).toBe("tooManyTokens");
    expect(tooManyCells.warnings).toContain("comparisonApproximation");
  });

  test("reads invalid query params safely and ignores content-bearing search params", () => {
    const state = readTextDiffStateFromParams(
      new URLSearchParams(
        "modo=invalido&visao=errada&ignorarCaixa=1&ignorarEspacosFinais=true&ignorarLinhasVazias=0&original=vaza&alterado=vaza"
      )
    );

    expect(state).toEqual({
      original: "",
      alterado: "",
      modo: "linhas",
      visao: "lado-a-lado",
      ignorarCaixa: true,
      ignorarEspacosFinais: true,
      ignorarLinhasVazias: false,
    });
  });

  test("writes only safe settings into live query params", () => {
    const state: TextDiffState = {
      original: "texto privado",
      alterado: "texto publico",
      modo: "palavras",
      visao: "unificado",
      ignorarCaixa: true,
      ignorarEspacosFinais: true,
      ignorarLinhasVazias: true,
    };
    const result = buildTextDiffSearchParams(state);

    expect(result.params.get("modo")).toBe("palavras");
    expect(result.params.get("visao")).toBe("unificado");
    expect(result.params.get("ignorarCaixa")).toBe("1");
    expect(result.params.get("ignorarEspacosFinais")).toBe("1");
    expect(result.params.get("ignorarLinhasVazias")).toBe("1");
    expect(result.params.get("original")).toBeNull();
    expect(result.params.get("alterado")).toBeNull();
    expect(readTextDiffStateFromParams(result.params)).toEqual({
      ...state,
      original: "",
      alterado: "",
    });
  });

  test("loads explicit hash content only when conteudo is enabled", () => {
    const explicit = readTextDiffContentFromFragment("#conteudo=1&original=um&alterado=dois");
    const ignored = readTextDiffContentFromFragment("#original=um&alterado=dois");

    expect(explicit).toEqual({
      hasExplicitContent: true,
      original: "um",
      alterado: "dois",
    });
    expect(ignored).toEqual({
      hasExplicitContent: false,
      original: "",
      alterado: "",
    });
  });

  test("builds explicit content share links only in the fragment", () => {
    const state: TextDiffState = {
      original: "contrato antigo",
      alterado: "contrato novo",
      modo: "linhas",
      visao: "unificado",
      ignorarCaixa: false,
      ignorarEspacosFinais: true,
      ignorarLinhasVazias: false,
    };
    const fragment = buildTextDiffContentFragmentParams(state, { includeContent: true });
    const share = buildTextDiffShareUrl("https://calculaderia.test/texto/diff-texto", state, {
      includeContent: true,
    });
    const url = new URL(share.url);
    const fragmentParams = new URLSearchParams(url.hash.slice(1));

    expect(url.searchParams.get("visao")).toBe("unificado");
    expect(url.searchParams.get("ignorarEspacosFinais")).toBe("1");
    expect(url.searchParams.get("original")).toBeNull();
    expect(url.searchParams.get("alterado")).toBeNull();
    expect(fragment.params.get("conteudo")).toBe("1");
    expect(fragment.params.get("original")).toBe("contrato antigo");
    expect(fragment.params.get("alterado")).toBe("contrato novo");
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("original")).toBe("contrato antigo");
    expect(fragmentParams.get("alterado")).toBe("contrato novo");
  });

  test("omits oversized shared content from explicit content fragments", () => {
    const share = buildTextDiffShareUrl(
      "https://calculaderia.test/texto/diff-texto",
      {
        original: "conteudo grande",
        alterado: "conteudo maior",
        modo: "linhas",
        visao: "lado-a-lado",
        ignorarCaixa: false,
        ignorarEspacosFinais: false,
        ignorarLinhasVazias: false,
      },
      { includeContent: true, maxFragmentLength: 20 }
    );
    const url = new URL(share.url);
    const fragmentParams = new URLSearchParams(url.hash.slice(1));

    expect(share.contentOmitted).toBe(true);
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("original")).toBeNull();
    expect(fragmentParams.get("alterado")).toBeNull();
    expect(url.searchParams.get("original")).toBeNull();
    expect(url.searchParams.get("alterado")).toBeNull();
  });

  test("formats copyable summary text", () => {
    const result = compareTexts("a", "b");

    expect(buildTextDiffSummaryText(result)).toContain("Status: different");
    expect(buildUnifiedTextDiff(result)).toBe("- a\n+ b");
  });
});
