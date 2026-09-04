import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, fillField, visibleFieldById } from "./helpers/calculator";

const pageIssues = new WeakMap<Page, string[]>();
const officialDataRequests = new WeakMap<Page, string[]>();

function monitorPageIssues(page: Page) {
  const issues: string[] = [];
  const sourceRequests: string[] = [];
  pageIssues.set(page, issues);
  officialDataRequests.set(page, sourceRequests);
  page.on("console", (message) => message.type() === "error" && issues.push(`console: ${message.text()}`));
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    const hostname = new URL(request.url()).hostname;
    if (hostname.endsWith("bcb.gov.br") || hostname.endsWith("fgv.br")) {
      sourceRequests.push(request.url());
    }
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

async function expectDefaultResult(page: Page) {
  await expect(page.getByRole("heading", { name: "Calculadora IGP-M: atualize o valor pago por um imóvel" })).toBeVisible();
  await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
  await expect(page.getByTestId("correcao-igpm-accumulated-percent")).toContainText("58,9880%");
  await expect(page.getByTestId("correcao-igpm-factor")).toContainText("1.58988002");
  await expect(page.getByText("80 meses", { exact: true })).toBeVisible();
  await expect(page.getByTestId("correcao-igpm-source-badge")).toContainText("28655");
  await expect(page.getByTestId("correcao-igpm-source-badge")).toContainText("agosto de 2026");
  await expect(page.getByTestId("correcao-igpm-disclaimer")).toContainText("não avaliação de mercado");
}

test.describe("IGP-M correction calculator", () => {
  test.beforeEach(async ({ page }) => {
    monitorPageIssues(page);
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test.afterEach(async ({ page }) => {
    expect(unexpectedPageIssues(pageIssues.get(page) ?? [])).toEqual([]);
    expect(officialDataRequests.get(page) ?? []).toEqual([]);
  });

  test("shows the official default result, shares it, and preserves the save callback", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/correcao-igpm");
    await expectDefaultResult(page);
    const yearlyTable = page.getByTestId("correcao-igpm-yearly-table");
    await expect(yearlyTable).toBeVisible();
    await expect(yearlyTable.getByRole("table")).toBeVisible();
    await expect(yearlyTable.getByRole("columnheader", { name: "Ano" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Metodologia da Calculadora do Cidadão" })).toHaveAttribute(
      "href",
      /www3\.bcb\.gov\.br\/CALCIDADAO/
    );
    await expect(page.getByRole("link", { name: "BCB SGS série 28655" })).toHaveAttribute(
      "href",
      /api\.bcb\.gov\.br\/dados\/serie\/bcdata\.sgs\.28655/
    );
    await expect(page.getByRole("link", { name: "Metodologia IGP-M da FGV" })).toHaveAttribute(
      "href",
      /portalibre\.fgv\.br\/metodologia\/metodologia-igp-m-1/
    );
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08");

    const restored = await context.newPage();
    const restoredIssues = monitorPageIssues(restored);
    await restored.goto(sharedUrl);
    await expect(restored.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
    await expect(visibleFieldById(restored, "valorOriginal")).toHaveValue("500.000,00");
    await expect(visibleFieldById(restored, "mesInicial")).toHaveValue("2020-01");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);
    expect(officialDataRequests.get(restored) ?? []).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const callbackUrl = new URL(page.url()).searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08");
  });

  test("calculates a same-month deflation fixture and rejects a forged pre-Real link", async ({ page }) => {
    await page.goto("/calculadoras/correcao-igpm?sv=1&v=100000&i=2026-08&f=2026-08");
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 99.775,14");
    await expect(page.getByTestId("correcao-igpm-accumulated-percent")).toContainText("-0,2249%");
    await expect(page.getByText("1 mês", { exact: true })).toBeVisible();
    await expect(page.getByTestId("correcao-igpm-period")).toContainText("com os dois meses incluídos");

    await page.goto("/calculadoras/correcao-igpm?sv=1&v=100000&i=1994-06&f=2026-08");
    await expect(page.getByTestId("correcao-igpm-invalid-link-warning")).toBeVisible();
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
    await expect(visibleFieldById(page, "mesInicial")).toHaveValue("2020-01");
  });

  test("preserves an older ending month and updates only after the explicit action", async ({ page }) => {
    await page.goto("/calculadoras/correcao-igpm?sv=1&v=100000&i=2025-09&f=2026-07");
    await expect(page.getByTestId("correcao-igpm-stale-data-action")).toBeVisible();
    await expect(visibleFieldById(page, "mesFinal")).toHaveValue("2026-07");
    await page.getByTestId("correcao-igpm-stale-data-action").click();
    await expect(page.getByTestId("correcao-igpm-stale-data-action")).toHaveCount(0);
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 102.160,88");
  });

  test("recalculates a custom source fixture", async ({ page }) => {
    await page.goto("/calculadoras/correcao-igpm");
    await fillField(page, "valorOriginal", "100.000,00");
    await fillField(page, "mesInicial", "2025-09");
    await page.getByText("Escolher outro mês final", { exact: true }).click();
    await fillField(page, "mesFinal", "2026-08");
    await page.getByRole("button", { name: "Calcular correção pelo IGP-M" }).click();
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 102.160,88");
    await expect(page.getByText("12 meses", { exact: true })).toBeVisible();
  });

  test("reset clears invalid unsubmitted drafts and restores every default field", async ({ page }) => {
    await page.goto("/calculadoras/correcao-igpm");
    await expect(page.getByTestId("correcao-igpm-latest-month-badge")).toContainText("agosto de 2026");

    await fillField(page, "valorOriginal", "0,00");
    await fillField(page, "mesInicial", "2025-09");
    await page.getByText("Escolher outro mês final", { exact: true }).click();
    await fillField(page, "mesFinal", "2026-07");
    await page.getByRole("button", { name: "Calcular correção pelo IGP-M" }).click();
    const validationError = page.getByText("Informe um valor entre R$ 0,01 e R$ 1 trilhão.", { exact: true });
    await expect(validationError).toBeVisible();

    await page.getByRole("button", { name: "Restaurar exemplo" }).click();
    await expect(visibleFieldById(page, "valorOriginal")).toHaveValue("500.000,00");
    await expect(visibleFieldById(page, "mesInicial")).toHaveValue("2020-01");
    await expect(page.locator("#mesFinal")).toHaveValue("2026-08");
    await expect(validationError).toHaveCount(0);
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
  });

  test("retains Brazilian IGP-M and BRL context in English and Spanish", async ({ page }) => {
    await page.goto("/en/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08");
    await expect(page.getByRole("heading", { name: "IGP-M Correction Calculator: Update a Property Purchase Price" })).toBeVisible();
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
    await expect(page.getByTestId("correcao-igpm-disclaimer")).toContainText("not a market appraisal");
    await expect(page.getByTestId("correcao-igpm-latest-month-badge")).toContainText("August 2026");
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/correcao-igpm?sv=1&v=500000&i=2020-01&f=2026-08");
    await expect(page.getByRole("heading", { name: "Calculadora de corrección IGP-M: actualiza el precio de compra de un inmueble" })).toBeVisible();
    await expect(page.getByTestId("correcao-igpm-corrected-value")).toContainText("R$ 794.940,01");
    await expect(page.getByTestId("correcao-igpm-disclaimer")).toContainText("no tasación de mercado");
    await expect(page.getByTestId("correcao-igpm-latest-month-badge")).toContainText("agosto de 2026");
  });

  test("has no horizontal overflow at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/correcao-igpm");
    await expectDefaultResult(page);
    await expectNoHorizontalOverflow(page);
  });
});
