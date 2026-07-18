"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PendingLink } from "./PendingLink";
import { useModalDialog } from "./useModalDialog";

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
  const [mobile, setMobile] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 960px)");
    const update = () => setMobile(media.matches);
    const frame = window.requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", update);
    };
  }, []);

  useModalDialog({
    dialogRef,
    lockScroll: mobile,
    onClose: close,
    open,
    triggerRef,
  });

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("pointerdown", closeFromOutside);
    return () => {
      window.removeEventListener("pointerdown", closeFromOutside);
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
        ref={triggerRef}
      >
        {label}
      </button>
      {open && (
        <>
        <button aria-label="关闭词条注释" className="glossary-scrim" onClick={close} tabIndex={mobile ? 0 : -1} />
        <span className="glossary-popover" ref={dialogRef} role="dialog" aria-label={`${title}词条注释`} tabIndex={-1}>
          <span className="glossary-popover-topline">
            <span>词条注释</span>
            <button type="button" data-dialog-initial-focus onClick={close} aria-label="关闭词条注释">
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
        </>
      )}
    </span>
  );
}
