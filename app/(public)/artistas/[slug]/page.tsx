import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublishedArtistBySlug, getSlugRedirect } from "@/modules/artists";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { trustedEmbedUrl, trustedExternalUrl } from "@/lib/media-embed";

export const dynamic = "force-dynamic";

const metricLabels: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getPublishedArtistBySlug(slug);
  if (!artist) return {};
  return buildMetadata({
    title: artist.seoTitle || artist.name,
    description: artist.seoDescription || artist.shortBio,
    canonical: artist.canonicalUrl || absoluteUrl(`/artistas/${artist.slug}`),
    image: artist.ogImage || artist.heroImage || artist.cardImage || undefined,
  });
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getPublishedArtistBySlug(slug);
  if (!artist) {
    const nextSlug = await getSlugRedirect("artist", slug);
    if (nextSlug) redirect(`/artistas/${nextSlug}`);
    notFound();
  }

  const identityLine = artist.genres.length
    ? artist.genres.join(" · ")
    : artist.roles.length
      ? artist.roles.join(" · ")
      : artist.eyebrow || artist.categories.map((category) => category.name).join(" · ");
  const metrics = Object.entries(artist.metrics).filter(([, value]) => value > 0);
  const bookingHref = `/contato?assunto=contratacao-de-artista&artista=${encodeURIComponent(artist.name)}`;

  return (
    <>
      <section
        className="artistProfileHero artistPhotoHero"
        style={{
          backgroundImage: artist.heroImage
            ? `linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.34) 48%, rgba(0,0,0,.12) 100%), url(${artist.heroImage})`
            : "linear-gradient(90deg, rgba(0,0,0,.92), rgba(0,0,0,.65))",
        }}
      >
        <div className="artistProfileOverlay">
          <p className="eyebrow">{identityLine}</p>
          <h1>{artist.name}</h1>
          <div className="artistHeroActions">
            {artist.embeds.length ? <a className="button buttonPrimary" href="#midia">Ouvir agora</a> : null}
            <Link className="button buttonGhost" href={bookingHref}>{artist.profile.hireButtonLabel}</Link>
          </div>
        </div>
      </section>

      <section className="section artistProfileBody">
        <article>
          <p className="eyebrow dark">BIOGRAFIA</p>
          <h2>{artist.name}</h2>
          <div className="profileBio">{artist.biography.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>

          {artist.embeds.length ? (
            <div className="embedGrid" id="midia">
              {artist.embeds.map((embed) => {
                const type = embed.type.toLowerCase();
                const resolvedEmbedUrl = trustedEmbedUrl(embed.type, embed.url);
                const externalUrl = type === "youtube" || type === "spotify" ? "" : trustedExternalUrl(embed.url);
                return (
                  <div className="artistEmbed" key={embed.id}>
                    <span>{embed.type.toUpperCase()}</span>
                    <strong>{embed.title}</strong>
                    {type === "youtube" && resolvedEmbedUrl ? (
                      <iframe src={resolvedEmbedUrl} title={embed.title || `Vídeo de ${artist.name}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : type === "spotify" && resolvedEmbedUrl ? (
                      <iframe src={resolvedEmbedUrl} title={embed.title || `Spotify de ${artist.name}`} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
                    ) : externalUrl ? (
                      <a className="button buttonOutline" href={externalUrl} target="_blank" rel="noreferrer">Abrir {embed.type} ↗</a>
                    ) : <em>Mídia indisponível</em>}
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>

        <aside className="artistSidebar">
          <div className="sidebarBlock">
            <p className="eyebrow dark">{artist.profile.hireTitle.toUpperCase()}</p>
            {artist.profile.hireText ? <p>{artist.profile.hireText}</p> : null}
            <Link className="button buttonPrimary" href={bookingHref}>{artist.profile.hireButtonLabel}</Link>
          </div>
          {metrics.length ? (
            <div className="sidebarBlock">
              <p className="eyebrow dark">MÉTRICAS</p>
              <div className="artistPlatformLinks">{metrics.map(([platform, value]) => <div key={platform}><strong>{metricLabels[platform] || platform}</strong><i>{value.toLocaleString("pt-BR")}</i></div>)}</div>
            </div>
          ) : null}
          {artist.links.length ? (
            <div className="sidebarBlock">
              <p className="eyebrow dark">REDES E PLATAFORMAS</p>
              <div className="artistPlatformLinks">
                {artist.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer"><strong>{link.label || link.platform}</strong><i>↗</i></a>)}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {artist.slug === "dj-stay" ? (
        <section className="artistMediaPromoSection" aria-label={`Contrate ${artist.name}`}>
          <Link className="artistMediaPromo" href={bookingHref} aria-label={`Contrate ${artist.name}`}>
            <Image src="/dj-stay-wide.webp" alt={`Contrate ${artist.name}`} width={1200} height={675} />
          </Link>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicGroup",
            name: artist.name,
            url: absoluteUrl(`/artistas/${artist.slug}`),
            image: artist.heroImage || artist.cardImage || undefined,
            description: artist.shortBio || artist.biography,
            genre: artist.genres,
            sameAs: artist.links.map((link) => link.url),
          }),
        }}
      />
    </>
  );
}
