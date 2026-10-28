import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content pages are statically prerendered, so a per-request nonce isn't
 * possible; Next's inline bootstrap scripts need 'unsafe-inline'. Everything
 * else is locked to our own origin. See docs/DEPLOYMENT.md → Security.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Microsoft Clarity loads its tag from www.clarity.ms and scripts.clarity.ms,
  // then beacons to *.clarity.ms and c.bing.com.
  // The photo checker runs MediaPipe in the browser: its WebAssembly loader comes from jsDelivr
  // ('wasm-unsafe-eval' allows compiling WebAssembly only, not JavaScript eval) and its models from Google Storage.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://*.clarity.ms${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Cloudinary serves photo-editor results (shown on /preview/<id>).
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.clarity.ms https://c.bing.com",
  "font-src 'self'",
  "connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com https://*.clarity.ms https://c.bing.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Site imagery hosted on our Cloudinary account (e.g. the home page hero).
    remotePatterns: [new URL("https://res.cloudinary.com/dipzpwbbk/image/upload/**")],
  },
  // Markdown is read from disk; make sure it ships with standalone/serverless output.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  // One canonical host: www.idphoto.us permanently redirects to idphoto.us. (HTTP → HTTPS is handled by the host.)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.idphoto.us" }],
        destination: "https://idphoto.us/:path*",
        statusCode: 301,
      },
    ];
  },

  // Browsers and some crawlers request /favicon.ico directly, ignoring <link rel="icon">; serve the PNG logo there.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/logo.png" }];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
