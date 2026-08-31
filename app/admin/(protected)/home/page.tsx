import { requireAdmin } from "../../../../lib/auth";
import { getPageContent } from "../../../../lib/content";
import { getCachedSpotifyReleases, getLanderRecordsSocialMetrics } from "../../../../lib/integrations/sync";
import { getPublishedArtists } from "../../../../modules/artists";
import { getPublishedPosts } from "../../../../modules/posts";
import { HomeManagerView, type HomeManagerSection } from "../../components/HomeManagerView";

export const dynamic = "force-dynamic";

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default async function AdminHomePage() {
  const session = await requireAdmin();
  const [content, artists, posts, releases, metrics] = await Promise.all([
    getPageContent("home"),
    getPublishedArtists(true),
    getPublishedPosts(true),
    getCachedSpotifyReleases().catch(() => []),
    getLanderRecordsSocialMetrics().catch(() => ({} as Record<string, number>)),
  ]);

  if (!content) throw new Error("A Home ainda não está configurada no CMS.");
  const byKey = (key: string) => content.sections.find((section) => section.sectionKey === key);
  const hero = byKey("hero");
  const intro = byKey("intro");
  const shortcuts = byKey("shortcuts");
  const artistSection = byKey("artists");
  const releaseSection = byKey("releases");
  const newsSection = byKey("news");
  const socialValue = (key: string) => typeof metrics[key] === "number" ? metrics[key].toLocaleString("pt-BR") : "—";

  const sections: HomeManagerSection[] = [
    { key: "hero", title: hero?.title || "Hero / Banner principal", description: "Título, subtítulo e chamadas principais da abertura da Home.", classification: "editable", badge: "Editável", detail: hero ? "Conteúdo administrável" : "Seção não configurada", updatedAt: dateLabel(hero?.updatedAt), actionHref: `/admin/pages/${content.page.id}`, actionLabel: "Editar", primaryText: hero?.title, secondaryText: hero?.subtitle || undefined },
    { key: "intro", title: intro?.title || "Sobre Nós", description: "Resumo institucional com conteúdo textual e acesso à página Sobre Nós.", classification: "editable", badge: "Editável", detail: intro ? "Conteúdo administrável" : "Seção não configurada", updatedAt: dateLabel(intro?.updatedAt), actionHref: `/admin/pages/${content.page.id}`, actionLabel: "Editar", primaryText: intro?.title },
    { key: "social", title: "Redes Sociais (Instagram e YouTube)", description: "Métricas sociais exibidas dentro da apresentação institucional.", classification: "configurable", badge: "Automático / Configurável", detail: "Fonte: Soundcharts", actionHref: "/admin/settings/lander-records", actionLabel: "Configurar", itemLabels: [socialValue("instagram:followers"), socialValue("youtube:subscribers")] },
    { key: "shortcuts", title: shortcuts?.title || "Nossas Ações", description: "Atalhos editoriais com título e link de direcionamento.", classification: "editable", badge: "Editável", detail: shortcuts ? `${shortcuts.items.length} itens configurados` : "Seção não configurada", updatedAt: dateLabel(shortcuts?.updatedAt), actionHref: `/admin/pages/${content.page.id}`, actionLabel: "Editar", itemLabels: shortcuts?.items.map((item) => item.label || item.title).filter(Boolean) },
    { key: "artists", title: artistSection?.title || "Artistas em destaque", description: "Seleção editorial de artistas exibidos na página inicial.", classification: "editable", badge: "Editável", detail: `${artists.length} artistas publicados nesta posição`, updatedAt: dateLabel(artistSection?.updatedAt), actionHref: "/admin/artists", actionLabel: "Editar", imageUrls: artists.map((artist) => artist.cardImage).filter(Boolean) },
    { key: "releases", title: releaseSection?.title || "Últimos Lançamentos", description: "Lançamentos recentes carregados automaticamente do cache Spotify.", classification: "automatic", badge: "Automático", detail: `Fonte: Spotify · ${releases.length} itens disponíveis`, updatedAt: dateLabel(releases[0]?.fetchedAt), actionHref: "/admin/settings/lander-records", actionLabel: "Configurar", imageUrls: releases.map((release) => release.coverUrl).filter((url): url is string => Boolean(url)) },
    { key: "advertising", title: "Anuncie Aqui", description: "Banner promocional atualmente definido no frontend público.", classification: "structural", badge: "Estrutural", detail: "Edição requer evolução futura do modelo" },
    { key: "news", title: newsSection?.title || "Últimas Notícias", description: "Notícias internas selecionadas para destaque na Home.", classification: "configurable", badge: "Automático / Configurável", detail: `Fonte: Lander Records · ${posts.length} notícias em destaque`, updatedAt: dateLabel(newsSection?.updatedAt), actionHref: "/admin/posts", actionLabel: "Configurar", imageUrls: posts.map((post) => post.coverImage).filter(Boolean) },
  ];

  return <HomeManagerView canEdit={session.user.role !== "viewer"} sections={sections} />;
}
