import Link from "next/link";
import { siteHref } from "./archive-manifest";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-mark" aria-hidden="true">
          <span>404</span>
          <i className="not-found-reed reed-left" />
          <i className="not-found-reed reed-right" />
        </div>

        <div className="not-found-copy">
          <span className="eyebrow">ARCHIVE WAYPOINT · 404</span>
          <h1 id="not-found-title">此路未载于档案</h1>
          <p className="not-found-lead">清风拂过这里，他们已经去往新的旅途。</p>
          <p className="not-found-note">
            你所寻找的篇章也许已经封存，也许从未在这条路上留下名字。
          </p>

          <div className="not-found-actions">
            <Link className="primary-action" href={siteHref("/")}>
              返回档案总览
            </Link>
            <Link className="secondary-action" href={siteHref("/search")}>
              检索公开档案
            </Link>
          </div>
        </div>

        <div className="not-found-wayline" aria-hidden="true">
          <span />
          <i />
        </div>
      </section>
    </main>
  );
}
