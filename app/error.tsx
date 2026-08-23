"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const english = pathname === "/en" || pathname.startsWith("/en/");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="error-page" role="alert">
      <div className="error-card">
        <span className="eyebrow">ARCHIVE INTERRUPTION</span>
        <h1>{english ? "This folio could not be opened" : "档案暂时无法展开"}</h1>
        <p>
          {english
            ? "The archive encountered a problem while preparing this page. You can try again without leaving your place."
            : "档案在整理这页时遇到了问题。你可以留在这里重新尝试。"}
        </p>
        <div className="error-actions">
          <button className="primary-action" onClick={reset} type="button">
            {english ? "Try again" : "重新尝试"}
          </button>
          <a className="secondary-action" href={english ? "/en" : "/"}>
            {english ? "Return to the overview" : "返回档案总览"}
          </a>
        </div>
      </div>
    </section>
  );
}
