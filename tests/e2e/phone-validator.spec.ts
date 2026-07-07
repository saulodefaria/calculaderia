import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      searchPais: url.searchParams.get("pais"),
      searchSaida: url.searchParams.get("saida"),
      searchTelefone: url.searchParams.get("telefone"),
      searchPhone: url.searchParams.get("phone"),
      hashContentFlag: hashParams.get("conteudo"),
      hashTelefone: hashParams.get("telefone"),
    };
  } catch {
    return null;
  }
}

async function getBrowserPrivacySnapshot(page: Page) {
  return page.evaluate(async () => {
    const storageToText = (storage: Storage) =>
      Object.keys(storage)
        .map((key) => `${key}=${storage.getItem(key) ?? ""}`)
        .join("\n");
    const indexedDbMetadata =
      "indexedDB" in window && typeof indexedDB.databases === "function"
        ? JSON.stringify(await indexedDB.databases())
        : "";

    return {
      localStorage: storageToText(localStorage),
      sessionStorage: storageToText(sessionStorage),
      cookies: document.cookie,
      indexedDbMetadata,
    };
  });
}

function expectUrlWithoutPhoneContent(page: Page) {
  return expect.poll(() => {
    const url = new URL(page.url());

    return {
      telefone: url.searchParams.get("telefone"),
      phone: url.searchParams.get("phone"),
      celular: url.searchParams.get("celular"),
      whatsapp: url.searchParams.get("whatsapp"),
      numero: url.searchParams.get("numero"),
      q: url.searchParams.get("q"),
      hash: url.hash,
    };
  });
}

