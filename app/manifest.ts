import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lander Records",
    short_name: "Lander Records",
    description: "Gravadora, produtora musical e gestão artística 360°.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      { src: "/lander-records-logo.webp", sizes: "512x512", type: "image/webp" },
    ],
  };
}
