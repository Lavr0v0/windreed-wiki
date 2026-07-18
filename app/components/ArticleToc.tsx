"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useModalDialog } from "./useModalDialog";

type Heading = {
  id: string;
  level: number;
  title: string;
};

export function ArticleToc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useModalDialog({ dialogRef, lockScroll: true, onClose: close, open, triggerRef });

  useEffect(() => {
    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((target): target is HTMLElement => Boolean(target));
    if (!targets.length) return;

    function updateFromScroll() {
      const current = [...targets].reverse().find((target) => target.getBoundingClientRect().top <= 128);
      setActiveId((current ?? targets[0]).id);
    }

    const observer = new IntersectionObserver(updateFromScroll, {
      rootMargin: "-104px 0px -68% 0px",
      threshold: [0, 1],
    });
    targets.forEach((target) => observer.observe(target));

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateFromScroll);
    };
  }, [headings]);

  if (!headings.length) return null;

  function links(closeAfterClick = false) {
    return headings.map((heading) => (
      <a
        aria-current={activeId === heading.id ? "location" : undefined}
        className={heading.level === 3 ? "toc-sub" : undefined}
        data-toc-link
        href={`#${heading.id}`}
        key={`${heading.level}-${heading.id}`}
        onClick={() => {
          setActiveId(heading.id);
          if (closeAfterClick) close();
        }}
      >
        {heading.title}
      </a>
    ));
  }

  return (
    <>
      <aside className="article-rail">
        <nav className="page-toc" aria-label="本页目录">
          <span>本页目录</span>
          {links()}
        </nav>
      </aside>

      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="mobile-toc-trigger"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true">☰</span>
        <b>目录</b>
        <small>{headings.find((heading) => heading.id === activeId)?.title ?? "本页章节"}</small>
      </button>
      <div aria-hidden={!open} className="mobile-toc-layer" data-state={open ? "open" : "closed"} inert={!open}>
        <button aria-label="关闭目录" className="mobile-toc-scrim" onClick={close} tabIndex={open ? 0 : -1} />
        <div
          aria-label="本页目录"
          aria-modal="true"
          className="mobile-toc-sheet"
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <div className="mobile-toc-heading">
            <div><span>CONTENTS</span><strong>本页目录</strong></div>
            <button aria-label="关闭本页目录" data-dialog-initial-focus onClick={close} type="button">×</button>
          </div>
          <nav>{links(true)}</nav>
        </div>
      </div>
    </>
  );
}
