import Link from "next/link";
import { Footer, Header } from "../components/SiteChrome";
import { artists } from "../data/site";

export default function ArtistsPage() {
  return (
    <main>
      <Header />
      <section className="pageHero">
        <p className="eyebrow">CASTING</p>
        <h1>Nosso Elenco</h1>
        <p>Conheça os artistas que fazem parte da Lander Records.</p>
      </section>
      <section className="section artistListingSection">
        <div className="filterRow"><button className="active">Todos</button><button>DJ</button><button>MC</button><button>Pagodão Baiano</button></div>
        <div className="artistGrid">
          {artists.map((artist) => (
            <Link className="artistTile" key={artist.slug} href={`/artistas/${artist.slug}`}>
              <div className="artistTileImage" />
              <div className="artistTileBody"><p>{artist.genre}</p><h2>{artist.name}</h2><span>Ver perfil completo →</span></div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
