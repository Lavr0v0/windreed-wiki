"use client";

import type { ComponentProps } from "react";
import Link, { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

export function NavigationPendingSignal({ pending }: { pending: boolean }) {
  if (!pending || typeof document === "undefined") return null;
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

export function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPendingSignal />
    </Link>
  );
}
