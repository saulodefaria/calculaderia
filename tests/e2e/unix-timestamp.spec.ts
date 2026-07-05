import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);

    return {
      pathname: url.pathname,
      mode: url.searchParams.get("modo"),
      unit: url.searchParams.get("u"),
      timestamp: url.searchParams.get("ts"),
      date: url.searchParams.get("data"),
      time: url.searchParams.get("hora"),
      zone: url.searchParams.get("zona"),
    };
  } catch {
    return null;
  }
}

async function waitForUnixTimestampHydration(page: Page) {
  await expect.poll(() => new URL(page.url()).searchParams.get("modo")).toBe("timestamp");
}

function getVisibleTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

function padDatePart(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatUtcFields(milliseconds: number) {
  const date = new Date(milliseconds);

  return {
    date: `${padDatePart(date.getUTCFullYear(), 4)}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(
      date.getUTCDate()
    )}`,
    time: `${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}:${padDatePart(
      date.getUTCSeconds()
    )}.000`,
  };
}

async function formatBrowserLocalFields(page: Page, milliseconds: number) {
  return page.evaluate((value) => {
    const date = new Date(value);
    const pad = (part: number, length = 2) => String(part).padStart(length, "0");

    return {
      date: `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000`,
    };
  }, milliseconds);
}

async function readUseNowState(page: Page) {
  const isoText = await getVisibleTestId(page, "unix-timestamp-result-iso").locator("p").last().innerText();
  const milliseconds = Date.parse(isoText);

  return {
    date: await getVisibleTestId(page, "unix-timestamp-date-input").inputValue(),
    time: await getVisibleTestId(page, "unix-timestamp-time-input").inputValue(),
    isoText,
    milliseconds,
  };
}

test.describe("unix timestamp converter", () => {
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

  test("converts Unix timestamp values and shares normalized state", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/datas/unix-timestamp");
    await waitForUnixTimestampHydration(page);

    await expect(page.getByRole("heading", { name: "Conversor Timestamp Unix", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "unix-timestamp-input")).toBeVisible();
    await expect(page.getByText("A conversão acontece no navegador.").filter({ visible: true })).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Datas", exact: true })).toHaveAttribute("href", "/datas");
    await expect(breadcrumb.getByRole("link", { name: "Datas e períodos", exact: true })).toHaveAttribute(
      "href",
      "/datas/categorias/datas-periodos"
    );

    await getVisibleTestId(page, "unix-timestamp-input").fill("0");
    await expect(getVisibleTestId(page, "unix-timestamp-result-iso")).toContainText("1970-01-01T00:00:00.000Z");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("timestamp");
    expect(url.searchParams.get("u")).toBe("s");
    expect(url.searchParams.get("ts")).toBe("0");

    await getVisibleTestId(page, "unix-timestamp-input").fill("1700000000.123");
    await expect(getVisibleTestId(page, "unix-timestamp-result-milliseconds")).toContainText("1700000000123");

    await getVisibleTestId(page, "unix-timestamp-unit-ms").click();
    await expect(getVisibleTestId(page, "unix-timestamp-input")).toHaveValue("1700000000123");
    await expect(getVisibleTestId(page, "unix-timestamp-result-seconds")).toContainText("1700000000.123");

    await getVisibleTestId(page, "unix-timestamp-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/datas/unix-timestamp",
      mode: "timestamp",
      unit: "ms",
      timestamp: "1700000000123",
      date: null,
      time: null,
      zone: null,
    });

    const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    const restoredPage = await context.newPage();
    await restoredPage.goto(sharedUrl);
    await expect(getVisibleTestId(restoredPage, "unix-timestamp-input")).toHaveValue("1700000000123");
    await expect(getVisibleTestId(restoredPage, "unix-timestamp-result-iso")).toContainText("2023-11-14T22:13:20.123Z");
    await restoredPage.close();

    await getVisibleTestId(page, "unix-timestamp-copy-summary").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("1700000000.123");
  });

  test("converts UTC date input, warns for local interpretation, and validates errors", async ({ page }) => {
    await page.goto("/datas/unix-timestamp");
    await waitForUnixTimestampHydration(page);

    await getVisibleTestId(page, "unix-timestamp-mode-data").click();
    await getVisibleTestId(page, "unix-timestamp-date-input").fill("1970-01-01");
    await getVisibleTestId(page, "unix-timestamp-time-input").fill("00:00:00.000");
    await getVisibleTestId(page, "unix-timestamp-zone-utc").click();

    await expect(getVisibleTestId(page, "unix-timestamp-result-seconds")).toContainText("0");
    await expect(getVisibleTestId(page, "unix-timestamp-result-iso")).toContainText("1970-01-01T00:00:00.000Z");

    let url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("data");
    expect(url.searchParams.get("data")).toBe("1970-01-01");
    expect(url.searchParams.get("hora")).toBe("00:00:00.000");
    expect(url.searchParams.get("zona")).toBe("utc");

    await getVisibleTestId(page, "unix-timestamp-date-input").fill("0000-01-01");
    await expect(getVisibleTestId(page, "unix-timestamp-date-input")).toHaveValue("0000-01-01");
    await expect(getVisibleTestId(page, "unix-timestamp-result-iso")).toContainText("0000-01-01T00:00:00.000Z");
    await expect.poll(() => new URL(page.url()).searchParams.get("data")).toBe("0000-01-01");

    await getVisibleTestId(page, "unix-timestamp-zone-local").click();
    await expect(getVisibleTestId(page, "unix-timestamp-share-warning")).toContainText("fuso local");

    await getVisibleTestId(page, "unix-timestamp-time-input").fill("24:00");
    await expect(getVisibleTestId(page, "unix-timestamp-status")).toContainText("Entrada inválida");
    await expect(getVisibleTestId(page, "unix-timestamp-diagnostics")).toContainText("HH:mm");

    url = new URL(page.url());
    expect(url.searchParams.get("hora")).toBeNull();
  });

  test.describe("with a non-UTC browser timezone", () => {
    test.use({ timezoneId: "America/Sao_Paulo" });

    test("fills date-mode Use now from the active zone and converts local wall time", async ({ page }) => {
      await page.goto("/datas/unix-timestamp");
      await waitForUnixTimestampHydration(page);

      await getVisibleTestId(page, "unix-timestamp-mode-data").click();
      await getVisibleTestId(page, "unix-timestamp-date-input").fill("2000-01-01");
      await getVisibleTestId(page, "unix-timestamp-time-input").fill("00:00:00.000");
      await getVisibleTestId(page, "unix-timestamp-zone-utc").click();
      const utcBeforeClick = Math.floor((await page.evaluate(() => Date.now())) / 1000) * 1000;
      await getVisibleTestId(page, "unix-timestamp-use-now").click();
      const utcAfterClick = Math.floor((await page.evaluate(() => Date.now())) / 1000) * 1000;
      const utcState = await readUseNowState(page);
      const expectedUtcFields = formatUtcFields(utcState.milliseconds);

      expect(utcState.milliseconds).toBeGreaterThanOrEqual(utcBeforeClick);
      expect(utcState.milliseconds).toBeLessThanOrEqual(utcAfterClick);
      expect(utcState).toMatchObject(expectedUtcFields);
      expect(utcState.isoText).toMatch(/\.\d{3}Z$/);

      await getVisibleTestId(page, "unix-timestamp-date-input").fill("2000-01-01");
      await getVisibleTestId(page, "unix-timestamp-time-input").fill("00:00:00.000");
      await getVisibleTestId(page, "unix-timestamp-zone-local").click();

      await getVisibleTestId(page, "unix-timestamp-date-input").fill("2024-01-01");
      await getVisibleTestId(page, "unix-timestamp-time-input").fill("23:03:04.000");
      await expect(getVisibleTestId(page, "unix-timestamp-result-iso")).toContainText("2024-01-02T02:03:04.000Z");
      await expect(getVisibleTestId(page, "unix-timestamp-timezone")).toContainText("America/Sao_Paulo");

      const localBeforeClick = Math.floor((await page.evaluate(() => Date.now())) / 1000) * 1000;
      await getVisibleTestId(page, "unix-timestamp-use-now").click();
      const localAfterClick = Math.floor((await page.evaluate(() => Date.now())) / 1000) * 1000;
      const localState = await readUseNowState(page);
      const expectedLocalFields = await formatBrowserLocalFields(page, localState.milliseconds);

      expect(localState.milliseconds).toBeGreaterThanOrEqual(localBeforeClick);
      expect(localState.milliseconds).toBeLessThanOrEqual(localAfterClick);
      expect(localState).toMatchObject(expectedLocalFields);
      await expect.poll(() => new URL(page.url()).searchParams.get("zona")).toBe("local");
      await expect.poll(() => new URL(page.url()).searchParams.get("data")).toBe(localState.date);
      await expect.poll(() => new URL(page.url()).searchParams.get("hora")).toBe(localState.time);
    });
  });

  test("lists the route in date directories and sitemap", async ({ page }) => {
    await page.goto("/datas");

    await expect(page.getByRole("heading", { name: "Datas", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor Timestamp Unix", { exact: true })).toBeVisible();

    await page.goto("/datas/categorias/datas-periodos");
    await expect(page.getByRole("heading", { name: "Datas e períodos", level: 1 })).toBeVisible();
    await expect(page.getByText("Conversor Timestamp Unix", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/datas/unix-timestamp");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/datas/unix-timestamp"));

    expect(toolPaths).toEqual([
      "/datas/unix-timestamp",
      "/en/datas/unix-timestamp",
      "/es/datas/unix-timestamp",
    ]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/datas/unix-timestamp");
    await waitForUnixTimestampHydration(page);

    await getVisibleTestId(page, "unix-timestamp-input").fill("1700000000.123");
    await expect(getVisibleTestId(page, "unix-timestamp-result-iso")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
