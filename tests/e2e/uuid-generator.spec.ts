import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const canonicalUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const compactUpperUuidPattern = /^[0-9A-F]{32}$/;
const urnUpperUuidPattern = /^urn:uuid:[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;

async function getUuidValues(page: Page) {
  return page.getByTestId("uuid-result-value").allTextContents();
}

function expectUrlToOmitGeneratedUuids(urlText: string, uuids: string[]) {
  const decoded = decodeURIComponent(urlText);

  for (const uuid of uuids) {
    expect(decoded).not.toContain(uuid);
    expect(decoded).not.toContain(uuid.toLowerCase());
  }
}

async function expectBrowserStateToOmitGeneratedUuids(page: Page, uuids: string[]) {
  const storageEntries = await page.evaluate(() => {
    const readStorage = (storage: Storage, label: string) =>
      Array.from({ length: storage.length }, (_, index) => {
        const key = storage.key(index) ?? "";
        return `${label}:${key}=${storage.getItem(key) ?? ""}`;
      });

    return [...readStorage(window.localStorage, "localStorage"), ...readStorage(window.sessionStorage, "sessionStorage")];
  });

  for (const entry of storageEntries) {
    expectUrlToOmitGeneratedUuids(entry, uuids);
  }
}

async function mockGetRandomValuesFallback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Crypto.prototype, "getRandomValues", {
      configurable: true,
      value: (array: Uint8Array) => {
        for (let index = 0; index < array.length; index += 1) {
          array[index] = index;
        }

        return array;
      },
    });
  });
}

