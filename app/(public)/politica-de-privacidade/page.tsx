import { getPageContent } from "@/modules/pages";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPageContent("privacy");
  return buildMetadata({
    title: content?.page.seoTitle || content?.page.title || "Política de Privacidade",
    description: content?.page.seoDescription || undefined,
    canonical: content?.page.canonicalUrl || undefined,
  });
}

export default async function PrivacyPolicyPage() {
  const content = await getPageContent("privacy");
  if (!content) throw new Error("The privacy page has not been seeded in the CMS.");
  const hero = content.sections.find((section) => section.sectionKey === "hero");
  const legalBody = content.sections.find((section) => section.sectionKey === "legal_body");

  return (
    <>
      {hero ? <section className="pageHero heroWordmarkPage">
        <span className="heroWordmark" aria-hidden="true">PRIVACIDADE</span>
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
