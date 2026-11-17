import type {
  Article,
  BreadcrumbList,
  FAQPage,
  IdReference,
  ItemList,
  Organization,
  Person,
  Thing,
  WebApplication,
  WebPage,
  WebSite,
} from "schema-dts";

import { siteConfig } from "@/config/site";
import type { Author } from "@/lib/content/schema";

import { absoluteUrl } from "./metadata";

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export type Crumb = { name: string; path: string };

export function organizationJsonLd(): Organization {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    email: siteConfig.contactEmail,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: siteConfig.contactEmail, availableLanguage: "English" },
    founder: { "@type": "Person", name: siteConfig.owner },
  };
}

export function websiteJsonLd(): WebSite {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-US",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** The home page's own node, tied to the site and the organization. */
export function homePageJsonLd(input: { title: string; description: string; updatedAt?: string }): WebPage {
  return {
    "@type": "WebPage",
    "@id": `${siteConfig.url}/#page`,
    url: siteConfig.url,
    name: input.title,
    description: input.description,
    ...(input.updatedAt && { dateModified: input.updatedAt }),
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
  };
}

/** FAQ markup for a page. The questions and answers must match the visible FAQ text exactly. */
export function faqPageJsonLd(path: string, faq: { question: string; answer: string }[]): FAQPage {
  const base = path === "/" ? `${absoluteUrl(path)}/` : absoluteUrl(path);
  return { "@type": "FAQPage", "@id": `${base}#faq`, mainEntity: faqEntities(faq) };
}

export function breadcrumbJsonLd(crumbs: Crumb[]): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function authorJsonLd(author: Author): Person | Organization | IdReference {
  // An organization with an external URL is a third party; any other organization author is us.
  if (author.type === "Organization") {
    return author.url?.startsWith("http")
      ? { "@type": "Organization", name: author.name, url: author.url }
      : { "@id": ORGANIZATION_ID };
  }
  return { "@type": "Person", name: author.name, ...(author.url && { url: absoluteUrl(author.url) }) };
}

type PageInput = {
  type: "WebPage" | "Article" | "WebApplication" | "FAQPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  url: string;
  title: string;
  description: string;
  updatedAt: string;
  publishedAt?: string;
  /** Site path or URL of the page's representative image (its social card). */
  image?: string;
  author: Author;
  reviewer?: Author | null;
  breadcrumbs: Crumb[];
  faq?: { question: string; answer: string }[];
  /** CollectionPage: the pages it lists, in display order. */
  items?: Crumb[];
};

/** Builds the structured-data graph for a content page. */
export function pageJsonLd(input: PageInput): Thing[] {
  const url = absoluteUrl(input.url);
  // The page nodes reference the organization and website by @id, so both are included to keep each page's graph self-contained.
  const graph: Thing[] = [organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd(input.breadcrumbs)];
  const common = {
    "@id": `${url}#page`,
    url,
    name: input.title,
    description: input.description,
    dateModified: input.updatedAt,
    ...(input.publishedAt && { datePublished: input.publishedAt }),
    ...(input.image && { image: absoluteUrl(input.image) }),
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
  };

  if (input.type === "Article") {
    // `reviewedBy` and `lastReviewed` belong to WebPage, so the article gets a WebPage node of its own to carry them.
    graph.push({
      "@type": "WebPage",
      "@id": `${url}#page`,
      url,
      name: input.title,
      description: input.description,
      dateModified: input.updatedAt,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": `${url}#article` },
      ...(input.reviewer && { reviewedBy: authorJsonLd(input.reviewer), lastReviewed: input.updatedAt }),
    } satisfies WebPage);
    graph.push({
      ...common,
      "@id": `${url}#article`,
      "@type": "Article",
      headline: input.title,
      author: authorJsonLd(input.author),
      publisher: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: { "@id": `${url}#page` },
    } satisfies Article);
  } else if (input.type === "WebApplication") {
    graph.push({
      ...common,
      "@type": "WebApplication",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (runs in the browser)",
      browserRequirements: "Requires JavaScript and a modern browser",
      // Uploading, previewing and checking are free; the full-resolution download is a paid one-time purchase.
      isAccessibleForFree: false,
      offers: {
        "@type": "Offer",
        price: "7.99",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "Free upload and preview. One-time fee for the full-resolution download.",
      },
      publisher: { "@id": ORGANIZATION_ID },
    } satisfies WebApplication);
  } else if (input.type === "FAQPage") {
    graph.push({ ...common, "@type": "FAQPage", mainEntity: faqEntities(input.faq ?? []) } satisfies FAQPage);
    return graph;
  } else if (input.type === "CollectionPage" && input.items?.length) {
    graph.push({ ...common, "@type": "CollectionPage", mainEntity: itemListJsonLd(input.items) } as WebPage);
  } else {
    graph.push({ ...common, "@type": input.type } as WebPage);
  }

  if (input.faq?.length) graph.push(faqPageJsonLd(input.url, input.faq));

  return graph;
}

function itemListJsonLd(items: Crumb[]): ItemList {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

function faqEntities(faq: { question: string; answer: string }[]): FAQPage["mainEntity"] {
  return faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
}
