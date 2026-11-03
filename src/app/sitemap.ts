import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aegisflood.tanisheesh.in";
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/playground`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/network`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
