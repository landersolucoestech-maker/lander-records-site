"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
  ".pillarCard",
  ".groupCompaniesSection",
  ".contactSection",
  ".siteFooter",
].join(",");

export function LazyReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    elements.forEach((element, index) => {
      element.classList.remove("lazyRevealVisible");
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
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16,
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
