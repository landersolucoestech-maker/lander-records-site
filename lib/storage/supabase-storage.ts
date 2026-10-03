import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaStorage } from "./types";

let client: SupabaseClient | null = null;

function getStorageClient() {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for media uploads.");
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("SUPABASE_URL is invalid."); }
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:")) || url.username || url.password || url.search || url.hash) {
    throw new Error("SUPABASE_URL must be a secure origin.");
  }
  if (!client) client = createClient(url.origin, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function bucketName() {
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || "media").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(bucket)) throw new Error("SUPABASE_STORAGE_BUCKET is invalid.");
  return bucket;
}

export const supabaseStorage: MediaStorage = {
  async uploadMedia(key, data, contentType) {
    const bucket = bucketName();
    const { error } = await getStorageClient().storage.from(bucket).upload(key, data, {
      contentType,
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
    const { data: publicData } = getStorageClient().storage.from(bucket).getPublicUrl(key);
    return { key, url: publicData.publicUrl };
  },
  async deleteMedia(key) {
    const { error } = await getStorageClient().storage.from(bucketName()).remove([key]);
    if (error) throw new Error(`Supabase Storage cleanup failed: ${error.message}`);
  },
};
