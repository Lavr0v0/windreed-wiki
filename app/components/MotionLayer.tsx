"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function MotionLayer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function configureScroll() {
      lenisRef.current?.destroy();
      lenisRef.current = null;

      if (!finePointer.matches || reducedMotion.matches) return;

      lenisRef.current = new Lenis({
        anchors: true,
        autoRaf: true,
        lerp: 0.085,
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
  }, []);

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
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reducedMotion || !("IntersectionObserver" in window)) {
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
    return () => observer.disconnect();
  }, [pathname]);

  return children;
}
