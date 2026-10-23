import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/** Resolves a site path (or passes through an absolute URL) against the canonical origin. */
export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return pathOrUrl === "/" ? siteConfig.url : `${siteConfig.url}${pathOrUrl}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  /** `null` for pages with no stable public URL (private result links): no canonical or og:url is emitted. */
  path: string | null;
  canonical?: string;
  indexable?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  maxImagePreview?: "none" | "standard" | "large";
  keywords?: string[];
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Set for the home page so the title template isn't applied. */
  absoluteTitle?: boolean;
};

/**
 * Single place that turns page data into Next.js metadata, so every route gets
 * the same canonical, robots, Open Graph, and Twitter treatment.
 */
export function buildMetadata(input: PageMetadataInput): Metadata {
  const target = input.canonical ?? input.path;
  const canonical = target === null ? undefined : absoluteUrl(target);
  const index = input.indexable ?? true;
  const follow = input.follow ?? true;
  const images = input.ogImage ? [{ url: input.ogImage, width: 1200, height: 630, alt: input.title }] : undefined;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    keywords: input.keywords?.length ? input.keywords : undefined,
    ...(canonical && { alternates: { canonical } }),
    robots: {
      index,
      follow,
      noarchive: input.noarchive || undefined,
      googleBot: { index, follow, "max-image-preview": input.maxImagePreview ?? "large", "max-snippet": -1 },
    },
    openGraph: {
      type: input.type ?? "website",
      ...(canonical && { url: canonical }),
      siteName: siteConfig.name,
      locale: "en_US",
      title: input.title,
      description: input.description,
      ...(images && { images }),
      ...(input.type === "article" && {
        publishedTime: input.publishedTime,
        modifiedTime: input.modifiedTime,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(images && { images: images.map((image) => image.url) }),
    },
  };
}
