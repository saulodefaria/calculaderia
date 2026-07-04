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

async function submitDefaultMcmv(page: Page) {
  await page.getByRole("button", { name: "Simular MCMV" }).click();

  await expectResults(page, [
    "Resumo do financiamento Minha Casa Minha Vida",
    "Faixa 2",
    "7,00%",
    "R$ 230.000,00",
    "R$ 1.980,56 / R$ 642,21",
    "R$ 242.170,42",
    "Regras 2026-07-03",
    "O subsídio/desconto não é calculado automaticamente",
    "CET",
  ]);
  await expect(page.getByTestId("financiamento-mcmv-amortization-table")).toBeVisible();
  await expect(page.getByText("R$ 1.337,94", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("R$ 229.361,11", { exact: false }).first()).toBeVisible();
}

test.describe("financiamento Minha Casa Minha Vida calculator", () => {
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

  test("submits the default SAC estimate, shares explicit zero values, restores, and preserves save callback", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/financiamento-minha-casa-minha-vida");

    await submitDefaultMcmv(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/financiamento-minha-casa-minha-vida?");
    const sharedParams = new URL(sharedUrl).searchParams;
    expect(sharedParams.get("sv")).toBe("2026-07-03");
    expect(sharedParams.get("rb")).toBe("4500");
    expect(sharedParams.get("rg")).toBe("sseco");
    expect(sharedParams.get("ct")).toBe("0");
    expect(sharedParams.get("ti")).toBe("n");
    expect(sharedParams.get("vi")).toBe("250000");
    expect(sharedParams.get("ll")).toBe("0");
    expect(sharedParams.get("en")).toBe("20000");
    expect(sharedParams.get("fg")).toBe("0");
    expect(sharedParams.get("sd")).toBe("0");
    expect(sharedParams.get("pm")).toBe("360");
    expect(sharedParams.get("mt")).toBe("sac");
    expect(sharedParams.get("uo")).toBe("1");
    expect(sharedParams.get("cmp")).toBe("1");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do financiamento Minha Casa Minha Vida", "R$ 230.000,00"]);
    await expect(visibleFieldById(restoredPage, "rendaMensalBruta")).toHaveValue("4.500,00");
    await expect(visibleFieldById(restoredPage, "valorImovel")).toHaveValue("250.000,00");
    await expect(visibleFieldById(restoredPage, "limiteLocalFaixa12")).toHaveValue("");
    await expect(visibleFieldById(restoredPage, "entradaRecursosProprios")).toHaveValue("20.000,00");
    await expect(visibleFieldById(restoredPage, "fgtsEntrada")).toHaveValue("0,00");
    await expect(visibleFieldById(restoredPage, "subsidioInformado")).toHaveValue("0,00");
    await expect(visibleFieldById(restoredPage, "prazoMeses")).toHaveValue("360");
    await expect(restoredPage.locator("#regiao")).toHaveValue("sul-sudeste-centro-oeste");
    await expect(restoredPage.locator("#tipoImovel")).toHaveValue("novo");
    await expect(restoredPage.locator("#metodo-sac").filter({ visible: true }).first()).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(restoredPage.locator("#usarTaxaOficial")).toBeChecked();
    await expect(restoredPage.locator("#compararMetodos")).toBeChecked();
    await expect(restoredPage.getByTestId("financiamento-mcmv-comparison")).toBeVisible();
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/financiamento-minha-casa-minha-vida?");
    expect(callbackUrl).toContain("sv=2026-07-03");
    expect(callbackUrl).toContain("rb=4500");
    expect(callbackUrl).toContain("ll=0");
    expect(callbackUrl).toContain("fg=0");
    expect(callbackUrl).toContain("sd=0");
  });

  test("updates income band, official rate, property cap, and subsidy warnings", async ({ page }) => {
    await page.goto("/calculadoras/financiamento-minha-casa-minha-vida");

    await fillField(page, "rendaMensalBruta", "8.000,00");
    await fillField(page, "valorImovel", "400.000,00");
    await page.getByRole("button", { name: "Simular MCMV" }).click();

    await expect(page.getByTestId("financiamento-mcmv-program")).toContainText("Faixa 3");
    await expect(page.getByTestId("financiamento-mcmv-selected-rate")).toContainText("8,16%");
    await expect(page.getByText("Valor dentro do limite nacional", { exact: false }).first()).toBeVisible();

    await fillField(page, "rendaMensalBruta", "4.500,00");
    await fillField(page, "valorImovel", "280.000,00");
    await fillField(page, "subsidioInformado", "65.000,00");
    await page.getByRole("button", { name: "Simular MCMV" }).click();

    await expect(page.getByText("Valor acima da faixa nacional", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Subsídio informado acima do teto público", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("financiamento-mcmv-total-user-paid")).toContainText("R$ 420.317,47");
    await expect(page.getByTestId("financiamento-mcmv-total-resources-applied")).toContainText("R$ 485.317,47");
    await expect(page.getByTestId("financiamento-mcmv-total-resources-applied")).toContainText("R$ 65.000,00");
    await expectNoHorizontalOverflow(page);
  });

  test("calculates a manual Price fixture", async ({ page }) => {
    await page.goto("/calculadoras/financiamento-minha-casa-minha-vida");

    await fillField(page, "valorImovel", "10.000,00");
    await fillField(page, "entradaRecursosProprios", "0,00");
    await fillField(page, "fgtsEntrada", "0,00");
    await fillField(page, "subsidioInformado", "0,00");
    await fillField(page, "prazoMeses", "10");
    await page.getByRole("checkbox", { name: /Usar taxa nominal da tabela MCMV/ }).uncheck();
    await fillField(page, "taxaNominalAnualManual", "8");
    await page.locator("#metodo-price").filter({ visible: true }).first().click();
    await page.getByRole("button", { name: "Simular MCMV" }).click();

    await expectResults(page, [
      "Resumo do financiamento Minha Casa Minha Vida",
      "R$ 10.000,00",
      "R$ 1.037,03",
      "R$ 370,34",
      "Taxa manual usada",
    ]);
    await expectNoHorizontalOverflow(page);
  });

  test("works on a mobile viewport without document overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/financiamento-minha-casa-minha-vida");

    await submitDefaultMcmv(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto(
      "/en/calculadoras/financiamento-minha-casa-minha-vida?sv=2026-07-03&rb=4500&rg=sseco&ct=0&ti=n&vi=250000&ll=0&en=20000&fg=0&sd=0&pm=360&mt=sac&uo=1&cmp=1"
    );
    let main = page.getByRole("main");
    await expect(page.getByRole("heading", { name: "Minha Casa Minha Vida Financing Simulator", exact: true })).toBeVisible();
    await expect(main.getByTestId("financiamento-mcmv-selected-rate")).toBeVisible();
    await expect(main.getByText("Minha Casa Minha Vida financing summary", { exact: false })).toBeVisible();
    await expect(main.getByText("Rules 2026-07-03", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Share" })).toBeVisible();
    await main.getByRole("checkbox", { name: /Use MCMV table nominal rate/ }).uncheck();
    await expect(visibleFieldById(page, "taxaNominalAnualManual")).toHaveAttribute("placeholder", "8,00");
    await expectNoHorizontalOverflow(page);

    await page.goto(
      "/es/calculadoras/financiamento-minha-casa-minha-vida?sv=2026-07-03&rb=4500&rg=sseco&ct=0&ti=n&vi=250000&ll=0&en=20000&fg=0&sd=0&pm=360&mt=sac&uo=1&cmp=1"
    );
    main = page.getByRole("main");
    await expect(
      page.getByRole("heading", { name: "Simulador de financiamiento Minha Casa Minha Vida", exact: true })
    ).toBeVisible();
    await expect(main.getByTestId("financiamento-mcmv-selected-rate")).toBeVisible();
    await expect(main.getByText("Resumen del financiamiento Minha Casa Minha Vida", { exact: false })).toBeVisible();
    await expect(main.getByText("Reglas 2026-07-03", { exact: false }).first()).toBeVisible();
    await expect(main.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(main.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
