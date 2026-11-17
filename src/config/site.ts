import { publicEnv } from "@/lib/env/public";

export const siteConfig = {
  name: "idphoto.us",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: "Passport & ID photo tools and guides",
  description:
    "Passport and ID photo tools with a free preview, plus plain-English guides. Make a passport photo online for the U.S. and 60+ countries, then pay once to download it.",
  contactEmail: "hello@idphoto.us",
  /** Reply-to on order emails and shown on invoices. */
  supportEmail: "hello@idphoto.us",
  logo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/logo.png`,
  /** Seller address printed on invoices. OWNER REVIEW: confirm before payments go live. */
  business: {
    locality: "Varanasi",
    region: "Uttar Pradesh",
    country: "India",
    countryCode: "IN",
  },
  privacy: {
    /** Paid download links (/api/download/<token>) expire after this. */
    linkExpiryMinutes: 60,
  },
  /** The person who owns and runs the site (shown on /about and in Organization structured data). */
  owner: "Navnit Rai",
  nav: [
    { label: "Tools", href: "/tool" },
    { label: "Checkers", href: "/checker" },
    { label: "Guides", href: "/guide" },
    { label: "FAQ", href: "/faq" },
    { label: "About", href: "/about" },
  ],
  footer: [
    {
      title: "Tools",
      links: [
        { label: "Passport photo editor", href: "/tool/passport-photo-editor" },
      ],
    },
    {
      title: "Guides",
      links: [
        { label: "Passport photo requirements", href: "/guide/passport-photo-requirements" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "About us", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Editorial policy", href: "/editorial-policy" },
        { label: "Content methodology", href: "/content-methodology" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy policy", href: "/privacy-policy" },
        { label: "Terms of service", href: "/terms" },
        { label: "Refund policy", href: "/refund-policy" },
        { label: "Data security", href: "/data-security" },
      ],
    },
  ],
} as const;
