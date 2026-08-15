import Link from "next/link";
import { Footer, Header } from "./components/SiteChrome";
import { artists } from "./data/site";
import { news } from "./data/news";
import { releases } from "./data/releases";

const homeShortcuts = [
  ["Contrate para shows", "/artistas/dj-stay"],
  ["Produza sua música", "/servicos/producao-musical"],
  ["Edição & distribuição", "/servicos/edicao-e-distribuicao"],
  ["Portal Lander", "/noticias"],
] as const;

export default function Home() {
  const featuredArtist = artists[0];

  return (
    <main>
      <Header />

      <section className="hero" id="inicio">
        <div className="heroGlow" />
        <div className="heroContent">
          <p className="eyebrow">LANDER RECORDS · BRASIL</p>
          <h1>Música com <span>estrutura.</span></h1>
          <p className="heroCopy">Gravadora, produção musical e gestão artística para construir carreira, catálogo e presença.</p>
          <div className="heroActions">
            <Link className="button buttonPrimary" href="/artistas">Conheça nossos artistas</Link>
            <Link className="button buttonGhost" href="/servicos/producao-musical">Produção musical</Link>
          </div>
        </div>
        <div className="heroRail" aria-hidden="true">LANDER · MUSIC · CULTURE · BUSINESS · LANDER · MUSIC · CULTURE · BUSINESS ·</div>
      </section>

      <section className="section intro" id="sobre">
        <div className="sectionHeading compactHeading">
          <p className="eyebrow dark">SOBRE A LANDER</p>
          <h2>Da música à <span>carreira.</span></h2>
        </div>
        <div className="splitFeature">
          <div className="studioVisual"><div className="visualBadge">ESTÚDIO · PRODUÇÃO · ESTRATÉGIA</div></div>
          <div className="redPanel">
            <h3>Gravadora e produtora musical</h3>
            <p>Uma operação integrada para desenvolvimento artístico, produção, distribuição, conteúdo e gestão.</p>
            <Link href="/sobre-nos">Conheça nossa história →</Link>
          </div>
        </div>
      </section>

      <section className="section shortcutSection" id="servicos">
        <div className="shortcutGrid">
          {homeShortcuts.map(([label, href], index) => (
            <Link className="shortcutOrb" href={href} key={label}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
              <i>↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="section darkSection homeArtists" id="artistas">
        <div className="sectionHeading inverse compactHeading">
          <p className="eyebrow">CASTING</p>
          <h2>Nossos <span>artistas.</span></h2>
        </div>
        <Link className="homeArtistFeature" href={`/artistas/${featuredArtist.slug}`}>
          <div className="artistImage" />
          <div className="artistMeta">
            <p className="artistTag">{featuredArtist.genre}</p>
            <h3>{featuredArtist.name}</h3>
            <p>Perfil, lançamentos, vídeos e plataformas em uma página dedicada.</p>
            <span className="textLink">Ver perfil completo →</span>
          </div>
        </Link>
        <div className="sectionFooterLink"><Link href="/artistas">Ver todo o casting →</Link></div>
      </section>

      <section className="section releasesSection">
        <div className="sectionHeading compactHeading">
          <p className="eyebrow dark">CATÁLOGO</p>
          <h2>Últimos <span>lançamentos.</span></h2>
        </div>
        <div className="releaseGrid">
          {releases.map((release, index) => (
            <article className={`releaseCard ${index === 0 ? "releaseCardFeatured" : ""}`} key={release.slug}>
              <div className="releaseCover"><span>LANDER</span></div>
              <div className="releaseInfo"><p>{release.type} · {release.date}</p><h3>{release.title}</h3><strong>{release.artist}</strong><a href="#">Ouvir agora →</a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section homeNews" id="noticias">
        <div className="sectionHeading compactHeading">
          <p className="eyebrow dark">PORTAL LANDER</p>
          <h2>Últimas <span>novidades.</span></h2>
        </div>
        <div className="homeNewsGrid">
          {news.slice(0, 3).map((item, index) => (
            <Link className={`newsCard ${index === 0 ? "newsCardFeatured" : ""}`} href={`/noticias/${item.slug}`} key={item.slug}>
              <div className="newsImage"><span>{item.category}</span></div>
              <div className="newsCardBody">
                <p className="newsMeta">{item.category} · {item.date}</p>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <strong>Ler matéria →</strong>
              </div>
            </Link>
          ))}
        </div>
        <div className="sectionFooterLink darkLink"><Link href="/noticias">Acessar Portal de Notícias →</Link></div>
      </section>

      <section className="ctaSection compactCta" id="contato">
        <p className="eyebrow">CONTATO</p>
        <h2>Vamos falar sobre o seu <span>projeto.</span></h2>
        <Link className="button buttonLight" href="/contato">Fale com a Lander</Link>
      </section>

      <Footer />
    </main>
  );
}
