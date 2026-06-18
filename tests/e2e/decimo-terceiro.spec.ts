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
    (issue) => !issue.includes("Failed to load resource: the server responded with a status of 401 (Unauthorized)")
  );
}

async function submitDecimoTerceiro(page: Page) {
  await fillField(page, "salarioMensal", "6.000,00");
  await fillField(page, "mediaVariavelMensal", "");
  await fillField(page, "anoReferencia", "2026");
  await fillField(page, "dataAdmissao", "2026-01-01");
  await fillField(page, "dataReferencia", "2026-12-31");
  await fillField(page, "adiantamentoJaRecebido", "3.000,00");
  await page.getByRole("button", { name: "Calcular 13º salário" }).click();

  await expectResults(page, ["Resumo do décimo terceiro", "Memória de cálculo do 13º", "Avos mês a mês"]);
  await expect(page.getByText("INSS do 13º", { exact: true })).toBeVisible();
  await expect(page.getByText("IRRF do 13º", { exact: true })).toBeVisible();
  await expect(page.getByText("R$ 1.973,39", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Fontes legais e tabelas 2026", { exact: false })).toBeVisible();
  await expect(page.getByText("Esta calculadora oferece uma estimativa educativa", { exact: false })).toBeVisible();
}

test.describe("decimo terceiro calculator", () => {
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

  test("submits, shares, restores, and prompts sign-in when saving", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/decimo-terceiro");

    await submitDecimoTerceiro(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/decimo-terceiro?");
    expect(sharedUrl).toContain("y=2026");
    expect(sharedUrl).toContain("s=6000");
    expect(sharedUrl).toContain("aa=3000");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do décimo terceiro", "Avos mês a mês"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("6.000,00");
    await expect(visibleFieldById(restoredPage, "adiantamentoJaRecebido")).toHaveValue("3.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("updates net estimate when legal deductions are toggled off", async ({ page }) => {
    await page.goto("/calculadoras/decimo-terceiro?y=2026&s=6000&aa=3000");

    await expectResults(page, ["Resumo do décimo terceiro", "INSS do 13º", "IRRF do 13º"]);

    await page.getByRole("checkbox", { name: /Estimar INSS e IRRF/ }).first().uncheck();
    await page.getByRole("button", { name: "Calcular 13º salário" }).click();

    await expect(page.getByText("INSS e IRRF automáticos foram desativados", { exact: false })).toBeVisible();
    await expect(page.getByText("Tabelas INSS/IRRF 2026", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Bruto + ajustes manuais", { exact: true })).toBeVisible();
    await expect(page.getByTestId("decimo-terceiro-net-result")).toContainText("R$ 3.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("restores proportional avos and advance cap warning from shared URL", async ({ page }) => {
    await page.goto("/calculadoras/decimo-terceiro?y=2026&s=3000&m=pd&ad=2026-03-18&rd=2026-06-14&aa=4000&dl=0");

    await expectResults(page, ["Resumo do décimo terceiro", "Avos mês a mês"]);
    await expect(page.getByText("Avos: 2/12", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("O adiantamento informado passou do 13º bruto", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Março", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("14").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/decimo-terceiro");

    await submitDecimoTerceiro(page);
    await expectNoHorizontalOverflow(page);
  });

  test("smoke-loads localized English and Spanish routes", async ({ page }) => {
    await page.goto("/en/calculadoras/decimo-terceiro");

    await expect(page.getByRole("heading", { name: "Brazilian 13th Salary Calculator" })).toBeVisible();
    await expect(page.getByText("Inputs for the 13th salary estimate", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Calculate 13th salary" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/decimo-terceiro");

    await expect(page.getByRole("heading", { name: "Calculadora de décimo tercer salario brasileño" })).toBeVisible();
    await expect(page.getByText("Datos para estimar el 13º salario", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Calcular 13º salario" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
