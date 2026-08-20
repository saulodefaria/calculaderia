import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, visibleFieldById } from "./helpers/calculator";

const pageIssues = new WeakMap<Page, string[]>();
const pageRequests = new WeakMap<
  Page,
  Array<{ method: string; postData: string | null; resourceType: string; url: string }>
>();
const reachedQuery = "sv=1&vi=1200&cp=0&mt=s&jf=0&pf=12&ai=0&ap=100&ri=0&al=10&ra=0&h=24";
const singularUnitsQuery = "sv=1&vi=1300&cp=0&mt=s&jf=0&pf=1&ai=0&ap=100&ri=0&al=0&ra=0&h=24";
const reachedAtOneMonthQuery = "sv=1&vi=100&cp=0&mt=s&jf=0&pf=1&ai=0&ap=100&ri=0&al=0&ra=0&h=1";
const notReachedAtOneMonthQuery = "sv=1&vi=1000&cp=0&mt=s&jf=0&pf=1&ai=0&ap=100&ri=0&al=0&ra=0&h=1";
const horizonQuery = "sv=1&vi=100000&cp=0&mt=s&jf=0&pf=12&ai=0&ap=1000&ri=10&al=0&ra=0&h=12";
const neverQuery = "sv=1&vi=1000&cp=0&mt=s&jf=0&pf=12&ai=12&ap=10&ri=0&al=0&ra=0&h=12";
const calculatorStateKeyPattern =
  /(?:^|[?&#;,\s{"])(?:sv|vi|cp|mt|jf|pf|ai|ap|ri|al|ra|h)(?=\s*(?:=|:|"))/m;

function monitorPageIssues(page: Page) {
  const issues: string[] = [];
  const requests: Array<{ method: string; postData: string | null; resourceType: string; url: string }> = [];
  pageIssues.set(page, issues);
  pageRequests.set(page, requests);
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    requests.push({
      method: request.method(),
      postData: request.postData(),
      resourceType: request.resourceType(),
      url: request.url(),
    });
  });
  page.on("requestfailed", (request) => {
    issues.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      issues.push(`response: ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
  return issues;
}

function unexpectedPageIssues(issues: string[]) {
  return issues.filter(
    (issue) =>
      !issue.includes("Failed to load resource: the server responded with a status of 401 (Unauthorized)") &&
      !issue.includes("ClientFetchError: Failed to fetch") &&
      !(issue.includes("response: 401 POST") && issue.includes("/api/favorites")) &&
      !(issue.includes("requestfailed:") && issue.includes("tid=G-XXXXXXXXXX")) &&
      !(issue.includes("requestfailed:") && issue.includes("gtag/js?id=G-XXXXXXXXXX"))
  );
}

function safelyDecode(value: string): string {
  let decoded = value.replaceAll("+", " ");

  for (let pass = 0; pass < 4; pass += 1) {
    let next: string;

    try {
      next = decodeURIComponent(decoded);
    } catch {
      next = decoded.replace(/%([0-9a-f]{2})/gi, (_match, hex: string) =>
        String.fromCharCode(Number.parseInt(hex, 16))
      );
    }

    next = next.replaceAll("+", " ");
    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

function getAppOrigin(page: Page, configuredBaseUrl: unknown): string | null {
  const candidates = [typeof configuredBaseUrl === "string" ? configuredBaseUrl : null, page.url()];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin;
    } catch {
      // Keep trying candidates; no origin means exemptions stay fail-closed.
    }
  }

  return null;
}

function unexpectedFinancialRequests(page: Page, configuredBaseUrl: unknown) {
  const appOrigin = getAppOrigin(page, configuredBaseUrl);

  return (pageRequests.get(page) ?? []).filter((request) => {
    let requestUrl: URL | null = null;

    try {
      requestUrl = new URL(request.url);
    } catch {
      // An unparseable URL receives no first-party exemption.
    }

    const isFirstParty = requestUrl !== null && appOrigin !== null && requestUrl.origin === appOrigin;
    const isDocumentNavigation = isFirstParty && request.resourceType === "document";
    const isExplicitFavoriteSave =
      isFirstParty && request.method === "POST" && requestUrl?.pathname === "/api/favorites";
    const isExplicitSignInNavigation =
      isFirstParty &&
      request.method === "GET" &&
      request.resourceType === "fetch" &&
      requestUrl?.pathname === "/entrar" &&
      requestUrl.searchParams.has("callbackUrl");
    const serialized = `${request.url}\n${request.postData ?? ""}`;
    const containsFinancialState = calculatorStateKeyPattern.test(safelyDecode(serialized));

    return (
      containsFinancialState &&
      !isDocumentNavigation &&
      !isExplicitFavoriteSave &&
      !isExplicitSignInNavigation
    );
  });
}

test.describe("financiar ou juntar dinheiro", () => {
  test.beforeEach(async ({ page }) => {
    monitorPageIssues(page);
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test.afterEach(async ({ context, page }, testInfo) => {
    const monitoredPages = new Set([page, ...context.pages()]);

    for (const monitoredPage of monitoredPages) {
      expect(unexpectedPageIssues(pageIssues.get(monitoredPage) ?? [])).toEqual([]);
      expect(unexpectedFinancialRequests(monitoredPage, testInfo.project.use.baseURL)).toEqual([]);
    }
  });

  test("renders the default SAC comparison, assumptions, sources, and disclaimer", async ({ page }) => {
    await page.goto("/calculadoras/financiar-ou-juntar-dinheiro");

    await expect(page.getByRole("heading", { level: 1, name: "Financiar ou juntar dinheiro para comprar imóvel?" })).toBeVisible();
    await expect(page.getByText("O aporte mensal é líquido depois do aluguel", { exact: false })).toBeVisible();
    await expect(page.getByText("Cálculo apenas de principal e juros", { exact: false })).toBeVisible();
    await expect(page.getByText("não aconselhamento financeiro", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: /Banco Central do Brasil/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Investor.gov/ })).toBeVisible();
    await expect(page.getByTestId("financiar-first-payment")).not.toContainText(/NaN|Infinity/);
    await expect(page.getByTestId("financiar-horizon-balance")).not.toContainText(/NaN|Infinity/);
    await expect(page.getByTestId("financiar-projection-table")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartilhar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("changes the financing summary to Price without changing the cash path", async ({ page }) => {
    await page.goto("/calculadoras/financiar-ou-juntar-dinheiro");
    const originalPayment = (await page.getByTestId("financiar-first-payment").textContent()) ?? "";
    const originalStatus = (await page.getByTestId("financiar-status").textContent()) ?? "";
    const originalBalance = (await page.getByTestId("financiar-horizon-balance").textContent()) ?? "";

    await page.getByLabel("Sistema de amortização").click();
    await page.getByRole("option", { name: "Price" }).click();
    await page.getByRole("button", { name: "Comparar financiar e juntar" }).click();

    await expect(page.getByTestId("financiar-first-payment")).not.toHaveText(originalPayment);
    await expect(page.getByTestId("financiar-status")).toHaveText(originalStatus);
    await expect(page.getByTestId("financiar-horizon-balance")).toHaveText(originalBalance);
  });

  test("renders reached, horizon-only, and mathematically proven never statuses literally", async ({ page }) => {
    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${reachedQuery}`);
    await expect(page.getByTestId("financiar-status")).toContainText("Atinge em 12 meses");
    await expect(page.getByTestId("financiar-projection-table").getByText("encontro")).toBeVisible();
    await expect(page.getByTestId("financiar-projection-table").getByText("horizonte")).toBeVisible();

    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${horizonQuery}`);
    await expect(page.getByTestId("financiar-status")).toHaveText("Não atinge dentro de 12 meses.");

    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${neverQuery}`);
    await expect(page.getByTestId("financiar-status")).toHaveText(
      "Não atinge em nenhum mês sob estas premissas (prova matemática)."
    );

    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${singularUnitsQuery}`);
    await expect(page.getByTestId("financiar-status")).toHaveText(
      "Atinge em 13 meses (aproximadamente 1 ano e 1 mês)."
    );
    await expect(page.getByTestId("financiar-loan-term")).toContainText("1 mês");
  });

  test("focuses and describes the first invalid field", async ({ page }) => {
    await page.goto("/calculadoras/financiar-ou-juntar-dinheiro");
    const propertyValue = visibleFieldById(page, "financiar-valor-imovel");

    await propertyValue.fill("");
    await page.getByRole("button", { name: "Comparar financiar e juntar" }).click();

    await expect(page.locator("#financiar-form-error")).toHaveText(/valor de imóvel maior que zero/i);
    await expect(propertyValue).toBeFocused();
    await expect(propertyValue).toHaveAttribute("aria-invalid", "true");
    await expect(propertyValue).toHaveAttribute("aria-describedby", /financiar-form-error/);

    await propertyValue.fill("500.000,00");
    const startingCapital = visibleFieldById(page, "financiar-capital-inicial");
    await startingCapital.fill("600.000,00");
    await page.getByRole("button", { name: "Comparar financiar e juntar" }).click();

    await expect(startingCapital).toBeFocused();
    await expect(startingCapital).toHaveAttribute("aria-invalid", "true");
    await expect(startingCapital).toHaveAttribute("aria-describedby", /financiar-form-error/);
  });

  test("pluralizes one-month reached and horizon-only statuses in every locale", async ({ page }) => {
    const cases = [
      {
        prefix: "",
        reached: "Atinge em 1 mês (aproximadamente 0 ano e 1 mês).",
        notReached: "Não atinge dentro de 1 mês.",
      },
      {
        prefix: "/en",
        reached: "Reaches it in 1 month (about 0 years and 1 month).",
        notReached: "Does not reach it within 1 month.",
      },
      {
        prefix: "/es",
        reached: "Lo alcanza en 1 mes (aproximadamente 0 años y 1 mes).",
        notReached: "No lo alcanza dentro de 1 mes.",
      },
    ];

    for (const scenario of cases) {
      await page.goto(`${scenario.prefix}/calculadoras/financiar-ou-juntar-dinheiro?${reachedAtOneMonthQuery}`);
      await expect(page.getByTestId("financiar-status")).toHaveText(scenario.reached);

      await page.goto(`${scenario.prefix}/calculadoras/financiar-ou-juntar-dinheiro?${notReachedAtOneMonthQuery}`);
      await expect(page.getByTestId("financiar-status")).toHaveText(scenario.notReached);
    }
  });

  test("shares and restores every input, then preserves the query in the sign-in callback", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${reachedQuery}`);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain(`/calculadoras/financiar-ou-juntar-dinheiro?${reachedQuery}`);

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expect(restoredPage.getByTestId("financiar-status")).toContainText("Atinge em 12 meses");
    await expect(visibleFieldById(restoredPage, "financiar-valor-imovel")).toHaveValue("1.200,00");
    await expect(visibleFieldById(restoredPage, "financiar-aporte-mensal")).toHaveValue("100,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const callbackUrl = new URL(page.url()).searchParams.get("callbackUrl") ?? "";
    const callbackState = new URL(callbackUrl, "http://localhost");
    expect(callbackState.pathname).toBe("/calculadoras/financiar-ou-juntar-dinheiro");
    expect(callbackState.searchParams.toString()).toBe(reachedQuery);
  });

  test("falls back atomically for invalid URLs and syncs on browser navigation", async ({ page }) => {
    await page.goto("/calculadoras/financiar-ou-juntar-dinheiro?sv=1&vi=999999");
    await expect(page.getByTestId("financiar-invalid-url")).toBeVisible();
    await expect(visibleFieldById(page, "financiar-valor-imovel")).toHaveValue("500.000,00");
    await expect(visibleFieldById(page, "financiar-capital-inicial")).toHaveValue("100.000,00");

    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${reachedQuery}`);
    await expect(page.getByTestId("financiar-status")).toContainText("Atinge em 12 meses");
    await page.goto(`/calculadoras/financiar-ou-juntar-dinheiro?${neverQuery}`);
    await expect(page.getByTestId("financiar-status")).toContainText("prova matemática");
    await page.goBack();
    await expect(page.getByTestId("financiar-status")).toContainText("Atinge em 12 meses");
    await expect(visibleFieldById(page, "financiar-valor-imovel")).toHaveValue("1.200,00");
    await page.goForward();
    await expect(page.getByTestId("financiar-status")).toContainText("prova matemática");
    await expect(visibleFieldById(page, "financiar-valor-imovel")).toHaveValue("1.000,00");
  });

  test("fits a 390px viewport and localizes English and Spanish routes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/en/calculadoras/financiar-ou-juntar-dinheiro?${reachedQuery}`);
    await expect(page.getByRole("heading", { level: 1, name: "Finance now or save to buy a home with cash?" })).toBeVisible();
    await expect(page.getByLabel("Monthly savings after rent")).toHaveValue("100.00");
    await expect(page.getByTestId("financiar-status")).toContainText("Reaches it in 12 months");
    await expect(page.getByText("This is not Brazilian CET", { exact: false })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.getByText("Swipe the table to see every column.")).toBeVisible();
    const tableScroller = page.getByTestId("financiar-projection-table").locator("..");
    expect(await tableScroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await tableScroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    expect(await tableScroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

    await page.goto(`/es/calculadoras/financiar-ou-juntar-dinheiro?${neverQuery}`);
    await expect(page.getByRole("heading", { level: 1, name: "¿Financiar ahora o ahorrar para comprar un inmueble al contado?" })).toBeVisible();
    await expect(page.getByLabel("Ahorro mensual después del alquiler")).toHaveValue("10,00");
    await expect(page.getByTestId("financiar-status")).toContainText("prueba matemática");
    await expect(page.getByText("No es el CET brasileño", { exact: false })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