test.describe("phone validator", () => {
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

  test("validates a Brazilian mobile number, shares safely, and keeps phone out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const requestUrls: string[] = [];
    page.on("request", (request) => requestUrls.push(request.url()));

    await page.goto("/validadores/validador-telefone");
    const main = page.getByRole("main");
    const typedPhone = "11912345678";
    const sensitivePhoneValues = [typedPhone, "+5511912345678", "(11) 91234-5678"];

    await expect(page.getByRole("heading", { name: "Validador de Telefone", level: 1 })).toBeVisible();
    await expect(main.getByTestId("phone-validator-input")).toBeVisible();
    await expect(main.getByTestId("phone-validator-input")).toHaveAttribute("autocomplete", "off");
    await expect(main.getByTestId("phone-validator-input")).toHaveAttribute("inputmode", "tel");
    await expect(main.getByTestId("phone-validator-privacy")).toContainText("nao inclui o telefone");

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Contato" })).toHaveAttribute(
      "href",
      "/validadores/categorias/contato"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o validador de telefone" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como validar telefone online" })).toBeVisible();
    await expect(main.getByText("Este validador confirma se a linha existe?")).toBeVisible();

    await main.getByTestId("phone-validator-input").fill(typedPhone);
    await expect(main.getByTestId("phone-validator-status")).toContainText("Formato plausivel");
    await expect(main.getByTestId("phone-validator-formatted-output")).toContainText("(11) 91234-5678");
    await expect(main.getByTestId("phone-validator-e164-output")).toContainText("+5511912345678");
    await expect(main.getByTestId("phone-validator-digits-output")).toContainText("11912345678");
    await expect(main.getByTestId("phone-validator-diagnostics")).toContainText("DDD");

    await expectUrlWithoutPhoneContent(page).toEqual({
      telefone: null,
      phone: null,
      celular: null,
      whatsapp: null,
      numero: null,
      q: null,
      hash: "",
    });

    const shareButton = main.getByTestId("phone-validator-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-telefone",
      searchPais: null,
      searchSaida: null,
      searchTelefone: null,
      searchPhone: null,
      hashContentFlag: null,
      hashTelefone: null,
    });

    await main.getByTestId("phone-validator-output-e164").click();
    await main.getByTestId("phone-validator-include-content").check();
    await expectUrlWithoutPhoneContent(page).toEqual({
      telefone: null,
      phone: null,
      celular: null,
      whatsapp: null,
      numero: null,
      q: null,
      hash: "",
    });

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/validador-telefone",
      searchPais: null,
      searchSaida: "e164",
      searchTelefone: null,
      searchPhone: null,
      hashContentFlag: "1",
      hashTelefone: "11912345678",
    });

    await main.getByTestId("phone-validator-copy-formatted").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("(11) 91234-5678");
    await main.getByTestId("phone-validator-copy-e164").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("+5511912345678");
    await main.getByTestId("phone-validator-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Escopo: validacao local de formato"
    );

    const privacySnapshot = JSON.stringify(await getBrowserPrivacySnapshot(page));
    const contextCookies = JSON.stringify(await page.context().cookies());
    const requestUrlSnapshot = requestUrls.join("\n");
    for (const sensitiveValue of sensitivePhoneValues) {
      expect(requestUrlSnapshot).not.toContain(sensitiveValue);
      expect(privacySnapshot).not.toContain(sensitiveValue);
      expect(contextCookies).not.toContain(sensitiveValue);
    }

    await main.getByTestId("phone-validator-clear").click();
    await expect(main.getByTestId("phone-validator-status")).toContainText("Aguardando telefone");
  });

  test("renders fixed-line output and collect-call dialing notation", async ({ page }) => {
    await page.goto("/validadores/validador-telefone");
    const main = page.getByRole("main");
    const input = main.getByTestId("phone-validator-input");

    await input.fill("1123456789");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Formato plausivel");
    await expect(main.getByTestId("phone-validator-formatted-output")).toContainText("(11) 2345-6789");
    await expect(main.getByTestId("phone-validator-e164-output")).toContainText("+551123456789");
    await expect(main.getByTestId("phone-validator-digits-output")).toContainText("1123456789");

    await input.fill("90 15 11 91234-5678");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Requer atencao");
    await expect(main.getByTestId("phone-validator-formatted-output")).toContainText("(11) 91234-5678");
    await expect(main.getByTestId("phone-validator-e164-output")).toContainText("+5511912345678");
    await expect(main.getByTestId("phone-validator-digits-output")).toContainText("11912345678");
    await expect(main.getByTestId("phone-validator-parts")).toContainText("9015");
    await expect(main.getByTestId("phone-validator-check-countryDdd")).toContainText("discagem");

    await expectUrlWithoutPhoneContent(page).toEqual({
      telefone: null,
      phone: null,
      celular: null,
      whatsapp: null,
      numero: null,
      q: null,
      hash: "",
    });
  });

  test("shows attention, invalid, special, and international E.164 states", async ({ page }) => {
    await page.goto("/validadores/validador-telefone");
    const main = page.getByRole("main");
    const input = main.getByTestId("phone-validator-input");

    await input.fill("91234-5678");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Requer atencao");
    await expect(main.getByTestId("phone-validator-diagnostics")).toContainText("falta DDD");
    await expect(main.getByTestId("phone-validator-formatted-output")).toContainText("91234-5678");
    expect(new URL(page.url()).searchParams.get("telefone")).toBeNull();

    await input.fill("11 91234 ABCD");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Formato invalido");
    await expect(main.getByTestId("phone-validator-diagnostics")).toContainText("Remova letras");

    await input.fill("190");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Numero especial");
    await expect(main.getByTestId("phone-validator-diagnostics")).toContainText("utilidade publica");

    await main.getByTestId("phone-validator-mode-internacional").click();
    await input.fill("+1 202 555 0184");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Formato plausivel");
    await expect(main.getByTestId("phone-validator-e164-output")).toContainText("+12025550184");
    await expect.poll(() => new URL(page.url()).searchParams.get("pais")).toBe("internacional");
    expect(new URL(page.url()).searchParams.get("telefone")).toBeNull();
  });

  test("hydrates explicit hash content once and sanitizes hostile URL params", async ({ page }) => {
    await page.goto(
      "/validadores/validador-telefone?telefone=11912345678&phone=11912345678#conteudo=1&telefone=11912345678"
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("phone-validator-input")).toHaveValue("11912345678");
    await expect(main.getByTestId("phone-validator-status")).toContainText("Formato plausivel");
    await expect.poll(() => new URL(page.url()).searchParams.get("telefone")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("phone")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("navigates through validator directory and contact category", async ({ page }) => {
    await page.goto("/validadores/validador-telefone");

    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Validadores" }).click();
    await page.waitForURL("**/validadores");
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-contato")).toBeVisible();
    await expect(page.getByText("Validador de Telefone").first()).toBeVisible();

    await page.getByTestId("tool-category-card-contato").click();
    await page.waitForURL("**/validadores/categorias/contato");
    await expect(page.getByRole("heading", { name: "Contato", level: 1 })).toBeVisible();
    await expect(page.getByText("Validador de Telefone").first()).toBeVisible();

    await page.getByTestId("tool-card-validador-telefone").click();
    await page.waitForURL("**/validadores/validador-telefone");
    await expect(page.getByRole("heading", { name: "Validador de Telefone", level: 1 })).toBeVisible();
  });

  test("renders English and Spanish routes", async ({ page }) => {
    await page.goto("/en/validadores/validador-telefone");
    await expect(page.getByRole("heading", { name: "Phone Number Validator", level: 1 })).toBeVisible();
    await expect(page.getByTestId("phone-validator-input")).toBeVisible();
    await expect(page.getByText("does not send the phone number to the server")).toBeVisible();

    await page.goto("/es/validadores/validador-telefone");
    await expect(page.getByRole("heading", { name: "Validador de Telefono", level: 1 })).toBeVisible();
    await expect(page.getByTestId("phone-validator-input")).toBeVisible();
    await expect(page.getByText("no envia el telefono al servidor")).toBeVisible();
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/validador-telefone");
    const main = page.getByRole("main");

    await main.getByTestId("phone-validator-input").fill("+55 (11) 91234-5678 ramal 123");
    await expect(main.getByTestId("phone-validator-status")).toBeVisible();
    await expect(main.getByTestId("phone-validator-diagnostics")).toContainText("Ramal");

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
