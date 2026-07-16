import Link from "next/link";
import {
  archiveHref,
  archiveManifest,
  categoryLabels,
  entriesByCategory,
  navigationEntriesByCategory,
  siteHref,
  type ArchiveCategory,
} from "./archive-manifest";
import { teamOverview } from "./archive-content.server";
import { MarkdownView } from "./components/MarkdownView";

const categories: Array<{
  id: ArchiveCategory;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "characters",
    eyebrow: "PEOPLE",
    description: "正式成员与同行者的人物生平、性格、动机和关系。",
  },
  {
    id: "world",
    eyebrow: "WORLD",
    description: "核心设定与物件；地点和誓言从正文词条注释展开。",
  },
  {
    id: "history",
    eyebrow: "HISTORY",
    description: "从各自来路到队伍合流的纪年与已确认联系。",
  },
];

export default function Home() {
  const characters = entriesByCategory("characters");

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

      <section className="archive-status" aria-label="档案概况">
        <div><strong>06</strong><span>正式成员</span></div>
        <div><strong>{String(archiveManifest.length).padStart(2, "0")}</strong><span>公开条目</span></div>
        <div><strong>1492</strong><span>当前纪年 · DR</span></div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ARCHIVE SECTIONS</span>
            <h2>档案分类</h2>
          </div>
          <p>按照人物、世界与历史三条线索进入资料库。</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const first = navigationEntriesByCategory(category.id)[0];
            return (
              <Link className="category-card" href={archiveHref(first)} key={category.id}>
                <span className="card-number">0{index + 1}</span>
                <span className="eyebrow">{category.eyebrow}</span>
                <h3>{categoryLabels[category.id]}</h3>
                <p>{category.description}</p>
                <span className="card-link">进入目录 <span>→</span></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMPANIONS</span>
            <h2>人物档案</h2>
          </div>
          <p>六名正式成员与一位重要的同行者。</p>
        </div>
        <div className="people-grid">
          {characters.map((entry) => (
            <Link className="person-card" href={archiveHref(entry)} key={entry.slug}>
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

      <section className="home-section team-overview">
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
