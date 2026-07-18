import Image from "next/image";
import {
  archiveCollections,
  archiveHref,
  archiveSections,
  siteHref,
} from "./archive-manifest";
import { teamOverview } from "./archive-content.server";
import { getPublicArchiveNavigationEntries } from "./public-archive.server";
import { MarkdownView } from "./components/MarkdownView";
import { MemberCard } from "./components/MemberCard";
import { PendingLink } from "./components/PendingLink";

export const dynamic = "force-dynamic";

export default async function Home() {
  const publicEntries = await getPublicArchiveNavigationEntries();
  const members = publicEntries.filter((entry) => entry.characterRole === "member");
  const associates = publicEntries.filter((entry) => entry.characterRole === "associate");

  return (
    <div className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">THE SWORD COAST · 1492 DR</span>
          <h1>The Windreed<br />Wayfarers</h1>
          <p className="hero-deck">
            六名来路不同的旅人在路途中成为同伴。这是一份关于他们生平、行程与共同经历的公开档案。
          </p>
          <div className="hero-actions">
            <PendingLink className="primary-action" href={siteHref("/archive/characters/shirul")} prefetch={false}>开始阅读</PendingLink>
            <PendingLink className="secondary-action" href={siteHref("/search")} prefetch={false}>浏览全部索引</PendingLink>
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

      <section className="archive-status" aria-label="档案概况" data-reveal>
        <div><strong>06</strong><span>正式成员</span></div>
        <div><strong>{String(publicEntries.length).padStart(2, "0")}</strong><span>公开条目</span></div>
        <div><strong>1492</strong><span>当前纪年 · DR</span></div>
      </section>

      <section className="home-section" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ARCHIVES &amp; STORIES</span>
            <h2>卷册索引</h2>
          </div>
          <p>一组记人、地、物与设定，一组记录真正走出来的故事。</p>
        </div>
        <div className="archive-board-groups">
          {archiveCollections.map((collection) => (
            <section className="archive-board-group" key={collection.id}>
              <header className="archive-board-heading">
                <strong>{collection.english}</strong>
                <span>{collection.chinese}</span>
              </header>
              <div className="category-grid">
                {archiveSections
                  .filter((section) => section.collection === collection.id)
                  .map((section) => {
                    const index = archiveSections.findIndex((candidate) => candidate.id === section.id);
                    return (
                      <PendingLink
                        className="category-card"
                        href={`${siteHref("/search")}?section=${section.id}`}
                        key={section.id}
                        prefetch={false}
                        style={{ "--card-index": index } as React.CSSProperties}
                      >
                        <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="eyebrow">{section.english}</span>
                        <h3>{section.chinese}</h3>
                        <p>{section.description}</p>
                        <span className="card-link">打开卷页 <span>→</span></span>
                      </PendingLink>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="home-section member-showcase" aria-labelledby="member-showcase-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LIVES</span>
            <h2 id="member-showcase-title">卷中人</h2>
          </div>
          <p>六份彼此独立、又在旅途中相互交汇的正式档案。</p>
        </div>
        <div className="member-grid">
          {members.map((entry, index) => (
            <MemberCard entry={entry} index={index} key={entry.slug} />
          ))}
        </div>
      </section>

      <section className="home-section associates-section" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMPANIONS</span>
            <h2>同行者</h2>
          </div>
          <p>与风芦旅人有明确联系，但不属于六名正式团员的人物。</p>
        </div>
        <div className="people-grid associate-grid">
          {associates.map((entry) => (
            <PendingLink className="person-card associate-card" href={archiveHref(entry)} key={entry.slug} prefetch={false}>
              <span className="person-monogram" style={{ "--entry-accent": entry.accent } as React.CSSProperties}>
                {entry.monogram}
              </span>
              <span className="person-info">
                <strong>{entry.title}</strong>
                <small>{entry.englishTitle}</small>
                <span>{entry.facts?.[1]?.value ?? "人物档案"}</span>
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
            <h2>风芦旅人</h2>
          </div>
          <p>一支在赶路途中逐渐凑齐的冒险队伍。</p>
        </div>
        <article className="overview-paper">
          <MarkdownView markdown={teamOverview} />
        </article>
      </section>
    </div>
  );
}
