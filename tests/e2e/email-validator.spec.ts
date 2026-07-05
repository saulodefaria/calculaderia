import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      searchContentFlag: url.searchParams.get("conteudo"),
      searchEmail: url.searchParams.get("email"),
      hashContentFlag: hashParams.get("conteudo"),
      hashEmail: hashParams.get("email"),
    };
  } catch {
    return null;
  }
}

test.describe("email validator", () => {
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

  test("validates a common address, shares safely, and keeps email out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-email");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de Email", level: 1 })).toBeVisible();
    await expect(main.getByTestId("email-validator-input")).toBeVisible();
    await expect(main.getByText("A validação acontece no navegador.")).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Contato" })).toHaveAttribute(
      "href",
      "/validadores/categorias/contato"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de email" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar email online" })).toBeVisible();
    await expect(main.getByText("Dúvidas rápidas")).toBeVisible();
    await expect(main.getByText("Este validador confirma se a caixa postal existe?")).toBeVisible();
    await expect(main.getByText("O validador verifica DNS ou MX?")).toBeVisible();

    await main.getByTestId("email-validator-input").fill("Usuario+tag@Example.COM");
    await expect(main.getByTestId("email-validator-status")).toContainText("Sintaxe válida");
    await expect(main.getByTestId("email-validator-normalized")).toContainText("Usuario+tag@example.com");

    let url = new URL(page.url());
    expect(url.searchParams.get("email")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    const shareButton = main.getByTestId("email-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-email",
      searchContentFlag: null,
      searchEmail: null,
      hashContentFlag: null,
      hashEmail: null,
    });

    await main.getByTestId("email-validator-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("email")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-email",
      searchContentFlag: null,
      searchEmail: null,
      hashContentFlag: "1",
      hashEmail: "Usuario+tag@Example.COM",
    });

    await main.getByTestId("email-validator-copy-normalized").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("Usuario+tag@example.com");
    await main.getByTestId("email-validator-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Normalizado: Usuario+tag@example.com"
    );
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Escopo: validação de sintaxe apenas"
    );

    await main.getByTestId("email-validator-clear").click();
    await expect(main.getByTestId("email-validator-status")).toContainText("Aguardando email");
  });

  test("navigates through validator directory and contact category", async ({ page }) => {
    await page.goto("/validadores/validador-email");

    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Validadores" }).click();
    await page.waitForURL("**/validadores");
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-contato")).toBeVisible();
    await expect(page.getByText("Validador de Email").first()).toBeVisible();

    await page.getByTestId("tool-category-card-contato").click();
    await page.waitForURL("**/validadores/categorias/contato");
    await expect(page.getByRole("heading", { name: "Contato", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de Email").first()).toBeVisible();

    await page.getByTestId("tool-card-validador-email").click();
    await page.waitForURL("**/validadores/validador-email");
    await expect(page.getByRole("heading", { name: "Validador de Email", level: 1 })).toBeVisible();
  });

  test("shows diagnostics for malformed addresses and attention for SMTPUTF8 local parts", async ({ page }) => {
    await page.goto("/validadores/validador-email");
    const main = page.getByRole("main");
    const input = main.getByTestId("email-validator-input");

    const invalidExamples = [
      ["usuario@@example.com", "Use apenas um sinal @"],
      ["usuario@example..com", "ponto duplicado"],
      ["usuario@-example.com", "começar e terminar"],
      ["Name <usuario@example.com>", "Nomes de exibição"],
      ["usuario exemplo@example.com", "não aceitam espaços"],
    ] as const;

    for (const [value, diagnostic] of invalidExamples) {
      await input.fill(value);
      await expect(main.getByTestId("email-validator-status")).toContainText("Sintaxe inválida");
      await expect(main.getByTestId("email-validator-diagnostics")).toContainText(diagnostic);
      const url = new URL(page.url());
      expect(url.searchParams.get("email")).toBeNull();
    }

    await input.fill("usuário@example.com");
    await expect(main.getByTestId("email-validator-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("email-validator-diagnostics")).toContainText("SMTPUTF8");
  });

  test("prefills explicit shared content and sanitizes the live URL after hydration", async ({ page }) => {
    const shared = "pessoa@example.com";
    await page.goto(`/validadores/validador-email#conteudo=1&email=${encodeURIComponent(shared)}`);
    const main = page.getByRole("main");

    await expect(main.getByTestId("email-validator-input")).toHaveValue(shared);
    await expect(main.getByTestId("email-validator-status")).toContainText("Sintaxe válida");
    await expect.poll(() => new URL(page.url()).searchParams.get("email")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("warns and omits oversized email from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-email");
    const main = page.getByRole("main");

    await main.getByTestId("email-validator-input").fill(`${"usuario".repeat(260)}@example.com`);
    await main.getByTestId("email-validator-include-content").check();

    const url = new URL(page.url());
    expect(url.searchParams.get("email")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("email-validator-share-button").getByRole("button").click();
    await expect(main.getByText("grande demais para um link seguro")).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-email",
      searchContentFlag: null,
      searchEmail: null,
      hashContentFlag: "1",
      hashEmail: null,
    });
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-email");
    const main = page.getByRole("main");

    await main.getByTestId("email-validator-input").fill(`${"usuario".repeat(20)}@example.com`);
    await expect(main.getByTestId("email-validator-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
