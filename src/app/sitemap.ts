import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://promolink.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: site + "/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: site + "/login", lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: site + "/register", lastModified, changeFrequency: "monthly", priority: 0.6 }
  ];
}
