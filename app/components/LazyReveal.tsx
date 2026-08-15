"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const selector = [
  "main > section",
  "main section article",
  "main section aside > div",
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
  "footer.siteFooter",
].join(",");

export function LazyReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup: (() => void) | undefined;

    const start = () => {
      cleanup?.();
      const observed = new WeakSet<Element>();

      const revealImmediately = (element: HTMLElement) => {
        element.classList.add("lazyReveal", "lazyRevealVisible");
      };

      if (reduceMotion || !("IntersectionObserver" in window)) {
        document.querySelectorAll<HTMLElement>(selector).forEach(revealImmediately);
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
          rootMargin: "0px 0px -10% 0px",
          threshold: 0.06,
        },
      );

      const register = () => {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
        elements.forEach((element, index) => {
          if (observed.has(element) || element.closest(".siteIntro")) return;
          observed.add(element);
          element.classList.add("lazyReveal");
          element.classList.remove("lazyRevealVisible");
          element.style.setProperty("--reveal-delay", `${(index % 5) * 85}ms`);

          const rect = element.getBoundingClientRect();
          const isInitialViewport = rect.top < window.innerHeight * 0.12;
          if (isInitialViewport) {
            requestAnimationFrame(() => element.classList.add("lazyRevealVisible"));
          } else {
            observer.observe(element);
          }
        });
      };

      register();
      const timers = [80, 220, 500].map((delay) => window.setTimeout(register, delay));
      const mutationObserver = new MutationObserver(register);
      mutationObserver.observe(document.body, { childList: true, subtree: true });

      cleanup = () => {
        timers.forEach(window.clearTimeout);
        mutationObserver.disconnect();
        observer.disconnect();
      };
    };

    const introAlreadyDone = document.documentElement.classList.contains("intro-complete");
    if (introAlreadyDone) {
      const timer = window.setTimeout(start, 50);
      cleanup = () => window.clearTimeout(timer);
    } else {
      window.addEventListener("lander:intro-complete", start, { once: true });
      cleanup = () => window.removeEventListener("lander:intro-complete", start);
    }

    return () => cleanup?.();
  }, [pathname]);

  return null;
}
