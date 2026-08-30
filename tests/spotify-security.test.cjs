const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  resolveSpotifyApiUrl,
  spotifyAdminRedirectUrl,
  spotifyApi,
  spotifyTokenRequest,
} = require("../lib/integrations/spotify.ts");

test("accepts only the known Spotify API endpoints and pagination parameters", () => {
  assert.equal(resolveSpotifyApiUrl("/me"), "https://api.spotify.com/v1/me");
  assert.equal(
    resolveSpotifyApiUrl("/playlists/abc123?fields=id,name,snapshot_id,owner(id)"),
    "https://api.spotify.com/v1/playlists/abc123?fields=id,name,snapshot_id,owner(id)",
  );
  assert.equal(
    resolveSpotifyApiUrl("https://api.spotify.com/v1/playlists/abc123/items?limit=50&offset=50&additional_types=track"),
    "https://api.spotify.com/v1/playlists/abc123/items?limit=50&offset=50&additional_types=track",
  );
});

test("rejects SSRF, credential-bearing URLs, downgrade and unknown endpoints", () => {
  const rejected = [
    "http://api.spotify.com/v1/me",
    "https://evil.example/collect",
    "https://api.spotify.com.evil.example/v1/me",
    "https://api.spotify.com@evil.example/v1/me",
    "//evil.example/collect",
    "https://api.spotify.com:444/v1/me",
    "https://api.spotify.com/v1/me#secret",
    "https://api.spotify.com/v1/search?q=secret",
    "https://api.spotify.com/v1/playlists/abc/items?limit=50&offset=0&additional_types=track&next=https://evil.example",
  ];
  for (const url of rejected) assert.throws(() => resolveSpotifyApiUrl(url), /não permitido/);
});

test("rejects a malicious next URL before fetch so the bearer token cannot leak", async () => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => { called = true; throw new Error("must not fetch"); };
  try {
    await assert.rejects(() => spotifyApi("super-secret-token", "https://attacker.example/next"), /não permitido/);
    assert.equal(called, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("Spotify API requests disable redirects and keep the token in the Authorization header", async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ id: "user" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    await spotifyApi("super-secret-token", "/me");
    assert.equal(request.url, "https://api.spotify.com/v1/me");
    assert.equal(request.init.redirect, "error");
    assert.equal(request.init.headers.Authorization, "Bearer super-secret-token");
    assert.equal(request.url.includes("super-secret-token"), false);
    assert.ok(request.init.signal instanceof AbortSignal);
  } finally {
    global.fetch = originalFetch;
  }
});

test("unexpected redirect responses are never followed", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async (_url, init) => {
    calls += 1;
    assert.equal(init.redirect, "error");
    return new Response(null, { status: 302, headers: { location: "https://attacker.example/steal" } });
  };
  try {
    await assert.rejects(() => spotifyApi("super-secret-token", "/me"), /Spotify respondeu 302/);
    assert.equal(calls, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("admin callback redirects use the configured canonical origin, never the request Host", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://landerrecords.com";
  try {
    assert.equal(
      spotifyAdminRedirectUrl("connected").toString(),
      "https://landerrecords.com/admin/settings/lander-records?spotify=connected",
    );
    assert.equal(spotifyAdminRedirectUrl("connected").hostname, "landerrecords.com");
    process.env.NEXT_PUBLIC_SITE_URL = "https://attacker.example@landerrecords.com";
    assert.throws(() => spotifyAdminRedirectUrl("error"), /origem canônica segura/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("callback enforces editor authorization and never derives redirects from request.url", () => {
  const source = fs.readFileSync(require.resolve("../app/api/integrations/spotify/callback/route.ts"), "utf8");
  assert.match(source, /requireAdmin\("editor"\)/);
  assert.doesNotMatch(source, /new URL\([^\n]*request\.url/);
  assert.match(source, /spotifyAdminRedirectUrl\(status\)/);
});

test("OAuth state remains bound to user, unexpired, and single use", () => {
  const source = fs.readFileSync(require.resolve("../lib/integrations/spotify.ts"), "utf8");
  assert.match(source, /eq\(spotifyOauthStates\.adminUserId, adminUserId\)/);
  assert.match(source, /gt\(spotifyOauthStates\.expiresAt, new Date\(\)\)/);
  assert.match(source, /delete\(spotifyOauthStates\)\.where\(eq\(spotifyOauthStates\.stateHash, hashState\(state\)\)\)/);
});

test("token exchange disables redirects, has a timeout, and sanitizes provider errors", async () => {
  const originalFetch = global.fetch;
  const previous = {
    id: process.env.SPOTIFY_CLIENT_ID,
    secret: process.env.SPOTIFY_CLIENT_SECRET,
    redirect: process.env.SPOTIFY_REDIRECT_URI,
  };
  process.env.SPOTIFY_CLIENT_ID = "client-id";
  process.env.SPOTIFY_CLIENT_SECRET = "client-secret";
  process.env.SPOTIFY_REDIRECT_URI = "https://landerrecords.com/api/integrations/spotify/callback";
  let request;
  global.fetch = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ error: "client-secret super-secret-token" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    await assert.rejects(
      () => spotifyTokenRequest(new URLSearchParams({ grant_type: "authorization_code", code: "code" })),
      (error) => error instanceof Error
        && /HTTP 400/.test(error.message)
        && !error.message.includes("client-secret")
        && !error.message.includes("super-secret-token"),
    );
    assert.equal(request.url, "https://accounts.spotify.com/api/token");
    assert.equal(request.init.redirect, "error");
    assert.ok(request.init.signal instanceof AbortSignal);
    assert.equal(request.url.includes("client-secret"), false);
    assert.match(request.init.headers.Authorization, /^Basic /);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries({
      SPOTIFY_CLIENT_ID: previous.id,
      SPOTIFY_CLIENT_SECRET: previous.secret,
      SPOTIFY_REDIRECT_URI: previous.redirect,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
