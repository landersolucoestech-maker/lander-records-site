import assert from "node:assert/strict";
import test from "node:test";
import { trustedEmbedUrl, trustedExternalUrl } from "../../lib/media-embed.ts";

test("normalizes trusted YouTube URLs to the privacy-enhanced host", () => {
  assert.equal(trustedEmbedUrl("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(trustedEmbedUrl("YouTube", "https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
});

test("rejects malicious, insecure and malformed YouTube URLs", () => {
  assert.equal(trustedEmbedUrl("youtube", "https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ"), "");
  assert.equal(trustedEmbedUrl("youtube", "http://youtube.com/watch?v=dQw4w9WgXcQ"), "");
  assert.equal(trustedEmbedUrl("youtube", "javascript:alert(1)"), "");
});

test("allows only known HTTPS Spotify embed resources", () => {
  assert.equal(trustedEmbedUrl("spotify", "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"), "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT");
  assert.equal(trustedEmbedUrl("spotify", "https://evil.example/open.spotify.com/track/secret"), "");
  assert.equal(trustedEmbedUrl("spotify", "http://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"), "");
  assert.equal(trustedEmbedUrl("unknown", "https://example.com/embed"), "");
});

test("allows generic external media links only over credential-free HTTPS", () => {
  assert.equal(trustedExternalUrl("https://soundcloud.com/lander/demo"), "https://soundcloud.com/lander/demo");
  assert.equal(trustedExternalUrl("javascript:alert(1)"), "");
  assert.equal(trustedExternalUrl("http://example.com/media"), "");
  assert.equal(trustedExternalUrl("https://user:secret@example.com/media"), "");
});
