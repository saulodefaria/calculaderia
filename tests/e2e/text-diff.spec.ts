import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

function isKnownAuthConsoleNoise(text: string) {
  return text.includes("ClientFetchError: Failed to fetch") && text.includes("errors.authjs.dev#autherror");
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      mode: url.searchParams.get("modo"),
      view: url.searchParams.get("visao"),
      ignoreCase: url.searchParams.get("ignorarCaixa"),
      ignoreTrailingSpaces: url.searchParams.get("ignorarEspacosFinais"),
      ignoreBlankLines: url.searchParams.get("ignorarLinhasVazias"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchOriginal: url.searchParams.get("original"),
      searchRevised: url.searchParams.get("alterado"),
      hashContentFlag: hashParams.get("conteudo"),
      hashOriginal: hashParams.get("original"),
      hashRevised: hashParams.get("alterado"),
      rawText: clipboardText,
    };
  } catch {
    return null;
  }
}

async function getPersistenceSnapshot(page: Page) {
  return page.evaluate(async () => {
    const storageToText = (storage: Storage) =>
      Object.keys(storage)
        .map((key) => `${key}=${storage.getItem(key) ?? ""}`)
        .join("\n");
    const indexedDbNames =
      "indexedDB" in window && typeof indexedDB.databases === "function"
        ? JSON.stringify(await indexedDB.databases())
        : "";

    return {
      localStorage: storageToText(localStorage),
      sessionStorage: storageToText(sessionStorage),
      cookies: document.cookie,
      indexedDbNames,
    };
  });
}

function expectLiveUrlToOmitTexts(page: Page, ...texts: string[]) {
  const liveUrl = new URL(page.url());

  expect(liveUrl.searchParams.get("original")).toBeNull();
  expect(liveUrl.searchParams.get("alterado")).toBeNull();
  expect(liveUrl.searchParams.get("conteudo")).toBeNull();
  expect(liveUrl.hash).toBe("");

  for (const text of texts) {
    expect(decodeURIComponent(page.url())).not.toContain(text);
  }
}

