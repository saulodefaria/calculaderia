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

async function submitRescisao(page: Page) {
  await fillField(page, "salarioMensal", "4.000,00");
  await fillField(page, "mediaVariavelMensal", "500,00");
  await fillField(page, "dataAdmissao", "2024-02-29");
  await fillField(page, "dataDesligamento", "2026-05-31");
  await fillField(page, "diasTrabalhadosMes", "30");
  await fillField(page, "feriasVencidasPeriodos", "1");
  await fillField(page, "saldoFgts", "12.000,00");
  await page.getByRole("button", { name: "Calcular rescisão" }).click();
  await expectResults(page, ["Resumo da rescisão", "Verbas rescisórias detalhadas", "Valor líquido estimado"]);
  await expect(page.getByText("Regras CLT, FGTS, aviso prévio e tabelas INSS/IRRF consultadas", { exact: false })).toBeVisible();
  await expect(page.getByText("Resultado educativo; TRCT, eSocial, FGTS Digital", { exact: false })).toBeVisible();
  await expect(page.getByText("Esta calculadora oferece uma estimativa educativa", { exact: false })).toBeVisible();
}

async function selectRadixOption(page: Page, triggerId: string, optionName: string) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole("option", { name: optionName }).click();
}

test.describe("rescisao trabalhista calculator", () => {
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
    await page.goto("/calculadoras/rescisao-trabalhista");

    await submitRescisao(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/rescisao-trabalhista?");
    expect(sharedUrl).toContain("s=4000");
    expect(sharedUrl).toContain("mt=sjc");
    expect(sharedUrl).toContain("fg=12000");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo da rescisão", "Verbas rescisórias detalhadas"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("4.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("adapts notice options for resignation and shows FGTS warning when balance is blank", async ({ page }) => {
    await page.goto("/calculadoras/rescisao-trabalhista");

    await selectRadixOption(page, "motivo", "Pedido de demissão");
    await selectRadixOption(page, "avisoPrevio", "Descontado");
    await fillField(page, "salarioMensal", "3.000,00");
    await fillField(page, "dataAdmissao", "2025-01-01");
    await fillField(page, "dataDesligamento", "2026-03-10");
    await fillField(page, "diasTrabalhadosMes", "10");
    await page.getByRole("button", { name: "Calcular rescisão" }).click();

    await expectResults(page, ["Resumo da rescisão", "Desconto de aviso"]);
    await expect(page.getByText("Sem saldo de FGTS informado", { exact: false })).toBeVisible();
  });

  test("restores less common termination modes from shared URLs", async ({ page }) => {
    const modes = [
      {
        path: "/calculadoras/rescisao-trabalhista?s=3200&ad=2025-01-05&dd=2026-03-10&mt=jc&av=na&dt=10&fv=1&dl=1",
        result: "Não se aplica",
      },
      {
        path: "/calculadoras/rescisao-trabalhista?s=4500&ad=2024-01-10&dd=2026-05-20&mt=ac&av=ind&dt=20&fv=0&fg=9000&dl=1",
        result: "20,00%",
      },
      {
        path: "/calculadoras/rescisao-trabalhista?s=4500&ad=2024-01-10&dd=2026-05-20&mt=ri&av=ind&dt=20&fv=0&fg=9000&dl=1",
        result: "Rescisão indireta exige reconhecimento judicial",
      },
    ];

    for (const mode of modes) {
      await page.goto(mode.path);
      await page.waitForLoadState("networkidle");

      await expectResults(page, ["Resumo da rescisão", "Verbas rescisórias detalhadas"]);
      await expect(page.getByText(mode.result, { exact: false }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/rescisao-trabalhista");

    await submitRescisao(page);
    await expectNoHorizontalOverflow(page);
  });
});
