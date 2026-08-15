import { Footer, Header } from "../components/SiteChrome";
import { ArtistFilterGrid } from "./ArtistFilterGrid";

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
        <ArtistFilterGrid />
      </section>
      <Footer />
    </main>
  );
}
