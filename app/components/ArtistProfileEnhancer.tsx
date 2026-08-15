"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const socialIcons: Record<string, string> = {
  Instagram: "◎",
  YouTube: "▶",
  TikTok: "♪",
  Spotify: "●",
};

export function ArtistProfileEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/artistas/")) return;

    const sidebar = document.querySelector<HTMLElement>(".artistSidebar");
    if (!sidebar || sidebar.dataset.enhanced === "true") return;

    const blocks = Array.from(sidebar.querySelectorAll<HTMLElement>(".sidebarBlock"));
    const socialBlock = blocks[1];
    if (!socialBlock) return;

    socialBlock.classList.add("artistSocialStatsBlock");
    const heading = socialBlock.querySelector<HTMLElement>(".eyebrow");
    if (heading) heading.textContent = "REDES SOCIAIS";

    const rows = Array.from(socialBlock.querySelectorAll<HTMLElement>(".socialMetric"));
    rows.forEach((row) => {
      const label = row.querySelector<HTMLElement>("span")?.textContent?.trim() ?? "";
      if (label === "SoundCloud") {
        row.remove();
        return;
      }

      row.classList.add("artistSocialStat");
      const value = row.querySelector<HTMLElement>("strong");
      if (value) value.textContent = "—";
      const labelNode = row.querySelector<HTMLElement>("span");
      if (labelNode) labelNode.setAttribute("data-icon", socialIcons[label] ?? "•");
    });

    const hasSpotifyMetric = Array.from(socialBlock.querySelectorAll<HTMLElement>(".socialMetric span"))
      .some((node) => node.textContent?.trim() === "Spotify");

    if (!hasSpotifyMetric) {
      const spotifyMetric = document.createElement("div");
      spotifyMetric.className = "socialMetric artistSocialStat";
      spotifyMetric.innerHTML = `<span data-icon="${socialIcons.Spotify}">Spotify</span><strong>—</strong>`;
      socialBlock.appendChild(spotifyMetric);
    }

    const listenBlock = document.createElement("div");
    listenBlock.className = "sidebarBlock artistListenBlock";
    listenBlock.innerHTML = `
      <p class="eyebrow dark">SIGA E OUÇA</p>
      <div class="artistPlatformLinks">
        <a href="#midia" aria-label="Ouvir no Spotify"><span class="platformIcon">●</span><strong>Spotify</strong><i>↗</i></a>
        <a href="#midia" aria-label="Assistir no YouTube"><span class="platformIcon">▶</span><strong>YouTube</strong><i>↗</i></a>
        <a href="#" aria-label="Acessar SoundCloud"><span class="platformIcon">☁</span><strong>SoundCloud</strong><i>↗</i></a>
        <a href="#" aria-label="Acessar TikTok"><span class="platformIcon">♪</span><strong>TikTok</strong><i>↗</i></a>
      </div>
    `;
    sidebar.appendChild(listenBlock);

    sidebar.dataset.enhanced = "true";
  }, [pathname]);

  return null;
}
