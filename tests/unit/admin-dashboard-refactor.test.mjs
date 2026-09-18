import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync("app/admin/components/DashboardView.tsx", "utf8");
const dashboardPage = fs.readFileSync("app/admin/(protected)/page.tsx", "utf8");
const shell = fs.readFileSync("app/admin/components/AdminShell.tsx", "utf8");
const protectedLayout = fs.readFileSync("app/admin/(protected)/layout.tsx", "utf8");

test("dashboard keeps the approved analytics-first sections", () => {
  for (const heading of ["Visitantes", "Visualizações", "Taxa de engajamento", "Leads / Conversões", "Desempenho do site", "Dispositivos", "Atividades recentes"]) {
    assert.match(dashboard, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(dashboard, /Conteúdo &(?:amp;)? Publicações/);
});

test("dashboard reproduces the approved reference only in disposable development preview", () => {
  for (const rejected of ["Ações rápidas", "Pendências editoriais", "Status do conteúdo da Home", "Integrações de conteúdo", "Links úteis"]) {
    assert.ok(!dashboard.includes(rejected), rejected);
  }
  for (const referenceValue of ["12842", "38421", "4.8", "284", "54.2", "38.7", "7.1"]) {
    assert.ok(dashboard.includes(referenceValue), referenceValue);
  }
  assert.match(dashboard, /const dashboardData = demoMode \? referenceDashboard : data/);
  assert.match(dashboardPage, /analytics: null/);
  assert.match(dashboardPage, /demoMode=\{session\.source === "development-auth-bypass"\}/);
  assert.match(dashboard, /Analytics não conectado/);
  assert.doesNotMatch(dashboard, /desempenho do seu site em tempo real/);
  assert.match(dashboard, /Métricas de audiência aparecem quando uma fonte de analytics do site estiver conectada/);
});

test("dashboard translates current audit producers instead of exposing raw action keys", () => {
  for (const action of [
    "artist.created",
    "artist.updated",
    "artist.deleted",
    "post.created",
    "post.updated",
    "post.deleted",
    "media.uploaded",
    "media.archived",
    "auth.login_success",
    "auth.login_failed",
    "integration.sync.requested",
    "navigation.created",
    "navigation.updated",
  ]) {
    assert.ok(dashboardPage.includes(`"${action}"`), `missing activity label for ${action}`);
  }
});

test("approved dashboard uses line chart, contextual activities, thumbnails and overflow actions", () => {
  assert.match(dashboard, /adminChartVisitorsLine/);
  assert.match(dashboard, /adminChartViewsLine/);
  assert.match(dashboard, /adminActivityIcon/);
  assert.match(dashboard, /adminPublicationTitle/);
  assert.match(dashboard, /name="more"/);
});

test("admin shell keeps canonical navigation and account chrome without fake capabilities or preview-only noise", () => {
  const footer = shell.slice(shell.indexOf('<div className="adminSidebarFooter">'), shell.indexOf("</aside>"));
  assert.ok(!footer.includes("Ver site público"));
  assert.match(shell, /adminAdministrationLabel/);
  assert.match(shell, /adminNavigationEyebrow/);
  assert.match(shell, /adminSidebarCollapse/);
  assert.match(shell, /showContentHeaderTools/);
  assert.match(shell, /adminNotificationButton/);
  assert.match(shell, /adminNotificationBadge/);
  assert.match(shell, /adminNotificationList/);
  assert.match(shell, /notificationLabel/);
  assert.match(shell, /name="bell"/);
  assert.match(protectedLayout, /auditLogs/);
  assert.match(protectedLayout, /inArray\(auditLogs\.entityType, \["artist", "post", "media_asset"\]\)/);
  assert.doesNotMatch(protectedLayout, /"admin_user"|"site_settings"/);
  assert.match(shell, /adminAccountPopover/);
  assert.match(shell, /const showReadOnlyChrome = preview/);
  assert.match(shell, /const canEdit = !readOnly && role !== "viewer"/);
  assert.match(shell, /developmentPreview \? "Administrador"/);
});