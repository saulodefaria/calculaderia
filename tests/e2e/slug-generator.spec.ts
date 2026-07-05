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
      separator: url.searchParams.get("sep"),
      maxLength: url.searchParams.get("max"),
      lowercase: url.searchParams.get("minusculas"),
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

function expectTextOmittedFromUrls(urls: string[], text: string) {
  const encodedText = encodeURIComponent(text);
  const compactEncodedText = encodedText.replace(/%20/g, "+");

  for (const url of urls) {
    const decodedUrl = decodeURIComponent(url);

    expect(decodedUrl).not.toContain(text);
    expect(url).not.toContain(encodedText);
    expect(url).not.toContain(compactEncodedText);
  }
}

test.describe("slug generator", () => {
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

  test("loads, generates a slug live, and keeps typed text out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/gerador-slug");

    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Gerador de Slug", level: 1 })).toBeVisible();
    await expect(main.getByTestId("slug-generator-input")).toBeVisible();
    await expect(
      main.getByText("A geração acontece no seu navegador. Esta ferramenta não envia o texto para o servidor.")
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dúvidas rápidas", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sobre o gerador de slug", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como gerar slug online", level: 2 })).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Texto", exact: true })).toHaveAttribute("href", "/texto");
    await expect(breadcrumb.getByRole("link", { name: "Transformação de texto" })).toHaveAttribute(
      "href",
      "/texto/categorias/transformacao-texto"
    );

    const sample = "Olá, mundo! Café com açúcar";
    await main.getByTestId("slug-generator-input").fill(sample);
    await expect(main.getByTestId("slug-generator-status")).toContainText("Slug gerado");
    await expect(main.getByTestId("slug-generator-output")).toHaveValue("ola-mundo-cafe-com-acucar");
    await expect(main.getByTestId("slug-generator-path")).toHaveValue("/ola-mundo-cafe-com-acucar");
    await expect(main.getByTestId("slug-generator-warning-accentApproximation")).toBeVisible();
    expectLiveUrlToOmitText(page, sample);

    await main.getByTestId("slug-generator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/gerador-slug",
      separator: null,
      maxLength: null,
      lowercase: null,
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: null,
      hashText: null,
    });
  });

  test("treats compatibility symbols as boundaries in the browser", async ({ page }) => {
    await page.goto("/texto/gerador-slug");

    const text = "Produto № 5 / Etapa ① final / Marca ℠ lançada / Pacote ㎏ extra";
    await page.getByTestId("slug-generator-input").fill(text);

    await expect(page.getByTestId("slug-generator-output")).toHaveValue(
      "produto-5-etapa-final-marca-lancada-pacote-extra"
    );
    await expect(page.getByTestId("slug-generator-path")).toHaveValue(
      "/produto-5-etapa-final-marca-lancada-pacote-extra"
    );
    expectLiveUrlToOmitText(page, text);
  });

  test("updates safe settings through separator, lowercase, and max length controls", async ({ page }) => {
    await page.goto("/texto/gerador-slug");

    const main = page.getByRole("main");
    const sample = "Curso de Next.js: página #1";

    await main.getByTestId("slug-generator-input").fill(sample);
    await main.getByTestId("slug-generator-separator-underscore").click();
    await expect(main.getByTestId("slug-generator-output")).toHaveValue("curso_de_next_js_pagina_1");

    await main.getByTestId("slug-generator-max-length").fill("18");
    await expect(main.getByTestId("slug-generator-output")).toHaveValue("curso_de_next_js");
    await expect(main.getByTestId("slug-generator-warning-trimmedToLimit")).toBeVisible();

    await main.getByTestId("slug-generator-lowercase").uncheck();
    await expect(main.getByTestId("slug-generator-output")).toHaveValue("Curso_de_Next_js");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("sep")).toBe("underscore");
    expect(liveUrl.searchParams.get("max")).toBe("18");
    expect(liveUrl.searchParams.get("minusculas")).toBe("0");
    expectLiveUrlToOmitText(page, sample);
  });

  test("does not leak source text through save, storage, cookies, or request URLs", async ({ page }) => {
    const requestUrls: string[] = [];

    page.on("request", (request) => {
      requestUrls.push(request.url());
    });

    await page.goto("/texto/gerador-slug");

    const text = "Campanha sigilosa Q3: Café & preço interno";
    const main = page.getByRole("main");
    await page.getByTestId("slug-generator-input").fill(text);
    await expect(page.getByTestId("slug-generator-output")).toHaveValue("campanha-sigilosa-q3-cafe-preco-interno");
    await expect(main.getByRole("button", { name: /salvar/i })).toHaveCount(0);

    const storageSnapshot = await page.evaluate(async () => {
      const localStorageEntries = Object.entries(window.localStorage);
      const sessionStorageEntries = Object.entries(window.sessionStorage);
      const indexedDatabaseNames =
        typeof indexedDB.databases === "function"
          ? (await indexedDB.databases()).map((database) => database.name ?? "")
          : [];

      return {
        localStorageEntries,
        sessionStorageEntries,
        indexedDatabaseNames,
      };
    });
    const cookies = await page.context().cookies();

    expect(JSON.stringify(storageSnapshot)).not.toContain(text);
    expect(JSON.stringify(cookies)).not.toContain(text);
    expectTextOmittedFromUrls(requestUrls, text);
    const apiPaths = requestUrls.map((url) => new URL(url).pathname).filter((pathname) => pathname.startsWith("/api/"));
    expect(apiPaths.every((pathname) => pathname === "/api/auth/session")).toBe(true);
    expect(apiPaths).not.toContain("/api/favorites");
    expectLiveUrlToOmitText(page, text);
  });

  test("shares content only through an explicit hash fragment", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/gerador-slug?sep=underscore&max=60");

    const text = "Título privado com café";
    await page.getByTestId("slug-generator-input").fill(text);
    await page.getByTestId("slug-generator-include-content").check();
    await expect(page.getByTestId("slug-generator-share-warning")).toContainText("expõem o conteúdo");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("sep")).toBe("underscore");
    expect(liveUrl.searchParams.get("max")).toBe("60");
    expect(liveUrl.searchParams.get("texto")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await page.getByTestId("slug-generator-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/texto/gerador-slug",
      separator: "underscore",
      maxLength: "60",
      lowercase: null,
      searchContentFlag: null,
      searchText: null,
      hashContentFlag: "1",
      hashText: text,
    });
  });

  test("hydrates shared hash content and sanitizes the live URL", async ({ page }) => {
    const text = "texto compartilhado com café";
    await page.goto(`/texto/gerador-slug?sep=underscore&max=80#conteudo=1&texto=${encodeURIComponent(text)}`);

    await expect(page.getByTestId("slug-generator-input").first()).toHaveValue(text);
    await expect(page.getByTestId("slug-generator-output").first()).toHaveValue("texto_compartilhado_com_cafe");
    await expect.poll(() => new URL(page.url()).searchParams.get("texto")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("sep")).toBe("underscore");
    expect(url.searchParams.get("max")).toBe("80");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("copies slug and path, uses output as input, downloads txt, and clears", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/texto/gerador-slug");

    await page.getByTestId("slug-generator-input").fill("Olá mundo");
    await expect(page.getByTestId("slug-generator-output")).toHaveValue("ola-mundo");

    await page.getByTestId("slug-generator-copy-slug").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("ola-mundo");

    await page.getByTestId("slug-generator-copy-path").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("/ola-mundo");

    await page.getByTestId("slug-generator-use-output").click();
    await expect(page.getByTestId("slug-generator-input")).toHaveValue("ola-mundo");
    await expect(page.getByTestId("slug-generator-output")).toHaveValue("ola-mundo");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("slug-generator-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("gerador-slug.txt");

    await page.getByTestId("slug-generator-clear").click();
    await expect(page.getByTestId("slug-generator-status")).toContainText("Aguardando texto");
    await expect(page.getByTestId("slug-generator-output")).toHaveValue("");
  });

  test("renders localized routes and discovery entries", async ({ page }) => {
    await page.goto("/en/texto/gerador-slug");
    await expect(page.getByRole("heading", { name: "Slug Generator", level: 1 })).toBeVisible();

    await page.goto("/es/texto/gerador-slug");
    await expect(page.getByRole("heading", { name: "Generador de Slug", level: 1 })).toBeVisible();

    await page.goto("/texto");
    await expect(page.getByText("Gerador de Slug", { exact: true })).toBeVisible();

    await page.goto("/texto/categorias/transformacao-texto");
    await expect(page.getByRole("heading", { name: "Transformação de texto", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Slug", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/texto/gerador-slug");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/texto/gerador-slug"));

    expect(toolPaths).toEqual(["/texto/gerador-slug", "/en/texto/gerador-slug", "/es/texto/gerador-slug"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/texto/gerador-slug");

    await page
      .getByTestId("slug-generator-input")
      .fill(`Título ${"muito-comprido-com-acento-ação".repeat(12)}\n`.repeat(6));
    await page.getByTestId("slug-generator-separator-underscore").click();
    await expect(page.getByTestId("slug-generator-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
