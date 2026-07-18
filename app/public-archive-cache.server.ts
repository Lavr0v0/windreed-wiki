import "server-only";

import { getRuntimeEnv } from "@/db";

const publicArchiveCachePrefix = "public-archive:v1:";

function namespace() {
  try {
    return getRuntimeEnv().PUBLIC_ARCHIVE_CACHE ?? null;
  } catch {
    return null;
  }
}

function cacheKey(key: string) {
  return `${publicArchiveCachePrefix}${key}`;
}

export async function readPublicArchiveCache<T>(key: string): Promise<T | null> {
  const cache = namespace();
  if (!cache) return null;
  try {
    return await cache.get<T>(cacheKey(key), "json");
  } catch {
    return null;
  }
}

export async function writePublicArchiveCache<T>(key: string, value: T) {
  const cache = namespace();
  if (!cache) return;
  try {
    await cache.put(cacheKey(key), JSON.stringify(value));
  } catch (error) {
    console.error("[public-archive-cache] write failed", error);
    // A cache failure must never make a public archive page unavailable.
  }
}

export async function invalidatePublicArchiveCache() {
  const cache = namespace();
  if (!cache) return;

  try {
    let cursor: string | undefined;
    do {
      const page = await cache.list({ prefix: publicArchiveCachePrefix, cursor });
      await Promise.all(page.keys.map(({ name }) => cache.delete(name)));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  } catch {
    // Publishing has already succeeded in D1. KV is an acceleration layer only.
  }
}

export const publicArchiveCacheKeys = {
  entries: "entries",
  navigation: "navigation",
  search: "search",
  entry(category: string, slug: string) {
    return `entry:${encodeURIComponent(category)}:${encodeURIComponent(slug)}`;
  },
} as const;
