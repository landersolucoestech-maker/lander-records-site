import { Footer, Header } from "../components/SiteChrome";
import { ContactForm } from "./ContactForm";
import { getContactTopics, getPageContent, getSiteChrome } from "../../lib/content";
import { buildMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("contact");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title,
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
  });
}

export default async function ContactPage() {
  const [content, topics, chrome] = await Promise.all([getPageContent("contact"), getContactTopics(), getSiteChrome()]);
  const hero = content?.sections.find((section) => section.sectionKey === "hero");
  const intro = content?.sections.find((section) => section.sectionKey === "intro");

  return (
    <main>
      <Header />
      <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">CONTATO</span>
        <p className="eyebrow">{hero?.eyebrow || "CONTATO"}</p>
        <h1>{hero?.title || content?.page.title || ""}</h1>
        {hero?.subtitle ? <p>{hero.subtitle}</p> : null}
      </section>
      <section className="section contactSection">
        <div className="contactInfo">
          <p className="eyebrow dark">{intro?.eyebrow || "LANDER RECORDS"}</p>
          <h2>{intro?.title || "Vamos falar sobre o seu projeto."}</h2>
          {intro?.body ? <p>{intro.body}</p> : null}
          <div className="contactLines">
            {chrome.settings.contactEmail ? <div><span>E-mail</span><strong>{chrome.settings.contactEmail}</strong></div> : null}
            {chrome.settings.location ? <div><span>Localização</span><strong>{chrome.settings.location}</strong></div> : null}
          </div>
        </div>
        <ContactForm topics={topics.map((topic) => ({ id: topic.id, name: topic.name, slug: topic.slug }))} />
      </section>
      <Footer />
    </main>
  );
}
