import Link from "next/link";
import { Footer, Header } from "./components/SiteChrome";
import spotifyReleases from "./data/spotify-releases.json";

const shortcuts = [
  ["Contrate para shows", "/artistas/dj-stay"],
  ["Produza sua música", "/sobre-nos#metodologia"],
  ["Edição & distribuição", "/sobre-nos#metodologia"],
  ["Portal Lander", "/noticias"],
] as const;

const releaseFallback = Array.from({ length: 5 }, (_, index) => ({ id: `placeholder-${index}`, title: "Lançamento Lander Records", artists: "Playlist oficial em configuração", album: "", image: "", spotifyUrl: "", addedAt: "" }));

export default function Home() {
  const releases = spotifyReleases.length ? spotifyReleases : releaseFallback;
  return (
    <main className="homeV2"><Header />
      <section className="homeHero"><div className="homeHeroBackdrop" /><div className="homeHeroContent"><h1>LANDER</h1><p>Gravadora e produtora musical com foco em funk.</p><div className="homeHeroActions"><Link className="button buttonPrimary" href="/contato">Fale conosco</Link><Link className="button buttonOutline" href="/artistas">Conheça nossos artistas</Link></div></div></section>
      <section className="homeMainSection"><div className="homeIntroCard"><div className="homeIntroImage" /><div className="homeIntroCopy"><h2>Produtora artística e<br/>gravadora musical</h2><p>A Lander Records reúne produção, desenvolvimento artístico, distribuição e estratégia em uma operação focada em música e carreira.</p><p>Da criação ao lançamento, cada projeto recebe acompanhamento próximo e execução profissional.</p><Link href="/sobre-nos">Conheça a Lander →</Link><div className="homeSocialMetrics homeSocialMetricsInside" aria-label="Números das redes sociais da Lander Records"><article className="socialMetricCard socialMetricInstagram"><div className="socialMetricTop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1"/></svg><span>Instagram</span></div><strong data-social-metric="instagram-followers">—</strong><p>seguidores</p></article><article className="socialMetricCard socialMetricYoutube"><div className="socialMetricTop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/></svg><span>YouTube</span></div><strong data-social-metric="youtube-subscribers">—</strong><p>inscritos</p></article></div></div></div>
        <div className="homeShortcutRow">{shortcuts.map(([label,href],index)=><Link className="homeShortcutCircle" href={href} key={label}><span>0{index+1}</span><strong>{label}</strong><i>↗</i></Link>)}</div>
        <section className="homeBlock"><div className="homeBlockHeader"><h2 className="homeEditorialTitle">NOSSOS <span>ARTISTAS</span></h2><Link href="/artistas">Ver todos os artistas →</Link></div><p className="homeBlockSubtitle">Conheça os talentos que fazem parte do nosso time.</p><div className="homeArtistGrid"><Link className="homeArtistCard" href="/artistas/dj-stay"><div className="homeArtistPhoto" /><div className="homeArtistInfo"><strong>DJ Stay</strong><span>DJ / Produtor Musical</span><small>VER PERFIL COMPLETO →</small></div></Link></div></section>
        <section className="homeBlock"><div className="homeBlockHeader"><h2 className="homeEditorialTitle">ÚLTIMOS <span>LANÇAMENTOS</span></h2><a href="https://open.spotify.com" target="_blank" rel="noreferrer">Ver no Spotify →</a></div><div className="releaseGrid">{releases.slice(0,5).map((release,index)=><a className={`releaseCard ${index===0?"releaseFeatured":""}`} href={release.spotifyUrl || "https://open.spotify.com"} target="_blank" rel="noreferrer" key={release.id}><div className="releaseCover" style={release.image?{backgroundImage:`url(${release.image})`}:undefined}><span>SPOTIFY</span></div><div><strong>{release.title}</strong><p>{release.artists}</p></div></a>)}</div></section>
        <section className="homeBlock"><div className="homeBlockHeader"><div><p className="homePortalLabel">PORTAL LANDER</p><h2 className="homeEditorialTitle">ÚLTIMAS <span>NOVIDADES</span></h2></div><Link href="/noticias">Ver todas as notícias →</Link></div><div className="homeNewsEditorial"><Link className="homeNewsLead" href="/noticias"><span>Mercado</span><strong>Faça parte do Casting de Produtores da Lander Records</strong><small>23 de mar. de 2026</small></Link><div className="homeNewsSide"><Link href="/noticias"><span>Notícia</span><strong>Conteúdos, bastidores e novidades da cena musical.</strong></Link><Link href="/noticias"><span>Lançamento</span><strong>Acompanhe os próximos lançamentos da Lander Records.</strong></Link></div></div></section>
      </section><Footer />
    </main>
  );
}
