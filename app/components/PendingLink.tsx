"use client";

import type { ComponentProps } from "react";
import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const prefetchedHrefs = new Set<string>();

export function NavigationPendingSignal({ pending }: { pending: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) {
      const frame = window.requestAnimationFrame(() => setVisible(false));
      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => setVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!visible || typeof document === "undefined") return null;
  return createPortal(
    <span
      aria-hidden="true"
      className="navigation-pending-signal"
      data-pending="true"
    />
    , document.body,
  );
}

function LinkPendingSignal() {
  const { pending } = useLinkStatus();
  return <NavigationPendingSignal pending={pending} />;
}

export function PendingLink({
  children,
  href,
  onFocus,
  onPointerEnter,
  onTouchStart,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  function prefetchFromIntent() {
    if (typeof href !== "string" || prefetchedHrefs.has(href)) return;
    if (/^(?:[a-z]+:|\/\/)/i.test(href)) return;
    prefetchedHrefs.add(href);
    router.prefetch(href);
  }

  return (
    <Link
      {...props}
      href={href}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) prefetchFromIntent();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) prefetchFromIntent();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (!event.defaultPrevented) prefetchFromIntent();
      }}
    >
      {children}
      <LinkPendingSignal />
    </Link>
  );
}
