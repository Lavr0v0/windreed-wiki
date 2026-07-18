"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function MotionLayer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const editorRoute = pathname === "/edit" || pathname.startsWith("/edit/");

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function configureScroll() {
      lenisRef.current?.destroy();
      lenisRef.current = null;

      if (editorRoute || !finePointer.matches || reducedMotion.matches) return;

      lenisRef.current = new Lenis({
        anchors: false,
        autoRaf: true,
        lerp: 0.085,
        prevent: (node) => Boolean(node.closest(".desktop-sidebar, .mobile-sidebar")),
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
      });
    }

    configureScroll();
    finePointer.addEventListener("change", configureScroll);
    reducedMotion.addEventListener("change", configureScroll);

    return () => {
      finePointer.removeEventListener("change", configureScroll);
      reducedMotion.removeEventListener("change", configureScroll);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [editorRoute]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function followTableOfContents(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const source = event.target;
      if (!(source instanceof Element)) return;
      const link = source.closest<HTMLAnchorElement>("a[data-toc-link]");
      if (!link?.hash) return;

      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${link.hash}`,
      );

      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          immediate: reducedMotion.matches,
          // Lenis already reads the heading's CSS scroll-margin-top.
          offset: 0,
        });
        return;
      }

      const top = target.getBoundingClientRect().top + window.scrollY - 94;
      window.scrollTo({
        top,
        left: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    }

    document.addEventListener("click", followTableOfContents);
    return () => document.removeEventListener("click", followTableOfContents);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      lenisRef.current?.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let frame = 0;

    function updateScrollMetrics() {
      frame = 0;
      const root = document.documentElement;
      const limit = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty("--scroll-progress", String(Math.min(1, window.scrollY / limit)));
      root.style.setProperty("--scroll-shift", String(Math.min(720, window.scrollY)));
    }

    function requestMetrics() {
      if (!frame) frame = window.requestAnimationFrame(updateScrollMetrics);
    }

    updateScrollMetrics();
    window.addEventListener("scroll", requestMetrics, { passive: true });
    window.addEventListener("resize", requestMetrics, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestMetrics);
      window.removeEventListener("resize", requestMetrics);
    };
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    // Touch devices show the initial document immediately. Their loading and
    // drawer transitions still provide motion without delaying first paint.
    if (reducedMotion || !finePointer || !("IntersectionObserver" in window)) {
      root.classList.remove("motion-ready");
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    root.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));
    // A reveal animation is decorative, so an observer callback must never be
    // able to leave real content permanently transparent. Some desktop browser
    // sessions can miss the initial intersection notification during hydration.
    const revealFallback = window.setTimeout(() => {
      elements.forEach((element) => element.classList.add("is-revealed"));
    }, 900);

    return () => {
      window.clearTimeout(revealFallback);
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, [pathname]);

  return children;
}
