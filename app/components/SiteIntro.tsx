"use client";

import { useEffect, useState } from "react";

export function SiteIntro() {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("intro-active");
    const closeTimer = window.setTimeout(() => setClosing(true), 900);
    const hideTimer = window.setTimeout(() => {
      setHidden(true);
      document.documentElement.classList.remove("intro-active");
      document.documentElement.classList.add("intro-complete");
      window.dispatchEvent(new CustomEvent("lander:intro-complete"));
    }, 1450);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
      document.documentElement.classList.remove("intro-active");
    };
  }, []);

  if (hidden) return null;

  return (
    <div className={`siteIntro siteIntroSimple${closing ? " siteIntroClosing" : ""}`} aria-hidden="true">
      <img src="/lander-records-site/lander-records-logo.webp" alt="" style={{ width: "min(62vw, 520px)", height: "auto", display: "block", objectFit: "contain" }} />
    </div>
  );
}
