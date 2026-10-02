import type { Metadata } from "next";
import "@/styles/base.css";

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
        {children}
      </body>
    </html>
  );
}
