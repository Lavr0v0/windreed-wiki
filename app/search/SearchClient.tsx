"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  archiveSectionById,
  archiveSections,
  siteHref,
  type ArchiveSection,
} from "../archive-manifest";
import { englishSections } from "../english-navigation";
import { NavigationPendingSignal, PendingLink } from "../components/PendingLink";

export type SearchIndexItem = {
  title: string;
  englishTitle?: string;
  aliases: string[];
  section: ArchiveSection;
  summary: string;
  href: string;
  text: string;
};

type SearchCollection = ArchiveSection | "all";
const searchFilters: SearchCollection[] = ["all", ...archiveSections.map((section) => section.id)];

function highlight(text: string, query: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let found = lower.indexOf(needle);
  while (found >= 0) {
    parts.push(text.slice(cursor, found));
    parts.push(<mark key={`${found}-${needle}`}>{text.slice(found, found + needle.length)}</mark>);
    cursor = found + needle.length;
    found = lower.indexOf(needle, cursor);
  }
  parts.push(text.slice(cursor));
  return parts;
}

function makeSnippet(item: SearchIndexItem, query: string) {
  if (!query) return item.summary;
  const position = item.text.toLowerCase().indexOf(query.toLowerCase());
  if (position < 0) return item.summary;
  const start = Math.max(0, position - 48);
  const end = Math.min(item.text.length, position + query.length + 92);
  return `${start > 0 ? "…" : ""}${item.text.slice(start, end)}${end < item.text.length ? "…" : ""}`;
}

