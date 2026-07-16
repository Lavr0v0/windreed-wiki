import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveHref,
  archiveManifest,
  categoryLabels,
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

  const related = archiveManifest
    .filter((candidate) => candidate.category === entry.category && candidate.slug !== entry.slug)
    .slice(0, 4);

  return (
    <div className="archive-page">
      <div className="breadcrumbs" aria-label="面包屑">
        <Link href={siteHref("/")}>总览</Link>
        <span aria-hidden="true">/</span>
        <Link href={`${siteHref("/search")}?category=${entry.category}`}>{categoryLabels[entry.category]}</Link>
        <span aria-hidden="true">/</span>
        <span>{entry.title}</span>
      </div>

      <div className="article-layout">
        <article className="archive-article">
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
                {entry.presentation === "glossary" ? "世界词条" : categoryLabels[entry.category]}
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

          <MarkdownView markdown={entry.body} />

          <footer className="article-footer">
            <span>ARCHIVE ENTRY</span>
            <strong>The Windreed Wayfarers</strong>
          </footer>
        </article>

        <aside className="article-rail">
          {entry.headings.length > 0 && (
            <nav className="page-toc" aria-label="本页目录">
              <span>本页目录</span>
              {entry.headings.map((heading) => (
                <a
                  className={heading.level === 3 ? "toc-sub" : undefined}
                  href={`#${heading.id}`}
                  key={`${heading.level}-${heading.id}`}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          )}
          <div className="related-panel">
            <span>同类档案</span>
            {related.map((candidate) => (
              <Link href={archiveHref(candidate)} key={candidate.slug}>
                <i style={{ background: candidate.accent }} />
                <span>{candidate.title}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
