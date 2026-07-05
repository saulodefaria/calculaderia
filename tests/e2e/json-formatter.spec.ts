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
      indent: url.searchParams.get("recuo"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

test.describe("json formatter", () => {
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

  test("formats, minifies, shares safely, and keeps pasted JSON out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/formatador-json");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Formatador de JSON", level: 1 })).toBeVisible();
    await expect(main.getByTestId("json-formatter-input")).toBeVisible();
    await expect(
      main.getByText("A análise acontece no navegador. O conteúdo não é enviado para o servidor por esta ferramenta.")
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Dados estruturados", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/dados-estruturados"
    );

    const sample = '{"nome":"Ana","ativo":true,"itens":[1,2]}';
    const formatted = '{\n  "nome": "Ana",\n  "ativo": true,\n  "itens": [\n    1,\n    2\n  ]\n}';

    await main.getByTestId("json-formatter-input").fill(sample);
    await expect(main.getByTestId("json-formatter-status")).toContainText("JSON válido");
    await expect(main.getByTestId("json-formatter-output")).toHaveValue(formatted);

    let url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("formatar");
    expect(url.searchParams.get("recuo")).toBe("2");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    await main.getByTestId("json-formatter-indent-4").click();
    await expect(main.getByTestId("json-formatter-output")).toContainText('    "nome": "Ana"');

    await main.getByTestId("json-formatter-mode-minificar").click();
    await expect(main.getByTestId("json-formatter-output")).toHaveValue(sample);
    await expect(main.getByTestId("json-formatter-metric-savings")).toContainText("bytes");

    url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("minificar");
    expect(url.searchParams.get("recuo")).toBe("4");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    const shareButton = main.getByTestId("json-formatter-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/formatador-json",
      mode: "minificar",
      indent: "4",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: null,
      hashInput: null,
    });

    await main.getByTestId("json-formatter-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/formatador-json",
      mode: "minificar",
      indent: "4",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: sample,
    });

    await main.getByTestId("json-formatter-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(sample);

    await main.getByTestId("json-formatter-use-output").click();
    await expect(main.getByTestId("json-formatter-input")).toHaveValue(sample);

    const downloadPromise = page.waitForEvent("download");
    await main.getByTestId("json-formatter-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("formatador-json.json");

    await main.getByTestId("json-formatter-clear").click();
    await expect(main.getByTestId("json-formatter-status")).toContainText("Aguardando JSON");
  });

  test("shows invalid JSON location details and copies the error", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/formatador-json");
    const main = page.getByRole("main");

    await main.getByTestId("json-formatter-input").fill('{\n  "ok": true,\n  "bad":\n}');

    await expect(main.getByTestId("json-formatter-status")).toContainText("JSON inválido");
    await expect(main.getByTestId("json-formatter-error")).toContainText("O conteúdo não é JSON estrito válido.");
    await expect(main.getByTestId("json-formatter-error")).toContainText(/Linha \d+, coluna \d+\./);
    await expect(main.getByTestId("json-formatter-error-snippet")).toContainText("}");

    await main.getByTestId("json-formatter-copy-error").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("JSON estrito válido");

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("prefills shared content and sanitizes the live URL after hydration", async ({ page }) => {
    const shared = '{"token":"privado","ok":true}';
    await page.goto(
      `/dev/formatador-json?modo=minificar&recuo=4#conteudo=1&entrada=${encodeURIComponent(shared)}`
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("json-formatter-input")).toHaveValue(shared);
    await expect(main.getByTestId("json-formatter-output")).toHaveValue(shared);
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("minificar");
    expect(url.searchParams.get("recuo")).toBe("4");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("warns and omits oversized JSON from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/formatador-json");
    const main = page.getByRole("main");

    await main.getByTestId("json-formatter-input").fill(`{"conteudo":"${"valor".repeat(500)}"}`);
    await main.getByTestId("json-formatter-include-content").check();

    const url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("json-formatter-share-button").getByRole("button").click();
    await expect(main.getByText("O JSON é grande demais para um link seguro.")).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/formatador-json",
      mode: "formatar",
      indent: "2",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: null,
    });
  });

  test("lists the dev family, route, and sitemap entries", async ({ page }) => {
    await page.goto("/dev");

    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("Formatador de JSON", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/formatador-json"));

    expect(toolPaths).toEqual(["/dev/formatador-json", "/en/dev/formatador-json", "/es/dev/formatador-json"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/formatador-json");
    const main = page.getByRole("main");

    await main.getByTestId("json-formatter-input").fill(`{"longa":"${"valor".repeat(80)}"}`);
    await expect(main.getByTestId("json-formatter-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
