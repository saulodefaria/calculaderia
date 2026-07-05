import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

function isKnownAuthConsoleNoise(message: string) {
  return message.includes("ClientFetchError: Failed to fetch") && message.includes("errors.authjs.dev#autherror");
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      mode: url.searchParams.get("modo"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchText: url.searchParams.get("texto"),
      hashContentFlag: hashParams.get("conteudo"),
      hashText: hashParams.get("texto"),
    };
  } catch {
    return null;
  }
}

function expectLiveUrlToOmitText(page: Page, text: string) {
  const liveUrl = new URL(page.url());

  expect(liveUrl.searchParams.get("texto")).toBeNull();
  expect(liveUrl.searchParams.get("conteudo")).toBeNull();
  expect(liveUrl.hash).toBe("");
  expect(decodeURIComponent(page.url())).not.toContain(text);
}

test.describe("accent remover", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error") {
        const text = message.text();
        if (!isKnownAuthConsoleNoise(text)) {
          browserIssues.push(`console error: ${text}`);
        }
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("loads, removes accents live, and keeps typed text out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/removedor-acentos");

    const main = page.getByRole("main");
    await expect(page).toHaveTitle(/Remover acentos online grátis/);

    await expect(page.getByRole("heading", { name: "Removedor de Acentos", level: 1 })).toBeVisible();
    await expect(main.getByTestId("accent-remover-input")).toBeVisible();
    await expect(
      main.getByText("A remoção acontece no seu navegador. O texto não é enviado para o servidor")
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Texto", exact: true })).toHaveAttribute("href", "/texto");
    await expect(breadcrumb.getByRole("link", { name: "Transformação de texto" })).toHaveAttribute(
      "href",
      "/texto/categorias/transformacao-texto"
    );

    const sample = "Ação em São Paulo\nCrème brûlée e lingüiça\ne\u0301 a\u0303 c\u0327";
    await main.getByTestId("accent-remover-input").fill(sample);
    await expect(main.getByTestId("accent-remover-status")).toContainText("Acentos removidos");
    await expect(main.getByTestId("accent-remover-output")).toHaveValue(
      "Acao em Sao Paulo\nCreme brulee e linguica\ne a c"
    );
    await expect(main.getByTestId("accent-remover-metrics")).toContainText("Marcas removidas");
    expectLiveUrlToOmitText(page, sample);

    await expect(page.getByRole("heading", { name: "Dúvidas rápidas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sobre o removedor de acentos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como remover acentos online" })).toBeVisible();

    await main.getByTestId("accent-remover-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/removedor-acentos",
      mode: null,
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: null,
      hashText: null,
    });
  });

  test("uses compatibility mode only when selected and stores mode as safe query state", async ({ page }) => {
    await page.goto("/texto/removedor-acentos");

    const main = page.getByRole("main");
    await main.getByTestId("accent-remover-input").fill("ﬁ Ａ Crème");
    await expect(main.getByTestId("accent-remover-output")).toHaveValue("ﬁ Ａ Creme");

    await main.getByTestId("accent-remover-mode-compatibilidade").click();
    await expect(main.getByTestId("accent-remover-output")).toHaveValue("fi A Creme");
    await expect(main.getByTestId("accent-remover-warnings")).toContainText("compatibilidade");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("compatibilidade");
    expect(liveUrl.searchParams.get("texto")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");
  });

  test("shares content only through an explicit hash fragment", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/removedor-acentos?modo=compatibilidade");

    const text = "texto privado\ncom acento";
    await page.getByTestId("accent-remover-input").fill(text);
    await page.getByTestId("accent-remover-include-content").check();
    await expect(page.getByTestId("accent-remover-share-warning")).toContainText("expõem o conteúdo");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("compatibilidade");
    expect(liveUrl.searchParams.get("texto")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await page.getByTestId("accent-remover-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/removedor-acentos",
      mode: "compatibilidade",
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: "1",
      hashText: text,
    });
  });

  test("hydrates shared hash content and sanitizes the live URL", async ({ page }) => {
    const text = "São João";
    await page.goto(`/texto/removedor-acentos?modo=compatibilidade#conteudo=1&texto=${encodeURIComponent(text)}`);

    await expect(page.getByTestId("accent-remover-input").first()).toHaveValue(text);
    await expect(page.getByTestId("accent-remover-output").first()).toHaveValue("Sao Joao");
    await expect.poll(() => new URL(page.url()).searchParams.get("texto")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("compatibilidade");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("copies output, uses output as input, downloads txt, and clears", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/removedor-acentos");

    await page.getByTestId("accent-remover-input").fill("1️⃣ Olá mundo");
    await expect(page.getByTestId("accent-remover-output")).toHaveValue("1️⃣ Ola mundo");

    await page.getByTestId("accent-remover-copy-input").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("1️⃣ Olá mundo");

    await page.getByTestId("accent-remover-copy-output").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("1️⃣ Ola mundo");

    await page.getByTestId("accent-remover-use-output").click();
    await expect(page.getByTestId("accent-remover-input")).toHaveValue("1️⃣ Ola mundo");
    await expect(page.getByTestId("accent-remover-output")).toHaveValue("1️⃣ Ola mundo");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("accent-remover-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("removedor-acentos.txt");

    await page.getByTestId("accent-remover-clear").click();
    await expect(page.getByTestId("accent-remover-status")).toContainText("Aguardando texto");
    await expect(page.getByTestId("accent-remover-output")).toHaveValue("");
  });

  test("renders localized routes and discovery surfaces", async ({ page }) => {
    await page.goto("/en/texto/removedor-acentos");
    await expect(page.getByRole("heading", { name: "Accent Remover", level: 1 })).toBeVisible();

    await page.goto("/es/texto/removedor-acentos");
    await expect(page.getByRole("heading", { name: "Eliminador de Acentos", level: 1 })).toBeVisible();

    await page.goto("/texto");
    await expect(page.getByText("Removedor de Acentos").first()).toBeVisible();
    await expect(page.locator('a[href="/texto/removedor-acentos"]').first()).toBeVisible();

    await page.goto("/texto/categorias/transformacao-texto");
    await expect(page.getByText("Removedor de Acentos").first()).toBeVisible();
    await expect(page.locator('a[href="/texto/removedor-acentos"]').first()).toBeVisible();

    await page.goto("/ferramentas");
    await page.getByTestId("tool-family-filter-texto").click();
    await expect(page.getByTestId("tool-card-removedor-acentos")).toBeVisible();
    const itemListJsonLd = await page.locator("script#tools-hub-itemlist-jsonld").textContent();
    expect(itemListJsonLd).toContain("Removedor de Acentos");
    expect(itemListJsonLd).toContain("/texto/removedor-acentos");

    const sitemap = await page.request.get("/sitemap.xml");
    const body = await sitemap.text();
    expect(body).toContain("/texto/removedor-acentos");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/texto/removedor-acentos");

    await page
      .getByTestId("accent-remover-input")
      .fill(`palavra ${"muito-comprida-com-acentuação".repeat(12)}\n`.repeat(8));
    await page.getByTestId("accent-remover-mode-compatibilidade").click();
    await expect(page.getByTestId("accent-remover-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
