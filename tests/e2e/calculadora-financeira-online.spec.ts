import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, visibleFieldById } from "./helpers/calculator";

const pageIssues = new WeakMap<Page, string[]>();

function monitorPageIssues(page: Page) {
  const issues: string[] = [];
  pageIssues.set(page, issues);
  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  return issues;
}

function unexpectedPageIssues(issues: string[]) {
  return issues.filter(
    (issue) =>
      !issue.includes("Failed to load resource: the server responded with a status of 401 (Unauthorized)") &&
      !issue.includes("ClientFetchError: Failed to fetch")
  );
}

async function selectOption(page: Page, name: RegExp, option: string) {
  await page.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option }).click();
}

async function expectDefaultTvm(page: Page) {
  await expect(page.getByRole("heading", { name: "Calculadora Financeira Online", exact: true })).toBeVisible();
  await expect(page.getByTestId("financial-tvm-solved-result")).toContainText(/-R\$\s*8\.884,88/);
  await expect(page.getByTestId("financial-tvm-residual-result")).toContainText("0");
  await expect(page.getByText("Não é afiliada a HP", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compartilhar" })).toBeVisible();
}

test.describe("calculadora financeira online", () => {
  test.beforeEach(async ({ page }) => {
    monitorPageIssues(page);

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test.afterEach(async ({ page }) => {
    expect(unexpectedPageIssues(pageIssues.get(page) ?? [])).toEqual([]);
  });

  test("loads default TVM, shares with sv=2026-06-25, restores, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/calculadora-financeira-online");

    await expectDefaultTvm(page);
    await expect(page).toHaveTitle(/Calculadora Financeira Online/);
    await expect(page).not.toHaveTitle(/HP|12C|emulador/i);
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /genérica|educativa/);
    await expect(metaDescription).not.toHaveAttribute("content", /HP|12C|oficial|emulador/i);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/calculadora-financeira-online?");
    expect(sharedUrl).toContain("m=t");
    expect(sharedUrl).toContain("sf=pmt");
    expect(sharedUrl).toContain("sv=2026-06-25");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectDefaultTvm(restoredPage);
    await expect(visibleFieldById(restoredPage, "financialPresentValue")).toHaveValue("100000");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/calculadora-financeira-online?");
    expect(callbackUrl).toContain("sv=2026-06-25");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("updates TVM payment timing to beginning of period", async ({ page }) => {
    await page.goto("/calculadoras/calculadora-financeira-online");

    await selectOption(page, /Pagamento/, "No início do período");
    await page.getByRole("button", { name: "Calcular" }).click();

    await expect(page.getByTestId("financial-tvm-solved-result")).toContainText(/-R\$\s*8\.796,91/);
    await expect(page.getByText("Pagamentos no início do período", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("calculates NPV and IRR cash-flow defaults", async ({ page }) => {
    await page.goto("/calculadoras/calculadora-financeira-online");

    await page.getByRole("tab", { name: "Fluxos de caixa" }).click();
    await page.getByRole("button", { name: "Calcular" }).click();

    await expect(page.getByTestId("financial-cashflow-npv-result")).toContainText(/-R\$\s*5,26/);
    await expect(page.getByTestId("financial-cashflow-irr-result")).toContainText("9,70%");
    await expect(page.getByText("Fluxo do período 0", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("restores cash-flow mode from URL with source version", async ({ page }) => {
    await page.goto(
      "/calculadoras/calculadora-financeira-online?m=c&sv=2026-06-25&dr=10&cf=-1000%2C400%2C400%2C400"
    );

    await expect(page.getByRole("tab", { name: "Fluxos de caixa" })).toHaveAttribute("data-state", "active");
    await expect(page.getByTestId("financial-cashflow-npv-result")).toContainText(/-R\$\s*5,26/);
    await expect(visibleFieldById(page, "financialCashflows")).toHaveValue(/-1000/);
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/calculadora-financeira-online");

    await expectDefaultTvm(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/calculadora-financeira-online?m=t&sf=pmt&sv=2026-06-25");
    await expect(page.getByRole("heading", { name: "Online Financial Calculator", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("financial-tvm-solved-result")).toBeVisible();
    await expect(page.getByText("Not affiliated with HP", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/calculadora-financeira-online?m=t&sf=pmt&sv=2026-06-25");
    await expect(page.getByRole("heading", { name: "Calculadora Financiera Online", exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("financial-tvm-solved-result")).toBeVisible();
    await expect(page.getByText("No está afiliada a HP", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
