export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  authorName: string;
  status: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  category: { id: string; name: string; slug: string } | null;
  coverImage: string;
  ogImage: string;
  updatedAt: Date;
};
