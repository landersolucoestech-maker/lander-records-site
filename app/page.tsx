import Link from "next/link";
import { Footer, Header } from "./components/SiteChrome";
import { getFeaturedReleases, getPageContent, getPublishedArtists, getPublishedPosts } from "../lib/content";
import { buildMetadata } from "../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("home");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
  });
}

function sectionByKey(content: Awaited<ReturnType<typeof getPageContent>>, key: string) {
  return content?.sections.find((section) => section.sectionKey === key);
}

function bodyParagraphs(body: string) {
  return body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

function editorialTitle(title: string) {
  const parts = title.trim().split(/\s+/);
  const last = parts.pop() || "";
  return <>{parts.join(" ")} {last ? <span>{last}</span> : null}</>;
}

export default async function Home() {
  const [content, featuredArtists, featuredPosts, featuredReleases] = await Promise.all([
    getPageContent("home"),
    getPublishedArtists(true),
    getPublishedPosts(true),
    getFeaturedReleases(),
  ]);

  if (!content) throw new Error("The home page has not been seeded in the CMS.");

  const hero = sectionByKey(content, "hero");
  const intro = sectionByKey(content, "intro");
  const shortcuts = sectionByKey(content, "shortcuts");
  const artistsSection = sectionByKey(content, "artists");
  const releasesSection = sectionByKey(content, "releases");
  const newsSection = sectionByKey(content, "news");

  return (
    <main className="homeV2">
      <Header />

      {hero ? (
        <section className="homeHero">
          <div className="homeHeroBackdrop" />
          <div className="homeHeroContent">
            <h1>{hero.title}</h1>
            <p>{hero.subtitle}</p>
            <div className="homeHeroActions">
              {hero.items.map((item, index) => (
                <Link key={item.id} className={`button ${index === 0 ? "buttonPrimary" : "buttonOutline"}`} href={item.url || "/"}>
                  {item.label || item.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="homeMainSection">
        {intro ? (
          <div className="homeIntroCard">
            <div className="homeIntroImage" />
            <div className="homeIntroCopy">
              <h2>{intro.title}</h2>
              {bodyParagraphs(intro.body).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {intro.items[0]?.url ? <Link href={intro.items[0].url}>{intro.items[0].label || intro.items[0].title} →</Link> : null}
            </div>
          </div>
        ) : null}

        {shortcuts ? (
          <div className="homeShortcutRow">
            {shortcuts.items.map((item, index) => (
              <Link className="homeShortcutCircle" href={item.url || "/"} key={item.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.label || item.title}</strong>
                <i>↗</i>
              </Link>
            ))}
          </div>
        ) : null}

        {artistsSection ? (
          <section className="homeBlock">
            <div className="homeBlockHeader">
              <h2 className="homeEditorialTitle">{editorialTitle(artistsSection.title)}</h2>
              <Link href="/artistas">Ver todos os artistas →</Link>
            </div>
            {artistsSection.subtitle ? <p className="homeBlockSubtitle">{artistsSection.subtitle}</p> : null}
            <div className="homeArtistGrid">
              {featuredArtists.map((artist) => (
                <Link className="homeArtistCard" href={`/artistas/${artist.slug}`} key={artist.id}>
                  <div className="homeArtistPhoto" style={artist.cardImage ? { backgroundImage: `url(${artist.cardImage})` } : undefined} />
                  <div className="homeArtistInfo">
                    <strong>{artist.name}</strong>
                    <span>{artist.eyebrow || artist.categories.map((category) => category.name).join(" · ")}</span>
                    <small>VER PERFIL COMPLETO →</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {releasesSection ? (
          <section className="homeBlock">
            <div className="homeBlockHeader">
              <h2 className="homeEditorialTitle">{editorialTitle(releasesSection.title)}</h2>
              {releasesSection.items[0]?.url ? <a href={releasesSection.items[0].url} target="_blank" rel="noreferrer">{releasesSection.items[0].label} →</a> : null}
            </div>
            <div className="releaseGrid">
              {featuredReleases.slice(0, 5).map(({ release, coverUrl }, index) => (
                <a
                  className={`releaseCard ${index === 0 ? "releaseFeatured" : ""}`}
                  href={release.platformUrl || "#"}
                  target={release.platformUrl ? "_blank" : undefined}
                  rel={release.platformUrl ? "noreferrer" : undefined}
                  key={release.id}
                >
                  <div className="releaseCover" style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}>
                    <span>{release.platform}</span>
                  </div>
                  <div><strong>{release.title}</strong><p>{release.artistName}</p></div>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {newsSection ? (
          <section className="homeBlock">
            <div className="homeBlockHeader">
              <div>
                <p className="homePortalLabel">{newsSection.eyebrow}</p>
                <h2 className="homeEditorialTitle">{editorialTitle(newsSection.title)}</h2>
              </div>
              <Link href="/noticias">Ver todas as notícias →</Link>
            </div>
            <div className="homeNewsEditorial">
              {featuredPosts[0] ? (
                <Link className="homeNewsLead" href={`/noticias/${featuredPosts[0].slug}`}>
                  <span>{featuredPosts[0].category?.name || "Notícia"}</span>
                  <strong>{featuredPosts[0].title}</strong>
                  <small>{featuredPosts[0].publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(featuredPosts[0].publishedAt) : ""}</small>
                </Link>
              ) : null}
              <div className="homeNewsSide">
                {featuredPosts.slice(1, 3).map((post) => (
                  <Link href={`/noticias/${post.slug}`} key={post.id}>
                    <span>{post.category?.name || "Notícia"}</span>
                    <strong>{post.title}</strong>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </section>
      <Footer />
    </main>
  );
}
