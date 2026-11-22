import { z } from "zod";

import { COUNTRY_CODES } from "@/lib/photo/countries";

/** Content directories and the category each one holds. */
export const CATEGORY_DIRECTORIES = {
  tools: "tool",
  checkers: "checker",
  international: "international",
  guides: "guide",
  legal: "legal",
  about: "about",
} as const;

export const CATEGORIES = ["tool", "checker", "international", "guide", "legal", "about"] as const;
export type Category = (typeof CATEGORIES)[number];

/** URL prefix per category. Legal and about pages live at the site root. */
export const CATEGORY_ROUTE_PREFIX: Record<Category, string> = {
  tool: "/tool",
  checker: "/checker",
  international: "/international",
  guide: "/guide",
  legal: "",
  about: "",
};

export const TEMPLATES = ["tool", "guide", "faq", "legal", "info", "hub"] as const;
export type TemplateName = (typeof TEMPLATES)[number];

/** Interactive client components a page can embed via `widget`. */
export const WIDGETS = ["photo-editor", "photo-checker", "contact-form"] as const;
export type WidgetName = (typeof WIDGETS)[number];

/** Icons a page can show on hub and related-page cards. */
export const CARD_ICONS = ["camera", "crop", "globe", "id-card", "printer"] as const;
export type CardIcon = (typeof CARD_ICONS)[number];

export const SCHEMA_TYPES = [
  "WebPage",
  "Article",
  "WebApplication",
  "FAQPage",
  "AboutPage",
  "ContactPage",
  "CollectionPage",
] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];

/** Minimum words of body content before an indexable page is considered thin. */
export const MIN_WORDS: Record<TemplateName, number> = {
  guide: 600,
  tool: 300,
  faq: 150,
  legal: 250,
  info: 200,
  hub: 80,
};

const sitePath = z.string().regex(/^\/[a-z0-9\-/]*$/, "must be a site path like /guide/example");

const isoDate = z
  .union([z.date(), z.string()])
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), "must be a valid date (YYYY-MM-DD)")
  .transform((date) => date.toISOString());

