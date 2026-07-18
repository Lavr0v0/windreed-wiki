import Image from "next/image";
import { siteHref } from "../archive-manifest";

type LoadingVariant = "home" | "archive" | "search";

const loadingCopy: Record<LoadingVariant, { kicker: string; title: string; note: string }> = {
  home: {
    kicker: "THE WINDREED WAYFARERS",
    title: "正在展开旅途长卷",
    note: "清风正翻开故事的第一页",
  },
  archive: {
    kicker: "ARCHIVE FOLIO",
    title: "正在查阅卷中档案",
    note: "墨迹将沿旧日行迹重新显现",
  },
  search: {
    kicker: "FULL TEXT INDEX",
    title: "正在检索抄本索引",
    note: "修史者正在逐行核对卷页",
  },
};

function LoadingSeal() {
  return (
    <span className="loading-seal" aria-hidden="true">
      <span className="loading-seal-ring loading-seal-ring-outer" />
      <span className="loading-seal-ring loading-seal-ring-inner" />
      <Image
        alt=""
        className="loading-seal-logo"
        height={96}
        priority
        src={siteHref("/brand/final/windreed-logo-on-dark.svg")}
        unoptimized
        width={96}
      />
    </span>
  );
}

function HomeLoadingSketch() {
  return (
    <div className="loading-home-sketch" aria-hidden="true">
      <span className="loading-block loading-block-kicker" />
      <span className="loading-block loading-block-display" />
      <span className="loading-block loading-block-display loading-block-display-short" />
      <span className="loading-block loading-block-copy" />
      <span className="loading-block loading-block-copy loading-block-copy-short" />
    </div>
  );
}

function ArchiveLoadingSketch() {
  return (
    <div className="loading-archive-sketch" aria-hidden="true">
      <span className="loading-avatar" />
      <div className="loading-heading-lines">
        <span className="loading-block loading-block-kicker" />
        <span className="loading-block loading-block-title" />
        <span className="loading-block loading-block-copy" />
      </div>
      <div className="loading-fact-row">
        <span /><span /><span /><span />
      </div>
      <div className="loading-manuscript-lines">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

function SearchLoadingSketch() {
  return (
    <div className="loading-search-sketch" aria-hidden="true">
      <span className="loading-search-field" />
      <div className="loading-filter-row"><span /><span /><span /><span /></div>
      <div className="loading-result-row"><i /><span /></div>
      <div className="loading-result-row"><i /><span /></div>
      <div className="loading-result-row"><i /><span /></div>
    </div>
  );
}

export function RouteLoading({ variant }: { variant: LoadingVariant }) {
  const copy = loadingCopy[variant];
  return (
    <section className={`route-loading route-loading-${variant}`} role="status" aria-live="polite">
      <span className="sr-only">{copy.title}</span>
      <div className="loading-folio">
        <header className="loading-folio-heading">
          <LoadingSeal />
          <div>
            <span className="loading-kicker">{copy.kicker}</span>
            <p>{copy.title}</p>
            <small>{copy.note}</small>
          </div>
        </header>
        <span className="loading-wayline" aria-hidden="true"><i /></span>
        {variant === "home" && <HomeLoadingSketch />}
        {variant === "archive" && <ArchiveLoadingSketch />}
        {variant === "search" && <SearchLoadingSketch />}
      </div>
    </section>
  );
}
