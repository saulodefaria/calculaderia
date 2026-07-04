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

async function selectRadixOption(page: Page, triggerId: string, optionName: string) {
  await page.locator(`#${triggerId}`).filter({ visible: true }).click();
  await page.getByRole("option", { name: optionName }).click();
}

async function fillResignationFixture(page: Page) {
  await fillField(page, "salarioMensal", "3.000,00");
  await fillField(page, "dataAdmissao", "2025-01-01");
  await fillField(page, "dataDesligamento", "2026-03-10");
  await fillField(page, "diasTrabalhadosMes", "10");
  await page.getByRole("main").getByRole("checkbox", { name: /Estimar INSS e IRRF/ }).uncheck();
}

async function submitWorkedResignation(page: Page) {
  await fillResignationFixture(page);
  await page.getByRole("button", { name: "Calcular rescisão sem FGTS" }).click();

  await expectResults(page, ["Resumo sem FGTS no recebimento", "Verbas detalhadas sem FGTS no caixa"]);
  await expect(page.getByTestId("rescisao-sem-fgts-multa-fgts")).toContainText("R$ 0,00");
  await expect(page.getByTestId("rescisao-sem-fgts-saque-fgts")).toContainText("R$ 0,00");
  await expect(page.getByText("FGTS fora do recebimento imediato", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Esta página não calcula cobrança de FGTS", { exact: false }).first()).toBeVisible();
}

test.describe("rescisao-sem-fgts calculator", () => {
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

  test("submits default resignation flow, shares, restores, and preserves save callback", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/rescisao-sem-fgts");

    await submitWorkedResignation(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/rescisao-sem-fgts?");
    expect(sharedUrl).toContain("sv=2026-07-04");
    expect(sharedUrl).toContain("s=3000");
    expect(sharedUrl).toContain("mt=pd");
    expect(sharedUrl).toContain("av=trab");
    expect(sharedUrl).not.toContain("fg=");
    expect(sharedUrl).not.toContain("fi=");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo sem FGTS no recebimento", "R$ 0,00"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("3.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/rescisao-sem-fgts?");
    expect(callbackUrl).toContain("sv=2026-07-04");
    expect(callbackUrl).toContain("s=3000");
    expect(callbackUrl).toContain("mt=pd");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("shows discounted notice and negative net estimate for resignation", async ({ page }) => {
    await page.goto("/calculadoras/rescisao-sem-fgts");

    await fillResignationFixture(page);
    await selectRadixOption(page, "avisoPrevioPedido", "Descontado");
    await page.getByRole("button", { name: "Calcular rescisão sem FGTS" }).click();

    await expectResults(page, ["Resumo sem FGTS no recebimento", "Desconto de aviso"]);
    await expect(page.getByTestId("rescisao-sem-fgts-aviso")).toContainText("R$ 3.000,00");
    await expect(page.getByTestId("rescisao-sem-fgts-total-liquido")).toContainText("-R$ 833,33");
    await expect(page.getByText("estimativa líquida negativa", { exact: false }).first()).toBeVisible();
  });

  test("coerces with-cause mode, hides notice selection, and keeps FGTS outputs at zero", async ({ page }) => {
    await page.goto("/calculadoras/rescisao-sem-fgts");

    await selectRadixOption(page, "cenarioSemFgts", "Dispensa por justa causa");
    await expect(page.locator("#avisoPrevioPedido")).toHaveCount(0);
    await fillField(page, "salarioMensal", "3.000,00");
    await fillField(page, "dataAdmissao", "2025-01-01");
    await fillField(page, "dataDesligamento", "2026-03-15");
    await fillField(page, "diasTrabalhadosMes", "15");
    await fillField(page, "feriasVencidasPeriodos", "1");
    await page.getByRole("main").getByRole("checkbox", { name: /Estimar INSS e IRRF/ }).uncheck();
    await page.getByRole("button", { name: "Calcular rescisão sem FGTS" }).click();

    await expectResults(page, ["Resumo sem FGTS no recebimento", "R$ 5.500,00"]);
    await expect(page.getByTestId("rescisao-sem-fgts-multa-fgts")).toContainText("R$ 0,00");
    await expect(page.getByTestId("rescisao-sem-fgts-saque-fgts")).toContainText("R$ 0,00");
    await expect(page.getByTestId("rescisao-sem-fgts-row-decimoTerceiro")).toContainText("N/A");
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/rescisao-sem-fgts");

    await submitWorkedResignation(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes from shared URLs", async ({ page }) => {
    const query = "sv=2026-07-04&s=3000&ad=2025-01-01&dd=2026-03-10&mt=pd&av=desc&dt=10&fv=0&dl=0";

    await page.goto(`/en/calculadoras/rescisao-sem-fgts?${query}`);
    await expect(page.getByRole("heading", { name: "Rescisao Without FGTS Calculator" })).toBeVisible();
    await expect(page.getByTestId("rescisao-sem-fgts-multa-fgts")).toContainText("R$ 0,00");
    await expect(page.getByText("FGTS fine", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(`/es/calculadoras/rescisao-sem-fgts?${query}`);
    await expect(page.getByRole("heading", { name: "Calculadora de Rescisão Sin FGTS" })).toBeVisible();
    await expect(page.getByTestId("rescisao-sem-fgts-multa-fgts")).toContainText("R$ 0,00");
    await expect(page.getByText("Multa de FGTS", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