export const frontmatterSchema = z
  .object({
    /** Used for the <title> tag; " | idphoto.us" is appended, so keep it under ~60 characters. */
    title: z.string().trim().min(10).max(60),
    /** Visible H1. Defaults to `title`. */
    heading: z.string().trim().min(5).max(110).optional(),
    /** Meta description and page intro. */
    description: z.string().trim().min(70).max(165),
    /** URL segment. Empty string makes the page its category's hub (e.g. /tool). */
    slug: z.string().regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "must be lowercase kebab-case"),
    category: z.enum(CATEGORIES),
    template: z.enum(TEMPLATES),
    published: z.boolean().default(true),
    publishedAt: isoDate.optional(),
    updatedAt: isoDate,

    canonical: z.union([sitePath, z.url()]).optional(),
    indexable: z.boolean().default(true),
    robots: z
      .object({
        follow: z.boolean().default(true),
        noarchive: z.boolean().default(false),
        maxImagePreview: z.enum(["none", "standard", "large"]).default("large"),
      })
      .default({ follow: true, noarchive: false, maxImagePreview: "large" }),
    keywords: z.array(z.string().trim().min(2)).max(12).default([]),
    ogImage: z.string().regex(/^\/[\w\-/.]+\.(png|jpe?g|webp)$/, "must be a /public image path").optional(),
    schemaType: z.enum(SCHEMA_TYPES).optional(),

    breadcrumbLabel: z.string().trim().max(40).optional(),
    /** One-line pitch for hub and related-page cards. Defaults to `description`. */
    summary: z.string().trim().min(20).max(120).optional(),
    /** Icon on hub and related-page cards. */
    icon: z.enum(CARD_ICONS).optional(),
    /** Position on the category hub, lowest first. Unordered pages follow, newest first. */
    order: z.number().int().nonnegative().optional(),
    showTableOfContents: z.boolean().default(false),
    widget: z.enum(WIDGETS).optional(),
    /** Tool and guide templates: label of the header button that scrolls to the widget. */
    ctaLabel: z.string().trim().min(3).max(40).optional(),
    /** Tool and guide templates: "band" gives the header the home page hero's full-width band and larger type. */
    heroStyle: z.enum(["plain", "band"]).default("plain"),
    /** Tool and guide templates: up to three key figures under the header, each stated (and sourced) in the body. */
    heroFacts: z
      .array(z.object({ value: z.string().trim().min(1).max(12), label: z.string().trim().min(3).max(40) }))
      .max(3)
      .optional(),
    /** Tool and guide templates: image shown beside the header. A /public path or our Cloudinary account. */
    heroImage: z
      .object({
        src: z
          .string()
          .regex(
            /^(\/[\w\-/.]+|https:\/\/res\.cloudinary\.com\/dipzpwbbk\/image\/upload\/[\w\-/.]+)\.(png|jpe?g|webp|avif|svg)$/,
            "must be a /public image path or a res.cloudinary.com/dipzpwbbk URL",
          ),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        alt: z.string().trim().min(10),
        /** Optional image credit, shown as a caption under the image. */
        credit: z.object({ name: z.string().trim().min(2).max(60), url: z.url() }).optional(),
      })
      .optional(),
    /** Country preselected in the `photo-editor` or `photo-checker` widget (its API code, e.g. IN, GB, EU). */
    country: z.enum(COUNTRY_CODES).optional(),
    /** Heading of the FAQ section. Defaults to the template's own heading. */
    faqTitle: z.string().trim().min(5).max(80).optional(),
    faq: z
      .array(z.object({ question: z.string().trim().min(8), answer: z.string().trim().min(20) }))
      .default([]),
    relatedPages: z.array(sitePath).max(6).default([]),

    author: z.string().default("editorial-team"),
    /** Only set when a named, real person has actually reviewed the page. */
    reviewedBy: z.string().optional(),
    sources: z
      .array(z.object({ title: z.string().trim().min(3), url: z.url(), publisher: z.string().trim().min(2) }))
      .default([]),
    /** Show the "not an official source" notice. */
    showDisclaimer: z.boolean().default(false),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.template === "tool" && !data.widget) {
      ctx.addIssue({ code: "custom", path: ["widget"], message: "is required for the tool template" });
    }
    const customHero = data.ctaLabel || data.heroImage || data.heroFacts || data.heroStyle !== "plain";
    if (customHero && data.template !== "tool" && data.template !== "guide") {
      ctx.addIssue({
        code: "custom",
        path: ["heroStyle"],
        message: "ctaLabel, heroImage, heroFacts, and heroStyle only apply to the tool and guide templates",
      });
    }
    if (data.ctaLabel && !data.widget) {
      ctx.addIssue({ code: "custom", path: ["ctaLabel"], message: "needs a widget for the button to scroll to" });
    }
    if (data.country && data.widget !== "photo-editor" && data.widget !== "photo-checker") {
      ctx.addIssue({ code: "custom", path: ["country"], message: "only applies to the photo-editor and photo-checker widgets" });
    }
    if (data.template === "faq" && data.faq.length < 3) {
      ctx.addIssue({ code: "custom", path: ["faq"], message: "needs at least 3 entries for the faq template" });
    }
    if (data.template === "hub" && data.slug !== "") {
      ctx.addIssue({ code: "custom", path: ["slug"], message: 'must be "" for the hub template' });
    }
    if (data.slug === "" && data.template !== "hub") {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "can only be empty for the hub template" });
    }
  });

export type Frontmatter = z.output<typeof frontmatterSchema>;

export const authorSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  bio: z.string().min(20),
  /** A site path for our own authors, or an external URL for a third party. */
  url: z.union([sitePath, z.httpUrl()]).optional(),
  type: z.enum(["Person", "Organization"]),
});

export type Author = z.infer<typeof authorSchema> & { id: string };
