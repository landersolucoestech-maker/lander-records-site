"use client";

import { useEffect, useState } from "react";

export function SiteIntro() {
  const [closing, setClosing] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setClosing(true), 1050);
    const hideTimer = window.setTimeout(() => setHidden(true), 1750);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div className={`siteIntro siteIntroV2${closing ? " siteIntroClosing" : ""}`} aria-hidden="true">
      <div className="siteIntroGlow" />
      <div className="siteIntroMarkV2">
        <span className="siteIntroEyebrow">LANDER RECORDS</span>
        <strong>LANDER</strong>
        <div className="siteIntroRule"><i /></div>
        <small>MÚSICA · CULTURA · CARREIRA</small>
      </div>
      <div className="siteIntroCorner">LR</div>
    </div>
  );
}
