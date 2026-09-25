import { randomInt } from "node:crypto";
import { expect, test } from "@playwright/test";

// Writes a real contact submission. Opt-in so it never runs against a shared or production target.
test.skip(process.env.E2E_CONTACT_SUBMIT !== "1", "set E2E_CONTACT_SUBMIT=1 against a disposable database to run");

// Direct-to-server runs have no proxy, so X-Real-IP is what the rate limiter keys on; a per-run address keeps
// repeated verification runs from tripping the 5-per-10-minutes limit.
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-real-ip": `198.51.100.${randomInt(1, 254)}` });
});

test("a valid contact submission is confirmed to the visitor and the form resets", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/contato/");
  const form = page.locator("form.contactForm");
  await form.locator('input[name="name"]').fill("Teste Automatizado");
  await form.locator('input[name="email"]').fill(`e2e-${Date.now()}@example.com`);
  await form.locator('select[name="topicSlug"]').selectOption({ index: 1 });
  await form.locator('textarea[name="message"]').fill("Mensagem de validação automatizada do formulário de contato.");
  await form.locator('input[name="consent"]').check();

  const contactResponses: number[] = [];
  page.on("response", (candidate) => { if (candidate.url().includes("/api/contact")) contactResponses.push(candidate.status()); });
  const response = page.waitForResponse((candidate) => candidate.url().includes("/api/contact") && candidate.request().method() === "POST");
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  expect((await response).status()).toBe(201);
  expect(contactResponses, "the form must post to the served trailing-slash route without a 308 hop").toEqual([201]);

  await expect(form.getByRole("status")).toHaveText("Mensagem enviada com sucesso. Nossa equipe recebeu seu contato.");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await expect(form.locator('input[name="name"]')).toHaveValue("");
  expect(pageErrors).toEqual([]);
});

test("a server rejection is shown as a readable message, not a parser error", async ({ page }) => {
  await page.route(/\/api\/contact\/?$/, (route) => route.fulfill({ status: 502, contentType: "text/html", body: "<html>Bad gateway</html>" }));
  await page.goto("/contato/");
  const form = page.locator("form.contactForm");
  await form.locator('input[name="name"]').fill("Teste Automatizado");
  await form.locator('input[name="email"]').fill("e2e@example.com");
  await form.locator('select[name="topicSlug"]').selectOption({ index: 1 });
  await form.locator('textarea[name="message"]').fill("Mensagem de validação automatizada do formulário de contato.");
  await form.locator('input[name="consent"]').check();
  await form.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(form.getByRole("alert")).toHaveText("Não foi possível enviar a mensagem. Tente novamente em instantes.");
});
