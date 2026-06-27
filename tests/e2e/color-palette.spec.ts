import { expect, test, type Page } from "@playwright/test";

function collectPageIssues(page: Page) {
  const issues: string[] = [];

  page.on("console", (message) => {
    const text = message.text();

    if (message.type() === "error") {
      if (text.includes("ClientFetchError: Failed to fetch") && text.includes("https://errors.authjs.dev#autherror")) {
        return;
      }

      issues.push(`console: ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  return issues;
}

function visibleTestId(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]:visible`);
}

test.describe("color palette generator", () => {
  test("restores query state and updates palette settings", async ({ page }) => {
    const pageIssues = collectPageIssues(page);

    await page.goto("/cores/paleta-cores?cor=2f80ed&modo=complementar&quantidade=6");

    await expect(page.getByRole("heading", { name: "Gerador de Paleta de Cores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("color-palette-hex-input")).toHaveValue("#2F80ED");
    await expect(page.getByTestId("color-palette-color-input")).toHaveValue("#2f80ed");
    await expect(page.getByTestId("color-palette-summary")).toContainText("#2F80ED");
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(6);
    await expect(page).toHaveURL(/cor=2F80ED/);
    await expect(page).toHaveURL(/modo=complementar/);
    await expect(page).toHaveURL(/quantidade=6/);

    const hexInput = page.getByTestId("color-palette-hex-input");
    await hexInput.fill("");
    await hexInput.pressSequentially("#2F80ED");
    await expect(hexInput).toHaveValue("#2F80ED");
    await expect(page.getByTestId("color-palette-summary")).toContainText("#2F80ED");
    await expect(page).toHaveURL(/cor=2F80ED/);

    await hexInput.fill("");
    await hexInput.pressSequentially("#abc");
    await expect(hexInput).toHaveValue("#abc");
    await page.getByRole("heading", { name: "Gerador de Paleta de Cores", level: 1 }).click();
    await expect(hexInput).toHaveValue("#AABBCC");
    await expect(page.getByTestId("color-palette-summary")).toContainText("#AABBCC");
    await expect(page).toHaveURL(/cor=AABBCC/);

    await hexInput.fill("abc");
    await hexInput.press("Enter");
    await expect(hexInput).toHaveValue("#AABBCC");
    await expect(page.getByTestId("color-palette-summary")).toContainText("#AABBCC");
    await expect(page).toHaveURL(/cor=AABBCC/);

    await page.getByTestId("color-palette-color-input").fill("#445566");
    await expect(hexInput).toHaveValue("#445566");
    await expect(page.getByTestId("color-palette-summary")).toContainText("#445566");
    await expect(page).toHaveURL(/cor=445566/);

    await page.getByTestId("color-palette-random").click();
    await expect(hexInput).toHaveValue(/^#[0-9A-F]{6}$/);
    const randomSeed = await hexInput.inputValue();
    await expect(page.getByTestId("color-palette-color-input")).toHaveValue(randomSeed.toLowerCase());
    await expect(page.getByTestId("color-palette-summary")).toContainText(randomSeed);
    await expect(page).toHaveURL(new RegExp(`cor=${randomSeed.slice(1)}`));

    await page.getByTestId("color-palette-mode-triadica").click();
    await expect(page).toHaveURL(/modo=triadica/);
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(6);

    await page.getByTestId("color-palette-quantity").click();
    await page.getByRole("option", { name: "4 cores" }).click();
    await expect(page).toHaveURL(/quantidade=4/);
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(4);

    await hexInput.fill("zzzzzz");
    await expect(page.getByText("Digite uma cor HEX válida")).toBeVisible();
    expect(page.url()).not.toContain("zzzzzz");
    await expect(page.getByTestId("color-palette-summary")).toContainText(randomSeed);
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(4);
    expect(pageIssues).toEqual([]);
  });

  test("copies palette formats and shares only safe query params", async ({ page }) => {
    const pageIssues = collectPageIssues(page);

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/cores/paleta-cores?cor=112233&modo=analogica&quantidade=3&unsafe=rgb#secret");
    await expect(page).toHaveURL(/\/cores\/paleta-cores\?cor=112233&modo=analogica&quantidade=3$/);

    const firstHexCopy = visibleTestId(page, "color-palette-copy-hex-1");
    await expect(firstHexCopy).toHaveCount(1);
    await firstHexCopy.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("#112233");

    await visibleTestId(page, "color-palette-copy-all-hex").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("#112233");

    await visibleTestId(page, "color-palette-copy-css").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("--color-1: #112233;");

    await visibleTestId(page, "color-palette-copy-rgb-1").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("rgb(17, 34, 51)");

    await visibleTestId(page, "color-palette-copy-hsl-1").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/^hsl\(\d{1,3}, \d{1,3}%, \d{1,3}%\)$/);

    await page.locator("button:visible", { hasText: "Compartilhar" }).click();
    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    const parsedShareUrl = new URL(shareUrl);

    expect(shareUrl).toContain("/cores/paleta-cores?");
    expect(shareUrl).toContain("cor=112233");
    expect(shareUrl).toContain("modo=analogica");
    expect(shareUrl).toContain("quantidade=3");
    expect(shareUrl).not.toContain("rgb(");
    expect(shareUrl).not.toContain("--color");
    expect(Array.from(parsedShareUrl.searchParams.keys()).sort()).toEqual(["cor", "modo", "quantidade"]);
    expect(parsedShareUrl.hash).toBe("");

    await page.goto(`${parsedShareUrl.pathname}${parsedShareUrl.search}`);
    await expect(page.getByTestId("color-palette-hex-input")).toHaveValue("#112233");
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(3);
    await expect(page.getByTestId("color-palette-summary")).toContainText("#112233");
    expect(pageIssues).toEqual([]);
  });

  test("exposes colors directory and category routes", async ({ page }) => {
    const pageIssues = collectPageIssues(page);

    await page.goto("/cores");

    await expect(page.getByRole("heading", { name: "Cores", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-category-card-paletas-cores")).toBeVisible();
    await expect(page.getByText("Gerador de Paleta de Cores", { exact: true })).toBeVisible();

    await page.getByTestId("tool-category-card-paletas-cores").click();
    await expect(page).toHaveURL(/\/cores\/categorias\/paletas-cores$/);
    await expect(page.getByRole("heading", { name: "Paletas de cores", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Paleta de Cores", { exact: true })).toBeVisible();
    expect(pageIssues).toEqual([]);
  });

  test("loads translated palette routes", async ({ page }) => {
    const pageIssues = collectPageIssues(page);

    for (const route of [
      { path: "/en/cores/paleta-cores?cor=2f80ed&modo=tons&quantidade=3", heading: "Color Palette Generator" },
      { path: "/es/cores/paleta-cores?cor=2f80ed&modo=tons&quantidade=3", heading: "Generador de Paleta de Colores" },
    ]) {
      await page.goto(route.path);

      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
      await expect(page.getByTestId("color-palette-hex-input")).toHaveValue("#2F80ED");
      await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(3);
    }

    expect(pageIssues).toEqual([]);
  });

  test("keeps the palette usable on mobile", async ({ page }) => {
    const pageIssues = collectPageIssues(page);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/cores/paleta-cores?cor=2f80ed&modo=tons&quantidade=8");

    await expect(page.getByRole("heading", { name: "Gerador de Paleta de Cores", level: 1 })).toBeVisible();
    await expect(page.locator('[data-testid^="color-palette-swatch-"]')).toHaveCount(8);
    await expect(visibleTestId(page, "color-palette-copy-hex-1")).toHaveCount(1);

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
    expect(pageIssues).toEqual([]);
  });
});
