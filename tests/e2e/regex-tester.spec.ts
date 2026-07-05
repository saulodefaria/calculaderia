import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      flags: url.searchParams.get("flags"),
      limit: url.searchParams.get("limite"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchPattern: url.searchParams.get("padrao"),
      searchText: url.searchParams.get("texto"),
      hashContentFlag: hashParams.get("conteudo"),
      hashPattern: hashParams.get("padrao"),
      hashText: hashParams.get("texto"),
    };
  } catch {
    return null;
  }
}

test.describe("regex tester", () => {
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

  test("shows matches, groups, safe live URL, and explicit hash sharing", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Regex Tester", level: 1 })).toBeVisible();
    await expect(main.getByTestId("regex-tester-pattern")).toBeVisible();
    await expect(main.getByText("O padrão e o texto são processados no navegador.")).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Expressões regulares", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/expressoes-regulares"
    );

    const pattern = "(\\w+)@(\\w+\\.\\w+)";
    const text = "ana@example.com\nbeto@test.dev";

    await main.getByTestId("regex-tester-pattern").fill(pattern);
    await main.getByTestId("regex-tester-text").fill(text);
    await expect(main.getByTestId("regex-tester-status")).toContainText("Matches encontrados");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("ana@example.com");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("example.com");

    let url = new URL(page.url());
    expect(url.searchParams.get("flags")).toBe("g");
    expect(url.searchParams.get("limite")).toBe("100");
    expect(url.searchParams.get("padrao")).toBeNull();
    expect(url.searchParams.get("texto")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();

    const shareButton = main.getByTestId("regex-tester-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/regex-tester",
      flags: "g",
      limit: "100",
      searchContentFlag: null,
      searchPattern: null,
      searchText: null,
      hashContentFlag: null,
      hashPattern: null,
      hashText: null,
    });

    await main.getByTestId("regex-tester-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("padrao")).toBeNull();
    expect(url.searchParams.get("texto")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/regex-tester",
      flags: "g",
      limit: "100",
      searchContentFlag: null,
      searchPattern: null,
      searchText: null,
      hashContentFlag: "1",
      hashPattern: pattern,
      hashText: text,
    });

    await main.getByTestId("regex-tester-copy-first").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("ana@example.com");
  });

  test("handles case-insensitive matching and invalid patterns", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await main.getByTestId("regex-tester-pattern").fill("abc");
    await main.getByTestId("regex-tester-text").fill("ABC");
    await expect(main.getByTestId("regex-tester-status")).toContainText("Sem matches");

    await main.getByTestId("regex-tester-flag-i").click();
    await expect(main.getByTestId("regex-tester-status")).toContainText("Matches encontrados");
    await expect(main.getByTestId("regex-tester-highlight-preview")).toContainText("ABC");

    await main.getByTestId("regex-tester-pattern").fill("(");
    await expect(main.getByTestId("regex-tester-status")).toContainText("Padrão inválido");
    await expect(main.getByTestId("regex-tester-error")).toContainText("O padrão não compila");
    await main.getByTestId("regex-tester-copy-error").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("RegExp JavaScript");

    const url = new URL(page.url());
    expect(url.searchParams.get("padrao")).toBeNull();
    expect(url.searchParams.get("texto")).toBeNull();
  });

  test("loads a valid built-in example", async ({ page }) => {
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await main.getByTestId("regex-tester-load-example").click();

    await expect(main.getByTestId("regex-tester-pattern")).toHaveValue("(\\w+)@(\\w+\\.\\w+)");
    await expect(main.getByTestId("regex-tester-status")).toContainText("Matches encontrados");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("ana@example.com");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("beto@test.dev");
    await expect(main.getByTestId("regex-tester-error")).toHaveCount(0);
  });

  test("shows d flag indices in match and group details", async ({ page }) => {
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await main.getByTestId("regex-tester-flag-d").click();
    await main.getByTestId("regex-tester-pattern").fill("(?<word>\\w+)-(\\d+)");
    await main.getByTestId("regex-tester-text").fill("abc-123");

    await expect(main.getByTestId("regex-tester-status")).toContainText("Matches encontrados");
    const firstMatch = main.getByTestId("regex-tester-match-1");
    await expect(firstMatch).toContainText("A flag d expôs índices para este match.");
    await expect(firstMatch.getByTestId("regex-tester-numbered-groups")).toContainText("0-3");
    await expect(firstMatch.getByTestId("regex-tester-numbered-groups")).toContainText("4-7");
    await expect(firstMatch.getByTestId("regex-tester-named-groups")).toContainText("word");
    await expect(firstMatch.getByTestId("regex-tester-named-groups")).toContainText("0-3");
  });

  test("shows the risky-pattern warning without using a hanging sample", async ({ page }) => {
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await main.getByTestId("regex-tester-pattern").fill("(a+)+$");
    await main.getByTestId("regex-tester-text").fill("aaaaab");

    await expect(main.getByTestId("regex-tester-warning-possibleReDoS")).toBeVisible();
    await expect(main.getByTestId("regex-tester-warning-possibleReDoS")).toContainText("Possível backtracking caro");
    await expect(main.getByTestId("regex-tester-status")).toContainText("Sem matches");
  });

  test("recovers from a timed out worker without stale timeout results", async ({ page }) => {
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");
    const status = main.getByTestId("regex-tester-status");
    const patternInput = main.getByTestId("regex-tester-pattern");
    const textInput = main.getByTestId("regex-tester-text");

    await patternInput.fill("(a+)+$");
    await textInput.fill(`${"a".repeat(28)}!`);

    await expect(status).toContainText("Execução interrompida", { timeout: 5_000 });

    await patternInput.fill("b+");
    await textInput.fill("bbb");

    await expect(status).toContainText("Matches encontrados");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("bbb");

    await page.waitForTimeout(1_200);
    await expect(status).toContainText("Matches encontrados");
    await expect(status).not.toContainText("Execução interrompida");
    await expect(main.getByTestId("regex-tester-match-list")).toContainText("bbb");
  });

  test("prefills shared content and sanitizes the live URL after hydration", async ({ page }) => {
    const pattern = "abc";
    const text = "ABC";

    await page.goto(
      `/dev/regex-tester?flags=gi&limite=25#conteudo=1&padrao=${encodeURIComponent(
        pattern
      )}&texto=${encodeURIComponent(text)}`
    );
    const main = page.getByRole("main");

    await expect(main.getByTestId("regex-tester-pattern")).toHaveValue(pattern);
    await expect(main.getByTestId("regex-tester-text")).toHaveValue(text);
    await expect(main.getByTestId("regex-tester-status")).toContainText("Matches encontrados");
    await expect.poll(() => new URL(page.url()).searchParams.get("padrao")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("texto")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("flags")).toBe("gi");
    expect(url.searchParams.get("limite")).toBe("25");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("lists the dev family, regex category, route, and sitemap entries", async ({ page }) => {
    await page.goto("/dev");

    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("Regex Tester", { exact: true })).toBeVisible();

    await page.goto("/dev/categorias/expressoes-regulares");
    await expect(page.getByRole("heading", { name: "Expressões regulares", level: 1 })).toBeVisible();
    await expect(page.getByText("Regex Tester", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/regex-tester");
    expect(body).toContain("/dev/categorias/expressoes-regulares");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/regex-tester"));

    expect(toolPaths).toEqual(["/dev/regex-tester", "/en/dev/regex-tester", "/es/dev/regex-tester"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/regex-tester");
    const main = page.getByRole("main");

    await main.getByTestId("regex-tester-pattern").fill("(verylongword)+");
    await main.getByTestId("regex-tester-text").fill("verylongword".repeat(80));
    await expect(main.getByTestId("regex-tester-highlight-preview")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
