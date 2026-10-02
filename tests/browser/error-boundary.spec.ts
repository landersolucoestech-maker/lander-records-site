import { expect, test } from "@playwright/test";

test("public boundary contains a local database outage without leaking details", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_ERROR_BASE_URL, "Requires the isolated local failure server.");
  const failingEntry = new URL("/artistas/", process.env.PLAYWRIGHT_ERROR_BASE_URL!);
  await page.goto(failingEntry.href, { waitUntil: "commit", timeout: 30000 });
  await expect(page.locator("section.publicRouteError[role='alert']")).toContainText("Algo deu errado.", { timeout: 30000 });
  await expect(page.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  expect(await page.locator("body").innerText()).not.toContain("lander_error_test");
  expect(await page.locator("body").innerText()).not.toContain("ECONNREFUSED");
});
