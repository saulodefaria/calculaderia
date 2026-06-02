import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getAvailableCalculators, getVisibleCalculatorCategories } from "@/lib/constants";
import { guides } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  const pt = (path: string) => `${baseUrl}${path}`;
  const en = (path: string) => `${baseUrl}/en${path}`;
  const es = (path: string) => `${baseUrl}/es${path}`;

  const routes: MetadataRoute.Sitemap = [];

  // Home pages
  routes.push(
    { url: pt("/"), lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: en("/"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: es("/"), lastModified, changeFrequency: "weekly", priority: 0.7 }
  );

  // Calculator directory and category pages
  routes.push(
    { url: pt("/calculadoras"), lastModified, changeFrequency: "weekly", priority: 0.85 },
    { url: en("/calculadoras"), lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: es("/calculadoras"), lastModified, changeFrequency: "weekly", priority: 0.6 }
  );

  for (const category of getVisibleCalculatorCategories()) {
    routes.push(
      { url: pt(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority },
      { url: en(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority * 0.7 },
      { url: es(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority * 0.7 }
    );
  }

  // Calculator pages
  const availableCalculators = getAvailableCalculators();
  for (const calc of availableCalculators) {
    const priority = calc.sitemapPriority ?? 0.7;
    routes.push(
      { url: pt(calc.href), lastModified, changeFrequency: "weekly", priority },
      { url: en(calc.href), lastModified, changeFrequency: "weekly", priority: priority * 0.7 },
      { url: es(calc.href), lastModified, changeFrequency: "weekly", priority: priority * 0.7 }
    );
  }

  // Guide pages (pt-BR is primary, en/es are lower priority since noindex)
  routes.push(
    { url: pt("/guias"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: en("/guias"), lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: es("/guias"), lastModified, changeFrequency: "monthly", priority: 0.3 }
  );

  for (const guide of guides) {
    routes.push(
      { url: pt(`/guias/${guide.slug}`), lastModified, changeFrequency: "monthly", priority: 0.7 },
      { url: en(`/guias/${guide.slug}`), lastModified, changeFrequency: "monthly", priority: 0.2 },
      { url: es(`/guias/${guide.slug}`), lastModified, changeFrequency: "monthly", priority: 0.2 }
    );
  }

  // Institutional pages
  const institutionalPages = [
    { path: "/sobre", priority: 0.5 },
    { path: "/contato", priority: 0.4 },
    { path: "/privacidade", priority: 0.3 },
    { path: "/termos", priority: 0.3 },
    { path: "/aviso-legal", priority: 0.3 },
  ];

  for (const page of institutionalPages) {
    routes.push(
      { url: pt(page.path), lastModified, changeFrequency: "monthly", priority: page.priority },
      { url: en(page.path), lastModified, changeFrequency: "monthly", priority: page.priority * 0.6 },
      { url: es(page.path), lastModified, changeFrequency: "monthly", priority: page.priority * 0.6 }
    );
  }

  // Support page
  routes.push(
    { url: pt("/apoiar"), lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: en("/apoiar"), lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: es("/apoiar"), lastModified, changeFrequency: "monthly", priority: 0.3 }
  );

  return routes;
}
