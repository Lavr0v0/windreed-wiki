"use client";

import type { PointerEvent } from "react";
import Link from "next/link";
import { archiveHref, type ArchiveManifestEntry } from "../archive-manifest";

export function MemberCard({
  entry,
  index,
}: {
  entry: ArchiveManifestEntry;
  index: number;
}) {
  function moveCard(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === "touch") return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--pointer-x", `${x * 100}%`);
    card.style.setProperty("--pointer-y", `${y * 100}%`);
    card.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
  }

  function resetCard(event: PointerEvent<HTMLAnchorElement>) {
    const card = event.currentTarget;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <Link
      aria-label={`阅读${entry.title}的团员档案`}
      className="member-card"
      data-reveal
      href={archiveHref(entry)}
      onPointerLeave={resetCard}
      onPointerMove={moveCard}
      style={{
        "--member-accent": entry.accent,
        "--member-index": index,
        "--reveal-delay": `${index * 55}ms`,
      } as React.CSSProperties}
    >
      <span className="member-card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <span className="member-card-seal" aria-hidden="true">{entry.monogram}</span>
      <span className="member-card-copy">
        <span className="member-card-kicker">PARTY MEMBER</span>
        <strong>{entry.title}</strong>
        {entry.englishTitle && <small>{entry.englishTitle}</small>}
        <span className="member-card-role">{entry.facts?.[1]?.value ?? "团员档案"}</span>
        <span className="member-card-summary">{entry.summary}</span>
      </span>
      <span className="member-card-enter">进入档案 <i aria-hidden="true">↗</i></span>
      <span className="member-card-glow" aria-hidden="true" />
    </Link>
  );
}
