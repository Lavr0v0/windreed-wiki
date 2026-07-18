"use client";

import { FormEvent, useEffect, useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  archiveCollections,
  archiveHref,
  archiveSections,
  siteHref,
  type ArchiveManifestEntry,
} from "../archive-manifest";
import { archiveManifest } from "../archive-manifest";
import { NavigationPendingSignal, PendingLink } from "./PendingLink";

const navigationCollections = archiveCollections.map((collection) => ({
  ...collection,
  sections: archiveSections.filter((section) => section.collection === collection.id),
}));

let navigationEntriesRequest: Promise<ArchiveManifestEntry[]> | null = null;

function loadNavigationEntries() {
  if (!navigationEntriesRequest) {
    navigationEntriesRequest = fetch("/api/public/navigation")
      .then(async (response) => {
        if (!response.ok) throw new Error("Dynamic archive navigation unavailable");
        return await response.json() as { entries?: ArchiveManifestEntry[] };
      })
      .then((data) => Array.isArray(data.entries) ? data.entries : [])
      .catch((error) => {
        navigationEntriesRequest = null;
        throw error;
      });
  }
  return navigationEntriesRequest;
}

function ArchiveTreeSection({
  entries,
  index,
  pathname,
  section,
}: {
  entries: ArchiveManifestEntry[];
  index: number;
  pathname: string;
  section: (typeof archiveSections)[number];
}) {
  const panelId = useId();
  const [open, setOpen] = useState(true);

  return (
    <div className="tree-disclosure" data-state={open ? "open" : "closed"}>
      <div className="tree-section-row">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          aria-label={`${open ? "收起" : "展开"}${section.english} ${section.chinese}`}
          className="tree-disclosure-trigger"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span className="tree-twist" aria-hidden="true">›</span>
          <span className="tree-section-number">{String(index + 1).padStart(2, "0")}</span>
        </button>
        <PendingLink
          className="tree-section-name"
          href={`${siteHref("/search")}?section=${section.id}`}
          prefetch={false}
        >
          <strong>{section.english}</strong>
          <small>{section.chinese}</small>
        </PendingLink>
      </div>
      <div
        aria-hidden={!open}
        className="tree-children-shell"
        data-state={open ? "open" : "closed"}
        id={panelId}
      >
        <div className="tree-children-clip">
          <div className="tree-children">
            <PendingLink className="tree-index-link" href={`${siteHref("/search")}?section=${section.id}`} prefetch={false}>
              卷页索引
            </PendingLink>
            {entries.map((entry) => {
              const href = archiveHref(entry);
              return (
                <PendingLink
                  className={pathname === href ? "tree-link active" : "tree-link"}
                  href={href}
                  key={entry.slug}
                  prefetch={false}
                >
                  <span className="leaf-mark" style={{ background: entry.accent }} />
                  <span>{entry.title}</span>
                  {entry.englishTitle && <small>{entry.englishTitle}</small>}
                </PendingLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchiveShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPending, startSearchTransition] = useTransition();
  const [navigationEntries, setNavigationEntries] = useState<ArchiveManifestEntry[]>(archiveManifest);
  const isEditorRoute = pathname === "/edit" || pathname.startsWith("/edit/");

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

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isEditorRoute) return;
    let active = true;
    loadNavigationEntries()
      .then((entries) => {
        if (active && entries.length) setNavigationEntries(entries);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isEditorRoute]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    startSearchTransition(() => {
      router.push(
        trimmed
          ? `${siteHref("/search")}?q=${encodeURIComponent(trimmed)}`
          : siteHref("/search"),
      );
    });
  }

  if (isEditorRoute) return children;

  const sidebar = (
    <>
      <div className="nav-intro">
        <span className="nav-kicker">PUBLIC ARCHIVE</span>
        <p>费伦 · 剑湾北境</p>
        <span className="nav-year">1492 DR</span>
      </div>
      <nav className="archive-tree" aria-label="档案目录">
        <PendingLink className={pathname === siteHref("/") ? "tree-home active" : "tree-home"} href={siteHref("/")} prefetch={false}>
          <span className="tree-glyph">⌂</span>
          总览
        </PendingLink>
        {navigationCollections.map((collection) => (
          <section className="tree-collection" key={collection.id}>
            <div className="tree-collection-heading">
              <strong>{collection.english}</strong>
              <span>{collection.chinese}</span>
            </div>
            {collection.sections.map((section) => {
              const entries = navigationEntries.filter((entry) => entry.section === section.id);
              const index = archiveSections.findIndex((candidate) => candidate.id === section.id);
              return (
                <ArchiveTreeSection
                  entries={entries}
                  index={index}
                  key={section.id}
                  pathname={pathname}
                  section={section}
                />
              );
            })}
          </section>
        ))}
      </nav>
      <div className="nav-footer">The Windreed Wayfarers</div>
    </>
  );

  return (
    <div className="site-frame">
      <header className="topbar">
        <span className="scroll-progress" aria-hidden="true" />
        <NavigationPendingSignal pending={searchPending} />
        <button
          className={menuOpen ? "menu-button open" : "menu-button"}
          type="button"
          aria-label={menuOpen ? "关闭目录" : "打开目录"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <PendingLink className="site-brand" href={siteHref("/")} aria-label="The Windreed Wayfarers 首页" prefetch={false}>
          <span className="brand-seal" data-logo-slot="site" aria-hidden="true">
            <Image
              alt=""
              className="brand-logo"
              height={42}
              priority
              src={siteHref("/brand/final/windreed-logo-on-dark.svg")}
              unoptimized
              width={42}
            />
          </span>
          <span>
            <strong>The Windreed Wayfarers</strong>
            <small>风芦旅人 · 公开档案</small>
          </span>
        </PendingLink>
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
        <nav className="topbar-actions" aria-label="网站工具">
          <PendingLink className="topbar-action top-index-link" href={siteHref("/search")} prefetch={false}>索引</PendingLink>
          <a
            className="topbar-action top-edit-link"
            href="https://edit.windreed.wiki/"
            title="进入档案修史室"
          >
            编辑
          </a>
        </nav>
      </header>

      <aside className="desktop-sidebar">{sidebar}</aside>

      <div
        aria-hidden={!menuOpen}
        className="mobile-nav-layer"
        data-state={menuOpen ? "open" : "closed"}
        inert={!menuOpen}
      >
          <button
            className="mobile-nav-scrim"
            aria-label="关闭目录"
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="mobile-sidebar"
            aria-label="移动端档案目录"
            aria-modal="true"
            role="dialog"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
            }}
          >
            {sidebar}
          </aside>
      </div>

      <main className="site-content">
        <div className="route-stage" key={pathname}>{children}</div>
      </main>
    </div>
  );
}
