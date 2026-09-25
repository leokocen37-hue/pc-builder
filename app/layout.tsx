import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./storefront.css";
import { CartProvider } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
// The two fonts the storefront actually renders in. They used to come from a
// <link> to fonts.googleapis.com, which means every visitor's IP reaches
// Google before they have consented to anything. next/font downloads them at
// build time and serves them from our own origin, so no third party is
// involved at all — and the privacy policy has one less recipient to declare.
// latin-ext carries the Croatian č/ć/š/ž/đ.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

import { SITE_URL } from "@/lib/site-config";
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
// TODO: add `sameAs` once official social profile URLs are confirmed — left
// out rather than guessed at.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "Racunalo.hr",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  email: "info@racunalo.hr",
  // the light-background variant on purpose: search results render on white,
  // and the dark-background one is near-invisible there
  logo: `${SITE_URL}/logo-svijetla-pozadina.svg`,
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
        <JsonLd data={ORG_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
        {locked ? (
          // lock screen only — no header, cart or announcement bar
          children
        ) : (
          <CartProvider>
            <SiteHeader />
            {children}
            <Footer />
            <CartDrawer />
            <CookieConsent />
          </CartProvider>
        )}
      </body>
    </html>
  );
}