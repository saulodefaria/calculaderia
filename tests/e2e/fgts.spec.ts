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

async function submitDefaultFgts(page: Page) {
  await page.getByRole("button", { name: "Calcular FGTS" }).click();

  await expectResults(page, ["Resumo do FGTS", "R$ 240,00", "R$ 3.120,00"]);
  await expect(page.getByText("Fontes 2026-06-22", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Empregado doméstico, DAE/eSocial doméstico", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("A estimativa não aplica correção", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("FGTS Digital, eSocial, CAIXA", { exact: false }).first()).toBeVisible();
}

test.describe("fgts calculator", () => {
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

  test("submits the default estimate, shares, restores with sv=2026-06-22, and prompts sign-in when saving", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/fgts");

    await submitDefaultFgts(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/fgts?");
    expect(sharedUrl).toContain("sv=2026-06-22");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do FGTS", "R$ 240,00", "R$ 3.120,00"]);
    await expect(visibleFieldById(restoredPage, "baseMensalFgts")).toHaveValue("3.000,00");
    await expect(visibleFieldById(restoredPage, "meses")).toHaveValue("12");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/fgts?");
    expect(callbackUrl).toContain("sv=2026-06-22");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("updates base, months, and apprentice deposit type", async ({ page }) => {
    await page.goto("/calculadoras/fgts");

    await fillField(page, "baseMensalFgts", "1.500,00");
    await fillField(page, "meses", "6");
    await fillField(page, "baseDecimoTerceiro", "");
    await selectOption(page, /Tipo de depósito/, "Aprendiz 2%");
    await page.getByRole("button", { name: "Calcular FGTS" }).click();

    await expectResults(page, ["Resumo do FGTS", "R$ 30,00", "R$ 180,00"]);
    await expect(page.getByText("Depósito de aprendiz de 2%", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("restores a 40% no-balance fine warning from a shared URL", async ({ page }) => {
    await page.goto("/calculadoras/fgts?sv=2026-06-22&mt=sjc");

    await expectResults(page, ["Resumo do FGTS", "R$ 1.248,00", "R$ 3.120,00"]);
    await expect(page.getByText("Foi escolhido cenário com multa sem informar saldo", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("depósitos estimados e não reproduz", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("restores official balance and mutual agreement fine", async ({ page }) => {
    await page.goto("/calculadoras/fgts?sv=2026-06-22&fg=10000&fi=1&mt=ac");

    await expectResults(page, ["Resumo do FGTS", "R$ 2.000,00", "R$ 8.000,00"]);
    await expect(page.getByText("Acordo CLT art. 484-A", { exact: false }).first()).toBeVisible();
    await expect(visibleFieldById(page, "saldoFgtsInformado")).toHaveValue("10.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/fgts");

    await submitDefaultFgts(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/fgts?sv=2026-06-22&s=3000&mt=sjc");
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Brazil FGTS Calculator" })).toBeVisible();
    await expect(main.getByTestId("fgts-fine-result")).toBeVisible();
    await expect(main.getByText("FGTS summary", { exact: false })).toBeVisible();
    await expect(main.getByText("FGTS Digital, eSocial, CAIXA", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.waitForLoadState("networkidle");

    await page.goto("/es/calculadoras/fgts?sv=2026-06-22&s=3000&mt=sjc");
    main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Calculadora de FGTS de Brasil" })).toBeVisible();
    await expect(main.getByTestId("fgts-fine-result")).toBeVisible();
    await expect(main.getByText("Resumen del FGTS", { exact: false })).toBeVisible();
    await expect(main.getByText("FGTS Digital, eSocial, CAIXA", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
