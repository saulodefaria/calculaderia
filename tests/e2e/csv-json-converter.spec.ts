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
      delimiter: url.searchParams.get("delimitador"),
      header: url.searchParams.get("cabecalho"),
      outputShape: url.searchParams.get("saida"),
      types: url.searchParams.get("tipos"),
      emptyLines: url.searchParams.get("linhas"),
      indent: url.searchParams.get("recuo"),
      formulas: url.searchParams.get("formulas"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

async function getStorageTextSnapshot(page: Page) {
  return page.evaluate(async () => {
    const storageToText = (storage: Storage) => JSON.stringify(Object.entries(storage));
    const databaseNames =
      "indexedDB" in window && typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name ?? "").join("\n")
        : "";

    return {
      localStorage: storageToText(localStorage),
      sessionStorage: storageToText(sessionStorage),
      indexedDB: databaseNames,
      cookie: document.cookie,
    };
  });
}

test.describe("csv json converter", () => {
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

  test("converts CSV and JSON, imports local files, and keeps sensitive input out of live URLs", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const leakedRequests: string[] = [];
    const apiRequests: string[] = [];
    const favoritesRequests: string[] = [];
    const sensitive = "segredo-csv-json";
    const fileName = "clientes.csv";

    page.on("request", (request) => {
      const requestUrl = request.url();
      const pathname = new URL(requestUrl).pathname;
      const postData = request.postData() ?? "";

      if (
        requestUrl.includes(sensitive) ||
        postData.includes(sensitive) ||
        requestUrl.includes(fileName) ||
        postData.includes(fileName)
      ) {
        leakedRequests.push(`${request.method()} ${requestUrl}`);
      }

      if (pathname.startsWith("/api/")) {
        apiRequests.push(`${request.method()} ${pathname}`);
      }

      if (pathname.startsWith("/api/favorites")) {
        favoritesRequests.push(`${request.method()} ${pathname}`);
      }
    });

    await page.goto("/dev/conversor-csv-json");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Conversor CSV JSON", level: 1 })).toBeVisible();
    await expect(main.getByTestId("csv-json-input")).toBeVisible();
    await expect(main.getByText("A conversão acontece no navegador. Esta ferramenta não envia o texto colado")).toBeVisible();

    await main.getByTestId("csv-json-input").fill(`nome,email,token\nAna,ana@example.com,${sensitive}`);
    await expect(main.getByTestId("csv-json-status")).toContainText("Conversão válida");
    await expect(main.getByTestId("csv-json-output")).toContainText('"nome": "Ana"');
    await expect(main.getByTestId("csv-json-output")).toContainText(sensitive);
    await expect(main.getByTestId("csv-json-detected-delimiter")).toContainText("Vírgula");

    let url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("csvParaJson");
    expect(url.searchParams.get("delimitador")).toBe("auto");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("csv-json-delimiter-pontoEVirgula").click();
    await main.getByTestId("csv-json-input").fill("nome;email\nAna;ana@example.com");
    await expect(main.getByTestId("csv-json-output")).toContainText('"email": "ana@example.com"');

    await main.getByTestId("csv-json-delimiter-virgula").click();
    await main.getByTestId("csv-json-input").fill('nome,email\n"Ana,ana@example.com');
    await expect(main.getByTestId("csv-json-status")).toContainText("CSV inválido");
    await expect(main.getByTestId("csv-json-error")).toContainText("aspas abertas");

    await main.getByTestId("csv-json-mode-jsonParaCsv").click();
    await main.getByTestId("csv-json-input").fill('[{"nome":"Ana","formula":"=SUM(A1:A2)","tags":["dev"]}]');
    await expect(main.getByTestId("csv-json-status")).toContainText("Conversão válida");
    await expect(main.getByTestId("csv-json-output")).toHaveValue(/nome,formula,tags/);
    await expect(main.getByTestId("csv-json-output")).toHaveValue(/Ana,=SUM\(A1:A2\)/);
    await expect(main.getByTestId("csv-json-warning-formulaLikeCells")).toBeVisible();
    await expect(main.getByTestId("csv-json-warning-nestedValuesSerialized")).toBeVisible();

    await main.getByTestId("csv-json-escape-formulas").check();
    await expect(main.getByTestId("csv-json-output")).toHaveValue(/Ana,'=SUM\(A1:A2\)/);
    await expect(main.getByTestId("csv-json-warning-formulaEscaped")).toBeVisible();

    await main.getByTestId("csv-json-input").fill('[{"nome":]');
    await expect(main.getByTestId("csv-json-status")).toContainText("JSON inválido");
    await expect(main.getByTestId("csv-json-error")).toContainText("JSON estrito válido");

    await main.getByTestId("csv-json-mode-csvParaJson").click();
    await main.getByTestId("csv-json-file").setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from("nome,email\nCarla,carla@example.com"),
    });
    await expect(main.getByTestId("csv-json-file-status")).toContainText("Arquivo local carregado");
    await expect(main.getByTestId("csv-json-output")).toContainText('"Carla"');
    expect(page.url()).not.toContain(fileName);

    const shareButton = main.getByTestId("csv-json-share-button").getByRole("button");
    await main.getByTestId("csv-json-input").fill(`nome,token\nAna,${sensitive}`);
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toMatchObject({
      pathname: "/dev/conversor-csv-json",
      mode: "csvParaJson",
      delimiter: "virgula",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: null,
      hashInput: null,
    });

    await main.getByTestId("csv-json-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toMatchObject({
      pathname: "/dev/conversor-csv-json",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: `nome,token\nAna,${sensitive}`,
    });

    await main.getByTestId("csv-json-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(sensitive);

    const downloadPromise = page.waitForEvent("download");
    await main.getByTestId("csv-json-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("conversor-csv-json.json");

    const storageSnapshot = await getStorageTextSnapshot(page);
    expect(storageSnapshot.localStorage).not.toContain(sensitive);
    expect(storageSnapshot.sessionStorage).not.toContain(sensitive);
    expect(storageSnapshot.indexedDB).not.toContain(sensitive);
    expect(storageSnapshot.cookie).not.toContain(sensitive);
    expect(storageSnapshot.localStorage).not.toContain(fileName);
    expect(storageSnapshot.sessionStorage).not.toContain(fileName);
    expect(storageSnapshot.indexedDB).not.toContain(fileName);
    expect(storageSnapshot.cookie).not.toContain(fileName);
    expect(leakedRequests).toEqual([]);
    expect(favoritesRequests).toEqual([]);
    expect(apiRequests.every((request) => request === "GET /api/auth/session")).toBe(true);
    await expect(page.getByRole("button", { name: /salvar/i })).toHaveCount(0);
  });

  test("wires tab delimiter, type inference, header warnings, and pipe delimiter output", async ({ page }) => {
    await page.goto("/dev/conversor-csv-json");
    const main = page.getByRole("main");

    await main.getByTestId("csv-json-delimiter-tab").click();
    await main.getByTestId("csv-json-types-inferir").click();
    await main.getByTestId("csv-json-input").fill("id\tid\t\tativo\tvalor\n001\t2\tsem-cabecalho\ttrue\t12.5");

    await expect(main.getByTestId("csv-json-status")).toContainText("Conversão válida");
    await expect(main.getByTestId("csv-json-detected-delimiter")).toContainText("Tab");
    await expect(main.getByTestId("csv-json-output")).toContainText('"id": "001"');
    await expect(main.getByTestId("csv-json-output")).toContainText('"id_2": 2');
    await expect(main.getByTestId("csv-json-output")).toContainText('"column_3": "sem-cabecalho"');
    await expect(main.getByTestId("csv-json-output")).toContainText('"ativo": true');
    await expect(main.getByTestId("csv-json-output")).toContainText('"valor": 12.5');
    await expect(main.getByTestId("csv-json-warning-duplicateHeadersRenamed")).toBeVisible();
    await expect(main.getByTestId("csv-json-warning-emptyHeadersGenerated")).toBeVisible();
    await expect(main.getByTestId("csv-json-warning-typesInferred")).toBeVisible();

    await main.getByTestId("csv-json-delimiter-pipe").click();
    await main.getByTestId("csv-json-input").fill("nome|idade\nBia|29");

    await expect(main.getByTestId("csv-json-detected-delimiter")).toContainText("Pipe");
    await expect(main.getByTestId("csv-json-output")).toContainText('"nome": "Bia"');
    await expect(main.getByTestId("csv-json-output")).toContainText('"idade": 29');
  });

  test("prefills explicit hash content and sanitizes the address bar after hydration", async ({ page }) => {
    const shared = "nome,email\nAna,ana@example.com";
    await page.goto(
      `/dev/conversor-csv-json?modo=csvParaJson&delimitador=virgula#conteudo=1&entrada=${encodeURIComponent(shared)}`
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("csv-json-input")).toHaveValue(shared);
    await expect(main.getByTestId("csv-json-output")).toContainText('"Ana"');
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("csvParaJson");
    expect(url.searchParams.get("delimitador")).toBe("virgula");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("omits oversized input from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/conversor-csv-json");
    const main = page.getByRole("main");

    await main.getByTestId("csv-json-input").fill(`nome,valor\nAna,${"valor".repeat(500)}`);
    await main.getByTestId("csv-json-include-content").check();
    await main.getByTestId("csv-json-share-button").getByRole("button").click();

    await expect(main.getByText("A entrada é grande demais para um link seguro.")).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toMatchObject({
      pathname: "/dev/conversor-csv-json",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: null,
    });
  });

  test("lists the route in discovery, localized smoke routes, and sitemap", async ({ page }) => {
    await page.goto("/dev");

    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor CSV JSON", { exact: true })).toBeVisible();

    await page.goto("/dev/categorias/dados-estruturados");
    await expect(page.getByRole("heading", { name: "Dados estruturados", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor CSV JSON", { exact: true })).toBeVisible();

    await page.goto("/en/dev/conversor-csv-json");
    await expect(page.getByRole("heading", { name: "CSV JSON Converter", level: 1 })).toBeVisible();

    await page.goto("/es/dev/conversor-csv-json");
    await expect(page.getByRole("heading", { name: "Conversor CSV JSON", level: 1 })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/conversor-csv-json");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/conversor-csv-json"));

    expect(toolPaths).toEqual([
      "/dev/conversor-csv-json",
      "/en/dev/conversor-csv-json",
      "/es/dev/conversor-csv-json",
    ]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/conversor-csv-json");
    const main = page.getByRole("main");

    await main.getByTestId("csv-json-input").fill(`coluna_muito_longa\n${"valor".repeat(120)}`);
    await main.getByTestId("csv-json-delimiter-virgula").click();
    await expect(main.getByTestId("csv-json-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
