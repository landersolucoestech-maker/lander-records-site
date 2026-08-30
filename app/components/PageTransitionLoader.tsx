"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

const MIN_VISIBLE_MS = 760;
const INITIAL_VISIBLE_MS = 980;

export function PageTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(18);
  const startedAtRef = useRef<number>(0);
  const firstRunRef = useRef(true);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      startedAtRef.current = Date.now();
      setProgress(14);
      setVisible(true);
      requestAnimationFrame(() => setProgress(72));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    const firstRun = firstRunRef.current;
    firstRunRef.current = false;

    if (firstRun) {
      startedAtRef.current = Date.now();
      setVisible(true);
      setProgress(20);
      const progressTimer = window.setTimeout(() => setProgress(78), 90);
      const finishTimer = window.setTimeout(() => {
        setProgress(100);
        window.setTimeout(() => setVisible(false), 220);
      }, INITIAL_VISIBLE_MS);
      return () => {
        window.clearTimeout(progressTimer);
        window.clearTimeout(finishTimer);
      };
    }

    if (!visible) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(160, MIN_VISIBLE_MS - elapsed);
    const progressTimer = window.setTimeout(() => setProgress(94), Math.min(220, remaining / 2));
    const finishTimer = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setVisible(false), 220);
    }, remaining);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(finishTimer);
    };
  }, [pathname, visible]);

  return (
    <div className={`pageTransitionLoader${visible ? " isVisible" : ""}`} aria-hidden={!visible}>
      <div className="pageTransitionLoaderInner">
        <Image
          className="pageTransitionLoaderLogo"
          src="/lander-records-logo.webp"
          alt="Lander Records"
          width={512}
          height={512}
          draggable={false}
        />
        <div className="pageTransitionProgress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
    </div>
  );
}
