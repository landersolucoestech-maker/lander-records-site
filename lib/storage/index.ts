export { supabaseStorage } from "./supabase-storage";
export type { MediaStorage, StoredMedia } from "./types";

export async function uploadMedia(key: string, data: Uint8Array, contentType: string) {
  const { supabaseStorage } = await import("./supabase-storage");
  return supabaseStorage.uploadMedia(key, data, contentType);
}

export async function deleteMedia(key: string) {
  const { supabaseStorage } = await import("./supabase-storage");
  return supabaseStorage.deleteMedia(key);
}