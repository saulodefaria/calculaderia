import { afterEach, describe, expect, test, vi } from "vitest";
import { pageview, sanitizeAnalyticsUrl } from "./ga4";

describe("ga4 analytics helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("sends manual pageviews without URL fragments", () => {
    const gtag = vi.fn();

    vi.stubGlobal("window", {
      gtag,
      location: {
        origin: "https://calculaderia.com",
        href: "https://calculaderia.com/pt-br/dev/formatador-json?modo=minificar#conteudo=1&entrada=privado",
      },
    });
    vi.stubGlobal("document", {
      title: "Formatador de JSON",
    });

    pageview("G-TEST", "/pt-br/dev/formatador-json?modo=minificar");

    expect(gtag).toHaveBeenCalledWith("config", "G-TEST", {
      page_path: "/pt-br/dev/formatador-json?modo=minificar",
      page_title: "Formatador de JSON",
      page_location: "https://calculaderia.com/pt-br/dev/formatador-json?modo=minificar",
    });
  });

  test("sanitizes card validator pageview URLs before GA can receive PAN-like params", () => {
    const sanitized = sanitizeAnalyticsUrl(
      "/pt-br/validadores/validador-cartao?numero=4242424242424242&pan=4111111111111111&mascarado=0&q=x#conteudo=1&card=5555555555554444",
      "https://calculaderia.com"
    );

    expect(sanitized.pathname).toBe("/pt-br/validadores/validador-cartao");
    expect(sanitized.search).toBe("?mascarado=0");
    expect(sanitized.hash).toBe("");
    expect(sanitized.toString()).not.toContain("4242424242424242");
    expect(sanitized.toString()).not.toContain("4111111111111111");
    expect(sanitized.toString()).not.toContain("5555555555554444");
  });

  test("keeps default card validator pageviews query-free when masking is enabled", () => {
    const sanitized = sanitizeAnalyticsUrl(
      "/validadores/validador-cartao?numero=4242424242424242&mascarado=1&foo=bar",
      "https://calculaderia.com"
    );

    expect(sanitized.pathname).toBe("/validadores/validador-cartao");
    expect(sanitized.search).toBe("");
  });

  test("sanitizes plate validator pageview URLs before GA can receive plate params", () => {
    const sanitized = sanitizeAnalyticsUrl(
      "/pt-br/validadores/validador-placa?placa=ABC1D23&conteudo=1&modo=mercosul&q=ABC1D23#conteudo=1&placa=ZZZ9H88",
      "https://calculaderia.com"
    );

    expect(sanitized.pathname).toBe("/pt-br/validadores/validador-placa");
    expect(sanitized.search).toBe("?modo=mercosul");
    expect(sanitized.hash).toBe("");
    expect(sanitized.toString()).not.toContain("ABC1D23");
    expect(sanitized.toString()).not.toContain("ZZZ9H88");
  });

  test("keeps only safe plate validator modes on localized routes", () => {
    const en = sanitizeAnalyticsUrl(
      "/en/validadores/validador-placa?modo=antiga&placa=ABC1234&foo=bar",
      "https://calculaderia.com"
    );
    const es = sanitizeAnalyticsUrl(
      "/es/validadores/validador-placa?modo=auto&placa=ABC1D23&conteudo=1",
      "https://calculaderia.com"
    );

    expect(en.pathname).toBe("/en/validadores/validador-placa");
    expect(en.search).toBe("?modo=antiga");
    expect(es.pathname).toBe("/es/validadores/validador-placa");
    expect(es.search).toBe("");
  });
});
