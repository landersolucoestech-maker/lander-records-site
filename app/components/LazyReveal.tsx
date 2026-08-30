"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  "main > section:not(:first-of-type)",
  "main .homeV2 > section:not(:first-of-type)",
  "main section > article",
  "main section > aside",
  "main section [class*='Card']",
  "main section [class*='card']",
  "main .homeShortcutCircle",
  "main .homeBlockHeader",
  "main .filterRow",
  "main .groupCompaniesNav button",
  "main .groupCompaniesPanel",
  "main .serviceGroup",
  "main .serviceWarningPanel",
  "main .serviceExtraPanel",
  "main .articleHeader",
  "main .articleBody",
  "main .embedPlaceholder",
  "main .socialMetric",
  "main .artistPlatformLinks a",
  "footer.siteFooter",
].join(",");

export function LazyReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const observed = new WeakSet<Element>();
    let revealIndex = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("lazyRevealVisible");
          observer.unobserve(target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -16% 0px",
        threshold: 0.08,
      },
    );

    const register = (elements: Iterable<HTMLElement>) => {
      for (const element of elements) {
        if (observed.has(element)) continue;
        observed.add(element);

        element.style.setProperty("--reveal-delay", `${(revealIndex % 4) * 70}ms`);
        revealIndex += 1;

        const rect = element.getBoundingClientRect();
        if (element.classList.contains("lazyRevealVisible") || (rect.top < window.innerHeight * 0.92 && rect.bottom > 0)) {
          element.classList.add("lazyReveal", "lazyRevealVisible");
        } else {
          element.classList.add("lazyReveal");
          observer.observe(element);
        }
      }
    };

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        register(document.querySelectorAll<HTMLElement>(revealSelector));
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
