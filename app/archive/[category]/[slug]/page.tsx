import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveManifest,
  archiveSectionById,
  entryCollectionLabel,
  partyMemberEntries,
  siteHref,
} from "../../../archive-manifest";
import { getArchiveEntry } from "../../../archive-content.server";
import { MarkdownView } from "../../../components/MarkdownView";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return archiveManifest.map((entry) => ({
    category: entry.category,
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = getArchiveEntry(category, slug);
  if (!entry) return {};
  return {
    title: entry.englishTitle
      ? `${entry.title} ${entry.englishTitle}`
      : entry.title,
    description: entry.summary,
  };
}

export default async function ArchivePage({ params }: PageProps) {
  const { category, slug } = await params;
  const entry = getArchiveEntry(category, slug);
  if (!entry) notFound();

  const isMember = entry.characterRole === "member";
  const memberNumber = isMember
    ? partyMemberEntries().findIndex((candidate) => candidate.slug === entry.slug) + 1
    : 0;
  const collectionLabel = entryCollectionLabel(entry);
  const collection = archiveSectionById[entry.section];

  return (
    <div className="archive-page">
      <div className="breadcrumbs" aria-label="面包屑">
        <Link href={siteHref("/")}>总览</Link>
        <span aria-hidden="true">/</span>
        <Link href={`${siteHref("/search")}?section=${entry.section}`}>{collection.english} · {collectionLabel}</Link>
        <span aria-hidden="true">/</span>
        <span>{entry.title}</span>
      </div>

      <div className="article-layout">
        <article
          className={isMember ? "archive-article member-archive-article" : "archive-article"}
          style={{ "--entry-accent": entry.accent } as React.CSSProperties}
        >
          {isMember && (
            <div className="member-article-ribbon" data-reveal>
              <span>PARTY MEMBER</span>
              <b>{String(memberNumber).padStart(2, "0")} / 06</b>
            </div>
          )}
          <header className="article-header" data-reveal>
            <div
              className="article-monogram"
              style={{ "--entry-accent": entry.accent } as React.CSSProperties}
              aria-hidden="true"
            >
              {entry.monogram}
            </div>
            <div className="article-heading-copy">
              <span className="article-category">
                {collection.english} · {collectionLabel}
              </span>
              <h1>{entry.title}</h1>
              {entry.englishTitle && <p className="article-english">{entry.englishTitle}</p>}
              <p className="article-summary">{entry.summary}</p>
            </div>
          </header>

          {entry.facts && (
            <dl className="fact-grid" data-reveal>
              {entry.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <MarkdownView markdown={entry.body} />

          <footer className="article-footer">
            <span>THE WINDREED CHRONICLES</span>
            <b className="article-folio" aria-label={`档案：${entry.title}`}>{entry.monogram}</b>
            <strong>{entry.title} · 1492 DR</strong>
          </footer>
        </article>

        <aside className="article-rail">
          {entry.headings.length > 0 && (
            <nav className="page-toc" aria-label="本页目录">
              <span>本页目录</span>
              {entry.headings.map((heading) => (
                <a
                  className={heading.level === 3 ? "toc-sub" : undefined}
                  data-toc-link
                  href={`#${heading.id}`}
                  key={`${heading.level}-${heading.id}`}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}
