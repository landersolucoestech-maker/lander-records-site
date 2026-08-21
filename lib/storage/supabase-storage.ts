import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaStorage, StoredMedia } from "./types";

let client: SupabaseClient | null = null;

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for media uploads.");
  if (!client) client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function bucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || "media";
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