"use client";

import { useState } from "react";

export function CopyArticleLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = new URL(href, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      if (!document.execCommand("copy")) {
        input.remove();
        return;
      }
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} aria-live="polite">
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
