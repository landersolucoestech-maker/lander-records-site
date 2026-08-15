import type { Metadata } from "next";
import "./globals.css";
import "./architecture.css";
import "./home-extra.css";
import "./refinements.css";
import "./content-completion.css";
import { LazyReveal } from "./components/LazyReveal";
import { SiteIntro } from "./components/SiteIntro";
import { ArtistProfileEnhancer } from "./components/ArtistProfileEnhancer";

export const metadata: Metadata = {
  title: "Lander Records",
  description: "Gravadora, produtora musical e gestão artística 360°.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteIntro />
        <LazyReveal />
        <ArtistProfileEnhancer />
        {children}
      </body>
    </html>
  );
}
