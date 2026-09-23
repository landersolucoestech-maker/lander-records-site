import type { PublicArtist } from "@/modules/artists/types";

export const mockArtistCategories = [
  { id: "mock-cat-djs", name: "DJs", slug: "djs", description: "DJs e performers eletrônicos do casting.", position: 1, active: true, showAsFilter: true },
  { id: "mock-cat-cantores", name: "Cantores", slug: "cantores", description: "Vozes e intérpretes do casting.", position: 2, active: true, showAsFilter: true },
  { id: "mock-cat-produtores", name: "Produtores", slug: "produtores", description: "Produtores musicais e criadores de repertório.", position: 3, active: true, showAsFilter: true },
  { id: "mock-cat-novos", name: "Novos talentos", slug: "novos-talentos", description: "Artistas em desenvolvimento e lançamento.", position: 4, active: true, showAsFilter: true },
] as const;

export const mockArtistRoles = [
  { id: "mock-role-dj", name: "DJ" },
  { id: "mock-role-cantor", name: "Cantor(a)" },
  { id: "mock-role-produtor", name: "Produtor(a)" },
  { id: "mock-role-songwriter", name: "Compositor(a)" },
] as const;

export const mockMusicGenres = [
  { id: "mock-genre-funk", name: "Funk" },
  { id: "mock-genre-house", name: "House" },
  { id: "mock-genre-pop", name: "Pop" },
  { id: "mock-genre-trap", name: "Trap" },
  { id: "mock-genre-rnb", name: "R&B" },
  { id: "mock-genre-electronic", name: "Eletrônica" },
] as const;

export const mockPublicationDestinations = [
  { id: "mock-destination-home", name: "Home · artistas em destaque", description: "Vitrine principal de artistas da página inicial." },
  { id: "mock-destination-index", name: "Catálogo público de artistas", description: "Listagem completa em /artistas." },
] as const;

function artist(input: Partial<PublicArtist> & Pick<PublicArtist, "id" | "name" | "slug">): PublicArtist {
  return {
    eyebrow: "LANDER RECORDS",
    shortBio: "",
    biography: "",
    cardImage: "/dj-stay-home-card.webp",
    heroImage: "/dj-stay-wide.webp",
    ogImage: "/dj-stay-wide.webp",
    seoTitle: input.name,
    seoDescription: input.shortBio || "",
    canonicalUrl: `https://landerrecords.com/artistas/${input.slug}`,
    roles: [],
    genres: [],
    metrics: {},
    profile: { isActive: true, pageLink: `/artistas/${input.slug}`, hireTitle: "Contrate", hireText: "Consulte agenda, formatos e possibilidades comerciais.", hireButtonLabel: "Quero contratar" },
    publicationDestinations: ["home_artists", "artists_index"],
    categories: [],
    links: [],
    embeds: [],
    ...input,
  };
}