async function mockUnsupportedCrypto(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(Crypto.prototype, "getRandomValues", {
      configurable: true,
      value: undefined,
    });
  });
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

  test("generates, formats, copies, regenerates, and keeps UUIDs out of URLs", async ({ page }) => {
    const requestUrls: string[] = [];
    page.on("request", (request) => requestUrls.push(request.url()));
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/uuid?quantidade=3&formato=padrao&maiusculas=0&uuid=123#uuid=123");

    await expect(page.getByRole("heading", { name: "Gerador de UUID", level: 1 })).toBeVisible();
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(3);
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const canonicalValues = await getUuidValues(page);
    expect(canonicalValues).toHaveLength(3);
    expect(new Set(canonicalValues).size).toBe(3);
    expect(canonicalValues.every((uuid) => canonicalUuidPattern.test(uuid))).toBe(true);

    const liveUrl = new URL(page.url());
    expect(Array.from(liveUrl.searchParams.keys()).sort()).toEqual(["formato", "maiusculas", "quantidade"]);
    expect(liveUrl.searchParams.get("uuid")).toBeNull();
    expectUrlToOmitGeneratedUuids(page.url(), canonicalValues);

    await page.getByTestId("uuid-format-sem-hifens").click();
    await page.getByTestId("uuid-uppercase").check();
    const compactValues = await getUuidValues(page);
    expect(compactValues).toHaveLength(3);
    expect(compactValues.every((uuid) => compactUpperUuidPattern.test(uuid))).toBe(true);

    await page.getByTestId("uuid-copy-one-0").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(compactValues[0]);

    await page.getByTestId("uuid-copy-all").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(compactValues.join("\n"));

    await page.getByTestId("uuid-share-button").getByRole("button").click();
    const shareUrlText = await page.evaluate(() => navigator.clipboard.readText());
    const shareUrl = new URL(shareUrlText);
    expect(shareUrl.pathname).toBe("/geradores/uuid");
    expect(Array.from(shareUrl.searchParams.keys()).sort()).toEqual(["formato", "maiusculas", "quantidade"]);
    expect(shareUrl.searchParams.get("quantidade")).toBe("3");
    expect(shareUrl.searchParams.get("formato")).toBe("sem-hifens");
    expect(shareUrl.searchParams.get("maiusculas")).toBe("1");
    expect(shareUrl.hash).toBe("");
    expectUrlToOmitGeneratedUuids(shareUrlText, compactValues);

    await page.getByTestId("uuid-generate").click();
    await expect.poll(async () => (await getUuidValues(page)).join("\n")).not.toBe(compactValues.join("\n"));
    const regeneratedValues = await getUuidValues(page);
    const generatedRepresentations = [...canonicalValues, ...compactValues, ...regeneratedValues];

    for (const requestUrl of requestUrls) {
      expectUrlToOmitGeneratedUuids(requestUrl, generatedRepresentations);
    }

    await expectBrowserStateToOmitGeneratedUuids(page, generatedRepresentations);
    await expect(page.getByRole("button", { name: /salvar|guardar|save/i })).toHaveCount(0);
    expect(requestUrls.some((requestUrl) => new URL(requestUrl).pathname.startsWith("/api/favorites"))).toBe(false);
  });

  test("uses getRandomValues fallback when randomUUID is unavailable", async ({ page }) => {
    await mockGetRandomValuesFallback(page);
    await page.goto("/geradores/uuid?quantidade=1&formato=padrao&maiusculas=0");

    await expect(page.getByTestId("uuid-unsupported")).toHaveCount(0);
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(1);
    await expect(page.getByTestId("uuid-result-value")).toHaveText("00010203-0405-4607-8809-0a0b0c0d0e0f");
  });

  test("shows unsupported-browser UI when Web Crypto UUID generation is unavailable", async ({ page }) => {
    await mockUnsupportedCrypto(page);
    await page.goto("/geradores/uuid?quantidade=1");

    await expect(page.getByTestId("uuid-unsupported")).toBeVisible();
    await expect(page.getByTestId("uuid-result-list")).toHaveCount(0);
    await expect
      .poll(() =>
        page
          .getByTestId("uuid-copy-all")
          .evaluateAll(
            (buttons) => buttons.length > 0 && buttons.every((button) => (button as HTMLButtonElement).disabled)
          )
      )
      .toBe(true);
    await expect
      .poll(() =>
        page
          .getByTestId("uuid-generate")
          .evaluateAll(
            (buttons) => buttons.length > 0 && buttons.every((button) => (button as HTMLButtonElement).disabled)
          )
      )
      .toBe(true);
  });

  test("clamps quantity and shared settings create a fresh batch", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/uuid?quantidade=250&formato=urn&maiusculas=1");

    const countInput = page.locator('[data-testid="uuid-count"]:visible');
    await expect(countInput).toHaveValue("100");
    await expect(page.locator('[data-testid="uuid-count-warning"]:visible')).toHaveCount(1);
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(100);
    const clampedValues = await getUuidValues(page);
    expect(clampedValues.every((uuid) => urnUpperUuidPattern.test(uuid))).toBe(true);

    await countInput.fill("2");
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(2);
    const firstBatch = await getUuidValues(page);

    await page.getByTestId("uuid-share-button").getByRole("button").click();
    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expectUrlToOmitGeneratedUuids(shareUrl, firstBatch);

    await page.goto(shareUrl);
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(2);
    const secondBatch = await getUuidValues(page);
    expect(secondBatch).not.toEqual(firstBatch);
    expect(secondBatch.every((uuid) => urnUpperUuidPattern.test(uuid))).toBe(true);
  });

  test("is discoverable from generator listings and sitemap", async ({ page }) => {
    await page.goto("/geradores");
    await expect(page.getByText("Gerador de UUID", { exact: true })).toBeVisible();

    await page.goto("/geradores/categorias/codigos-links");
    await expect(page.getByText("Gerador de UUID", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/geradores/uuid");
    expect(body).toContain("/en/geradores/uuid");
    expect(body).toContain("/es/geradores/uuid");
  });

  test("renders locale smoke routes and stays usable on mobile", async ({ page }) => {
    await page.goto("/en/geradores/uuid?quantidade=1");
    await expect(page.getByRole("heading", { name: "UUID Generator", level: 1 })).toBeVisible();
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(1);

    await page.goto("/es/geradores/uuid?quantidade=1");
    await expect(page.getByRole("heading", { name: "Generador de UUID", level: 1 })).toBeVisible();
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(1);

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/geradores/uuid?quantidade=5&formato=urn&maiusculas=1");
    await expect(page.getByTestId("uuid-result-list").locator("li")).toHaveCount(5);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
