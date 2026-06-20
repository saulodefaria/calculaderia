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
      alphabet: url.searchParams.get("alfabeto"),
      padding: url.searchParams.get("padding"),
      ignoreWhitespace: url.searchParams.get("ignorarEspacos"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

test.describe("base64 converter", () => {
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

  test("encodes, decodes, shares safely, and keeps pasted content out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/conversor-base64");

    await expect(page.getByRole("heading", { name: "Conversor Base64", level: 1 })).toBeVisible();
    await expect(page.getByTestId("base64-converter-input")).toBeVisible();
    await expect(
      page.getByText("A conversão acontece no navegador. Esta ferramenta não envia o conteúdo para o servidor.")
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Codificação", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/codificacao"
    );

    await page.getByTestId("base64-converter-input").fill("Olá 👋");
    await expect(page.getByTestId("base64-converter-status")).toContainText("Conversão válida");
    await expect(page.getByTestId("base64-converter-output")).toHaveValue("T2zDoSDwn5GL");

    let url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("codificar");
    expect(url.searchParams.get("alfabeto")).toBe("base64");
    expect(url.searchParams.get("padding")).toBe("1");
    expect(url.searchParams.get("ignorarEspacos")).toBe("1");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    await page.getByTestId("base64-converter-input").fill("💩");
    await page.getByTestId("base64-converter-alphabet-base64url").click();
    await expect(page.getByTestId("base64-converter-output")).toHaveValue("8J-SqQ==");
    await page.getByTestId("base64-converter-padding").uncheck();
    await expect(page.getByTestId("base64-converter-output")).toHaveValue("8J-SqQ");
    await expect(page.getByTestId("base64-converter-warning-paddingOmitted")).toBeVisible();

    await page.getByTestId("base64-converter-swap").click();
    await expect(page.getByTestId("base64-converter-mode-decodificar")).toHaveAttribute("data-state", "active");
    await expect(page.getByTestId("base64-converter-input")).toHaveValue("8J-SqQ");
    await expect(page.getByTestId("base64-converter-output")).toHaveValue("💩");
    await expect(page.getByTestId("base64-converter-warning-paddingInferred")).toBeVisible();

    url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("decodificar");
    expect(url.searchParams.get("alfabeto")).toBe("base64url");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    const shareButton = page.getByTestId("base64-converter-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/conversor-base64",
      mode: "decodificar",
      alphabet: "base64url",
      padding: "0",
      ignoreWhitespace: "1",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: null,
      hashInput: null,
    });

    await page.getByTestId("base64-converter-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/conversor-base64",
      mode: "decodificar",
      alphabet: "base64url",
      padding: "0",
      ignoreWhitespace: "1",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: "8J-SqQ",
    });

    await page.getByTestId("base64-converter-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("💩");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("base64-converter-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("conversor-base64.txt");

    await page.getByTestId("base64-converter-clear").click();
    await expect(page.getByTestId("base64-converter-status")).toContainText("Aguardando entrada");
  });

  test("shows malformed Base64 and invalid UTF-8 errors", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/conversor-base64");

    await page.getByTestId("base64-converter-mode-decodificar").click();
    await page.getByTestId("base64-converter-input").fill("SGVs\nbG8=");
    await expect(page.getByTestId("base64-converter-status")).toContainText("Conversão válida");
    await expect(page.getByTestId("base64-converter-output")).toHaveValue("Hello");
    await expect(page.getByTestId("base64-converter-warning-whitespaceIgnored")).toBeVisible();

    await page.getByTestId("base64-converter-ignore-whitespace").uncheck();
    await expect(page.getByTestId("base64-converter-status")).toContainText("Base64 inválido");
    await expect(page.getByTestId("base64-converter-error")).toContainText(
      "A entrada contém caracteres fora do alfabeto selecionado."
    );

    await page.getByTestId("base64-converter-input").fill("SGV%");

    await expect(page.getByTestId("base64-converter-status")).toContainText("Base64 inválido");
    await expect(page.getByTestId("base64-converter-error")).toContainText(
      "A entrada contém caracteres fora do alfabeto selecionado."
    );

    await page.getByTestId("base64-converter-copy-error").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("invalidCharacter");

    await page.getByTestId("base64-converter-input").fill("/w==");
    await expect(page.getByTestId("base64-converter-status")).toContainText("UTF-8 inválido");
    await expect(page.getByTestId("base64-converter-error")).toContainText(
      "Os bytes decodificados não são texto UTF-8 válido."
    );

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("prefills shared content and sanitizes the live URL after hydration", async ({ page }) => {
    await page.goto(
      `/dev/conversor-base64?modo=decodificar&alfabeto=base64&padding=1&ignorarEspacos=1#conteudo=1&entrada=${encodeURIComponent(
        "SGVsbG8="
      )}`
    );

    await expect.poll(() => page.getByTestId("base64-converter-input").count()).toBe(1);
    await expect(page.getByTestId("base64-converter-input").first()).toHaveValue("SGVsbG8=");
    await expect(page.getByTestId("base64-converter-output").first()).toHaveValue("Hello");
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("decodificar");
    expect(url.searchParams.get("alfabeto")).toBe("base64");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("warns and omits oversized input from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/conversor-base64");

    await page.getByTestId("base64-converter-input").fill("valor".repeat(500));
    await page.getByTestId("base64-converter-include-content").check();

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");

    await page.getByTestId("base64-converter-share-button").getByRole("button").click();
    await expect(page.getByText("A entrada é grande demais para um link seguro.")).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/conversor-base64",
      mode: "codificar",
      alphabet: "base64",
      padding: "1",
      ignoreWhitespace: "1",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: null,
    });
  });

  test("lists the dev family, route, category, and sitemap entries", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByTestId("tool-family-card-dev")).toBeVisible();
    await page.getByTestId("tool-family-card-dev").click();
    await expect(page).toHaveURL(/\/dev$/);
    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor Base64", { exact: true })).toBeVisible();
    await expect(page.getByText("Formatador de JSON", { exact: true })).toBeVisible();

    await page.goto("/dev/categorias/codificacao");
    await expect(page.getByRole("heading", { name: "Codificação", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor Base64", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/conversor-base64");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/conversor-base64"));

    expect(toolPaths).toEqual(["/dev/conversor-base64", "/en/dev/conversor-base64", "/es/dev/conversor-base64"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/conversor-base64");

    await page.getByTestId("base64-converter-input").fill("valor".repeat(160));
    await expect(page.getByTestId("base64-converter-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
