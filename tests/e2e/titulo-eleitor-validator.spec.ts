import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const validTitulo = "004356870906";
const invalidTitulo = "004356870907";

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);

    return {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      hasValidTitulo: clipboardText.includes(validTitulo),
      hasInvalidTitulo: clipboardText.includes(invalidTitulo),
    };
  } catch {
    return null;
  }
}

async function getBrowserPrivacySnapshot(page: Page) {
  return page.evaluate(async () => {
    const localStorageValues = Object.values(localStorage).join("\n");
    const sessionStorageValues = Object.values(sessionStorage).join("\n");
    const indexedDbNames =
      typeof indexedDB.databases === "function" ? (await indexedDB.databases()).map((database) => database.name ?? "") : [];

    return {
      localStorageValues,
      sessionStorageValues,
      cookie: document.cookie,
      indexedDbNames: indexedDbNames.join("\n"),
    };
  });
}

test.describe("titulo eleitor validator", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error") {
        if (message.text().includes("errors.authjs.dev#autherror")) return;
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("validates a title number and keeps default share and summary private", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const requestUrls: string[] = [];
    page.on("request", (request) => requestUrls.push(request.url()));

    await page.goto("/validadores/validador-titulo-eleitor");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de Título de Eleitor", level: 1 })).toBeVisible();
    await expect(main.getByTestId("titulo-eleitor-validator-input")).toBeVisible();
    await expect(
      main.getByText(
        "A conferência acontece no navegador. O número não entra na URL padrão e não é enviado ao servidor por esta ferramenta."
      )
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Documentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/documentos"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de título de eleitor" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar título de eleitor" })).toBeVisible();

    await main.getByTestId("titulo-eleitor-validator-input").fill("0043 5687 09 06");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Dígitos conferem");
    await expect(main.getByTestId("titulo-eleitor-validator-canonical-output")).toContainText(validTitulo);
    await expect(main.getByTestId("titulo-eleitor-validator-formatted-output")).toContainText("0043 5687 09 06");
    await expect(main.getByTestId("titulo-eleitor-validator-uf-output")).toContainText("09 - Santa Catarina");
    await expect(main.getByTestId("titulo-eleitor-validator-expected-dvs")).toContainText("06");

    let url = new URL(page.url());
    expect(url.search).toBe("");
    expect(url.hash).toBe("");

    await main.getByTestId("titulo-eleitor-validator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-titulo-eleitor",
      search: "",
      hash: "",
      hasValidTitulo: false,
      hasInvalidTitulo: false,
    });

    await main.getByTestId("titulo-eleitor-validator-copy-summary").click();
    const summaryClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(summaryClipboard).toContain("Número mascarado: **** **** ** 06");
    expect(summaryClipboard).toContain("Dígitos conferem");
    expect(summaryClipboard).not.toContain(validTitulo);

    const privacySnapshot = await getBrowserPrivacySnapshot(page);
    expect(JSON.stringify(privacySnapshot)).not.toContain(validTitulo);
    expect(requestUrls.join("\n")).not.toContain(validTitulo);
    await expect(page.getByRole("button", { name: /salvar|favoritar/i })).toHaveCount(0);

    await main.getByTestId("titulo-eleitor-validator-clear").click();
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Aguardando número");
    url = new URL(page.url());
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  });

  test("shows invalid checksum, invalid UF, left-padding, and unsupported-character states", async ({ page }) => {
    await page.goto("/validadores/validador-titulo-eleitor");
    const main = page.getByRole("main");
    const input = main.getByTestId("titulo-eleitor-validator-input");

    await input.fill("0043 5687 09 07");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Dígitos não conferem");
    await expect(main.getByTestId("titulo-eleitor-validator-diagnostics")).toContainText("não correspondem");

    await input.fill("0043 5687 29 06");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("UF inválida");
    await expect(main.getByTestId("titulo-eleitor-validator-diagnostics")).toContainText("entre 01 e 28");

    await input.fill("4356870906");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Conferência com zeros à esquerda");
    await expect(main.getByTestId("titulo-eleitor-validator-canonical-output")).toContainText(validTitulo);
    await expect(main.getByTestId("titulo-eleitor-validator-diagnostics")).toContainText("zeros à esquerda");

    await input.fill("4356870907");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Conferência com zeros à esquerda");
    await expect(main.getByTestId("titulo-eleitor-validator-canonical-output")).toContainText("004356870907");
    await expect(main.getByTestId("titulo-eleitor-validator-expected-dvs")).toContainText("06");
    await expect(main.getByTestId("titulo-eleitor-validator-provided-dvs")).toContainText("Informados: 07");
    await expect(main.getByTestId("titulo-eleitor-validator-diagnostics")).toContainText("não correspondem");
    await expect(main.getByRole("complementary")).toContainText("ainda apresenta dígitos divergentes");

    await input.fill("0043 A687 09🙂06");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("titulo-eleitor-validator-diagnostics")).toContainText("Remova letras");
  });

  test("supports explicit hash sharing and sanitizes hydrated links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/validadores/validador-titulo-eleitor");
    const main = page.getByRole("main");

    await main.getByTestId("titulo-eleitor-validator-input").fill("0043 5687 09 06");
    await main.getByTestId("titulo-eleitor-validator-include-content").check();
    await main.getByTestId("titulo-eleitor-validator-share-button").getByRole("button").click();

    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-titulo-eleitor",
      search: "",
      hash: `#conteudo=1&titulo=${validTitulo}`,
      hasValidTitulo: true,
      hasInvalidTitulo: false,
    });
    expect(new URL(page.url()).hash).toBe("");

    await page.goto("/");
    await page.goto(`/validadores/validador-titulo-eleitor#conteudo=1&titulo=${validTitulo}`);
    await expect(main.getByTestId("titulo-eleitor-validator-input")).toHaveValue(validTitulo);
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Dígitos conferem");
    await expect(main.getByTestId("titulo-eleitor-validator-fragment-notice")).toContainText("barra de endereço");
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    await expect.poll(() => new URL(page.url()).search).toBe("");

    await main.getByTestId("titulo-eleitor-validator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-titulo-eleitor",
      search: "",
      hash: "",
      hasValidTitulo: false,
      hasInvalidTitulo: false,
    });
  });

  test("removes hostile query and non-explicit hash content without hydrating the input", async ({ page }) => {
    await page.goto(
      `/validadores/validador-titulo-eleitor?titulo=${validTitulo}&valor=${validTitulo}&q=x#titulo=${validTitulo}`
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("titulo-eleitor-validator-input")).toHaveValue("");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toContainText("Aguardando número");
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    expect(page.url()).not.toContain(validTitulo);
  });

  test("renders translated EN and ES routes", async ({ page }) => {
    await page.goto("/en/validadores/validador-titulo-eleitor");
    await expect(page.getByRole("heading", { name: "Brazilian Voter ID Validator", level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByText(
          "The check runs in your browser. The number does not enter the default URL and is not sent to the server by this tool."
        )
    ).toBeVisible();

    await page.goto("/es/validadores/validador-titulo-eleitor");
    await expect(page.getByRole("heading", { name: "Validador de Título Electoral Brasileño", level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByText(
          "La comprobación ocurre en el navegador. El número no entra en la URL predeterminada y esta herramienta no lo envía al servidor."
        )
    ).toBeVisible();
  });

  test("is discoverable from the validator directory, document category, and sitemap", async ({ page, request }) => {
    await page.goto("/validadores");
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-documentos")).toBeVisible();
    await expect(page.getByText("Validador de Título de Eleitor").first()).toBeVisible();

    await page.getByTestId("tool-category-card-documentos").click();
    await page.waitForURL("**/validadores/categorias/documentos");
    await expect(page.getByRole("heading", { name: "Documentos", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de Título de Eleitor").first()).toBeVisible();

    const sitemap = await request.get("/sitemap.xml");
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("/validadores/validador-titulo-eleitor");
    expect(sitemapText).toContain("/en/validadores/validador-titulo-eleitor");
    expect(sitemapText).toContain("/es/validadores/validador-titulo-eleitor");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-titulo-eleitor");
    const main = page.getByRole("main");

    await main.getByTestId("titulo-eleitor-validator-input").fill("0043 5687 09 06");
    await expect(main.getByTestId("titulo-eleitor-validator-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
