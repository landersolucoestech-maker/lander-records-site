import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Footer, Header } from "@/app/components/SiteChrome";
import { getPublishedPostBySlug, getPublishedPosts, getSlugRedirect, getPublicPostPresentation } from "@/modules/posts";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedPostBySlug(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    canonical: article.canonicalUrl || absoluteUrl(`/noticias/${article.slug}`),
    image: article.coverImage || undefined,
    type: "article",
  });
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, allPosts] = await Promise.all([getPublishedPostBySlug(slug), getPublishedPosts()]);
  if (!article) {
    const nextSlug = await getSlugRedirect("post", slug);
    if (nextSlug) redirect(`/noticias/${nextSlug}`);
    notFound();
  }
  const presentation = await getPublicPostPresentation(article.id);
  const related = allPosts.filter((item) => item.slug !== article.slug).slice(0, 2);
  const publicationUrl = presentation.publicationLink || `/noticias/${article.slug}`;

  return (
    <main>
      <Header />
      <article className="articlePage">
        <div className="articleHeroImage" style={article.coverImage ? { backgroundImage: `url(${article.coverImage})` } : undefined}>
          {article.category ? <span>{article.category.name}</span> : null}
        </div>
        <div className="articleHeader">
          <p className="eyebrow dark">{article.category?.name || "Notícia"}</p>
          <h1>{article.title}</h1>
          <div className="articleByline">
            <span>{article.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(article.publishedAt) : ""}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {presentation.authorImage ? <Image src={presentation.authorImage} alt={article.authorName} width={30} height={30} unoptimized style={{ borderRadius: "50%", objectFit: "cover" }} /> : null}
              {article.authorName}
            </span>
          </div>
        </div>
        <div className="articleBody">
          <div className="articleContent markdownContent">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.contentMarkdown}</ReactMarkdown>
          </div>
          <aside className="shareRail">
            <span>Compartilhe</span>
            {Object.entries(presentation.links).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noreferrer">{socialLabels[platform] || platform}</a>)}
            <a href={publicationUrl}>Link</a>
          </aside>
        </div>
      </article>
      <section className="section relatedNews">
        <div className="sectionHeading"><p className="eyebrow dark">CONTINUE LENDO</p><h2>Veja <span>também.</span></h2></div>
        <div className="newsGrid compactNewsGrid">
          {related.map((item) => (
            <Link className="newsCard" href={`/noticias/${item.slug}`} key={item.id}>
              <div className="newsImage" style={item.coverImage ? { backgroundImage: `url(${item.coverImage})` } : undefined}>{item.category ? <span>{item.category.name}</span> : null}</div>
              <div className="newsCardBody"><p className="newsMeta">{item.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(item.publishedAt) : ""}</p><h2>{item.title}</h2><strong>Ler matéria →</strong></div>
            </Link>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            description: article.excerpt,
            datePublished: article.publishedAt?.toISOString(),
            author: { "@type": "Person", name: article.authorName, image: presentation.authorImage || undefined },
            publisher: { "@type": "Organization", name: "Lander Records" },
            mainEntityOfPage: absoluteUrl(`/noticias/${article.slug}`),
            image: article.coverImage || undefined,
          }),
        }}
      />
      <Footer />
    </main>
  );
}
