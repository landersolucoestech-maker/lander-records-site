"use client";

import { useEffect } from "react";

export default function NewContentModalOpener() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event("admin:new-content"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
