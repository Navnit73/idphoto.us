import { publicEnv } from "@/lib/env/public";

export const siteConfig = {
  name: "idphoto.us",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: "Passport & ID photo tools and guides",
  description:
    "Free tools and plain-English guides for passport and ID photos. Make a passport photo online for the U.S. and 60+ countries, then download, print, or upload it.",
  contactEmail: "hello@idphoto.us",
  /** The person who owns and runs the site (shown on /about and in Organization structured data). */
  owner: "Navnit Rai",
  nav: [
    { label: "Tools", href: "/tool" },
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
        { label: "U.S. passport photo size", href: "/guide/us-passport-photo-size" },
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
      ],
    },
  ],
} as const;
