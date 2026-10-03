import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mockDataEnabled, mockMediaOptions, mockPostCategories, mockPostRecords, mockPostTags } from "../../../../lib/mocks";
import { postLinks, postProfiles } from "../../../../lib/db/news-management-schema";
import { mediaAssets, postCategories, posts, postTags, tags } from "../../../../lib/db/schema";
import PostManager, { type PostRecord } from "./PostManager";

export const dynamic = "force-dynamic";
type PostFilters = {
  category?: string;
  create?: string;
  deleted?: string;
  edit?: string;
  q?: string;
  saved?: string;
  status?: string;
  view?: string;
};

const publicPost = sql<boolean>`${posts.status} = 'published' AND ${posts.archivedAt} IS NULL AND (${posts.publishedAt} IS NULL OR ${posts.publishedAt} <= now()) AND (${posts.scheduledAt} IS NULL OR ${posts.scheduledAt} <= now())`;

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<PostFilters> }) {
  const session = await requireAdmin();
  const filters = await searchParams;
  const mockMode = mockDataEnabled();
  const canEdit = !mockMode && session.source === "session" && session.user.role !== "viewer";
  const canDelete = !mockMode && session.source === "session" && (session.user.role === "admin" || session.user.role === "owner");
  const developmentMode = mockMode && session.source === "development-auth-bypass";
  if (mockMode) {
    const initialMode = filters.create === "1" ? "create" : filters.edit ? "edit" : filters.view ? "view" : undefined;
    const initialId = filters.edit || filters.view || undefined;
    return <PostManager
      canDelete
      canEdit
      categories={mockPostCategories.map(({ id, name }) => ({ id, name }))}
      deleted={filters.deleted === "1"}
      developmentMode
      initialId={initialId}
      initialMode={initialMode}
      media={mockMediaOptions}
      posts={mockPostRecords.map((post) => ({ ...post, tagIds: post.tagIds || [] }))}
      tags={mockPostTags}
      saved={filters.saved === "1"}
    />;
  }
  const db = getDb();
  const conditions: SQL[] = [];
  const query = filters.q?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(or(
      ilike(posts.title, pattern),
      ilike(posts.slug, pattern),
      ilike(posts.excerpt, pattern),
      ilike(posts.authorName, pattern),
      ilike(postCategories.name, pattern),
    )!);
  }
  if (filters.status === "published") conditions.push(publicPost);
  if (filters.status === "draft") conditions.push(and(eq(posts.status, "draft"), isNull(posts.archivedAt))!);
  if (filters.status === "archived") conditions.push(or(eq(posts.status, "archived"), isNotNull(posts.archivedAt))!);
  if (filters.category && filters.category !== "all") conditions.push(eq(postCategories.name, filters.category));

  const [rows, categoryRows, mediaRows, profileRows, linkRows, tagRows, postTagRows] = await Promise.all([
    db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      contentMarkdown: posts.contentMarkdown,
      status: posts.status,
      authorName: posts.authorName,
      categoryId: posts.categoryId,
      publishedAt: posts.publishedAt,
      archivedAt: posts.archivedAt,
      featuredOnHome: posts.featuredOnHome,
      homePosition: posts.homePosition,
      updatedAt: posts.updatedAt,
      categoryName: postCategories.name,
      coverMediaId: posts.coverMediaId,
      coverImage: mediaAssets.url,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      canonicalUrl: posts.canonicalUrl,
      isPubliclyVisible: publicPost,
    }).from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(posts.updatedAt), desc(posts.createdAt)),
    db.select({ id: postCategories.id, name: postCategories.name })
      .from(postCategories)
      .where(eq(postCategories.active, true))
      .orderBy(asc(postCategories.position), asc(postCategories.name)),
    db.select({ id: mediaAssets.id, name: mediaAssets.originalFilename, url: mediaAssets.url })
      .from(mediaAssets)
      .where(eq(mediaAssets.status, "active"))
      .orderBy(asc(mediaAssets.originalFilename)),
    db.select().from(postProfiles),
    db.select().from(postLinks),
    db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name)),
    db.select().from(postTags),
  ]);

  const profileMap = new Map(profileRows.map((profile) => [profile.postId, profile]));
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const records: PostRecord[] = rows.map((post) => {
    const profile = profileMap.get(post.id);
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      contentMarkdown: post.contentMarkdown,
      status: post.archivedAt || post.status === "archived" ? "archived" : post.isPubliclyVisible ? "published" : post.status === "draft" ? "draft" : "unpublished",
      editorStatus: post.status,
      category: post.categoryName || "Sem categoria",
      categoryId: post.categoryId || "",
      authorName: post.authorName || "Não informado",
      publishedAt: post.publishedAt ? dateFormatter.format(post.publishedAt) : "",
      publishedAtInput: post.publishedAt?.toISOString() || "",
      coverImage: post.coverImage || "",
      coverMediaId: post.coverMediaId || "",
      authorMediaId: profile?.authorMediaId || "",
      authorImage: profile?.authorMediaId ? mediaMap.get(profile.authorMediaId) || "" : "",
      links: Object.fromEntries(linkRows.filter((row) => row.postId === post.id).map((row) => [row.platform, row.url])),
      tagIds: postTagRows.filter((row) => row.postId === post.id).map((row) => row.tagId),
      featuredOnHome: post.featuredOnHome,
      homePosition: post.homePosition,
      isPubliclyVisible: post.isPubliclyVisible,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      canonicalUrl: post.canonicalUrl || "",
      updatedAt: dateFormatter.format(post.updatedAt),
    };
  });

  const initialMode = filters.create === "1" ? "create" : filters.edit ? "edit" : filters.view ? "view" : undefined;
  const initialId = filters.edit || filters.view || undefined;

  return <PostManager
    canDelete={canDelete}
    canEdit={canEdit}
    categories={categoryRows}
    deleted={filters.deleted === "1"}
    developmentMode={developmentMode}
    initialId={initialId}
    initialMode={initialMode}
    media={mediaRows}
    posts={records}
    tags={tagRows}
    saved={filters.saved === "1"}
  />;
}
