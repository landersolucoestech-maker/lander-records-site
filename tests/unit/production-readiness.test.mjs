import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("production deployment remains manual and fail-closed during readiness", () => {
  const infrastructure = read("docs/PRODUCTION_INFRASTRUCTURE.md");
  const deployment = read("docs/DEPLOYMENT.md");
  const runbook = read("docs/DEPLOYMENT_RUNBOOK.md");

  assert.match(infrastructure, /REPOSITORY READY \/ ENVIRONMENT UNVERIFIED/);
  assert.match(infrastructure, /dev` não deve publicar automaticamente em produção/);
  assert.match(deployment, /Nenhum workflow deste repositório publica automaticamente em produção/);
  assert.match(runbook, /Qualquer operação que altere produção permanece bloqueada/);
  assert.match(runbook, /Nunca use `git pull` como mecanismo de produção/);
});

test("CI and runtime use the reproducible Node and npm contract", () => {
  const ci = read(".github/workflows/cms-ci.yml");
  const packageJson = JSON.parse(read("package.json"));
  assert.match(ci, /actions\/checkout@v5/);
  assert.match(ci, /actions\/setup-node@v5/);
  assert.match(ci, /node-version-file: \.nvmrc/);
  assert.match(ci, /run: npm ci/);
  assert.equal(read(".nvmrc").trim(), "24");
  assert.equal(packageJson.engines.node, ">=24 <25");
});

test("dev preview stays disposable, public for review, and isolated from production credentials", () => {
  const preview = read(".github/workflows/dev-preview.yml");
  assert.match(preview, /branches:\s*\n\s*- dev/);
  assert.match(preview, /lander_records_preview/);
  assert.match(preview, /DEV_PREVIEW_PUBLIC_ACCESS: "true"/);
  assert.match(preview, /PREVIEW_URL\/admin/);
  assert.match(preview, /group: lander-records-dev-preview-v3\s*$/m);
  assert.match(preview, /cancel-in-progress: true/);
  assert.match(preview, /preview-contact-ip-salt-not-for-production/);
  assert.ok(!preview.includes("${{ secrets."));
});


test("media kit image uploads stay isolated in disposable preview and use real storage for persistent sessions", () => {
  const actions = read("app/admin/(protected)/media-kit/actions.ts");
  const auth = read("app/admin/(protected)/media-kit/preview-auth.ts");
  assert.match(actions, /session\.source === "development-auth-bypass"/);
  assert.match(actions, /storageProvider = "preview_inline"/);
  assert.match(actions, /data:image\/webp;base64/);
  assert.match(actions, /uploadStoredMedia\(key, output\.data, "image\/webp"\)/);
  assert.match(actions, /createdBy: session\.user\.id/);
  assert.match(auth, /isDisposablePreviewAuthBypassEnabled/);
  assert.match(auth, /isDisposablePreviewRequestHost/);
  assert.doesNotMatch(read(".github/workflows/dev-preview.yml"), /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_URL/);
});

test("readiness documentation keeps deployment and migration independently controlled", () => {
  for (const path of [
    "docs/PRODUCTION_INFRASTRUCTURE.md",
    "docs/ENVIRONMENT_CONTRACT.md",
    "docs/DEPLOYMENT_RUNBOOK.md",
    "docs/ROLLBACK_RUNBOOK.md",
  ]) {
    assert.ok(read(path).length > 500, `${path} must be substantive`);
  }
  assert.match(read("docs/DEPLOYMENT_RUNBOOK.md"), /gate independente de banco/);
  assert.match(read("docs/DEPLOYMENT.md"), /PostgreSQL é o banco transacional/);
  assert.match(read("docs/DEPLOYMENT.md"), /Supabase não é o banco da aplicação/);
});

test("production smoke validates health payload and visitor admin protection", () => {
  const smoke = read("scripts/deploy/runtime-smoke.mjs");
  assert.match(smoke, /health\?\.database !== "ok"/);
  assert.match(smoke, /redirect: "manual"/);
  assert.match(smoke, /\[307, 401, 403\]/);
});


test("dev preview cannot publish before full regression, lint and typecheck gates",()=>{const preview=read(".github/workflows/dev-preview.yml");const tests=preview.indexOf("name: Full regression suite");const integration=preview.indexOf("name: Integration checks");const lint=preview.indexOf("name: Lint");const types=preview.indexOf("name: Typecheck");const browser=preview.indexOf("name: Browser and responsive regression tests");const tunnel=preview.indexOf("name: Open temporary preview tunnel");assert.ok(tests>0&&integration>tests&&lint>integration&&types>lint&&browser>types&&tunnel>browser);assert.match(preview,/name: Full regression suite\s*\n\s*run: npm test/);assert.match(preview,/name: Integration checks\s*\n\s*run: npm run test:integration/);assert.match(preview,/name: Lint\s*\n\s*run: npm run lint/);assert.match(preview,/name: Browser and responsive regression tests[\s\S]*npm run test:browser:ci/)});


test("owner bootstrap validates identity and never logs credentials",()=>{const bootstrap=read("scripts/bootstrap-admin.mjs");assert.match(bootstrap,/ADMIN_BOOTSTRAP_EMAIL must be a valid email address/);assert.match(bootstrap,/ADMIN_BOOTSTRAP_NAME must contain between 1 and 160 characters/);assert.match(bootstrap,/Password value was not printed/);assert.doesNotMatch(bootstrap,/console\.log\([^\n]*password\)/i)});


test("dev preview repeats migrations and validates the content contract before publication",()=>{const preview=read(".github/workflows/dev-preview.yml");assert.match(preview,/name: Verify preview migration repeatability[\s\S]*run: npm run db:migrate/);assert.match(preview,/name: Validate preview content contract[\s\S]*run: npm run validate:content/);const migrate=preview.indexOf("name: Verify preview migration repeatability");const content=preview.indexOf("name: Validate preview content contract");const tunnel=preview.indexOf("name: Open temporary preview tunnel");assert.ok(migrate>0&&content>migrate&&tunnel>content)});


test("CMS CI cancels superseded runs on the same ref",()=>{const ci=read(".github/workflows/cms-ci.yml");assert.match(ci,/concurrency:[\s\S]*group: cms-foundation-ci-/);assert.match(ci,/cancel-in-progress: true/);});