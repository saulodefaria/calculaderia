import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, expectResults, fillField, visibleFieldById } from "./helpers/calculator";

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

async function submitSalary6000(page: Page) {
  await fillField(page, "salarioBruto", "6.000,00");
  await page.getByRole("button", { name: "Calcular salário líquido" }).click();

  await expectResults(page, ["Resumo do salário líquido", "R$ 4.973,39", "R$ 641,51", "R$ 385,10"]);
  await expect(page.getByText("Tabelas INSS/IRRF 2026", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Estimativa educativa; o holerite oficial", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Fontes consultadas em 2026-06-20", { exact: false }).first()).toBeVisible();
}

test.describe("salario-liquido calculator", () => {
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

  test("submits salary values, shares, restores with tb=2026, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/salario-liquido");

    await submitSalary6000(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/salario-liquido?");
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("s=6000");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do salário líquido", "R$ 4.973,39"]);
    await expect(visibleFieldById(restoredPage, "salarioBruto")).toHaveValue("6.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/salario-liquido?");
    expect(callbackUrl).toContain("tb=2026");
    expect(callbackUrl).toContain("s=6000");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("disables legal deductions when the toggle is off", async ({ page }) => {
    await page.goto("/calculadoras/salario-liquido");

    await fillField(page, "salarioBruto", "6.000,00");
    await page.getByRole("main").getByRole("checkbox", { name: /Calcular INSS e IRRF/ }).uncheck();
    await page.getByRole("button", { name: "Calcular salário líquido" }).click();

    await expectResults(page, ["Resumo do salário líquido", "R$ 6.000,00"]);
    await expect(page.getByText("R$ 641,51")).toHaveCount(0);
    await expect(page.getByText("R$ 385,10")).toHaveCount(0);
    await expect(page.getByText("INSS e IRRF foram desativados", { exact: false })).toBeVisible();
  });

  test("restores manual deductions warning from a shared URL", async ({ page }) => {
    await page.goto("/calculadoras/salario-liquido?tb=2026&s=1500&dm=5000");

    await expectResults(page, ["Resumo do salário líquido", "R$ 0,00"]);
    await expect(
      page.getByRole("listitem").filter({ hasText: "descontos informados excedem os proventos" }).first()
    ).toBeVisible();
    await expect(visibleFieldById(page, "descontosManuais")).toHaveValue("5.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/salario-liquido");

    await submitSalary6000(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/salario-liquido?tb=2026&s=6000");
    await expect(page.getByRole("heading", { name: "Brazil Net Salary Calculator" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("salario-liquido-net-result")).toBeVisible();
    await expect(page.getByText("Estimated net salary", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/salario-liquido?tb=2026&s=6000");
    await expect(page.getByRole("heading", { name: "Calculadora de Salario Neto de Brasil" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("salario-liquido-net-result")).toBeVisible();
    await expect(page.getByText("Salario neto estimado", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
