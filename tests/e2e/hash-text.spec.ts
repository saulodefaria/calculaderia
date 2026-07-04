import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const sha256Abc = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const md5Abc = "900150983cd24fb0d6963f7d28e17f72";

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      algorithm: url.searchParams.get("alg"),
      format: url.searchParams.get("fmt"),
      uppercase: url.searchParams.get("upper"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      searchHash: url.searchParams.get("hash"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
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

function getVisibleTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

function isKnownAuthConsoleNoise(text: string) {
  return text.includes("ClientFetchError: Failed to fetch") && text.includes("errors.authjs.dev#autherror");
}

test.describe("hash text generator", () => {
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

  test("generates hashes, warns for legacy algorithms, and keeps live URLs safe", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/hash-texto");

    await expect(page.getByRole("heading", { name: "Gerador de Hash", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "hash-text-input")).toBeVisible();
    await expect(
      page.getByText("O hash é calculado no navegador. Esta ferramenta não envia o texto para o servidor.")
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Hashes", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/hashes"
    );

    await getVisibleTestId(page, "hash-text-input").fill("a");
    await getVisibleTestId(page, "hash-text-input").fill("ab");
    await getVisibleTestId(page, "hash-text-input").fill("abc");
    await expect(getVisibleTestId(page, "hash-text-status")).toContainText("Hash gerado");
    await expect.poll(() => getVisibleTestId(page, "hash-text-output").inputValue()).toBe(sha256Abc);
    await page.waitForTimeout(100);
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue(sha256Abc);
    await expect(getVisibleTestId(page, "hash-text-comparison-sha-256")).toContainText(sha256Abc);
    await expect(getVisibleTestId(page, "hash-text-comparison-md5")).toContainText(md5Abc);

    const url = new URL(page.url());
    expect([...url.searchParams.keys()].sort()).toEqual(["alg", "fmt", "upper"]);
    expect(url.searchParams.get("alg")).toBe("sha-256");
    expect(url.searchParams.get("fmt")).toBe("hex");
    expect(url.searchParams.get("upper")).toBe("0");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.searchParams.get("hash")).toBeNull();
    expect(url.hash).toBe("");

    await getVisibleTestId(page, "hash-text-uppercase").check();
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue(sha256Abc.toUpperCase());
    await getVisibleTestId(page, "hash-text-format-base64").click();
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue(
      "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0="
    );

    await getVisibleTestId(page, "hash-text-algorithm-md5").click();
    await getVisibleTestId(page, "hash-text-format-hex").click();
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue(md5Abc.toUpperCase());
    await expect(getVisibleTestId(page, "hash-text-legacy-warning")).toContainText("MD5 não é seguro");
    await expect(getVisibleTestId(page, "hash-text-warning-md5CollisionRisk")).toBeVisible();

    await getVisibleTestId(page, "hash-text-uppercase").uncheck();
    await getVisibleTestId(page, "hash-text-algorithm-sha-1").click();
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue("a9993e364706816aba3e25717850c26c9cd0d89d");
    await expect(getVisibleTestId(page, "hash-text-legacy-warning")).toContainText("SHA-1 é legado");
    await expect(getVisibleTestId(page, "hash-text-warning-sha1Retired")).toBeVisible();

    await getVisibleTestId(page, "hash-text-algorithm-sha-256").click();
    await getVisibleTestId(page, "hash-text-copy-hash").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(sha256Abc);

    await getVisibleTestId(page, "hash-text-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("SHA-256");

    await getVisibleTestId(page, "hash-text-copy-all").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(md5Abc);

    const downloadPromise = page.waitForEvent("download");
    await getVisibleTestId(page, "hash-text-download").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("hash-texto.txt");

    await expect(page.getByRole("button", { name: /salvar|favorito/i })).toHaveCount(0);
    for (const persistedValue of Object.values(await getPersistenceSnapshot(page))) {
      expect(persistedValue).not.toContain("abc");
      expect(persistedValue).not.toContain(sha256Abc);
      expect(persistedValue).not.toContain(md5Abc);
    }

    await getVisibleTestId(page, "hash-text-clear").click();
    await expect(getVisibleTestId(page, "hash-text-status")).toContainText("Aguardando texto");
  });

  test("shares only safe settings by default and explicit input only in the fragment", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const observedRequests: string[] = [];
    page.on("request", (request) => {
      observedRequests.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`);
    });
    await page.goto("/dev/hash-texto");

    const privateInput = "token: privado";
    await getVisibleTestId(page, "hash-text-input").fill(privateInput);
    await expect(getVisibleTestId(page, "hash-text-output")).toHaveValue(/.+/);
    const privateHash = await getVisibleTestId(page, "hash-text-output").inputValue();

    const shareButton = getVisibleTestId(page, "hash-text-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/hash-texto",
      algorithm: "sha-256",
      format: "hex",
      uppercase: "0",
      searchContentFlag: null,
      searchInput: null,
      searchHash: null,
      hashContentFlag: null,
      hashInput: null,
      rawText: expect.not.stringContaining("token"),
    });
    const defaultShareUrl = (await getClipboardUrlSnapshot(page))?.rawText ?? "";
    expect(defaultShareUrl).not.toContain(privateInput);
    expect(defaultShareUrl).not.toContain(privateHash);

    await getVisibleTestId(page, "hash-text-include-content").check();
    let url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/hash-texto",
      algorithm: "sha-256",
      format: "hex",
      uppercase: "0",
      searchContentFlag: null,
      searchInput: null,
      searchHash: null,
      hashContentFlag: "1",
      hashInput: privateInput,
      rawText: expect.stringContaining("#conteudo=1"),
    });
    for (const persistedValue of Object.values(await getPersistenceSnapshot(page))) {
      expect(persistedValue).not.toContain(privateInput);
      expect(persistedValue).not.toContain(privateHash);
    }
    expect(observedRequests.filter((request) => request.includes(privateInput) || request.includes(privateHash))).toEqual(
      []
    );

    await getVisibleTestId(page, "hash-text-input").fill("valor".repeat(500));
    await shareButton.click();
    await expect(page.getByText("A entrada é grande demais para um link seguro.")).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/hash-texto",
      algorithm: "sha-256",
      format: "hex",
      uppercase: "0",
      searchContentFlag: null,
      searchInput: null,
      searchHash: null,
      hashContentFlag: "1",
      hashInput: null,
      rawText: expect.not.stringContaining("valorvalor"),
    });

    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");
  });

  test("prefills explicit fragment input and sanitizes the address bar", async ({ page }) => {
    await page.goto(`/dev/hash-texto?alg=md5&fmt=hex&upper=0#conteudo=1&entrada=${encodeURIComponent("abc")}`);

    await expect.poll(() => getVisibleTestId(page, "hash-text-input").count()).toBe(1);
    await expect(getVisibleTestId(page, "hash-text-input").first()).toHaveValue("abc");
    await expect(getVisibleTestId(page, "hash-text-output").first()).toHaveValue(md5Abc);
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("alg")).toBe("md5");
    expect(url.searchParams.get("fmt")).toBe("hex");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("lists the dev family, hashes category, route, and sitemap entries", async ({ page }) => {
    await page.goto("/ferramentas");
    await expect(page.getByTestId("tool-family-card-dev")).toBeVisible();
    await page.getByTestId("tool-family-card-dev").click();
    await expect(page).toHaveURL(/\/dev$/);

    await page.goto("/dev");

    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Hash", { exact: true })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-hashes")).toBeVisible();

    await page.goto("/dev/categorias/hashes");
    await expect(page.getByRole("heading", { name: "Hashes", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Hash", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/hash-texto");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/hash-texto"));

    expect(toolPaths).toEqual(["/dev/hash-texto", "/en/dev/hash-texto", "/es/dev/hash-texto"]);
  });

  test("renders localized routes", async ({ page }) => {
    await page.goto("/en/dev/hash-texto");
    await expect(page.getByRole("heading", { name: "Hash Generator", level: 1 })).toBeVisible();
    await expect(page.getByText("The hash is calculated in the browser.")).toBeVisible();

    await page.goto("/es/dev/hash-texto");
    await expect(page.getByRole("heading", { name: "Generador de hash", level: 1 })).toBeVisible();
    await expect(page.getByText("El hash se calcula en el navegador.")).toBeVisible();
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/hash-texto");

    await getVisibleTestId(page, "hash-text-input").fill("valor".repeat(160));
    await expect(getVisibleTestId(page, "hash-text-output")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
