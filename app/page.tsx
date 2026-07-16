import Link from "next/link";
import {
  associateEntries,
  archiveHref,
  archiveManifest,
  navigationEntriesByCategory,
  partyMemberEntries,
  siteHref,
} from "./archive-manifest";
import { teamOverview } from "./archive-content.server";
import { MarkdownView } from "./components/MarkdownView";
import { MemberCard } from "./components/MemberCard";

const categories: Array<{
  eyebrow: string;
  title: string;
  description: string;
  href: string;
}> = [
  {
    eyebrow: "PARTY MEMBERS",
    title: "正式团员",
    description: "六名风芦旅人的人物生平、性格、动机与同行经历。",
    href: archiveHref(partyMemberEntries()[0]),
  },
  {
    eyebrow: "COMPANIONS",
    title: "同行者",
    description: "与队伍有明确联系、但并非正式成员的人物档案。",
    href: archiveHref(associateEntries()[0]),
  },
  {
    eyebrow: "WORLD",
    title: "世界档案",
    description: "核心设定与物件；地点和誓言从正文词条注释展开。",
    href: archiveHref(navigationEntriesByCategory("world")[0]),
  },
  {
    eyebrow: "HISTORY",
    title: "历史档案",
    description: "从各自来路到队伍合流的纪年与已确认联系。",
    href: archiveHref(navigationEntriesByCategory("history")[0]),
  },
];

export default function Home() {
  const members = partyMemberEntries();
  const associates = associateEntries();

  return (
    <div className="home-page">
      <section className="hero-panel" data-reveal>
        <div className="hero-copy">
          <span className="eyebrow">THE SWORD COAST · 1492 DR</span>
          <h1>The Windreed<br />Wayfarers</h1>
          <p className="hero-deck">
            六名来路不同的旅人在路途中成为同伴。这是一份关于他们生平、行程与共同经历的公开档案。
          </p>
          <div className="hero-actions">
            <Link className="primary-action" href={siteHref("/archive/characters/shirul")}>开始阅读</Link>
            <Link className="secondary-action" href={siteHref("/search")}>浏览全部索引</Link>
          </div>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <span className="emblem-ring" />
          <span className="emblem-w">W</span>
          <span className="emblem-reed reed-one" />
          <span className="emblem-reed reed-two" />
          <small>EST. 1491 DR</small>
        </div>
      </section>

      <section className="archive-status" aria-label="档案概况" data-reveal>
        <div><strong>06</strong><span>正式成员</span></div>
        <div><strong>{String(archiveManifest.length).padStart(2, "0")}</strong><span>公开条目</span></div>
        <div><strong>1492</strong><span>当前纪年 · DR</span></div>
      </section>

      <section className="home-section" data-reveal>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ARCHIVE SECTIONS</span>
            <h2>档案分类</h2>
          </div>
          <p>正式团员拥有独立目录；其他人物、世界与历史分别归档。</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
              <Link
                className="category-card"
                href={category.href}
                key={category.title}
                style={{ "--card-index": index } as React.CSSProperties}
              >
                <span className="card-number">0{index + 1}</span>
                <span className="eyebrow">{category.eyebrow}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="card-link">进入目录 <span>→</span></span>
              </Link>
          ))}
        </div>
      </section>

      <section className="home-section member-showcase" aria-labelledby="member-showcase-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE SIX WAYFARERS</span>
            <h2 id="member-showcase-title">正式团员</h2>
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
            <span className="eyebrow">ASSOCIATED PEOPLE</span>
            <h2>同行者</h2>
          </div>
          <p>与风芦旅人有明确联系，但不属于六名正式团员的人物。</p>
        </div>
        <div className="people-grid associate-grid">
          {associates.map((entry) => (
            <Link className="person-card associate-card" href={archiveHref(entry)} key={entry.slug}>
              <span className="person-monogram" style={{ "--entry-accent": entry.accent } as React.CSSProperties}>
                {entry.monogram}
              </span>
              <span className="person-info">
                <strong>{entry.title}</strong>
                <small>{entry.englishTitle}</small>
                <span>{entry.facts?.[1]?.value ?? "人物档案"}</span>
              </span>
              <span className="person-arrow" aria-hidden="true">↗</span>
            </Link>
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
