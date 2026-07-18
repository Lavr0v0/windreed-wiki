"use client";

import type { PointerEvent } from "react";
import { archiveHref, type ArchiveManifestEntry } from "../archive-manifest";
import { PendingLink } from "./PendingLink";

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
    <PendingLink
      className="member-card"
      data-reveal
      href={archiveHref(entry)}
      onPointerLeave={resetCard}
      onPointerMove={moveCard}
      prefetch={false}
      style={{
        "--member-accent": entry.accent,
        "--member-index": index,
        "--name-angle": `${[-0.7, 0.25, -0.35, 0.55, -0.15, 0.4][index % 6]}deg`,
        "--reveal-delay": `${index * 55}ms`,
      } as React.CSSProperties}
    >
      <span className="member-card-number" aria-hidden="true">
        <small>FOLIO</small>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="member-card-seal" data-logo-slot="member" aria-hidden="true">
        <span className="member-card-seal-fallback">{entry.monogram}</span>
      </span>
      <span className="member-card-copy">
        <span className="member-card-kicker">
          <b>LIVES</b>
          <i aria-hidden="true" />
          <em>卷中录名</em>
        </span>
        <span className="member-card-name">
          <strong>{entry.title}</strong>
        </span>
        {entry.englishTitle && <small className="member-card-transcription">{entry.englishTitle}</small>}
        <span className="member-card-role">
          <i>所记身份</i>
          <b>{entry.facts?.[1]?.value ?? "团员档案"}</b>
        </span>
        <span className="member-card-summary">{entry.summary}</span>
      </span>
      <span className="member-card-enter">展卷阅其人 <i aria-hidden="true">↗</i></span>
      <span className="member-card-colophon" aria-hidden="true">RECORDED · 1492 DR</span>
      <span className="member-card-glow" aria-hidden="true" />
    </PendingLink>
  );
}
