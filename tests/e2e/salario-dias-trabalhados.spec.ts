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

async function submitSalary6000ForTenDays(page: Page) {
  await fillField(page, "salarioMensal", "6.000,00");
  await fillField(page, "mesReferencia", "2026-07");
  await fillField(page, "diasRemunerados", "10");
  await page.getByRole("button", { name: "Calcular salário proporcional" }).click();

  await expectResults(page, ["Resumo do salário proporcional", "R$ 2.000,00", "R$ 1.844,31"]);
  await expect(page.getByText("Tabelas INSS/IRRF 2026", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Fontes oficiais consultadas em 03/07/2026", { exact: false }).first()).toBeVisible();
}

test.describe("salario-dias-trabalhados calculator", () => {
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

  test("submits salary and days, shares, restores, and prompts sign-in when saving", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/salario-dias-trabalhados");

    await submitSalary6000ForTenDays(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/salario-dias-trabalhados?");
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("dm=30");
    expect(sharedUrl).toContain("m=2026-07");
    expect(sharedUrl).toContain("s=6000");
    expect(sharedUrl).toContain("d=10");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do salário proporcional", "R$ 2.000,00", "R$ 1.844,31"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("6.000,00");
    await expect(visibleFieldById(restoredPage, "diasRemunerados")).toHaveValue("10");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/salario-dias-trabalhados?");
    expect(callbackUrl).toContain("tb=2026");
    expect(callbackUrl).toContain("s=6000");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("caps a full 31-day month at one monthly salary with divisor 30", async ({ page }) => {
    await page.goto(
      "/calculadoras/salario-dias-trabalhados?tb=2026&dm=30&m=2026-07&up=1&pi=2026-07-01&pf=2026-07-31"
    );

    await expectResults(page, ["Resumo do salário proporcional", "R$ 3.000,00", "30"]);
    await expect(page.getByText("mês de 31 dias", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("uses the period helper, clips cross-month dates, and restores the shared period", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/salario-dias-trabalhados");

    await fillField(page, "mesReferencia", "2026-07");
    await page.getByRole("checkbox", { name: "Derivar dias por período" }).check();
    await fillField(page, "dataInicio", "2026-06-25");
    await fillField(page, "dataFim", "2026-07-10");
    await page.getByRole("button", { name: "Calcular salário proporcional" }).click();

    await expectResults(page, ["Resumo do salário proporcional", "R$ 1.000,00"]);
    await expect(page.getByText("recortado para o mês de referência", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Compartilhar" }).click();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("up=1");
    expect(sharedUrl).toContain("pi=2026-06-25");
    expect(sharedUrl).toContain("pf=2026-07-10");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do salário proporcional", "R$ 1.000,00"]);
    await expect(visibleFieldById(restoredPage, "dataInicio")).toHaveValue("2026-06-25");
    await expect(visibleFieldById(restoredPage, "dataFim")).toHaveValue("2026-07-10");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);
  });

  test("disables legal deductions when the toggle is off", async ({ page }) => {
    await page.goto("/calculadoras/salario-dias-trabalhados");

    await fillField(page, "salarioMensal", "6.000,00");
    await fillField(page, "mesReferencia", "2026-07");
    await fillField(page, "diasRemunerados", "10");
    await page.getByRole("main").getByRole("checkbox", { name: /Calcular INSS e IRRF/ }).uncheck();
    await page.getByRole("button", { name: "Calcular salário proporcional" }).click();

    await expectResults(page, ["Resumo do salário proporcional", "R$ 2.000,00"]);
    await expect(page.getByText("R$ 1.844,31")).toHaveCount(0);
    await expect(page.getByText("INSS e IRRF foram desativados", { exact: false }).first()).toBeVisible();
  });

  test("warns and disables legal deductions for missing or unsupported table versions", async ({ page }) => {
    for (const url of [
      "/calculadoras/salario-dias-trabalhados?dm=30&m=2026-07&s=6000&d=10",
      "/calculadoras/salario-dias-trabalhados?tb=2025&dm=30&m=2026-07&s=6000&d=10",
    ]) {
      await page.goto(url);

      await expectResults(page, ["Resumo do salário proporcional", "R$ 2.000,00"]);
      await expect(page.getByTestId("salario-dias-trabalhados-net-result")).toContainText("R$ 2.000,00");
      await expect(page.getByRole("main").getByRole("checkbox", { name: /Calcular INSS e IRRF/ })).not.toBeChecked();
      await expect(page.getByText("O link não trazia uma versão de tabela suportada", { exact: false }).first()).toBeVisible();
      await expect(page.getByText("INSS e IRRF foram desativados", { exact: false }).first()).toBeVisible();
    }
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/salario-dias-trabalhados");

    await submitSalary6000ForTenDays(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/salario-dias-trabalhados?tb=2026&dm=30&m=2026-07&s=6000&d=10");
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil Salary by Days Worked Calculator" })).toBeVisible();
    await expect(main.getByTestId("salario-dias-trabalhados-net-result")).toBeVisible();
    await expect(main.getByText("Estimated net pay", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/salario-dias-trabalhados?tb=2026&dm=30&m=2026-07&s=6000&d=10");
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de Salario por Días Trabajados en Brasil" })).toBeVisible();
    await expect(main.getByTestId("salario-dias-trabalhados-net-result")).toBeVisible();
    await expect(main.getByText("Neto estimado", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
