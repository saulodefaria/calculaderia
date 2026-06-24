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

async function submitDefaultInss(page: Page) {
  await page.getByRole("button", { name: "Calcular INSS" }).click();

  await expectResults(page, ["Resumo do INSS", "R$ 248,60", "Tabela INSS 2026"]);
  await expect(page.getByText("Fontes oficiais consultadas em 2026-06-24", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Décimo terceiro salário é tratado separadamente", { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId("inss-bracket-table")).toBeVisible();
}

test.describe("inss calculator", () => {
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

  test("submits the default estimate, shares, restores with tb=2026, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/inss");

    await submitDefaultInss(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/inss?");
    expect(sharedUrl).toContain("tb=2026");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do INSS", "R$ 248,60"]);
    await expect(visibleFieldById(restoredPage, "salarioContribuicao")).toHaveValue("3.000,00");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/inss?");
    expect(callbackUrl).toContain("tb=2026");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("calculates a R$ 6000 salary-contribution base", async ({ page }) => {
    await page.goto("/calculadoras/inss");

    await fillField(page, "salarioContribuicao", "6.000,00");
    await page.getByRole("button", { name: "Calcular INSS" }).click();

    await expectResults(page, ["Resumo do INSS", "R$ 641,51", "10,69%"]);
    await expect(page.getByText("De R$ 4.354,28 a R$ 8.475,55", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("caps above-ceiling bases and shows the ceiling warning", async ({ page }) => {
    await page.goto("/calculadoras/inss");

    await fillField(page, "salarioContribuicao", "9.000,00");
    await page.getByRole("button", { name: "Calcular INSS" }).click();

    await expectResults(page, ["Resumo do INSS", "R$ 988,09", "R$ 8.475,55"]);
    await expect(page.getByText("ultrapassa o teto de R$ 8.475,55", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/inss");

    await submitDefaultInss(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/inss?tb=2026&s=6000&cat=a");
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil INSS Contribution Calculator" })).toBeVisible();
    await expect(main.getByTestId("inss-contribution-result")).toBeVisible();
    await expect(main.getByText("INSS summary", { exact: false })).toBeVisible();
    await expect(main.getByText("Official sources accessed on 2026-06-24", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/inss?tb=2026&s=6000&cat=d");
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de INSS de Brasil" })).toBeVisible();
    await expect(main.getByTestId("inss-contribution-result")).toBeVisible();
    await expect(main.getByText("Resumen del INSS", { exact: false })).toBeVisible();
    await expect(main.getByText("Fuentes oficiales consultadas el 2026-06-24", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
