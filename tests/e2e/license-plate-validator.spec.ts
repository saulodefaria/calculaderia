import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const privatePlate = "ZZZ9H88";

function expectPlateOmittedFromUrls(urls: string[], plate: string) {
  const encodedPlate = encodeURIComponent(plate);

  for (const url of urls) {
    expect(decodeURIComponent(url)).not.toContain(plate);
    expect(url).not.toContain(encodedPlate);
  }
}

async function getBrowserPrivacySnapshot(page: Page) {
  return page.evaluate(async () => {
    const localStorageEntries = Object.entries(window.localStorage);
    const sessionStorageEntries = Object.entries(window.sessionStorage);
    const indexedDbMetadata =
      typeof indexedDB.databases === "function" ? JSON.stringify(await indexedDB.databases()) : "";

    return {
      localStorageEntries,
      sessionStorageEntries,
      cookies: document.cookie,
      indexedDbMetadata,
    };
  });
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      searchMode: url.searchParams.get("modo"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchPlate: url.searchParams.get("placa"),
      hashContentFlag: hashParams.get("conteudo"),
      hashPlate: hashParams.get("placa"),
    };
  } catch {
    return null;
  }
}

test.describe("Brazilian license plate validator", () => {
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

  test("validates a Mercosul plate and shares safely by default", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const requestUrls: string[] = [];
    page.on("request", (request) => {
      requestUrls.push(request.url());
    });

    await page.goto("/validadores/validador-placa");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Validador de Placa Mercosul", level: 1 })).toBeVisible();
    await expect(main.getByTestId("license-plate-validator-input")).toBeVisible();
    await expect(main.getByText("A validação acontece no navegador.")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Veículos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/veiculos"
    );

    await main.getByTestId("license-plate-validator-input").fill(privatePlate);
    await expect(main.getByTestId("license-plate-validator-status")).toContainText("Placa Mercosul válida");
    await expect(main.getByTestId("license-plate-validator-normalized")).toContainText(privatePlate);

    let url = new URL(page.url());
    expect(url.searchParams.get("placa")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");
    expect(page.url()).not.toContain(privatePlate);

    const shareButton = main.getByTestId("license-plate-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-placa",
      searchMode: null,
      searchContentFlag: null,
      searchPlate: null,
      hashContentFlag: null,
      hashPlate: null,
    });
    const privacySnapshot = await getBrowserPrivacySnapshot(page);
    const cookies = await page.context().cookies();
    expect(JSON.stringify(privacySnapshot)).not.toContain(privatePlate);
    expect(JSON.stringify(cookies)).not.toContain(privatePlate);
    expectPlateOmittedFromUrls(requestUrls, privatePlate);
    await expect(main.getByRole("button", { name: /salvar|favoritar|favorito/i })).toHaveCount(0);

    await main.getByTestId("license-plate-validator-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("placa")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-placa",
      searchMode: null,
      searchContentFlag: null,
      searchPlate: null,
      hashContentFlag: "1",
      hashPlate: privatePlate,
    });

    await main.getByTestId("license-plate-validator-copy-normalized").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(privatePlate);
    await main.getByTestId("license-plate-validator-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(`Normalizada: ${privatePlate}`);
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Escopo: validação de formato apenas"
    );
  });

  test("shows old-plate conversion, no old equivalent, and invalid diagnostics", async ({ page }) => {
    await page.goto("/validadores/validador-placa");
    const main = page.getByRole("main");
    const input = main.getByTestId("license-plate-validator-input");

    await input.fill("ABC-1234");
    await expect(main.getByTestId("license-plate-validator-status")).toContainText("Placa antiga válida");
    await expect(main.getByTestId("license-plate-validator-normalized")).toContainText("ABC1234");
    await expect(main.getByTestId("license-plate-validator-formatted")).toContainText("ABC-1234");
    await expect(main.getByTestId("license-plate-validator-conversion")).toContainText("ABC1C34");

    await input.fill("ABC1K34");
    await expect(main.getByTestId("license-plate-validator-status")).toContainText("Placa Mercosul válida");
    await expect(main.getByTestId("license-plate-validator-conversion")).toContainText("não há equivalente antigo");

    await input.fill("ABC_1234");
    await expect(main.getByTestId("license-plate-validator-status")).toContainText("Formato inválido");
    await expect(main.getByTestId("license-plate-validator-diagnostics")).toContainText("Remova acentos");
    expect(new URL(page.url()).searchParams.get("placa")).toBeNull();
  });

  test("prefills explicit shared content and sanitizes the live URL after hydration", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/validador-placa#conteudo=1&placa=ABC1D23");
    const main = page.getByRole("main");

    await expect(main.getByTestId("license-plate-validator-input")).toHaveValue("ABC1D23");
    await expect(main.getByTestId("license-plate-validator-status")).toContainText("Placa Mercosul válida");
    await expect.poll(() => new URL(page.url()).searchParams.get("placa")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    await expect(main.getByTestId("license-plate-validator-include-content")).not.toBeChecked();

    const shareButton = main.getByTestId("license-plate-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-placa",
      searchMode: null,
      searchContentFlag: null,
      searchPlate: null,
      hashContentFlag: null,
      hashPlate: null,
    });

    await main.getByTestId("license-plate-validator-include-content").check();
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-placa",
      searchMode: null,
      searchContentFlag: null,
      searchPlate: null,
      hashContentFlag: "1",
      hashPlate: "ABC1D23",
    });
  });

  for (const localeSmoke of [
    {
      label: "EN",
      path: "/en/validadores/validador-placa",
      heading: "Brazilian License Plate Validator",
      validStatus: "Valid Mercosul plate",
    },
    {
      label: "ES",
      path: "/es/validadores/validador-placa",
      heading: "Validador de Placa Mercosur de Brasil",
      validStatus: "Placa Mercosur válida",
    },
  ]) {
    test(`renders ${localeSmoke.label} locale smoke without content in the URL`, async ({ page }) => {
      await page.goto(localeSmoke.path);
      const main = page.getByRole("main");

      await expect(page.getByRole("heading", { name: localeSmoke.heading, level: 1 })).toBeVisible();
      await main.getByTestId("license-plate-validator-input").fill("ABC1D23");
      await expect(main.getByTestId("license-plate-validator-status")).toContainText(localeSmoke.validStatus);
      await expect(main.getByTestId("license-plate-validator-normalized")).toContainText("ABC1D23");

      const url = new URL(page.url());
      expect(url.searchParams.get("placa")).toBeNull();
      expect(url.searchParams.get("conteudo")).toBeNull();
      expect(url.hash).toBe("");
    });
  }

  test("exposes the vehicle category in validator navigation and stays usable on mobile", async ({ page }) => {
    await page.goto("/validadores/validador-placa");
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Validadores" }).click();
    await page.waitForURL("**/validadores");
    await expect(page.getByTestId("tool-category-card-veiculos")).toBeVisible();

    await page.getByTestId("tool-category-card-veiculos").click();
    await page.waitForURL("**/validadores/categorias/veiculos");
    await expect(page.getByRole("heading", { name: "Veículos", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de Placa Mercosul").first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-placa");
    const main = page.getByRole("main");
    await main.getByTestId("license-plate-validator-input").fill("ABC_123456789012345");
    await expect(main.getByTestId("license-plate-validator-status")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
