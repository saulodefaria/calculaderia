import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const validCardLikeNumber = "4242424242424242";
const alternateCardLikeNumber = "4111111111111111";

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);

    return {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      hasPrimaryNumber: clipboardText.includes(validCardLikeNumber),
      hasAlternateNumber: clipboardText.includes(alternateCardLikeNumber),
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

test.describe("payment card validator", () => {
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

  test("validates a Luhn-valid number and keeps share and copy output private", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const requestUrls: string[] = [];
    page.on("request", (request) => requestUrls.push(request.url()));

    await page.goto("/validadores/validador-cartao");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de Cartão de Crédito", level: 1 })).toBeVisible();
    await expect(main.getByTestId("payment-card-validator-input")).toBeVisible();
    await expect(main.getByText("O número não entra na URL")).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Pagamentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/pagamentos"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de cartão" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar cartão pelo Luhn" })).toBeVisible();

    await main.getByTestId("payment-card-validator-input").fill("4242 4242 4242 4242");
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Luhn válido");
    await expect(main.getByTestId("payment-card-validator-display-number")).toContainText("**** **** **** 4242");
    await expect(main.getByTestId("payment-card-validator-check-digit")).toContainText("Dígito informado: 2");

    let url = new URL(page.url());
    expect(url.search).toBe("");
    expect(url.hash).toBe("");

    await main.getByTestId("payment-card-validator-mask-toggle").uncheck();
    await expect(main.getByTestId("payment-card-validator-display-number")).toContainText("4242 4242 4242 4242");
    url = new URL(page.url());
    expect(url.search).toBe("?mascarado=0");
    expect(url.href).not.toContain(validCardLikeNumber);

    await main.getByTestId("payment-card-validator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-cartao",
      search: "?mascarado=0",
      hash: "",
      hasPrimaryNumber: false,
      hasAlternateNumber: false,
    });

    await main.getByTestId("payment-card-validator-copy-summary").click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("Número mascarado: **** **** **** 4242");
    expect(clipboardText).toContain("Luhn válido");
    expect(clipboardText).not.toContain(validCardLikeNumber);

    const privacySnapshot = await getBrowserPrivacySnapshot(page);
    expect(JSON.stringify(privacySnapshot)).not.toContain(validCardLikeNumber);
    expect(requestUrls.join("\n")).not.toContain(validCardLikeNumber);
    await expect(page.getByRole("button", { name: /salvar|favoritar/i })).toHaveCount(0);

    await main.getByTestId("payment-card-validator-clear").click();
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Aguardando número");
    expect(new URL(page.url()).search).toBe("");
  });

  test("shows invalid checksum and invalid-format diagnostics independently", async ({ page }) => {
    await page.goto("/validadores/validador-cartao");
    const main = page.getByRole("main");
    const input = main.getByTestId("payment-card-validator-input");

    await input.fill("4242 4242 4242 4243");
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Luhn inválido");
    await expect(main.getByTestId("payment-card-validator-diagnostics")).toContainText("dígito final");
    await expect(main.getByTestId("payment-card-validator-diagnostics")).not.toContainText("O Luhn não roda");

    await input.fill("4242 4242 abcd 4242");
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("payment-card-validator-diagnostics")).toContainText("Remova letras");
    await expect(main.getByTestId("payment-card-validator-diagnostics")).toContainText("O Luhn não roda");

    await input.fill("0000 0000 0000 0000");
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("payment-card-validator-diagnostics")).toContainText("todos os dígitos iguais");
  });

  test("removes hostile query and hash content without hydrating the input", async ({ page }) => {
    await page.goto(
      `/validadores/validador-cartao?numero=${validCardLikeNumber}&pan=${alternateCardLikeNumber}&mascarado=0&q=card#conteudo=1&card=${validCardLikeNumber}`
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("payment-card-validator-input")).toHaveValue("");
    await expect(main.getByTestId("payment-card-validator-status")).toContainText("Aguardando número");
    await expect.poll(() => new URL(page.url()).search).toBe("?mascarado=0");
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    expect(page.url()).not.toContain(validCardLikeNumber);
    expect(page.url()).not.toContain(alternateCardLikeNumber);
  });

  test("renders translated EN and ES routes", async ({ page }) => {
    await page.goto("/en/validadores/validador-cartao");
    await expect(page.getByRole("heading", { name: "Credit Card Validator", level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByText("does not put the number in the URL")).toBeVisible();

    await page.goto("/es/validadores/validador-cartao");
    await expect(page.getByRole("heading", { name: "Validador de Tarjeta de Crédito", level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByText("no pone el número en la URL")).toBeVisible();
  });

  test("is discoverable from the validator directory, payment category, and sitemap", async ({ page, request }) => {
    await page.goto("/validadores");
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-pagamentos")).toBeVisible();
    await expect(page.getByText("Validador de Cartão de Crédito").first()).toBeVisible();

    await page.getByTestId("tool-category-card-pagamentos").click();
    await page.waitForURL("**/validadores/categorias/pagamentos");
    await expect(page.getByRole("heading", { name: "Pagamentos", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de Cartão de Crédito").first()).toBeVisible();

    const sitemap = await request.get("/sitemap.xml");
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("/validadores/validador-cartao");
    expect(sitemapText).toContain("/en/validadores/validador-cartao");
    expect(sitemapText).toContain("/es/validadores/validador-cartao");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-cartao");
    const main = page.getByRole("main");

    await main.getByTestId("payment-card-validator-input").fill("4242 4242 4242 4242");
    await expect(main.getByTestId("payment-card-validator-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
