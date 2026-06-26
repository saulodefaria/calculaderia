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

async function submitDefaultVehicleFinancing(page: Page) {
  await page.getByRole("button", { name: "Simular financiamento" }).click();

  await expectResults(page, [
    "Resumo do financiamento do veículo",
    "R$ 60.000,00",
    "Fórmula 2026-06-25",
    "CET oficial",
  ]);
  await expect(page.getByTestId("financiamento-veiculo-amortization-table")).toBeVisible();
}

test.describe("financiamento-veiculo calculator", () => {
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

  test("submits the default Price estimate, shares explicit zero costs, restores, and preserves save callback", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/financiamento-veiculo");

    await submitDefaultVehicleFinancing(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/financiamento-veiculo?");
    expect(sharedUrl).toContain("sv=2026-06-25");
    expect(sharedUrl).toContain("cf=0");
    expect(sharedUrl).toContain("ca=0");
    expect(sharedUrl).toContain("mt=price");
    expect(sharedUrl).toContain("cmp=1");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do financiamento do veículo", "R$ 60.000,00"]);
    await expect(visibleFieldById(restoredPage, "valorVeiculo")).toHaveValue("80.000,00");
    await expect(visibleFieldById(restoredPage, "custosFinanciados")).toHaveValue("0,00");
    await expect(visibleFieldById(restoredPage, "custosAVista")).toHaveValue("0,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/financiamento-veiculo?");
    expect(callbackUrl).toContain("sv=2026-06-25");
    expect(callbackUrl).toContain("cf=0");
    expect(callbackUrl).toContain("ca=0");
  });

  test("calculates the SAC fixture with first and last installments", async ({ page }) => {
    await page.goto("/calculadoras/financiamento-veiculo");

    await fillField(page, "valorVeiculo", "1.000,00");
    await fillField(page, "entrada", "0,00");
    await fillField(page, "custosFinanciados", "0,00");
    await fillField(page, "custosAVista", "0,00");
    await fillField(page, "taxaJurosMensal", "3");
    await fillField(page, "prazoMeses", "4");
    await page.locator("#metodo-sac").filter({ visible: true }).first().click();
    await page.getByRole("button", { name: "Simular financiamento" }).click();

    await expectResults(page, ["Resumo do financiamento do veículo", "R$ 280,00 / R$ 257,50", "R$ 75,00"]);
    await expect(page.getByText("R$ 272,50", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("calculates the Price PMT fixture through the form", async ({ page }) => {
    await page.goto("/calculadoras/financiamento-veiculo");

    await fillField(page, "valorVeiculo", "10.000,00");
    await fillField(page, "entrada", "0,00");
    await fillField(page, "custosFinanciados", "0,00");
    await fillField(page, "custosAVista", "0,00");
    await fillField(page, "taxaJurosMensal", "0,6666666667");
    await fillField(page, "prazoMeses", "10");
    await page.locator("#metodo-price").filter({ visible: true }).first().click();
    await page.getByRole("button", { name: "Simular financiamento" }).click();

    await expectResults(page, ["Resumo do financiamento do veículo", "R$ 1.037,03", "R$ 370,34"]);
    await expectNoHorizontalOverflow(page);
  });

  test("shows high-rate and long-term warnings", async ({ page }) => {
    await page.goto("/calculadoras/financiamento-veiculo");

    await fillField(page, "entrada", "0,00");
    await fillField(page, "taxaJurosMensal", "10,01");
    await fillField(page, "prazoMeses", "85");
    await page.getByRole("button", { name: "Simular financiamento" }).click();

    await expect(page.getByText("Taxa mensal acima de 10%", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Prazo acima de 84 meses", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Entrada baixa ou zero", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/financiamento-veiculo");

    await submitDefaultVehicleFinancing(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto(
      "/en/calculadoras/financiamento-veiculo?sv=2026-06-25&vv=10000&en=0&cf=0&ca=0&tm=0.6666666667&pm=10&mt=price&cmp=1"
    );
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Vehicle Financing Simulator", exact: true })).toBeVisible();
    await expect(main.getByTestId("financiamento-veiculo-installment-result")).toBeVisible();
    await expect(main.getByText("Vehicle financing summary", { exact: false })).toBeVisible();
    await expect(main.getByText("Formula 2026-06-25", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(
      "/es/calculadoras/financiamento-veiculo?sv=2026-06-25&vv=10000&en=0&cf=0&ca=0&tm=3&pm=4&mt=sac&cmp=1"
    );
    main = page.getByRole("main");
    await expect(
      page.getByRole("heading", { name: "Simulador de Financiamiento de Vehiculo", exact: true })
    ).toBeVisible();
    await expect(main.getByTestId("financiamento-veiculo-installment-result")).toBeVisible();
    await expect(main.getByText("Resumen del financiamiento del vehículo", { exact: false })).toBeVisible();
    await expect(main.getByText("Fórmula 2026-06-25", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
