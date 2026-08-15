import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "../../components/SiteChrome";
import { services } from "../../data/site";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();

  return (
    <main>
      <Header />
      <section className="pageHero">
        <p className="eyebrow">{service.kicker}</p>
        <h1>{service.title}</h1>
        <p>{service.intro}</p>
      </section>
      <section className="section serviceDetail">
        <div className="serviceIntroGrid">
          <div>
            <p className="eyebrow dark">LANDER RECORDS</p>
            <h2>Estrutura especializada para o seu projeto.</h2>
          </div>
          <p>Essa frente funciona como uma área própria da Lander, com conteúdo, cases, mídia e chamadas específicas — sem sobrecarregar a Home.</p>
        </div>
        <div className="detailGrid">
          {service.items.map((item, index) => (
            <article className="detailCard" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="ctaSection compactCta" id="contato">
        <p className="eyebrow">FALE COM A LANDER</p>
        <h2>Vamos construir seu próximo passo.</h2>
        <Link className="button buttonLight" href="/#contato">Entrar em contato</Link>
      </section>
      <Footer />
    </main>
  );
}
