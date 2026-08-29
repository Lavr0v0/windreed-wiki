import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  appendSearchParams,
  archiveManifest,
  archiveHref,
  archiveSectionById,
  entryCollectionLabel,
  isArchiveRouteSegment,
  memberFolioNumber,
  partyMemberEntries,
  siteHref,
  type RouteSearchParams,
} from "../../../archive-manifest";
import { getPublicArchiveEntry } from "../../../public-archive.server";
import { MarkdownView } from "../../../components/MarkdownView";
import { PendingLink } from "../../../components/PendingLink";
import { ArticleToc } from "../../../components/ArticleToc";

type PageProps = {
  params: Promise<{ section: string; slug: string }>;
  searchParams: Promise<RouteSearchParams>;
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return archiveManifest.map((entry) => ({
    section: entry.section,
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  if (!isArchiveRouteSegment(section)) return {};
  const entry = await getPublicArchiveEntry(slug);
  if (!entry) return {};
  const title = entry.englishTitle
    ? `${entry.title} ${entry.englishTitle}`
    : entry.title;
  const href = archiveHref(entry);
  return {
    title,
    description: entry.summary,
    alternates: { canonical: href },
    openGraph: {
      title,
      description: entry.summary,
      type: "article",
      url: href,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${entry.title} · The Windreed Wayfarers` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: entry.summary,
      images: ["/og.png"],
    },
  };
}

export default async function ArchivePage({ params, searchParams }: PageProps) {
  const { section, slug } = await params;
  if (!isArchiveRouteSegment(section)) notFound();

  const [entry, query] = await Promise.all([
    getPublicArchiveEntry(slug),
    searchParams,
  ]);
  if (!entry) notFound();
  if (section !== entry.section) {
    permanentRedirect(appendSearchParams(archiveHref(entry), query));
  }

  const isMember = entry.characterRole === "member";
  const memberNumber = isMember ? memberFolioNumber(entry.slug) : null;
  const memberCount = partyMemberEntries().length;
  const collectionLabel = entryCollectionLabel(entry);
  const collection = archiveSectionById[entry.section];

  return (
    <div className="archive-page">
      <div className="breadcrumbs" aria-label="面包屑">
        <PendingLink href={siteHref("/")} prefetch={false}>总览</PendingLink>
        <span aria-hidden="true">/</span>
        <PendingLink href={`${siteHref("/search")}?section=${entry.section}`} prefetch={false}>{collection.english} · {collectionLabel}</PendingLink>
        <span aria-hidden="true">/</span>
        <span>{entry.title}</span>
      </div>

      <div className="article-layout">
        <article
          className={isMember ? "archive-article member-archive-article" : "archive-article"}
          style={{ "--entry-accent": entry.accent } as React.CSSProperties}
        >
          {isMember && (
            <div className="member-article-ribbon">
              <span>PARTY MEMBER</span>
              <b>{`${String(memberNumber).padStart(2, "0")} / ${String(memberCount).padStart(2, "0")}`}</b>
            </div>
          )}
          <header className="article-header">
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
            <dl className="fact-grid">
              {entry.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {entry.personalPage && (
            <a
              className="personal-chronicle-link"
              href={siteHref(entry.personalPage)}
            >
              <span>PERSONAL CHRONICLE</span>
              <b>翻阅人物专页</b>
              <i aria-hidden="true">↗</i>
            </a>
          )}

          <MarkdownView markdown={entry.body} />

          <footer className="article-footer">
            <span>THE WINDREED CHRONICLES</span>
            <b className="article-folio" aria-label={`档案：${entry.title}`}>{entry.monogram}</b>
            <strong>{entry.title} · 1492 DR</strong>
          </footer>
        </article>

        <ArticleToc headings={entry.headings} />
      </div>
    </div>
  );
}