export function SearchClient({
  index,
  locale = "zh",
}: {
  index: SearchIndexItem[];
  locale?: "en" | "zh";
}) {
  const router = useRouter();
  const queryRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [navigationPending, startNavigationTransition] = useTransition();
  const activeQuery = searchParams.get("q")?.trim() ?? "";
  const sectionParam = searchParams.get("section");
  const legacyCategory = searchParams.get("category");
  const legacySection: ArchiveSection | null = legacyCategory === "members"
    ? "lives"
    : legacyCategory === "characters"
      ? "companions"
      : legacyCategory === "world"
        ? "lore"
        : legacyCategory === "history"
          ? "chronicle"
          : null;
  const category: SearchCollection =
    sectionParam && archiveSections.some((section) => section.id === sectionParam)
      ? (sectionParam as ArchiveSection)
      : legacySection
        ? legacySection
      : "all";

  const results = useMemo(() => {
    const needle = activeQuery.toLowerCase();
    return index
      .filter((item) => {
        if (category === "all") return true;
        return item.section === category;
      })
      .filter((item) => {
        if (!needle) return true;
        return [item.title, item.englishTitle, ...item.aliases, item.summary, item.text]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        if (!needle) return a.title.localeCompare(b.title, locale === "en" ? "en" : "zh-CN");
        const score = (item: SearchIndexItem) =>
          item.title.toLowerCase().includes(needle) ? 0 : item.aliases.join(" ").toLowerCase().includes(needle) ? 1 : 2;
        return score(a) - score(b);
      });
  }, [activeQuery, category, index, locale]);

  const sectionCounts = useMemo(() => Object.fromEntries(
    archiveSections.map((section) => [
      section.id,
      index.filter((item) => item.section === section.id).length,
    ]),
  ) as Record<ArchiveSection, number>, [index]);
  const emptySection = !activeQuery && category !== "all" && sectionCounts[category] === 0;

  useEffect(() => {
    if (window.innerWidth > 960 && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      queryRef.current?.focus({ preventScroll: true });
    }
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const trimmed = String(form.get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (category !== "all") params.set("section", category);
    startNavigationTransition(() => {
      const searchPath = locale === "en" ? "/en/search" : siteHref("/search");
      router.replace(params.size ? `${searchPath}?${params}` : searchPath);
    });
  }

  function chooseCategory(value: SearchCollection) {
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    if (value !== "all") params.set("section", value);
    startNavigationTransition(() => {
      const searchPath = locale === "en" ? "/en/search" : siteHref("/search");
      router.replace(params.size ? `${searchPath}?${params}` : searchPath);
    });
  }

  return (
    <div className="search-page">
      <NavigationPendingSignal pending={navigationPending} />
      <div className="breadcrumbs">
        <PendingLink href={locale === "en" ? "/en" : siteHref("/")} prefetch={false}>
          {locale === "en" ? "Overview" : "总览"}
        </PendingLink>
        <span>/</span>
        <span>{locale === "en" ? "Full archive index" : "全文索引"}</span>
      </div>
      <header className="search-header">
        <span className="eyebrow">FULL TEXT INDEX</span>
        <h1>{locale === "en" ? "Full archive index" : "全文索引"}</h1>
        <p>
          {locale === "en"
            ? "Search every person, place, relic, and event included in the English translation snapshot."
            : "检索所有已经进入公开目录的人物、地点、物件与事件。"}
        </p>
      </header>

      <form className="search-panel" onSubmit={submit} role="search">
        <label htmlFor="archive-query">{locale === "en" ? "Keywords" : "关键词"}</label>
        <div className="search-input-row">
          <span aria-hidden="true">⌕</span>
          <input
            id="archive-query"
            name="q"
            defaultValue={activeQuery}
            key={activeQuery}
            placeholder={locale === "en" ? "Try: Shirul, Neverwinter, oath" : "例如：雪露、Neverwinter、誓言"}
            ref={queryRef}
          />
          <button type="submit">{locale === "en" ? "Search" : "搜索"}</button>
        </div>
        <div className="search-filters" aria-label={locale === "en" ? "Filter by section" : "分类筛选"}>
          {searchFilters.map((value) => (
            <button
              aria-controls="archive-search-results"
              aria-pressed={category === value}
              type="button"
              className={category === value ? "active" : undefined}
              onClick={() => chooseCategory(value)}
              key={value}
            >
              {value === "all" ? (
                <><strong>ALL</strong><span>{locale === "en" ? "All entries" : "全部"}</span></>
              ) : (
                <>
                  <strong>{archiveSectionById[value].english}</strong>
                  <span>{locale === "en" ? englishSections[value].title : archiveSectionById[value].chinese}</span>
                </>
              )}
              <small className="search-filter-count">
                {value === "all" ? index.length : sectionCounts[value]}
              </small>
            </button>
          ))}
        </div>
      </form>

      <div className="search-result-meta" aria-live="polite" role="status">
        <strong>{results.length}</strong> {locale === "en" ? (results.length === 1 ? "entry" : "entries") : "个条目"}
        {activeQuery && (
          <Fragment>
            {locale === "en" ? " matching " : "包含“"}
            <span>{activeQuery}</span>
            {locale === "zh" && "”"}
          </Fragment>
        )}
      </div>

      <div className="search-results" id="archive-search-results">
        {results.map((item) => (
          <PendingLink className="search-result" href={item.href} key={item.href} prefetch={false}>
            <div>
              <span className="result-category">
                {archiveSectionById[item.section].english} · {locale === "en"
                  ? englishSections[item.section].title
                  : archiveSectionById[item.section].chinese}
              </span>
              <h2>{highlight(item.title, activeQuery)}</h2>
              {item.englishTitle && <small>{highlight(item.englishTitle, activeQuery)}</small>}
              <p>{highlight(makeSnippet(item, activeQuery), activeQuery)}</p>
            </div>
            <span className="result-arrow" aria-hidden="true">→</span>
          </PendingLink>
        ))}
        {results.length === 0 && (
          <div className="empty-results">
            <span>∅</span>
            <h2>
              {emptySection
                ? locale === "en" ? "This section is awaiting its first entry" : "此卷尚未收录档案"
                : locale === "en" ? "No matching entry" : "没有找到对应档案"}
            </h2>
            <p>
              {emptySection
                ? locale === "en"
                  ? `The ${englishSections[category].title} section is in the catalogue, but its first public entries are still being prepared.`
                  : `${archiveSectionById[category].chinese}卷已经列入目录，首批公开档案仍在整理中。`
                : locale === "en"
                  ? "Try a shorter keyword or switch the filter back to all entries."
                  : "可以缩短关键词，或切换到“全部”分类后重试。"}
            </p>
            {emptySection && (
              <button className="empty-results-action" onClick={() => chooseCategory("all")} type="button">
                {locale === "en" ? "Browse all entries" : "浏览全部档案"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
