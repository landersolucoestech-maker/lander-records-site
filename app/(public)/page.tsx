import Link from "next/link";
import { getPageContent } from "@/modules/pages";
import { getPublishedArtists } from "@/modules/artists";
import { getPublishedPosts } from "@/modules/posts";
import { getHomeSpotifyReleaseFeed, getLanderRecordsSocialMetrics } from "@/lib/integrations/sync";
import { buildMetadata } from "@/lib/seo";

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

function newsBackground(image: string) {
  return image ? {
    backgroundImage: `linear-gradient(145deg,rgba(0,0,0,.12),rgba(0,0,0,.38)),url(${image})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : undefined;
}

function releaseDateLabel(value: string) {
  const match = value.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!match) return value;
  const [, year, month, day] = match;
  if (!month) return year;
  if (!day) return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${year}-${month}-${day}T00:00:00Z`));
}

export default async function Home() {
  const [content, featuredArtists, featuredPosts, spotifyFeed, socialMetrics] = await Promise.all([
    getPageContent("home"),
    getPublishedArtists(true),
    getPublishedPosts(true),
    getHomeSpotifyReleaseFeed(),
    getLanderRecordsSocialMetrics(),
  ]);

  if (!content) throw new Error("The home page has not been seeded in the CMS.");

  const hero = sectionByKey(content, "hero");
  const intro = sectionByKey(content, "intro");
  const shortcuts = sectionByKey(content, "shortcuts");
  const artistsSection = sectionByKey(content, "artists");
  const releasesSection = sectionByKey(content, "releases");
  const advertiseSection = sectionByKey(content, "advertise_banner");
  const newsSection = sectionByKey(content, "news");
  const advertiseBanner = advertiseSection?.items[0];
  const instagramFollowers = socialMetrics["instagram:followers"];
  const youtubeSubscribers = socialMetrics["youtube:subscribers"];

  return (
    <div className="homeV2">

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
              <div className="homeSocialMetrics homeSocialMetricsInside" aria-label="Números das redes sociais da Lander Records">
                <article className="socialMetricCard socialMetricInstagram"><div className="socialMetricTop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg><span>Instagram</span></div><strong>{typeof instagramFollowers === "number" ? instagramFollowers.toLocaleString("pt-BR") : "—"}</strong><p>seguidores</p></article>
                <article className="socialMetricCard socialMetricYoutube"><div className="socialMetricTop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg><span>YouTube</span></div><strong>{typeof youtubeSubscribers === "number" ? youtubeSubscribers.toLocaleString("pt-BR") : "—"}</strong><p>inscritos</p></article>
              </div>
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
                    <span>{artist.eyebrow || artist.roles.join(" · ") || artist.categories.map((category) => category.name).join(" · ")}</span>
                    <small>VER PERFIL COMPLETO →</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {releasesSection && spotifyFeed.releases.length > 0 ? (
          <section className="homeBlock homeReleasesBlock" aria-labelledby="home-releases-title">
            <div className="homeBlockHeader">
              <h2 className="homeEditorialTitle" id="home-releases-title">{editorialTitle(releasesSection.title || "Últimos Lançamentos")}</h2>
              {spotifyFeed.playlistUrl ? <a href={spotifyFeed.playlistUrl} target="_blank" rel="noreferrer">Abrir playlist no Spotify →</a> : null}
            </div>
            {releasesSection.subtitle ? <p className="homeBlockSubtitle">{releasesSection.subtitle}</p> : null}
            <div className="releaseGrid">
              {spotifyFeed.releases.slice(0, 5).map((release) => (
                <a className="releaseCard" href={release.spotifyUrl} target="_blank" rel="noreferrer" key={`${release.position}-${release.albumId}-${release.title}`}>
                  <div className="releaseCover" style={release.coverUrl ? { backgroundImage: `url(${release.coverUrl})` } : undefined}><span>Spotify</span></div>
                  <div className="releaseCardBody">
                    <strong>{release.title}</strong>
                    <p>{release.artistName}</p>
                    <div className="releaseMeta"><span>{releaseDateLabel(release.releaseDate)}</span><b>OUVIR ↗</b></div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {advertiseSection && advertiseBanner?.mediaUrl ? (
          <section aria-label={advertiseBanner.title || "Anuncie com a Lander Records"} style={{ marginTop: 24 }}>
            {/* CMS media can come from the static bundle or object storage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={advertiseBanner.mediaUrl}
              alt={advertiseBanner.mediaAltText || advertiseBanner.title || "Anuncie com a gente — Lander Records"}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </section>
        ) : null}

        {newsSection ? (
          <section className="homeBlock">
            <div className="homeBlockHeader">
              <div><p className="homePortalLabel">{newsSection.eyebrow}</p><h2 className="homeEditorialTitle">{editorialTitle(newsSection.title)}</h2></div>
              <Link href="/noticias">Ver todas as notícias →</Link>
            </div>
            <div className="homeNewsEditorial">
              {featuredPosts[0] ? <Link className="homeNewsLead" href={`/noticias/${featuredPosts[0].slug}`} style={newsBackground(featuredPosts[0].coverImage)}><span>{featuredPosts[0].category?.name || "Notícia"}</span><strong>{featuredPosts[0].title}</strong><small>{featuredPosts[0].publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(featuredPosts[0].publishedAt) : ""}</small></Link> : null}
              <div className="homeNewsSide">{featuredPosts.slice(1, 3).map((post) => <Link href={`/noticias/${post.slug}`} key={post.id} style={newsBackground(post.coverImage)}><span>{post.category?.name || "Notícia"}</span><strong>{post.title}</strong></Link>)}</div>
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
