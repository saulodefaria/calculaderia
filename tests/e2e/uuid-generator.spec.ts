import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const canonicalUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const compactUpperUuidPattern = /^[0-9A-F]{12}4[0-9A-F]{3}[89AB][0-9A-F]{15}$/;
const urnUpperUuidPattern = /^URN:UUID:[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;

function byTestId(page: Page, testId: string) {
  return page.getByTestId(testId);
}

function resultRows(page: Page) {
  return byTestId(page, "uuid-generator-results").getByTestId("uuid-generator-result-row");
}

async function expectUniqueUuidControls(page: Page) {
  for (const testId of [
    "uuid-generator-quantity",
    "uuid-generator-format-padrao",
    "uuid-generator-format-sem-hifens",
    "uuid-generator-format-urn",
    "uuid-generator-uppercase",
    "uuid-generator-generate",
    "uuid-generator-clear",
    "uuid-generator-share",
    "uuid-generator-results",
    "uuid-generator-copy-all",
  ]) {
    await expect(page.getByTestId(testId)).toHaveCount(1);
  }
}

async function getGeneratedValues(page: Page) {
  await expect(resultRows(page).first()).toBeVisible();
  return resultRows(page).locator("[data-testid^='uuid-generator-value-']").allTextContents();
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    return {
      pathname: url.pathname,
      quantity: url.searchParams.get("quantidade"),
      format: url.searchParams.get("formato"),
      uppercase: url.searchParams.get("maiusculas"),
      uuid: url.searchParams.get("uuid"),
      result: url.searchParams.get("resultado"),
      hash: url.hash,
    };
  } catch {
    return null;
  }
}

function expectLiveUrlToOmitGeneratedValues(page: Page, values: string[]) {
  const url = new URL(page.url());

  expect(url.searchParams.get("uuid")).toBeNull();
  expect(url.searchParams.get("resultado")).toBeNull();
  expect(url.searchParams.get("resultados")).toBeNull();
  expect(url.hash).toBe("");

  const decodedUrl = decodeURIComponent(page.url());
  for (const value of values) {
    expect(decodedUrl).not.toContain(value);
  }
}

