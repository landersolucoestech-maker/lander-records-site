import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../db";
import { landerRecordsIntegrationSettings, spotifyOauthStates } from "../db/integration-schema";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "./secrets";

const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";
const OAUTH_SCOPES = ["playlist-read-private", "playlist-read-collaborative", "user-read-private"];
const SPOTIFY_REQUEST_TIMEOUT_MS = 10_000;
const SPOTIFY_API_HOST = "api.spotify.com";
const SPOTIFY_OPEN_HOST = "open.spotify.com";
const SPOTIFY_IMAGE_HOST = "i.scdn.co";

export type SpotifyRelease = {
  albumId: string;
  title: string;
  artistName: string;
  coverUrl: string;
  spotifyUrl: string;
  releaseDate: string;
  releaseDatePrecision: "year" | "month" | "day";
  playlistAddedAt: Date | null;
};

type SpotifyTrack = {
  type?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    id?: string;
    name?: string;
    release_date?: string;
    release_date_precision?: "year" | "month" | "day";
    images?: Array<{ url?: string; width?: number | null; height?: number | null }>;
    external_urls?: { spotify?: string };
    artists?: Array<{ name?: string }>;
  };
};

type PlaylistItem = {
  added_at?: string | null;
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
};

type PlaylistItemsPage = {
  items?: PlaylistItem[];
  next?: string | null;
  total?: number;
};

export function spotifyCredentialsConfigured() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim()
    && process.env.SPOTIFY_CLIENT_SECRET?.trim()
    && process.env.SPOTIFY_REDIRECT_URI?.trim(),
  );
}

export function spotifyAdminRedirectUrl(destination: "login" | "connected" | "error") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://landerrecords.com";
  let base: URL;
  try { base = new URL(configured); } catch { throw new Error("NEXT_PUBLIC_SITE_URL inválida."); }
  const loopback = base.hostname === "localhost" || base.hostname === "127.0.0.1" || base.hostname === "[::1]";
  if ((base.protocol !== "https:" && !(loopback && base.protocol === "http:"))
    || base.username || base.password || base.search || base.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL deve definir uma origem canônica segura.");
  }
  const path = destination === "login" ? "/admin/login" : `/admin/settings/lander-records?spotify=${destination}`;
  return new URL(path, base.origin);
}

function oauthConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Spotify não configurado: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET e SPOTIFY_REDIRECT_URI são obrigatórios.");
  }
  validateRedirectUri(redirectUri);
  return { clientId, clientSecret, redirectUri };
}

function validateRedirectUri(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("SPOTIFY_REDIRECT_URI inválida."); }
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:"))
    || url.username || url.password || url.hash || url.search
    || url.pathname !== "/api/integrations/spotify/callback") {
    throw new Error("SPOTIFY_REDIRECT_URI deve usar HTTPS (ou loopback HTTP) e o callback Spotify conhecido.");
  }
}

/** Resolve and validate every URL that will receive a Spotify bearer token. */
export function resolveSpotifyApiUrl(urlOrPath: string) {
  if (!urlOrPath || urlOrPath.startsWith("//")) throw new Error("Endpoint Spotify não permitido.");
  let url: URL;
  try { url = urlOrPath.startsWith("/") ? new URL(`${API_BASE}${urlOrPath}`) : new URL(urlOrPath); } catch { throw new Error("Endpoint Spotify não permitido."); }
  if (url.protocol !== "https:" || url.hostname !== SPOTIFY_API_HOST || url.port
    || url.username || url.password || url.hash) throw new Error("Endpoint Spotify não permitido.");

  const playlist = /^\/v1\/playlists\/[A-Za-z0-9]+$/.test(url.pathname);
  const items = /^\/v1\/playlists\/[A-Za-z0-9]+\/items$/.test(url.pathname);
  if (url.pathname === "/v1/me") {
    if (url.search) throw new Error("Parâmetros Spotify não permitidos.");
  } else if (playlist) {
    if (url.searchParams.size !== 1 || url.searchParams.get("fields") !== "id,name,snapshot_id,owner(id)") {
      throw new Error("Parâmetros Spotify não permitidos.");
    }
  } else if (items) {
    const allowed = new Set(["limit", "offset", "additional_types"]);
    if ([...url.searchParams.keys()].some((key) => !allowed.has(key))) throw new Error("Parâmetros Spotify não permitidos.");
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    if (!limit || !/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50
      || !offset || !/^\d+$/.test(offset) || Number(offset) < 0
      || url.searchParams.get("additional_types") !== "track") throw new Error("Parâmetros Spotify não permitidos.");
  } else {
    throw new Error("Endpoint Spotify não permitido.");
  }
  return url.toString();
}

