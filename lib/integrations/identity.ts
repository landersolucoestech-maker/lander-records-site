const HOST_ALIASES: Record<string, string> = {
  "www.facebook.com": "facebook.com",
  "m.facebook.com": "facebook.com",
  "www.instagram.com": "instagram.com",
  "www.youtube.com": "youtube.com",
  "m.youtube.com": "youtube.com",
  "www.tiktok.com": "tiktok.com",
  "www.soundcloud.com": "soundcloud.com",
  "open.spotify.com": "open.spotify.com",
};

const PLATFORM_HOSTS: Record<string, ReadonlySet<string>> = {
  facebook: new Set(["facebook.com"]),
  instagram: new Set(["instagram.com"]),
  spotify: new Set(["open.spotify.com"]),
  youtube: new Set(["youtube.com", "youtu.be"]),
  tiktok: new Set(["tiktok.com"]),
  soundcloud: new Set(["soundcloud.com"]),
};

export function normalizeExternalUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/[\u0000-\u001f\u007f\\]/.test(value)) throw new Error(`URL inválida: ${value}`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`URL inválida: ${value}`);
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || !url.hostname) {
    throw new Error(`URL inválida: ${value}`);
  }
  url.protocol = "https:";
  url.hostname = HOST_ALIASES[url.hostname.toLowerCase()] || url.hostname.toLowerCase();
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (["si", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "feature"].includes(key)) url.searchParams.delete(key);
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
}

export function normalizePlatformUrl(platform: string, raw: string) {
  if (!raw.trim()) return "";
  const normalized = normalizeExternalUrl(raw);
  const hostname = new URL(normalized).hostname.toLowerCase();
  const allowedHosts = PLATFORM_HOSTS[platform.trim().toLowerCase()];
  if (!allowedHosts || !allowedHosts.has(hostname)) {
    throw new Error(`URL de ${platform} não pertence à plataforma informada.`);
  }
  return normalized;
}

export function spotifyPlaylistIdFromUrl(raw: string) {
  const normalized = normalizeExternalUrl(raw);
  if (!normalized) return "";
  const url = new URL(normalized);
  if (url.hostname !== "open.spotify.com") throw new Error("A playlist precisa usar uma URL oficial open.spotify.com.");
  const match = url.pathname.match(/^\/playlist\/([A-Za-z0-9]+)$/);
  if (!match) throw new Error("Link de playlist do Spotify inválido.");
  return match[1];
}

export function spotifyArtistIdFromUrl(raw: string) {
  if (!raw.trim()) return "";
  const normalized = normalizeExternalUrl(raw);
  const url = new URL(normalized);
  if (url.hostname !== "open.spotify.com") return "";
  return url.pathname.match(/^\/artist\/([A-Za-z0-9]+)$/)?.[1] || "";
}

export function platformFromUrl(raw: string) {
  if (!raw.trim()) return "";
  const hostname = new URL(normalizeExternalUrl(raw)).hostname;
  if (hostname === "facebook.com") return "facebook";
  if (hostname === "instagram.com") return "instagram";
  if (hostname === "youtube.com" || hostname === "youtu.be") return "youtube";
  if (hostname === "tiktok.com") return "tiktok";
  if (hostname === "soundcloud.com") return "soundcloud";
  if (hostname === "open.spotify.com") return "spotify";
  return "";
}

export function extractSoundchartsUuid(value: unknown): string {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const seen = new Set<unknown>();
  function visit(node: unknown): string {
    if (node == null || seen.has(node)) return "";
    if (typeof node === "string") return node.match(uuidPattern)?.[0] || "";
    if (typeof node !== "object") return "";
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return "";
    }
    const record = node as Record<string, unknown>;
    for (const key of ["uuid", "artistUuid", "artist_uuid", "soundchartsUuid"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && uuidPattern.test(candidate)) return candidate.match(uuidPattern)?.[0] || "";
    }
    for (const value of Object.values(record)) {
      const found = visit(value);
      if (found) return found;
    }
    return "";
  }
  return visit(value);
}
