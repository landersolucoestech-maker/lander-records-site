import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("production deployment remains manual and fail-closed during readiness", () => {
  const infrastructure = read("docs/PRODUCTION_INFRASTRUCTURE.md");
  const deployment = read("docs/DEPLOYMENT.md");
  const runbook = read("docs/DEPLOYMENT_RUNBOOK.md");

  assert.match(infrastructure, /NOT READY — deployment blocked/);
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
