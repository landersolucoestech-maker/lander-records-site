import { Footer, Header } from "@/app/components/SiteChrome";
import { ArtistFilterGrid } from "./ArtistFilterGrid";
import { getArtistCategoriesForPublic, getPublishedArtists } from "@/modules/artists";
import { getPageContent } from "@/modules/pages";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("artists");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
    image: content?.ogImageUrl || undefined,
  });
}

export default async function ArtistsPage() {
  const [artists, categories, content] = await Promise.all([
    getPublishedArtists(),
    getArtistCategoriesForPublic(),
    getPageContent("artists"),
  ]);
  const hero = content?.sections.find((section) => section.sectionKey === "hero");
  const filtersSection = content?.sections.find((section) => section.sectionKey === "artist_filters");
  const listSection = content?.sections.find((section) => section.sectionKey === "artist_list");

  return (
    <main>
      <Header />
      {hero ? <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">ARTISTAS</span>
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        {hero.subtitle ? <p>{hero.subtitle}</p> : null}
      </section> : null}
      {filtersSection || listSection ? <section className="section artistListingSection">
        <ArtistFilterGrid artists={artists} categories={categories} showFilters={Boolean(filtersSection)} showList={Boolean(listSection)} />
      </section> : null}
      <Footer />
    </main>
  );
}