function safePublicSpotifyUrl(raw: string | undefined, kind: "album" | "image") {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) return "";
    if (kind === "image") return url.hostname === SPOTIFY_IMAGE_HOST ? url.toString() : "";
    return url.hostname === SPOTIFY_OPEN_HOST && /^\/album\/[A-Za-z0-9]+\/?$/.test(url.pathname) && !url.search ? url.toString() : "";
  } catch { return ""; }
}

function hashState(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function spotifyTokenRequest(body: URLSearchParams) {
  const { clientId, clientSecret } = oauthConfig();
  const response = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(SPOTIFY_REQUEST_TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error(`Falha de autenticação no Spotify (HTTP ${response.status}).`);
  }
  return payload as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}

export async function createSpotifyAuthorizationUrl(adminUserId: string) {
  const { clientId, redirectUri } = oauthConfig();
  const state = randomBytes(32).toString("base64url");
  const now = new Date();
  const db = getDb();
  await db.delete(spotifyOauthStates).where(lt(spotifyOauthStates.expiresAt, now));
  await db.insert(spotifyOauthStates).values({
    stateHash: hashState(state),
    adminUserId,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
  });
  const url = new URL(`${ACCOUNTS_BASE}/authorize`);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: OAUTH_SCOPES.join(" "),
    show_dialog: "true",
  }).toString();
  return url.toString();
}

export async function spotifyApi(accessToken: string, urlOrPath: string, retryRateLimit = true): Promise<unknown> {
  const url = resolveSpotifyApiUrl(urlOrPath);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(SPOTIFY_REQUEST_TIMEOUT_MS),
  });
  if (response.status === 429 && retryRateLimit) {
    const waitSeconds = Number(response.headers.get("retry-after") || "0");
    if (Number.isFinite(waitSeconds) && waitSeconds > 0 && waitSeconds <= 3) {
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      return spotifyApi(accessToken, url, false);
    }
  }
  if (!response.ok) {
    const retryAfter = response.status === 429 ? ` Retry-After=${response.headers.get("retry-after") || "desconhecido"}.` : "";
    throw new Error(`Spotify respondeu ${response.status}.${retryAfter}`);
  }
  return response.json();
}

export async function completeSpotifyAuthorization(code: string, state: string, adminUserId: string) {
  const { redirectUri } = oauthConfig();
  const db = getDb();
  const rows = await db.select().from(spotifyOauthStates).where(and(
    eq(spotifyOauthStates.stateHash, hashState(state)),
    eq(spotifyOauthStates.adminUserId, adminUserId),
    gt(spotifyOauthStates.expiresAt, new Date()),
  )).limit(1);
  if (!rows[0]) throw new Error("Estado OAuth do Spotify inválido ou expirado.");
  await db.delete(spotifyOauthStates).where(eq(spotifyOauthStates.stateHash, hashState(state)));

  const token = await spotifyTokenRequest(new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }));
  if (!token.refresh_token) throw new Error("Spotify não retornou refresh token; autorize novamente a conta proprietária da playlist.");

  const profile = await spotifyApi(token.access_token, "/me") as Record<string, unknown>;
  const userId = typeof profile.id === "string" ? profile.id : "";
  const encryptedRefreshToken = encryptIntegrationSecret(token.refresh_token);
  await db.insert(landerRecordsIntegrationSettings).values({
    key: "lander_records",
    spotifyUserId: userId,
    spotifyRefreshTokenEncrypted: encryptedRefreshToken,
    spotifyConnectedAt: new Date(),
    spotifyLastError: "",
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: landerRecordsIntegrationSettings.key,
    set: {
      spotifyUserId: userId,
      spotifyRefreshTokenEncrypted: encryptedRefreshToken,
      spotifyConnectedAt: new Date(),
      spotifyLastError: "",
      updatedAt: new Date(),
    },
  });
  return { userId };
}

