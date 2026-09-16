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
  assert.ok(contractImport > dashboardImport, "Dashboard module contract must load after shared admin CSS");
  assert.ok(featureImport > contractImport, "Feature normalization must load after the shared Dashboard contract");
  assert.match(entry, /Final authority: every protected module resolves to the Dashboard design language/);
});

test("shared module tokens are derived from the real Dashboard, not an approximation", () => {
  assert.match(dashboard, /\.adminDashboard\s*\{[^}]*gap:\s*14px/);
  assert.match(dashboard, /\.adminDashboardHeading h1\s*\{[^}]*font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\)/);
  assert.match(dashboard, /\.adminDashboardHeading h1\s*\{[^}]*color:\s*#101114/);
  assert.match(dashboard, /\.adminDashboardHeading p\s*\{[^}]*color:\s*#52637a/);
  assert.match(dashboard, /border:\s*1px solid #e1e6eb/);
  assert.match(dashboard, /border-radius:\s*10px/);

  assert.match(contract, /--ui-page-gap:\s*14px/);
  assert.match(contract, /--ui-border:\s*#e1e6eb/);
  assert.match(contract, /--ui-radius-lg:\s*10px/);
  assert.match(contract, /--ui-text-strong:\s*#101114/);
  assert.match(contract, /--ui-control-md:\s*34px/);
  assert.match(contract, /font-family:\s*'Montserrat', Arial, sans-serif/);
  assert.match(contract, /font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\) !important/);
});

test("all protected tables, controls, filters and cards resolve through the Dashboard contract", () => {
  assert.match(contract, /table:not\(\.tableview-freeform\) th/);
  assert.match(contract, /table:not\(\.tableview-freeform\) td/);
  assert.match(contract, /\[class\*="_tableSurface__"\]/);
  assert.match(contract, /\[class\*="_catalogFrame__"\]/);
  assert.match(contract, /\[class\*="_selectionCard__"\]/);
  assert.match(contract, /\[class\*="_structureCard__"\]/);
  assert.match(contract, /\[class\*="_card__"\]/);
  assert.match(contract, /\[class\*="_toolbar__"\]/);
  assert.match(contract, /\[class\*="_tabs__"\]/);
  assert.match(contract, /\.adminTopbarPrimary/);
  assert.match(contract, /background:\s*#e30613 !important/);
  assert.match(contract, /min-height:\s*34px !important/);
});

test("Artists, Home, Header and Pages workbench cannot keep separate visual systems", () => {
  assert.match(featureOverrides, /\[data-testid="artist-manager"\]/);
  assert.match(featureOverrides, /\[data-testid="artist-manager"\][\s\S]*min-height:\s*72px !important/);
  assert.match(featureOverrides, /\[data-testid="artist-manager"\][\s\S]*width:\s*38px !important/);
  assert.match(featureOverrides, /\.homeManager \{/);
  assert.match(featureOverrides, /\.homeSectionCard \{/);
  assert.match(featureOverrides, /\[data-testid="header-manager"\]/);
  assert.match(featureOverrides, /\[data-testid="page-section-workbench"\]/);
  assert.match(featureOverrides, /\[class\*="_mediaCard__"\]/);
  assert.match(featureOverrides, /\[class\*="_previewPanel__"\]/);
  assert.match(featureOverrides, /border:\s*1px solid #e1e6eb !important/);
  assert.match(featureOverrides, /border-radius:\s*10px !important/);
  assert.match(featureOverrides, /font-size:\s*clamp\(22px,\s*1\.6vw,\s*26px\) !important/);
});

test("legacy Portal contract can provide geometry but no longer wins the final visual cascade", () => {
  assert.match(portalContract, /Portal Lander/);
  assert.ok(entry.indexOf("dashboard-module-contract.css") > entry.indexOf("dashboard.css"));
  assert.ok(entry.indexOf("dashboard-feature-overrides.css") > entry.indexOf("dashboard-module-contract.css"));
});
