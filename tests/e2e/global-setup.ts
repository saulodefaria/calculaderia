import type { FullConfig } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const requestTimeoutMs = 20_000;
const routePatterns = [
  /\.goto\(\s*["'`]([^"'`]+)["'`]/g,
  /waitForURL\(\s*["'`](?:\*\*)?([^"'`]+)["'`]/g,
  /toHaveAttribute\(\s*["'`]href["'`]\s*,\s*["'`]([^"'`]+)["'`]/g,
];

async function collectWarmupPaths(testDir: string) {
  const entries = await readdir(testDir, { withFileTypes: true });
  const paths = new Set<string>(["/"]);

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".spec.ts")) {
      continue;
    }

    const source = await readFile(path.join(testDir, entry.name), "utf8");

    for (const routePattern of routePatterns) {
      for (const match of source.matchAll(routePattern)) {
        const warmupPath = normalizeWarmupPath(match[1]);

        if (warmupPath) {
          paths.add(warmupPath);
        }
      }
    }
  }

  return [...paths].sort();
}

function normalizeWarmupPath(route: string) {
  if (
    route.startsWith("/api/") ||
    route.startsWith("/_next/") ||
    route.includes("${") ||
    route.includes("\\") ||
    route.includes("*")
  ) {
    return null;
  }

  const [withoutHash] = route.split("#");
  const [pathname] = withoutHash.split("?");

  return pathname || null;
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export default async function globalSetup(config: FullConfig) {
  if (
    process.env.PLAYWRIGHT_SKIP_WARMUP === "1" ||
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
  ) {
    return;
  }

  const baseURL = config.projects[0]?.use.baseURL;

  if (!baseURL) {
    return;
  }

  const testDir = path.join(process.cwd(), "tests/e2e");
  const warmupPaths = await collectWarmupPaths(testDir);

  for (const warmupPath of warmupPaths) {
    const response = await fetchWithTimeout(
      new URL(warmupPath, baseURL).toString(),
    );

    if (response.status >= 500) {
      throw new Error(
        `E2E warmup failed for ${warmupPath}: ${response.status} ${response.statusText}`,
      );
    }
  }
}
