import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/kalkulator", "/kalkulator2", "/zakljucano"] },
    sitemap: "https://racunalo.hr/sitemap.xml",
  };
}
