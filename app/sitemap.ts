import type { MetadataRoute } from "next";
import { MAIN_CATEGORIES, REGIONS_DATA, getKeywordPages } from "@/lib/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://sooriwiki.com";
  const now = new Date();

  // 1. Home (Level 0)
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
  };

  // 2. 22 Main Category Hubs (Level 1A)
  const categoryEntries: MetadataRoute.Sitemap = MAIN_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/services/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  // 3. Regional Hubs (Level 1B)
  const regionEntries: MetadataRoute.Sitemap = REGIONS_DATA.map((reg) => ({
    url: `${baseUrl}/regions/${reg.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 4. Published Regional x Category Landing Pages (Level 2)
  const allKeywordPages = getKeywordPages();
  const publishedPages = allKeywordPages.filter((p) => p.status === "published");

  const landingEntries: MetadataRoute.Sitemap = publishedPages.map((page) => ({
    url: `${baseUrl}/services/${page.categorySlug}/${page.regionSlug}`,
    lastModified: new Date(page.lastModified),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [homeEntry, ...categoryEntries, ...regionEntries, ...landingEntries];
}
