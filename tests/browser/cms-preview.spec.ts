import { expect, test, type Page } from "@playwright/test";

const modules = ["dashboard", "artists", "posts", "pages", "media", "releases", "categories", "tags", "navigation", "settings", "integrations", "users", "audit"];

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
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