test.describe("uuid generator", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error") {
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("loads, generates UUIDv4 values, regenerates fresh values, and keeps results out of the URL", async ({
    page,
  }) => {
    await page.goto("/geradores/uuid");

    await expect(page.getByRole("heading", { name: "Gerador de UUID", level: 1 })).toBeVisible();
    await expectUniqueUuidControls(page);
    await expect(byTestId(page, "uuid-generator-quantity")).toHaveValue("1");
    await expect(
      page.getByText("A geração acontece no navegador com Web Crypto.", { exact: false })
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Geradores" })).toHaveAttribute("href", "/geradores");
    await expect(breadcrumb.getByRole("link", { name: "Códigos e links" })).toHaveAttribute(
      "href",
      "/geradores/categorias/codigos-links"
    );

    const firstValues = await getGeneratedValues(page);
    expect(firstValues).toHaveLength(1);
    expect(firstValues[0]).toMatch(canonicalUuidPattern);
    expectLiveUrlToOmitGeneratedValues(page, firstValues);

    await byTestId(page, "uuid-generator-generate").click();
    await expect
      .poll(async () => (await getGeneratedValues(page))[0])
      .not.toBe(firstValues[0]);
    const regeneratedValues = await getGeneratedValues(page);
    expect(regeneratedValues[0]).toMatch(canonicalUuidPattern);
    expectLiveUrlToOmitGeneratedValues(page, regeneratedValues);
  });

  test("supports bulk generation, format transforms, copy actions, and settings-only sharing", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/uuid?quantidade=3&formato=sem-hifens&maiusculas=1");

    await expectUniqueUuidControls(page);
    await expect(byTestId(page, "uuid-generator-quantity")).toHaveValue("3");
    await expect(byTestId(page, "uuid-generator-format-sem-hifens")).toHaveAttribute("data-state", "active");
    await expect(byTestId(page, "uuid-generator-uppercase")).toBeChecked();

    const compactValues = await getGeneratedValues(page);
    expect(compactValues).toHaveLength(3);
    for (const value of compactValues) {
      expect(value).toMatch(compactUpperUuidPattern);
    }
    expectLiveUrlToOmitGeneratedValues(page, compactValues);

    await byTestId(page, "uuid-generator-copy-one-0").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(compactValues[0]);

    await byTestId(page, "uuid-generator-copy-all").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(compactValues.join("\n"));

    await byTestId(page, "uuid-generator-share").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/geradores/uuid",
      quantity: "3",
      format: "sem-hifens",
      uppercase: "1",
      uuid: null,
      result: null,
      hash: "",
    });

    await byTestId(page, "uuid-generator-format-urn").click();
    const urnValues = await getGeneratedValues(page);
    expect(urnValues).toHaveLength(3);
    for (const value of urnValues) {
      expect(value).toMatch(urnUpperUuidPattern);
    }
    expectLiveUrlToOmitGeneratedValues(page, urnValues);

    await page.reload();
    const reloadedValues = await getGeneratedValues(page);
    expect(reloadedValues).toHaveLength(3);
    expect(reloadedValues).not.toEqual(urnValues);
    for (const value of reloadedValues) {
      expect(value).toMatch(urnUpperUuidPattern);
    }
  });

  test("caps oversized bulk requests", async ({ page }) => {
    await page.goto("/geradores/uuid?quantidade=999");

    await expectUniqueUuidControls(page);
    await expect(byTestId(page, "uuid-generator-quantity")).toHaveValue("500");
    await expect(byTestId(page, "uuid-generator-capped-warning")).toContainText(
      "A quantidade foi limitada a 500 UUIDs por geração."
    );
    await expect(byTestId(page, "uuid-generator-stat-count")).toContainText("500");
    await expect(resultRows(page)).toHaveCount(500);

    const url = new URL(page.url());
    expect(url.searchParams.get("quantidade")).toBe("500");
    expect(url.searchParams.get("uuid")).toBeNull();
    expect(url.hash).toBe("");
  });

  test("shows an unsupported-browser state when Web Crypto UUID sources are unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(Crypto.prototype, "randomUUID", {
          configurable: true,
          value: undefined,
        });
      } catch {
        // Browser compatibility fallback for the test setup.
      }

      try {
        Object.defineProperty(Crypto.prototype, "getRandomValues", {
          configurable: true,
          value: undefined,
        });
      } catch {
        // Browser compatibility fallback for the test setup.
      }
    });

    await page.goto("/geradores/uuid");

    await expectUniqueUuidControls(page);
    await expect(byTestId(page, "uuid-generator-unsupported")).toContainText("Web Crypto indisponível");
    await expect(byTestId(page, "uuid-generator-results")).toContainText(
      "Este navegador não oferece Web Crypto para gerar UUIDs com segurança."
    );
    await expect(byTestId(page, "uuid-generator-copy-all")).toBeDisabled();
  });

  test("is discoverable through directories and sitemap", async ({ page }) => {
    await page.goto("/geradores");

    await expect(page.getByRole("heading", { name: "Geradores", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de UUID", { exact: true })).toBeVisible();

    await page.goto("/geradores/categorias/codigos-links");
    await expect(page.getByRole("heading", { name: "Códigos e links", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de UUID", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    const uuidPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/geradores/uuid"));

    expect(uuidPaths).toEqual(["/geradores/uuid", "/en/geradores/uuid", "/es/geradores/uuid"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/geradores/uuid?quantidade=2&formato=urn&maiusculas=1");

    await expectUniqueUuidControls(page);
    const values = await getGeneratedValues(page);
    expect(values).toHaveLength(2);
    for (const value of values) {
      expect(value).toMatch(urnUpperUuidPattern);
    }

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
