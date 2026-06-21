import { expect, test } from "@playwright/test";

test.describe("calculator categories", () => {
  test("shows visible tool families on the homepage", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("home-tool-family-card-calculadoras")).toBeVisible();
    await expect(page.getByTestId("home-tool-family-card-geradores")).toBeVisible();
    await expect(page.getByTestId("home-tool-family-card-validadores")).toBeVisible();
    await expect(page.getByTestId("home-tool-family-card-matematica")).toBeVisible();
    await expect(page.getByTestId("home-tool-family-card-datas")).toBeVisible();
  });

  test("renders calculator directory and category pages", async ({ page }) => {
    await page.goto("/calculadoras");

    await expect(page.locator("main").getByRole("heading", { name: "Calculadoras", level: 1 })).toBeVisible();
    await expect(page.getByTestId("calculator-category-card-financiamento-credito")).toBeVisible();
    await expect(page.getByTestId("calculator-category-card-impostos-governo")).toBeVisible();

    await page.getByTestId("calculator-category-card-financiamento-credito").click();

    await expect(page).toHaveURL(/\/calculadoras\/categorias\/financiamento-credito$/);
    await expect(page.getByRole("heading", { name: "Financiamento e crédito" })).toBeVisible();
    await expect(page.locator("main").getByText("Calculadora de Financiamento", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("Financiamento vs Consórcio", { exact: true })).toBeVisible();

    await page.goto("/calculadoras");
    await page.getByTestId("calculator-category-card-impostos-governo").click();

    await expect(page).toHaveURL(/\/calculadoras\/categorias\/impostos-governo$/);
    await expect(page.getByRole("heading", { name: "Impostos e governo" })).toBeVisible();
    await expect(page.locator("main").getByText("Calculadora de Salário Líquido", { exact: true })).toBeVisible();
  });

  test("opens the desktop tools dropdown and links to the tools hub", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ferramentas" }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Todas as ferramentas" })).toBeVisible();
    await expect(menu.getByText("Geradores", { exact: true })).toBeVisible();

    await menu.getByRole("menuitem", { name: "Todas as ferramentas" }).click();
    await expect(page).toHaveURL(/\/ferramentas$/);
  });

  test("groups tool links in the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Abrir menu" }).click();

    const mobileMenu = page.getByRole("dialog");
    await expect(mobileMenu.getByRole("link", { name: "Todas as ferramentas" })).toBeVisible();
    await expect(mobileMenu.getByText("Calculadoras", { exact: true })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Calculadora de Rescisão Trabalhista" })).toBeVisible();
  });

  test("shows category-aware breadcrumbs on calculator pages", async ({ page }) => {
    await page.goto("/calculadoras/financiamento");

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Calculadoras" })).toHaveAttribute("href", "/calculadoras");
    await expect(breadcrumb.getByRole("link", { name: "Financiamento e crédito" })).toHaveAttribute(
      "href",
      "/calculadoras/categorias/financiamento-credito"
    );
    await expect(breadcrumb.getByText("Calculadora de Financiamento", { exact: true })).toBeVisible();
  });
});
