import Link from "next/link";
import { Footer, Header } from "./components/SiteChrome";
import spotifyReleases from "./data/spotify-releases.json";

const shortcuts = [
  ["Contrate para shows", "/artistas/dj-stay"],
  ["Produza sua música", "/servicos/producao-musical"],
  ["Edição & distribuição", "/servicos/edicao-e-distribuicao"],
  ["Portal Lander", "/noticias"],
] as const;

const releaseFallback = Array.from({ length: 5 }, (_, index) => ({
  id: `placeholder-${index}`,
  title: "Lançamento Lander Records",
  artists: "Playlist oficial em configuração",
  album: "",
  image: "",
  spotifyUrl: "",
  addedAt: "",
}));

export default function Home() {
  const releases = spotifyReleases.length ? spotifyReleases : releaseFallback;

  return (
    <main className="homeV2">
      <Header />

      <section className="homeHero">
        <div className="homeHeroBackdrop" />
        <div className="homeHeroContent">
          <h1>LANDER</h1>
          <p>Gravadora e produtora musical com foco em funk.</p>
          <div className="homeHeroActions">
            <Link className="button buttonPrimary" href="/contato">Fale conosco</Link>
            <Link className="button buttonOutline" href="/artistas">Conheça nossos artistas</Link>
          </div>
        </div>
      </section>

      <section className="homeMainSection">
        <div className="homeIntroCard">
          <div className="homeIntroImage" />
          <div className="homeIntroCopy">
            <h2>Produtora artística e<br/>gravadora musical</h2>
            <p>A Lander Records reúne produção, desenvolvimento artístico, distribuição e estratégia em uma operação focada em música e carreira.</p>
            <p>Da criação ao lançamento, cada projeto recebe acompanhamento próximo e execução profissional.</p>
            <Link href="/sobre-nos">Conheça a Lander →</Link>
          </div>
        </div>

        <div className="homeShortcutRow">
          {shortcuts.map(([label, href], index) => (
            <Link className="homeShortcutCircle" href={href} key={label}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
              <i>↗</i>
            </Link>
          ))}
        </div>

        <section className="homeBlock">
          <div className="homeBlockHeader">
            <h2>NOSSOS <span>ARTISTAS</span></h2>
            <Link href="/artistas">Ver todos os artistas →</Link>
          </div>
          <p className="homeBlockSubtitle">Conheça os talentos que fazem parte do nosso time.</p>
          <div className="homeArtistGrid">
            <Link className="homeArtistCard" href="/artistas/dj-stay">
              <div className="homeArtistPhoto" />
              <div className="homeArtistInfo">
                <h3>DJ Stay</h3>
                <p>DJ / Produtor Musical</p>
                <span>Ver perfil completo →</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="homeBlock spotifyReleasesSection">
          <div className="homeBlockHeader">
            <div>
              <h2>ÚLTIMOS <span>LANÇAMENTOS</span></h2>
              <p className="spotifySource">Atualizados automaticamente pela playlist oficial da Lander Records no Spotify.</p>
            </div>
          </div>
          <div className="spotifyReleaseGrid">
            {releases.slice(0, 5).map((release, index) => {
              const card = (
                <>
                  <div className="spotifyReleaseCover">
                    {release.image ? <img src={release.image} alt={`Capa de ${release.title}`} /> : <div className="spotifyReleasePlaceholder">LANDER</div>}
                    <span className="spotifyIndex">0{index + 1}</span>
                  </div>
                  <div className="spotifyReleaseCopy">
                    <small>SPOTIFY</small>
                    <h3>{release.title}</h3>
                    <p>{release.artists}</p>
                    <strong>{release.spotifyUrl ? "Ouvir no Spotify ↗" : "Aguardando integração"}</strong>
                  </div>
                </>
              );

              return release.spotifyUrl ? (
                <a className="spotifyReleaseCard" href={release.spotifyUrl} target="_blank" rel="noreferrer" key={release.id}>{card}</a>
              ) : (
                <article className="spotifyReleaseCard" key={release.id}>{card}</article>
              );
            })}
          </div>
        </section>

        <section className="homeBlock homeNewsBlock">
          <div className="homeBlockHeader">
            <div><small>PORTAL LANDER</small><h2>ÚLTIMAS <span>NOVIDADES</span></h2></div>
            <Link href="/noticias">Ver todas as notícias →</Link>
          </div>
          <div className="homeNewsEditorial">
            <Link className="homeNewsFeatured" href="/noticias/faca-parte-do-casting-de-produtores-da-lander-records">
              <div className="newsFeaturedArtwork" />
              <div className="newsFeaturedCopy"><em>Mercado</em><h3>Faça Parte do Casting de Produtores da Lander Records</h3><time>23 de mar. de 2026</time></div>
            </Link>
            <div className="homeNewsSide">
              <Link href="/noticias"><em>Notícia</em><h3>Tati Quebra Barraco denuncia uso indevido de músicas e reacende debate sobre direitos no funk</h3><time>23 de mar. de 2026</time></Link>
              <Link href="/noticias"><em>Lançamento</em><h3>Rapha Radamás celebra 10 anos de carreira com lançamento de “Lá Vem”</h3><time>27 de fev. de 2026</time></Link>
            </div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
