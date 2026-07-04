import { webcrypto } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  HASH_TEXT_MAX_INPUT_LENGTH,
  buildHashTextContentFragmentParams,
  buildHashTextSearchParams,
  buildHashTextShareUrl,
  encodeHashBytes,
  getHashTextInputMetrics,
  md5DigestBytes,
  processHashText,
  readHashTextContentFromFragment,
  readHashTextStateFromParams,
  type HashTextDigestProvider,
  type HashTextState,
} from "./hash-text";

const digestProvider = webcrypto as unknown as HashTextDigestProvider;

async function hashText(input: string, patch: Partial<HashTextState> = {}) {
  return processHashText(
    {
      input,
      algorithm: "sha-256",
      format: "hex",
      uppercaseHex: false,
      ...patch,
    },
    { digestProvider }
  );
}

describe("hash text tool", () => {
  test("returns a neutral empty state without hashing", async () => {
    const result = await hashText("");

    expect(result.status).toBe("empty");
    expect(result.hash).toBe("");
    expect(result.digestMetrics).toBeNull();
    expect(result.inputMetrics).toEqual({ characters: 0, utf8Bytes: 0, lines: 0 });
  });

  test("generates known SHA vectors through Web Crypto", async () => {
    await expect(hashText("")).resolves.toMatchObject({ status: "empty" });

    await expect(hashText("abc")).resolves.toMatchObject({
      status: "valid",
      hash: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    });
    await expect(hashText("", { input: "abc", algorithm: "sha-384" })).resolves.toMatchObject({
      status: "valid",
      hash: "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    });
    await expect(hashText("", { input: "abc", algorithm: "sha-512" })).resolves.toMatchObject({
      status: "valid",
      hash:
        "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3fee" +
        "bbd454d4423643ce80e2a9ac94fa54ca49f",
    });
    await expect(hashText("", { input: "abc", algorithm: "sha-1" })).resolves.toMatchObject({
      status: "valid",
      hash: "a9993e364706816aba3e25717850c26c9cd0d89d",
      warnings: expect.arrayContaining(["legacyAlgorithm", "sha1Retired"]),
    });
  });

  test("generates known MD5 vectors locally", async () => {
    expect(encodeHashBytes(md5DigestBytes(new TextEncoder().encode("")), "hex")).toBe(
      "d41d8cd98f00b204e9800998ecf8427e"
    );
    await expect(hashText("", { input: "abc", algorithm: "md5" })).resolves.toMatchObject({
      status: "valid",
      hash: "900150983cd24fb0d6963f7d28e17f72",
      warnings: expect.arrayContaining(["legacyAlgorithm", "md5CollisionRisk"]),
    });
    await expect(hashText("", { input: "The quick brown fox jumps over the lazy dog", algorithm: "md5" })).resolves
      .toMatchObject({
        status: "valid",
        hash: "9e107d9d372bb6826bd81d3542a419d6",
      });
  });

  test("uses exact UTF-8 bytes and reports deterministic metrics", async () => {
    const input = "Olá 👋";
    const metrics = getHashTextInputMetrics(input);
    const composed = await hashText("café");
    const decomposed = await hashText("cafe\u0301");
    const lf = await hashText("linha\n");
    const crlf = await hashText("linha\r\n");

    expect(metrics.characters).toBe(5);
    expect(metrics.utf8Bytes).toBe(new TextEncoder().encode(input).length);
    expect(metrics.lines).toBe(1);
    expect(composed.hash).not.toBe(decomposed.hash);
    expect(lf.hash).not.toBe(crlf.hash);
    expect(lf.warnings).toContain("exactWhitespace");
  });

  test("supports hex case, Base64, and Base64URL output formats", async () => {
    await expect(hashText("abc", { uppercaseHex: true })).resolves.toMatchObject({
      hash: "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD",
    });
    await expect(hashText("abc", { format: "base64" })).resolves.toMatchObject({
      hash: "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=",
    });
    await expect(hashText("abc", { format: "base64url" })).resolves.toMatchObject({
      hash: "ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0",
    });
  });

  test("builds comparison hashes for SHA-256, SHA-1, and MD5", async () => {
    const result = await hashText("abc", { algorithm: "sha-512" });

    expect(result.comparisons.map((comparison) => comparison.algorithm.id)).toEqual(["sha-256", "sha-1", "md5"]);
    expect(result.comparisons.find((comparison) => comparison.algorithm.id === "sha-1")?.warnings).toContain(
      "sha1Retired"
    );
    expect(result.comparisons.find((comparison) => comparison.algorithm.id === "md5")?.hash).toBe(
      "900150983cd24fb0d6963f7d28e17f72"
    );
  });

  test("guards very large input and unsupported SHA environments", async () => {
    const tooLarge = await hashText("a".repeat(HASH_TEXT_MAX_INPUT_LENGTH + 1));
    const unsupported = await processHashText(
      {
        input: "abc",
        algorithm: "sha-256",
        format: "hex",
        uppercaseHex: false,
      },
      { digestProvider: null }
    );
    const localMd5 = await processHashText(
      {
        input: "abc",
        algorithm: "md5",
        format: "hex",
        uppercaseHex: false,
      },
      { digestProvider: null }
    );

    expect(tooLarge.status).toBe("tooLarge");
    expect(tooLarge.error?.code).toBe("inputTooLarge");
    expect(unsupported.status).toBe("unsupported");
    expect(unsupported.error?.code).toBe("subtleCryptoUnavailable");
    expect(localMd5.status).toBe("valid");
    expect(localMd5.hash).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  test("reads and writes only safe query-string settings", () => {
    const state: HashTextState = {
      input: "token privado",
      algorithm: "sha-512",
      format: "base64",
      uppercaseHex: true,
    };
    const safeParams = buildHashTextSearchParams(state);

    expect(safeParams.params.get("alg")).toBe("sha-512");
    expect(safeParams.params.get("fmt")).toBe("base64");
    expect(safeParams.params.get("upper")).toBe("1");
    expect(safeParams.params.get("entrada")).toBeNull();
    expect(safeParams.params.get("hash")).toBeNull();

    expect(readHashTextStateFromParams(new URLSearchParams("alg=md5&fmt=base64url&upper=1&entrada=ignorado"))).toEqual({
      input: "",
      algorithm: "md5",
      format: "base64url",
      uppercaseHex: true,
    });
    expect(readHashTextStateFromParams(new URLSearchParams("alg=sha3&fmt=bin&upper=x"))).toEqual({
      input: "",
      algorithm: "sha-256",
      format: "hex",
      uppercaseHex: false,
    });
  });

  test("writes explicit shared input to the URL fragment only", () => {
    const state: HashTextState = {
      input: "token: privado",
      algorithm: "sha-256",
      format: "hex",
      uppercaseHex: false,
    };
    const contentFragment = buildHashTextContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildHashTextShareUrl("https://calculaderia.test/dev/hash-texto", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("entrada")).toBe("token: privado");
    expect(parsedShareUrl.searchParams.get("alg")).toBe("sha-256");
    expect(parsedShareUrl.searchParams.get("fmt")).toBe("hex");
    expect(parsedShareUrl.searchParams.get("upper")).toBe("0");
    expect(parsedShareUrl.searchParams.get("entrada")).toBeNull();
    expect(parsedShareUrl.searchParams.get("hash")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("entrada")).toBe("token: privado");
    expect(readHashTextContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      input: "token: privado",
    });
    expect(readHashTextContentFromFragment("alg=sha-256&entrada=ignorado")).toEqual({
      hasExplicitContent: false,
      input: "",
    });
  });

  test("omits shared input when the fragment would exceed the URL budget", () => {
    const result = buildHashTextContentFragmentParams(
      {
        input: "valor".repeat(100),
        algorithm: "sha-256",
        format: "hex",
        uppercaseHex: false,
      },
      { includeContent: true, maxFragmentLength: 30 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("entrada")).toBeNull();
  });
});
