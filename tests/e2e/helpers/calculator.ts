import { expect, type Page } from "@playwright/test";

export async function fillField(page: Page, id: string, value: string) {
  const field = page.locator(`#${id}`);
  await expect(field).toBeVisible();
  await field.fill(value);
}

export async function expectResults(page: Page, texts: string[]) {
  for (const text of texts) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compartilhar" })).toBeVisible();
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
}
