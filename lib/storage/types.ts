export type StoredMedia = {
  key: string;
  url: string;
};

export type MediaStorage = {
  uploadMedia(key: string, data: Uint8Array, contentType: string): Promise<StoredMedia>;
  deleteMedia(key: string): Promise<void>;
};