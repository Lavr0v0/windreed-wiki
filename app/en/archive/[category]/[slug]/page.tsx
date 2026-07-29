import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveSections } from "../../../../archive-manifest";
import {
  englishArchiveHref,
  englishArchiveManifest,
  englishSnapshotDate,
  englishSections,
  getEnglishArchiveEntry,
} from "../../../../english-content";
import { ArticleToc } from "../../../../components/ArticleToc";
import { MarkdownView } from "../../../../components/MarkdownView";
import { PendingLink } from "../../../../components/PendingLink";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return englishArchiveManifest.map((entry) => ({
    category: entry.category,
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const entry = getEnglishArchiveEntry(category, slug);
  if (!entry) return {};
  const href = englishArchiveHref(entry);
  return {
    title: entry.title,
    description: entry.summary,
    alternates: {
      canonical: href,
      languages: {
        en: href,
        "zh-CN": `/archive/${entry.category}/${entry.slug}`,
      },
    },
    openGraph: {
      title: entry.title,
      description: entry.summary,
      type: "article",
      url: href,
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.summary,
      images: ["/og.png"],
    },
  };
}

export default async function EnglishArchivePage({ params }: PageProps) {
  const { category, slug } = await params;
  const entry = getEnglishArchiveEntry(category, slug);
  if (!entry) notFound();

  const isMember = entry.characterRole === "member";
  const memberNumber = isMember
    ? englishArchiveManifest
        .filter((candidate) => candidate.characterRole === "member")
        .findIndex((candidate) => candidate.slug === entry.slug) + 1
    : 0;
  const section = archiveSections.find((candidate) => candidate.id === entry.section);
  const sectionCopy = englishSections[entry.section];

  return (
    <div className="archive-page">
      <div className="breadcrumbs" aria-label="Breadcrumbs">
        <PendingLink href="/en" prefetch={false}>Overview</PendingLink>
        <span aria-hidden="true">/</span>
        <PendingLink href={`/en/search?section=${entry.section}`} prefetch={false}>
          {section?.english} · {sectionCopy.title}
        </PendingLink>
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
              <b>{String(memberNumber).padStart(2, "0")} / 06</b>
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
                {section?.english} · {sectionCopy.title}
              </span>
              <h1>{entry.title}</h1>
              <p className="article-english">
                Original Chinese title · <span lang="zh-CN">{entry.originalTitle}</span>
              </p>
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

          <MarkdownView markdown={entry.body} />

          <footer className="article-footer">
            <span>TRANSLATION SNAPSHOT · {englishSnapshotDate.toUpperCase()}</span>
            <b className="article-folio" aria-label={`Archive entry: ${entry.title}`}>
              {entry.monogram}
            </b>
            <strong>{entry.title} · 1492 DR</strong>
          </footer>
        </article>

        <ArticleToc headings={entry.headings} locale="en" />
      </div>
    </div>
  );
}
