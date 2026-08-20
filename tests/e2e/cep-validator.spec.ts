import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      searchOutputMode: url.searchParams.get("saida"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchCep: url.searchParams.get("cep"),
      hashContentFlag: hashParams.get("conteudo"),
      hashCep: hashParams.get("cep"),
    };
  } catch {
    return null;
  }
}

test.describe("CEP validator", () => {
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
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("validates raw CEP, shares safely, copies outputs, and links to Correios", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-cep");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de CEP", level: 1 })).toBeVisible();
    await expect(main.getByTestId("cep-validator-input")).toBeVisible();
    await expect(main.getByText("A validação acontece no navegador.")).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Endereços" })).toHaveAttribute(
      "href",
      "/validadores/categorias/enderecos"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de CEP" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar CEP online" })).toBeVisible();
    await expect(main.getByText("Este validador confirma se o CEP existe?")).toBeVisible();

    await main.getByTestId("cep-validator-input").fill("01001000");
    await expect(main.getByTestId("cep-validator-status")).toContainText("Formato válido");
    await expect(main.getByTestId("cep-validator-formatted-output")).toContainText("01001-000");
    await expect(main.getByTestId("cep-validator-raw-output")).toContainText("01001000");
    await expect(main.getByTestId("cep-validator-length-summary")).toContainText("8 de 8 dígitos");
    await expect(main.getByTestId("cep-validator-issue-list")).toContainText("Nenhum problema");
    await expect(main.getByTestId("cep-validator-correios-link")).toHaveAttribute(
      "href",
      "https://buscacepinter.correios.com.br/app/endereco/index.php"
    );

    let url = new URL(page.url());
    expect(url.searchParams.get("cep")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("cep-validator-output-digitos").click();
    await expect(main.getByTestId("cep-validator-primary-output")).toContainText("01001000");
    url = new URL(page.url());
    expect(url.searchParams.get("saida")).toBe("digitos");
    expect(url.searchParams.get("cep")).toBeNull();
    expect(url.hash).toBe("");

    const shareButton = main.getByTestId("cep-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-cep",
      searchOutputMode: "digitos",
      searchContentFlag: null,
      searchCep: null,
      hashContentFlag: null,
      hashCep: null,
    });

    await main.getByTestId("cep-validator-include-content").check();
    expect(new URL(page.url()).hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-cep",
      searchOutputMode: "digitos",
      searchContentFlag: null,
      searchCep: null,
      hashContentFlag: "1",
      hashCep: "01001000",
    });

    await main.getByTestId("cep-validator-copy-formatted").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("01001-000");
    await main.getByTestId("cep-validator-copy-raw").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("01001000");

    await main.getByTestId("cep-validator-clear").click();
    await expect(main.getByTestId("cep-validator-status")).toContainText("Aguardando CEP");
    await main.getByTestId("cep-validator-example").click();
    await expect(main.getByTestId("cep-validator-formatted-output")).toContainText("01001-000");
  });

  test("shows incomplete, invalid, prefix, and extra-digit diagnostics", async ({ page }) => {
    await page.goto("/validadores/validador-cep");
    const main = page.getByRole("main");
    const input = main.getByTestId("cep-validator-input");

    await input.fill("01001");
    await expect(main.getByTestId("cep-validator-status")).toContainText("Incompleto");
    await expect(main.getByTestId("cep-validator-length-summary")).toContainText("5 de 8 dígitos");

    await input.fill("0100-1000");
    await expect(main.getByTestId("cep-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("cep-validator-issue-list")).toContainText("hífen deve aparecer");

    await input.fill("CEP: 01001-000");
    await expect(main.getByTestId("cep-validator-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("cep-validator-issue-list")).toContainText("prefixo CEP foi removido");
    await expect(main.getByTestId("cep-validator-formatted-output")).toContainText("01001-000");

    await input.fill("010010000");
    await expect(main.getByTestId("cep-validator-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("cep-validator-issue-list")).toContainText("dígitos extras");

    for (const value of ["01001 000", "01001.000", "01001/000", "abc01001000", "01001-00🙂"]) {
      await input.fill(value);
      await expect(main.getByTestId("cep-validator-status")).toContainText("Formato inválido");
      expect(new URL(page.url()).searchParams.get("cep")).toBeNull();
    }
  });

  test("prefills explicit shared content and sanitizes the live URL after hydration", async ({ page }) => {
    await page.goto("/validadores/validador-cep?saida=digitos#conteudo=1&cep=01001-000");
    const main = page.getByRole("main");

    await expect(main.getByTestId("cep-validator-input")).toHaveValue("01001-000");
    await expect(main.getByTestId("cep-validator-primary-output")).toContainText("01001000");
    await expect.poll(() => new URL(page.url()).searchParams.get("cep")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("saida")).toBe("digitos");
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("does not leak typed CEP into URL, requests, storage, cookies, or default share", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const sensitiveCep = "87654-321";
    const observedRequests: string[] = [];

    page.on("request", (request) => {
      observedRequests.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`);
    });

    await page.goto("/validadores/validador-cep");
    const main = page.getByRole("main");
    await main.getByTestId("cep-validator-input").fill(sensitiveCep);

    const url = new URL(page.url());
    expect(url.searchParams.get("cep")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("cep-validator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-cep",
      searchOutputMode: null,
      searchContentFlag: null,
      searchCep: null,
      hashContentFlag: null,
      hashCep: null,
    });

    const browserState = await page.evaluate(async () => {
      const localStorageValues = Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key) ?? ""}`);
      const sessionStorageValues = Object.keys(sessionStorage).map(
        (key) => `${key}=${sessionStorage.getItem(key) ?? ""}`
      );
      const indexedDbNames =
        typeof indexedDB.databases === "function"
          ? (await indexedDB.databases()).map((database) => database.name ?? "")
          : [];

      return [...localStorageValues, ...sessionStorageValues, document.cookie, ...indexedDbNames].join("\n");
    });

    expect(browserState).not.toContain(sensitiveCep);
    expect(observedRequests.join("\n")).not.toContain(sensitiveCep);
    await expect(page.locator('[data-testid*="save"], button:has-text("Salvar")')).toHaveCount(0);
  });

  test("renders localized EN and ES routes", async ({ page }) => {
    await page.goto("/en/validadores/validador-cep");
    await expect(page.getByRole("heading", { name: "Brazilian ZIP/CEP Validator", level: 1 })).toBeVisible();
    await expect(page.getByTestId("cep-validator-input")).toBeVisible();
    await expect(page.getByText("Does this validator confirm the CEP exists?")).toBeVisible();

    await page.goto("/es/validadores/validador-cep");
    await expect(page.getByRole("heading", { name: "Validador de CEP brasileño", level: 1 })).toBeVisible();
    await expect(page.getByTestId("cep-validator-input")).toBeVisible();
    await expect(page.getByText("¿Este validador confirma si el CEP existe?")).toBeVisible();
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-cep");
    const main = page.getByRole("main");

    await main.getByTestId("cep-validator-input").fill(`${"01001-000".repeat(8)}@@@@`);
    await expect(main.getByTestId("cep-validator-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
