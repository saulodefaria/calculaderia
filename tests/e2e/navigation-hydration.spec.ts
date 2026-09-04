import { expect, test } from "@playwright/test";

for (const slug of ["validador-email", "validador-pis-pasep"]) {
  test(`navigates away from ${slug} while the tool is hydrating`, async ({ page, context }) => {
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    await page.goto(`/validadores/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Validadores", exact: true }).click();

    await expect(page).toHaveURL(/\/validadores$/);
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
  });
}
