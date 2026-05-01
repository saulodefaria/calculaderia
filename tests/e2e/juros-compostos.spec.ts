import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow, expectResults, fillField } from "./helpers/calculator";

async function submitCompoundInterest(page: Page) {
  await fillField(page, "valorInicial", "10.000,00");
  await fillField(page, "taxaJuros", "1");
  await fillField(page, "aportes", "500,00");
  await fillField(page, "quantidadePeriodos", "24");
  await page.getByRole("button", { name: "Calcular Juros Compostos" }).click();
  await expectResults(page, ["Resumo do Investimento", "Valor Final"]);
}

test.describe("juros compostos calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("submits, shares, restores, and prompts sign-in when saving", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/calculadoras/juros-compostos");

    await submitCompoundInterest(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByRole("button", { name: "Copiado!" })).toBeVisible();

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(sharedUrl).toContain("/calculadoras/juros-compostos?");
    expect(sharedUrl).toContain("vi=10000");
    expect(sharedUrl).toContain("qp=24");

    const restoredPage = await context.newPage();
    await restoredPage.goto(sharedUrl);
    await expectResults(restoredPage, ["Resumo do Investimento", "Valor Final"]);
    await expect(restoredPage.locator("#valorInicial")).toHaveValue("10.000,00");

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/entrar\?callbackUrl=/);
    await expect(page.getByText("Entre para salvar favoritos", { exact: true })).toBeVisible();
  });

  test("works on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculadoras/juros-compostos");

    await submitCompoundInterest(page);
    await expectNoHorizontalOverflow(page);
  });
});
