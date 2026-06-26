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

async function submitDefaultCdb(page: Page) {
  await page.getByRole("button", { name: "Calcular CDB" }).click();

  await expectResults(page, ["Resumo do CDB", "R$ 10.825,00", "R$ 825,00", "R$ 1.000,00", "R$ 175,00"]);
  await expect(page.getByText("O CDI atual não é buscado automaticamente", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("FGC tem limites e condições", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("sv=2026-06-26", { exact: false }).first()).toBeVisible();
}

test.describe("cdb calculator", () => {
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

  test("calculates default CDI, shares, restores, and preserves save callback query", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/cdb");

    await submitDefaultCdb(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/cdb?");
    expect(sharedUrl).toContain("sv=2026-06-26");
    expect(sharedUrl).toContain("m=cdi");
    expect(sharedUrl).toContain("v=10000");
    expect(sharedUrl).toContain("dc=365");
    expect(sharedUrl).toContain("du=252");
    expect(sharedUrl).toContain("pc=100");
    expect(sharedUrl).toContain("cdi=10");

    const restoredPage = await context.newPage();
    const restoredIssues = monitorPageIssues(restoredPage);
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do CDB", "R$ 10.825,00"]);
    await expect(visibleFieldById(restoredPage, "valorInicial")).toHaveValue("10.000,00");
    await expect(visibleFieldById(restoredPage, "cdiAnual")).toHaveValue("10");
    expect(unexpectedPageIssues(restoredIssues)).toEqual([]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    const signInUrl = new URL(page.url());
    const callbackUrl = signInUrl.searchParams.get("callbackUrl") ?? "";
    expect(callbackUrl).toContain("/calculadoras/cdb?");
    expect(callbackUrl).toContain("sv=2026-06-26");
    expect(callbackUrl).toContain("m=cdi");
    expect(callbackUrl).toContain("cdi=10");
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("calculates pre-fixed and short-term IOF examples", async ({ page }) => {
    await page.goto("/calculadoras/cdb");

    await page.getByRole("button", { name: "Pré-fixado" }).click();
    await page.getByRole("button", { name: "Calcular CDB" }).click();
    await expectResults(page, ["Resumo do CDB", "R$ 10.990,00", "R$ 990,00", "R$ 210,00"]);

    await fillField(page, "prazoDiasCorridos", "10");
    await page.getByRole("button", { name: "Calcular CDB" }).click();
    await expectResults(page, ["Resumo do CDB", "R$ 10.008,31", "R$ 20,81", "R$ 2,41"]);
    await expect(page.getByText("Prazo de até 30 dias pode ter IOF", { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("uses manual business-day overrides in results and shared URLs", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/cdb");

    await page.getByLabel("Informar dias úteis exatos").check();
    await fillField(page, "diasUteis", "240");
    await page.getByRole("button", { name: "Calcular CDB" }).click();

    await expect(page.getByText("240 dias úteis informados", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Dias úteis foram informados manualmente", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("cdb-net-value")).not.toContainText("R$ 10.825,00");

    await page.getByRole("button", { name: "Compartilhar" }).click();
    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("sv=2026-06-26");
    expect(sharedUrl).toContain("du=240");
  });

  for (const sourceUrl of [
    "/calculadoras/cdb?sv=2026-06-25&m=cdi&v=5000&dc=30&du=21&pc=110&cdi=11",
    "/calculadoras/cdb?m=cdi&v=5000&dc=30&du=21&pc=110&cdi=11",
    "/calculadoras/cdb?sv=unsupported&m=cdi&v=5000&dc=30&du=21&pc=110&cdi=11",
  ]) {
    test(`restores defaults and shows warning for stale source URL ${sourceUrl}`, async ({ page }) => {
      await page.goto(sourceUrl);

      await expect(page.getByTestId("cdb-stale-source-warning")).toBeVisible();
      await expect(page.getByText("Premissas de fonte atualizadas", { exact: false })).toBeVisible();
      await expect(page.getByTestId("cdb-net-value")).toContainText("R$ 10.825,00");
      await expect(visibleFieldById(page, "valorInicial")).toHaveValue("10.000,00");
    });
  }

  test("rejects current-source unsupported modes instead of restoring stale defaults", async ({ page }) => {
    await page.goto("/calculadoras/cdb?sv=2026-06-26&m=selic&v=5000&dc=30&du=21");

    await expect(page.getByTestId("cdb-stale-source-warning")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Calcular CDB" })).toBeVisible();
    await expect(page.getByTestId("cdb-net-value")).toHaveCount(0);
  });

  test("works on a mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/cdb");

    await submitDefaultCdb(page);
    await expectNoHorizontalOverflow(page);
  });

  test("loads English and Spanish localized routes", async ({ page }) => {
    await page.goto("/en/calculadoras/cdb?sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10");
    await expect(page.getByRole("heading", { name: "Brazil CDB Calculator" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("cdb-net-value")).toBeVisible();
    await expect(page.getByText("Estimated net value", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/es/calculadoras/cdb?sv=2026-06-26&m=cdi&v=10000&dc=365&du=252&pc=100&cdi=10");
    await expect(page.getByRole("heading", { name: "Calculadora de CDB de Brasil" })).toBeVisible();
    await expect(page.getByRole("main").getByTestId("cdb-net-value")).toBeVisible();
    await expect(page.getByText("Valor neto estimado", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compartir" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
