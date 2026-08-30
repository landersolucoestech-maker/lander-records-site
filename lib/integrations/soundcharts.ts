import { extractSoundchartsUuid, normalizeExternalUrl, spotifyArtistIdFromUrl } from "./identity";

const API_BASE = "https://customer.api.soundcharts.com";
const TOKEN_URL = "https://account.soundcharts.com/oauth/token";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TokenCache = { accessToken: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

export type SoundchartsResolution = {
  uuid: string;
  matchedViaPlatform: string;
  matchedViaIdentifier: string;
};

export type SoundchartsMetric = {
  platform: "instagram" | "youtube" | "tiktok" | "soundcloud" | "spotify";
  metric: "followers" | "subscribers" | "monthly_listeners";
  value: number;
  observedAt: Date | null;
};

export function soundchartsCredentialsConfigured() {
  return Boolean(process.env.SOUNDCHARTS_CLIENT_ID?.trim() && process.env.SOUNDCHARTS_CLIENT_SECRET?.trim());
}

async function getAccessToken(force = false) {
  if (!force && tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const clientId = process.env.SOUNDCHARTS_CLIENT_ID?.trim();
  const clientSecret = process.env.SOUNDCHARTS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Soundcharts não configurado: SOUNDCHARTS_CLIENT_ID e SOUNDCHARTS_CLIENT_SECRET são obrigatórios.");

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const teamId = process.env.SOUNDCHARTS_TEAM_ID?.trim();
  if (teamId) body.set("team_id", teamId);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error(`Falha ao autenticar no Soundcharts (${response.status}).`);
  }
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return payload.access_token;
}

async function soundchartsRequest(path: string, searchParams?: Record<string, string>, retryAuth = true): Promise<unknown> {
  const token = await getAccessToken();
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(searchParams || {})) if (value) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401 && retryAuth) {
    tokenCache = null;
    await getAccessToken(true);
    return soundchartsRequest(path, searchParams, false);
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after") || "desconhecido";
    throw new Error(`Soundcharts rate limit atingido; Retry-After=${retryAfter}.`);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Soundcharts respondeu ${response.status} em ${path}.`);
  return response.json();
}

function containsArtistType(payload: unknown) {
  const seen = new Set<unknown>();
  function visit(node: unknown): boolean {
    if (node == null || seen.has(node) || typeof node !== "object") return false;
    seen.add(node);
    if (Array.isArray(node)) return node.some(visit);
    const record = node as Record<string, unknown>;
    if (typeof record.type === "string" && record.type.toLowerCase() === "artist") return true;
    return Object.values(record).some(visit);
  }
  return visit(payload);
}

function allStrings(payload: unknown) {
  const values: string[] = [];
  const seen = new Set<unknown>();
  function visit(node: unknown) {
    if (typeof node === "string") { values.push(node); return; }
    if (node == null || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) node.forEach(visit);
    else Object.values(node as Record<string, unknown>).forEach(visit);
  }
  visit(payload);
  return values;
}

async function verifyIdentifier(uuid: string, originalUrl: string) {
  try {
    const payload = await soundchartsRequest(`/api/v2/artist/${encodeURIComponent(uuid)}/identifiers`, { limit: "100" });
    if (!payload) return false;
    const normalizedTarget = normalizeExternalUrl(originalUrl);
    return allStrings(payload).some((value) => {
      if (!/^https?:\/\//i.test(value)) return value.includes(uuid) && false;
      try { return normalizeExternalUrl(value) === normalizedTarget; } catch { return false; }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("respondeu 403")) return true;
    throw error;
  }
}

export async function resolveSoundchartsArtist(platformLinks: Array<{ platform: string; url: string }>): Promise<SoundchartsResolution | null> {
  const links = platformLinks
    .map((item) => ({ platform: item.platform.toLowerCase(), url: item.url.trim() }))
    .filter((item) => item.url);
  const spotify = links.find((item) => item.platform === "spotify");
  if (spotify) {
    const spotifyId = spotifyArtistIdFromUrl(spotify.url);
    if (spotifyId) {
      const payload = await soundchartsRequest(`/api/v2.9/artist/by-platform/spotify/${encodeURIComponent(spotifyId)}`);
      const uuid = extractSoundchartsUuid(payload);
      if (uuid && UUID_PATTERN.test(uuid)) {
        const verified = await verifyIdentifier(uuid, spotify.url);
        if (verified) return { uuid, matchedViaPlatform: "spotify", matchedViaIdentifier: spotifyId };
      }
    }
  }

  const priority = ["youtube", "instagram", "tiktok", "soundcloud", "spotify"];
  for (const platform of priority) {
    const link = links.find((item) => item.platform === platform);
    if (!link) continue;
    const normalizedUrl = normalizeExternalUrl(link.url);
    const payload = await soundchartsRequest("/api/v2/search/external/url", { platformUrl: normalizedUrl });
    if (!payload || !containsArtistType(payload)) continue;
    const uuid = extractSoundchartsUuid(payload);
    if (!uuid || !UUID_PATTERN.test(uuid)) continue;
    const verified = await verifyIdentifier(uuid, normalizedUrl);
    if (verified) return { uuid, matchedViaPlatform: platform, matchedViaIdentifier: normalizedUrl };
  }
  return null;
}

function latestNumericMetric(payload: unknown, metricKeys: string[]): { value: number; observedAt: Date | null } | null {
  const candidates: Array<{ value: number; observedAt: Date | null; order: number }> = [];
  let order = 0;
  const seen = new Set<unknown>();
  function visit(node: unknown) {
    if (node == null || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const record = node as Record<string, unknown>;
    let observedAt: Date | null = null;
    for (const dateKey of ["date", "timestamp", "observedAt", "updatedAt"]) {
      const raw = record[dateKey];
      if (typeof raw === "string") {
        const date = new Date(raw);
        if (!Number.isNaN(date.getTime())) { observedAt = date; break; }
      }
    }
    for (const key of metricKeys) {
      const raw = record[key];
      const value = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
      if (Number.isFinite(value) && value >= 0) candidates.push({ value: Math.round(value), observedAt, order: order++ });
    }
    Object.values(record).forEach(visit);
  }
  visit(payload);
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const at = a.observedAt?.getTime() ?? 0;
    const bt = b.observedAt?.getTime() ?? 0;
    return bt - at || b.order - a.order;
  });
  return candidates[0];
}

async function fetchAudienceMetric(uuid: string, platform: "instagram" | "youtube" | "tiktok" | "soundcloud") {
  const payload = await soundchartsRequest(`/api/v2/artist/${encodeURIComponent(uuid)}/audience/${platform}`, { limit: "1", sort: "desc" });
  return latestNumericMetric(payload, ["followerCount"]);
}

async function fetchSpotifyListeners(uuid: string) {
  const payload = await soundchartsRequest(`/api/v2/artist/${encodeURIComponent(uuid)}/streaming/spotify/listening`, { limit: "1", sort: "desc" });
  return latestNumericMetric(payload, ["listeners", "listenerCount", "monthlyListeners", "monthly_listeners"]);
}

export async function fetchSoundchartsArtistMetrics(uuid: string): Promise<SoundchartsMetric[]> {
  if (!UUID_PATTERN.test(uuid)) throw new Error("Soundcharts Artist UUID inválido.");
  const requests = [
    ["instagram", "followers", fetchAudienceMetric(uuid, "instagram")],
    ["youtube", "subscribers", fetchAudienceMetric(uuid, "youtube")],
    ["tiktok", "followers", fetchAudienceMetric(uuid, "tiktok")],
    ["soundcloud", "followers", fetchAudienceMetric(uuid, "soundcloud")],
    ["spotify", "monthly_listeners", fetchSpotifyListeners(uuid)],
  ] as const;
  const settled = await Promise.allSettled(requests.map((entry) => entry[2]));
  const metrics: SoundchartsMetric[] = [];
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled" || !result.value) return;
    const [platform, metric] = requests[index];
    metrics.push({ platform, metric, value: result.value.value, observedAt: result.value.observedAt });
  });
  if (!metrics.length) {
    const firstError = settled.find((item) => item.status === "rejected");
    if (firstError?.status === "rejected") throw firstError.reason;
  }
  return metrics;
}

export async function getSoundchartsUsage() {
  return soundchartsRequest("/api/v2/team/usage");
}
