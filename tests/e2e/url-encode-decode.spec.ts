import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      mode: url.searchParams.get("modo"),
      context: url.searchParams.get("contexto"),
      strict: url.searchParams.get("estrito"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

function getVisibleTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

test.describe("url encode decode", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error") {
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });
  });

  test.afterEach(async ({ page }) => {
    const nonAuthIssues = (browserIssuesByPage.get(page) ?? []).filter(
      (issue) => !issue.includes("ClientFetchError: Failed to fetch") && !issue.includes("errors.authjs.dev#autherror")
    );

    expect(nonAuthIssues).toEqual([]);
  });

  test("converts contexts, shares safely, and keeps pasted content out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/url-encode-decode");

    await expect(page.getByRole("heading", { name: "URL Encode Decode", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "url-encode-decode-input")).toBeVisible();
    await expect(
      page
        .getByText("A conversão acontece no navegador. Esta ferramenta não busca, abre, valida ou envia URLs coladas.")
        .filter({ visible: true })
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Codificação", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/codificacao"
    );

    await getVisibleTestId(page, "url-encode-decode-input").fill("cafe com acucar & valor=10/20?");
    await expect(getVisibleTestId(page, "url-encode-decode-status")).toContainText("Conversão válida");
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toHaveValue(
      "cafe%20com%20acucar%20%26%20valor%3D10%2F20%3F"
    );

    let url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("codificar");
    expect(url.searchParams.get("contexto")).toBe("componente");
    expect(url.searchParams.get("estrito")).toBe("0");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await getVisibleTestId(page, "url-encode-decode-input").fill("https://exemplo.test/a b?x=1&y=2#frag");
    await getVisibleTestId(page, "url-encode-decode-context-uri").click();
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toHaveValue(
      "https://exemplo.test/a%20b?x=1&y=2#frag"
    );
    await expect(getVisibleTestId(page, "url-encode-decode-warning-reservedDelimitersPreserved")).toBeVisible();

    await getVisibleTestId(page, "url-encode-decode-input").fill("Joao Maria+Silva");
    await getVisibleTestId(page, "url-encode-decode-context-form").click();
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toHaveValue("Joao+Maria%2BSilva");
    await getVisibleTestId(page, "url-encode-decode-swap").click();
    await expect(getVisibleTestId(page, "url-encode-decode-mode-decodificar")).toHaveAttribute("data-state", "active");
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toHaveValue("Joao Maria+Silva");
    await expect(getVisibleTestId(page, "url-encode-decode-warning-plusAsSpace")).toBeVisible();

    await getVisibleTestId(page, "url-encode-decode-mode-codificar").click();
    await getVisibleTestId(page, "url-encode-decode-context-componente").click();
    await getVisibleTestId(page, "url-encode-decode-input").fill("!'()*");
    await getVisibleTestId(page, "url-encode-decode-strict").check();
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toHaveValue("%21%27%28%29%2A");
    await expect(getVisibleTestId(page, "url-encode-decode-warning-strictRfc3986Applied")).toBeVisible();

    const shareButton = getVisibleTestId(page, "url-encode-decode-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/url-encode-decode",
      mode: "codificar",
      context: "componente",
      strict: "1",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: null,
      hashInput: null,
    });

    await getVisibleTestId(page, "url-encode-decode-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/url-encode-decode",
      mode: "codificar",
      context: "componente",
      strict: "1",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: "!'()*",
    });

    await getVisibleTestId(page, "url-encode-decode-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("%21%27%28%29%2A");

    const storageSnapshot = await page.evaluate(() =>
      [localStorage, sessionStorage]
        .flatMap((storage) => Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? ""))
        .join("\n")
    );
    expect(storageSnapshot).not.toContain("!'()*");
  });

  test("shows malformed percent and invalid UTF-8 diagnostics", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/url-encode-decode");

    await getVisibleTestId(page, "url-encode-decode-mode-decodificar").click();
    await getVisibleTestId(page, "url-encode-decode-input").fill("%G0");
    await expect(getVisibleTestId(page, "url-encode-decode-status")).toContainText("Percentual malformado");
    await expect(getVisibleTestId(page, "url-encode-decode-error")).toContainText("escape % incompleto");

    await getVisibleTestId(page, "url-encode-decode-copy-error").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("malformedPercent");

    await getVisibleTestId(page, "url-encode-decode-input").fill("%C3%28");
    await expect(getVisibleTestId(page, "url-encode-decode-status")).toContainText("UTF-8 inválido");
    await expect(getVisibleTestId(page, "url-encode-decode-error")).toContainText("bytes não são UTF-8 válido");

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("prefills shared content and sanitizes the live URL after hydration", async ({ page }) => {
    await page.goto(
      `/dev/url-encode-decode?modo=decodificar&contexto=form&estrito=0#conteudo=1&entrada=${encodeURIComponent(
        "Joao+Maria%2BSilva"
      )}`
    );

    await expect.poll(() => getVisibleTestId(page, "url-encode-decode-input").count()).toBe(1);
    await expect(getVisibleTestId(page, "url-encode-decode-input").first()).toHaveValue("Joao+Maria%2BSilva");
    await expect(getVisibleTestId(page, "url-encode-decode-output").first()).toHaveValue("Joao Maria+Silva");
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("decodificar");
    expect(url.searchParams.get("contexto")).toBe("form");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("warns and omits oversized input from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/url-encode-decode");

    await getVisibleTestId(page, "url-encode-decode-input").fill("valor".repeat(500));
    await getVisibleTestId(page, "url-encode-decode-include-content").check();

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");

    await getVisibleTestId(page, "url-encode-decode-share-button").getByRole("button").click();
    await expect(
      page.getByText("A entrada é grande demais para um link seguro.").filter({ visible: true })
    ).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/url-encode-decode",
      mode: "codificar",
      context: "componente",
      strict: "0",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: null,
    });
  });

  test("lists the dev family, route, category, localized routes, and sitemap entries", async ({ page }) => {
    await page.goto("/dev");

    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("URL Encode Decode", { exact: true })).toBeVisible();

    await page.goto("/dev/categorias/codificacao");
    await expect(page.getByRole("heading", { name: "Codificação", level: 1 })).toBeVisible();
    await expect(page.getByText("URL Encode Decode", { exact: true })).toBeVisible();

    await page.goto("/en/dev/url-encode-decode");
    await expect(page.getByRole("heading", { name: "URL Encode Decode", level: 1 })).toBeVisible();
    await page.goto("/es/dev/url-encode-decode");
    await expect(page.getByRole("heading", { name: "Codificador y decodificador de URL", level: 1 })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/url-encode-decode");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/url-encode-decode"));

    expect(toolPaths).toEqual([
      "/dev/url-encode-decode",
      "/en/dev/url-encode-decode",
      "/es/dev/url-encode-decode",
    ]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/url-encode-decode");

    await getVisibleTestId(page, "url-encode-decode-input").fill("https://exemplo.test/".repeat(30));
    await expect(getVisibleTestId(page, "url-encode-decode-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
