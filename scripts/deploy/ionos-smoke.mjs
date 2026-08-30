const baseUrl = (process.env.SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const routes = [
  "/",
  "/artistas/",
  "/artistas/dj-stay/",
  "/noticias/",
  "/sobre-nos/",
  "/contato/",
  "/admin/",
  "/api/health",
  "/politica-de-privacidade/",
  "/termos-e-condicoes/",
];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  if (!response.ok) throw new Error(`${route} returned ${response.status}`);
  console.log(`${response.status} ${route}`);
}
