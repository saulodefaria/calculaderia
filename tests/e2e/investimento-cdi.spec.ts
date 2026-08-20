import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, fillField, visibleFieldById } from "./helpers/calculator";

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

async function expectDefaultSnapshot(page: Page) {
  await expect(page.getByRole("heading", { name: "Calculadora investimento CDI" })).toBeVisible();
  await expect(page.getByTestId("investimento-cdi-net-value")).toContainText("R$ 11.167,37");
  await expect(page.getByTestId("investimento-cdi-net-yield")).toContainText("R$ 1.167,37");
  await expect(page.getByTestId("investimento-cdi-gross-yield")).toContainText("R$ 1.415,00");
  await expect(page.getByTestId("investimento-cdi-total-taxes")).toContainText("R$ 247,63");
  await expect(page.getByTestId("investimento-cdi-source-badge")).toContainText("sv=2026-07-06");
  await expect(page.getByText("0.052531%", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("14.15%", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("2026-07-02", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("nao e recomendacao", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("nao valida contrato", { exact: false }).first()).toBeVisible();
}

test.describe("investimento CDI calculator", () => {
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

  test("loads default BCB snapshot, shares, restores, and preserves save callback query", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/investimento-cdi");

    await expectDefaultSnapshot(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/investimento-cdi?");
    expect(sharedUrl).toContain("sv=2026-07-06");
    expect(sharedUrl).toContain("v=10000");
    expect(sharedUrl).toContain("dc=365");
    expect(sharedUrl).toContain("du=252");
    expect(sharedUrl).toContain("dum=e");
    expect(sharedUrl).toContain("pc=100");
    expect(sharedUrl).toContain("cm=s");
    expect(sharedUrl).not.toContain("cdi=");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expect(restoredPage.getByTestId("investimento-cdi-net-value")).toContainText("R$ 11.167,37");
    await expect(visibleFieldById(restoredPage, "valorInicial")).toHaveValue("10.000,00");
    await expect(visibleFieldById(restoredPage, "percentualCdi")).toHaveValue("100");
    await expect(visibleFieldById(restoredPage, "diasUteis")).toHaveValue("252");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/investimento-cdi?");
    expect(callbackUrl).toContain("sv=2026-07-06");
    expect(callbackUrl).toContain("cm=s");
    expect(callbackUrl).toContain("pc=100");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("updates 110% CDI and manual annual CDI assumptions", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/investimento-cdi");

    await fillField(page, "percentualCdi", "110");
    await page.getByRole("button", { name: "Calcular investimento CDI" }).click();
    await expect(page.getByTestId("investimento-cdi-net-value")).toContainText("R$ 11.292,80");
    await expect(page.getByTestId("investimento-cdi-comparison-110")).toContainText("selecionado");

    await fillField(page, "valorInicial", "25.000,00");
    await fillField(page, "prazoDiasCorridos", "540");
    await page.getByRole("button", { name: "Informar dias uteis" }).click();
    await fillField(page, "diasUteis", "360");
    await page.getByRole("button", { name: "CDI manual" }).click();
    await fillField(page, "cdiAnualManual", "12,5");
    await page.getByRole("button", { name: "Calcular investimento CDI" }).click();
    await expect(page.getByText("Usa a premissa anual informada por voce", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Compartilhar" }).click();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("sv=2026-07-06");
    expect(sharedUrl).toContain("v=25000");
    expect(sharedUrl).toContain("dc=540");
    expect(sharedUrl).toContain("du=360");
    expect(sharedUrl).toContain("dum=m");
    expect(sharedUrl).toContain("pc=110");
    expect(sharedUrl).toContain("cm=m");
    expect(sharedUrl).toContain("cdi=12.5");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expect(visibleFieldById(restoredPage, "valorInicial")).toHaveValue("25.000,00");
    await expect(visibleFieldById(restoredPage, "prazoDiasCorridos")).toHaveValue("540");
    await expect(visibleFieldById(restoredPage, "diasUteis")).toHaveValue("360");
    await expect(visibleFieldById(restoredPage, "percentualCdi")).toHaveValue("110");
    await expect(visibleFieldById(restoredPage, "cdiAnualManual")).toHaveValue("12,5");
    await expect(restoredPage.getByText("Usa a premissa anual informada por voce", { exact: false }).first()).toBeVisible();
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);
  });

  test("shows IOF for short redemptions and restores defaults for stale source links", async ({ page }) => {
    await page.goto("/calculadoras/investimento-cdi?sv=2026-07-06&v=10000&dc=20&du=15&dum=m&pc=100&cm=s");

    await expect(page.getByTestId("investimento-cdi-net-value")).toContainText("R$ 10.041,07");
    await expect(page.getByText("R$ 26,10", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Prazo de ate 30 dias pode ter IOF", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("15 dias uteis informados", { exact: false }).first()).toBeVisible();

    await page.goto("/calculadoras/investimento-cdi?sv=2026-07-05&v=5000&dc=30&du=21&dum=m&pc=110&cm=s");
    await expect(page.getByTestId("investimento-cdi-stale-source-warning")).toBeVisible();
    await expect(page.getByText("Fonte atualizada", { exact: false })).toBeVisible();
    await expect(page.getByTestId("investimento-cdi-net-value")).toContainText("R$ 11.167,37");
    await expect(visibleFieldById(page, "valorInicial")).toHaveValue("10.000,00");

    await page.goto("/calculadoras/investimento-cdi?v=5000&dc=30&du=21&dum=m&pc=110&cm=s");
    await expect(page.getByTestId("investimento-cdi-stale-source-warning")).toBeVisible();
    await expect(page.getByTestId("investimento-cdi-net-value")).toContainText("R$ 11.167,37");
    await expect(visibleFieldById(page, "valorInicial")).toHaveValue("10.000,00");
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/investimento-cdi");

    await expectDefaultSnapshot(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/investimento-cdi?sv=2026-07-06&v=10000&dc=365&du=252&dum=e&pc=100&cm=s");
    await expect(page.getByRole("heading", { name: "CDI Investment Calculator" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("investimento-cdi-net-value")).toBeVisible();
    await expect(page.getByText("Estimated net value", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/investimento-cdi?sv=2026-07-06&v=10000&dc=365&du=252&dum=e&pc=100&cm=s");
    await expect(page.getByRole("heading", { name: "Calculadora de inversion CDI" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("investimento-cdi-net-value")).toBeVisible();
    await expect(page.getByText("Valor neto estimado", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
