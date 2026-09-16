"use client";

import { useEffect } from "react";

type HeaderDetail = { title?: string; description?: string } | null;

export function AdminContextHeaderSync({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    const titleNode = document.querySelector<HTMLElement>(".adminContextTitle strong");
    const descriptionNode = document.querySelector<HTMLElement>(".adminContextTitle small");
    if (!titleNode || !descriptionNode) return;

    const previousTitle = titleNode.textContent || "";
    const previousDescription = descriptionNode.textContent || "";
    const apply = (detail: HeaderDetail) => {
      titleNode.textContent = detail?.title || title;
      descriptionNode.textContent = detail?.description || description;
    };
    apply({ title, description });

    const handle = (event: Event) => apply((event as CustomEvent<HeaderDetail>).detail);
    window.addEventListener("admin:context-header", handle);
    return () => {
      window.removeEventListener("admin:context-header", handle);
      titleNode.textContent = previousTitle;
      descriptionNode.textContent = previousDescription;
    };
  }, [description, title]);

  return null;
}
