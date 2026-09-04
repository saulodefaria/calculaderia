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

async function submitDefaultInssEmAtraso(page: Page) {
  await page.getByRole("button", { name: "Calcular INSS em atraso" }).click();

  await expectResults(page, ["Resumo do INSS em atraso", "R$ 406,84", "R$ 324,20", "R$ 82,64"]);
  await expect(page.getByTestId("inss-em-atraso-source-badge")).toContainText("2026-07-06");
  await expect(page.getByText("Não emite GPS", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Pagar uma estimativa não garante CNIS", { exact: false }).first()).toBeVisible();
}

test.describe("inss-em-atraso calculator", () => {
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

  test("calculates the default example, shares, restores, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/inss-em-atraso");

    await submitDefaultInssEmAtraso(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/inss-em-atraso?");
    expect(sharedUrl).toContain("sv=2026-07-06");
    expect(sharedUrl).toContain("v=324.2");
    expect(sharedUrl).toContain("comp=2026-01");
    expect(sharedUrl).toContain("due=2026-02-16");
    expect(sharedUrl).toContain("pay=2026-07-06");
    expect(sharedUrl).toContain("cat=ci");
    expect(sharedUrl).not.toContain("cpf");
    expect(sharedUrl).not.toContain("nit");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do INSS em atraso", "R$ 406,84", "R$ 82,64"]);
    await expect(visibleFieldById(restoredPage, "valorPrincipal")).toHaveValue("324,20");
    await expect(visibleFieldById(restoredPage, "competencia")).toHaveValue("2026-01");
    await expect(visibleFieldById(restoredPage, "dataVencimento")).toHaveValue("2026-02-16");
    await expect(visibleFieldById(restoredPage, "dataPagamento")).toHaveValue("2026-07-06");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/inss-em-atraso?");
    expect(callbackUrl).toContain("sv=2026-07-06");
    expect(callbackUrl).toContain("comp=2026-01");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("calculates short delay and manual day override examples", async ({ page }) => {
    await page.goto("/calculadoras/inss-em-atraso");

    await fillField(page, "valorPrincipal", "178,31");
    await fillField(page, "competencia", "2026-05");
    await fillField(page, "dataPagamento", "2026-07-06");
    await page.getByRole("button", { name: "Calcular INSS em atraso" }).click();

    await expectResults(page, ["R$ 192,45", "6,93% / R$ 12,36", "1,00% / R$ 1,78"]);
    await expectNoHorizontalOverflow(page);

    await fillField(page, "valorPrincipal", "324,20");
    await fillField(page, "competencia", "2026-01");
    await fillField(page, "dataPagamento", "2026-07-06");
    await fillField(page, "diasAtrasoManual", "30");
    await page.getByRole("button", { name: "Calcular INSS em atraso" }).click();

    await expectResults(page, ["R$ 374,10", "9,90% / R$ 32,10"]);
    await expect(page.getByText("Dias de atraso foram informados manualmente", { exact: false }).first()).toBeVisible();
  });

  test("blocks future payment source windows and warns for older facultativo competence", async ({ page }) => {
    await page.goto(
      "/calculadoras/inss-em-atraso?sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-08-01&cat=ci"
    );

    await expectResults(page, ["Fonte expirada", "R$ 324,20"]);
    await expect(page.getByText("suporta pagamento somente até 2026-07-31", { exact: false }).first()).toBeVisible();

    await page.goto(
      "/calculadoras/inss-em-atraso?sv=2026-07-06&v=324.2&comp=2025-12&due=2026-01-15&pay=2026-07-06&cat=fac"
    );

    await expectResults(page, ["Revisão oficial", "R$ 410,08"]);
    await expect(page.getByText("Facultativo fora dos últimos 6 meses", { exact: false }).first()).toBeVisible();
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/inss-em-atraso");

    await submitDefaultInssEmAtraso(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    const query = "sv=2026-07-06&v=324.2&comp=2026-01&due=2026-02-16&pay=2026-07-06&cat=ci";

    await page.goto(`/en/calculadoras/inss-em-atraso?${query}`);
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil INSS Arrears Calculator" })).toBeVisible();
    await expect(main.getByTestId("inss-em-atraso-total-result")).toBeVisible();
    await expect(main.getByText("Estimated total", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(`/es/calculadoras/inss-em-atraso?${query}`);
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de INSS atrasado de Brasil" })).toBeVisible();
    await expect(main.getByTestId("inss-em-atraso-total-result")).toBeVisible();
    await expect(main.getByText("Total estimado", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
