import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "../../components/SiteChrome";
import { news } from "../../data/news";

export function generateStaticParams() {
  return news.map((item) => ({ slug: item.slug }));
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = news.find((item) => item.slug === slug);
  if (!article) notFound();

  const related = news.filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <main>
      <Header />
      <article className="articlePage">
        <div className="articleHeroImage"><span>{article.category}</span></div>
        <div className="articleHeader">
          <p className="eyebrow dark">{article.category}</p>
          <h1>{article.title}</h1>
          <div className="articleByline"><span>{article.date}</span><span>{article.author}</span></div>
        </div>
        <div className="articleBody">
          <div className="articleContent">
            {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <aside className="shareRail"><span>Compartilhe</span><div>Instagram</div><div>WhatsApp</div><div>Link</div></aside>
        </div>
      </article>
      <section className="section relatedNews">
        <div className="sectionHeading"><p className="eyebrow dark">CONTINUE LENDO</p><h2>Veja <span>também.</span></h2></div>
        <div className="newsGrid compactNewsGrid">
          {related.map((item) => (
            <Link className="newsCard" href={`/noticias/${item.slug}`} key={item.slug}>
              <div className="newsImage"><span>{item.category}</span></div>
              <div className="newsCardBody"><p className="newsMeta">{item.date}</p><h2>{item.title}</h2><strong>Ler matéria →</strong></div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
