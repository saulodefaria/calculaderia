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

async function selectOption(page: Page, name: RegExp, option: string) {
  await page.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option }).click();
}

async function submitEligibleFirstRequest(page: Page) {
  await fillField(page, "salarioUltimo", "3.000,00");
  await fillField(page, "salarioPenultimo", "3.000,00");
  await fillField(page, "salarioAntepenultimo", "3.000,00");
  await fillField(page, "mesesComSalarioElegibilidade", "12");
  await fillField(page, "mesesTrabalhados36", "12");
  await fillField(page, "dataDispensa", "2026-06-01");
  await fillField(page, "dataRequerimento", "2026-06-08");
  await page.getByRole("button", { name: "Calcular seguro-desemprego" }).click();

  await expectResults(page, ["Resumo do seguro-desemprego", "Elegível pela estimativa"]);
  await expect(page.getByText("R$ 2.166,66", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("4 parcelas", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("R$ 8.666,64", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Tabela MTE 2026 - vigência 11/01/2026 - acesso 19/06/2026", { exact: false }).first()
  ).toBeVisible();
}

test.describe("seguro-desemprego calculator", () => {
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

  test("submits eligible values, shares, restores with tb=2026, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/seguro-desemprego");

    await submitEligibleFirstRequest(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/seguro-desemprego?");
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("s1=3000");
    expect(sharedUrl).toContain("sol=1");
    expect(sharedUrl).toContain("mt=sjc");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do seguro-desemprego", "R$ 8.666,64"]);
    await expect(visibleFieldById(restoredPage, "salarioUltimo")).toHaveValue("3.000,00");
    await expect(visibleFieldById(restoredPage, "dataDispensa")).toHaveValue("2026-06-01");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("restores salary floor and ceiling cases from shared URLs", async ({ page }) => {
    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=1900&s2=0&s3=0&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-06-08&de=1&sr=1&bp=1"
    );

    await expectResults(page, ["Resumo do seguro-desemprego", "R$ 1.621,00", "Até R$ 2.222,17"]);
    await page.waitForLoadState("networkidle");

    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=10000&s2=10000&s3=10000&sol=1&me=24&m36=24&mt=sjc&dd=2026-06-01&rq=2026-06-08&de=1&sr=1&bp=1"
    );

    await expectResults(page, ["Resumo do seguro-desemprego", "R$ 2.518,65", "Acima de R$ 3.703,99"]);
    await expectNoHorizontalOverflow(page);
  });

  test("shares and restores a one-salary case with zero optional salaries", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/seguro-desemprego");

    await fillField(page, "salarioUltimo", "1.900,00");
    await fillField(page, "salarioPenultimo", "");
    await fillField(page, "salarioAntepenultimo", "");
    await fillField(page, "mesesComSalarioElegibilidade", "12");
    await fillField(page, "mesesTrabalhados36", "12");
    await fillField(page, "dataDispensa", "2026-06-01");
    await fillField(page, "dataRequerimento", "2026-06-08");
    await page.getByRole("button", { name: "Calcular seguro-desemprego" }).click();

    await expectResults(page, ["Resumo do seguro-desemprego", "R$ 1.621,00", "R$ 6.484,00"]);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("tb=2026");
    expect(sharedUrl).toContain("s1=1900");
    expect(sharedUrl).toContain("s2=0");
    expect(sharedUrl).toContain("s3=0");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do seguro-desemprego", "R$ 1.621,00", "R$ 6.484,00"]);
    await expect(visibleFieldById(restoredPage, "salarioUltimo")).toHaveValue("1.900,00");
    await expect(visibleFieldById(restoredPage, "salarioPenultimo")).toHaveValue("");
    await expect(visibleFieldById(restoredPage, "salarioAntepenultimo")).toHaveValue("");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);
  });

  test("shows clear ineligible and indirect-termination review states", async ({ page }) => {
    await page.goto("/calculadoras/seguro-desemprego");
    const main = page.getByRole("main");
    await selectOption(page, /Motivo da dispensa/, "Pedido de demissão");
    await fillField(page, "dataDispensa", "2026-06-01");
    await fillField(page, "dataRequerimento", "2026-06-08");
    await page.getByRole("button", { name: "Calcular seguro-desemprego" }).click();

    await expectResults(page, ["Não elegível pelos dados", "Referência da fórmula"]);
    await expect(main.getByText("Este motivo não entra como elegível", { exact: false })).toBeVisible();

    await selectOption(page, /Motivo da dispensa/, "Rescisão indireta");
    await page.getByRole("button", { name: "Calcular seguro-desemprego" }).click();

    await expectResults(page, ["Precisa de verificação oficial", "Referência da fórmula"]);
    await expect(main.getByText("Rescisão indireta precisa de reconhecimento oficial", { exact: false })).toBeVisible();
  });

  test("shows request-window boundary states", async ({ page }) => {
    const main = page.getByRole("main");

    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=3000&s2=3000&s3=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-06-07&de=1&sr=1&bp=1"
    );
    await expectResults(page, ["Não elegível pelos dados", "6 dias após a dispensa"]);
    await expect(main.getByText("O requerimento informado está antes do 7º dia", { exact: false })).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=3000&s2=3000&s3=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-06-08&de=1&sr=1&bp=1"
    );
    await expectResults(page, ["Elegível pela estimativa", "7 dias após a dispensa"]);
    await page.waitForLoadState("networkidle");

    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=3000&s2=3000&s3=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-09-29&de=1&sr=1&bp=1"
    );
    await expectResults(page, ["Elegível pela estimativa", "120 dias após a dispensa"]);
    await page.waitForLoadState("networkidle");

    await page.goto(
      "/calculadoras/seguro-desemprego?tb=2026&s1=3000&s2=3000&s3=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-09-30&de=1&sr=1&bp=1"
    );
    await expectResults(page, ["Não elegível pelos dados", "121 dias após a dispensa"]);
    await expect(main.getByText("O requerimento informado está depois do 120º dia", { exact: false })).toBeVisible();
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/seguro-desemprego");

    await submitEligibleFirstRequest(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/seguro-desemprego?tb=2026&s1=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-06-08&de=1&sr=1&bp=1");
    const main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil Seguro-Desemprego Calculator" })).toBeVisible();
    await expect(main.getByText("Seguro-desemprego summary", { exact: false })).toBeVisible();
    await expect(main.getByText("Eligible by estimate", { exact: false })).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/seguro-desemprego?tb=2026&s1=3000&sol=1&me=12&m36=12&mt=sjc&dd=2026-06-01&rq=2026-06-08&de=1&sr=1&bp=1");
    await expect(page.getByRole("heading", { name: "Calculadora de Seguro de Desempleo de Brasil" })).toBeVisible();
    await expect(main.getByText("Resumen del seguro-desemprego", { exact: false })).toBeVisible();
    await expect(main.getByText("Elegible según la estimación", { exact: false })).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
