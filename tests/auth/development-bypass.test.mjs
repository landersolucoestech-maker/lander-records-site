import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import {
  classifyAdminAuthBoundary,
  getDevelopmentAdminSession,
  isDevelopmentAuthBypassAllowed,
  isDevelopmentAuthBypassEnabled,
  isLoopbackRequestHost,
  isPersistentAdminSession,
  selectAdminSessionForRequest,
  shouldBypassAdminAuthentication,
} from "../../lib/auth/development-bypass.ts";
import { proxy } from "../../proxy.ts";

async function withProcessAuthEnvironment(nodeEnv, bypass, callback) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousBypass = process.env.DEV_AUTH_BYPASS;
  process.env.NODE_ENV = nodeEnv;
  process.env.DEV_AUTH_BYPASS = bypass;
  try {
    return await callback();
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousBypass === undefined) delete process.env.DEV_AUTH_BYPASS;
    else process.env.DEV_AUTH_BYPASS = previousBypass;
  }
}

test("development auth bypass has an exact fail-closed environment contract", () => {
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "development", DEV_AUTH_BYPASS: "true" }), true);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "development", DEV_AUTH_BYPASS: "false" }), false);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "production", DEV_AUTH_BYPASS: "false" }), false);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "production", DEV_AUTH_BYPASS: "true" }), false);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "test", DEV_AUTH_BYPASS: "true" }), false);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "development", DEV_AUTH_BYPASS: "TRUE" }), false);
  assert.equal(isDevelopmentAuthBypassEnabled({ NODE_ENV: "development", DEV_AUTH_BYPASS: " true " }), false);
});

test("development bypass admits admin UI and API boundaries", () => {
  const environment = { NODE_ENV: "development", DEV_AUTH_BYPASS: "true" };
  for (const path of ["/admin", "/admin/artists", "/api/admin/status"]) {
    assert.equal(shouldBypassAdminAuthentication(path, environment, "127.0.0.1:8082"), true);
  }
});

test("development bypass rejects non-loopback and malformed request hosts", () => {
  const environment = { NODE_ENV: "development", DEV_AUTH_BYPASS: "true" };
  for (const host of ["localhost:8082", "127.0.0.1:8082", "[::1]:8082"]) {
    assert.equal(isLoopbackRequestHost(host), true);
    assert.equal(isDevelopmentAuthBypassAllowed(host, environment), true);
  }
  for (const host of [null, "", "192.168.1.25:8082", "example.com", "localhost.example.com", "not a host"]) {
    assert.equal(isLoopbackRequestHost(host), false);
    assert.equal(isDevelopmentAuthBypassAllowed(host, environment), false);
    assert.equal(shouldBypassAdminAuthentication("/admin", environment, host), false);
  }
});

test("disabled development bypass preserves normal authentication", () => {
  const environment = { NODE_ENV: "development", DEV_AUTH_BYPASS: "false" };
  assert.equal(shouldBypassAdminAuthentication("/admin", environment, "localhost"), false);
  assert.equal(shouldBypassAdminAuthentication("/api/admin/status", environment, "localhost"), false);
});

test("production remains fail-closed even when the bypass flag is true", () => {
  for (const bypass of ["false", "true"]) {
    const environment = { NODE_ENV: "production", DEV_AUTH_BYPASS: bypass };
    assert.equal(shouldBypassAdminAuthentication("/admin", environment, "localhost"), false);
    assert.equal(shouldBypassAdminAuthentication("/api/admin/status", environment, "localhost"), false);
  }
});

test("the real proxy adapter bypasses both admin boundaries only in enabled development", async () => {
  await withProcessAuthEnvironment("development", "true", () => {
    for (const path of ["/admin", "/api/admin/status"]) {
      const response = proxy(new NextRequest(`http://localhost${path}`));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
    }
  });
});

test("the real proxy adapter rejects a remote host even when development bypass is enabled", async () => {
  await withProcessAuthEnvironment("development", "true", () => {
    const page = proxy(new NextRequest("http://192.168.1.25:8082/admin"));
    const api = proxy(new NextRequest("http://192.168.1.25:8082/api/admin/status"));
    assert.equal(page.status, 307);
    assert.equal(api.status, 401);
  });
});

test("the real proxy adapter stays fail-closed in disabled development and production", async () => {
  for (const [nodeEnv, bypass] of [
    ["development", "false"],
    ["production", "false"],
    ["production", "true"],
  ]) {
    await withProcessAuthEnvironment(nodeEnv, bypass, () => {
      const page = proxy(new NextRequest("https://example.com/admin"));
      const api = proxy(new NextRequest("https://example.com/api/admin/status"));
      assert.equal(page.status, 307);
      assert.equal(new URL(page.headers.get("location")).pathname, "/admin/login");
      assert.equal(api.status, 401);
    });
  }
});

test("the server guard returns only an in-memory owner principal in bypass mode", async () => {
  assert.deepEqual(getDevelopmentAdminSession(), {
    source: "development-auth-bypass",
    sessionId: null,
    user: {
      id: null,
      email: "development@localhost",
      name: "Development Admin",
      role: "owner",
      mustChangePassword: false,
    },
  });
});

test("a synthetic development principal cannot become a persistent mutation principal", () => {
  assert.equal(isPersistentAdminSession(getDevelopmentAdminSession()), false);
  const realSession = {
    source: "session",
    sessionId: "real-session",
    user: { id: "real-user", email: "owner@example.com", name: "Owner", role: "owner", mustChangePassword: false },
  };
  assert.equal(isPersistentAdminSession(realSession), true);
});

test("a real session takes precedence so development bypass does not disable OAuth", () => {
  const realSession = { source: "session", sessionId: "real", user: { id: "real-user" } };
  assert.equal(
    selectAdminSessionForRequest(realSession, { NODE_ENV: "development", DEV_AUTH_BYPASS: "true" }, "localhost"),
    realSession,
  );
  assert.equal(
    selectAdminSessionForRequest(null, { NODE_ENV: "production", DEV_AUTH_BYPASS: "true" }, "localhost"),
    null,
  );
});

test("the development command binds the bypass-capable server to loopback", async () => {
  const packageJson = JSON.parse(await (await import("node:fs/promises")).readFile(new URL("../../package.json", import.meta.url), "utf8"));
  assert.match(packageJson.scripts.dev, /next dev --hostname 127\.0\.0\.1/);
});

test("admin boundaries are exact and leave auth screens and lookalikes public", () => {
  assert.equal(classifyAdminAuthBoundary("/admin"), "page");
  assert.equal(classifyAdminAuthBoundary("/api/admin/status"), "api");
  for (const path of ["/admin/login", "/admin/change-password", "/administrator", "/api/administration"]) {
    assert.equal(classifyAdminAuthBoundary(path), null);
  }
  assert.equal(classifyAdminAuthBoundary("/admin/login-evil"), "page");
  assert.equal(classifyAdminAuthBoundary("/admin/change-password-evil"), "page");
});