export const mockArtists: PublicArtist[] = [
  artist({
    id: "mock-artist-dj-stay", name: "DJ Stay", slug: "dj-stay", eyebrow: "DJ · PRODUTOR · FUNK",
    shortBio: "DJ e produtor que combina funk, bass e identidade visual marcante em shows de alta energia.",
    biography: "DJ Stay transforma referências do funk brasileiro, bass music e cultura de pista em apresentações de impacto.\n\nSeu trabalho une produção autoral, direção criativa e leitura de público, com repertório pensado para festivais, clubes e ativações de marca.",
    roles: ["DJ", "Produtor(a)"], genres: ["Funk", "Eletrônica"], metrics: { instagram: 128400, spotify: 486000, youtube: 242000, tiktok: 318000, soundcloud: 28400 },
    categories: [{ id: "mock-cat-djs", name: "DJs", slug: "djs", isPrimary: true }, { id: "mock-cat-produtores", name: "Produtores", slug: "produtores", isPrimary: false }],
    links: [
      { id: "mock-link-stay-instagram", kind: "social", platform: "instagram", label: "Instagram", url: "https://instagram.com/landerrecords" },
      { id: "mock-link-stay-spotify", kind: "streaming", platform: "spotify", label: "Spotify", url: "https://open.spotify.com/" },
      { id: "mock-link-stay-youtube", kind: "video", platform: "youtube", label: "YouTube", url: "https://youtube.com/@landerrecords" },
    ],
    embeds: [
      { id: "mock-embed-stay-youtube", type: "youtube", title: "DJ Stay · Live Session", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", featured: true },
      { id: "mock-embed-stay-spotify", type: "spotify", title: "DJ Stay no Spotify", url: "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF", featured: true },
    ],
  }),
  artist({
    id: "mock-artist-luna", name: "Luna Prado", slug: "luna-prado", eyebrow: "POP · R&B",
    shortBio: "Cantora e compositora de pop contemporâneo com influência de R&B e estética sofisticada.",
    biography: "Luna Prado constrói canções sobre relações, autonomia e amadurecimento. Sua interpretação intimista ganha força em refrões amplos e produção contemporânea.\n\nEm 2026, a artista prepara uma sequência de singles e uma série audiovisual ao vivo.",
    roles: ["Cantor(a)", "Compositor(a)"], genres: ["Pop", "R&B"], metrics: { instagram: 96400, spotify: 372000, youtube: 118000, tiktok: 204000 },
    categories: [{ id: "mock-cat-cantores", name: "Cantores", slug: "cantores", isPrimary: true }],
    cardImage: "/dj-stay-home-card.webp", heroImage: "/lander-records-anuncie-banner.webp",
  }),
  artist({
    id: "mock-artist-caio", name: "Caio Nox", slug: "caio-nox", eyebrow: "TRAP · PRODUTOR",
    shortBio: "Artista e produtor que cruza trap, eletrônico e texturas cinematográficas.",
    biography: "Caio Nox desenvolve uma sonoridade urbana e atmosférica, combinando beats densos, versos diretos e design sonoro cinematográfico.\n\nSeu repertório funciona tanto em palco quanto em projetos de colaboração e trilha.",
    roles: ["Cantor(a)", "Produtor(a)"], genres: ["Trap", "Eletrônica"], metrics: { instagram: 71400, spotify: 258000, youtube: 94000, tiktok: 142000 },
    categories: [{ id: "mock-cat-produtores", name: "Produtores", slug: "produtores", isPrimary: false }, { id: "mock-cat-cantores", name: "Cantores", slug: "cantores", isPrimary: true }],
    cardImage: "/dj-stay-wide.webp", heroImage: "/dj-stay-wide.webp",
  }),
  artist({
    id: "mock-artist-maya", name: "Maya Luz", slug: "maya-luz", eyebrow: "POP · NOVA MPB",
    shortBio: "Voz brasileira contemporânea com repertório autoral e direção estética solar.",
    biography: "Maya Luz aproxima pop, nova MPB e ritmos brasileiros em um repertório de melodias abertas e letras confessionais.\n\nA artista integra o núcleo de desenvolvimento da Lander Records com foco em construção de público e performance ao vivo.",
    roles: ["Cantor(a)", "Compositor(a)"], genres: ["Pop"], metrics: { instagram: 58200, spotify: 186000, youtube: 62000, tiktok: 108000 },
    categories: [{ id: "mock-cat-novos", name: "Novos talentos", slug: "novos-talentos", isPrimary: true }, { id: "mock-cat-cantores", name: "Cantores", slug: "cantores", isPrimary: false }],
    cardImage: "/lander-records-anuncie-banner.webp", heroImage: "/lander-records-anuncie-banner.webp",
  }),
  artist({
    id: "mock-artist-enzo", name: "Enzo Vale", slug: "enzo-vale", eyebrow: "HOUSE · DJ",
    shortBio: "DJ de house melódico com sets progressivos e repertório autoral voltado para clubes e festivais.",
    biography: "Enzo Vale conduz a pista com construções longas, linhas melódicas e drops precisos.\n\nSeu projeto foi desenhado para clubes, sunsets e grandes palcos com identidade visual integrada.",
    roles: ["DJ", "Produtor(a)"], genres: ["House", "Eletrônica"], metrics: { instagram: 44800, spotify: 132000, youtube: 38000, tiktok: 51000 },
    categories: [{ id: "mock-cat-djs", name: "DJs", slug: "djs", isPrimary: true }],
  }),
  artist({
    id: "mock-artist-nina", name: "Nina Prado", slug: "nina-prado", eyebrow: "R&B · POP",
    shortBio: "Cantora de R&B e pop alternativo, com foco em performance vocal e repertório autoral.",
    biography: "Nina Prado explora arranjos minimalistas, grooves orgânicos e harmonias vocais.\n\nA nova fase do projeto combina lançamentos frequentes, conteúdo acústico e colaboração com produtores da casa.",
    roles: ["Cantor(a)", "Compositor(a)"], genres: ["R&B", "Pop"], metrics: { instagram: 39700, spotify: 117000, youtube: 31000, tiktok: 69000 },
    categories: [{ id: "mock-cat-novos", name: "Novos talentos", slug: "novos-talentos", isPrimary: true }],
  }),
  artist({
    id: "mock-artist-theo", name: "Theo Martins", slug: "theo-martins", eyebrow: "PRODUTOR · POP",
    shortBio: "Produtor musical e compositor dedicado a repertório pop, eletrônico e projetos de colaboração.",
    biography: "Theo Martins atua em produção, composição e direção de sessões, conectando artistas a uma abordagem objetiva de repertório e identidade.\n\nSeu trabalho prioriza gravações eficientes e acabamento competitivo para streaming.",
    roles: ["Produtor(a)", "Compositor(a)"], genres: ["Pop", "Eletrônica"], metrics: { instagram: 28400, spotify: 94000, youtube: 19000 },
    categories: [{ id: "mock-cat-produtores", name: "Produtores", slug: "produtores", isPrimary: true }],
  }),
  artist({
    id: "mock-artist-ayla", name: "Ayla Reis", slug: "ayla-reis", eyebrow: "TRAP · R&B",
    shortBio: "Nova voz que combina R&B, trap e narrativa urbana em faixas de forte identidade.",
    biography: "Ayla Reis transforma vivências cotidianas em letras diretas, melodias sutis e beats contemporâneos.\n\nO projeto está em fase de expansão de catálogo com três lançamentos planejados para o segundo semestre.",
    roles: ["Cantor(a)", "Compositor(a)"], genres: ["Trap", "R&B"], metrics: { instagram: 24600, spotify: 74000, youtube: 16000, tiktok: 88000 },
    categories: [{ id: "mock-cat-novos", name: "Novos talentos", slug: "novos-talentos", isPrimary: true }],
  }),
];

export const mockArtistEditorOptions = {
  media: [
    { id: "mock-media-dj-stay-card", name: "dj-stay-home-card.webp", url: "/dj-stay-home-card.webp" },
    { id: "mock-media-dj-stay-wide", name: "dj-stay-wide.webp", url: "/dj-stay-wide.webp" },
    { id: "mock-media-banner", name: "lander-records-anuncie-banner.webp", url: "/lander-records-anuncie-banner.webp" },
    { id: "mock-media-logo", name: "lander-records-logo.webp", url: "/lander-records-logo.webp" },
  ],
  categories: mockArtistCategories.map(({ id, name }) => ({ id, name })),
  roles: mockArtistRoles,
  genres: mockMusicGenres,
  destinations: mockPublicationDestinations,
};

export function mockArtistEditor(id: string) {
  const source = mockArtists.find((item) => item.id === id);
  if (!source) return null;
  const categoryIds = source.categories.map((item) => item.id);
  const roleIds = source.roles.map((name) => mockArtistRoles.find((item) => item.name === name)?.id).filter(Boolean) as string[];
  const genreIds = source.genres.map((name) => mockMusicGenres.find((item) => item.name === name)?.id).filter(Boolean) as string[];
  return {
    id: source.id, name: source.name, slug: source.slug, status: "published" as const,
    shortBio: source.shortBio, biography: source.biography,
    cardMediaId: "mock-media-dj-stay-card", heroMediaId: "mock-media-dj-stay-wide", ogMediaId: "mock-media-dj-stay-wide",
    cardImage: source.cardImage, heroImage: source.heroImage,
    categoryIds, roleIds, genreIds, destinationIds: mockPublicationDestinations.map((item) => item.id),
    metrics: source.metrics,
    links: Object.fromEntries(source.links.map((item) => [item.platform, item.url])),
    hireTitle: source.profile.hireTitle, hireText: source.profile.hireText, hireButtonLabel: source.profile.hireButtonLabel,
    youtubeVideo: source.embeds.find((item) => item.type === "youtube")?.url || "",
    spotifyEmbed: source.embeds.find((item) => item.type === "spotify")?.url || "",
    homePosition: mockArtists.findIndex((item) => item.id === source.id) + 1,
    listPosition: mockArtists.findIndex((item) => item.id === source.id) + 1,
    seoTitle: source.seoTitle || source.name, seoDescription: source.seoDescription || source.shortBio, canonicalUrl: source.canonicalUrl,
  };
}

export const mockArtistSummaries = mockArtists.map((item, index) => ({
  id: item.id, name: item.name, slug: item.slug, status: index === 6 ? "draft" as const : "published" as const,
  cardImage: item.cardImage, genres: item.genres, roles: item.roles,
  views: 18400 + (mockArtists.length - index) * 13750,
  audience: Object.values(item.metrics).reduce((sum, value) => sum + value, 0),
  homePosition: index < 5 ? index + 1 : undefined,
  isPubliclyVisible: index !== 6,
  shortBio: item.shortBio, biography: item.biography,
  updatedAt: new Date(Date.UTC(2026, 8, 20 - index, 14, 30)).toISOString(),
}));
