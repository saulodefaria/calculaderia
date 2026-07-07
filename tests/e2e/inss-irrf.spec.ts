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

async function submitDefaultInssIrrf(page: Page) {
  await page.getByRole("button", { name: "Calcular INSS e IRRF" }).click();

  await expectResults(page, ["Resumo dos descontos", "R$ 248,60", "R$ 0,00", "Tabelas INSS/IRRF 2026"]);
  await expect(page.getByText("Fonte 2026-07-07", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Este saldo não é salário líquido", { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId("inss-irrf-inss-bracket-table")).toBeVisible();
  await expect(page.getByTestId("inss-irrf-irrf-memo-table")).toBeVisible();
}

test.describe("inss-irrf calculator", () => {
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

  test("submits salary values, shares with tb and sv, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/inss-irrf");

    await fillField(page, "rendimentosTributaveis", "6.000,00");
    await page.getByRole("button", { name: "Calcular INSS e IRRF" }).click();

    await expectResults(page, ["Resumo dos descontos", "R$ 641,51", "R$ 385,10", "R$ 1.026,61"]);
    await expect(page.getByText("Fonte 2026-07-07", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/inss-irrf?");
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("sv=2026-07-07");
    expect(sharedUrl).toContain("r=6000");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo dos descontos", "R$ 1.026,61"]);
    await expect(visibleFieldById(restoredPage, "rendimentosTributaveis")).toHaveValue("6.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/inss-irrf?");
    expect(callbackUrl).toContain("tb=2026");
    expect(callbackUrl).toContain("sv=2026-07-07");
    expect(callbackUrl).toContain("r=6000");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("submits the default estimate and remains responsive", async ({ page }) => {
    await page.goto("/calculadoras/inss-irrf");

    await submitDefaultInssIrrf(page);
    await expect(visibleFieldById(page, "rendimentosTributaveis")).toHaveValue("3.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("shows stale source warning while restoring valid URL inputs", async ({ page }) => {
    await page.goto("/calculadoras/inss-irrf?tb=2026&sv=2026-01-01&r=6000&cat=a");

    await expectResults(page, ["Resumo dos descontos", "R$ 641,51", "R$ 385,10"]);
    await expect(page.getByTestId("inss-irrf-source-warning")).toBeVisible();
    await expect(page.getByText("não traz a fonte atual sv=2026-07-07", { exact: false })).toBeVisible();
    await expect(visibleFieldById(page, "rendimentosTributaveis")).toHaveValue("6.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("toggles the simplified IRRF comparison and warns when the INSS ceiling applies", async ({ page }) => {
    await page.goto("/calculadoras/inss-irrf");

    await fillField(page, "rendimentosTributaveis", "5.000,00");
    await page.getByRole("button", { name: "Calcular INSS e IRRF" }).click();
    await expect(page.getByTestId("inss-irrf-irrf-result").getByText("Base simplificada")).toBeVisible();
    await expect(page.getByText("R$ 4.392,80", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("O desconto simplificado mensal foi comparado", { exact: false })).toBeVisible();

    await page.getByLabel("Comparar desconto simplificado mensal").uncheck();
    await page.getByRole("button", { name: "Calcular INSS e IRRF" }).click();
    await expect(page.getByTestId("inss-irrf-irrf-result").getByText("Base padrão")).toBeVisible();
    await expect(page.getByText("O desconto simplificado mensal foi desativado", { exact: false })).toBeVisible();

    await fillField(page, "rendimentosTributaveis", "9.000,00");
    await page.getByRole("button", { name: "Calcular INSS e IRRF" }).click();
    await expectResults(page, ["R$ 988,09", "R$ 1.294,55"]);
    await expect(page.getByText("A base informada ultrapassa R$ 8.475,55", { exact: false })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/inss-irrf");

    await submitDefaultInssIrrf(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/inss-irrf?tb=2026&sv=2026-07-07&r=6000");
    await expect(page.getByRole("heading", { name: "Brazil INSS and IRRF Calculator" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("inss-irrf-total-result")).toBeVisible();
    await expect(page.getByText("Deduction summary", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Source 2026-07-07", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/inss-irrf?tb=2026&sv=2026-07-07&r=6000");
    await expect(page.getByRole("heading", { name: "Calculadora de INSS e IRRF de Brasil" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("inss-irrf-total-result")).toBeVisible();
    await expect(page.getByText("Resumen de descuentos", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Fuente 2026-07-07", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
