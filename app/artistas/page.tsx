import { Footer, Header } from "../components/SiteChrome";
import { ArtistFilterGrid } from "./ArtistFilterGrid";
import { getArtistCategoriesForPublic, getPageContent, getPublishedArtists } from "../../lib/content";
import { buildMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("artists");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
  });
}

export default async function ArtistsPage() {
  const [artists, categories, content] = await Promise.all([
    getPublishedArtists(),
    getArtistCategoriesForPublic(),
    getPageContent("artists"),
  ]);
  const hero = content?.sections.find((section) => section.sectionKey === "hero");

  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">ARTISTAS</span>
        <p className="eyebrow">{hero?.eyebrow || "CASTING"}</p>
        <h1>{hero?.title || content?.page.title || ""}</h1>
        {hero?.subtitle ? <p>{hero.subtitle}</p> : null}
      </section>
      <section className="section artistListingSection">
        <ArtistFilterGrid artists={artists} categories={categories} />
      </section>
      <Footer />
    </main>
  );
}
