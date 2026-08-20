import { Footer, Header } from "../components/SiteChrome";
import { NewsFilterGrid } from "./NewsFilterGrid";
import { getPageContent, getPostCategoriesForPublic, getPublishedPosts } from "../../lib/content";
import { buildMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("news");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
    image: content?.ogImageUrl || undefined,
  });
}

export default async function NewsPage() {
  const [posts, categories, content] = await Promise.all([
    getPublishedPosts(),
    getPostCategoriesForPublic(),
    getPageContent("news"),
  ]);
  const hero = content?.sections.find((section) => section.sectionKey === "hero");
  const categoriesSection = content?.sections.find((section) => section.sectionKey === "news_categories");
  const listSection = content?.sections.find((section) => section.sectionKey === "news_list");

  return (
    <main>
      <Header />
      {hero ? <section className="pageHero portalHero">
        <span className="portalWord" aria-hidden="true">PORTAL</span>
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        {hero.subtitle ? <p>{hero.subtitle}</p> : null}
      </section> : null}
      {categoriesSection || listSection ? <section className="section newsListingSection">
        <NewsFilterGrid
          posts={posts.map((post) => ({ ...post, publishedAt: post.publishedAt?.toISOString() ?? null }))}
          categories={categories}
          showFilters={Boolean(categoriesSection)}
          showList={Boolean(listSection)}
        />
      </section> : null}
      <Footer />
    </main>
  );
}
