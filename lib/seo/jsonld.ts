export type FaqItem = {
  question: string;
  answer: string;
};

export function createFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } as const;
}

export type BreadcrumbItem = {
  name: string;
  item: string;
};

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  } as const;
}

// WebSite schema
export type WebSiteJsonLdParams = {
  name: string;
  url: string;
  description?: string;
  searchUrl?: string; // Optional: for SearchAction (e.g., "/search?q={search_term_string}")
};

export function createWebSiteJsonLd(params: WebSiteJsonLdParams) {
  if (params.searchUrl) {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: params.name,
      url: params.url,
      ...(params.description && { description: params.description }),
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: params.searchUrl,
        },
        "query-input": "required name=search_term_string",
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: params.name,
    url: params.url,
    ...(params.description && { description: params.description }),
  };
}

// Organization schema
export type OrganizationJsonLdParams = {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[]; // Social profiles, GitHub, etc.
};

export function createOrganizationJsonLd(params: OrganizationJsonLdParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: params.name,
    url: params.url,
    ...(params.logo && { logo: params.logo }),
    ...(params.sameAs && params.sameAs.length > 0 && { sameAs: params.sameAs }),
  };
}

// ItemList schema (for listing calculators, guides, etc.)
export type ItemListItem = {
  name: string;
  url: string;
  description?: string;
};

export type ItemListJsonLdParams = {
  items: ItemListItem[];
  name?: string;
};

export function createItemListJsonLd(params: ItemListJsonLdParams) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(params.name && { name: params.name }),
    numberOfItems: params.items.length,
    itemListElement: params.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      ...(item.description && { description: item.description }),
    })),
  } as const;
}

// SoftwareApplication schema (for individual calculators)
export type SoftwareApplicationJsonLdParams = {
  name: string;
  url: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
};

export function createSoftwareApplicationJsonLd(params: SoftwareApplicationJsonLdParams) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: params.name,
    url: params.url,
    ...(params.description && { description: params.description }),
    applicationCategory: params.applicationCategory || "FinanceApplication",
    operatingSystem: params.operatingSystem || "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
  } as const;
}
