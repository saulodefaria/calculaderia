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

async function chooseMonthlyRate(page: Page) {
  await page.getByLabel("Período da taxa").click();
  await page.getByRole("option", { name: "Mensal" }).click();
}

function resultCard(page: Page, testId: string) {
  return page.getByRole("main").getByTestId(testId);
}

test.describe("investimento calculator", () => {
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

  test("loads default projection, shares sv=2026-06-26, and preserves query on save", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/investimento");

    expect(new URL(page.url()).pathname).toBe("/calculadoras/investimento");
    await expect(page.getByRole("heading", { level: 1, name: "Calculadora de investimento" })).toBeVisible();
    await expectResults(page, [
      "Resultado da simulação",
      "R$ 92.221,06",
      "sv=2026-06-26",
      "Não inclui IR, IOF",
      "não busca CDI",
      "não é recomendação",
      "Evolução projetada",
      "Tabela anual resumida",
    ]);
    await expect(page.getByRole("link", { name: "Microsoft EFFECT" })).toBeVisible();
    await expect(resultCard(page, "investimento-final-result")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/investimento?");
    expect(sharedUrl).toContain("sv=2026-06-26");
    expect(sharedUrl).toContain("m=p");
    expect(sharedUrl).toContain("vi=1000");
    expect(sharedUrl).toContain("am=500");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expect(resultCard(restoredPage, "investimento-final-result")).toContainText("R$ 92.221,06");
    await expect(visibleFieldById(restoredPage, "valorInicial")).toHaveValue("1.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/investimento?");
    expect(callbackUrl).toContain("sv=2026-06-26");
    expect(callbackUrl).toContain("vi=1000");
  });

  test("solves required monthly contribution", async ({ page }) => {
    await page.goto("/calculadoras/investimento");

    await page.getByRole("button", { name: "Calcular aporte necessário" }).click();
    await fillField(page, "valorInicial", "10.000,00");
    await fillField(page, "metaValor", "100.000,00");
    await fillField(page, "prazoMeses", "120");
    await page.getByRole("button", { name: "Calcular investimento" }).click();

    await expectResults(page, ["Aporte mensal necessário", "R$ 435,31", "R$ 100.000,00"]);
    await expect(resultCard(page, "investimento-required-contribution-result")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("solves time to goal with monthly rate", async ({ page }) => {
    await page.goto("/calculadoras/investimento");

    await page.getByRole("button", { name: "Calcular tempo até a meta" }).click();
    await fillField(page, "valorInicial", "0,00");
    await fillField(page, "aporteMensal", "1.350,00");
    await fillField(page, "metaValor", "100.000,00");
    await fillField(page, "taxa", "0,75");
    await chooseMonthlyRate(page);
    await page.getByRole("button", { name: "Calcular investimento" }).click();

    await expectResults(page, ["Tempo até a meta", "60 meses", "R$ 101.822,58"]);
    await expect(resultCard(page, "investimento-time-to-goal-result")).toBeVisible();
  });

  test("shows stale source-version warning and restores safe defaults", async ({ page }) => {
    await page.goto("/calculadoras/investimento?sv=2025-01-01&vi=999999");

    await expect(page.getByText("versão de fórmula ausente ou antiga", { exact: false })).toBeVisible();
    await expect(resultCard(page, "investimento-final-result")).toContainText("R$ 92.221,06");
    await expect(visibleFieldById(page, "valorInicial")).toHaveValue("1.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("restores explicit zero URL state", async ({ page }) => {
    await page.goto("/calculadoras/investimento?sv=2026-06-26&m=p&vi=0&am=0&mv=0&pm=1&tx=0&tp=m&at=f&ia=0");

    await expect(resultCard(page, "investimento-final-result")).toContainText("R$ 0,00");
    await expect(visibleFieldById(page, "valorInicial")).toHaveValue("0,00");
    await expect(visibleFieldById(page, "aporteMensal")).toHaveValue("0,00");
    await expect(visibleFieldById(page, "prazoMeses")).toHaveValue("1");
    await expect(visibleFieldById(page, "taxa")).toHaveValue("0");
    await expect(visibleFieldById(page, "inflacaoAnual")).toHaveValue("0");
    await expect(page.getByText("versão de fórmula ausente ou antiga", { exact: false })).toHaveCount(0);
  });

  test("rejects reviewed high-rate overflow scenario without non-finite output", async ({ page }) => {
    await page.goto("/calculadoras/investimento?sv=2026-06-26&m=p&vi=1000000000&am=100000000&mv=100000&pm=600&tx=220&tp=m&at=f");

    await expect(resultCard(page, "investimento-final-result")).toContainText("R$ 92.221,06");
    await expect(visibleFieldById(page, "valorInicial")).toHaveValue("1.000,00");
    await expect(page.locator("body")).not.toContainText(/Infinity|NaN/);

    await fillField(page, "valorInicial", "1.000.000.000,00");
    await fillField(page, "aporteMensal", "100.000.000,00");
    await fillField(page, "prazoMeses", "600");
    await fillField(page, "taxa", "220");
    await chooseMonthlyRate(page);
    await page.getByRole("button", { name: "Calcular investimento" }).click();

    await expect(page.getByText("Informe taxa maior que -100%", { exact: false })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Infinity|NaN/);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/investimento");

    await expect(resultCard(page, "investimento-final-result")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/investimento?sv=2026-06-26&m=p&vi=1000&am=500&mv=100000&pm=120&tx=8&tp=a&at=f");
    await expect(page.getByRole("heading", { level: 1, name: "Investment Calculator" })).toBeVisible();
    await expect(resultCard(page, "investimento-final-result")).toBeVisible();
    await expect(page.getByLabel("Starting amount")).toBeVisible();
    await expect(page.getByLabel("Monthly contribution")).toBeVisible();
    await expect(page.getByLabel("Estimated return")).toBeVisible();
    await expect(page.getByText("Educational result", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("not investment, accounting, tax, or legal advice", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/investimento?sv=2026-06-26&m=p&vi=1000&am=500&mv=100000&pm=120&tx=8&tp=a&at=f");
    await expect(page.getByRole("heading", { level: 1, name: "Calculadora de Inversión" })).toBeVisible();
    await expect(resultCard(page, "investimento-final-result")).toBeVisible();
    await expect(page.getByLabel("Valor inicial")).toBeVisible();
    await expect(page.getByLabel("Aporte mensual")).toBeVisible();
    await expect(page.getByLabel("Rentabilidad estimada")).toBeVisible();
    await expect(page.getByText("Resultado educativo", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("no asesoría de inversión, contable, tributaria o legal", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
