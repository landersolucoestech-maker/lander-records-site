import { writeFile } from "node:fs/promises";

const output = new URL("../app/data/spotify-releases.json", import.meta.url);
const required = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN", "SPOTIFY_PLAYLIST_ID"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.log(`[spotify] integração ainda não configurada; faltando: ${missing.join(", ")}. Mantendo fallback vazio.`);
  process.exit(0);
}

const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${basic}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
  }),
});

if (!tokenResponse.ok) {
  throw new Error(`[spotify] falha ao renovar token: ${tokenResponse.status} ${await tokenResponse.text()}`);
}

const { access_token: accessToken } = await tokenResponse.json();
const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
const endpoint = new URL(`https://api.spotify.com/v1/playlists/${playlistId}/items`);
endpoint.searchParams.set("limit", "50");
endpoint.searchParams.set("market", process.env.SPOTIFY_MARKET || "BR");
endpoint.searchParams.set("additional_types", "track");

const playlistResponse = await fetch(endpoint, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

if (!playlistResponse.ok) {
  throw new Error(`[spotify] falha ao ler playlist: ${playlistResponse.status} ${await playlistResponse.text()}`);
}

const payload = await playlistResponse.json();
const releases = (payload.items || [])
  .filter((item) => item?.track?.type === "track")
  .sort((a, b) => new Date(b.added_at || 0).getTime() - new Date(a.added_at || 0).getTime())
  .slice(0, 5)
  .map((item) => ({
    id: item.track.id,
    title: item.track.name,
    artists: (item.track.artists || []).map((artist) => artist.name).join(", "),
    album: item.track.album?.name || "",
    image: item.track.album?.images?.[0]?.url || "",
    spotifyUrl: item.track.external_urls?.spotify || "",
    addedAt: item.added_at || "",
  }));

await writeFile(output, `${JSON.stringify(releases, null, 2)}\n`, "utf8");
console.log(`[spotify] ${releases.length} lançamentos sincronizados da playlist ${playlistId}.`);
