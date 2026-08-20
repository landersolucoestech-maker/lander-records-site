import type { Metadata } from "next";
import "./globals.css";
import "./architecture.css";
import "./home-extra.css";
import "./home-artist-card.css";
import "./refinements.css";
import "./content-completion.css";
import "./artist-profile.css";
import "./ecosystem-refresh.css";
import "./scroll-reveal.css";
import "./hero-wordmarks.css";
import "./page-transition-loader.css";
import "./artists-grid-image.css";
import "./site-polish.css";
import "./home-current-polish.css";
import "./navigation-polish.css";
import "./admin/admin.css";
import { LazyReveal } from "./components/LazyReveal";
import { PageTransitionLoader } from "./components/PageTransitionLoader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://landerrecords.com"),
  title: {
    default: "Lander Records",
    template: "%s | Lander Records",
  },
  description: "Gravadora, produtora musical e gestão artística 360°.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <PageTransitionLoader />
        <LazyReveal />
        {children}
      </body>
    </html>
  );
}
