import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    // Only what must never be crawled. A path that 404s does not belong here:
    // naming it in robots.txt is how a crawler finds out it exists.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/zakljucano"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
