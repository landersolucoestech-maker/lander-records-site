import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer, Header } from "../../components/SiteChrome";
import { artists } from "../../data/site";

export function generateStaticParams() {
  return artists.map((artist) => ({ slug: artist.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((item) => item.slug === slug);
  if (!artist) notFound();

  return (
    <main>
      <Header />
      <section className="artistProfileHero">
        <div className="artistProfileImage" />
        <div className="artistProfileOverlay">
          <p className="eyebrow">{artist.genre}</p>
          <h1>{artist.name}</h1>
          <div className="artistHeroActions"><a className="button buttonPrimary" href="#midia">Ouvir agora</a><Link className="button buttonGhost" href="/#contato">Contratar</Link></div>
        </div>
      </section>
      <section className="section artistProfileBody">
        <article>
          <p className="eyebrow dark">BIOGRAFIA</p>
          <h2>{artist.name}</h2>
          <p className="profileBio">{artist.bio}</p>
          <div className="embedGrid" id="midia">
            <div className="embedPlaceholder"><span>SPOTIFY</span><strong>Embed do artista / lançamento</strong><small>Configurável pelo painel</small></div>
            <div className="embedPlaceholder"><span>YOUTUBE</span><strong>Vídeo em destaque</strong><small>Configurável pelo painel</small></div>
          </div>
        </article>
        <aside className="artistSidebar">
          <div className="sidebarBlock"><p className="eyebrow dark">CONTRATAÇÃO</p><Link className="button buttonPrimary" href="/#contato">Quero contratar</Link></div>
          <div className="sidebarBlock"><p className="eyebrow dark">REDES E PLATAFORMAS</p>{artist.socials.map((social) => <div className="socialMetric" key={social}><span>{social}</span><strong>Sincronização automática</strong></div>)}</div>
        </aside>
      </section>
      <Footer />
    </main>
  );
}
