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

    document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.loading = "lazy";
        img.decoding = "async";
      }
    });

    document.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      if (rect.top > window.innerHeight) iframe.loading = "lazy";
    });

    const elements = () => Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements().forEach((element) => element.classList.add("lazyReveal", "lazyRevealVisible"));
      return () => document.documentElement.classList.remove("lazyRevealEnabled");
    }

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

    const register = () => {
      elements().forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);

        element.classList.add("lazyReveal");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);

        const rect = element.getBoundingClientRect();
        const alreadyPassed = rect.top < 72;

        if (alreadyPassed) {
          element.classList.add("lazyRevealVisible");
        } else {
          element.classList.remove("lazyRevealVisible");
          observer.observe(element);
        }
      });
    };

    register();
    const timers = [100, 300, 700].map((delay) => window.setTimeout(register, delay));
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
