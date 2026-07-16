"use client";

import { FormEvent, Fragment, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { categoryLabels, type ArchiveCategory } from "../archive-manifest";

export type SearchIndexItem = {
  title: string;
  englishTitle?: string;
  aliases: string[];
  category: ArchiveCategory;
  summary: string;
  href: string;
  text: string;
};

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
  const activeQuery = searchParams.get("q")?.trim() ?? "";
  const categoryParam = searchParams.get("category");
  const category: ArchiveCategory | "all" =
    categoryParam && ["characters", "world", "history"].includes(categoryParam)
      ? (categoryParam as ArchiveCategory)
      : "all";

  const results = useMemo(() => {
    const needle = activeQuery.toLowerCase();
    return index
      .filter((item) => category === "all" || item.category === category)
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
    if (category !== "all") params.set("category", category);
    router.replace(params.size ? `/search?${params}` : "/search");
  }

  function chooseCategory(value: ArchiveCategory | "all") {
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    if (value !== "all") params.set("category", value);
    router.replace(params.size ? `/search?${params}` : "/search");
  }

  return (
    <div className="search-page">
      <div className="breadcrumbs"><Link href="/">总览</Link><span>/</span><span>全文索引</span></div>
      <header className="search-header">
        <span className="eyebrow">FULL TEXT INDEX</span>
        <h1>全文索引</h1>
        <p>检索所有已经进入公开目录的人物、地点、物件与事件。</p>
      </header>

      <form className="search-panel" onSubmit={submit} role="search">
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
          {(["all", "characters", "world", "history"] as const).map((value) => (
            <button
              type="button"
              className={category === value ? "active" : undefined}
              onClick={() => chooseCategory(value)}
              key={value}
            >
              {value === "all" ? "全部" : categoryLabels[value]}
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
          <Link className="search-result" href={item.href} key={item.href}>
            <div>
              <span className="result-category">{categoryLabels[item.category]}</span>
              <h2>{highlight(item.title, activeQuery)}</h2>
              {item.englishTitle && <small>{highlight(item.englishTitle, activeQuery)}</small>}
              <p>{highlight(makeSnippet(item, activeQuery), activeQuery)}</p>
            </div>
            <span className="result-arrow" aria-hidden="true">→</span>
          </Link>
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
