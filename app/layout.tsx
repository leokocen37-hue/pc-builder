import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./storefront.css";
import { CartProvider } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://racunalo.hr";
const SITE_NAME = "RAČUNALO.hr";
// note: this is used verbatim (untemplated) for the homepage, since Next's title
// template only applies to *descendant* routes, not the root page itself — so it
// includes the brand name directly rather than relying on the "%s | SITE_NAME" suffix.
const DEFAULT_TITLE = "RAČUNALO.hr — Custom PC po mjeri, konfigurator i gotova računala";
const DEFAULT_DESCRIPTION =
  "Ručno sastavljena i testirana računala po mjeri. Složi svoje računalo u online konfiguratoru uz provjeru kompatibilnosti u stvarnom vremenu, ili odaberi gotovu, testiranu konfiguraciju. Dostava diljem Hrvatske, 24 mjeseca jamstva.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "custom pc",
    "konfigurator računala",
    "gaming računalo",
    "sastavljanje računala",
    "gotova računala",
    "radna stanica",
    "računalo po mjeri Hrvatska",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/hero-banner.jpg", width: 2256, height: 1000, alt: "RAČUNALO.hr — custom PC konfiguracije" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/hero-banner.jpg"],
  },
};

// site-wide structured data (Organization + WebSite) — helps Google understand
// who/what this site is, independent of any single page's content.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  email: "info@racunalo.hr",
};
const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "hr-HR",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locked = h.get("x-site-locked") === "1";

  return (
    <html lang="hr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {locked ? (
          // lock screen only — no header, cart or announcement bar
          children
        ) : (
          <CartProvider>
            <SiteHeader />
            {children}
            <CartDrawer />
          </CartProvider>
        )}
      </body>
    </html>
  );
}