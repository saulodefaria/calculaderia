import { afterEach, describe, expect, it, vi } from "vitest";
import { replaceQueryString } from "./url-state";

function browserAt(path: string) {
  const location = new URL(path, "https://calculaderia.com");
  const replaceState = vi.fn();
  vi.stubGlobal("window", { location, history: { replaceState } });
  return replaceState;
}

afterEach(() => vi.unstubAllGlobals());

describe("tool URL cleanup", () => {
  it.each([
    ["/validadores/validador-email", ""],
    ["/en/validadores/validador-pis-pasep", ""],
    ["/validadores/validador-placa?modo=antiga", "modo=antiga"],
  ])("leaves an already clean URL alone: %s", (path, query) => {
    const replaceState = browserAt(path);

    replaceQueryString(new URLSearchParams(query));

    // A redundant History API update can cancel a pending Next.js navigation.
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("removes private query parameters while retaining safe settings", () => {
    const replaceState = browserAt("/validadores/validador-placa?placa=ABC1234&modo=antiga");

    replaceQueryString(new URLSearchParams("modo=antiga"));

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, "", "/validadores/validador-placa?modo=antiga");
  });

  it("removes private fragment content even when the query is already clean", () => {
    const replaceState = browserAt("/validadores/validador-email#conteudo=1&email=test%40example.com");

    replaceQueryString(new URLSearchParams());

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, "", "/validadores/validador-email");
  });
});
