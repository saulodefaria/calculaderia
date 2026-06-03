import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getAvailableTools, getVisibleToolCategories, getVisibleToolFamilies } from "@/lib/constants";
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

  // Tools hub, family directories, and category pages
  routes.push(
    { url: pt("/ferramentas"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: en("/ferramentas"), lastModified, changeFrequency: "weekly", priority: 0.63 },
    { url: es("/ferramentas"), lastModified, changeFrequency: "weekly", priority: 0.63 }
  );

  for (const family of getVisibleToolFamilies()) {
    routes.push(
      { url: pt(family.href), lastModified, changeFrequency: "weekly", priority: family.sitemapPriority },
      { url: en(family.href), lastModified, changeFrequency: "weekly", priority: family.sitemapPriority * 0.7 },
      { url: es(family.href), lastModified, changeFrequency: "weekly", priority: family.sitemapPriority * 0.7 }
    );
  }

  for (const category of getVisibleToolCategories()) {
    routes.push(
      { url: pt(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority },
      { url: en(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority * 0.7 },
      { url: es(category.href), lastModified, changeFrequency: "weekly", priority: category.sitemapPriority * 0.7 }
    );
  }

  // Individual tool pages
  for (const tool of getAvailableTools()) {
    const priority = tool.sitemapPriority ?? 0.7;
    routes.push(
      { url: pt(tool.href), lastModified, changeFrequency: "weekly", priority },
      { url: en(tool.href), lastModified, changeFrequency: "weekly", priority: priority * 0.7 },
      { url: es(tool.href), lastModified, changeFrequency: "weekly", priority: priority * 0.7 }
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
