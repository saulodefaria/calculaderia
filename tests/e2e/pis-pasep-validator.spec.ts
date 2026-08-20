import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const requestUrlsByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      searchContentFlag: url.searchParams.get("conteudo"),
      searchPis: url.searchParams.get("pis"),
      hashContentFlag: hashParams.get("conteudo"),
      hashPis: hashParams.get("pis"),
    };
  } catch {
    return null;
  }
}

async function getBrowserStorageSnapshot(page: Page) {
  return page.evaluate(async () => {
    const indexedDbNames =
      typeof indexedDB.databases === "function" ? (await indexedDB.databases()).map((database) => database.name ?? "") : [];

    return {
      localStorage: JSON.stringify({ ...localStorage }),
      sessionStorage: JSON.stringify({ ...sessionStorage }),
      cookie: document.cookie,
      indexedDbNames: indexedDbNames.join("|"),
    };
  });
}

test.describe("PIS/PASEP validator", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    const requestUrls: string[] = [];
    browserIssuesByPage.set(page, browserIssues);
    requestUrlsByPage.set(page, requestUrls);

    page.on("console", (message) => {
      if (message.type() === "error") {
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });

    page.on("request", (request) => {
      requestUrls.push(request.url());
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("validates a PIS/PASEP number, shares safely by default, and avoids storage leaks", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-pis-pasep");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de PIS/PASEP", level: 1 })).toBeVisible();
    await expect(main.getByTestId("pis-pasep-validator-input")).toBeVisible();
    await expect(main.getByText("A validação acontece no navegador.")).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Documentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/documentos"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de PIS/PASEP" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar PIS/PASEP/NIS com segurança" })).toBeVisible();
    await expect(main.getByText("Dúvidas rápidas")).toBeVisible();
    await expect(main.getByText("O validador consulta gov.br")).toBeVisible();
    await expect(main.getByRole("button", { name: /salvar|favoritar/i })).toHaveCount(0);

    await main.getByTestId("pis-pasep-validator-input").fill("120.44560.08-0");
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Dígito válido");
    await expect(main.getByTestId("pis-pasep-validator-normalized")).toContainText("12044560080");
    await expect(main.getByTestId("pis-pasep-validator-formatted")).toContainText("120.44560.08-0");
    await expect(main.getByTestId("pis-pasep-validator-check-digit")).toContainText("Dígito informado: 0");
    await expect(main.getByTestId("pis-pasep-validator-check-digit")).toContainText("Dígito esperado");

    let url = new URL(page.url());
    expect(url.searchParams.get("pis")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    const storage = await getBrowserStorageSnapshot(page);
    expect(JSON.stringify(storage)).not.toContain("12044560080");
    expect(JSON.stringify(storage)).not.toContain("120.44560.08-0");
    expect(requestUrlsByPage.get(page)?.join("\n")).not.toContain("12044560080");
    expect(requestUrlsByPage.get(page)?.join("\n")).not.toContain("120.44560.08-0");

    const shareButton = main.getByTestId("pis-pasep-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-pis-pasep",
      searchContentFlag: null,
      searchPis: null,
      hashContentFlag: null,
      hashPis: null,
    });

    await main.getByTestId("pis-pasep-validator-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("pis")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-pis-pasep",
      searchContentFlag: null,
      searchPis: null,
      hashContentFlag: "1",
      hashPis: "12044560080",
    });

    await main.getByTestId("pis-pasep-validator-copy-normalized").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("12044560080");
    await main.getByTestId("pis-pasep-validator-copy-formatted").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("120.44560.08-0");
    await main.getByTestId("pis-pasep-validator-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Dígitos: 12044560080");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("sem consulta oficial");

    await main.getByTestId("pis-pasep-validator-clear").click();
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Aguardando identificador");
  });

  test("shows diagnostics for invalid checksum, repeated digits, and unsupported characters", async ({ page }) => {
    await page.goto("/validadores/validador-pis-pasep");
    const main = page.getByRole("main");
    const input = main.getByTestId("pis-pasep-validator-input");

    await input.fill("120.44560.08-3");
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Dígito inválido");
    await expect(main.getByTestId("pis-pasep-validator-check-digit")).toContainText("Dígito informado: 3");
    await expect(main.getByTestId("pis-pasep-validator-check-digit")).toContainText("esperado");
    await expect(main.getByTestId("pis-pasep-validator-diagnostics")).toContainText("não corresponde");

    await input.fill("00000000000");
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("pis-pasep-validator-diagnostics")).toContainText("todos os dígitos iguais");

    await input.fill("120.44560.08-٣🙂A");
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("pis-pasep-validator-diagnostics")).toContainText("dígitos que não sejam ASCII");

    const url = new URL(page.url());
    expect(url.searchParams.get("pis")).toBeNull();
    expect(url.hash).toBe("");
  });

  test("hydrates explicit shared content once, clears the URL, and keeps content sharing disabled", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-pis-pasep#conteudo=1&pis=12044560080");
    const main = page.getByRole("main");

    await expect(main.getByTestId("pis-pasep-validator-input")).toHaveValue("12044560080");
    await expect(main.getByTestId("pis-pasep-validator-status")).toContainText("Dígito válido");
    await expect(main.getByTestId("pis-pasep-validator-include-content")).not.toBeChecked();
    await expect.poll(() => new URL(page.url()).searchParams.get("pis")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    await main.getByTestId("pis-pasep-validator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-pis-pasep",
      searchContentFlag: null,
      searchPis: null,
      hashContentFlag: null,
      hashPis: null,
    });
  });

  test("navigates through validator directory and documents category", async ({ page }) => {
    await page.goto("/validadores/validador-pis-pasep");

    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Validadores" }).click();
    await page.waitForURL("**/validadores");
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-documentos")).toBeVisible();
    await expect(page.getByText("Validador de PIS/PASEP").first()).toBeVisible();

    await page.getByTestId("tool-category-card-documentos").click();
    await page.waitForURL("**/validadores/categorias/documentos");
    await expect(page.getByRole("heading", { name: "Documentos", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de PIS/PASEP").first()).toBeVisible();

    await page.getByTestId("tool-card-validador-pis-pasep").click();
    await page.waitForURL("**/validadores/validador-pis-pasep");
    await expect(page.getByRole("heading", { name: "Validador de PIS/PASEP", level: 1 })).toBeVisible();
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/validadores/validador-pis-pasep");
    await expect(page.getByRole("heading", { name: "PIS/PASEP Validator", level: 1 })).toBeVisible();
    await page.getByRole("main").getByTestId("pis-pasep-validator-input").fill("12044560080");
    await expect(page.getByRole("main").getByTestId("pis-pasep-validator-status")).toContainText("Check digit valid");

    await page.goto("/es/validadores/validador-pis-pasep");
    await expect(page.getByRole("heading", { name: "Validador de PIS/PASEP", level: 1 })).toBeVisible();
    await page.getByRole("main").getByTestId("pis-pasep-validator-input").fill("12044560080");
    await expect(page.getByRole("main").getByTestId("pis-pasep-validator-status")).toContainText("Dígito válido");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-pis-pasep");
    const main = page.getByRole("main");

    await main.getByTestId("pis-pasep-validator-input").fill("120.44560.08-0");
    await expect(main.getByTestId("pis-pasep-validator-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
