"use client";

import { useEffect } from "react";

const selector = [
  ".homeIntroCard",
  ".homeShortcutCircle",
  ".homeBlockHeader",
  ".homeArtistCard",
  ".spotifyReleaseCard",
  ".homeNewsFeatured",
  ".homeNewsSide a",
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
      element.style.setProperty("--reveal-delay", `${(index % 5) * 70}ms`);
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
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
