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

async function submitRefundScenario(page: Page) {
  await fillField(page, "rendimentosTributaveis", "60.000,00");
  await fillField(page, "impostoRetidoFonte", "3.000,00");
  await page.getByRole("button", { name: "Calcular IRPF estimado" }).click();

  await expectResults(page, ["Resumo do IRPF estimado", "R$ 254,97", "R$ 2.745,03", "Desconto simplificado"]);
  await expect(page.getByTestId("imposto-de-renda-balance-result")).toBeVisible();
  await expect(page.getByTestId("imposto-de-renda-source-badge")).toContainText("2026-06-26");
  await expect(page.getByText("A URL de compartilhar ou salvar pode conter valores financeiros", { exact: false })).toBeVisible();
}

test.describe("imposto-de-renda calculator", () => {
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

  test("calculates a 2025 refund scenario, shares, restores, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/imposto-de-renda");

    await submitRefundScenario(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/imposto-de-renda?");
    expect(sharedUrl).toContain("sv=2026-06-26");
    expect(sharedUrl).toContain("ac=2025");
    expect(sharedUrl).toContain("rt=60000");
    expect(sharedUrl).toContain("ir=3000");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do IRPF estimado", "R$ 254,97"]);
    await expect(visibleFieldById(restoredPage, "rendimentosTributaveis")).toHaveValue("60.000,00");
    await expect(visibleFieldById(restoredPage, "impostoRetidoFonte")).toHaveValue("3.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/imposto-de-renda?");
    expect(callbackUrl).toContain("sv=2026-06-26");
    expect(callbackUrl).toContain("ac=2025");
    expect(callbackUrl).toContain("rt=60000");
    expect(callbackUrl).toContain("ir=3000");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("switches deduction method and 2026 calendar-year mode", async ({ page }) => {
    await page.goto("/calculadoras/imposto-de-renda");

    await fillField(page, "rendimentosTributaveis", "60.000,00");
    await page.getByRole("button", { name: "Deduções legais" }).click();
    await page.getByRole("button", { name: "Calcular IRPF estimado" }).click();
    await expectResults(page, ["Resumo do IRPF estimado", "R$ 5.646,22", "Deduções legais"]);

    await page.getByRole("button", { name: "Estimativa 2026 (exercício 2027)" }).click();
    await page.getByRole("button", { name: "Desconto simplificado" }).click();
    await page.getByRole("button", { name: "Calcular IRPF estimado" }).click();

    await expectResults(page, ["Ano-calendário 2026", "Redução anual 2026", "R$ 2.694,15"]);
    await expect(page.getByTestId("imposto-de-renda-balance-result")).toContainText("R$ 0,00");
    await expectNoHorizontalOverflow(page);
  });

  test("shows stale-link warning for unsupported source version", async ({ page }) => {
    await page.goto("/calculadoras/imposto-de-renda?sv=2026-01-01&ac=2025&rt=60000");

    await expect(
      page.getByText("versão de fonte ou ano-calendário não suportado", { exact: false }).filter({ visible: true })
    ).toBeVisible();
    await expect(visibleFieldById(page, "rendimentosTributaveis")).toHaveValue("");
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/imposto-de-renda");

    await submitRefundScenario(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/imposto-de-renda?sv=2026-06-26&ac=2025&rt=60000&ir=3000");
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil IRPF Income Tax Calculator" })).toBeVisible();
    await expect(main.getByTestId("imposto-de-renda-balance-result")).toBeVisible();
    await expect(main.getByText("Estimated IRPF summary", { exact: false })).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/imposto-de-renda?sv=2026-06-26&ac=2025&rt=60000&ir=3000");
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de IRPF de Brasil" })).toBeVisible();
    await expect(main.getByTestId("imposto-de-renda-balance-result")).toBeVisible();
    await expect(main.getByText("Resumen del IRPF estimado", { exact: false })).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
