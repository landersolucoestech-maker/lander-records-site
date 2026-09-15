/** Compatibility facade. Domain repositories own content queries. */
export type { PublicArtist } from "@/modules/artists/types";
export type { PublicPost } from "@/modules/posts/types";
export { getArtistCategoriesForPublic, getPublishedArtists, getPublishedArtistBySlug } from "@/modules/artists/repository";
export { getPostCategoriesForPublic, getPublishedPosts, getPublishedPostBySlug } from "@/modules/posts/repository";
export { getPageContent } from "@/modules/pages/repository";
export { getSiteChrome, getSlugRedirect } from "@/modules/settings/repository";
export { getFeaturedReleases } from "@/modules/media/repository";
export { getContactTopics } from "@/modules/contacts/repository";
