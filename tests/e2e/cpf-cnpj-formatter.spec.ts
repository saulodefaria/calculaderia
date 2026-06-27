import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();

function isKnownAuthConsoleNoise(message: string) {
  return message.includes("ClientFetchError: Failed to fetch") && message.includes("errors.authjs.dev#autherror");
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    return {
      pathname: url.pathname,
      type: url.searchParams.get("tipo"),
      output: url.searchParams.get("saida"),
      searchContentFlag: url.searchParams.get("conteudo"),
      searchInput: url.searchParams.get("entrada"),
      hashContentFlag: hashParams.get("conteudo"),
      hashInput: hashParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

test.describe("CPF and CNPJ formatter", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    browserIssuesByPage.set(page, browserIssues);

    page.on("console", (message) => {
      if (message.type() === "error") {
        const text = message.text();
        if (!isKnownAuthConsoleNoise(text)) {
          browserIssues.push(`console error: ${text}`);
        }
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
  });

  test("formats CPF, copies outputs, shares safely, and keeps content out of the live URL", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/formatador-cpf-cnpj");
    const main = page.getByRole("main");

    await expect(page.getByRole("heading", { name: "Formatador de CPF e CNPJ", level: 1 })).toBeVisible();
    await expect(main.getByTestId("cpf-cnpj-formatter-input")).toBeVisible();
    await expect(
      main.getByText("A formatação acontece no navegador. O documento não entra na URL por padrão.")
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Documentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/documentos"
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Sobre o formatador de CPF e CNPJ" })).toBeVisible();

    await main.getByTestId("cpf-cnpj-formatter-input").fill("52998224725");
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Completo");
    await expect(main.getByTestId("cpf-cnpj-formatter-detected-type")).toContainText("CPF");
    await expect(main.getByTestId("cpf-cnpj-formatter-masked-output")).toContainText("529.982.247-25");
    await expect(main.getByTestId("cpf-cnpj-formatter-raw-output")).toContainText("52998224725");

    let url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("auto");
    expect(url.searchParams.get("saida")).toBe("mascara");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    const shareButton = main.getByTestId("cpf-cnpj-formatter-share-button").getByRole("button");
    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/formatador-cpf-cnpj",
      type: "auto",
      output: "mascara",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: null,
      hashInput: null,
    });

    await main.getByTestId("cpf-cnpj-formatter-include-content").check();
    url = new URL(page.url());
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.searchParams.get("conteudo")).toBeNull();
    expect(url.hash).toBe("");

    await shareButton.click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/formatador-cpf-cnpj",
      type: "auto",
      output: "mascara",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: "52998224725",
    });

    await main.getByTestId("cpf-cnpj-formatter-copy-masked").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("529.982.247-25");
    await main.getByTestId("cpf-cnpj-formatter-copy-raw").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("52998224725");

    await main.getByTestId("cpf-cnpj-formatter-clear").click();
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Aguardando documento");
  });

  test("omits noisy explicit content from default auto share URLs", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/formatador-cpf-cnpj");
    const main = page.getByRole("main");

    await main.getByTestId("cpf-cnpj-formatter-input").fill("52998224725 @ Maria");
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("cpf-cnpj-formatter-detected-type")).toContainText("CNPJ");

    let url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("auto");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");

    await main.getByTestId("cpf-cnpj-formatter-include-content").check();
    await main.getByTestId("cpf-cnpj-formatter-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/formatador-cpf-cnpj",
      type: "auto",
      output: "mascara",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: null,
    });

    await page.goto(
      `/validadores/formatador-cpf-cnpj#conteudo=1&entrada=${encodeURIComponent("52998224725 @ Maria")}`
    );
    await expect(page.getByTestId("cpf-cnpj-formatter-input")).toHaveValue("");
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("auto");
    expect(url.searchParams.get("entrada")).toBeNull();
  });

  test("formats numeric and alphanumeric CNPJ and warns about final letters", async ({ page }) => {
    await page.goto("/validadores/formatador-cpf-cnpj");
    const main = page.getByRole("main");
    const input = main.getByTestId("cpf-cnpj-formatter-input");

    await input.fill("04.252.011/0001-10");
    await expect(main.getByTestId("cpf-cnpj-formatter-detected-type")).toContainText("CNPJ");
    await expect(main.getByTestId("cpf-cnpj-formatter-masked-output")).toContainText("04.252.011/0001-10");
    await expect(main.getByTestId("cpf-cnpj-formatter-raw-output")).toContainText("04252011000110");

    await input.fill("ab12cd34efgh56");
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Completo");
    await expect(main.getByTestId("cpf-cnpj-formatter-masked-output")).toContainText("AB.12C.D34/EFGH-56");
    await expect(main.getByTestId("cpf-cnpj-formatter-raw-output")).toContainText("AB12CD34EFGH56");

    await input.fill("ab12cd34efghij");
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("cpf-cnpj-formatter-issues")).toContainText(
      "As duas últimas posições do CNPJ devem ser numéricas"
    );
  });

  test("supports forced type modes and reports unsupported characters", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/validadores/formatador-cpf-cnpj");
    const main = page.getByRole("main");

    await main.getByTestId("cpf-cnpj-formatter-type-cpf").click();
    await main.getByTestId("cpf-cnpj-formatter-input").fill("abc 529.982.247-25 @");
    await expect(main.getByTestId("cpf-cnpj-formatter-status")).toContainText("Requer atenção");
    await expect(main.getByTestId("cpf-cnpj-formatter-detected-type")).toContainText("CPF");
    await expect(main.getByTestId("cpf-cnpj-formatter-issues")).toContainText("CPF aceita apenas números");
    await expect(main.getByTestId("cpf-cnpj-formatter-issues")).toContainText("Caracteres não aceitos: @");

    const url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("cpf");
    expect(url.searchParams.get("saida")).toBe("mascara");
    expect(url.searchParams.get("entrada")).toBeNull();

    await main.getByTestId("cpf-cnpj-formatter-include-content").check();
    await main.getByTestId("cpf-cnpj-formatter-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/validadores/formatador-cpf-cnpj",
      type: "cpf",
      output: "mascara",
      searchContentFlag: null,
      searchInput: null,
      hashContentFlag: "1",
      hashInput: "52998224725",
    });
  });

  test("prefills canonical explicit shared content and sanitizes the live URL after hydration", async ({ page }) => {
    const noisyCpf = "abc 529.982.247-25 @ Maria";
    await page.goto(
      `/validadores/formatador-cpf-cnpj?tipo=cpf&saida=mascara#conteudo=1&entrada=${encodeURIComponent(noisyCpf)}`
    );
    let main = page.getByRole("main");

    await expect(main.getByTestId("cpf-cnpj-formatter-input")).toHaveValue("52998224725");
    await expect(main.getByTestId("cpf-cnpj-formatter-detected-type")).toContainText("CPF");
    await expect(main.getByTestId("cpf-cnpj-formatter-masked-output")).toContainText("529.982.247-25");
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    let url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("cpf");
    expect(url.searchParams.get("saida")).toBe("mascara");

    const shared = "ab12cd34efghij56 @ matriz";
    await page.goto(
      `/validadores/formatador-cpf-cnpj?tipo=cnpj&saida=limpar#conteudo=1&entrada=${encodeURIComponent(shared)}`
    );
    main = page.getByRole("main");

    await expect(main.getByTestId("cpf-cnpj-formatter-input")).toHaveValue("AB12CD34EFGH56");
    await expect(main.getByTestId("cpf-cnpj-formatter-primary-output")).toContainText("AB12CD34EFGH56");
    await expect.poll(() => new URL(page.url()).searchParams.get("entrada")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("conteudo")).toBeNull();
    await expect.poll(() => new URL(page.url()).hash).toBe("");

    url = new URL(page.url());
    expect(url.searchParams.get("tipo")).toBe("cnpj");
    expect(url.searchParams.get("saida")).toBe("limpar");
  });

  test("lists the validator family, document category, route, and sitemap entries", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByTestId("tool-family-card-validadores")).toBeVisible();
    await page.getByTestId("tool-family-card-validadores").click();
    await expect(page).toHaveURL(/\/validadores$/);
    await expect(page.getByRole("heading", { name: "Validadores", level: 1 })).toBeVisible();
    await expect(page.getByText("Formatador de CPF e CNPJ", { exact: true })).toBeVisible();

    await page.goto("/validadores/categorias/documentos");
    await expect(page.getByRole("heading", { name: "Documentos", level: 1 })).toBeVisible();
    await expect(page.getByText("Formatador de CPF e CNPJ", { exact: true })).toBeVisible();

    await page.goto("/validadores/formatador-cpf-cnpj");
    await page.getByTestId("cpf-cnpj-formatter-related-cpf").click();
    await page.waitForURL("**/validadores/cpf");
    await expect(page.getByRole("heading", { name: "Validador de CPF", level: 1 })).toBeVisible();

    await page.goto("/validadores/formatador-cpf-cnpj");
    await page.getByTestId("cpf-cnpj-formatter-related-cnpj").click();
    await page.waitForURL("**/validadores/cnpj");
    await expect(page.getByRole("heading", { name: "Validador de CNPJ", level: 1 })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/validadores/formatador-cpf-cnpj");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/validadores/formatador-cpf-cnpj"));

    expect(toolPaths).toEqual([
      "/validadores/formatador-cpf-cnpj",
      "/en/validadores/formatador-cpf-cnpj",
      "/es/validadores/formatador-cpf-cnpj",
    ]);
  });

  test("loads EN and ES routes and stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.goto("/en/validadores/formatador-cpf-cnpj");
    await expect(page.getByRole("heading", { name: "CPF and CNPJ Formatter", level: 1 })).toBeVisible();

    await page.goto("/es/validadores/formatador-cpf-cnpj");
    await expect(page.getByRole("heading", { name: "Formateador de CPF y CNPJ", level: 1 })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/validadores/formatador-cpf-cnpj");
    await page.getByTestId("cpf-cnpj-formatter-input").fill(`${"AB12CD34EFGH56".repeat(12)}@@@@`);
    await expect(page.getByTestId("cpf-cnpj-formatter-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
