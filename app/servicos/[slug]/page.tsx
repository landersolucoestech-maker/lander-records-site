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
      <section className="pageHero serviceHero">
        <p className="eyebrow">{service.kicker}</p>
        <h1>{service.title}</h1>
        <p>{service.intro}</p>
      </section>

      <section className="section serviceDetail">
        <div className="serviceIntroGrid">
          <div>
            <p className="eyebrow dark">LANDER RECORDS</p>
            <h2>{service.title}</h2>
          </div>
          <p>{service.lead}</p>
        </div>

        {"warningTitle" in service && service.warningTitle ? (
          <div className="serviceWarningPanel">
            <div>
              <p className="eyebrow">ATENÇÃO AO SEU CATÁLOGO</p>
              <h2>{service.warningTitle}</h2>
            </div>
            <div className="serviceWarningList">
              {service.warnings.map((warning) => <div key={warning}><span>!</span><strong>{warning}</strong></div>)}
            </div>
          </div>
        ) : null}

        <div className="serviceGroups">
          {service.groups.map((group, groupIndex) => (
            <section className="serviceGroup" key={group.title}>
              <div className="serviceGroupHeading">
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div><h2>{group.title}</h2><p>{group.description}</p></div>
              </div>
              <div className="detailGrid serviceCardsGrid">
                {group.items.map(([title, description], index) => (
                  <article className="detailCard serviceInfoCard" key={title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {"extraTitle" in service && service.extraTitle ? (
          <section className="serviceExtraPanel">
            <p className="eyebrow dark">LANDER RECORDS</p>
            <h2>{service.extraTitle}</h2>
            <p>{service.extraDescription}</p>
            {service.slug === "producao-audiovisual" ? <div className="serviceMediaPlaceholder"><span>PLAY</span><strong>Videoclipes e produções em destaque</strong></div> : null}
            {service.slug === "marketing-artistico" ? <div className="casePlaceholderGrid"><article><span>CASE 01</span><strong>Campanha e resultado</strong></article><article><span>CASE 02</span><strong>Projeto em destaque</strong></article></div> : null}
            {service.slug === "edicao-e-distribuicao" ? <div className="authorPlaceholderGrid"><article><span>AUTORES</span><strong>Casting de autores administrados</strong></article></div> : null}
          </section>
        ) : null}
      </section>

      <section className="ctaSection compactCta" id="contato">
        <p className="eyebrow">FALE COM A LANDER</p>
        <h2>Vamos construir seu próximo passo.</h2>
        <Link className="button buttonLight" href="/contato">Entrar em contato</Link>
      </section>
      <Footer />
    </main>
  );
}
