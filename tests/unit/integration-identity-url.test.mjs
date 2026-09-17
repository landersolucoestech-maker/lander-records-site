import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  normalizeExternalUrl,
  normalizePlatformUrl,
  platformFromUrl,
  spotifyArtistIdFromUrl,
  spotifyPlaylistIdFromUrl,
} from "../../lib/integrations/identity.ts";

const artistActions = fs.readFileSync(new URL("../../app/admin/artist-actions.ts", import.meta.url), "utf8");
const soundcharts = fs.readFileSync(new URL("../../lib/integrations/soundcharts.ts", import.meta.url), "utf8");

test("external identity normalization rejects executable, credentialed and ambiguous inputs", () => {
  assert.equal(normalizeExternalUrl("http://www.instagram.com/lander/?utm_source=test#bio"), "https://instagram.com/lander");
  for (const value of [
    "javascript:alert(1)",
    "https://user:secret@instagram.com/lander",
    "https://instagram.com/lander\\evil",
    "https://instagram.com/lander\u0007evil",
    "not a url",
  ]) {
    assert.throws(() => normalizeExternalUrl(value), /URL inválida/);
  }
});

test("declared artist platforms require their official hosts", () => {
  assert.equal(normalizePlatformUrl("instagram", "https://www.instagram.com/lander"), "https://instagram.com/lander");
  assert.equal(normalizePlatformUrl("spotify", "https://open.spotify.com/artist/123ABC"), "https://open.spotify.com/artist/123ABC");
  assert.equal(normalizePlatformUrl("youtube", "https://youtu.be/dQw4w9WgXcQ"), "https://youtu.be/dQw4w9WgXcQ");
  assert.throws(() => normalizePlatformUrl("instagram", "https://example.com/lander"), /não pertence à plataforma/);
  assert.throws(() => normalizePlatformUrl("spotify", "https://youtube.com/watch?v=dQw4w9WgXcQ"), /não pertence à plataforma/);
  assert.throws(() => normalizePlatformUrl("unknown", "https://example.com"), /não pertence à plataforma/);
});

test("platform detection and Spotify identifiers preserve canonical provider identity", () => {
  assert.equal(platformFromUrl("https://www.facebook.com/lander"), "facebook");
  assert.equal(platformFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "youtube");
  assert.equal(spotifyArtistIdFromUrl("https://open.spotify.com/artist/123ABC"), "123ABC");
  assert.equal(spotifyPlaylistIdFromUrl("https://open.spotify.com/playlist/ABC123"), "ABC123");
});

test("artist save path uses platform-owned URLs and validates embeds before persistence", () => {
  assert.match(artistActions, /normalizePlatformUrl\(item\.platform, item\.url\)/);
  assert.match(artistActions, /trustedEmbedUrl\("youtube", youtubeVideo\)/);
  assert.match(artistActions, /trustedEmbedUrl\("spotify", spotifyEmbed\)/);
  assert.ok(artistActions.indexOf("trustedEmbedUrl(\"youtube\", youtubeVideo)") < artistActions.indexOf("prepareArtistImage(formData"));
});

test("Soundcharts identity resolution fails closed when identifier ownership cannot be verified", () => {
  assert.match(soundcharts, /if \(error instanceof Error && error\.message\.includes\("respondeu 403"\)\) return false;/);
  assert.doesNotMatch(soundcharts, /respondeu 403"\)\) return true/);
  assert.match(soundcharts, /if \(verified\) return \{ uuid, matchedViaPlatform:/);
});
