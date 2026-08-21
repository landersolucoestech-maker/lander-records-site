import { Footer, Header } from "@/app/components/SiteChrome";
import { GroupCompaniesTabs } from "./GroupCompaniesTabs";
import { getPageContent } from "@/modules/pages";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("about");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
  });
}

export default async function AboutPage() {
  const content = await getPageContent("about");
  if (!content) throw new Error("The about page has not been seeded in the CMS.");
  const byKey = (key: string) => content.sections.find((section) => section.sectionKey === key);
  const hero = byKey("hero");
  const history = byKey("history");
  const identity = byKey("identity");
  const companies = byKey("companies");
  const methodology = byKey("methodology");

  return (
    <main>
      <Header />
      {hero ? <section className="pageHero heroWordmarkPage"><span className="heroWordmark" aria-hidden="true">LANDER</span><p className="eyebrow">{hero.eyebrow}</p><h1>{hero.title}</h1><p>{hero.subtitle}</p></section> : null}

      {history ? <section className="section"><div className="splitFeature"><div className="redPanel"><p className="eyebrow">{history.eyebrow}</p><h3>{history.title}</h3><p>{history.body}</p></div><div className="studioVisual"><div className="visualBadge">{history.subtitle}</div></div></div></section> : null}

      {identity ? <section className="section darkSection"><div className="sectionHeading inverse compactHeading"><p className="eyebrow">{identity.eyebrow}</p><h2>{identity.title}</h2></div><div className="detailGrid">{identity.items.map((item, index) => <article className="aboutValueCard" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section> : null}

      {methodology ? <section className="section methodologySection" id="metodologia"><div className="sectionHeading compactHeading"><p className="eyebrow dark">{methodology.eyebrow}</p><h2>{methodology.title}</h2><p className="sectionLead">{methodology.subtitle}</p></div><div className="methodologyGrid">{methodology.items.map((item, index) => item.itemKey === "summary" ? <article className="methodologySummary" key={item.id}><strong>{item.title}</strong><p>{item.body}</p></article> : <article className="methodologyItem" key={item.id}><span className="methodologyNumber">{index + 1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div></section> : null}

      {companies ? <section className="section groupCompaniesSection"><div className="sectionHeading compactHeading"><p className="eyebrow dark">{companies.eyebrow}</p><h2>{companies.title}</h2><p className="sectionLead">{companies.subtitle}</p></div><GroupCompaniesTabs companies={companies.items} /></section> : null}

      <Footer />
    </main>
  );
}
