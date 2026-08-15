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
  ".serviceGroup",
  ".serviceWarningPanel",
  ".serviceExtraPanel",
  ".groupCompaniesSection",
  ".contactSection",
  ".siteFooter",
].join(",");

export function LazyReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observed = new WeakSet<Element>();

    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.classList.add("lazyReveal", "lazyRevealVisible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          requestAnimationFrame(() => target.classList.add("lazyRevealVisible"));
          observer.unobserve(target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -18% 0px",
        threshold: 0.18,
      },
    );

    const register = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
      elements.forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("lazyReveal");
        element.classList.remove("lazyRevealVisible");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);

        const rect = element.getBoundingClientRect();
        const alreadyHighInViewport = rect.top < window.innerHeight * 0.45;
        if (alreadyHighInViewport) {
          requestAnimationFrame(() => element.classList.add("lazyRevealVisible"));
          return;
        }
        observer.observe(element);
      });
    };

    register();
    const delayedRegister = window.setTimeout(register, 80);
    const mutationObserver = new MutationObserver(register);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(delayedRegister);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
