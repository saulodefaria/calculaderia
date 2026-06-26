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

  test.each(["/geradores/uuid", "/pt-br/geradores/uuid", "/en/geradores/uuid", "/es/geradores/uuid"])(
    "sanitizes UUID generator pageviews before gtag for %s",
    (pathname) => {
      const gtag = vi.fn();

      vi.stubGlobal("window", {
        gtag,
        location: {
          origin: "https://calculaderia.com",
          href: `https://calculaderia.com${pathname}?uuid=raw-private-value`,
        },
      });
      vi.stubGlobal("document", {
        title: "Gerador de UUID",
      });

      pageview(
        "G-TEST",
        `${pathname}?quantidade=2.9&formato=urn&maiusculas=true&uuid=raw-private-value&token=secret#uuid=hash`
      );

      expect(gtag).toHaveBeenCalledWith("config", "G-TEST", {
        page_path: `${pathname}?quantidade=2&formato=urn&maiusculas=1`,
        page_title: "Gerador de UUID",
        page_location: `https://calculaderia.com${pathname}?quantidade=2&formato=urn&maiusculas=1`,
      });
    }
  );
});
