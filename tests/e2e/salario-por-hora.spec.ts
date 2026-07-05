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

async function submitDefaultSalary(page: Page) {
  await page.getByRole("button", { name: "Calcular salário por hora" }).click();

  await expectResults(page, ["Resumo do salário por hora", "R$ 13,64", "220", "R$ 2.181,82"]);
  await expect(page.getByText("Fontes acessadas em 2026-07-05", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Não calcula INSS, IRRF, FGTS", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Multiplicador bruto simples", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("O adicional exibido é só multiplicador bruto", { exact: false }).first()).toBeVisible();
}

test.describe("salario-por-hora calculator", () => {
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

  test("calculates default gross hourly salary, shares, restores, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/salario-por-hora");

    await submitDefaultSalary(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/salario-por-hora?");
    expect(sharedUrl).toContain("sv=2026-07-05");
    expect(sharedUrl).toContain("md=mh");
    expect(sharedUrl).toContain("dm=sem");
    expect(sharedUrl).toContain("js=44");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do salário por hora", "R$ 13,64", "220", "R$ 2.181,82"]);
    await expect(visibleFieldById(restoredPage, "salarioMensal")).toHaveValue("3.000,00");
    await expect(visibleFieldById(restoredPage, "jornadaSemanal")).toHaveValue("44");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/salario-por-hora?");
    expect(callbackUrl).toContain("sv=2026-07-05");
    expect(callbackUrl).toContain("md=mh");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("uses 40h weekly divisor 200", async ({ page }) => {
    await page.goto("/calculadoras/salario-por-hora");

    await fillField(page, "jornadaSemanal", "40");
    await page.getByRole("button", { name: "Calcular salário por hora" }).click();

    await expectResults(page, ["Resumo do salário por hora", "R$ 15,00", "200", "R$ 2.400,00"]);
    await expectNoHorizontalOverflow(page);
  });

  test("converts hourly rate to monthly equivalent", async ({ page }) => {
    await page.goto("/calculadoras/salario-por-hora");

    await page.getByRole("button", { name: "Valor da hora para mês" }).click();
    await fillField(page, "valorHora", "20,00");
    await page.getByRole("button", { name: "Calcular salário por hora" }).click();

    await expectResults(page, ["Resumo do salário por hora", "R$ 20,00", "R$ 4.400,00"]);
    await expectNoHorizontalOverflow(page);
  });

  test("uses manual divisor and shows the manual-divisor warning", async ({ page }) => {
    await page.goto("/calculadoras/salario-por-hora");

    await fillField(page, "salarioMensal", "5.000,00");
    await fillField(page, "horasPeriodo", "12");
    await page.getByRole("button", { name: "Divisor manual" }).click();
    await fillField(page, "divisorMensalManual", "180");
    await page.getByRole("button", { name: "Calcular salário por hora" }).click();

    await expectResults(page, ["Resumo do salário por hora", "R$ 27,78", "180", "R$ 333,33"]);
    await expect(page.getByText("Divisor manual foi informado pelo usuário", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/salario-por-hora");

    await submitDefaultSalary(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/salario-por-hora?sv=2026-07-05&md=mh&dm=sem&js=44&s=3000");
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil Hourly Salary Calculator" })).toBeVisible();
    await expect(main.getByTestId("salario-por-hora-hourly-result")).toBeVisible();
    await expect(main.getByText("Gross hourly value", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/salario-por-hora?sv=2026-07-05&md=mh&dm=sem&js=44&s=3000");
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de Salario por Hora en Brasil" })).toBeVisible();
    await expect(main.getByTestId("salario-por-hora-hourly-result")).toBeVisible();
    await expect(main.getByText("Valor bruto de la hora", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
