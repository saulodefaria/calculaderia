import { afterEach, describe, expect, test, vi } from "vitest";
import { pageview } from "./ga4";

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
});
