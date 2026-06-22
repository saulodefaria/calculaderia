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
      preserveLineBreaks: url.searchParams.get("preservarQuebras"),
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

test.describe("case converter", () => {
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

  test("loads, converts text live, and keeps typed text out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/conversor-maiusculas");

    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Conversor de Maiúsculas e Minúsculas", level: 1 })).toBeVisible();
    await expect(main.getByTestId("case-converter-input")).toBeVisible();
    await expect(
      main.getByText("A conversão acontece no seu navegador. O texto não é enviado para o servidor")
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Texto", exact: true })).toHaveAttribute("href", "/texto");
    await expect(breadcrumb.getByRole("link", { name: "Transformação de texto" })).toHaveAttribute(
      "href",
      "/texto/categorias/transformacao-texto"
    );

    const sample = "Olá mundo\nlinha dois";
    await main.getByTestId("case-converter-input").fill(sample);
    await expect(main.getByTestId("case-converter-status")).toContainText("Texto convertido");
    await expect(main.getByTestId("case-converter-output")).toHaveValue("OLÁ MUNDO\nLINHA DOIS");
    expectLiveUrlToOmitText(page, sample);

    await main.getByTestId("case-converter-mode-capitalizar-palavras").click();
    const decomposedText = "e\u0301clair cafe\u0301";
    await main.getByTestId("case-converter-input").fill(decomposedText);
    await expect(main.getByTestId("case-converter-output")).toHaveValue("E\u0301clair Cafe\u0301");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("capitalizar-palavras");
    expect(liveUrl.searchParams.get("texto")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await main.getByTestId("case-converter-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/conversor-maiusculas",
      mode: "capitalizar-palavras",
      preserveLineBreaks: null,
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: null,
      hashText: null,
    });
  });

  test("converts realistic multiline text through every planned mode", async ({ page }) => {
    await page.goto("/texto/conversor-maiusculas");

    const main = page.getByRole("main");
    const input = main.getByTestId("case-converter-input");
    const output = main.getByTestId("case-converter-output");
    const sample = "olá mundo. segunda linha!\nAÇÃO e teste";
    const modeExpectations = [
      ["maiusculas", "OLÁ MUNDO. SEGUNDA LINHA!\nAÇÃO E TESTE"],
      ["minusculas", "olá mundo. segunda linha!\nação e teste"],
      ["frase", "Olá mundo. Segunda linha!\nAção e teste"],
      ["titulo", "Olá Mundo. Segunda Linha!\nAção e Teste"],
      ["capitalizar-palavras", "Olá Mundo. Segunda Linha!\nAção E Teste"],
      ["alternado", "OlÁ mUnDo. SeGuNdA lInHa!\nAçÃo E tEsTe"],
      ["inverter", "OLÁ MUNDO. SEGUNDA LINHA!\nação E TESTE"],
    ] as const;

    await input.fill(sample);

    for (const [mode, expectedOutput] of modeExpectations) {
      await main.getByTestId(`case-converter-mode-${mode}`).click();
      await expect(output).toHaveValue(expectedOutput);
      expectLiveUrlToOmitText(page, sample);
    }
  });

  test("shares content only through an explicit hash fragment", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/conversor-maiusculas?modo=titulo");

    const text = "texto privado\ncom acento";
    await page.getByTestId("case-converter-input").fill(text);
    await page.getByTestId("case-converter-include-content").check();
    await expect(page.getByTestId("case-converter-share-warning")).toContainText("expõem o conteúdo");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("modo")).toBe("titulo");
    expect(liveUrl.searchParams.get("texto")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await page.getByTestId("case-converter-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/conversor-maiusculas",
      mode: "titulo",
      preserveLineBreaks: null,
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: "1",
      hashText: text,
    });
  });

  test("hydrates shared hash content and sanitizes the live URL", async ({ page }) => {
    const text = "texto compartilhado";
    await page.goto(`/texto/conversor-maiusculas?modo=titulo#conteudo=1&texto=${encodeURIComponent(text)}`);

    await expect(page.getByTestId("case-converter-input").first()).toHaveValue(text);
    await expect(page.getByTestId("case-converter-output").first()).toHaveValue("Texto Compartilhado");
    await expect.poll(() => new URL(page.url()).searchParams.get("texto")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("titulo");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("copies output, uses output as input, downloads txt, and clears", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/conversor-maiusculas");

    await page.getByTestId("case-converter-input").fill("Olá mundo");
    await expect(page.getByTestId("case-converter-output")).toHaveValue("OLÁ MUNDO");

    await page.getByTestId("case-converter-copy-output").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("OLÁ MUNDO");

    await page.getByTestId("case-converter-use-output").click();
    await expect(page.getByTestId("case-converter-input")).toHaveValue("OLÁ MUNDO");
    await expect(page.getByTestId("case-converter-output")).toHaveValue("OLÁ MUNDO");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("case-converter-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("conversor-maiusculas.txt");

    await page.getByTestId("case-converter-clear").click();
    await expect(page.getByTestId("case-converter-status")).toContainText("Aguardando texto");
    await expect(page.getByTestId("case-converter-output")).toHaveValue("");
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/texto/conversor-maiusculas");

    await page
      .getByTestId("case-converter-input")
      .fill(`palavra ${"muito-comprida-sem-quebra".repeat(12)}\n`.repeat(8));
    await page.getByTestId("case-converter-mode-titulo").click();
    await expect(page.getByTestId("case-converter-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
