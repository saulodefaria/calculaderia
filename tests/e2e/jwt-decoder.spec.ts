import { expect, test, type Page } from "@playwright/test";

const browserIssuesByPage = new WeakMap<Page, string[]>();
const requestLeaksByPage = new WeakMap<Page, string[]>();
const favoritesRequestsByPage = new WeakMap<Page, string[]>();

function encodeJsonPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function encodeTextPart(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function compactToken(header: unknown, payload: unknown, signature = "signature"): string {
  return `${encodeJsonPart(header)}.${encodeJsonPart(payload)}.${encodeTextPart(signature)}`;
}

const sensitiveToken = compactToken(
  { alg: "HS256", typ: "JWT", kid: "private-demo-key" },
  {
    iss: "https://issuer.example",
    sub: "sensitive-user-123",
    aud: ["api://private-service"],
    exp: 1893456000,
    iat: 1735689600,
    jti: "secret-jti-456",
  },
  "secret-signature"
);

const sensitiveValues = [
  sensitiveToken,
  "private-demo-key",
  "https://issuer.example",
  "sensitive-user-123",
  "api://private-service",
  "1893456000",
  "1735689600",
  "secret-jti-456",
  "secret-signature",
];

function getVisibleTestId(page: Page, testId: string) {
  return page.getByRole("main").getByTestId(testId).filter({ visible: true });
}

async function getClipboardUrlSnapshot(page: Page) {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  try {
    const url = new URL(clipboardText);

    return {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      token: url.searchParams.get("token"),
      jwt: url.searchParams.get("jwt"),
      entrada: url.searchParams.get("entrada"),
    };
  } catch {
    return null;
  }
}

async function getSensitiveStorageDump(page: Page) {
  return page.evaluate(async () => {
    const indexedDbNames =
      typeof indexedDB.databases === "function" ? (await indexedDB.databases()).map((database) => database.name ?? "") : [];

    return [
      document.cookie,
      ...Object.entries(window.localStorage).flat(),
      ...Object.entries(window.sessionStorage).flat(),
      ...indexedDbNames,
    ].join("\n");
  });
}

test.describe("jwt decoder", () => {
  test.beforeEach(async ({ page }) => {
    const browserIssues: string[] = [];
    const requestLeaks: string[] = [];
    const favoritesRequests: string[] = [];
    browserIssuesByPage.set(page, browserIssues);
    requestLeaksByPage.set(page, requestLeaks);
    favoritesRequestsByPage.set(page, favoritesRequests);

    page.on("console", (message) => {
      if (message.type() === "error") {
        browserIssues.push(`console error: ${message.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      browserIssues.push(`page error: ${error.message}`);
    });

    page.on("request", (request) => {
      const requestSnapshot = `${request.method()} ${request.url()}\n${request.postData() ?? ""}`;
      const leakedValue = sensitiveValues.find((value) => requestSnapshot.includes(value));

      if (leakedValue) {
        requestLeaks.push(`request leaked ${leakedValue}: ${request.method()} ${request.url()}`);
      }

      if (new URL(request.url()).pathname.startsWith("/api/favorites")) {
        favoritesRequests.push(`${request.method()} ${request.url()}`);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    expect(browserIssuesByPage.get(page) ?? []).toEqual([]);
    expect(requestLeaksByPage.get(page) ?? []).toEqual([]);
    expect(favoritesRequestsByPage.get(page) ?? []).toEqual([]);
  });

  test("decodes a pasted JWT, copies outputs, shares route-only, and keeps content out of URL and storage", async ({
    page,
  }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dev/jwt-decoder");

    await expect(page.getByRole("heading", { name: "JWT Decoder", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-token")).toBeVisible();
    await expect(
      page
        .getByText("A decodificação acontece no navegador. Esta ferramenta não envia o token ao servidor")
        .filter({ visible: true })
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Ferramentas" })).toHaveAttribute("href", "/ferramentas");
    await expect(breadcrumb.getByRole("link", { name: "Dev", exact: true })).toHaveAttribute("href", "/dev");
    await expect(breadcrumb.getByRole("link", { name: "Codificação", exact: true })).toHaveAttribute(
      "href",
      "/dev/categorias/codificacao"
    );
    await expect(page.getByRole("main").getByRole("button", { name: /Salvar|Guardar|Save/ })).toHaveCount(0);

    await getVisibleTestId(page, "jwt-decoder-token").fill(`Bearer ${sensitiveToken}`);

    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("JWT decodificado");
    await expect(getVisibleTestId(page, "jwt-decoder-warning-notVerified")).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-warning-bearerPrefixIgnored")).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-warning-payloadVisibleNotEncrypted")).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-header-output")).toContainText("private-demo-key");
    await expect(getVisibleTestId(page, "jwt-decoder-payload-output")).toContainText("sensitive-user-123");
    await expect(getVisibleTestId(page, "jwt-decoder-claim-table")).toContainText("aud");
    await expect(getVisibleTestId(page, "jwt-decoder-time-status")).toContainText("2030-01-01T00:00:00.000Z");

    let url = new URL(page.url());
    expect(url.search).toBe("");
    expect(url.hash).toBe("");

    await getVisibleTestId(page, "jwt-decoder-share-button").getByRole("button").click();
    await expect.poll(() => getClipboardUrlSnapshot(page)).toEqual({
      pathname: "/dev/jwt-decoder",
      search: "",
      hash: "",
      token: null,
      jwt: null,
      entrada: null,
    });

    await getVisibleTestId(page, "jwt-decoder-copy-header").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("private-demo-key");

    await getVisibleTestId(page, "jwt-decoder-copy-payload").click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("sensitive-user-123");

    await getVisibleTestId(page, "jwt-decoder-copy-diagnostics").click();
    const diagnostics = await page.evaluate(() => navigator.clipboard.readText());
    expect(diagnostics).toContain("status: valid");
    for (const value of sensitiveValues) {
      expect(diagnostics).not.toContain(value);
    }

    url = new URL(page.url());
    expect(url.search).toBe("");
    expect(url.hash).toBe("");

    const storageDump = await getSensitiveStorageDump(page);
    for (const value of sensitiveValues) {
      expect(storageDump).not.toContain(value);
    }
  });

  test("shows invalid token diagnostics, unsupported JWE, safe example, and clear state", async ({ page }) => {
    await page.goto("/dev/jwt-decoder");

    await getVisibleTestId(page, "jwt-decoder-token").fill("abc.def");
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Estrutura inválida");
    await expect(getVisibleTestId(page, "jwt-decoder-error")).toContainText("3 partes");

    await getVisibleTestId(page, "jwt-decoder-token").fill(`abc+def.${encodeJsonPart({ sub: "demo" })}.c2ln`);
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Base64URL inválido");
    await expect(getVisibleTestId(page, "jwt-decoder-error")).toContainText("header");

    const jweHeader = encodeJsonPart({ alg: "dir", enc: "A256GCM", typ: "JWT" });
    await getVisibleTestId(page, "jwt-decoder-token").fill(`${jweHeader}..aXY.Y2lwaGVydGV4dA.dGFn`);
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("JWE não suportado");
    await expect(getVisibleTestId(page, "jwt-decoder-warning-jweHeaderOnly")).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-header-output")).toContainText("A256GCM");

    await getVisibleTestId(page, "jwt-decoder-example").click();
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("JWT decodificado");
    await expect(getVisibleTestId(page, "jwt-decoder-payload-output")).toContainText("demo-token");

    await getVisibleTestId(page, "jwt-decoder-clear").click();
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Aguardando JWT");
    await expect(getVisibleTestId(page, "jwt-decoder-token")).toHaveValue("");
  });

  test("ignores token-like query and hash params and sanitizes the visible URL after hydration", async ({ page }) => {
    await page.goto(
      `/dev/jwt-decoder?token=${encodeURIComponent("query-token")}&jwt=${encodeURIComponent(
        "jwt-param"
      )}#token=${encodeURIComponent("hash-token")}`
    );

    await expect(getVisibleTestId(page, "jwt-decoder-token")).toHaveValue("");
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Aguardando JWT");
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("loads localized EN and ES routes", async ({ page }) => {
    await page.goto("/en/dev/jwt-decoder");
    await expect(page.getByRole("heading", { name: "JWT Decoder", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Waiting for JWT");

    await page.goto("/es/dev/jwt-decoder");
    await expect(page.getByRole("heading", { name: "JWT Decoder", level: 1 })).toBeVisible();
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toContainText("Esperando JWT");
  });

  test("lists the dev family, encoding category, route, and sitemap entries", async ({ page }) => {
    await page.goto("/ferramentas");

    await expect(page.getByTestId("tool-family-card-dev")).toBeVisible();
    await page.getByTestId("tool-family-card-dev").click();
    await expect(page).toHaveURL(/\/dev$/);
    await expect(page.getByRole("heading", { name: "Dev", level: 1 })).toBeVisible();
    await expect(page.getByText("JWT Decoder", { exact: true })).toBeVisible();

    await page.goto("/dev/categorias/codificacao");
    await expect(page.getByRole("heading", { name: "Codificação", level: 1 })).toBeVisible();
    await expect(page.getByText("JWT Decoder", { exact: true })).toBeVisible();

    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/dev/jwt-decoder");
    const toolPaths = Array.from(body.matchAll(/<loc>(.*?)<\/loc>/g))
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname) => pathname.endsWith("/dev/jwt-decoder"));

    expect(toolPaths).toEqual(["/dev/jwt-decoder", "/en/dev/jwt-decoder", "/es/dev/jwt-decoder"]);
  });

  test("stays usable on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/dev/jwt-decoder");

    await getVisibleTestId(page, "jwt-decoder-token").fill(sensitiveToken.repeat(6));
    await expect(getVisibleTestId(page, "jwt-decoder-status")).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });
});
