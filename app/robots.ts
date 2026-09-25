import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    // /kalkulator and /kalkulator2 are gone — naming a 404 in robots.txt only
    // points a crawler at it
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/zakljucano"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
