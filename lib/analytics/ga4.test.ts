import { afterEach, describe, expect, test, vi } from "vitest";
import { pageview, sanitizeAnalyticsUrl } from "./ga4";

describe("ga4 analytics helpers", () => {
  const financialQuery = "sv=1&vi=500000&cp=100000&mt=s&jf=10&pf=360&ai=5&ap=3000&ri=8&al=2500&ra=5&h=360";

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

  test.each([
    "/calculadoras/financiar-ou-juntar-dinheiro",
    "/calculadoras/financiar-ou-juntar-dinheiro/",
    "/en/calculadoras/financiar-ou-juntar-dinheiro",
    "/en/calculadoras/financiar-ou-juntar-dinheiro/",
    "/es/calculadoras/financiar-ou-juntar-dinheiro",
    "/es/calculadoras/financiar-ou-juntar-dinheiro/",
  ])("removes all financial state from %s analytics URLs", (pathname) => {
    const sanitized = sanitizeAnalyticsUrl(
      `${pathname}?${financialQuery}#private-result`,
      "https://calculaderia.com"
    );

    expect(sanitized.pathname).toBe(pathname);
    expect(sanitized.search).toBe("");
    expect(sanitized.hash).toBe("");
    expect(sanitized.toString()).toBe(`https://calculaderia.com${pathname}`);
  });

  test.each([
    "/calculadoras/financiar-ou-juntar-dinheiro",
    "/en/calculadoras/financiar-ou-juntar-dinheiro",
    "/es/calculadoras/financiar-ou-juntar-dinheiro",
  ])("configures query-free pageviews for %s", (pathname) => {
    const gtag = vi.fn();

    vi.stubGlobal("window", {
      gtag,
      location: {
        origin: "https://calculaderia.com",
      },
    });
    vi.stubGlobal("document", {
      title: "Finance or save",
    });

    pageview("G-TEST", `${pathname}?${financialQuery}#private-result`);

    expect(gtag).toHaveBeenCalledWith("config", "G-TEST", {
      page_path: pathname,
      page_title: "Finance or save",
      page_location: `https://calculaderia.com${pathname}`,
    });
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/[?&](?:vi|cp|ap|al)=/);
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

  test("strips title voter identifier params and fragments from title validator pageviews", () => {
    const sanitized = sanitizeAnalyticsUrl(
      "/en/validadores/validador-titulo-eleitor?titulo=004356870906&valor=004356870906&q=x#conteudo=1&titulo=004356870906",
      "https://calculaderia.com"
    );

    expect(sanitized.pathname).toBe("/en/validadores/validador-titulo-eleitor");
    expect(sanitized.search).toBe("");
    expect(sanitized.hash).toBe("");
    expect(sanitized.toString()).not.toContain("004356870906");
  });
});
