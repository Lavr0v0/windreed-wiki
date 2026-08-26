import "server-only";

import { cache } from "react";

import {
  getArchiveEntries,
  getArchiveEntry,
  getSearchIndex,
  type ArchiveEntry,
} from "./archive-content.server";
import { headingId } from "./archive-heading";
import { getRuntimeEnv } from "@/db";
import { documentToMarkdown } from "./editor/lib/content";
import {
  getPublishedEntry,
  listPublishedEntrySummaries,
  listPublishedEntries,
  listPublishedSearchEntries,
  type PublishedEntrySummary,
} from "./editor/lib/repository.server";
import {
  archiveHref,
  sortArchiveEntries,
  type ArchiveManifestEntry,
} from "./archive-manifest";
import { mergeCanonicalCoreInfo } from "./core-info";
import type { EntryPayload } from "./editor/lib/types";
import {
  publicArchiveCacheKeys,
  readPublicArchiveCache,
  writePublicArchiveCache,
} from "./public-archive-cache.server";

function dynamicArchiveAvailable() {
  try {
    return Boolean(getRuntimeEnv().DB);
  } catch {
    return false;
  }
}

function toArchiveEntry(
  payload: EntryPayload,
  plainText: string,
): ArchiveEntry {
  const staticEntry = getArchiveEntry(payload.category, payload.slug);
  const publishedBody = documentToMarkdown(payload.body);
  const body = payload.category === "characters"
    ? mergeCanonicalCoreInfo(publishedBody, staticEntry?.body)
    : publishedBody;
  const manifest: ArchiveManifestEntry = {
    slug: payload.slug,
    category: payload.category,
    section: payload.section as ArchiveManifestEntry["section"],
    title: payload.title,
    englishTitle: payload.englishTitle || undefined,
    aliases: payload.aliases,
    summary: payload.summary,
    monogram: payload.monogram,
    accent: payload.accent,
    characterRole: payload.characterRole || undefined,
    personalPage: payload.personalPage || undefined,
    presentation: payload.presentation,
    facts: payload.category === "characters"
      ? staticEntry?.facts ?? (payload.facts.length ? payload.facts : undefined)
      : payload.facts.length ? payload.facts : staticEntry?.facts,
  };
  const headings = (payload.body.content ?? []).flatMap((node) => {
    if (node.type !== "heading") return [];
    const title = (node.content ?? []).map((child) => child.text ?? "").join("").trim();
    if (!title) return [];
    return [{
      id: headingId(title),
      level: (Number(node.attrs?.level) === 3 ? 3 : 2) as 2 | 3,
      title,
    }];
  });
  return {
    ...manifest,
    body,
    headings,
    plainText,
  };
}

function toManifestEntry(payload: PublishedEntrySummary): ArchiveManifestEntry {
  return {
    slug: payload.slug,
    category: payload.category,
    section: payload.section as ArchiveManifestEntry["section"],
    title: payload.title,
    englishTitle: payload.englishTitle || undefined,
    aliases: payload.aliases,
    summary: payload.summary,
    monogram: payload.monogram,
    accent: payload.accent,
    characterRole: payload.characterRole || undefined,
    personalPage: payload.personalPage || undefined,
    presentation: payload.presentation,
    facts: payload.facts.length ? payload.facts : undefined,
  };
}

function staticManifestEntries() {
  return getArchiveEntries().map((entry): ArchiveManifestEntry => ({
    slug: entry.slug,
    category: entry.category,
    section: entry.section,
    title: entry.title,
    englishTitle: entry.englishTitle,
    aliases: entry.aliases,
    summary: entry.summary,
    monogram: entry.monogram,
    accent: entry.accent,
    characterRole: entry.characterRole,
    personalPage: entry.personalPage,
    presentation: entry.presentation,
    facts: entry.facts,
  }));
}

export async function getPublicArchiveEntries() {
  if (!dynamicArchiveAvailable()) return sortArchiveEntries(getArchiveEntries());
  const cached = await readPublicArchiveCache<ArchiveEntry[]>(publicArchiveCacheKeys.entries);
  if (cached) return sortArchiveEntries(cached);
  try {
    const rows = await listPublishedEntries();
    const entries = rows.length
      ? rows.map((row) => toArchiveEntry(row.payload, row.plainText))
      : getArchiveEntries();
    if (rows.length) await writePublicArchiveCache(publicArchiveCacheKeys.entries, entries);
    return sortArchiveEntries(entries);
  } catch {
    return sortArchiveEntries(getArchiveEntries());
  }
}

export async function getPublicArchiveNavigationEntries() {
  if (!dynamicArchiveAvailable()) return sortArchiveEntries(staticManifestEntries());
  const cached = await readPublicArchiveCache<ArchiveManifestEntry[]>(publicArchiveCacheKeys.navigation);
  if (cached) return sortArchiveEntries(cached);
  try {
    const rows = await listPublishedEntrySummaries();
    const entries = rows.length
      ? rows.map(toManifestEntry)
      : staticManifestEntries();
    if (rows.length) await writePublicArchiveCache(publicArchiveCacheKeys.navigation, entries);
    return sortArchiveEntries(entries);
  } catch {
    return sortArchiveEntries(staticManifestEntries());
  }
}

export const getPublicArchiveEntry = cache(async function getPublicArchiveEntry(category: string, slug: string) {
  if (!dynamicArchiveAvailable()) return getArchiveEntry(category, slug);
  const key = publicArchiveCacheKeys.entry(category, slug);
  const cached = await readPublicArchiveCache<ArchiveEntry>(key);
  if (cached) return cached;
  try {
    const row = await getPublishedEntry(slug);
    if (!row || row.category !== category) return getArchiveEntry(category, slug);
    const entry = toArchiveEntry(row.payload, row.plainText);
    await writePublicArchiveCache(key, entry);
    return entry;
  } catch {
    return getArchiveEntry(category, slug);
  }
});

export async function getPublicSearchIndex() {
  if (!dynamicArchiveAvailable()) return getSearchIndex();
  const cached = await readPublicArchiveCache<ReturnType<typeof getSearchIndex>>(publicArchiveCacheKeys.search);
  if (cached) return cached;
  try {
    const entries = await listPublishedSearchEntries();
    if (!entries.length) return getSearchIndex();
    const index = entries.map((entry) => ({
      title: entry.title,
      englishTitle: entry.englishTitle || undefined,
      aliases: entry.aliases,
      category: entry.category,
      section: entry.section as ArchiveManifestEntry["section"],
      characterRole: entry.characterRole || undefined,
      presentation: entry.presentation,
      summary: entry.summary,
      href: archiveHref(entry),
      text: entry.plainText,
    }));
    await writePublicArchiveCache(publicArchiveCacheKeys.search, index);
    return index;
  } catch {
    return getSearchIndex();
  }
}
