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

async function submitFeriasComAbono(page: Page) {
  await fillField(page, "salarioMensal", "3.000,00");
  await fillField(page, "mediaVariavelMensal", "");
  await fillField(page, "dataInicioPeriodoAquisitivo", "2025-06-01");
  await fillField(page, "dataReferencia", "2026-06-07");
  await fillField(page, "dataInicioFerias", "2026-07-01");
  await fillField(page, "faltasInjustificadas", "0");
  await page.getByRole("checkbox", { name: /Converter dias em abono/ }).first().check();
  await fillField(page, "diasAbono", "10");
  await page.getByRole("button", { name: "Calcular férias" }).click();

  await expectResults(page, ["Resumo das férias", "Memória de cálculo das férias", "Abono pecuniário + 1/3"]);
  await expect(page.getByText("Fluxo bruto com esse salário comum", { exact: false })).toBeVisible();
  await expect(page.getByText("Regras CLT/Constituição e tabelas INSS/IRRF 2026", { exact: false })).toBeVisible();
  await expect(page.getByText("Esta calculadora oferece uma estimativa educativa", { exact: false })).toBeVisible();
}

test.describe("ferias calculator", () => {
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

  test("submits abono, shares, restores, and prompts sign-in when saving", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/ferias");

    await submitFeriasComAbono(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/ferias?");
    expect(sharedUrl).toContain("s=3000");
    expect(sharedUrl).toContain("m=g");
    expect(sharedUrl).toContain("ab=1");
    expect(sharedUrl).toContain("da=10");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo das férias", "Memória de cálculo das férias"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("3.000,00");
    await expect(visibleFieldById(restoredPage, "diasAbono")).toHaveValue("10");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("restores overdue double vacation warning from shared URL", async ({ page }) => {
    await page.goto("/calculadoras/ferias?s=3000&m=v&ai=2025-01-01&ref=2026-06-07&fi=2027-01-01&fa=0&df=30&dl=0");

    await expectResults(page, ["Resumo das férias", "Adicional de dobra"]);
    await expect(page.getByText("A dobra foi aplicada", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("R$ 8.000,00", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("restores proportional avos and warning from shared URL", async ({ page }) => {
    await page.goto("/calculadoras/ferias?s=3000&m=p&ai=2026-01-01&ref=2026-06-14&fi=2026-07-01&fa=6&df=24&dl=1");

    await expectResults(page, ["Resumo das férias", "Memória de cálculo das férias", "Férias proporcionais"]);
    await expect(page.getByText("Avos proporcionais", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("5/12", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Férias proporcionais são uma estimativa de avos", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("INSS e IRRF automáticos ficam desativados neste modo", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("R$ 1.333,33", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("updates the net estimate when legal deductions are toggled", async ({ page }) => {
    await page.goto("/calculadoras/ferias?s=6000&m=g&ai=2025-06-01&ref=2026-06-07&fi=2026-07-01&fa=0&df=30&dl=1");

    await expectResults(page, ["Resumo das férias", "INSS estimado", "IRRF estimado"]);
    await expect(page.getByText("R$ 8.000,00", { exact: false }).first()).toBeVisible();

    await page.getByRole("checkbox", { name: /Estimar INSS e IRRF/ }).first().uncheck();
    await page.getByRole("button", { name: "Calcular férias" }).click();

    await expect(page.getByText("INSS e IRRF automáticos foram desativados", { exact: false })).toBeVisible();
    await expect(page.getByText("INSS estimado", { exact: true })).toHaveCount(0);
    await expect(page.getByText("IRRF estimado", { exact: true })).toHaveCount(0);
    await expect(page.getByText("R$ 8.000,00", { exact: true })).toHaveCount(2);
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/ferias");

    await submitFeriasComAbono(page);
    await expectNoHorizontalOverflow(page);
  });
});
