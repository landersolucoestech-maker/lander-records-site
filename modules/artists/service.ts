import { getArtistCategoriesForPublic, getPublishedArtists } from "./repository";

export async function getArtistDirectory() {
  const [artists, categories] = await Promise.all([
    getPublishedArtists(),
    getArtistCategoriesForPublic(),
  ]);
  return { artists, categories };
}
