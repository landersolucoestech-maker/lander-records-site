"use client";

import { useEffect, useState } from "react";

export function SiteIntro() {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setClosing(true), 950);
    const hideTimer = window.setTimeout(() => setHidden(true), 1650);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div className={`siteIntro${closing ? " siteIntroClosing" : ""}`} aria-hidden="true">
      <div className="siteIntroMark">
        <strong>LANDER</strong>
        <span>RECORDS</span>
      </div>
      <div className="siteIntroTrack">
        <span>LANDER RECORDS</span>
        <span>LANDER RECORDS</span>
        <span>LANDER RECORDS</span>
      </div>
    </div>
  );
}
