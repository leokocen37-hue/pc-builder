import type { NextConfig } from "next";

// Sent on every response. Each one is here rather than in proxy.ts so it
// applies to static assets too, not only to routes the proxy sees.
const SECURITY_HEADERS = [
  // the site is never meant to be framed; clickjacking has no legitimate use here
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // send the origin to other sites, the full path only to ourselves — so an
  // outbound click can't leak which product page someone was reading
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // nothing here asks for a camera, a microphone or a location
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Report-only to begin with: the storefront inlines a lot of styles and the
  // Shopify/Vercel origins still have to be confirmed against real traffic.
  // Promote to Content-Security-Policy once the reports come back clean.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // Next injects inline bootstrap scripts; 'unsafe-inline' is what makes
      // this report-only rather than enforced for now
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://cdn.shopify.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.myshopify.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://*.myshopify.com",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // no reason to advertise the framework version to anyone scanning
  poweredByHeader: false,
  images: {
    // product photography all comes from the Shopify CDN; without this
    // next/image refuses to optimise it
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // one host, so canonicals, the sitemap and analytics all agree: www
      {
        source: "/:path*",
        has: [{ type: "host", value: "racunalo.hr" }],
        destination: "https://www.racunalo.hr/:path*",
        permanent: true,
      },
      { source: "/gotova-racunala", destination: "/racunala", permanent: true },
      { source: "/gaming-racunala", destination: "/racunala/gaming", permanent: true },
      { source: "/radne-stanice", destination: "/racunala/radne-stanice", permanent: true },
      { source: "/monitori", destination: "/periferija/monitori", permanent: true },
      { source: "/tipkovnice", destination: "/periferija/tipkovnice", permanent: true },
      { source: "/misevi", destination: "/periferija/misevi", permanent: true },
      { source: "/slusalice", destination: "/periferija/slusalice", permanent: true },
    ];
  },
};

export default nextConfig;
