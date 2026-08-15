import Link from "next/link";
import { Footer, Header } from "./components/SiteChrome";

const shortcuts = [
  ["Contrate para shows", "/artistas/dj-stay"],
  ["Produza sua música", "/servicos/producao-musical"],
  ["Edição & distribuição", "/servicos/edicao-e-distribuicao"],
  ["Portal Lander", "/noticias"],
] as const;

export default function Home() {
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

        <section className="homeBlock">
          <div className="homeBlockHeader">
            <h2>ÚLTIMOS <span>LANÇAMENTOS</span></h2>
            <Link href="/noticias">Ver todos os lançamentos →</Link>
          </div>
          <div className="homeReleaseGrid">
            <article className="homeReleaseMain"><div className="releaseArtwork releaseArtworkMain"/><div className="releaseOverlay"><button aria-label="Reproduzir">▶</button><strong>Piano dos Cachorrão</strong><span>MC Toy DJ · Prod. DJ WZ7</span></div></article>
            <div className="homeReleaseSide">
              <article className="homeReleaseSmall"><div className="releaseArtwork releaseArtwork2"/><div className="releaseSmallCopy"><strong>Eu te Taquei</strong><span>MC 2C</span></div></article>
              <article className="homeReleaseSmall"><div className="releaseArtwork releaseArtwork3"/><div className="releaseSmallCopy"><strong>Falcatrua</strong><span>DJ Stay</span></div></article>
            </div>
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
