import { expect, test } from "@playwright/test";

test.describe("tools hub", () => {
  test("renders the tools hub and family directories", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByRole("heading", { name: "Ferramentas", level: 1 })).toBeVisible();
    await expect(page.getByTestId("tool-family-card-geradores")).toBeVisible();

    await page.getByTestId("tool-family-card-geradores").click();
    await expect(page).toHaveURL(/\/geradores$/);
    await expect(page.getByRole("heading", { name: "Geradores", level: 1 })).toBeVisible();
    await expect(page.getByText("Gerador de Senha", { exact: true })).toBeVisible();
  });

  test("renders seed tool pages with expanded breadcrumbs", async ({ page }) => {
    await page.goto("/validadores/cpf");

    await expect(page.getByRole("heading", { name: "Validador de CPF", level: 1 })).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Validadores" })).toHaveAttribute("href", "/validadores");
    await expect(breadcrumb.getByRole("link", { name: "Documentos" })).toHaveAttribute(
      "href",
      "/validadores/categorias/documentos"
    );

    await page.getByRole("textbox", { name: "CPF" }).fill("52998224725");
    await expect(page.getByText("CPF válido.")).toBeVisible();
  });

  test("keeps shareable URL state for a seed tool", async ({ page }) => {
    await page.goto("/matematica/regra-de-tres");

    await page.getByRole("spinbutton", { name: "A", exact: true }).fill("4");
    await page.getByRole("spinbutton", { name: "B", exact: true }).fill("20");
    await page.getByRole("spinbutton", { name: "C", exact: true }).fill("3");

    await expect(page).toHaveURL(/a=4/);
    await expect(page).toHaveURL(/b=20/);
    await expect(page).toHaveURL(/c=3/);
    await expect(page.getByText("15")).toBeVisible();
  });

  test("renders the QR Code generator and keeps sensitive content out of URLs by default", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/geradores/qr-code");

    await expect(page.getByRole("heading", { name: "Gerador de QR Code", level: 1 })).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Geradores" })).toHaveAttribute("href", "/geradores");
    await expect(breadcrumb.getByRole("link", { name: "Códigos e links" })).toHaveAttribute(
      "href",
      "/geradores/categorias/codigos-links"
    );

    await page.getByLabel("URL").fill("calculaderia.com");
    await expect(page.getByTestId("qr-code-preview-svg")).toBeVisible();
    await expect(page.getByTestId("qr-payload")).toContainText("https://calculaderia.com/");
    await expect(page.getByRole("button", { name: "Copiar conteúdo" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Baixar SVG" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Baixar PNG" })).toBeEnabled();

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("/geradores/qr-code?");
    expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain("calculaderia.com");

    await page.getByTestId("qr-mode-texto").click();
    await page.getByTestId("qr-text-input").fill("Texto livre com acentos, quebra de linha e pontuação.");
    await expect(page.getByTestId("qr-code-preview-svg")).toBeVisible();
    await expect(page.getByTestId("qr-payload")).toContainText("Texto livre com acentos");

    await page.getByTestId("qr-mode-pix").click();
    await page.getByTestId("qr-pix-input").fill("00020126580014br.gov.bcb.pix0136chave-pix-exemplo");
    await expect(page.getByTestId("qr-code-preview-svg")).toBeVisible();
    await expect(page.getByText("Ela não valida destinatário, valor ou pagamento.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copiar conteúdo" })).toBeEnabled();

    await page.getByTestId("qr-mode-wifi").click();
    await page.getByLabel("Nome da rede").fill("Casa");
    await page.getByLabel("Senha").fill("senha-secreta");

    await expect(page.getByTestId("qr-code-preview-svg")).toBeVisible();
    expect(page.url()).not.toContain("senha-secreta");

    await page.getByLabel("Incluir conteúdo no link compartilhado").check();
    await expect(page).toHaveURL(/conteudo=1/);
    await expect(page).toHaveURL(/senha=senha-secreta/);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("senha=senha-secreta");
  });

  test("keeps the QR Code generator usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/geradores/qr-code");

    await page.getByLabel("URL").fill("https://calculaderia.com/ferramentas");
    await expect(page.getByTestId("qr-code-preview-svg")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copiar conteúdo" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Baixar SVG" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Baixar PNG" })).toBeEnabled();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });

  test("lists new routes in the sitemap", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();

    expect(body).toContain("/ferramentas");
    expect(body).toContain("/geradores/senha");
    expect(body).toContain("/geradores/qr-code");
    expect(body).toContain("/validadores/cpf");
    expect(body).toContain("/datas/contador-de-dias");
  });
});
