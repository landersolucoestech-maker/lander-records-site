import { requireAdmin } from "../../../../lib/auth";
import { getPageContent } from "../../../../lib/content";
import { getHomeSpotifyReleaseFeed, getLanderRecordsSocialMetrics } from "../../../../lib/integrations/sync";
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
  const [content, artists, posts, spotifyFeed, metrics] = await Promise.all([
    getPageContent("home"),
    getPublishedArtists(true),
    getPublishedPosts(true),
    getHomeSpotifyReleaseFeed().catch(() => ({ playlistUrl: "", releases: [] })),
    getLanderRecordsSocialMetrics().catch(() => ({} as Record<string, number>)),
  ]);

  if (!content) throw new Error("A Home ainda não está configurada no CMS.");
  const byKey = (key: string) => content.sections.find((section) => section.sectionKey === key);
  const hero = byKey("hero");
  const intro = byKey("intro");
  const shortcuts = byKey("shortcuts");
  const artistSection = byKey("artists");
  const releaseSection = byKey("releases");
  const advertiseSection = byKey("advertise_banner");
  const newsSection = byKey("news");
  const advertiseBanner = advertiseSection?.items[0];
  const releases = spotifyFeed.releases;
  const socialValue = (key: string) => typeof metrics[key] === "number" ? metrics[key].toLocaleString("pt-BR") : "—";
  const editSectionHref = (section: { id: string } | undefined) => section
    ? `/admin/pages/${content.page.id}?section=${encodeURIComponent(section.id)}`
    : `/admin/pages/${content.page.id}`;

  const sections: HomeManagerSection[] = [
    { key: "hero", title: hero?.title || "Hero / Banner principal", description: "Título, subtítulo, mídia de fundo e chamadas principais da abertura da Home.", classification: "editable", badge: "Editável", detail: hero ? "Conteúdo administrável" : "Seção não configurada", updatedAt: dateLabel(hero?.updatedAt), actionHref: editSectionHref(hero), actionLabel: "Editar", primaryText: hero?.title, secondaryText: hero?.subtitle || undefined },
    { key: "intro", title: intro?.title || "Sobre Nós", description: "Resumo institucional com conteúdo textual e acesso à página Sobre Nós.", classification: "editable", badge: "Editável", detail: intro ? "Conteúdo administrável" : "Seção não configurada", updatedAt: dateLabel(intro?.updatedAt), actionHref: editSectionHref(intro), actionLabel: "Editar", primaryText: intro?.title },
    { key: "social", title: "Redes Sociais (Instagram e YouTube)", description: "Métricas sociais exibidas dentro da apresentação institucional.", classification: "configurable", badge: "Automático / Configurável", detail: "Fonte: Soundcharts", actionHref: "/admin/settings/lander-records", actionLabel: "Configurar", itemLabels: [socialValue("instagram:followers"), socialValue("youtube:subscribers")] },
    { key: "shortcuts", title: shortcuts?.title || "Nossas Ações", description: "Atalhos editoriais com título e link de direcionamento.", classification: "editable", badge: "Editável", detail: shortcuts ? `${shortcuts.items.length} itens configurados` : "Seção não configurada", updatedAt: dateLabel(shortcuts?.updatedAt), actionHref: editSectionHref(shortcuts), actionLabel: "Editar", itemLabels: shortcuts?.items.map((item) => item.label || item.title).filter(Boolean) },
    { key: "artists", title: artistSection?.title || "Artistas em destaque", description: "Título e apoio são editáveis na Home; a seleção exibida vem do módulo Artistas.", classification: "configurable", badge: "CMS + Artistas", detail: `${artists.length} artistas publicados nesta posição`, updatedAt: dateLabel(artistSection?.updatedAt), actionHref: editSectionHref(artistSection), actionLabel: "Editar seção", secondaryActionHref: "/admin/artists", secondaryActionLabel: "Gerenciar artistas", imageUrls: artists.map((artist) => artist.cardImage).filter(Boolean) },
    { key: "releases", title: releaseSection?.title || "Últimos Lançamentos", description: "Título e apoio são editáveis na Home; os cards vêm automaticamente da playlist Spotify configurada.", classification: "configurable", badge: "CMS + Spotify", detail: `Fonte: Spotify · ${releases.length} itens disponíveis`, updatedAt: dateLabel(releases[0]?.fetchedAt || releaseSection?.updatedAt), actionHref: editSectionHref(releaseSection), actionLabel: "Editar seção", secondaryActionHref: "/admin/settings/lander-records", secondaryActionLabel: "Configurar fonte", imageUrls: releases.map((release) => release.coverUrl).filter((url): url is string => Boolean(url)) },
    { key: "advertising", title: "Anuncie com a Lander", description: "Banner comercial exibido entre Últimos Lançamentos e Últimas Notícias e gerenciado pela mídia da seção da Home.", classification: "editable", badge: "Editável", detail: advertiseBanner?.mediaUrl ? "Banner configurado no CMS" : "Banner sem mídia configurada", updatedAt: dateLabel(advertiseSection?.updatedAt), actionHref: editSectionHref(advertiseSection), actionLabel: "Editar", imageUrls: advertiseBanner?.mediaUrl ? [advertiseBanner.mediaUrl] : [] },
    { key: "news", title: newsSection?.title || "Últimas Notícias", description: "Título editorial é editável na Home; as matérias exibidas vêm do módulo Conteúdos.", classification: "configurable", badge: "CMS + Conteúdos", detail: `Fonte: Lander Records · ${posts.length} notícias em destaque`, updatedAt: dateLabel(newsSection?.updatedAt), actionHref: editSectionHref(newsSection), actionLabel: "Editar seção", secondaryActionHref: "/admin/posts", secondaryActionLabel: "Gerenciar conteúdos", imageUrls: posts.map((post) => post.coverImage).filter(Boolean) },
  ];

  return <HomeManagerView canEdit={session.source === "session" && session.user.role !== "viewer"} sections={sections} />;
}
