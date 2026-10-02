import { expect, test, type Page } from "@playwright/test";

const modules = ["dashboard", "home", "artists", "posts", "pages", "media", "releases", "categories", "tags", "navigation", "header", "settings", "integrations", "users", "audit"] as const;
const representativeModules = ["dashboard", "home", "artists", "posts", "pages", "navigation", "header"] as const;
const expectDevelopmentAuthBypass = process.env.PLAYWRIGHT_EXPECT_DEV_AUTH_BYPASS === "true";

function runtimeFailures(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("pageerror", (error) => failures.push(error.message));
  return failures;
}

test("local admin honors explicit auth mode while preview grants no persistent session", async ({ page, request }) => {
  const authStatus = await request.get("/api/admin/status/", { maxRedirects: 0 });
  expect(authStatus.status()).toBe(expectDevelopmentAuthBypass ? 200 : 401);
  if (expectDevelopmentAuthBypass) {
    expect(await authStatus.json()).toMatchObject({ ok: true, principal: "development-auth-bypass", role: "owner" });
    expect((await request.get("/admin/", { maxRedirects: 0 })).status()).toBe(200);
  }
  const response = await page.goto("/cms-preview/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-preview-only="true"]')).toBeVisible();
  await expect(page.getByTestId("admin-shell")).toBeVisible();
  expect((await page.context().cookies()).some((cookie) => cookie.name === "lander_admin_session")).toBe(false);
});

test("every preview module renders through the current admin shell without runtime failures", async ({ page }) => {
  const failures = runtimeFailures(page);
  for (const moduleKey of modules) {
    const response = await page.goto(`/cms-preview/${moduleKey}`, { waitUntil: "networkidle" });
    expect(response?.status(), moduleKey).toBe(200);
    await expect(page.locator('[data-preview-only="true"]')).toBeVisible();
    await expect(page.getByTestId("admin-shell")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), moduleKey).toBeLessThanOrEqual(1);
  }
  expect(failures).toEqual([]);
});

test("preview interactions never issue persistent HTTP mutations", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/cms-preview/media", { waitUntil: "networkidle" });
  const state = page.getByLabel("Estado visual");
  await state.selectOption("empty");
  await expect(page.getByText("Nenhum item neste estado de demonstração.")).toBeVisible();
  await state.selectOption("loading");
  await expect(page.locator("[aria-busy='true']")).toBeVisible();
  await state.selectOption("error");
  await expect(page.locator("[role='alert']")).toBeVisible();
  await state.selectOption("filled");
  await expect(page.getByRole("table")).toBeVisible();
  expect(mutations).toEqual([]);
});

for (const width of [1440, 768, 375]) {
  test(`representative admin modules remain responsive at ${width}px`, async ({ page }) => {
    const failures = runtimeFailures(page);
    await page.setViewportSize({ width, height: 1000 });
    for (const moduleKey of representativeModules) {
      await page.goto(`/cms-preview/${moduleKey}`, { waitUntil: "networkidle" });
      await expect(page.getByTestId("admin-shell")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), moduleKey).toBeLessThanOrEqual(1);
    }
    expect(failures).toEqual([]);
  });
}

test("mobile admin drawer exposes state, closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto("/cms-preview/dashboard", { waitUntil: "networkidle" });
  const toggle = page.getByRole("button", { name: "Abrir menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(page.getByRole("button", { name: "Fechar menu", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("admin-sidebar")).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
});
