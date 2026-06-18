import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);

    return {
      pathname: url.pathname,
      limit: url.searchParams.get("limite"),
      contentFlag: url.searchParams.get("conteudo"),
      text: url.searchParams.get("texto"),
    };
  } catch {
    return null;
  }
}

test.describe("character counter", () => {
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

  test("counts text live and keeps pasted content out of the URL by default", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/contador-caracteres");

    await expect(page.getByRole("heading", { name: "Contador de Caracteres", level: 1 })).toBeVisible();
    await expect(page.getByTestId("character-counter-textarea")).toBeVisible();
    await expect(
      page.getByText("A contagem acontece no seu navegador. O texto não é enviado para o servidor.")
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Texto", exact: true })).toHaveAttribute("href", "/texto");
    await expect(breadcrumb.getByRole("link", { name: "Contagem de texto", exact: true })).toHaveAttribute(
      "href",
      "/texto/categorias/contagem-texto"
    );

    const sample = "Olá mundo\nLinha 2";
    await page.getByTestId("character-counter-textarea").fill(sample);
    await page.getByTestId("character-counter-limit-input").fill("20");

    await expect(page.getByTestId("character-counter-metric-characters")).toContainText("17");
    await expect(page.getByTestId("character-counter-metric-charactersWithoutWhitespace")).toContainText("14");
    await expect(page.getByTestId("character-counter-metric-words")).toContainText("4");
    await expect(page.getByTestId("character-counter-metric-lines")).toContainText("2");
    await expect(page.getByTestId("character-counter-metric-bytes")).toContainText("18");
    await expect(page.getByTestId("character-counter-limit-result")).toContainText("3 caracteres restantes");
    await page.getByTestId("character-counter-limit-input").fill("10");
    await expect(page.getByTestId("character-counter-limit-result")).toContainText("7 caracteres acima do limite");
    await page.getByTestId("character-counter-limit-input").fill("20");

    let url = new URL(page.url());
    expect(url.searchParams.get("limite")).toBe("20");
    expect(url.searchParams.get("texto")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    const shareButton = page.getByRole("button", { name: /Compartilhar|Copiado/ });

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/contador-caracteres",
      limit: "20",
      contentFlag: null,
      text: null,
    });

    await page.getByTestId("character-counter-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("limite")).toBe("20");
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.searchParams.get("texto")).toBeNull();

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/contador-caracteres",
      limit: "20",
      contentFlag: "1",
      text: sample,
    });

    await page.getByTestId("character-counter-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("17 caracteres");

    await page.getByTestId("character-counter-clear").click();
    await expect(page.getByTestId("character-counter-metric-characters")).toContainText("0");
  });

  test("prefills shared content and sanitizes the live URL after hydration", async ({ page }) => {
    await page.goto(
      `/texto/contador-caracteres?conteudo=1&limite=50&texto=${encodeURIComponent("Texto compartilhado")}`
    );

    await expect(page.getByTestId("character-counter-textarea")).toHaveValue("Texto compartilhado");
    await expect(page.getByTestId("character-counter-limit-input")).toHaveValue("50");
    await expect.poll(() => new URL(page.url()).searchParams.get("texto")).toBeNull();

    const url = new URL(page.url());
    expect(url.searchParams.get("limite")).toBe("50");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("lists the text family, route, and sitemap entries", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByTestId("tool-family-card-texto")).toBeVisible();
    await page.getByTestId("tool-family-card-texto").click();
    await expect(page).toHaveURL(/\/texto$/);
    await expect(page.getByRole("heading", { name: "Texto", level: 1 })).toBeVisible();
    await expect(page.getByText("Contador de Caracteres", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/texto");
    expect(body).toContain("/texto/contador-caracteres");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/texto/contador-caracteres");

    await page.getByTestId("character-counter-textarea").fill("palavra ".repeat(60));
    await expect(page.getByTestId("character-counter-metric-characters")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
