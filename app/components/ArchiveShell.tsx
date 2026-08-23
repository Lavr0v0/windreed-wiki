"use client";

import { FormEvent, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
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
import {
  englishArchiveHref,
  englishNavigationManifest,
  englishSections,
} from "../english-navigation";
import { NavigationPendingSignal, PendingLink } from "./PendingLink";
import { useModalDialog } from "./useModalDialog";

const navigationCollections = archiveCollections.map((collection) => ({
  ...collection,
  sections: archiveSections.filter((section) => section.collection === collection.id),
}));

let navigationEntriesRequest: Promise<ArchiveManifestEntry[]> | null = null;

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="utility-icon" focusable="false" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="5.75" />
      <path d="m15 15 4.25 4.25" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="utility-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M5 16.75V19h2.25L18.4 7.85l-2.25-2.25L5 16.75Z" />
      <path d="m14.9 6.85 2.25 2.25" />
    </svg>
  );
}

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
  englishMode,
  entries,
  index,
  pathname,
  section,
}: {
  englishMode: boolean;
  entries: ArchiveManifestEntry[];
  index: number;
  pathname: string;
  section: (typeof archiveSections)[number];
}) {
  const panelId = useId();
  const [open, setOpen] = useState(true);
  const entryHref = (entry: ArchiveManifestEntry) =>
    englishMode ? englishArchiveHref(entry) : archiveHref(entry);
  const isCurrentSection = entries.some((entry) => pathname === entryHref(entry));

  useEffect(() => {
    if (!window.matchMedia("(max-width: 960px)").matches) return;
    const stored = window.sessionStorage.getItem(`windreed:nav:${section.id}`);
    const frame = window.requestAnimationFrame(() => {
      setOpen(stored === null ? isCurrentSection : stored === "open");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isCurrentSection, section.id]);

  function toggleSection() {
    setOpen((value) => {
      const next = !value;
      if (window.matchMedia("(max-width: 960px)").matches) {
        window.sessionStorage.setItem(`windreed:nav:${section.id}`, next ? "open" : "closed");
      }
      return next;
    });
  }

  return (
    <div className="tree-disclosure" data-state={open ? "open" : "closed"}>
      <div className="tree-section-row">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          aria-label={englishMode
            ? `${open ? "Collapse" : "Expand"} ${englishSections[section.id].title}`
            : `${open ? "收起" : "展开"}${section.english} ${section.chinese}`}
          className="tree-disclosure-trigger"
          onClick={toggleSection}
          type="button"
        >
          <span className="tree-twist" aria-hidden="true">›</span>
          <span className="tree-section-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="tree-section-name">
            <strong>{section.english}</strong>
            <small>{englishMode ? englishSections[section.id].title : section.chinese}</small>
          </span>
        </button>
      </div>
      <div
        aria-hidden={!open}
        className="tree-children-shell"
        data-state={open ? "open" : "closed"}
        id={panelId}
      >
        <div className="tree-children-clip">
          <div className="tree-children">
            <PendingLink className="tree-index-link" href={`${englishMode ? "/en/search" : siteHref("/search")}?section=${section.id}`} prefetch={false}>
              {englishMode ? "Section index" : "卷页索引"}
            </PendingLink>
            {entries.map((entry) => {
              const href = entryHref(entry);
              return (
                <PendingLink
                  className={pathname === href ? "tree-link active" : "tree-link"}
                  href={href}
                  key={entry.slug}
                  prefetch={false}
                >
                  <span className="leaf-mark" style={{ background: entry.accent }} />
                  <span>{entry.title}</span>
                  {!englishMode && entry.englishTitle && <small>{entry.englishTitle}</small>}
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPending, startSearchTransition] = useTransition();
  const [navigationEntries, setNavigationEntries] = useState<ArchiveManifestEntry[]>(archiveManifest);
  const isEditorRoute = pathname === "/edit" || pathname.startsWith("/edit/");
  const englishMode = pathname === "/en" || pathname.startsWith("/en/");
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useModalDialog({
    dialogRef: menuDialogRef,
    lockScroll: true,
    onClose: closeMenu,
    open: menuOpen,
    triggerRef: menuButtonRef,
  });

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
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = englishMode ? "en" : "zh-CN";
    return () => {
      document.documentElement.lang = previousLang;
    };
  }, [englishMode]);

  useEffect(() => {
    if (isEditorRoute || englishMode) {
      return;
    }
    let active = true;
    loadNavigationEntries()
      .then((entries) => {
        if (active && entries.length) setNavigationEntries(entries);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [englishMode, isEditorRoute]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    closeMenu();
    startSearchTransition(() => {
      router.push(
        trimmed
          ? `${englishMode ? "/en/search" : siteHref("/search")}?q=${encodeURIComponent(trimmed)}`
          : englishMode ? "/en/search" : siteHref("/search"),
      );
    });
  }

  function skipToContent(event: React.MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById("site-content");
    if (!main) return;
    event.preventDefault();
    window.history.replaceState(null, "", "#site-content");
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start" });
  }

  if (isEditorRoute) return children;

  const visibleNavigationEntries = englishMode ? englishNavigationManifest : navigationEntries;

  const sidebar = (
    <>
      <div className="nav-intro">
        <span className="nav-kicker">PUBLIC ARCHIVE</span>
        <p>{englishMode ? "Faerûn · Sword Coast North" : "费伦 · 剑湾北境"}</p>
        <span className="nav-year">1492 DR</span>
      </div>
      <nav className="archive-tree" aria-label={englishMode ? "Archive catalogue" : "档案目录"}>
        <PendingLink
          className={pathname === (englishMode ? "/en" : siteHref("/")) ? "tree-home active" : "tree-home"}
          href={englishMode ? "/en" : siteHref("/")}
          prefetch={false}
        >
          <span className="tree-glyph">⌂</span>
          {englishMode ? "Overview" : "总览"}
        </PendingLink>
        {navigationCollections.map((collection) => (
          <section className="tree-collection" key={collection.id}>
            <div className="tree-collection-heading">
              <strong>{collection.english}</strong>
              <span>
                {englishMode
                  ? collection.id === "archives" ? "People, places & lore" : "Tales, roads & fortunes"
                  : collection.chinese}
              </span>
            </div>
            {collection.sections.map((section) => {
              const entries = visibleNavigationEntries.filter((entry) => entry.section === section.id);
              const index = archiveSections.findIndex((candidate) => candidate.id === section.id);
              return (
                <ArchiveTreeSection
                  englishMode={englishMode}
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
    <div className="site-frame" data-locale={englishMode ? "en" : "zh"} lang={englishMode ? "en" : "zh-CN"}>
      <a className="skip-link" href="#site-content" onClick={skipToContent}>
        {englishMode ? "Skip to main content" : "跳到正文"}
      </a>
      <header className="topbar">
        <span className="scroll-progress" aria-hidden="true" />
        <NavigationPendingSignal pending={searchPending} />
        <button
          className={menuOpen ? "menu-button open" : "menu-button"}
          type="button"
          aria-label={englishMode
            ? menuOpen ? "Close catalogue" : "Open catalogue"
            : menuOpen ? "关闭目录" : "打开目录"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuButtonRef}
        >
          <span />
          <span />
          <span />
        </button>
        <PendingLink
          className="site-brand"
          href={englishMode ? "/en" : siteHref("/")}
          aria-label={englishMode ? "The Windreed Wayfarers home" : "The Windreed Wayfarers 首页"}
          prefetch={false}
        >
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
            <small>{englishMode ? "English · Public Archive" : "风芦旅人 · 公开档案"}</small>
          </span>
        </PendingLink>
        <form className="top-search" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-search">
            {englishMode ? "Search the archive" : "搜索档案"}
          </label>
          <span className="top-search-icon" aria-hidden="true"><SearchIcon /></span>
          <input
            id="site-search"
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={englishMode ? "Search people, places, or lore" : "搜索人物、地点或关键词"}
          />
          <kbd>/</kbd>
          <button className="top-search-submit" type="submit">
            <strong>{englishMode ? "Browse" : "查阅"}</strong>
            <small>{englishMode ? "Search & index" : "搜索与索引"}</small>
          </button>
        </form>
        <nav className="topbar-actions" aria-label={englishMode ? "Site tools" : "网站工具"}>
          <PendingLink
            aria-label={englishMode ? "Browse the archive: search and index" : "查阅档案：搜索与索引"}
            className="topbar-action top-search-link"
            href={englishMode ? "/en/search" : siteHref("/search")}
            prefetch={false}
            title={englishMode ? "Search or browse the archive" : "搜索或浏览全部档案"}
          >
            <span className="topbar-action-icon" aria-hidden="true"><SearchIcon /></span>
            <span className="topbar-action-copy">
              <strong>{englishMode ? "Browse" : "查阅"}</strong>
              <small>{englishMode ? "Search & index" : "搜索与索引"}</small>
            </span>
          </PendingLink>
          {englishMode ? (
            <PendingLink
              className="topbar-action top-edit-link"
              href={siteHref("/")}
              prefetch={false}
              title="阅读中文版"
            >
              <span className="topbar-action-icon" aria-hidden="true">中</span>
              <span className="topbar-action-copy"><strong>中文版</strong><small>切换语言</small></span>
            </PendingLink>
          ) : (
            <a
              className="topbar-action top-edit-link"
              href="https://edit.windreed.wiki/"
              title="进入档案修史室"
            >
              <span className="topbar-action-icon" aria-hidden="true"><EditIcon /></span>
              <span className="topbar-action-copy"><strong>编辑</strong><small>进入修史室</small></span>
            </a>
          )}
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
            aria-label={englishMode ? "Close catalogue" : "关闭目录"}
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="mobile-sidebar"
            aria-label={englishMode ? "Mobile archive catalogue" : "移动端档案目录"}
            aria-modal="true"
            ref={menuDialogRef}
            role="dialog"
            tabIndex={-1}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
              }}
            >
              <button className="mobile-sidebar-close" data-dialog-initial-focus onClick={closeMenu} type="button">
                <span>ARCHIVE CATALOGUE</span>
                <strong>{englishMode ? "Close catalogue" : "关闭目录"}</strong>
                <i aria-hidden="true">×</i>
              </button>
              <form className="mobile-drawer-search" role="search" onSubmit={submitSearch}>
                <label className="sr-only" htmlFor="mobile-site-search">
                  {englishMode ? "Search the archive" : "搜索档案"}
                </label>
                <span aria-hidden="true">⌕</span>
                <input
                  id="mobile-site-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={englishMode ? "Search the public archive" : "搜索公开档案"}
                  value={query}
                />
                <button type="submit">{englishMode ? "Search" : "搜索"}</button>
              </form>
              {sidebar}
            </aside>
      </div>

      <main className="site-content" id="site-content" tabIndex={-1}>
        <div className="route-stage" key={pathname}>{children}</div>
      </main>
    </div>
  );
}
