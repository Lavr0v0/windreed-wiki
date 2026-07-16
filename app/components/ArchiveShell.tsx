"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  archiveHref,
  categoryLabels,
  navigationEntriesByCategory,
  siteHref,
  type ArchiveCategory,
} from "../archive-manifest";

const categories: ArchiveCategory[] = ["characters", "world", "history"];

export function ArchiveShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || target?.matches("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed
        ? `${siteHref("/search")}?q=${encodeURIComponent(trimmed)}`
        : siteHref("/search"),
    );
  }

  const sidebar = (
    <>
      <div className="nav-intro">
        <span className="nav-kicker">PUBLIC ARCHIVE</span>
        <p>费伦 · 剑湾北境</p>
        <span className="nav-year">1492 DR</span>
      </div>
      <nav className="archive-tree" aria-label="档案目录">
        <Link className={pathname === siteHref("/") ? "tree-home active" : "tree-home"} href={siteHref("/")}>
          <span className="tree-glyph">⌂</span>
          总览
        </Link>
        {categories.map((category) => (
          <details key={category} open>
            <summary>
              <span className="tree-twist" aria-hidden="true">›</span>
              {categoryLabels[category]}
            </summary>
            <div className="tree-children">
              {navigationEntriesByCategory(category)
                .map((entry) => {
                  const href = archiveHref(entry);
                  return (
                    <Link
                      className={pathname === href ? "tree-link active" : "tree-link"}
                      href={href}
                      key={entry.slug}
                    >
                      <span className="leaf-mark" style={{ background: entry.accent }} />
                      <span>{entry.title}</span>
                      {entry.englishTitle && <small>{entry.englishTitle}</small>}
                    </Link>
                  );
                })}
            </div>
            {category === "world" && (
              <p className="tree-glossary-note">地点与誓言词条由正文中的虚线链接展开</p>
            )}
          </details>
        ))}
      </nav>
      <div className="nav-footer">The Windreed Wayfarers</div>
    </>
  );

  return (
    <div className="site-frame">
      <header className="topbar">
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "关闭目录" : "打开目录"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link className="site-brand" href={siteHref("/")} aria-label="The Windreed Wayfarers 首页">
          <span className="brand-seal">W</span>
          <span>
            <strong>The Windreed Wayfarers</strong>
            <small>风芦旅人 · 公开档案</small>
          </span>
        </Link>
        <form className="top-search" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">搜索档案</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="site-search"
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索人物、地点或关键词"
          />
          <kbd>/</kbd>
        </form>
        <Link className="top-index-link" href={siteHref("/search")}>索引</Link>
      </header>

      <aside className="desktop-sidebar">{sidebar}</aside>

      {menuOpen && (
        <div className="mobile-nav-layer">
          <button
            className="mobile-nav-scrim"
            aria-label="关闭目录"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="mobile-sidebar"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
            }}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <main className="site-content">{children}</main>
    </div>
  );
}
