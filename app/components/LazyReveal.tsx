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
    let cleanup: (() => void) | undefined;

    const start = () => {
      cleanup?.();

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
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.08,
        },
      );

      const register = () => {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
        elements.forEach((element, index) => {
          if (observed.has(element)) return;
          observed.add(element);
          element.classList.add("lazyReveal");
          element.classList.remove("lazyRevealVisible");
          element.style.setProperty("--reveal-delay", `${(index % 4) * 110}ms`);

          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.18) {
            requestAnimationFrame(() => element.classList.add("lazyRevealVisible"));
          } else {
            observer.observe(element);
          }
        });
      };

      register();
      const delayedRegister = window.setTimeout(register, 120);
      const mutationObserver = new MutationObserver(register);
      mutationObserver.observe(document.body, { childList: true, subtree: true });

      cleanup = () => {
        window.clearTimeout(delayedRegister);
        mutationObserver.disconnect();
        observer.disconnect();
      };
    };

    const introAlreadyDone = document.documentElement.classList.contains("intro-complete");
    if (introAlreadyDone) {
      const timer = window.setTimeout(start, 40);
      cleanup = () => window.clearTimeout(timer);
    } else {
      window.addEventListener("lander:intro-complete", start, { once: true });
      cleanup = () => window.removeEventListener("lander:intro-complete", start);
    }

    return () => cleanup?.();
  }, [pathname]);

  return null;
}
