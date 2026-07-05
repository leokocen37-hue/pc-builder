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

export const metadata: Metadata = {
  title: "RACUNALO.hr — Custom PC po mjeri",
  description: "Ručno sastavljena i testirana računala po mjeri. Složi svoje u konfiguratoru ili odaberi gotovu konfiguraciju.",
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