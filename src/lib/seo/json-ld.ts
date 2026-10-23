import type {
  Article,
  BreadcrumbList,
  FAQPage,
  IdReference,
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
    logo: absoluteUrl("/icon.svg"),
    email: siteConfig.contactEmail,
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

function authorJsonLd(author: Author): Person | IdReference {
  if (author.type === "Organization") return { "@id": ORGANIZATION_ID };
  return { "@type": "Person", name: author.name, ...(author.url && { url: absoluteUrl(author.url) }) };
}

type PageInput = {
  type: "WebPage" | "Article" | "WebApplication" | "FAQPage" | "AboutPage" | "ContactPage" | "CollectionPage";
  url: string;
  title: string;
  description: string;
  updatedAt: string;
  publishedAt?: string;
  author: Author;
  reviewer?: Author | null;
  breadcrumbs: Crumb[];
  faq?: { question: string; answer: string }[];
};

/** Builds the structured-data graph for a content page. */
export function pageJsonLd(input: PageInput): Thing[] {
  const url = absoluteUrl(input.url);
  const graph: Thing[] = [breadcrumbJsonLd(input.breadcrumbs)];
  const common = {
    "@id": `${url}#page`,
    url,
    name: input.title,
    description: input.description,
    dateModified: input.updatedAt,
    ...(input.publishedAt && { datePublished: input.publishedAt }),
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
  };

  if (input.type === "Article") {
    graph.push({
      ...common,
      "@type": "Article",
      headline: input.title,
      author: authorJsonLd(input.author),
      publisher: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: url,
      ...(input.reviewer && { reviewedBy: authorJsonLd(input.reviewer) }),
    } satisfies Article);
  } else if (input.type === "WebApplication") {
    graph.push({
      ...common,
      "@type": "WebApplication",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (runs in the browser)",
      browserRequirements: "Requires JavaScript and a modern browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
      publisher: { "@id": ORGANIZATION_ID },
    } satisfies WebApplication);
  } else if (input.type === "FAQPage") {
    graph.push({ ...common, "@type": "FAQPage", mainEntity: faqEntities(input.faq ?? []) } satisfies FAQPage);
    return graph;
  } else {
    graph.push({ ...common, "@type": input.type } as WebPage);
  }

  if (input.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqEntities(input.faq),
    } satisfies FAQPage);
  }

  return graph;
}

function faqEntities(faq: { question: string; answer: string }[]): FAQPage["mainEntity"] {
  return faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
}
