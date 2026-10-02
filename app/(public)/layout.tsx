import type { ReactNode } from "react";
import { Footer, Header } from "@/app/components/SiteChrome";
import { SkipLink } from "@/app/components/SkipLink";
import { LazyReveal } from "@/app/components/LazyReveal";
import { PageTransitionLoader } from "@/app/components/PageTransitionLoader";
import "@/styles/public/index.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTransitionLoader />
      <LazyReveal />
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}
