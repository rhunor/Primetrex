import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/how-it-works", "/contact", "/register", "/login", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/pending-payment"],
      },
    ],
    sitemap: "https://www.primetrexaffiliates.com/sitemap.xml",
  };
}
