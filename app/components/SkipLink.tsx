"use client";

export function SkipLink() {
  function focusMainContent() {
    window.requestAnimationFrame(() => {
      const main = document.getElementById("main-content");
      main?.focus({ preventScroll: true });
      main?.scrollIntoView({ block: "start" });
    });
  }

  return <a className="skipLink" href="#main-content" onClick={focusMainContent}>Pular para o conteúdo</a>;
}
