import Link from "next/link";
import { Footer, Header } from "../components/SiteChrome";
import { news } from "../data/news";

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
        <div className="filterRow"><button className="active">Todos</button><button>Bastidores</button><button>Lançamentos</button><button>Notícias</button><button>Entretenimento</button><button>Mercado</button></div>
        <div className="newsGrid">
          {news.map((item, index) => (
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
      </section>
      <Footer />
    </main>
  );
}