test.describe("text diff", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error" && !isKnownAuthConsoleNoise(message.text())) {
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

  test("compares two texts, renders diff blocks, and keeps live URLs safe", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/diff-texto");

    const main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Comparador de Texto", level: 1 })).toBeVisible();
    await expect(main.getByTestId("text-diff-original")).toBeVisible();
    await expect(
      main.getByText("A comparação acontece no seu navegador. Esta ferramenta não envia os textos para o servidor.")
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Texto", exact: true })).toHaveAttribute("href", "/texto");
    await expect(breadcrumb.getByRole("link", { name: "Comparação de texto" })).toHaveAttribute(
      "href",
      "/texto/categorias/comparacao-texto"
    );

    const original = "linha igual\nremovida\nancora\nclausula antiga\nfim";
    const revised = "linha igual\nancora\nclausula nova\nfim\nadicionada";
    await main.getByTestId("text-diff-original").fill(original);
    await main.getByTestId("text-diff-revised").fill(revised);

    await expect(main.getByTestId("text-diff-status")).toContainText("Diferenças encontradas");
    await expect(main.getByTestId("text-diff-summary-added")).toContainText("1");
    await expect(main.getByTestId("text-diff-summary-removed")).toContainText("1");
    await expect(main.getByTestId("text-diff-summary-modified")).toContainText("1");
    await expect(main.getByTestId("text-diff-block-replace").first()).toContainText("clausula antiga");
    await expect(main.getByTestId("text-diff-block-replace").first()).toContainText("clausula nova");
    await expect(main.getByTestId("text-diff-block-delete").first()).toContainText("removida");
    await expect(main.getByTestId("text-diff-block-insert").first()).toContainText("adicionada");
    expectLiveUrlToOmitTexts(page, original, revised);

    await main.getByTestId("text-diff-mode-palavras").click();
    await main.getByTestId("text-diff-view-unificado").click();
    await main.getByTestId("text-diff-ignorarCaixa").check();
    await main.getByTestId("text-diff-ignorarEspacosFinais").check();
    await expect(main.getByTestId("text-diff-unified")).toContainText("- antiga");
    await expect(main.getByTestId("text-diff-unified")).toContainText("+ nova");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("palavras");
    expect(liveUrl.searchParams.get("visao")).toBe("unificado");
    expect(liveUrl.searchParams.get("ignorarCaixa")).toBe("1");
    expect(liveUrl.searchParams.get("ignorarEspacosFinais")).toBe("1");
    expect(liveUrl.searchParams.get("original")).toBeNull();
    expect(liveUrl.searchParams.get("alterado")).toBeNull();

    await main.getByTestId("text-diff-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/diff-texto",
      mode: "palavras",
      view: "unificado",
      ignoreCase: "1",
      ignoreTrailingSpaces: "1",
      ignoreBlankLines: null,
      searchContentFlag: null,
      searchOriginal: null,
      searchRevised: null,
      hashContentFlag: null,
      hashOriginal: null,
      hashRevised: null,
      rawText: expect.not.stringContaining("clausula"),
    });
  });

  test("shares texts only through an explicit hash fragment and stores no pasted content", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const observedRequests: string[] = [];
    page.on("request", (request) => {
      observedRequests.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`);
    });
    await page.goto("/texto/diff-texto?modo=linhas");

    const original = "token original privado";
    const revised = "token alterado privado";
    await page.getByTestId("text-diff-original").fill(original);
    await page.getByTestId("text-diff-revised").fill(revised);
    await expect(page.getByTestId("text-diff-status")).toContainText("Diferenças encontradas");
    expectLiveUrlToOmitTexts(page, original, revised);

    await page.getByTestId("text-diff-include-content").check();
    await expect(page.getByTestId("text-diff-share-warning")).toContainText("expõem as duas versões");
    await page.getByTestId("text-diff-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/diff-texto",
      mode: null,
      view: null,
      ignoreCase: null,
      ignoreTrailingSpaces: null,
      ignoreBlankLines: null,
      searchContentFlag: null,
      searchOriginal: null,
      searchRevised: null,
      hashContentFlag: "1",
      hashOriginal: original,
      hashRevised: revised,
      rawText: expect.stringContaining("#conteudo=1"),
    });

    for (const persistedValue of Object.values(await getPersistenceSnapshot(page))) {
      expect(persistedValue).not.toContain(original);
      expect(persistedValue).not.toContain(revised);
    }
    expect(observedRequests.filter((request) => request.includes(original) || request.includes(revised))).toEqual([]);
    expect(observedRequests.filter((request) => /\/api\/(favorites|simulations)/.test(request))).toEqual([]);
    await expect(page.getByRole("button", { name: /salvar|favorito/i })).toHaveCount(0);

    await page.getByTestId("text-diff-original").fill("valor".repeat(500));
    await page.getByTestId("text-diff-revised").fill("outro".repeat(500));
    await page.getByTestId("text-diff-share-button").getByRole("button").click();
    await expect(page.getByTestId("text-diff-share-warning")).toContainText("grandes demais");
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/diff-texto",
      mode: null,
      view: null,
      ignoreCase: null,
      ignoreTrailingSpaces: null,
      ignoreBlankLines: null,
      searchContentFlag: null,
      searchOriginal: null,
      searchRevised: null,
      hashContentFlag: "1",
      hashOriginal: null,
      hashRevised: null,
      rawText: expect.not.stringContaining("valorvalor"),
    });
  });

  test("hydrates explicit hash content and sanitizes the address bar", async ({ page }) => {
    const original = "Texto Antigo";
    const revised = "texto novo";
    await page.goto(
      `/texto/diff-texto?modo=palavras&visao=unificado#conteudo=1&original=${encodeURIComponent(
        original
      )}&alterado=${encodeURIComponent(revised)}`
    );

    await expect(page.getByTestId("text-diff-original").first()).toHaveValue(original);
    await expect(page.getByTestId("text-diff-revised").first()).toHaveValue(revised);
    await expect(page.getByTestId("text-diff-unified").first()).toContainText("- Texto");
    await expect.poll(() => new URL(page.url()).searchParams.get("original")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("alterado")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("palavras");
    expect(url.searchParams.get("visao")).toBe("unificado");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("applies character mode and ignores blank-line-only differences", async ({ page }) => {
    await page.goto("/texto/diff-texto?modo=caracteres&ignorarLinhasVazias=1");

    await page.getByTestId("text-diff-original").fill("cafe\u0301 🙂 ok\n\nfim");
    await page.getByTestId("text-diff-revised").fill("cafe\u0301 🙂 OK\nfim");
    await expect(page.getByTestId("text-diff-mode-caracteres")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("text-diff-status")).toContainText("Diferenças encontradas");
    await expect(page.getByTestId("text-diff-warning-blankLinesIgnored")).toBeVisible();
    await expect(page.getByTestId("text-diff-block-replace").first()).toContainText("o");
    await expect(page.getByTestId("text-diff-block-replace").first()).toContainText("O");

    await page.getByTestId("text-diff-revised").fill("cafe\u0301 🙂 ok\nfim");
    await expect(page.getByTestId("text-diff-status")).toContainText("Textos idênticos");
    await expect(page.getByTestId("text-diff-summary-changedBlocks")).toContainText("0");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("caracteres");
    expect(liveUrl.searchParams.get("ignorarLinhasVazias")).toBe("1");
    expect(liveUrl.searchParams.get("original")).toBeNull();
    expect(liveUrl.searchParams.get("alterado")).toBeNull();
  });

  test("copies summary and unified diff, swaps texts, downloads txt, and clears", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/diff-texto");

    await page.getByTestId("text-diff-load-example").click();
    await expect(page.getByTestId("text-diff-status")).toContainText("Diferenças encontradas");

    await page.getByTestId("text-diff-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Status: different");

    await page.getByTestId("text-diff-copy-unified").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("- Contrato enviado");

    const originalBeforeSwap = await page.getByTestId("text-diff-original").inputValue();
    const revisedBeforeSwap = await page.getByTestId("text-diff-revised").inputValue();
    await page.getByTestId("text-diff-swap").click();
    await expect(page.getByTestId("text-diff-original")).toHaveValue(revisedBeforeSwap);
    await expect(page.getByTestId("text-diff-revised")).toHaveValue(originalBeforeSwap);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("text-diff-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("diff-texto.txt");

    await page.getByTestId("text-diff-clear").click();
    await expect(page.getByTestId("text-diff-status")).toContainText("Aguardando textos");
    await expect(page.getByTestId("text-diff-original")).toHaveValue("");
    await expect(page.getByTestId("text-diff-revised")).toHaveValue("");
  });

  test("renders localized routes and discovery surfaces", async ({ page }) => {
    await page.goto("/en/texto/diff-texto");
    await expect(page.getByRole("heading", { name: "Text Compare", level: 1 })).toBeVisible();

    await page.goto("/es/texto/diff-texto");
    await expect(page.getByRole("heading", { name: "Comparador de Texto", level: 1 })).toBeVisible();

    await page.goto("/texto");
    await expect(page.getByText("Comparador de Texto").first()).toBeVisible();
    await expect(page.locator('a[href="/texto/diff-texto"]').first()).toBeVisible();

    await page.goto("/texto/categorias/comparacao-texto");
    await expect(page.getByRole("heading", { name: "Comparação de texto", level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/texto/diff-texto"]').first()).toBeVisible();

    await page.goto("/ferramentas");
    await expect(page.getByTestId("tool-family-filter-texto")).toContainText("Texto · 5");
    await expect(page.getByTestId("tool-card-diff-texto")).toContainText("Comparador de Texto");
    const itemListJsonLd = await page.locator("script#tools-hub-itemlist-jsonld").textContent();
    expect(itemListJsonLd).toContain("Comparador de Texto");
    expect(itemListJsonLd).toContain("/texto/diff-texto");

    const sitemap = await page.request.get("/sitemap.xml");
    const body = await sitemap.text();
    expect(body).toContain("/texto/diff-texto");
  });

  test("shows large-token guardrails and stays usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/texto/diff-texto");

    await page.getByTestId("text-diff-mode-palavras").click();
    await page.getByTestId("text-diff-original").fill("a ".repeat(3100));
    await page.getByTestId("text-diff-revised").fill("a ".repeat(3100));
    await expect(page.getByTestId("text-diff-status")).toContainText("Comparação grande demais");

    await page.getByTestId("text-diff-mode-linhas").click();
    await page
      .getByTestId("text-diff-original")
      .fill(`linha ${"muito-comprida-sem-quebra".repeat(12)}\n`.repeat(4));
    await page
      .getByTestId("text-diff-revised")
      .fill(`linha ${"muito-comprida-com-alteracao".repeat(12)}\n`.repeat(4));
    await expect(page.getByTestId("text-diff-side-by-side")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
