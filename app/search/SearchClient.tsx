"use client";

import { FormEvent, Fragment, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  archiveSectionById,
  archiveSections,
  siteHref,
  type ArchiveSection,
} from "../archive-manifest";
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
}: {
  index: SearchIndexItem[];
}) {
  const router = useRouter();
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
        if (!needle) return a.title.localeCompare(b.title, "zh-CN");
        const score = (item: SearchIndexItem) =>
          item.title.toLowerCase().includes(needle) ? 0 : item.aliases.join(" ").toLowerCase().includes(needle) ? 1 : 2;
        return score(a) - score(b);
      });
  }, [activeQuery, category, index]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const trimmed = String(form.get("q") ?? "").trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (category !== "all") params.set("section", category);
    startNavigationTransition(() => {
      router.replace(params.size ? `${siteHref("/search")}?${params}` : siteHref("/search"));
    });
  }

  function chooseCategory(value: SearchCollection) {
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    if (value !== "all") params.set("section", value);
    startNavigationTransition(() => {
      router.replace(params.size ? `${siteHref("/search")}?${params}` : siteHref("/search"));
    });
  }

  return (
    <div className="search-page">
      <NavigationPendingSignal pending={navigationPending} />
      <div className="breadcrumbs"><PendingLink href={siteHref("/")} prefetch={false}>总览</PendingLink><span>/</span><span>全文索引</span></div>
      <header className="search-header" data-reveal>
        <span className="eyebrow">FULL TEXT INDEX</span>
        <h1>全文索引</h1>
        <p>检索所有已经进入公开目录的人物、地点、物件与事件。</p>
      </header>

      <form className="search-panel" data-reveal onSubmit={submit} role="search">
        <label htmlFor="archive-query">关键词</label>
        <div className="search-input-row">
          <span aria-hidden="true">⌕</span>
          <input
            id="archive-query"
            name="q"
            defaultValue={activeQuery}
            key={activeQuery}
            placeholder="例如：雪露、Neverwinter、誓言"
            autoFocus
          />
          <button type="submit">搜索</button>
        </div>
        <div className="search-filters" aria-label="分类筛选">
          {searchFilters.map((value) => (
            <button
              type="button"
              className={category === value ? "active" : undefined}
              onClick={() => chooseCategory(value)}
              key={value}
            >
              {value === "all" ? (
                <><strong>ALL</strong><span>全部</span></>
              ) : (
                <>
                  <strong>{archiveSectionById[value].english}</strong>
                  <span>{archiveSectionById[value].chinese}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </form>

      <div className="search-result-meta">
        <strong>{results.length}</strong> 个条目
        {activeQuery && <Fragment>包含“<span>{activeQuery}</span>”</Fragment>}
      </div>

      <div className="search-results">
        {results.map((item) => (
          <PendingLink className="search-result" href={item.href} key={item.href} prefetch={false}>
            <div>
              <span className="result-category">
                {archiveSectionById[item.section].english} · {archiveSectionById[item.section].chinese}
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
            <h2>没有找到对应档案</h2>
            <p>可以缩短关键词，或切换到“全部”分类后重试。</p>
          </div>
        )}
      </div>
    </div>
  );
}
