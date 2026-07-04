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

test.describe("salario-pj calculator", () => {
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

  test("loads the default Anexo V estimate with source warnings", async ({ page }) => {
    await page.goto("/calculadoras/salario-pj");

    await expectResults(page, ["Resumo do salário PJ", "R$ 7.925,80", "DAS estimado", "R$ 1.550,00"]);
    await expect(page.getByTestId("salario-pj-fator-r-result")).toContainText("16,21%");
    await expect(page.getByTestId("salario-pj-fator-r-result")).toContainText("V");
    await expect(page.getByText("Fontes oficiais rechecadas em 2026-07-03", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("não significa lucro distribuível", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("switches factor R, uses manual rate, shares, restores, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/salario-pj");

    await fillField(page, "fs12", "36.000,00");
    await page.getByRole("button", { name: "Calcular salário PJ" }).click();
    await expectResults(page, ["Resumo do salário PJ", "R$ 8.875,80", "R$ 600,00"]);
    await expect(page.getByTestId("salario-pj-fator-r-result")).toContainText("30,00%");
    await expect(page.getByTestId("salario-pj-fator-r-result")).toContainText("III");

    await page.getByRole("combobox", { name: "Modo de tributação" }).click();
    await page.getByRole("option", { name: "Alíquota efetiva manual" }).click();
    await fillField(page, "aliquotaManualEfetiva", "12");
    await page.getByRole("button", { name: "Calcular salário PJ" }).click();
    await expectResults(page, ["Resumo do salário PJ", "R$ 8.275,80", "R$ 1.200,00"]);
    await expect(page.getByText("A alíquota manual é uma premissa", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/salario-pj?");
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("fs=36000");
    expect(sharedUrl).toContain("an=man");
    expect(sharedUrl).toContain("am=0.12");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do salário PJ", "R$ 8.275,80", "R$ 1.200,00"]);
    await expect(visibleFieldById(restoredPage, "fs12")).toHaveValue("36.000,00");
    await expect(visibleFieldById(restoredPage, "aliquotaManualEfetiva")).toHaveValue("12");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/salario-pj?");
    expect(callbackUrl).toContain("tb=2026");
    expect(callbackUrl).toContain("an=man");
    expect(callbackUrl).toContain("am=0.12");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("warns on unsupported table links and keeps 2026 defaults", async ({ page }) => {
    await page.goto("/calculadoras/salario-pj?tb=2025&r=10000");

    const unsupportedTableWarning = page.getByText("tabela não suportada", { exact: false }).filter({ visible: true });
    await expect(unsupportedTableWarning).toHaveCount(1);
    await expect(unsupportedTableWarning).toBeVisible();
    await expectResults(page, ["Resumo do salário PJ", "R$ 7.925,80"]);
    await expect(visibleFieldById(page, "receitaMensal")).toHaveValue("10.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/salario-pj");

    await expectResults(page, ["Resumo do salário PJ", "R$ 7.925,80"]);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/salario-pj?tb=2026&fs=36000");
    await expect(page.getByRole("heading", { name: "Brazil PJ Salary Calculator" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("salario-pj-net-result")).toBeVisible();
    await expect(page.getByText("Available cash", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/salario-pj?tb=2026&fs=36000");
    await expect(page.getByRole("heading", { name: "Calculadora de Salario PJ de Brasil" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("salario-pj-net-result")).toBeVisible();
    await expect(page.getByText("Disponible líquido", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
