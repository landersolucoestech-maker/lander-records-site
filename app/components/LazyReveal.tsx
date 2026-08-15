"use client";

import { useEffect } from "react";

const selector = [
  ".homeIntroCard",
  ".homeShortcutCircle",
  ".homeBlock",
  ".socialMetricCard",
  ".artistTile",
  ".artistProfileBody",
  ".sidebarBlock",
  ".detailCard",
  ".newsCard",
  ".articleHeader",
  ".articleBody",
  ".aboutValueCard",
  ".contactSection",
  ".siteFooter",
].join(",");

export function LazyReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    elements.forEach((element, index) => {
      element.classList.add("lazyReveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("lazyRevealVisible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("lazyRevealVisible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "180px 0px 120px",
        threshold: 0.04,
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
