import { publicEnv } from "@/lib/env/public";

export const siteConfig = {
  name: "idphoto.us",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  tagline: "Passport & ID photo tools and guides",
  description:
    "Free tools and plain-English guides for U.S. passport, visa, and ID photos. Crop and compress photos in your browser — your images never leave your device.",
  contactEmail: "hello@idphoto.us",
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
        { label: "Passport photo maker", href: "/tool/passport-photo-maker" },
        { label: "Passport photo editor", href: "/tool/passport-photo-editor" },
        { label: "Photo compressor", href: "/tool/photo-compressor" },
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
