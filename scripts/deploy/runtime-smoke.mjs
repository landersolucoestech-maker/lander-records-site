const baseUrl = (process.env.SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const publicRoutes = [
  "/",
  "/artistas/",
  "/artistas/dj-stay/",
  "/noticias/",
  "/sobre-nos/",
  "/contato/",
  "/api/health/",
  "/politica-de-privacidade/",
  "/termos-e-condicoes/",
];

for (const route of publicRoutes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
  if (!response.ok) throw new Error(`${route} returned ${response.status}`);
  if (route === "/api/health/") {
    const health = await response.json();
    if (health?.status !== "ok" || health?.application !== "ok" || health?.database !== "ok") {
      throw new Error("/api/health returned an unhealthy payload");
    }
  }
  console.log(`${response.status} ${route}`);
}

const admin = await fetch(`${baseUrl}/admin/`, { redirect: "manual" });
if (![307, 401, 403].includes(admin.status)) {
  throw new Error(`/admin/ did not fail closed for a visitor (${admin.status})`);
}
console.log(`${admin.status} /admin/ (visitor fail-closed)`);
