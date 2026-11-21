import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${base}/playground`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${base}/network`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${base}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
