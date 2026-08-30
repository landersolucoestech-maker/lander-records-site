import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/",
  "/artistas/",
  "/noticias/",
  "/contato/",
  "/sobre-nos/",
  "/politica-de-privacidade/",
  "/termos-e-condicoes/",
] as const;

const viewports = [
  { width: 320, height: 900 },
  { width: 375, height: 900 },
  { width: 430, height: 900 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 1000 },
] as const;

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    const url = new URL(response.url());
    const configuredOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8082").origin;
    if (url.origin === configuredOrigin && response.status() >= 400) {
      failures.push(`http ${response.status()}: ${url.pathname}`);
    }
  });
  return failures;
}

for (const viewport of viewports) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route} renders without runtime, asset or overflow failures`, async ({ page }) => {
        const failures = collectRuntimeFailures(page);
        const response = await page.goto(route, { waitUntil: "networkidle" });
        expect(response?.status()).toBe(200);
        await expect(page.locator("main#main-content")).toBeVisible();
        await expect(page.locator("main")).toHaveCount(1);
        await expect(page.locator("main header, main footer")).toHaveCount(0);
        await expect(page.locator("body > header.siteHeader")).toHaveCount(1);
        await expect(page.locator("body > footer.siteFooter")).toHaveCount(1);
        await page.waitForTimeout(1100);
        await expect(page.locator(".pageTransitionLoader")).not.toHaveClass(/isVisible/);

        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          brokenImages: [...document.images]
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src),
        }));

        expect(layout.scrollWidth, `horizontal overflow on ${route}`).toBeLessThanOrEqual(layout.clientWidth + 1);
        expect(layout.brokenImages).toEqual([]);
        expect(failures).toEqual([]);
      });
    }
  });
}

test("public detail routes and mobile navigation remain reachable", async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await page.setViewportSize({ width: 375, height: 900 });

  await page.goto("/artistas/", { waitUntil: "networkidle" });
  const artistHref = await page.locator("a.artistTile").first().getAttribute("href");
  expect(artistHref).toBeTruthy();
  await page.goto(artistHref!, { waitUntil: "networkidle" });
  await expect(page.locator(".artistProfileBody h2")).toBeVisible();

  await page.goto("/noticias/", { waitUntil: "networkidle" });
  const newsHref = await page.locator("a.newsCard").first().getAttribute("href");
  expect(newsHref).toBeTruthy();
  await page.goto(newsHref!, { waitUntil: "networkidle" });
  await expect(page.locator("main h1")).toBeVisible();

  await page.goto("/", { waitUntil: "networkidle" });
  const menuButton = page.locator(".mobileNav summary");
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await expect(page.locator(".mobileNav nav")).toBeVisible();
  }

  expect(failures).toEqual([]);
});

test("skip link is first, visible on focus and moves focus to main content", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();
  expect(await page.evaluate(() => window.location.hash)).toBe("#main-content");
});

test("mobile menu exposes state, closes with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const toggle = page.getByLabel("Abrir menu de navegação");
  const menu = page.locator("#mobile-navigation-menu");

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(menu).not.toBeVisible();
  await toggle.click();
  const closeToggle = page.getByLabel("Fechar menu de navegação");
  await expect(closeToggle).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(menu).not.toBeVisible();
});

test("artist navigation exposes a non-blocking streaming loading state", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.route(/\/artistas\/?\?.*_rsc=/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.locator('.desktopNav a[href="/artistas/"]').click();
  const loading = page.getByRole("status");
  await expect(loading).toContainText("Carregando artistas");
  await expect(page.locator(".pageTransitionLoader")).not.toHaveClass(/isVisible/, { timeout: 9000 });
  await expect(page.locator(".artistListingSection")).toBeVisible();
});

test("contact form retains native required and email validation", async ({ page }) => {
  await page.goto("/contato/", { waitUntil: "networkidle" });
  const form = page.locator("form");
  const name = form.getByLabel(/nome/i);
  const email = form.getByLabel(/e-mail/i);

  await form.getByRole("button", { name: /enviar/i }).click();
  await expect(name).toHaveJSProperty("validity.valid", false);

  await name.fill("Visitante");
  await email.fill("endereco-invalido");
  await form.getByRole("button", { name: /enviar/i }).click();
  await expect(email).toHaveJSProperty("validity.valid", false);
});

test("company tabs support keyboard navigation and linked panels", async ({ page }) => {
  await page.goto("/sobre-nos/", { waitUntil: "networkidle" });
  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");

  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const panelId = await tabs.nth(1).getAttribute("aria-controls");
  await expect(page.locator(`#${panelId}`)).toBeVisible();
});

test("server-rendered loader fails open when JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator(".lazyReveal")).toHaveCount(0);
  await expect(page.locator(".pageTransitionLoader")).not.toHaveClass(/isVisible/);
  await context.close();
});

test("reduced motion keeps reveal content immediately visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".lazyReveal:not(.lazyRevealVisible)")).toHaveCount(0);
  await expect(page.locator(".homeShortcutCircle").first()).toBeVisible();
});

test("reveal never hides content already inside the initial viewport", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hiddenInViewport = await page.locator(".lazyReveal:not(.lazyRevealVisible)").evaluateAll((elements) =>
    elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }).length,
  );
  expect(hiddenInViewport).toBe(0);
});

test("article sharing copies the canonical link without navigating", async ({ page }) => {
  await page.goto("/noticias/", { waitUntil: "networkidle" });
  const newsHref = await page.locator("a.newsCard").first().getAttribute("href");
  await page.goto(newsHref!, { waitUntil: "networkidle" });
  const currentUrl = page.url();

  await page.getByRole("button", { name: "Copiar link" }).click();
  await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible();
  expect(page.url()).toBe(currentUrl);
});

test("rendered artist embeds never use an untrusted iframe origin", async ({ page }) => {
  await page.goto("/artistas/", { waitUntil: "networkidle" });
  const artistLinks = await page.locator("a.artistTile").evaluateAll((links) =>
    [...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href")).filter(Boolean))],
  );

  for (const href of artistLinks.slice(0, 5)) {
    await page.goto(href!, { waitUntil: "networkidle" });
    for (const source of await page.locator("iframe").evaluateAll((frames) => frames.map((frame) => (frame as HTMLIFrameElement).src))) {
      expect(["www.youtube-nocookie.com", "open.spotify.com"]).toContain(new URL(source).hostname);
    }
  }
});

test("home content progressively reveals while scrolling", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  for (let y = 0; y < documentHeight; y += 700) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);

  const unrevealed = await page.locator(".lazyReveal:not(.lazyRevealVisible)").count();
  expect(unrevealed).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("home-1440-scrolled.png"), fullPage: true });
});

test("reveal remains healthy across navigation, back and forward", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.goto("/sobre-nos/", { waitUntil: "networkidle" });
  await page.goBack({ waitUntil: "networkidle" });
  await page.goForward({ waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);
  await expect(page.locator(".lazyReveal:not(.lazyRevealVisible)")).toHaveCount(0);
});
