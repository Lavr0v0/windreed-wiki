import Image from "next/image";
import { archiveCollections, archiveSections, siteHref } from "../archive-manifest";
import {
  englishArchiveHref,
  englishArchiveManifest,
  englishSnapshotDate,
  englishSections,
  englishTeamOverview,
} from "../english-content";
import { MarkdownView } from "../components/MarkdownView";
import { MemberCard } from "../components/MemberCard";
import { PendingLink } from "../components/PendingLink";

export default function EnglishHome() {
  const members = englishArchiveManifest.filter((entry) => entry.characterRole === "member");
  const associates = englishArchiveManifest.filter((entry) => entry.characterRole === "associate");

  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">THE SWORD COAST · 1492 DR</span>
          <h1>The Windreed<br />Wayfarers</h1>
          <p className="hero-deck">
            Six travelers from different lives became companions on the road. This is the public
            archive of their lives, journeys, possessions, and shared history.
          </p>
          <div className="hero-actions">
            <PendingLink
              className="primary-action"
              href="/en/archive/characters/shirul"
              prefetch={false}
            >
              Begin with Shirul
            </PendingLink>
            <PendingLink className="secondary-action" href="/en/search" prefetch={false}>
              Browse the full index
            </PendingLink>
          </div>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <Image
            alt=""
            className="hero-logo"
            height={300}
            priority
            src={siteHref("/brand/final/windreed-logo-on-dark.svg")}
            unoptimized
            width={300}
          />
          <small>EST. 1491 DR</small>
        </div>
      </section>

      <section className="archive-status" aria-label="Archive overview" data-reveal>
        <div><strong>06</strong><span>Party members</span></div>
        <div><strong>{String(englishArchiveManifest.length).padStart(2, "0")}</strong><span>Translated entries</span></div>
        <div><strong>1492</strong><span>Present year · DR</span></div>
      </section>

      <aside className="english-snapshot-note" data-reveal>
        <span>TRANSLATION SNAPSHOT</span>
        <p>
          This English edition reflects the public archive as translated on{" "}
          <strong>{englishSnapshotDate}</strong>. Later changes to the living Chinese archive
          may not appear here.
        </p>
        <PendingLink href={siteHref("/")} prefetch={false}>Read the current Chinese archive ↗</PendingLink>
      </aside>

      <section className="home-section" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ARCHIVES &amp; STORIES</span>
            <h2>Browse the folios</h2>
          </div>
          <p>Lives and lore in one collection; the road they walked in another.</p>
        </div>
        <div className="archive-board-groups">
          {archiveCollections.map((collection) => (
            <section className="archive-board-group" key={collection.id}>
              <header className="archive-board-heading">
                <strong>{collection.english}</strong>
                <span>{collection.id === "archives" ? "People, places & lore" : "Tales, roads & fortunes"}</span>
              </header>
              <div className="category-grid">
                {archiveSections
                  .filter((section) => section.collection === collection.id)
                  .map((section) => {
                    const index = archiveSections.findIndex((candidate) => candidate.id === section.id);
                    const copy = englishSections[section.id];
                    return (
                      <PendingLink
                        className="category-card"
                        href={`/en/search?section=${section.id}`}
                        key={section.id}
                        prefetch={false}
                        style={{ "--card-index": index } as React.CSSProperties}
                      >
                        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="eyebrow">{section.english}</span>
                        <h3>{copy.title}</h3>
                        <p>{copy.description}</p>
                        <span className="card-link">Open the folio <span>→</span></span>
                      </PendingLink>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="home-section member-showcase" aria-labelledby="english-members-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LIVES</span>
            <h2 id="english-members-title">The company</h2>
          </div>
          <p>Six separate lives, joined by the road and the choice to keep traveling together.</p>
        </div>
        <div className="member-grid">
          {members.map((entry, index) => (
            <MemberCard
              entry={entry}
              href={englishArchiveHref(entry)}
              index={index}
              key={entry.slug}
              locale="en"
            />
          ))}
        </div>
      </section>

      <section className="home-section associates-section" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMPANIONS</span>
            <h2>Beyond the six</h2>
          </div>
          <p>People closely tied to the Wayfarers without belonging to the core company.</p>
        </div>
        <div className="people-grid associate-grid">
          {associates.map((entry) => (
            <PendingLink
              className="person-card associate-card"
              href={englishArchiveHref(entry)}
              key={entry.slug}
              prefetch={false}
            >
              <span
                className="person-monogram"
                style={{ "--entry-accent": entry.accent } as React.CSSProperties}
              >
                {entry.monogram}
              </span>
              <span className="person-info">
                <strong>{entry.title}</strong>
                <small>Companion folio</small>
                <span>{entry.facts?.[1]?.value ?? "Archive entry"}</span>
              </span>
              <span className="person-arrow" aria-hidden="true">↗</span>
            </PendingLink>
          ))}
        </div>
      </section>

      <section className="home-section team-overview" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COMPANY</span>
            <h2>The Windreed Wayfarers</h2>
          </div>
          <p>An adventuring party that assembled a little at a time while already on the road.</p>
        </div>
        <article className="overview-paper">
          <MarkdownView markdown={englishTeamOverview} />
        </article>
      </section>
    </div>
  );
}
