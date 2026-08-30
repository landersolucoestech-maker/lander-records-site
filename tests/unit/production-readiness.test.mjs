import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("production deployment remains manual and fail-closed during readiness", () => {
  const workflow = read(".github/workflows/deploy-ionos.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /PRODUCTION_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow, /environment: Production/);
  assert.match(workflow, /Refuse deployment until the real server is inventoried/);
  assert.doesNotMatch(workflow, /ssh-action|db-0010-release\.mjs apply|systemctl restart/);
  assert.doesNotMatch(workflow, /StrictHostKeyChecking=no/);
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

test("readiness documentation keeps deployment and migration unauthorized", () => {
  for (const path of [
    "docs/PRODUCTION_INFRASTRUCTURE.md",
    "docs/ENVIRONMENT_CONTRACT.md",
    "docs/DEPLOYMENT_RUNBOOK.md",
    "docs/ROLLBACK_RUNBOOK.md",
  ]) {
    assert.ok(read(path).length > 500, `${path} must be substantive`);
  }
  assert.match(read("docs/PRODUCTION_INFRASTRUCTURE.md"), /NOT READY — deployment blocked/);
  assert.match(read("docs/DEPLOYMENT_RUNBOOK.md"), /Migration `0010` remains blocked/);
});

test("production smoke validates health payload and visitor admin protection", () => {
  const smoke = read("scripts/deploy/ionos-smoke.mjs");
  assert.match(smoke, /health\?\.database !== "ok"/);
  assert.match(smoke, /redirect: "manual"/);
  assert.match(smoke, /\[307, 401, 403\]/);
});
