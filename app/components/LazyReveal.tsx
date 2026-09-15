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
].join(",");

export function LazyReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches || !("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;

    const observed = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const animationByElement = new WeakMap<Element, Animation>();
    const pending = new Set<HTMLElement>();
    let revealIndex = 0;
    let revealDisabled = false;

    const reveal = (target: Element) => {
      animationByElement.get(target)?.play();
      observer.unobserve(target);
      pending.delete(target as HTMLElement);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.01,
      },
    );

    const register = (elements: Iterable<HTMLElement>) => {
      if (revealDisabled || motionPreference.matches) return;
      for (const element of elements) {
        if (observed.has(element)) continue;
        observed.add(element);

        const delay = (revealIndex % 4) * 70;
        revealIndex += 1;

        // Web Animations keeps the reveal state outside React-managed attributes.
        // A global class/style mutation can race a selectively hydrated boundary.
        const animation = element.animate(
          [
            { clipPath: "inset(0 0 10% 0)", opacity: 0, transform: "translate3d(0, 56px, 0) scale(.985)" },
            { clipPath: "inset(0 0 0 0)", opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          { delay, duration: 720, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "both" },
        );
        animation.id = "lazy-reveal";
        animations.add(animation);
        animationByElement.set(element, animation);

        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          animation.finish();
        } else {
          animation.pause();
          animation.currentTime = 0;
          pending.add(element);
          observer.observe(element);
        }
      }
    };

    const revealVisible = () => {
      pending.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) reveal(element);
      });
    };

    window.addEventListener("scroll", revealVisible, { passive: true });
    window.addEventListener("resize", revealVisible);

    const honorReducedMotion = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      revealDisabled = true;
      pending.clear();
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    motionPreference.addEventListener("change", honorReducedMotion);

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        register(document.querySelectorAll<HTMLElement>(revealSelector));
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("scroll", revealVisible);
      window.removeEventListener("resize", revealVisible);
      motionPreference.removeEventListener("change", honorReducedMotion);
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
  }, [pathname]);

  return null;
}
