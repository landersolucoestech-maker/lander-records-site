import { expect, test, type Page } from "@playwright/test";

const modules = ["dashboard", "home", "artists", "posts", "pages", "media", "releases", "categories", "tags", "navigation", "settings", "integrations", "users", "audit"];

function runtimeFailures(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("pageerror", (error) => failures.push(error.message));
  return failures;
}

test("real admin remains fail-closed while the local preview grants no session", async ({ page, request }) => {
  const admin = await request.get("/admin/", { maxRedirects: 0 });
  expect(admin.status()).toBe(307);
  expect(admin.headers().location).toBe("/admin/login?next=%2Fadmin%2F");
  const adminHome = await request.get("/admin/home/", { maxRedirects: 0 });
  expect(adminHome.status()).toBe(307);
  expect(adminHome.headers().location).toBe("/admin/login?next=%2Fadmin%2Fhome%2F");

  await page.goto("/cms-preview/", { waitUntil: "networkidle" });
  await expect(page.locator('[data-preview-only="true"]')).toBeVisible();
  await expect(page.getByText("PREVIEW LOCAL · SEM PERSISTÊNCIA")).toBeVisible();
  expect((await page.context().cookies()).some((cookie) => cookie.name === "lander_admin_session")).toBe(false);
});

test("all real CMS modules render from isolated preview fixtures", async ({ page }) => {
  const failures = runtimeFailures(page);
  for (const moduleKey of modules) {
    const response = await page.goto(`/cms-preview/${moduleKey}`, { waitUntil: "networkidle" });
    expect(response?.status(), moduleKey).toBe(200);
    await expect(page.locator("main.adminMain")).toBeVisible();
    await expect(page.locator("[data-preview-only='true']")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `overflow on ${moduleKey}`).toBeLessThanOrEqual(1);
  }
  expect(failures).toEqual([]);
});

test("preview simulates UI states without network mutations", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/cms-preview/artists", { waitUntil: "networkidle" });
  const state = page.getByLabel("Estado visual");
  await state.selectOption("empty");
  await expect(page.getByText("Nenhum item neste estado de demonstração.")).toBeVisible();
  await state.selectOption("loading");
  await expect(page.locator("[aria-busy='true']")).toBeVisible();
  await state.selectOption("error");
  await expect(page.locator(".adminAlert.error[role='alert']")).toContainText("Falha simulada");
  await state.selectOption("filled");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar visual" }).first()).toBeDisabled();
  expect(mutations).toEqual([]);
});

test("preview remains usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/cms-preview/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Olá, Administrador!" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

for (const width of [1440, 1280, 768, 430, 375]) {
  test(`approved dashboard shell remains responsive at ${width}px`, async ({ page }) => {
    const failures = runtimeFailures(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cms-preview/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByTestId("admin-shell")).toBeVisible();
    await expect(page.getByTestId("admin-topbar")).toContainText("Dashboard");
    await expect(page.getByTestId("dashboard-quick-actions").getByRole("link")).toHaveCount(5);
    await expect(page.getByTestId("editorial-pending")).toBeVisible();
    await expect(page.getByTestId("home-status")).toBeVisible();
    await expect(page.getByTestId("content-integrations")).toContainText("Spotify");
    await expect(page.getByTestId("content-integrations")).toContainText("Soundcharts");
    await expect(page.getByTestId("recent-activity")).toBeVisible();
    await expect(page.getByTestId("useful-links")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(failures).toEqual([]);
  });
}

test("mobile dashboard drawer exposes accessible state and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto("/cms-preview/dashboard", { waitUntil: "networkidle" });
  const toggle = page.getByRole("button", { name: "Abrir menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.closest("#admin-sidebar") !== null)).toBe(false);
  await toggle.click();
  await expect(page.getByRole("button", { name: "Fechar menu", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("admin-sidebar")).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
});

test("dashboard uses honest deferred states and valid editorial routes", async ({ page }) => {
  await page.goto("/cms-preview/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByText("Dados não consultados no preview")).toHaveCount(2);
  await expect(page.getByText("Status não consultado")).toHaveCount(2);
  await expect(page.getByText(/CPU|faturamento|receita|servidor/i)).toHaveCount(0);
  const hrefs = await page.getByTestId("dashboard-quick-actions").getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.every((href) => href?.startsWith("/cms-preview/"))).toBe(true);
});

test("Home manager mirrors the implemented public composition without unsupported controls", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/cms-preview/home", { waitUntil: "networkidle" });
  await expect(page.getByTestId("admin-topbar")).toContainText("Home / Visão geral");
  await expect(page.getByTestId("admin-sidebar").getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  const cards = page.getByTestId("home-section-card");
  await expect(cards).toHaveCount(8);
  expect(await cards.evaluateAll((items) => items.map((item) => item.getAttribute("data-section-key")))).toEqual(["hero", "intro", "social", "shortcuts", "artists", "releases", "advertising", "news"]);
  await expect(page.getByText(/Publicar alterações|Adicionar nova seção futura/i)).toHaveCount(0);
  await expect(page.locator("[draggable='true']")).toHaveCount(0);
  expect(mutations).toEqual([]);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "lander_admin_session")).toBe(false);
});

for (const width of [1440, 1280, 768, 430, 375]) {
  test(`Home manager remains responsive at ${width}px`, async ({ page }) => {
    const failures = runtimeFailures(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/cms-preview/home", { waitUntil: "networkidle" });
    await expect(page.getByTestId("home-manager")).toBeVisible();
    await expect(page.getByTestId("home-section-card")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect(failures).toEqual([]);
  });
}
