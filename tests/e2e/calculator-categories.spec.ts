import { expect, test } from "@playwright/test";

test.describe("calculator categories", () => {
  test("shows visible categories on the homepage without future-only categories", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("home-category-card-financiamento-credito")).toBeVisible();
    await expect(page.getByTestId("home-category-card-investimentos-rendimentos")).toBeVisible();
    await expect(page.getByTestId("home-category-card-trabalho-salario-beneficios")).toBeVisible();
    await expect(page.getByTestId("home-category-card-moradia-patrimonio")).toBeVisible();
    await expect(page.getByTestId("home-category-card-impostos-governo")).toHaveCount(0);
  });

  test("renders calculator directory and category pages", async ({ page }) => {
    await page.goto("/calculadoras");

    await expect(page.locator("main").getByRole("heading", { name: "Calculadoras", level: 1 })).toBeVisible();
    await expect(page.getByTestId("calculator-category-card-financiamento-credito")).toBeVisible();
    await expect(page.getByTestId("calculator-category-card-impostos-governo")).toHaveCount(0);

    await page.getByTestId("calculator-category-card-financiamento-credito").click();

    await expect(page).toHaveURL(/\/calculadoras\/categorias\/financiamento-credito$/);
    await expect(page.getByRole("heading", { name: "Financiamento e crédito" })).toBeVisible();
    await expect(page.locator("main").getByText("Calculadora de Financiamento", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("Financiamento vs Consórcio", { exact: true })).toBeVisible();
  });

  test("opens the desktop calculators dropdown and links to the directory", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Calculadoras" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Todas as calculadoras" })).toBeVisible();
    await expect(menu.getByText("Investimentos e rendimentos", { exact: true })).toBeVisible();

    await menu.getByRole("menuitem", { name: "Todas as calculadoras" }).click();
    await expect(page).toHaveURL(/\/calculadoras$/);
  });

  test("groups calculator links in the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Abrir menu" }).click();

    const mobileMenu = page.getByRole("dialog");
    await expect(mobileMenu.getByRole("link", { name: "Todas as calculadoras" })).toBeVisible();
    await expect(mobileMenu.getByText("Trabalho, salário e benefícios", { exact: true })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Calculadora de Rescisão Trabalhista" })).toBeVisible();
  });

  test("shows category-aware breadcrumbs on calculator pages", async ({ page }) => {
    await page.goto("/calculadoras/financiamento");

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByRole("link", { name: "Calculadoras" })).toHaveAttribute("href", "/calculadoras");
    await expect(breadcrumb.getByRole("link", { name: "Financiamento e crédito" })).toHaveAttribute(
      "href",
      "/calculadoras/categorias/financiamento-credito"
    );
    await expect(breadcrumb.getByText("Calculadora de Financiamento", { exact: true })).toBeVisible();
  });
});
