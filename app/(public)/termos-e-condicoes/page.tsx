import { getPageContent } from "@/modules/pages";
import { buildMetadata, resolveCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("terms");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title || "Termos e Condições",
    description: content?.page.seoDescription || undefined,
    canonical: resolveCanonicalUrl(content?.page.canonicalUrl, "/termos-e-condicoes"),
  });
}

export default async function TermsPage() {
  const content = await getPageContent("terms");
  if (!content) throw new Error("The terms page has not been seeded in the CMS.");
  const hero = content.sections.find((section) => section.sectionKey === "hero");
  const legalBody = content.sections.find((section) => section.sectionKey === "legal_body");

  return (
    <>
      {hero ? <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">TERMOS</span>
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        {hero.subtitle ? <p>{hero.subtitle}</p> : null}
      </section> : null}
      {legalBody ? <section className="section">
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {legalBody.items.map((item) => (
            <article className="detailCard" key={item.id} style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section> : null}
    </>
  );
}
