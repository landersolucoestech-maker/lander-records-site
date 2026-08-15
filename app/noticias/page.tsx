import { Footer, Header } from "../components/SiteChrome";
import { NewsFilterGrid } from "./NewsFilterGrid";

export default function NewsPage() {
  return (
    <main>
      <Header />
      <section className="pageHero portalHero">
        <span className="portalWord" aria-hidden="true">PORTAL</span>
        <p className="eyebrow">LANDER RECORDS</p>
        <h1>Portal de Notícias</h1>
        <p>Lançamentos, bastidores, mercado e novidades do nosso universo.</p>
      </section>
      <section className="section newsListingSection">
        <NewsFilterGrid />
      </section>
      <Footer />
    </main>
  );
}
