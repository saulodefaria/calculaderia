import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const lastModified = new Date();

  const pt = (path: string) => `${baseUrl}${path}`;
  const en = (path: string) => `${baseUrl}/en${path}`;

  const routes = [
    // Home
    { url: pt("/"), priority: 1.0 },
    { url: en("/"), priority: 0.7 },

    // Support page
    { url: pt("/apoiar"), priority: 0.4 },
    { url: en("/apoiar"), priority: 0.3 },

    // Calculators (pt-br is unprefixed)
    { url: pt("/calculadoras/financiamento"), priority: 0.9 },
    { url: en("/calculadoras/financiamento"), priority: 0.6 },

    { url: pt("/calculadoras/juros-compostos"), priority: 0.7 },
    { url: en("/calculadoras/juros-compostos"), priority: 0.5 },

    { url: pt("/calculadoras/consorcio"), priority: 0.6 },
    { url: en("/calculadoras/consorcio"), priority: 0.45 },

    { url: pt("/calculadoras/comparativo"), priority: 0.6 },
    { url: en("/calculadoras/comparativo"), priority: 0.45 },

    { url: pt("/calculadoras/alugar-vs-comprar"), priority: 0.55 },
    { url: en("/calculadoras/alugar-vs-comprar"), priority: 0.4 },

    { url: pt("/calculadoras/tir"), priority: 0.5 },
    { url: en("/calculadoras/tir"), priority: 0.35 },

    { url: pt("/calculadoras/renda-fixa"), priority: 0.7 },
    { url: en("/calculadoras/renda-fixa"), priority: 0.5 },
  ];

  return routes.map((r) => ({
    url: r.url,
    lastModified,
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}
