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
  const isCurrentSection = entries.some((entry) => pathname === archiveHref(entry));

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
          aria-label={`${open ? "收起" : "展开"}${section.english} ${section.chinese}`}
          className="tree-disclosure-trigger"
          onClick={toggleSection}
          type="button"
        >
          <span className="tree-twist" aria-hidden="true">›</span>
          <span className="tree-section-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="tree-section-name">
            <strong>{section.english}</strong>
            <small>{section.chinese}</small>
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPending, startSearchTransition] = useTransition();
  const [navigationEntries, setNavigationEntries] = useState<ArchiveManifestEntry[]>(archiveManifest);
  const isEditorRoute = pathname === "/edit" || pathname.startsWith("/edit/");
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
    closeMenu();
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
      <form className="mobile-drawer-search" role="search" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="mobile-site-search">搜索档案</label>
        <span aria-hidden="true">⌕</span>
        <input
          id="mobile-site-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索公开档案"
          value={query}
        />
        <button type="submit">搜索</button>
      </form>
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
          ref={menuButtonRef}
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
          <span className="top-search-icon" aria-hidden="true"><SearchIcon /></span>
          <input
            id="site-search"
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索人物、地点或关键词"
          />
          <kbd>/</kbd>
          <button className="top-search-submit" type="submit">
            <strong>查阅</strong>
            <small>搜索与索引</small>
          </button>
        </form>
        <nav className="topbar-actions" aria-label="网站工具">
          <PendingLink
            aria-label="查阅档案：搜索与索引"
            className="topbar-action top-search-link"
            href={siteHref("/search")}
            prefetch={false}
            title="搜索或浏览全部档案"
          >
            <span className="topbar-action-icon" aria-hidden="true"><SearchIcon /></span>
            <span className="topbar-action-copy"><strong>查阅</strong><small>搜索与索引</small></span>
          </PendingLink>
          <a
            className="topbar-action top-edit-link"
            href="https://edit.windreed.wiki/"
            title="进入档案修史室"
          >
            <span className="topbar-action-icon" aria-hidden="true"><EditIcon /></span>
            <span className="topbar-action-copy"><strong>编辑</strong><small>进入修史室</small></span>
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
            ref={menuDialogRef}
            role="dialog"
            tabIndex={-1}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
              }}
            >
              <button className="mobile-sidebar-close" data-dialog-initial-focus onClick={closeMenu} type="button">
                <span>ARCHIVE CATALOGUE</span><strong>关闭目录</strong><i aria-hidden="true">×</i>
              </button>
              {sidebar}
            </aside>
      </div>

      <main className="site-content">
        <div className="route-stage" key={pathname}>{children}</div>
      </main>
    </div>
  );
}
