const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const SPOTIFY_TYPES = new Set(["artist", "album", "track", "playlist", "show", "episode"]);

function parseHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function trustedExternalUrl(value: string) {
  const url = parseHttpsUrl(value.trim());
  return url && !url.username && !url.password ? url.href : "";
}

export function trustedEmbedUrl(type: string, value: string) {
  const normalizedType = type.trim().toLowerCase();
  let source = value.trim();
  if (normalizedType === "spotify") source = source.match(/src=["']([^"']+)["']/i)?.[1] || source;

  const url = parseHttpsUrl(source);
  if (!url) return "";

  if (normalizedType === "youtube") {
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return "";
    const videoId = url.hostname.toLowerCase() === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.pathname === "/watch"
          ? url.searchParams.get("v")
          : null;
    return videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : "";
  }

  if (normalizedType === "spotify") {
    if (url.hostname.toLowerCase() !== "open.spotify.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const offset = parts[0]?.toLowerCase() === "embed" ? 1 : 0;
    const resourceType = parts[offset]?.toLowerCase();
    const resourceId = parts[offset + 1];
    return resourceType && SPOTIFY_TYPES.has(resourceType) && resourceId && /^[A-Za-z0-9]+$/.test(resourceId)
      ? `https://open.spotify.com/embed/${resourceType}/${resourceId}`
      : "";
  }

  return "";
}
