"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  "main > section:not(:first-of-type)",
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

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observed = new WeakSet<Element>();

    document.documentElement.classList.add("lazyRevealEnabled");

    // Lazy-load real media globally, keeping above-the-fold/hero media eager.
    document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.9) {
        img.loading = "lazy";
        img.decoding = "async";
      }
    });
    document.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.9) iframe.loading = "lazy";
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        element.classList.add("lazyReveal", "lazyRevealVisible");
      });
      return () => document.documentElement.classList.remove("lazyRevealEnabled");
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
        // Only reveal after the element has entered roughly the lower 70% of viewport.
        rootMargin: "0px 0px -28% 0px",
        threshold: 0.12,
      },
    );

    const register = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
      elements.forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);

        const rect = element.getBoundingClientRect();
        const isAlreadyOnScreen = rect.top < window.innerHeight * 0.78 && rect.bottom > 0;

        element.classList.add("lazyReveal");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);

        if (isAlreadyOnScreen) {
          element.classList.add("lazyRevealVisible");
        } else {
          element.classList.remove("lazyRevealVisible");
          observer.observe(element);
        }
      });
    };

    register();
    const timers = [80, 240, 600].map((delay) => window.setTimeout(register, delay));
    const mutationObserver = new MutationObserver(register);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      timers.forEach(window.clearTimeout);
      mutationObserver.disconnect();
      observer.disconnect();
      document.documentElement.classList.remove("lazyRevealEnabled");
    };
  }, [pathname]);

  return null;
}
