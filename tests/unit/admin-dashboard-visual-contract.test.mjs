import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const entry = read("app/admin/dashboard.css");
const dashboard = read("styles/admin/dashboard.css");
const contract = read("styles/admin/dashboard-module-contract.css");
const featureOverrides = read("styles/admin/dashboard-feature-overrides.css");
const portalContract = read("styles/admin/portal-lander-contract.css");

test("Dashboard contracts load after the shared protected-admin styles", () => {
  const dashboardImport = entry.indexOf('@import "../../styles/admin/dashboard.css"');
  const contractImport = entry.indexOf('@import "../../styles/admin/dashboard-module-contract.css"');
  const featureImport = entry.indexOf('@import "../../styles/admin/dashboard-feature-overrides.css"');
  assert.notEqual(dashboardImport, -1);
  assert.notEqual(contractImport, -1);
  assert.notEqual(featureImport, -1);
  assert.ok(contractImport > dashboardImport, "Dashboard module contract must load after legacy/shared admin CSS");
  assert.ok(featureImport > contractImport, "Feature normalization must load after the shared Dashboard contract");
  assert.match(entry, /Final authority: every protected module resolves to the Dashboard design language/);
});

test("shared module tokens match the real Dashboard surfaces and rhythm", () => {
  assert.match(dashboard, /\.adminDashboard\{display:grid;gap:18px\}/);
  assert.match(dashboard, /border:1px solid #e1e6eb/);
  assert.match(dashboard, /border-radius:10px/);
  assert.match(contract, /--ui-page-gap: 18px/);
  assert.match(contract, /--ui-border: #e1e6eb/);
  assert.match(contract, /--ui-radius-lg: 10px/);
  assert.match(contract, /--ui-text-strong: #202630/);
  assert.match(contract, /font-family: 'Montserrat', Arial, sans-serif/);
});

test("all protected tables, controls, filters and cards resolve through the Dashboard contract", () => {
  assert.match(contract, /table:not\(\.tableview-freeform\) th/);
  assert.match(contract, /table:not\(\.tableview-freeform\) td/);
  assert.match(contract, /\[class\*="_tableSurface__"\]/);
  assert.match(contract, /\[class\*="_selectionCard__"\]/);
  assert.match(contract, /\[class\*="_structureCard__"\]/);
  assert.match(contract, /\[class\*="_card__"\]/);
  assert.match(contract, /\[class\*="_toolbar__"\]/);
  assert.match(contract, /\[class\*="_tabs__"\]/);
  assert.match(contract, /\.adminTopbarPrimary/);
  assert.match(contract, /background: #e30613 !important/);
});

test("Home, Header and Pages workbench cannot keep separate visual systems", () => {
  assert.match(featureOverrides, /\.homeManager \{/);
  assert.match(featureOverrides, /\.homeSectionCard \{/);
  assert.match(featureOverrides, /\[data-testid="header-manager"\]/);
  assert.match(featureOverrides, /\[data-testid="page-section-workbench"\]/);
  assert.match(featureOverrides, /\[class\*="_mediaCard__"\]/);
  assert.match(featureOverrides, /\[class\*="_previewPanel__"\]/);
  assert.match(featureOverrides, /border: 1px solid #e1e6eb !important/);
  assert.match(featureOverrides, /border-radius: 10px !important/);
});

test("legacy Portal contract can provide geometry but no longer wins the final visual cascade", () => {
  assert.match(portalContract, /Portal Lander/);
  assert.ok(entry.indexOf("dashboard-module-contract.css") > entry.indexOf("dashboard.css"));
  assert.ok(entry.indexOf("dashboard-feature-overrides.css") > entry.indexOf("dashboard-module-contract.css"));
});
