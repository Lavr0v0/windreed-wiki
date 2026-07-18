"use client";

import { useEffect, useRef, useState } from "react";
import { PendingLink } from "./PendingLink";

type GlossaryLinkProps = {
  label: string;
  href: string;
  title: string;
  englishTitle?: string;
  summary: string;
  aliases: string[];
};

export function GlossaryLink({
  label,
  href,
  title,
  englishTitle,
  summary,
  aliases,
}: GlossaryLinkProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("keydown", closeFromKeyboard);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open]);

  const secondaryAliases = aliases.filter(
    (alias) => alias !== title && alias !== englishTitle && alias !== label,
  );

  return (
    <span className="glossary-link-wrap" ref={containerRef}>
      <button
        type="button"
        className="glossary-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open && (
        <span className="glossary-popover" role="dialog" aria-label={`${title}词条注释`}>
          <span className="glossary-popover-topline">
            <span>词条注释</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭词条注释">
              ×
            </button>
          </span>
          <strong>{title}</strong>
          {englishTitle && <em>{englishTitle}</em>}
          <span className="glossary-summary">{summary}</span>
          {secondaryAliases.length > 0 && (
            <span className="glossary-aliases">亦见：{secondaryAliases.join(" · ")}</span>
          )}
          <PendingLink className="glossary-more" href={href} prefetch={false}>
            查看完整词条 <span aria-hidden="true">→</span>
          </PendingLink>
        </span>
      )}
    </span>
  );
}
