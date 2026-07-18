import type { MetadataRoute } from "next";
import { archiveHref } from "./archive-manifest";
import { getPublicArchiveEntries } from "./public-archive.server";

const origin = "https://windreed.wiki";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicArchiveEntries();
  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    ...entries.map((entry) => ({
      url: `${origin}${archiveHref(entry)}`,
      changeFrequency: "monthly" as const,
      priority: entry.characterRole === "member" ? 0.9 : 0.7,
    })),
    { url: `${origin}/characters/alberina/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/characters/flavilar/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/characters/shirul/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/characters/shirul/branch/`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
