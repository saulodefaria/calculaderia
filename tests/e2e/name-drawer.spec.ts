import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      mode: url.searchParams.get("modo"),
      quantity: url.searchParams.get("quantidade"),
      separator: url.searchParams.get("separador"),
      noRepeat: url.searchParams.get("semRepetir"),
      removeDuplicates: url.searchParams.get("removerDuplicados"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchNames: url.searchParams.get("nomes"),
      hashContentFlag: hashParams.get("conteudo"),
      hashNames: hashParams.get("nomes"),
    };
  } catch {
    return null;
  }
}

function expectLiveUrlToOmitPrivateContent(page: Page, names: string[]) {
  const liveUrl = new URL(page.url());

  expect(liveUrl.searchParams.get("nomes")).toBeNull();
  expect(liveUrl.searchParams.get("conteudo")).toBeNull();
  expect(liveUrl.searchParams.get("resultado")).toBeNull();
  expect(liveUrl.searchParams.get("resultados")).toBeNull();
  expect(liveUrl.searchParams.get("vencedores")).toBeNull();
  expect(liveUrl.hash).toBe("");

  const decodedUrl = decodeURIComponent(page.url());
  for (const name of names) {
    expect(decodedUrl).not.toContain(name);
  }
}

function getVisibleTestId(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

test.describe("name drawer", () => {
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

  test("draws winners, handles duplicates, copies results, and keeps names out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/sorteador-nomes?quantidade=5");

    await expect(page.getByRole("heading", { name: "Sorteador de Nomes", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "name-drawer-input")).toBeVisible();
    await expect(page.getByText("O sorteio acontece no navegador.").filter({ visible: true })).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Geradores" })).toHaveAttribute("href", "/geradores");
    await expect(breadcrumb.getByRole("link", { name: "Aleatórios" })).toHaveAttribute(
      "href",
      "/geradores/categorias/aleatorios"
    );

    await getVisibleTestId(page, "name-drawer-input").fill("Ana\n\nBruno\nAna\nCarla");
    await expect(getVisibleTestId(page, "name-drawer-stat-valid")).toContainText("4");
    await expect(getVisibleTestId(page, "name-drawer-stat-unique")).toContainText("3");
    await expect(getVisibleTestId(page, "name-drawer-stat-ignored")).toContainText("1");
    await expect(getVisibleTestId(page, "name-drawer-validation")).toContainText("Lista pronta");
    await expect(page.getByText("duplicatas contam como chances extras", { exact: false }).filter({ visible: true })).toBeVisible();

    await getVisibleTestId(page, "name-drawer-draw").click();
    await expect(getVisibleTestId(page, "name-drawer-results").locator("li")).toHaveCount(4);
    await expect(page.getByText("A quantidade foi limitada", { exact: false }).filter({ visible: true })).toBeVisible();

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("nomes")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await getVisibleTestId(page, "name-drawer-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Resultado do sorteio");

    await getVisibleTestId(page, "name-drawer-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/geradores/sorteador-nomes",
      mode: "vencedores",
      quantity: "5",
      separator: "linhas",
      noRepeat: "1",
      removeDuplicates: "0",
      searchContentFlag: null,
      searchNames: null,
      hashContentFlag: null,
      hashNames: null,
    });

    await getVisibleTestId(page, "name-drawer-remove-duplicates").check();
    await expect(getVisibleTestId(page, "name-drawer-stat-selected")).toContainText("3");
    await getVisibleTestId(page, "name-drawer-draw").click();
    await expect(getVisibleTestId(page, "name-drawer-results").locator("li")).toHaveCount(3);
  });

  test("shuffles, copies the shuffled list, and draws with replacement without URL leakage", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const names = ["Ana", "Bruno", "Carla"];

    await page.goto("/geradores/sorteador-nomes?quantidade=2");
    await getVisibleTestId(page, "name-drawer-input").fill(names.join("\n"));
    expectLiveUrlToOmitPrivateContent(page, names);

    await getVisibleTestId(page, "name-drawer-mode-embaralhar").click();
    await expect(getVisibleTestId(page, "name-drawer-stat-mode")).toContainText("Embaralhar lista");
    await expect(getVisibleTestId(page, "name-drawer-quantity")).toBeDisabled();
    expectLiveUrlToOmitPrivateContent(page, names);

    await getVisibleTestId(page, "name-drawer-draw").click();
    const shuffledItems = getVisibleTestId(page, "name-drawer-results").locator("li");
    await expect(shuffledItems).toHaveCount(names.length);
    for (const name of names) {
      await expect(getVisibleTestId(page, "name-drawer-results")).toContainText(name);
    }
    expectLiveUrlToOmitPrivateContent(page, names);

    await getVisibleTestId(page, "name-drawer-copy-result").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Lista embaralhada");
    const copiedShuffle = await page.evaluate(() => navigator.clipboard.readText());
    for (const name of names) {
      expect(copiedShuffle).toContain(name);
    }

    await getVisibleTestId(page, "name-drawer-mode-vencedores").click();
    await expect(getVisibleTestId(page, "name-drawer-quantity")).toBeEnabled();
    await getVisibleTestId(page, "name-drawer-quantity").fill("5");
    await getVisibleTestId(page, "name-drawer-no-repeat").uncheck();
    await expect(getVisibleTestId(page, "name-drawer-stat-selected")).toContainText("5");
    expectLiveUrlToOmitPrivateContent(page, names);

    await getVisibleTestId(page, "name-drawer-draw").click();
    const replacementItems = getVisibleTestId(page, "name-drawer-results").locator("li");
    await expect(replacementItems).toHaveCount(5);
    await expect(page.getByText("A quantidade foi limitada", { exact: false }).filter({ visible: true })).not.toBeVisible();

    const replacementNames = await replacementItems.locator("span[title]").allTextContents();
    expect(replacementNames).toHaveLength(5);
    expect(replacementNames.every((name) => names.includes(name))).toBe(true);
    expect(new Set(replacementNames).size).toBeLessThan(replacementNames.length);
    expectLiveUrlToOmitPrivateContent(page, names);
  });

  test("shares names only through an explicit fragment and does not mutate the address bar", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/sorteador-nomes?modo=vencedores&quantidade=2");

    await getVisibleTestId(page, "name-drawer-input").fill("Ana\nBruno\nCarla");
    await getVisibleTestId(page, "name-drawer-include-content").check();
    await expect(getVisibleTestId(page, "name-drawer-share-warning")).toContainText("expõem a lista");

    const liveUrl = new URL(page.url());
    expect(liveUrl.searchParams.get("nomes")).toBeNull();
    expect(liveUrl.searchParams.get("conteudo")).toBeNull();
    expect(liveUrl.hash).toBe("");

    await getVisibleTestId(page, "name-drawer-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/geradores/sorteador-nomes",
      mode: "vencedores",
      quantity: "2",
      separator: "linhas",
      noRepeat: "1",
      removeDuplicates: "0",
      searchContentFlag: null,
      searchNames: null,
      hashContentFlag: "1",
      hashNames: "Ana\nBruno\nCarla",
    });
  });

  test("prefills names from an explicit content fragment and sanitizes the live URL", async ({ page }) => {
    const names = "Ana\nBruno\nCarla";
    await page.goto(
      `/geradores/sorteador-nomes?modo=vencedores&quantidade=2#conteudo=1&nomes=${encodeURIComponent(names)}`
    );

    await expect(getVisibleTestId(page, "name-drawer-input")).toHaveValue(names);
    await expect.poll(() => new URL(page.url()).searchParams.get("nomes")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    const url = new URL(page.url());
    expect(url.searchParams.get("modo")).toBe("vencedores");
    expect(url.searchParams.get("quantidade")).toBe("2");
    expect(url.searchParams.get("conteudo")).toBeNull();
  });

  test("warns and omits oversized names from explicit content share links", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/sorteador-nomes");

    await getVisibleTestId(page, "name-drawer-input").fill(`Ana\nBruno\n${"Nome Comprido\n".repeat(500)}`);
    await getVisibleTestId(page, "name-drawer-include-content").check();
    await getVisibleTestId(page, "name-drawer-share-button").getByRole("button").click();

    await expect(page.getByText("A lista é grande demais para um link seguro.").filter({ visible: true })).toBeVisible();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/geradores/sorteador-nomes",
      mode: "vencedores",
      quantity: "1",
      separator: "linhas",
      noRepeat: "1",
      removeDuplicates: "0",
      searchContentFlag: null,
      searchNames: null,
      hashContentFlag: "1",
      hashNames: null,
    });
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/geradores/sorteador-nomes");

    await getVisibleTestId(page, "name-drawer-input").fill(
      ["Ana", "Bruno", "Carla", "Participante com nome muito comprido ".repeat(5)].join("\n")
    );
    await getVisibleTestId(page, "name-drawer-draw").click();
    await expect(getVisibleTestId(page, "name-drawer-results")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
