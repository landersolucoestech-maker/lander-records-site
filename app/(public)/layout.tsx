import type { ReactNode } from "react";
import { Footer, Header } from "@/app/components/SiteChrome";
import { SkipLink } from "@/app/components/SkipLink";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}
