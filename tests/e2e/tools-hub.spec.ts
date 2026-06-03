import { expect, test } from "@playwright/test";

test.describe("tools hub", () => {
  test("renders the tools hub and family directories", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByRole("heading", { name: "Ferramentas", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-family-card-geradores")).toBeVisible();

    await page.getByTestId("tool-family-card-geradores").click();
    await expect(page).toHaveURL(/\/geradores$/);
    await expect(page.getByRole("heading", { name: "Geradores", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Senha", { exact: true })).toBeVisible();
  });

  test("renders seed tool pages with expanded breadcrumbs", async ({ page }) => {
    await page.goto("/validadores/cpf");

    await expect(page.getByRole("heading", { name: "Validador de CPF", level: 1 })).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Documentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/documentos"
    );

    await page.getByRole("textbox", { name: "CPF" }).fill("52998224725");
    await expect(page.getByText("CPF válido.")).toBeVisible();
  });

  test("keeps shareable URL state for a seed tool", async ({ page }) => {
    await page.goto("/matematica/regra-de-tres");

    await page.getByRole("spinbutton", { name: "A", exact: true }).fill("4");
    await page.getByRole("spinbutton", { name: "B", exact: true }).fill("20");
    await page.getByRole("spinbutton", { name: "C", exact: true }).fill("3");

    await expect(page).toHaveURL(/a=4/);
    await expect(page).toHaveURL(/b=20/);
    await expect(page).toHaveURL(/c=3/);
    await expect(page.getByText("15")).toBeVisible();
  });

  test("lists new routes in the sitemap", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();

    expect(body).toContain("/ferramentas");
    expect(body).toContain("/geradores/senha");
    expect(body).toContain("/validadores/cpf");
    expect(body).toContain("/datas/contador-de-dias");
  });
});
