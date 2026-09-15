import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync("app/admin/components/DashboardView.tsx", "utf8");
const shell = fs.readFileSync("app/admin/components/AdminShell.tsx", "utf8");

test("dashboard keeps the approved analytics-first sections", () => {
  for (const heading of ["Visitantes", "Visualizações", "Taxa de engajamento", "Leads / Conversões", "Desempenho do site", "Dispositivos", "Atividades recentes"]) {
    assert.match(dashboard, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(dashboard, /Conteúdo &(?:amp;)? Publicações/);
});

test("dashboard does not reintroduce rejected legacy sections or mock analytics", () => {
  for (const rejected of ["Ações rápidas", "Pendências editoriais", "Status do conteúdo da Home", "Integrações de conteúdo", "Links úteis", "12.842", "38.421", "4,8%", ">284<"]) {
    assert.ok(!dashboard.includes(rejected), rejected);
  }
  assert.match(dashboard, /Analytics não conectado/);
});

test("public-site action lives in the topbar and not the sidebar footer", () => {
  const footer = shell.slice(shell.indexOf('<div className="adminSidebarFooter">'), shell.indexOf("</aside>"));
  assert.ok(!footer.includes("Ver site público"));
  assert.match(shell, /adminPublicLink/);
  assert.match(shell, /adminSidebarCollapse/);
});