export async function getSpotifyUserAccessToken() {
  const settings = (await getDb().select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, "lander_records")).limit(1))[0];
  if (!settings?.spotifyRefreshTokenEncrypted) throw new Error("Conta Spotify ainda não conectada no CMS.");
  const refreshToken = decryptIntegrationSecret(settings.spotifyRefreshTokenEncrypted);
  const token = await spotifyTokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }));
  if (token.refresh_token && token.refresh_token !== refreshToken) {
    await getDb().update(landerRecordsIntegrationSettings).set({
      spotifyRefreshTokenEncrypted: encryptIntegrationSecret(token.refresh_token),
      updatedAt: new Date(),
    }).where(eq(landerRecordsIntegrationSettings.key, "lander_records"));
  }
  return token.access_token;
}

function releaseDateSortValue(date: string, precision: string) {
  const parts = date.split("-").map(Number);
  const year = parts[0];
  const month = precision === "year" ? 1 : parts[1] || 1;
  const day = precision === "day" ? parts[2] || 1 : 1;
  if (!year || !Number.isFinite(year)) return 0;
  return Date.UTC(year, Math.max(0, month - 1), Math.max(1, day));
}

function chooseCover(images: Array<{ url?: string; width?: number | null }> | undefined) {
  if (!images?.length) return "";
  for (const image of [...images].sort((a, b) => (b.width || 0) - (a.width || 0))) {
    const safeUrl = safePublicSpotifyUrl(image.url, "image");
    if (safeUrl) return safeUrl;
  }
  return "";
}

export async function fetchLatestSpotifyPlaylistReleases(playlistId: string) {
  if (!playlistId) throw new Error("Playlist Spotify não configurada.");
  const accessToken = await getSpotifyUserAccessToken();
  const playlist = await spotifyApi(accessToken, `/playlists/${encodeURIComponent(playlistId)}?fields=id,name,snapshot_id,owner(id)`) as Record<string, unknown>;
  const snapshotId = typeof playlist.snapshot_id === "string" ? playlist.snapshot_id : "";

  const allItems: PlaylistItem[] = [];
  let nextUrl: string | null = `${API_BASE}/playlists/${encodeURIComponent(playlistId)}/items?limit=50&offset=0&additional_types=track`;
  let pages = 0;
  while (nextUrl) {
    if (++pages > 200) throw new Error("Playlist Spotify excedeu o limite operacional de paginação.");
    const page = await spotifyApi(accessToken, nextUrl) as PlaylistItemsPage;
    if (Array.isArray(page.items)) allItems.push(...page.items);
    nextUrl = typeof page.next === "string" && page.next ? page.next : null;
  }

  const albums = new Map<string, SpotifyRelease>();
  for (const row of allItems) {
    const track = row.item || row.track;
    if (!track || track.type !== "track" || !track.album?.id || !track.album.name || !track.album.release_date || !track.album.release_date_precision) continue;
    const spotifyUrl = safePublicSpotifyUrl(track.album.external_urls?.spotify, "album");
    if (!spotifyUrl) continue;
    const candidate: SpotifyRelease = {
      albumId: track.album.id,
      title: track.album.name,
      artistName: (track.album.artists?.map((artist) => artist.name).filter(Boolean) as string[] | undefined)?.join(", ")
        || (track.artists?.map((artist) => artist.name).filter(Boolean) as string[] | undefined)?.join(", ")
        || "",
      coverUrl: chooseCover(track.album.images),
      spotifyUrl,
      releaseDate: track.album.release_date,
      releaseDatePrecision: track.album.release_date_precision,
      playlistAddedAt: row.added_at ? new Date(row.added_at) : null,
    };
    const previous = albums.get(candidate.albumId);
    if (!previous || (candidate.playlistAddedAt?.getTime() || 0) > (previous.playlistAddedAt?.getTime() || 0)) albums.set(candidate.albumId, candidate);
  }

  const releases = [...albums.values()].sort((a, b) => {
    const dateDiff = releaseDateSortValue(b.releaseDate, b.releaseDatePrecision) - releaseDateSortValue(a.releaseDate, a.releaseDatePrecision);
    if (dateDiff) return dateDiff;
    const addedDiff = (b.playlistAddedAt?.getTime() || 0) - (a.playlistAddedAt?.getTime() || 0);
    if (addedDiff) return addedDiff;
    return a.albumId.localeCompare(b.albumId);
  }).slice(0, 5);

  return { snapshotId, releases };
}
